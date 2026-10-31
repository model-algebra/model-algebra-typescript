import { Field } from './Field.js';
import { Metadata } from './Metadata.js';
import { combineModels } from './algebra.js';
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
    /** Fields of both models, combined level by level; see union() of the algebra. */
    add(m) {
        return this.operate(m, 'union');
    }
    /** Fields of this model that m doesn't have. */
    sub(m) {
        return this.operate(m, 'subtraction');
    }
    /** Fields both models have. */
    intersect(m) {
        return this.operate(m, 'intersection');
    }
    /** Fields only one of the models has. */
    xor(m) {
        return this.operate(m, 'xor');
    }
    operate(m, operation) {
        return Model.fromJSON(combineModels(JSON.parse(this.toJson()), JSON.parse(m.toJson()), operation));
    }
}
//# sourceMappingURL=Model.js.map