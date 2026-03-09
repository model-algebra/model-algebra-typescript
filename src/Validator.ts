import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ValidationError {
    message: string;
    instancePath: string;
    schemaPath: string;
}

export class Validator {
    private readonly _validate: ValidateFunction;

    constructor(schemaPath: string = 'resources/schemas/model-schema.json') {
        const ajv = new Ajv({ strict: false });
        const schemaContent = fs.readFileSync(path.resolve(schemaPath), 'utf-8');
        const schema = JSON.parse(schemaContent) as object;
        this._validate = ajv.compile(schema);
    }

    validate(data: unknown): ValidationError[] {
        const valid = this._validate(data);
        if (valid) return [];
        return (this._validate.errors ?? []).map((err: ErrorObject) => ({
            message: err.message ?? '',
            instancePath: err.instancePath,
            schemaPath: err.schemaPath,
        }));
    }

    validateJson(json: string): ValidationError[] {
        return this.validate(JSON.parse(json) as unknown);
    }
}
