import fs from 'fs';
import path from 'path';

const testDbPath = path.join(process.cwd(), '.tmp', 'contracts.test.db');
fs.mkdirSync(path.dirname(testDbPath), { recursive: true });
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

process.env.CONTRACT_DB_PATH = testDbPath;
