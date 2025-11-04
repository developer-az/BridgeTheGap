import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import connectionsRouter from './routes/connections';
import scheduleRouter from './routes/schedule';
import travelRouter from './routes/travel';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', usersRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/travel', travelRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

