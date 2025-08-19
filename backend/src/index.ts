import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initializeDatabase } from './config/database';
import { logger } from './utils/logger';
import { validateEnvironment } from './config/environment';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import analysisRoutes from './routes/analysisRoutes';
import adminRoutes from './routes/adminRoutes';
import './workers/analysisWorker';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
// CORS設定 - より包括的に設定
app.use(cors({
  origin: (origin, callback) => {
    // 開発環境では全てのオリジンを許可
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // 本番環境では特定のドメインのみ許可
    const allowedOrigins = [
      'https://site-scan-v2.vercel.app',
      'https://website-analyzer-frontend.vercel.app',
      'https://toneya-analysis-v1-frontend.vercel.app'
    ];
    
    // オリジンが存在しない場合（直接API呼び出し）も許可
    if (!origin) return callback(null, true);
    
    // Vercelのプレビュードメインも許可
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/analysis', analysisRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SiteScan V2 API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.1'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    console.log('🔥 Starting SiteScan V2 server initialization...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Port:', PORT);
    
    // 環境変数の検証
    validateEnvironment();
    
    // 環境変数デバッグ
    console.log('📊 Environment Variables Debug:');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_PUBLIC_URL exists:', !!process.env.DATABASE_PUBLIC_URL);
    console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
    console.log('DATABASE_PRIVATE_URL exists:', !!process.env.DATABASE_PRIVATE_URL);
    console.log('Available env keys:', Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('DB')
    ));
    
    console.log('🔌 Initializing database connection...');
    const dbUrl = process.env.DATABASE_URL || 
                  process.env.DATABASE_PUBLIC_URL || 
                  process.env.POSTGRES_URL ||
                  process.env.DATABASE_PRIVATE_URL;
    if (dbUrl) {
      console.log('Using database URL:', dbUrl.substring(0, 30) + '...');
    } else {
      console.log('⚠️ No database URL found!');
    }
    
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SiteScan V2 Server is running on port ${PORT}`);
      logger.info(`Server is running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();