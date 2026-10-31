import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import { Model, ModelSet } from 'model-algebra-common';
import { diff, diffModels, invertDiff, isEmptyDiff, toModelData } from './ModelDiff.js';

const readExample = (name: string) => JSON.parse(fs.readFileSync(`resources/examples/${name}`, 'utf-8'));

const town = {
    metadata: { name: 'Town', version: '1.0.0' },
    fields: [
        { name: 'id', type: 'INT32', constraints: { primaryKey: true } },
        { name: 'name', type: 'STRING' },
    ],
};

const user = {
    metadata: { name: 'User', version: '1.0.0', schema: 'app', description: 'Users' },
    fields: [
        { name: 'id', type: 'INT64', constraints: { primaryKey: true, nullable: false } },
        { name: 'email', type: 'STRING', parameters: { length: 100 }, constraints: { nullable: false, unique: true } },
        { name: 'age', type: 'INT16', constraints: { min: 0 } },
        { name: 'nick', type: 'STRING' },
    ],
    constraints: [{ name: 'user_age', type: 'check', rule: { field: 'age', op: '<', value: 150 } }],
    indexes: [{ name: 'user_nick', fields: ['nick'] }],
};

const clone = <T>(value: T): T => structuredClone(value);
const set = (...models: any[]) => new ModelSet(models.map(model => Model.fromJSON(model)));

describe('toModelData', () => {
    it('gives constraints as a map whether the model was read with fromJSON or not', () => {
        const fromJson = toModelData(Model.fromJSON(clone(user)));
        const plain = toModelData(new Model(clone(user)));
        expect(fromJson).toEqual(plain);
        expect(fromJson.fields[1].constraints).toEqual({ nullable: false, unique: true });
    });

    it('reads the legacy foreign_key alias as foreignKey', () => {
        const model = new Model({
            metadata: { name: 'Order' },
            fields: [{ name: 'userId', type: 'INT64', constraints: { foreign_key: { ref: 'User', field: 'id' } } }],
        });
        expect(toModelData(model).fields[0].constraints).toEqual({ foreignKey: { ref: 'User', field: 'id' } });
    });
});

describe('diffModels', () => {
    it('is null for equal models, ignoring key order and the version', () => {
        const other = clone(user);
        other.metadata.version = '2.0.0';
        other.fields[1] = { constraints: { unique: true, nullable: false }, parameters: { length: 100 }, type: 'STRING', name: 'email' };
        expect(diffModels(Model.fromJSON(user), Model.fromJSON(other))).toBeNull();
    });

    it('finds added, removed and changed fields with what changed', () => {
        const after = clone(user);
        after.fields = [
            user.fields[0],
            { name: 'email', type: 'STRING', parameters: { length: 200 }, constraints: { nullable: false } },
            { name: 'age', type: 'INT16', constraints: { min: 0 }, description: 'In years' } as any,
            { name: 'phone', type: 'STRING' },
        ];
        const result = diffModels(Model.fromJSON(user), Model.fromJSON(after))!;
        expect(result.fields.added.map(f => f.name)).toEqual(['phone']);
        expect(result.fields.removed.map(f => f.name)).toEqual(['nick']);
        expect(result.fields.changed.map(c => [c.from.name, c.changes])).toEqual([
            ['email', ['parameters', 'constraints.unique']],
            ['age', ['description']],
        ]);
        expect(result.fields.changed[0].from.parameters).toEqual({ length: 100 });
        expect(result.fields.changed[0].to.parameters).toEqual({ length: 200 });
    });

    it('finds changes of metadata, table constraints and indexes', () => {
        const after = clone(user);
        after.metadata.schema = 'core';
        delete (after.metadata as any).description;
        after.constraints = [{ name: 'user_age', type: 'check', rule: { field: 'age', op: '<=', value: 150 } }];
        after.indexes = [{ name: 'user_email', fields: ['email'], unique: true } as any];
        const result = diffModels(Model.fromJSON(user), Model.fromJSON(after))!;
        expect(result.metadata).toEqual({
            schema: { from: 'app', to: 'core' },
            description: { from: 'Users', to: undefined },
        });
        expect(result.constraints.changed).toEqual([{ from: user.constraints[0], to: after.constraints[0] }]);
        expect(result.indexes.added.map(i => i.name)).toEqual(['user_email']);
        expect(result.indexes.removed.map(i => i.name)).toEqual(['user_nick']);
    });

    it('refuses to compare models with different names', () => {
        expect(() => diffModels(Model.fromJSON(user), Model.fromJSON({ ...user, metadata: { name: 'Person' } })))
            .toThrow('Cannot compare model User with model Person');
    });
});

describe('diff', () => {
    it('finds added, removed and changed models', () => {
        const core = readExample('user_core_model.json');
        const changedUser = clone(user);
        changedUser.fields.pop();
        const result = diff(set(user, { ...core, metadata: { ...core.metadata, name: 'Core' } }), set(changedUser, town));
        expect(result.added.map(m => m.metadata.name)).toEqual(['Town']);
        expect(result.removed.map(m => m.metadata.name)).toEqual(['Core']);
        expect(result.changed.map(m => m.name)).toEqual(['User']);
        expect(result.changed[0].fields.removed.map(f => f.name)).toEqual(['nick']);
    });

    it('is empty for equal sets', () => {
        expect(isEmptyDiff(diff(set(user), set(clone(user))))).toBe(true);
    });

    it('keeps whole models, so removed ones can be restored', () => {
        const result = diff(set(user), set());
        expect(result.removed).toEqual([toModelData(Model.fromJSON(user))]);
    });

    it('is plain JSON', () => {
        const after = clone(user);
        after.fields[2].constraints = { min: 1 };
        const result = diff(set(user), set(after));
        expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    });
});

describe('invertDiff', () => {
    it('gives the diff from the new set back to the old one', () => {
        const after = clone(user);
        after.metadata.schema = 'core';
        after.fields[2].constraints = { min: 1 };
        after.fields.push({ name: 'phone', type: 'STRING' });
        const before = set(user, town);
        const later = set(after);
        expect(invertDiff(diff(before, later))).toEqual(diff(later, before));
    });

    it('applied twice gives the diff back', () => {
        const after = clone(user);
        after.fields.pop();
        const result = diff(set(user), set(after));
        expect(invertDiff(invertDiff(result))).toEqual(result);
    });
});
