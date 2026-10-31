import { Field } from './Field.js';
import { Metadata } from './Metadata.js';
export class Model {
    metadata;
    fields;
    constructor(metadata, fields) {
        this.metadata = metadata;
        this.fields = fields;
    }
    static fromJSON(data) {
        return new Model(Metadata.fromJSON(data.metadata), data.fields.map(Field.fromJSON));
    }
    static fromJsonString(json) {
        return Model.fromJSON(JSON.parse(json));
    }
    toJson() {
        return JSON.stringify({
            metadata: this.metadata,
            fields: this.fields.map(f => f.toJSON())
        });
    }
    fieldsAsStream() {
        return [...this.fields];
    }
    fieldsAsMap() {
        return new Map(this.fields.map(f => [f.name, f]));
    }
    getMetadata() {
        return this.metadata;
    }
    add(m) {
        const targetMap = this.fieldsAsMap();
        const resultFields = [
            ...this.fields,
            ...m.fields.filter(f => !targetMap.has(f.name))
        ];
        return new Model(this.metadata, resultFields);
    }
    sub(_m) {
        throw new Error('Not implemented');
    }
    intersect(_m) {
        throw new Error('Not implemented');
    }
    xor(_m) {
        throw new Error('Not implemented');
    }
}
//# sourceMappingURL=Model.js.map