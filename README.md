# model-algebra-typescript

TypeScript implementation of [model-algebra](https://github.com/model-algebra/model-algebra): model operations,
validation against the model schema, and the diff of sets of models.

## Installation

```sh
pnpm add github:model-algebra/model-algebra-typescript
```

The built package is in the repository, so nothing is built when it is installed.

## Model operations

Models combine like sets, level by level of their JSON form, as the
[Java library](https://github.com/model-algebra/model-algebra) does:

```ts
import { Model } from 'model-algebra-common'
import { union, intersection, subtraction, xor } from 'model-algebra-typescript'

const user = union(core, extended)   // a Model from Models, JSON from JSON
```

| Operation | Result |
|---|---|
| `union(a, b)` | Fields and keys of both; where both have a value, `a`'s wins |
| `intersection(a, b)` | Fields and keys both have |
| `subtraction(a, b)` | Fields and keys of `a` that `b` doesn't have |
| `xor(a, b)` | Fields and keys only one has |

- **Sets:** objects are sets of their keys, and arrays of objects with a `name` (fields, table constraints, indexes)
  are sets of those names. Other values are leaves.
- **Nesting:** a key or name both sides have is combined again, one level down, when both values are objects or both
  are named arrays; otherwise the value of `a` is kept. So a field both models have is combined key by key in a union
  or an intersection, and taken out whole by a subtraction or an xor.
- **The top level** of a model is combined one level down whatever the operation, so `subtraction` gives the fields of
  `a` that `b` doesn't have rather than no fields at all. The metadata is `a`'s.
- **Any keys** take part, also those the model format doesn't define. A bridge can keep what it needs in a model of
  its own and unite it with the main model when needed; for example, the form options of
  [vuetify-bridge](https://github.com/model-algebra/vuetify-bridge):

```ts
const eventForm = {
    metadata: { name: 'Event' },
    fields: [{ name: 'title', form: { label: 'Name', cols: 12 } }],
    form: { submitText: 'Publish' },
}
union(eventModel, eventForm)   // eventModel with the form options; eventModel itself doesn't change
```

`combineJson(a, b, operation)` is the level-by-level combination of any two JSON values (objects or arrays), the
`processLevel` of the Java library; it gives the same results on the shared examples of
[model-examples](https://github.com/model-algebra/model-examples) (`processor/`). `combineModels()` adds the rule for
the top level of models.

The older `Model` class of this package (metadata name and version, and fields) has the same operations as methods:
`a.add(b)`, `a.sub(b)`, `a.intersect(b)`, `a.xor(b)`. For everything else in models, use `Model` from
[model-algebra-common](https://github.com/model-algebra/common-typescript) with the functions above.

## Validation

`Validator` checks a model against the JSON Schema of the format
([model-schema](https://github.com/model-algebra/model-schema)), with [Ajv](https://ajv.js.org/):

```ts
import { Validator } from 'model-algebra-typescript'

const validator = new Validator('path/to/model-schema.json')
const errors = validator.validateJson(text)   // or validate(object); empty when the model is valid
// [{ message: 'must have required property \'type\'', instancePath: '/fields/0', schemaPath: '...' }]
```

The schema file is not part of the package. Give the path to a copy of `model-schema.json`; the default,
`resources/schemas/model-schema.json`, is read relative to the working directory.

## Model diff

`diff(from, to)` compares two versions of a set of models (`ModelSet` from
[model-algebra-common](https://github.com/model-algebra/common-typescript)). For example, from the models a database
has to the models it should have. `diffModels(from, to)` compares two versions of one model.

```ts
import { ModelSet } from 'model-algebra-common'
import { diff, invertDiff, isEmptyDiff } from 'model-algebra-typescript'

const changes = diff(ModelSet.fromJSON(oldModels), ModelSet.fromJSON(newModels))
```

What is matched and compared:

- **Models** are matched by `metadata.name`; fields, table constraints and indexes by `name`. A rename shows as a
  removal and an addition.
- **Metadata:** `schema` and `description` are compared, the `version` isn't.
- **Sorting and filtering:** `sortable` and `filterable` of fields are compared by what they mean: `true` and the
  default definition are the same. `sortings` and `filters` of models are matched by name.
- **Field constraints** may be given as a map or as `Constraint` objects. The legacy `foreign_key` is read as
  `foreignKey`. Values are compared regardless of key order.

The diff is plain JSON and keeps both sides of every change, so it can be stored and reviewed. `invertDiff()` turns it
around, from the new models back to the old ones.

```ts
interface ModelSetDiff {
    added: ModelData[]       // models only in `to`, whole
    removed: ModelData[]     // models only in `from`, whole
    changed: ModelDiff[]     // models in both that differ
}

interface ModelDiff {
    name: string
    metadata: { schema?: Change<string | undefined>, description?: Change<string | undefined> }
    fields: { added: FieldData[], removed: FieldData[], changed: FieldChange[] }
    constraints: { added: TableConstraint[], removed: TableConstraint[], changed: Change<TableConstraint>[] }
    indexes: { added: Index[], removed: Index[], changed: Change<Index>[] }
    sortings: { added: NamedSorting[], removed: NamedSorting[], changed: Change<NamedSorting>[] }   // { name, keys }
    filters: { added: NamedFilter[], removed: NamedFilter[], changed: Change<NamedFilter>[] }       // { name, filter }
}

interface Change<T> { from: T, to: T }

interface FieldChange extends Change<FieldData> {
    // what differs: 'type', 'parameters', 'description', 'targets', 'sortable', 'filterable', 'constraints.<name>'
    changes: string[]
}
```

`ModelData` and `FieldData` are models and fields in their JSON form; `toModelData()` gives that form for any model.
`isEmptyDiff()` tells whether two sets are the same.

## Development

```sh
git submodule update --init   # resources/examples and resources/schemas
pnpm install
pnpm test
pnpm build
```

`dist/` is committed, because other projects install the package from GitHub without building it. Enable the
pre-commit hook once per clone; it rebuilds `dist/` and adds it to every commit that changes the sources:

```sh
git config core.hooksPath .githooks
```

CI fails when the committed `dist/` differs from a build of the sources.
