import { User, Vendor, Contract, Reminder, ActivityEvent, DocumentMetadata, VendorStatus, RiskTier, UserRole, ActivityAction, EntityType } from './models';
export declare abstract class Repository<T> {
    protected abstract tableName: string;
    protected keyField: string;
    abstract toRow(entity: T): any;
    abstract fromRow(row: any): T;
    create(entity: T): Promise<T>;
    findById(id: string): Promise<T | null>;
    findAll(limit?: number, offset?: number): Promise<T[]>;
    update(entity: T): Promise<void>;
    delete(id: string): Promise<void>;
}
export declare class UserRepository extends Repository<User> {
    protected tableName: string;
    toRow(user: User): any;
    fromRow(row: any): User;
    findByEmail(email: string): Promise<User | null>;
    findByAuthSubjectId(authSubjectId: string): Promise<User | null>;
    createUser(email: string, displayName: string, role: UserRole, authSubjectId?: string): Promise<User>;
}
export declare class VendorRepository extends Repository<Vendor> {
    protected tableName: string;
    toRow(vendor: Vendor): any;
    fromRow(row: any): Vendor;
    createVendor(legalName: string, riskTier: RiskTier, status?: VendorStatus): Promise<Vendor>;
    searchByName(query: string): Promise<Vendor[]>;
    findByLegalNameNormalized(legalName: string): Promise<Vendor | null>;
}
export declare class ContractRepository extends Repository<Contract> {
    protected tableName: string;
    toRow(contract: Contract): any;
    fromRow(row: any): Contract;
    findByVendor(vendorId: string): Promise<Contract[]>;
    searchByTitle(query: string): Promise<Contract[]>;
    findExpiringContracts(daysAhead: number): Promise<Contract[]>;
    findExpiredContracts(): Promise<Contract[]>;
}
export declare class ReminderRepository extends Repository<Reminder> {
    protected tableName: string;
    toRow(reminder: Reminder): any;
    fromRow(row: any): Reminder;
    findByContract(contractId: string): Promise<Reminder[]>;
    findUpcoming(days: number): Promise<Reminder[]>;
}
export declare class ActivityEventRepository extends Repository<ActivityEvent> {
    protected tableName: string;
    toRow(event: ActivityEvent): any;
    fromRow(row: any): ActivityEvent;
    findByEntity(entityType: EntityType, entityId: string): Promise<ActivityEvent[]>;
    logActivity(userId: string, entity: EntityType, entityId: string, action: ActivityAction, summary: string): Promise<ActivityEvent>;
}
export declare class DocumentMetadataRepository extends Repository<DocumentMetadata> {
    protected tableName: string;
    toRow(doc: DocumentMetadata): any;
    fromRow(row: any): DocumentMetadata;
    findByContract(contractId: string): Promise<DocumentMetadata[]>;
}
//# sourceMappingURL=repositories.d.ts.map