import type { Index, Model as CommonModel, ModelSet, TableConstraint } from 'model-algebra-common';

/*
 * Differences between two versions of a set of models, e.g. the models a database has now and the models it should
 * have. Models are matched by metadata.name, fields, table constraints and indexes by name; renames are seen as
 * a removal and an addition. The diff is plain JSON and keeps both sides of every change, so it can be stored,
 * reviewed, and inverted to go back.
 */

/** A field in JSON form: constraints as a map, no undefined properties. */
export interface FieldData {
    name: string;
    type: string;
    description?: string;
    parameters?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
    targets?: Record<string, Record<string, unknown>>;
}

export interface MetadataData {
    name: string;
    version?: string;
    schema?: string;
    description?: string;
}

/** A model in JSON form, as model files hold it. */
export interface ModelData {
    metadata: MetadataData;
    fields: FieldData[];
    constraints?: TableConstraint[];
    indexes?: Index[];
}

export interface Change<T> {
    from: T;
    to: T;
}

export interface FieldChange extends Change<FieldData> {
    /** What differs: 'type', 'parameters', 'description', 'targets', or 'constraints.<name>' for each constraint. */
    changes: string[];
}

/** Items of one kind in a model, matched by name. */
export interface ItemsDiff<T, C = Change<T>> {
    added: T[];
    removed: T[];
    changed: C[];
}

export interface ModelDiff {
    /** Name of the model, the same on both sides. */
    name: string;
    /** Metadata that differs, by property: schema or description; versions are not compared. */
    metadata: Partial<Record<'schema' | 'description', Change<string | undefined>>>;
    fields: ItemsDiff<FieldData, FieldChange>;
    constraints: ItemsDiff<TableConstraint>;
    indexes: ItemsDiff<Index>;
}

export interface ModelSetDiff {
    /** Models only in the new set. */
    added: ModelData[];
    /** Models only in the old set. */
    removed: ModelData[];
    /** Models in both sets that differ. */
    changed: ModelDiff[];
}

const COMPARED_METADATA = ['schema', 'description'] as const;

/** JSON value with object keys sorted and undefined properties left out, for comparing by value. */
function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, item]) => item !== undefined)
            .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
            .map(([key, item]) => [key, canonical(item)]);
        return Object.fromEntries(entries);
    }
    return value;
}

