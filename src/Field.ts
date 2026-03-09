import { Constraint } from './Constraint.js';

export class Field {
    constructor(
        public readonly name: string,
        public readonly type: string,
        public readonly description: string | undefined,
        public readonly parameters: Record<string, unknown> | undefined,
        public readonly constraints: Constraint[]
    ) {}

    static fromJSON(data: Record<string, unknown>): Field {
        const constraints: Constraint[] = [];
        if (data.constraints && typeof data.constraints === 'object') {
            for (const [key, value] of Object.entries(data.constraints)) {
                constraints.push(new Constraint(key, value));
            }
        }
        return new Field(
            data.name as string,
            data.type as string,
            data.description as string | undefined,
            data.parameters as Record<string, unknown> | undefined,
            constraints
        );
    }

    toJSON(): Record<string, unknown> {
        const result: Record<string, unknown> = { name: this.name, type: this.type };
        if (this.description !== undefined) result.description = this.description;
        if (this.parameters !== undefined) result.parameters = this.parameters;
        if (this.constraints.length > 0) {
            result.constraints = Object.fromEntries(this.constraints.map(c => [c.name, c.value]));
        }
        return result;
    }
}
