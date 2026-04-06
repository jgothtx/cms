import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes';
import { seed } from './seed';
import { ensureBucket } from './s3';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Serve frontend in production
const frontendDist = process.env.FRONTEND_DIST || path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Seed on startup
seed();
ensureBucket().catch(err => console.error('[S3] Failed to ensure bucket:', err));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;