function equal(a: unknown, b: unknown): boolean {
    return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function withoutUndefined<T extends object>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

/** Constraints of a field as a map, from the map of the JSON form or the Constraint list of Model.fromJSON(). */
function constraintMap(constraints: unknown): Record<string, unknown> {
    const map: Record<string, unknown> = Array.isArray(constraints)
        ? Object.fromEntries(constraints.map(constraint => [constraint.name, constraint.value]))
        : { ...(constraints as Record<string, unknown> | undefined ?? {}) };
    // Legacy alias
    if (map.foreign_key !== undefined && map.foreignKey === undefined) map.foreignKey = map.foreign_key;
    delete map.foreign_key;
    return map;
}

export function toFieldData(field: Record<string, any>): FieldData {
    const constraints = constraintMap(field.constraints);
    return withoutUndefined({
        name: field.name,
        type: field.type,
        description: field.description,
        parameters: field.parameters,
        constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
        targets: field.targets,
    });
}

/** A model in its JSON form, whether it was built by Model.fromJSON() or from the JSON form directly. */
export function toModelData(model: CommonModel): ModelData {
    const { name, version, schema, description } = model.metadata;
    return withoutUndefined({
        metadata: withoutUndefined({ name, version, schema, description }),
        fields: model.fields.map(field => toFieldData(field)),
        constraints: model.constraints?.length ? model.constraints : undefined,
        indexes: model.indexes?.length ? model.indexes : undefined,
    });
}

function diffItems<T extends { name: string }, C>(
    from: T[],
    to: T[],
    change: (from: T, to: T) => C | undefined,
): ItemsDiff<T, C> {
    const before = new Map(from.map(item => [item.name, item]));
    const after = new Map(to.map(item => [item.name, item]));
    const changed: C[] = [];
    for (const item of to) {
        const old = before.get(item.name);
        const difference = old !== undefined ? change(old, item) : undefined;
        if (difference !== undefined) changed.push(difference);
    }
    return {
        added: to.filter(item => !before.has(item.name)),
        removed: from.filter(item => !after.has(item.name)),
        changed,
    };
}

function changeOf<T>(from: T, to: T): Change<T> | undefined {
    return equal(from, to) ? undefined : { from, to };
}

function fieldChange(from: FieldData, to: FieldData): FieldChange | undefined {
    const changes: string[] = [];
    for (const property of ['type', 'parameters', 'description', 'targets'] as const)
        if (!equal(from[property], to[property])) changes.push(property);
    const before = from.constraints ?? {};
    const after = to.constraints ?? {};
    for (const name of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort())
        if (!equal(before[name], after[name])) changes.push(`constraints.${name}`);
    return changes.length > 0 ? { from, to, changes } : undefined;
}

/** Differences between two versions of a model, with the same name; null when they are equal. */
export function diffModels(from: CommonModel, to: CommonModel): ModelDiff | null {
    const before = toModelData(from);
    const after = toModelData(to);
    if (before.metadata.name !== after.metadata.name)
        throw new Error(`Cannot compare model ${before.metadata.name} with model ${after.metadata.name}`);

    const metadata: ModelDiff['metadata'] = {};
    for (const property of COMPARED_METADATA)
        if (before.metadata[property] !== after.metadata[property])
            metadata[property] = { from: before.metadata[property], to: after.metadata[property] };

    const result: ModelDiff = {
        name: after.metadata.name,
        metadata,
        fields: diffItems(before.fields, after.fields, fieldChange),
        constraints: diffItems(before.constraints ?? [], after.constraints ?? [], changeOf),
        indexes: diffItems(before.indexes ?? [], after.indexes ?? [], changeOf),
    };
    return isEmptyModelDiff(result) ? null : result;
}

/** Differences between two versions of a set of models. */
export function diff(from: ModelSet, to: ModelSet): ModelSetDiff {
    const changed: ModelDiff[] = [];
    for (const model of to) {
        const old = from.get(model.metadata.name);
        const difference = old !== undefined ? diffModels(old, model) : null;
        if (difference !== null) changed.push(difference);
    }
    return {
        added: to.models.filter(model => !from.has(model.metadata.name)).map(toModelData),
        removed: from.models.filter(model => !to.has(model.metadata.name)).map(toModelData),
        changed,
    };
}

function itemsEmpty(items: ItemsDiff<unknown, unknown>): boolean {
    return items.added.length === 0 && items.removed.length === 0 && items.changed.length === 0;
}

export function isEmptyModelDiff(difference: ModelDiff): boolean {
    return Object.keys(difference.metadata).length === 0
        && itemsEmpty(difference.fields) && itemsEmpty(difference.constraints) && itemsEmpty(difference.indexes);
}

/** True when the two sets have no differences. */
export function isEmptyDiff(difference: ModelSetDiff): boolean {
    return difference.added.length === 0 && difference.removed.length === 0 && difference.changed.length === 0;
}

function invertItems<T, C extends Change<T>>(items: ItemsDiff<T, C>): ItemsDiff<T, C> {
    return {
        added: items.removed,
        removed: items.added,
        changed: items.changed.map(change => ({ ...change, from: change.to, to: change.from })),
    };
}

/** The diff that undoes this one: from the new set back to the old one. */
export function invertDiff(difference: ModelSetDiff): ModelSetDiff {
    return {
        added: difference.removed,
        removed: difference.added,
        changed: difference.changed.map(model => ({
            name: model.name,
            metadata: Object.fromEntries(Object.entries(model.metadata)
                .map(([property, change]) => [property, { from: change.to, to: change.from }])),
            fields: invertItems(model.fields),
            constraints: invertItems(model.constraints),
            indexes: invertItems(model.indexes),
        })),
    };
}
