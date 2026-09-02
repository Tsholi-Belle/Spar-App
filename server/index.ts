import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from './db/seed.js';

import programmesRouter from './routes/programmes.js';
import learnersRouter from './routes/learners.js';
import attendanceRouter from './routes/attendance.js';
import reconciliationRouter from './routes/reconciliation.js';
import analyticsRouter from './routes/analytics.js';
import kioskRouter from './routes/kiosk.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema and seed data
seedData();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/programmes', programmesRouter);
app.use('/api/learners', learnersRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/reconciliation', reconciliationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/kiosk', kioskRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'FreshBite Retail Youth Skills Development Clock-In & Payment Reconciliation System',
    timestamp: new Date().toISOString(),
  });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

const server = app.listen(PORT, () => {
  console.log(`🚀 Retail Youth Skills Tracker Backend running on http://localhost:${PORT}`);
});

// Keep process active
setInterval(() => {}, 1 << 30);
