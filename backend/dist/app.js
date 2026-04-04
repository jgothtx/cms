"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./auth");
const routes_1 = __importDefault(require("./routes"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.use('/api', auth_1.authMiddleware);
    app.use('/api', routes_1.default);
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(err.status || 500).json({
            error: err.message || 'Internal server error',
            status: err.status || 500
        });
    });
    return app;
}
//# sourceMappingURL=app.js.map