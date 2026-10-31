const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
/** An array whose first item is an object with a name: a set of named items. */
const isNamedArray = (value) => Array.isArray(value) && value.length > 0 && isObject(value[0]) && 'name' in value[0];
function combineNames(target, source, operation) {
    const inSource = new Set(source);
    const inTarget = new Set(target);
    switch (operation) {
        case 'union': return [...target, ...source.filter(name => !inTarget.has(name))];
        case 'intersection': return target.filter(name => inSource.has(name));
        case 'subtraction': return target.filter(name => !inSource.has(name));
        case 'xor': return [...target.filter(name => !inSource.has(name)), ...source.filter(name => !inTarget.has(name))];
    }
}
/** Entries of a container by key, or by item name for named arrays; items without a name don't take part. */
function entries(container) {
    if (!Array.isArray(container))
        return new Map(Object.entries(container));
    const map = new Map();
    for (const item of container)
        if (isObject(item) && item.name !== undefined && !map.has(String(item.name)))
            map.set(String(item.name), item);
    return map;
}
/** Combines two JSON values level by level; both must be objects or arrays. */
export function combineJson(target, source, operation) {
    if (!isObject(target) && !Array.isArray(target))
        throw new Error(`Unsupported target value: ${JSON.stringify(target)}`);
    if (!isObject(source) && !Array.isArray(source))
        throw new Error(`Unsupported source value: ${JSON.stringify(source)}`);
    const targetEntries = entries(target);
    const sourceEntries = entries(source);
    const names = combineNames([...targetEntries.keys()], [...sourceEntries.keys()], operation);
    const values = names.map(name => {
        const targetValue = targetEntries.get(name);
        const sourceValue = sourceEntries.get(name);
        if (targetValue === undefined)
            return [name, sourceValue];
        if (sourceValue === undefined)
            return [name, targetValue];
        const nested = (isObject(targetValue) && isObject(sourceValue)) || (isNamedArray(targetValue) && isNamedArray(sourceValue));
        return [name, nested ? combineJson(targetValue, sourceValue, operation) : targetValue];
    });
    return Array.isArray(target) ? values.map(([, value]) => value) : Object.fromEntries(values);
}
/** The JSON form of a model, whichever form it was given in. */
const toJson = (model) => JSON.parse(JSON.stringify(model));
const isContainer = (value) => isObject(value) || Array.isArray(value);
/**
 * Combines two models in JSON form. Below the top level as combineJson() does; at the top level, parts of the model
 * both have (fields, constraints, the keys of a bridge…) are combined one level down whatever the operation, so that
 * subtraction gives the fields of the first model that the second doesn't have, as model operations should, rather
 * than no fields at all. The metadata is the first model's.
 */
export function combineModels(a, b, operation) {
    const result = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const [left, right] = [a[key], b[key]];
        if (key === 'metadata') {
            if (left !== undefined)
                result.metadata = left;
        }
        else if (left !== undefined && right !== undefined && isContainer(left) && isObject(left) === isObject(right) && isContainer(right)) {
            result[key] = combineJson(left, right, operation);
        }
        else if (combineNames(left !== undefined ? [key] : [], right !== undefined ? [key] : [], operation).length > 0) {
            result[key] = left !== undefined ? left : right;
        }
    }
    return result;
}
function operate(a, b, operation) {
    const result = combineModels(toJson(a), toJson(b), operation);
    // A model of a class gives a model of the same class, also from another copy of model-algebra-common
    const fromJSON = a.constructor.fromJSON;
    return (a.constructor !== Object && typeof fromJSON === 'function' ? fromJSON(result) : result);
}
/*
 * Operations on models, given as Model instances or in JSON form; the result has the form of the first model.
 * Fields are items of the fields set: a field both models have is combined key by key in a union and an
 * intersection, and taken out whole by a subtraction or an xor.
 */
/** Fields and keys of both models; where both have one, the first model's values win. A Model gives a Model. */
export const union = (a, b) => operate(a, b, 'union');
/** Fields and keys both models have, with the values of the first. */
export const intersection = (a, b) => operate(a, b, 'intersection');
/** Fields and keys of the first model that the second doesn't have. */
export const subtraction = (a, b) => operate(a, b, 'subtraction');
/** Fields and keys only one of the models has. */
export const xor = (a, b) => operate(a, b, 'xor');
//# sourceMappingURL=algebra.js.map