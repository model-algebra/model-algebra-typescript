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

    add(_m: Model): Model {
        throw new Error('Not implemented');
    }

    sub(_m: Model): Model {
        throw new Error('Not implemented');
    }

    overrideFrom(_m: Model): Model {
        throw new Error('Not implemented');
    }

    enrichFrom(_m: Model): Model {
        throw new Error('Not implemented');
    }
}
