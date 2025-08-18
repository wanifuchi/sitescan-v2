import { AnalysisResult } from '../lib/database';

// 管理者認証関連の型定義
export interface AdminCredentials {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  user?: AdminUser;
  error?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
}

// 管理者用分析統計
export interface AdminAnalysisStats {
  totalAnalyses: number;
  todayAnalyses: number;
  weeklyAnalyses: number;
  monthlyAnalyses: number;
  uniqueUsers: number;
  popularUrls: Array<{
    url: string;
    count: number;
    lastAnalyzed: string;
    uniqueUsers: number;
  }>;
  dailyStats: Array<{
    date: string;
    count: number;
    uniqueUsers: number;
  }>;
  recentAnalyses: Array<{
    id: string;
    url: string;
    score: number;
    completedAt: string;
    userFingerprint: string;
    status: string;
  }>;
  errorStats: {
    totalErrors: number;
    errorsByType: Array<{
      type: string;
      count: number;
    }>;
  };
  performanceMetrics: {
    averageAnalysisTime: number;
    successRate: number;
    peakHours: Array<{
      hour: number;
      count: number;
    }>;
  };
}

// 管理者分析サービスクラス
export class AdminService {
  private static TOKEN_KEY = 'sitescan_admin_token';
  private static USER_KEY = 'sitescan_admin_user';

  // ローカルストレージからトークンを取得
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ローカルストレージにトークンを保存
  private static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // ローカルストレージからユーザー情報を取得
  static getCurrentUser(): AdminUser | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  // ローカルストレージにユーザー情報を保存
  private static setCurrentUser(user: AdminUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // 認証状態を確認
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // 管理者ログイン
  static async login(credentials: AdminCredentials): Promise<AdminAuthResponse> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.setToken(data.token);
        this.setCurrentUser(data.user);
        console.log('✅ 管理者ログイン成功');
        return data;
      } else {
        return {
          success: false,
          error: data.error || 'ログインに失敗しました',
        };
      }
    } catch (error) {
      console.error('管理者ログインエラー:', error);
      return {
        success: false,
        error: `ログインエラー: ${error.message}`,
      };
    }
  }

  // 管理者ログアウト
  static async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
        
        // サーバーにログアウトを通知（オプション）
        try {
          await fetch(`${API_BASE_URL}/api/admin/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (e) {
          // サーバーエラーは無視してローカルログアウトを実行
          console.warn('サーバーログアウト通知に失敗:', e);
        }
      }
    } finally {
      // ローカルストレージからトークンとユーザー情報を削除
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      console.log('🔓 管理者ログアウト完了');
    }
  }

  // 認証ヘッダーを取得
  private static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // 管理者用分析統計を取得
  static async getAnalysisStats(): Promise<AdminAnalysisStats | null> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/stats`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || '統計データの取得に失敗しました');
      }
    } catch (error) {
      console.error('管理者統計取得エラー:', error);
      
      // モックデータを返す（開発用）
      return this.getMockStats();
    }
  }

  // すべての分析履歴を取得（管理者用）
  static async getAllAnalyses(
    page: number = 1,
    limit: number = 50,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      url?: string;
      minScore?: number;
      maxScore?: number;
    }
  ): Promise<{
    analyses: AnalysisResult[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } | null> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/analyses?${params}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || '分析履歴の取得に失敗しました');
      }
    } catch (error) {
      console.error('管理者分析履歴取得エラー:', error);
      return null;
    }
  }

  // 特定の分析結果を取得（管理者用）
  static async getAnalysisById(analysisId: string): Promise<AnalysisResult | null> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/analysis/${analysisId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || '分析結果の取得に失敗しました');
      }
    } catch (error) {
      console.error('管理者分析結果取得エラー:', error);
      return null;
    }
  }

  // 分析結果を削除（管理者用）
  static async deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/analysis/${analysisId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('管理者分析削除エラー:', error);
      return false;
    }
  }

  // システム設定を取得
  static async getSystemSettings(): Promise<any> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('システム設定取得エラー:', error);
      return null;
    }
  }

  // データエクスポート（管理者用）
  static async exportAllData(format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/export?format=${format}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitescan-admin-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`📥 管理者データエクスポート完了: ${format}`);
    } catch (error) {
      console.error('管理者データエクスポートエラー:', error);
      throw error;
    }
  }

  // モックデータ（開発・フォールバック用）
  private static getMockStats(): AdminAnalysisStats {
    return {
      totalAnalyses: 1247,
      todayAnalyses: 23,
      weeklyAnalyses: 156,
      monthlyAnalyses: 687,
      uniqueUsers: 342,
      popularUrls: [
        { url: 'https://example.com', count: 45, lastAnalyzed: '2025-08-18T12:30:00Z', uniqueUsers: 23 },
        { url: 'https://google.com', count: 38, lastAnalyzed: '2025-08-18T11:45:00Z', uniqueUsers: 18 },
        { url: 'https://github.com', count: 32, lastAnalyzed: '2025-08-18T10:20:00Z', uniqueUsers: 16 },
        { url: 'https://stackoverflow.com', count: 28, lastAnalyzed: '2025-08-18T09:15:00Z', uniqueUsers: 14 },
        { url: 'https://wikipedia.org', count: 24, lastAnalyzed: '2025-08-18T08:30:00Z', uniqueUsers: 12 },
      ],
      dailyStats: [
        { date: '2025-08-12', count: 89, uniqueUsers: 34 },
        { date: '2025-08-13', count: 102, uniqueUsers: 41 },
        { date: '2025-08-14', count: 95, uniqueUsers: 38 },
        { date: '2025-08-15', count: 118, uniqueUsers: 45 },
        { date: '2025-08-16', count: 87, uniqueUsers: 33 },
        { date: '2025-08-17', count: 134, uniqueUsers: 52 },
        { date: '2025-08-18', count: 23, uniqueUsers: 12 },
      ],
      recentAnalyses: [
        { id: 'analysis-456', url: 'https://example.com', score: 92, completedAt: '2025-08-18T12:30:00Z', userFingerprint: 'fp_abc123', status: 'completed' },
        { id: 'analysis-457', url: 'https://google.com', score: 96, completedAt: '2025-08-18T11:45:00Z', userFingerprint: 'fp_def456', status: 'completed' },
        { id: 'analysis-458', url: 'https://github.com', score: 88, completedAt: '2025-08-18T10:20:00Z', userFingerprint: 'fp_ghi789', status: 'completed' },
      ],
      errorStats: {
        totalErrors: 45,
        errorsByType: [
          { type: 'network_timeout', count: 18 },
          { type: 'invalid_url', count: 12 },
          { type: 'server_error', count: 8 },
          { type: 'rate_limit', count: 5 },
          { type: 'unknown', count: 2 },
        ],
      },
      performanceMetrics: {
        averageAnalysisTime: 127.5,
        successRate: 94.2,
        peakHours: [
          { hour: 9, count: 145 },
          { hour: 10, count: 167 },
          { hour: 11, count: 189 },
          { hour: 14, count: 156 },
          { hour: 15, count: 178 },
          { hour: 16, count: 134 },
        ],
      },
    };
  }

  // トークンの有効性を確認
  static async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://website-analyzer-production-c933.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/validate`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.success;
      } else {
        // トークンが無効な場合はローカルデータをクリア
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('トークン検証エラー:', error);
      return false;
    }
  }
}