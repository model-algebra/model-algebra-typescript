# model-algebra-typescript

TypeScript implementation of [model-algebra](https://github.com/model-algebra/model-algebra): model operations,
validation against the model schema, and the diff of sets of models.

## Installation

```sh
pnpm add github:model-algebra/model-algebra-typescript
```

The built package is in the repository, so nothing is built when it is installed.

## Models and operations

`Model`, `Field`, `Metadata` and `Constraint` are this package's own classes for model operations:

```ts
import { Model } from 'model-algebra-typescript'

const core = Model.fromJsonString(coreJson)
const extended = Model.fromJsonString(extendedJson)

const user = core.add(extended)   // the union: fields of both, those of `core` first
user.toJson()
user.fieldsAsMap().get('email')
```

| Operation | Status |
|---|---|
| `add` | Union of the fields, matched by name; a field in both keeps the first model's definition |
| `sub`, `intersect`, `xor` | Not implemented yet; they throw |

These classes cover metadata name and version and fields. For schemas, table constraints, indexes and target options,
use `Model` from [model-algebra-common](https://github.com/model-algebra/common-typescript), as the diff below does.

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
}

interface Change<T> { from: T, to: T }

interface FieldChange extends Change<FieldData> {
    // what differs: 'type', 'parameters', 'description', 'targets', 'constraints.<name>'
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
