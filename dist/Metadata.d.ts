export declare class Metadata {
    readonly name: string;
    readonly version: string;
    constructor(name: string, version: string);
    static fromJSON(data: {
        name: string;
        version: string;
    }): Metadata;
}
//# sourceMappingURL=Metadata.d.ts.map