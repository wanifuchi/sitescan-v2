import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { AdminUser } from '../models/AdminUser';
import { Analysis } from '../models/Analysis';

export class AdminController {
  private adminUserRepository: Repository<AdminUser>;
  private analysisRepository: Repository<Analysis>;

  constructor() {
    this.adminUserRepository = AppDataSource.getRepository(AdminUser);
    this.analysisRepository = AppDataSource.getRepository(Analysis);
  }

  /**
   * 管理者ログイン
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'ユーザー名とパスワードが必要です'
        });
        return;
      }

      // ユーザー検索
      const adminUser = await this.adminUserRepository.findOne({
        where: { username }
      });

      if (!adminUser || !adminUser.isActive) {
        res.status(401).json({
          success: false,
          error: '認証に失敗しました'
        });
        return;
      }

      // ログイン試行回数チェック
      if (adminUser.lockedUntil && adminUser.lockedUntil > new Date()) {
        res.status(423).json({
          success: false,
          error: 'アカウントがロックされています。しばらく待ってから再試行してください。'
        });
        return;
      }

      // パスワード検証
      const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);

      if (!isPasswordValid) {
        // ログイン試行回数を増加
        adminUser.loginAttempts = (adminUser.loginAttempts || 0) + 1;
        
        if (adminUser.loginAttempts >= 5) {
          adminUser.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15分ロック
        }
        
        await this.adminUserRepository.save(adminUser);

        res.status(401).json({
          success: false,
          error: '認証に失敗しました'
        });
        return;
      }

      // ログイン成功 - 試行回数をリセット
      adminUser.loginAttempts = 0;
      adminUser.lockedUntil = null;
      adminUser.lastLoginAt = new Date();
      adminUser.lastLoginIp = req.ip;
      await this.adminUserRepository.save(adminUser);

      // JWTトークン生成
      const token = jwt.sign(
        { 
          userId: adminUser.id, 
          username: adminUser.username,
          role: adminUser.role 
        },
        process.env.JWT_SECRET || 'sitescan-admin-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          lastLoginAt: adminUser.lastLoginAt
        }
      });

    } catch (error) {
      console.error('管理者ログインエラー:', error);
      res.status(500).json({
        success: false,
        error: 'サーバーエラーが発生しました'
      });
    }
  }

  /**
   * トークン検証
   */
  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({ success: false, error: 'トークンが提供されていません' });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sitescan-admin-secret') as any;
      
      const adminUser = await this.adminUserRepository.findOne({
        where: { id: decoded.userId, isActive: true }
      });

      if (!adminUser) {
        res.status(401).json({ success: false, error: '無効なトークンです' });
        return;
      }

