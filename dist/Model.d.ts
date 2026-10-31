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
    add(m: Model): Model;
    sub(_m: Model): Model;
    intersect(_m: Model): Model;
    xor(_m: Model): Model;
}
//# sourceMappingURL=Model.d.ts.map