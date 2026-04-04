import { Contract } from './models';
export interface ValidationError {
    field: string;
    message: string;
}
export declare class ValidationResult {
    errors: ValidationError[];
    addError(field: string, message: string): void;
    isValid(): boolean;
    toResponse(): {
        valid: boolean;
        errors: ValidationError[];
    };
}
export declare function validateContract(contract: Partial<Contract>): ValidationResult;
export declare function validateVendor(vendorData: any): ValidationResult;
export declare function validateReminder(reminderData: any): ValidationResult;
//# sourceMappingURL=validators.d.ts.map