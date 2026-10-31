export interface ValidationError {
    message: string;
    instancePath: string;
    schemaPath: string;
}
export declare class Validator {
    private readonly _validate;
    constructor(schemaPath?: string);
    validate(data: unknown): ValidationError[];
    validateJson(json: string): ValidationError[];
}
//# sourceMappingURL=Validator.d.ts.map