import { Constraint } from './Constraint.js';
export class Field {
    name;
    type;
    description;
    parameters;
    constraints;
    constructor(name, type, description, parameters, constraints) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.parameters = parameters;
        this.constraints = constraints;
    }
    static fromJSON(data) {
        const constraints = [];
        if (data.constraints && typeof data.constraints === 'object') {
            for (const [key, value] of Object.entries(data.constraints)) {
                constraints.push(new Constraint(key, value));
            }
        }
        return new Field(data.name, data.type, data.description, data.parameters, constraints);
    }
    toJSON() {
        const result = { name: this.name, type: this.type };
        if (this.description !== undefined)
            result.description = this.description;
        if (this.parameters !== undefined)
            result.parameters = this.parameters;
        if (this.constraints.length > 0) {
            result.constraints = Object.fromEntries(this.constraints.map(c => [c.name, c.value]));
        }
        return result;
    }
}
//# sourceMappingURL=Field.js.map