import { Field } from './Field.js';
import { Metadata } from './Metadata.js';
export declare class Model {
    readonly metadata: Metadata;
    readonly fields: Field[];
    constructor(metadata: Metadata, fields: Field[]);
    static fromJSON(data: Record<string, unknown>): Model;
    static fromJsonString(json: string): Model;
    toJson(): string;
    fieldsAsStream(): Field[];
    fieldsAsMap(): Map<string, Field>;
    getMetadata(): Metadata;
    /** Fields of both models, combined level by level; see union() of the algebra. */
    add(m: Model): Model;
    /** Fields of this model that m doesn't have. */
    sub(m: Model): Model;
    /** Fields both models have. */
    intersect(m: Model): Model;
    /** Fields only one of the models has. */
    xor(m: Model): Model;
    private operate;
}
//# sourceMappingURL=Model.d.ts.map