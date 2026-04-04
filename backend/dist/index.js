"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.start = start;
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database");
const app_1 = require("./app");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, app_1.createApp)();
exports.app = app;
// Initialize database and start server
async function start() {
    try {
        await database_1.database.initialize();
        console.log('Database initialized');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
if (require.main === module) {
    start();
}
//# sourceMappingURL=index.js.map