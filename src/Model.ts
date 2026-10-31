import { Field } from './Field.js';
import { Metadata } from './Metadata.js';
import { combineModels, type Operation } from './algebra.js';

export class Model {
    constructor(
        public readonly metadata: Metadata,
        public readonly fields: Field[]
    ) {}

    static fromJSON(data: Record<string, unknown>): Model {
        return new Model(
            Metadata.fromJSON(data.metadata as { name: string; version: string }),
            (data.fields as Record<string, unknown>[]).map(Field.fromJSON)
        );
    }

    static fromJsonString(json: string): Model {
        return Model.fromJSON(JSON.parse(json) as Record<string, unknown>);
    }

    toJson(): string {
        return JSON.stringify({
            metadata: this.metadata,
            fields: this.fields.map(f => f.toJSON())
        });
    }

    fieldsAsStream(): Field[] {
        return [...this.fields];
    }

    fieldsAsMap(): Map<string, Field> {
        return new Map(this.fields.map(f => [f.name, f]));
    }

    getMetadata(): Metadata {
        return this.metadata;
    }

    /** Fields of both models, combined level by level; see union() of the algebra. */
    add(m: Model): Model {
        return this.operate(m, 'union');
    }

    /** Fields of this model that m doesn't have. */
    sub(m: Model): Model {
        return this.operate(m, 'subtraction');
    }

    /** Fields both models have. */
    intersect(m: Model): Model {
        return this.operate(m, 'intersection');
    }

    /** Fields only one of the models has. */
    xor(m: Model): Model {
        return this.operate(m, 'xor');
    }

    private operate(m: Model, operation: Operation): Model {
        return Model.fromJSON(combineModels(JSON.parse(this.toJson()), JSON.parse(m.toJson()), operation));
    }
}
