"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const crypto_1 = require("crypto");
const database_1 = require("./database");
const repositories_1 = require("./repositories");
async function seedDatabase() {
    try {
        console.log('Seeding database with sample data...');
        const userRepo = new repositories_1.UserRepository();
        const vendorRepo = new repositories_1.VendorRepository();
        const contractRepo = new repositories_1.ContractRepository();
        const reminderRepo = new repositories_1.ReminderRepository();
        const activityRepo = new repositories_1.ActivityEventRepository();
        // Create test users
        const adminUser = await userRepo.createUser('admin@example.com', 'Admin User', 'Admin', 'auth0|admin-user-id');
        const contractManagerUser = await userRepo.createUser('manager@example.com', 'Contract Manager', 'Contract Manager', 'auth0|manager-user-id');
        const viewerUser = await userRepo.createUser('viewer@example.com', 'Viewer User', 'Viewer', 'auth0|viewer-user-id');
        console.log('✓ Created 3 test users');
        // Create vendors
        const vendor1 = await vendorRepo.createVendor('Acme Corporation', 'High', 'Active');
        vendor1.primary_contact_name = 'John Smith';
        vendor1.primary_contact_email = 'john@acme.com';
        vendor1.category = 'Technology';
        vendor1.website = 'https://acme.example.com';
        await vendorRepo.update(vendor1);
        const vendor2 = await vendorRepo.createVendor('TechSupply Inc', 'Medium', 'Active');
        vendor2.primary_contact_name = 'Jane Doe';
        vendor2.primary_contact_email = 'jane@techsupply.com';
        vendor2.category = 'Services';
        await vendorRepo.update(vendor2);
        const vendor3 = await vendorRepo.createVendor('CloudHost Solutions', 'Low', 'Active');
        vendor3.primary_contact_name = 'Bob Johnson';
        vendor3.primary_contact_email = 'bob@cloudhost.com';
        vendor3.category = 'Infrastructure';
        await vendorRepo.update(vendor3);
        console.log('✓ Created 3 test vendors');
        // Create contracts
        const now = new Date();
        const c1StartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const c1EndDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const contract1 = await contractRepo.create({
            id: (0, crypto_1.randomUUID)(),
            title: 'Acme Corp - Enterprise License',
            vendor_id: vendor1.id,
            contract_owner: 'john.doe@company.com',
            start_date: c1StartDate,
            end_date: c1EndDate,
            status: 'Active',
            contract_value: 150000,
            currency: 'USD',
            risk_tier: 'High',
            auto_renew: true,
            notice_period_days: 90,
            insurance_required: true,
            soc2_required: true,
            created_at: now.toISOString(),
            created_by: adminUser.id,
            updated_at: now.toISOString(),
            updated_by: adminUser.id,
            archived: false
        });
        const c2EndDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const contract2 = await contractRepo.create({
            id: (0, crypto_1.randomUUID)(),
            title: 'TechSupply - Support Services',
            vendor_id: vendor2.id,
            contract_owner: 'sarah.smith@company.com',
            start_date: c1StartDate,
            end_date: c2EndDate,
            status: 'Expiring Soon',
            contract_value: 50000,
            currency: 'USD',
            risk_tier: 'Medium',
            auto_renew: false,
            notice_period_days: 60,
            dpa_required: true,
            created_at: now.toISOString(),
            created_by: contractManagerUser.id,
            updated_at: now.toISOString(),
            updated_by: contractManagerUser.id,
            archived: false
        });
        const c3EndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const contract3 = await contractRepo.create({
            id: (0, crypto_1.randomUUID)(),
            title: 'CloudHost - Hosting Services',
            vendor_id: vendor3.id,
            contract_owner: 'mike.wilson@company.com',
            start_date: c1StartDate,
            end_date: c3EndDate,
            status: 'Expired',
            contract_value: 75000,
            currency: 'USD',
            risk_tier: 'Low',
            auto_renew: false,
            created_at: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: adminUser.id,
            updated_at: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            updated_by: adminUser.id,
            archived: false
        });
        const c4StartDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const c4EndDate = new Date(now.getTime() + 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const contract4 = await contractRepo.create({
            id: (0, crypto_1.randomUUID)(),
            title: 'Acme Corp - Annual Support',
            vendor_id: vendor1.id,
            contract_owner: 'john.doe@company.com',
            start_date: c4StartDate,
            end_date: c4EndDate,
            status: 'Draft',
            contract_value: 120000,
            currency: 'USD',
            risk_tier: 'High',
            auto_renew: true,
            insurance_required: true,
            created_at: now.toISOString(),
            created_by: contractManagerUser.id,
            updated_at: now.toISOString(),
            updated_by: contractManagerUser.id,
            archived: false
        });
        console.log('✓ Created 4 test contracts');
        // Create reminders
        const reminder1Date = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        await reminderRepo.create({
            id: (0, crypto_1.randomUUID)(),
            contract_id: contract2.id,
            reminder_date: reminder1Date,
            reminder_type: 'Renewal Review',
            owner_user_id: contractManagerUser.id,
            completed: false,
            reminder_note: 'Review renewal terms 30 days before expiration',
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        });
        const reminder2Date = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        await reminderRepo.create({
            id: (0, crypto_1.randomUUID)(),
            contract_id: contract1.id,
            reminder_date: reminder2Date,
            reminder_type: 'Insurance Verification',
            owner_user_id: contractManagerUser.id,
            completed: false,
            reminder_note: 'Verify current insurance coverage',
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        });
        console.log('✓ Created 2 test reminders');
        // Log seed activity
        await activityRepo.logActivity(adminUser.id, 'Contract', contract1.id, 'Create', 'Seeded sample contracts');
        console.log('✓ Database seeding complete');
    }
    catch (err) {
        console.error('Error seeding database:', err);
        throw err;
    }
}
// Run seed if executed directly
if (require.main === module) {
    database_1.database.initialize()
        .then(() => seedDatabase())
        .then(() => process.exit(0))
        .catch(err => {
        console.error(err);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map