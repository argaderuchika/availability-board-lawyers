import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import officialRoutes from './routes/officialRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import { seedDatabaseIfEmpty } from './utils/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/availability_board';
const USE_MEMORY_DB = process.env.USE_MEMORY_DB !== 'false';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/officials', officialRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/requests', requestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Chambers Availability Board API',
    time: new Date().toISOString(),
  });
});

// Database connection & startup. Demo mode uses an ephemeral MongoDB instance;
// set USE_MEMORY_DB=false to use the configured local MongoDB URI instead.
const startServer = async () => {
  let memoryServer = null;
  let databaseUri = MONGODB_URI;

  if (USE_MEMORY_DB) {
    memoryServer = await MongoMemoryServer.create();
    databaseUri = memoryServer.getUri('availability_board');
  }

  await mongoose.connect(databaseUri);
  console.log(
    USE_MEMORY_DB
      ? 'Connected to temporary in-memory MongoDB (data resets on restart).'
      : `Connected to MongoDB at ${databaseUri}`
  );

  await seedDatabaseIfEmpty();
  const server = app.listen(PORT, () => {
    console.log(`Availability Board Server running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    await memoryServer?.stop();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};

startServer().catch(async (err) => {
  console.error('Database startup error:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});