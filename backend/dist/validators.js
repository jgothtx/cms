"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationResult = void 0;
exports.validateContract = validateContract;
exports.validateVendor = validateVendor;
exports.validateReminder = validateReminder;
class ValidationResult {
    constructor() {
        this.errors = [];
    }
    addError(field, message) {
        this.errors.push({ field, message });
    }
    isValid() {
        return this.errors.length === 0;
    }
    toResponse() {
        return {
            valid: this.isValid(),
            errors: this.errors
        };
    }
}
exports.ValidationResult = ValidationResult;
function validateContract(contract) {
    const result = new ValidationResult();
    // Required fields
    if (!contract.title || contract.title.trim().length === 0) {
        result.addError('title', 'Contract title is required');
    }
    if (!contract.vendor_id) {
        result.addError('vendor_id', 'Vendor is required');
    }
    if (!contract.contract_owner) {
        result.addError('contract_owner', 'Contract owner is required');
    }
    if (!contract.start_date) {
        result.addError('start_date', 'Start date is required');
    }
    if (!contract.end_date) {
        result.addError('end_date', 'End date is required');
    }
    // Date logic
    if (contract.start_date && contract.end_date) {
        const startDate = new Date(contract.start_date);
        const endDate = new Date(contract.end_date);
        if (endDate <= startDate) {
            result.addError('end_date', 'End date must be after start date');
        }
    }
    // Status enum
    if (contract.status) {
        const validStatuses = ['Draft', 'Under Review', 'Active', 'Expiring Soon', 'Expired', 'Terminated', 'Archived'];
        if (!validStatuses.includes(contract.status)) {
            result.addError('status', 'Invalid contract status');
        }
    }
    // Risk tier enum
    if (contract.risk_tier) {
        const validRiskTiers = ['Low', 'Medium', 'High'];
        if (!validRiskTiers.includes(contract.risk_tier)) {
            result.addError('risk_tier', 'Invalid risk tier');
        }
    }
    // Value must be non-negative
    if (contract.contract_value !== undefined && contract.contract_value !== null) {
        if (contract.contract_value < 0) {
            result.addError('contract_value', 'Contract value cannot be negative');
        }
    }
    return result;
}
function validateVendor(vendorData) {
    const result = new ValidationResult();
    if (!vendorData.legal_name || vendorData.legal_name.trim().length === 0) {
        result.addError('legal_name', 'Vendor legal name is required');
    }
    if (!vendorData.risk_tier) {
        result.addError('risk_tier', 'Risk tier is required');
    }
    else {
        const validRiskTiers = ['Low', 'Medium', 'High'];
        if (!validRiskTiers.includes(vendorData.risk_tier)) {
            result.addError('risk_tier', 'Invalid risk tier');
        }
    }
    return result;
}
function validateReminder(reminderData) {
    const result = new ValidationResult();
    if (!reminderData.contract_id) {
        result.addError('contract_id', 'Contract ID is required');
    }
    if (!reminderData.reminder_date) {
        result.addError('reminder_date', 'Reminder date is required');
    }
    if (!reminderData.reminder_type) {
        result.addError('reminder_type', 'Reminder type is required');
    }
    if (!reminderData.owner_user_id) {
        result.addError('owner_user_id', 'Reminder owner is required');
    }
    return result;
}
//# sourceMappingURL=validators.js.map