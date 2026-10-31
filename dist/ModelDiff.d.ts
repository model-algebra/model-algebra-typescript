import type { Index, Model as CommonModel, ModelSet, TableConstraint } from 'model-algebra-common';
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
export declare function toFieldData(field: Record<string, any>): FieldData;
/** A model in its JSON form, whether it was built by Model.fromJSON() or from the JSON form directly. */
export declare function toModelData(model: CommonModel): ModelData;
/** Differences between two versions of a model, with the same name; null when they are equal. */
export declare function diffModels(from: CommonModel, to: CommonModel): ModelDiff | null;
/** Differences between two versions of a set of models. */
export declare function diff(from: ModelSet, to: ModelSet): ModelSetDiff;
export declare function isEmptyModelDiff(difference: ModelDiff): boolean;
/** True when the two sets have no differences. */
export declare function isEmptyDiff(difference: ModelSetDiff): boolean;
/** The diff that undoes this one: from the new set back to the old one. */
export declare function invertDiff(difference: ModelSetDiff): ModelSetDiff;
//# sourceMappingURL=ModelDiff.d.ts.map