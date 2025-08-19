import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { AdminUser } from '../models/AdminUser';

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: '認証トークンが提供されていません'
      });
      return;
    }

    // トークンの検証
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'sitescan-v2-default-jwt-secret-change-in-production'
    ) as any;

    // ユーザーの存在確認
    const adminUserRepository = AppDataSource.getRepository(AdminUser);
    const adminUser = await adminUserRepository.findOne({
      where: { 
        id: decoded.userId, 
        isActive: true 
      }
    });

    if (!adminUser) {
      res.status(401).json({
        success: false,
        error: '無効な認証トークンです'
      });
      return;
    }

    // リクエストにユーザー情報を追加
    req.adminUser = adminUser;
    next();

  } catch (error) {
    console.error('認証エラー:', error);
    res.status(401).json({
      success: false,
      error: '認証に失敗しました'
    });
  }
};