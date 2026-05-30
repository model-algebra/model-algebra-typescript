import { Field } from './Field.js';
import { Metadata } from './Metadata.js';

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

    add(m: Model): Model {
        const targetMap = this.fieldsAsMap();
        const resultFields = [
            ...this.fields,
            ...m.fields.filter(f => !targetMap.has(f.name))
        ];
        return new Model(this.metadata, resultFields);
    }

    sub(_m: Model): Model {
        throw new Error('Not implemented');
    }

    intersect(_m: Model): Model {
        throw new Error('Not implemented');
    }

    xor(_m: Model): Model {
        throw new Error('Not implemented');
    }
}
