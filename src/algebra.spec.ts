import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import { Model } from 'model-algebra-common';
import { combineJson, intersection, subtraction, union, xor, type Operation } from './algebra.js';

const readJson = (name: string) => JSON.parse(fs.readFileSync(`resources/examples/${name}`, 'utf-8'));

// The examples the Java library is tested with: the same inputs give the same results
describe('combineJson', () => {
    it.each([
        ['union', 'result_union.json'],
        ['intersection', 'result_intersection.json'],
        ['subtraction', 'result_subtraction.json'],
        ['xor', 'result_xor.json'],
    ] as [Operation, string][])('%s gives the result of the Java library', (operation, result) => {
        const actual = combineJson(readJson('processor/source1.json'), readJson('processor/source2.json'), operation);
        expect(actual).toEqual(readJson(`processor/${result}`));
    });

    it('combines nested objects and named arrays, and keeps the first value of leaves', () => {
        expect(combineJson(
            { a: { x: 1, list: [{ name: 'p', v: 1 }] }, b: [1, 2], c: 'first' },
            { a: { y: 2, list: [{ name: 'p', w: 2 }, { name: 'q' }] }, b: [3], c: { not: 'combined' }, d: true },
            'union',
        )).toEqual({ a: { x: 1, list: [{ name: 'p', v: 1, w: 2 }, { name: 'q' }], y: 2 }, b: [1, 2], c: 'first', d: true });
    });

    it('needs objects or arrays', () => {
        expect(() => combineJson(1, {}, 'union')).toThrow('Unsupported target value: 1');
    });
});

const event = {
    metadata: { name: 'Event', version: '1.0.0' },
    fields: [
        { name: 'id', type: 'INT64', constraints: { primaryKey: true } },
        { name: 'title', type: 'STRING', description: 'Shown in the calendar', constraints: { nullable: false } },
        { name: 'seats', type: 'INT32' },
    ],
    constraints: [{ name: 'title_unique', type: 'unique', fields: ['title'] }],
};

// What a UI bridge needs to show the model in a form, kept apart from the model
const eventForm = {
    metadata: { name: 'Event' },
    fields: [
        { name: 'title', form: { label: 'Name', cols: 12 } },
        { name: 'seats', form: { control: 'VSlider', props: { min: 1, max: 500 } } },
    ],
    form: { order: ['title', 'seats'], submitText: 'Publish' },
};

describe('operations on models', () => {
    it('union adds the keys of another model to the fields and to the model', () => {
        const combined = union(event, eventForm);
        expect(combined).toEqual({
            ...event,
            fields: [
                event.fields[0],
                { ...event.fields[1], form: { label: 'Name', cols: 12 } },
                { ...event.fields[2], form: { control: 'VSlider', props: { min: 1, max: 500 } } },
            ],
            form: eventForm.form,
        });
        expect(event.fields[1]).not.toHaveProperty('form');
    });

    it('a Model gives a Model, with the keys of the other one', () => {
        const combined = union(Model.fromJSON(event), eventForm);
        expect(combined).toBeInstanceOf(Model);
        expect((combined.fields[1] as any).form).toEqual({ label: 'Name', cols: 12 });
        expect(combined.fields[1].constraints.map(c => c.name)).toEqual(['nullable']);
        expect((combined as any).form.submitText).toBe('Publish');
        expect(combined.toJSON()).toEqual(union(event, eventForm));
    });

    it('the first model wins where both have a value', () => {
        expect(union(event, { metadata: { name: 'Other', version: '2' }, fields: [{ name: 'seats', type: 'INT16' }] }).fields[2])
            .toEqual({ name: 'seats', type: 'INT32' });
    });

    it('subtraction gives the fields and keys of the first model the second does not have', () => {
        expect(subtraction(event, { fields: [{ name: 'seats' }] })).toEqual({ ...event, fields: event.fields.slice(0, 2) });
        expect((subtraction(union(event, eventForm), { form: { submitText: '' } }) as any).form).toEqual({ order: ['title', 'seats'] });
        expect((subtraction(union(event, eventForm), { metadata: {}, fields: [], form: eventForm.form }) as any).form).toEqual({});
    });

    it('intersection and xor work on fields and keys alike', () => {
        expect(intersection(event, eventForm).fields).toEqual([{ name: 'title' }, { name: 'seats' }]);
        expect(xor(event, eventForm)).toEqual({ ...event, fields: [event.fields[0]], form: eventForm.form });
    });
});

// The same operations on the models of model-examples as the tests of the Java library
describe('operations on the models of model-examples', () => {
    const core = readJson('user_core_model.json');
    const extended = readJson('user_extended_model.json');
    const db = readJson('user_db_model.json');
    const person = readJson('person_search_model.json');
    const names = (model: any) => model.fields.map((f: any) => f.name);
    const field = (model: any, name: string) => model.fields.find((f: any) => f.name === name);

    it('union adds fields, and keys of fields both have', () => {
        expect(union(core, extended)).toEqual(readJson('user_core_add_extended.json'));
        const user = union(core, db);
        expect(names(user)).toEqual(['id', 'userName', 'firstName', 'secondName']);
        expect(field(user, 'id')).toEqual({ ...field(core, 'id'), primaryKey: true });
        expect(field(user, 'userName').constraints).toEqual({ nullable: false, unique: true });
        expect(union(db, core).metadata).toEqual(db.metadata);
        expect(union(person, core).sortings).toEqual(person.sortings);
    });

    it('subtraction gives back the first model', () => {
        expect(subtraction(union(core, extended), extended)).toEqual(core);
        expect(names(subtraction(core, db))).toEqual(['firstName', 'secondName']);
        expect(subtraction(core, core)).toEqual({ metadata: core.metadata, fields: [] });
    });

    it('intersection keeps the fields and the keys both have', () => {
        expect(intersection(union(core, extended), core)).toEqual(core);
        expect(intersection(core, db).fields).toEqual([{ name: 'id' }, { name: 'userName', constraints: {} }]);
        expect(names(intersection(person, core))).toEqual(['id', 'firstName']);
        expect(intersection(person, core)).not.toHaveProperty('sortings');
    });

    it('xor keeps the fields only one has', () => {
        expect(names(xor(core, union(core, extended)))).toEqual(names(extended));
        expect(names(xor(core, db))).toEqual(['firstName', 'secondName']);
        expect(xor(core, core).fields).toEqual([]);
    });
});
