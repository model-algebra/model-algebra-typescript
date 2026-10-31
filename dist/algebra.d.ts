import type { Model as CommonModel } from 'model-algebra-common';
export type Operation = 'union' | 'intersection' | 'subtraction' | 'xor';
type JsonObject = Record<string, unknown>;
/** Combines two JSON values level by level; both must be objects or arrays. */
export declare function combineJson(target: unknown, source: unknown, operation: Operation): unknown;
/** A model or its JSON form. */
type ModelLike = CommonModel | JsonObject;
/**
 * Combines two models in JSON form. Below the top level as combineJson() does; at the top level, parts of the model
 * both have (fields, constraints, the keys of a bridge…) are combined one level down whatever the operation, so that
 * subtraction gives the fields of the first model that the second doesn't have, as model operations should, rather
 * than no fields at all. The metadata is the first model's.
 */
export declare function combineModels(a: JsonObject, b: JsonObject, operation: Operation): JsonObject;
/** Fields and keys of both models; where both have one, the first model's values win. A Model gives a Model. */
export declare const union: <M extends ModelLike>(a: M, b: ModelLike) => M;
/** Fields and keys both models have, with the values of the first. */
export declare const intersection: <M extends ModelLike>(a: M, b: ModelLike) => M;
/** Fields and keys of the first model that the second doesn't have. */
export declare const subtraction: <M extends ModelLike>(a: M, b: ModelLike) => M;
/** Fields and keys only one of the models has. */
export declare const xor: <M extends ModelLike>(a: M, b: ModelLike) => M;
export {};
//# sourceMappingURL=algebra.d.ts.map