import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import { Model } from './Model.js';

const readExample = (name: string) => fs.readFileSync(`resources/examples/${name}`, 'utf-8');

describe('Model', () => {
    describe('parsing', () => {
        it('should parse metadata correctly', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            expect(model.metadata.name).toBe('User');
            expect(model.metadata.version).toBe('1.0.0');
        });

        it('should parse fields correctly', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            expect(model.fields).toHaveLength(4);
            expect(model.fields[0].name).toBe('id');
            expect(model.fields[0].type).toBe('integer');
        });

        it('should parse field description', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            expect(model.fields[0].description).toBe('Main index');
        });

        it('should parse constraints as Constraint objects', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            const idField = model.fieldsAsMap().get('id')!;
            const pk = idField.constraints.find(c => c.name === 'primaryKey');
            const nullable = idField.constraints.find(c => c.name === 'nullable');
            expect(pk?.value).toBe(true);
            expect(nullable?.value).toBe(false);
        });

        it('should parse all canonical types from all_types_model', () => {
            const model = Model.fromJsonString(readExample('all_types_model.json'));
            expect(model.metadata.name).toBe('AllTypes');
            expect(model.fields).toHaveLength(19);
        });

        it('should parse field parameters', () => {
            const model = Model.fromJsonString(readExample('all_types_model.json'));
            const decimalField = model.fieldsAsMap().get('decimalField')!;
            expect(decimalField.parameters?.precision).toBe(10);
            expect(decimalField.parameters?.scale).toBe(2);
        });
    });

    describe('fieldsAsMap', () => {
        it('should return a map keyed by field name', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            const map = model.fieldsAsMap();
            expect(map.size).toBe(4);
            expect(map.has('id')).toBe(true);
            expect(map.has('userName')).toBe(true);
            expect(map.get('id')?.type).toBe('integer');
        });
    });

    describe('fieldsAsStream', () => {
        it('should return an array of all fields', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            const stream = model.fieldsAsStream();
            expect(Array.isArray(stream)).toBe(true);
            expect(stream).toHaveLength(4);
        });

        it('should return a copy, not the original array', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            const stream = model.fieldsAsStream();
            stream.push(stream[0]);
            expect(model.fields).toHaveLength(4);
        });
    });

    describe('getMetadata', () => {
        it('should return metadata object', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            const meta = model.getMetadata();
            expect(meta.name).toBe('User');
            expect(meta.version).toBe('1.0.0');
        });
    });

    describe('toJson', () => {
        it('should serialize back to valid JSON', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            const json = model.toJson();
            const reparsed = JSON.parse(json);
            expect(reparsed.metadata.name).toBe('User');
            expect(reparsed.fields).toHaveLength(4);
        });

        it('should preserve field constraints in serialized JSON', () => {
            const model = Model.fromJsonString(readExample('user_core_model.json'));
            const reparsed = JSON.parse(model.toJson());
            const idField = reparsed.fields.find((f: { name: string }) => f.name === 'id');
            expect(idField.constraints.primaryKey).toBe(true);
        });
    });

    describe('add', () => {
        it('should compute UNION of user_core and user_extended equal to user_core_add_extended', () => {
            const core = Model.fromJsonString(readExample('user_core_model.json'));
            const extended = Model.fromJsonString(readExample('user_extended_model.json'));
            const expected = Model.fromJsonString(readExample('user_core_add_extended.json'));
            const result = core.add(extended);
            expect(result.toJson()).toBe(expected.toJson());
        });
    });

    describe('other operations', () => {
        const core = () => Model.fromJsonString(readExample('user_core_model.json'));
        const extended = () => Model.fromJsonString(readExample('user_extended_model.json'));
        const names = (model: Model) => model.fields.map(f => f.name);

        it('sub keeps the fields the other model does not have', () => {
            expect(names(core().add(extended()).sub(extended()))).toEqual(names(core()));
        });

        it('intersect keeps the fields both models have', () => {
            expect(names(core().add(extended()).intersect(core()))).toEqual(names(core()));
        });

        it('xor keeps the fields only one model has', () => {
            expect(names(core().xor(core().add(extended())))).toEqual(names(extended()));
        });
    });
});
