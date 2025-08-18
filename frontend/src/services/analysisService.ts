import { v4 as uuidv4 } from 'uuid';
import { db, AnalysisResult, UserSettings } from '../lib/database';
import { useLiveQuery } from 'dexie-react-hooks';

// 分析サービスクラス
export class AnalysisService {
  
  // 新しい分析を開始
  static async startAnalysis(url: string): Promise<string> {
    const analysisId = uuidv4();
    
    try {
      const analysis: AnalysisResult = {
        analysisId,
        url: this.normalizeUrl(url),
        status: 'pending',
        startedAt: new Date(),
      };

      await db.analyses.add(analysis);
      
      // バックエンドに分析リクエストを送信
      await this.requestBackendAnalysis(analysisId, url);
      
      return analysisId;
    } catch (error) {
      console.error('分析開始エラー:', error);
      throw new Error(`分析の開始に失敗しました: ${error.message}`);
    }
  }

  // バックエンドに分析をリクエスト
  private static async requestBackendAnalysis(analysisId: string, url: string): Promise<void> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/analysis/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          analysisId,
          url,
          clientMode: 'browser-storage' // ブラウザストレージモードを指定
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '分析リクエストが失敗しました');
      }

      // 分析状態を処理中に更新
      await this.updateAnalysisStatus(analysisId, 'processing');
      
    } catch (error) {
      // エラー状態に更新
      await this.updateAnalysisStatus(analysisId, 'failed', error.message);
      throw error;
    }
  }

  // 分析状態を更新
  static async updateAnalysisStatus(
    analysisId: string, 
    status: AnalysisResult['status'], 
    error?: string
  ): Promise<void> {
    try {
      const updates: Partial<AnalysisResult> = {
        status,
        ...(error && { error }),
        ...(status === 'completed' && { completedAt: new Date() }),
      };

      await db.analyses
        .where('analysisId')
        .equals(analysisId)
        .modify(updates);
        
    } catch (dbError) {
      console.error('分析状態更新エラー:', dbError);
    }
  }

  // 分析結果を保存
  static async saveAnalysisResult(analysisId: string, result: Partial<AnalysisResult>): Promise<void> {
    try {
      await db.analyses
        .where('analysisId')
        .equals(analysisId)
        .modify({
          ...result,
          status: 'completed',
          completedAt: new Date(),
        });
        
      console.log(`✅ 分析結果が保存されました: ${analysisId}`);
    } catch (error) {
      console.error('分析結果保存エラー:', error);
      throw error;
    }
  }

  // 分析結果を取得
  static async getAnalysis(analysisId: string): Promise<AnalysisResult | undefined> {
    try {
      return await db.analyses
        .where('analysisId')
        .equals(analysisId)
        .first();
    } catch (error) {
      console.error('分析結果取得エラー:', error);
      return undefined;
    }
  }

  // 分析履歴を取得
  static async getAnalysisHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<AnalysisResult[]> {
    try {
      return await db.analyses
        .orderBy('startedAt')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('分析履歴取得エラー:', error);
      return [];
    }
  }

  // URL別の分析履歴を取得
  static async getAnalysisHistoryByUrl(url: string): Promise<AnalysisResult[]> {
    try {
      const normalizedUrl = this.normalizeUrl(url);
      return await db.analyses
        .where('url')
        .equals(normalizedUrl)
        .reverse()
        .sortBy('startedAt');
    } catch (error) {
      console.error('URL別分析履歴取得エラー:', error);
      return [];
    }
  }

  // 分析を削除
  static async deleteAnalysis(analysisId: string): Promise<void> {
    try {
      await db.analyses
        .where('analysisId')
        .equals(analysisId)
        .delete();
        
      console.log(`🗑️ 分析結果が削除されました: ${analysisId}`);
    } catch (error) {
      console.error('分析削除エラー:', error);
      throw error;
    }
  }

  // 古い分析結果をクリーンアップ（30日以上前）
  static async cleanupOldAnalyses(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await db.analyses
        .where('startedAt')
        .below(thirtyDaysAgo)
        .delete();

      if (deletedCount > 0) {
        console.log(`🧹 ${deletedCount}件の古い分析結果をクリーンアップしました`);
      }

      return deletedCount;
    } catch (error) {
      console.error('クリーンアップエラー:', error);
      return 0;
    }
  }

  // 統計情報を取得
  static async getAnalysisStats() {
    try {
      const [total, completed, failed, today] = await Promise.all([
        db.analyses.count(),
        db.analyses.where('status').equals('completed').count(),
        db.analyses.where('status').equals('failed').count(),
        db.analyses.where('startedAt').above(this.getStartOfToday()).count(),
      ]);

      return {
        total,
        completed,
        failed,
        today,
        successRate: total > 0 ? (completed / total) * 100 : 0,
      };
    } catch (error) {
      console.error('統計情報取得エラー:', error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        today: 0,
        successRate: 0,
      };
    }
  }

  // 人気URLを取得
  static async getPopularUrls(limit: number = 10): Promise<Array<{url: string; count: number; lastAnalyzed: Date}>> {
    try {
      const analyses = await db.analyses
        .where('status')
        .equals('completed')
        .toArray();

      const urlCounts = analyses.reduce((acc, analysis) => {
        if (!acc[analysis.url]) {
          acc[analysis.url] = {
            count: 0,
            lastAnalyzed: analysis.startedAt,
          };
        }
        acc[analysis.url].count++;
        if (analysis.startedAt > acc[analysis.url].lastAnalyzed) {
          acc[analysis.url].lastAnalyzed = analysis.startedAt;
        }
        return acc;
      }, {} as Record<string, {count: number; lastAnalyzed: Date}>);

      return Object.entries(urlCounts)
        .map(([url, data]) => ({
          url,
          count: data.count,
          lastAnalyzed: data.lastAnalyzed,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('人気URL取得エラー:', error);
      return [];
    }
  }

  // URLを正規化
  private static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.href;
    } catch {
      return url;
    }
  }

  // 今日の開始時刻を取得
  private static getStartOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
}

// React Hooks for live queries
export function useAnalysisHistory(limit?: number) {
  return useLiveQuery(async () => {
    return await AnalysisService.getAnalysisHistory(limit);
  }, [limit]);
}

export function useAnalysis(analysisId: string) {
  return useLiveQuery(async () => {
    if (!analysisId) return undefined;
    return await AnalysisService.getAnalysis(analysisId);
  }, [analysisId]);
}

export function useAnalysisStats() {
  return useLiveQuery(async () => {
    return await AnalysisService.getAnalysisStats();
  });
}

export function usePopularUrls(limit?: number) {
  return useLiveQuery(async () => {
    return await AnalysisService.getPopularUrls(limit);
  }, [limit]);
}

// 設定管理サービス
export class SettingsService {
  
  // 設定を取得
  static async getSettings(): Promise<UserSettings | undefined> {
    try {
      return await db.settings.orderBy('id').last();
    } catch (error) {
      console.error('設定取得エラー:', error);
      return undefined;
    }
  }

  // 設定を更新
  static async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      const existing = await this.getSettings();
      if (existing?.id) {
        await db.settings.update(existing.id, {
          ...settings,
          updatedAt: new Date(),
        });
      } else {
        await db.settings.add({
          ...settings as UserSettings,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('設定更新エラー:', error);
      throw error;
    }
  }
}

export function useSettings() {
  return useLiveQuery(async () => {
    return await SettingsService.getSettings();
  });
}