# model-algebra-typescript

TypeScript implementation of model-algebra.

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