      res.json({ success: true, valid: true });

    } catch (error) {
      res.status(401).json({ success: false, error: 'トークンの検証に失敗しました' });
    }
  }

  /**
   * 分析統計取得
   */
  async getAnalysisStats(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 基本統計
      const totalAnalyses = await this.analysisRepository.count();
      const todayAnalyses = await this.analysisRepository.count({
        where: {
          startedAt: {
            gte: today
          } as any
        }
      });

      // ユニークユーザー数
      const uniqueUsersResult = await this.analysisRepository
        .createQueryBuilder('analysis')
        .select('COUNT(DISTINCT analysis.userFingerprint)', 'count')
        .where('analysis.userFingerprint IS NOT NULL')
        .getRawOne();
      
      const uniqueUsers = parseInt(uniqueUsersResult?.count || '0');

      // 完了した分析のみでの成功率計算
      const completedAnalyses = await this.analysisRepository.count({
        where: { status: 'completed' }
      });
      const failedAnalyses = await this.analysisRepository.count({
        where: { status: 'failed' }
      });
      const successRate = totalAnalyses > 0 ? (completedAnalyses / (completedAnalyses + failedAnalyses)) * 100 : 0;

      // 人気URL（上位10）
      const popularUrlsResult = await this.analysisRepository
        .createQueryBuilder('analysis')
        .select([
          'analysis.url as url',
          'COUNT(*) as count',
          'MAX(analysis.startedAt) as lastAnalyzed',
          'COUNT(DISTINCT analysis.userFingerprint) as uniqueUsers'
        ])
        .groupBy('analysis.url')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      const popularUrls = popularUrlsResult.map(item => ({
        url: item.url,
        count: parseInt(item.count),
        lastAnalyzed: item.lastanalyzed,
        uniqueUsers: parseInt(item.uniqueusers || '0')
      }));

      // 最近の分析（上位20）
      const recentAnalysesResult = await this.analysisRepository
        .createQueryBuilder('analysis')
        .select([
          'analysis.id as id',
          'analysis.url as url',
          'analysis.overallScore as score',
          'analysis.completedAt as completedAt',
          'analysis.userFingerprint as userFingerprint'
        ])
        .where('analysis.status = :status', { status: 'completed' })
        .andWhere('analysis.overallScore IS NOT NULL')
        .orderBy('analysis.completedAt', 'DESC')
        .limit(20)
        .getRawMany();

      const recentAnalyses = recentAnalysesResult.map(item => ({
        id: item.id,
        url: item.url,
        score: item.score || 0,
        completedAt: item.completedat,
        userFingerprint: item.userfingerprint || 'unknown'
      }));

      // エラー統計
      const errorStatsResult = await this.analysisRepository
        .createQueryBuilder('analysis')
        .select('analysis.error', 'error')
        .addSelect('COUNT(*)', 'count')
        .where('analysis.status = :status', { status: 'failed' })
        .andWhere('analysis.error IS NOT NULL')
        .groupBy('analysis.error')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      const errorsByType = errorStatsResult.map(item => ({
        type: item.error || 'Unknown Error',
        count: parseInt(item.count)
      }));

      // パフォーマンス指標
      const avgAnalysisTimeResult = await this.analysisRepository
        .createQueryBuilder('analysis')
        .select('AVG(EXTRACT(EPOCH FROM (analysis.completedAt - analysis.startedAt)))', 'avgTime')
        .where('analysis.status = :status', { status: 'completed' })
        .andWhere('analysis.completedAt IS NOT NULL')
        .getRawOne();

      const averageAnalysisTime = parseFloat(avgAnalysisTimeResult?.avgTime || '0');
      const totalErrors = await this.analysisRepository.count({ where: { status: 'failed' } });

      res.json({
        success: true,
        data: {
          totalAnalyses,
          todayAnalyses,
          uniqueUsers,
          popularUrls,
          recentAnalyses,
          errorStats: {
            totalErrors,
            errorsByType
          },
          performanceMetrics: {
            successRate,
            averageAnalysisTime
          }
        }
      });

    } catch (error) {
      console.error('分析統計取得エラー:', error);
      res.status(500).json({
        success: false,
        error: 'データの取得に失敗しました'
      });
    }
  }

  /**
   * 分析詳細取得
   */
  async getAnalysisById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const analysis = await this.analysisRepository.findOne({
        where: { id }
      });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: '分析結果が見つかりません'
        });
        return;
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('分析詳細取得エラー:', error);
      res.status(500).json({
        success: false,
        error: 'データの取得に失敗しました'
      });
    }
  }

  /**
   * 分析削除
   */
  async deleteAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const analysis = await this.analysisRepository.findOne({
        where: { id }
      });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: '分析結果が見つかりません'
        });
        return;
      }

      await this.analysisRepository.remove(analysis);

      res.json({
        success: true,
        message: '分析結果が削除されました'
      });

    } catch (error) {
      console.error('分析削除エラー:', error);
      res.status(500).json({
        success: false,
        error: '削除に失敗しました'
      });
    }
  }

  /**
   * すべてのデータをエクスポート
   */
  async exportAllData(req: Request, res: Response): Promise<void> {
    try {
      const { format } = req.query;

      const analyses = await this.analysisRepository.find({
        order: { startedAt: 'DESC' }
      });

      if (format === 'csv') {
        const csv = this.convertToCSV(analyses);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sitescan-export-${Date.now()}.csv"`);
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="sitescan-export-${Date.now()}.json"`);
        res.json({
          export_date: new Date().toISOString(),
          total_analyses: analyses.length,
          data: analyses
        });
      }

    } catch (error) {
      console.error('データエクスポートエラー:', error);
      res.status(500).json({
        success: false,
        error: 'エクスポートに失敗しました'
      });
    }
  }

  private convertToCSV(analyses: Analysis[]): string {
    const headers = [
      'ID', 'URL', 'Status', 'Overall Score', 'Grade', 'Started At', 'Completed At',
      'User Fingerprint', 'User IP', 'Error', 'SEO Score', 'Performance Score', 'Security Score', 'Accessibility Score'
    ];

    const rows = analyses.map(analysis => [
      analysis.id,
      analysis.url,
      analysis.status,
      analysis.overallScore || '',
      analysis.grade || '',
      analysis.startedAt.toISOString(),
      analysis.completedAt?.toISOString() || '',
      analysis.userFingerprint || '',
      analysis.userIp || '',
      analysis.error || '',
      analysis.seoData?.score || '',
      analysis.performanceData?.score || '',
      analysis.securityData?.score || '',
      analysis.accessibilityData?.score || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
}