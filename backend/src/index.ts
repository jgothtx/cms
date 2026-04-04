import dotenv from 'dotenv';
import { database } from './database';
import { createApp } from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = createApp();

// Initialize database and start server
export async function start() {
  try {
    await database.initialize();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { app };
