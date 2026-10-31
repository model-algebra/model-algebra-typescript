export class Metadata {
    name;
    version;
    constructor(name, version) {
        this.name = name;
        this.version = version;
    }
    static fromJSON(data) {
        return new Metadata(data.name, data.version);
    }
}
//# sourceMappingURL=Metadata.js.map