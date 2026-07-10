import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
// MongoDB fallback is handled by the environment; the server will use the configured URI when available.
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import { seedAdmin } from './utils/seedAdmin.js';
import { setDbMode } from './utils/storage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'http://localhost:5000'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/api/health', (_req, res) => res.json({ ok: true, message: 'CRM API running' }));
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini-crm';
    try {
      await mongoose.connect(mongoUri);
      setDbMode('mongoose');
      await seedAdmin();
    } catch (dbErr) {
      console.warn('MongoDB unavailable, switching to memory mode:', dbErr.message);
      setDbMode('memory');
      await seedAdmin();
    }

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

startServer();
