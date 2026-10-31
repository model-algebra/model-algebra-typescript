import Ajv from 'ajv';
import * as fs from 'node:fs';
import * as path from 'node:path';
export class Validator {
    _validate;
    constructor(schemaPath = 'resources/schemas/model-schema.json') {
        const ajv = new Ajv({ strict: false });
        const schemaContent = fs.readFileSync(path.resolve(schemaPath), 'utf-8');
        const schema = JSON.parse(schemaContent);
        this._validate = ajv.compile(schema);
    }
    validate(data) {
        const valid = this._validate(data);
        if (valid)
            return [];
        return (this._validate.errors ?? []).map((err) => ({
            message: err.message ?? '',
            instancePath: err.instancePath,
            schemaPath: err.schemaPath,
        }));
    }
    validateJson(json) {
        return this.validate(JSON.parse(json));
    }
}
//# sourceMappingURL=Validator.js.map