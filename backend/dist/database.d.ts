export declare class Database {
    private db;
    private isTest;
    constructor();
    initialize(): Promise<void>;
    run(sql: string, params?: any[]): Promise<void>;
    get(sql: string, params?: any[]): Promise<any>;
    all(sql: string, params?: any[]): Promise<any[]>;
    close(): Promise<void>;
}
export declare const database: Database;
//# sourceMappingURL=database.d.ts.map