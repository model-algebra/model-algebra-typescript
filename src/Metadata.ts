export class Metadata {
    constructor(
        public readonly name: string,
        public readonly version: string
    ) {}

    static fromJSON(data: { name: string; version: string }): Metadata {
        return new Metadata(data.name, data.version);
    }
}
