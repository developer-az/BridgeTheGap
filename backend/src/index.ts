import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import scheduleRoutes from './routes/schedule';
import travelRoutes from './routes/travel';
import connectionRoutes from './routes/connections';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/connections', connectionRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

