import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import habitRoutes from './routes/habits';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
