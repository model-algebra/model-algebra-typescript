import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { Validator } from './Validator.js';

const readExample = (name: string) => fs.readFileSync(`resources/examples/${name}`, 'utf-8');

describe('Validator', () => {
    let validator: Validator;

    beforeEach(() => {
        validator = new Validator();
    });

    it('should validate user_core_model.json with no errors', () => {
        const errors = validator.validateJson(readExample('user_core_model.json'));
        expect(errors).toHaveLength(0);
    });

    it('should validate all_types_model.json with no errors', () => {
        const errors = validator.validateJson(readExample('all_types_model.json'));
        expect(errors).toHaveLength(0);
    });

    it('should report errors for invalid_model.json', () => {
        const errors = validator.validateJson(readExample('invalid_model.json'));
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should return ValidationError with message and paths', () => {
        const errors = validator.validateJson(readExample('invalid_model.json'));
        expect(errors[0]).toHaveProperty('message');
        expect(errors[0]).toHaveProperty('instancePath');
        expect(errors[0]).toHaveProperty('schemaPath');
    });

    it('should validate a model object directly', () => {
        const data = {
            metadata: { name: 'Test', version: '1.0.0' },
            fields: [{ name: 'id', type: 'INT32' }]
        };
        const errors = validator.validate(data);
        expect(errors).toHaveLength(0);
    });

    it('should reject a model missing required fields', () => {
        const errors = validator.validate({ metadata: { name: 'Test', version: '1.0.0' } });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject a field with unknown type', () => {
        const data = {
            metadata: { name: 'Test', version: '1.0.0' },
            fields: [{ name: 'id', type: 'UNKNOWN_TYPE' }]
        };
        const errors = validator.validate(data);
        expect(errors.length).toBeGreaterThan(0);
    });
});
