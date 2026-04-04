export type UserRole = 'Admin' | 'Contract Manager' | 'Viewer';
export type VendorStatus = 'Active' | 'Inactive';
export type RiskTier = 'Low' | 'Medium' | 'High';
export type ContractStatus = 'Draft' | 'Under Review' | 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated' | 'Archived';
export type ActivityAction = 'Create' | 'Update' | 'StatusChange' | 'Archive' | 'Restore';
export type EntityType = 'Contract' | 'Vendor' | 'Reminder' | 'User';
export interface User {
    id: string;
    email: string;
    display_name: string;
    role: UserRole;
    auth_subject_id?: string;
    department?: string;
    title?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}
export interface Vendor {
    id: string;
    legal_name: string;
    dba_name?: string;
    category?: string;
    status: VendorStatus;
    risk_tier: RiskTier;
    tax_id?: string;
    website?: string;
    primary_contact_name?: string;
    primary_contact_email?: string;
    primary_contact_phone?: string;
    billing_contact_name?: string;
    billing_contact_email?: string;
    billing_address?: string;
    country?: string;
    performance_rating?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}
export interface Contract {
    id: string;
    title: string;
    vendor_id: string;
    contract_owner: string;
    start_date: string;
    end_date: string;
    status: ContractStatus;
    external_reference_id?: string;
    contract_type?: string;
    description?: string;
    parent_contract_id?: string;
    effective_date?: string;
    signature_date?: string;
    initial_term_months?: number;
    auto_renew?: boolean;
    renewal_term_months?: number;
    notice_period_days?: number;
    termination_date?: string;
    contract_value?: number;
    currency?: string;
    billing_frequency?: string;
    payment_terms?: string;
    cost_center_code?: string;
    spend_category?: string;
    price_escalation_terms?: string;
    risk_tier?: RiskTier;
    data_classification?: string;
    insurance_required?: boolean;
    soc2_required?: boolean;
    dpa_required?: boolean;
    compliance_exceptions?: string;
    regulatory_tags?: string;
    key_obligations?: string;
    sla_terms?: string;
    service_credits_terms?: string;
    audit_rights_flag?: boolean;
    notes?: string;
    archived: boolean;
    archived_at?: string;
    archived_by?: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
}
export interface Reminder {
    id: string;
    contract_id: string;
    reminder_date: string;
    reminder_type: string;
    owner_user_id: string;
    completed: boolean;
    completion_timestamp?: string;
    reminder_note?: string;
    created_at: string;
    updated_at: string;
}
export interface ActivityEvent {
    id: string;
    timestamp: string;
    actor_user_id: string;
    entity_type: EntityType;
    entity_id: string;
    action: ActivityAction;
    change_summary: string;
    before_snapshot?: string;
    after_snapshot?: string;
    correlation_id?: string;
    created_at: string;
}
export interface DocumentMetadata {
    id: string;
    contract_id: string;
    file_name: string;
    file_type: string;
    storage_pointer: string;
    uploaded_by: string;
    uploaded_at: string;
    version_number: number;
    document_category?: string;
    checksum?: string;
    file_size?: number;
    source_system?: string;
}
//# sourceMappingURL=models.d.ts.map