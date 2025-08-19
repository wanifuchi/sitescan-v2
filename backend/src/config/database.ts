import { DataSource } from 'typeorm';
import { Analysis } from '../models/Analysis';
import { PageData } from '../models/PageData';
import { AdminUser } from '../models/AdminUser';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 
       process.env.DATABASE_PUBLIC_URL || 
       process.env.POSTGRES_URL ||
       process.env.DATABASE_PRIVATE_URL,
  entities: [Analysis, PageData, AdminUser],
  synchronize: true, // 開発・本番ともに自動でテーブルを作成
  logging: process.env.NODE_ENV === 'development',
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};