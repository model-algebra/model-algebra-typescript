import { Constraint } from './Constraint.js';
export declare class Field {
    readonly name: string;
    readonly type: string;
    readonly description: string | undefined;
    readonly parameters: Record<string, unknown> | undefined;
    readonly constraints: Constraint[];
    constructor(name: string, type: string, description: string | undefined, parameters: Record<string, unknown> | undefined, constraints: Constraint[]);
    static fromJSON(data: Record<string, unknown>): Field;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=Field.d.ts.map