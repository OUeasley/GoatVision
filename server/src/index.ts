import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { initializeDatabase } from './config/clickhouse';
import metricsRoutes from './routes/metrics';
import { toNodeHandler } from "better-auth/node";
import { auth } from './config/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error',
    message: err.message || 'Something went wrong on the server'
  });
});


// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true, // Enable credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/metrics', metricsRoutes);


// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});



// Initialize database and then start server
(async () => {
  try {
    await initializeDatabase();
    
    // Start server
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();

export default app; 