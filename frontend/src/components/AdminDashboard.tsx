import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService, AdminAnalysisStats, AdminUser } from '../services/adminService';
import Button from './ui/Button';
import Card from './ui/Card';
import { cn } from '../lib/utils';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminAnalysisStats | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analyses' | 'users' | 'settings'>('overview');
  const navigate = useNavigate();

  useEffect(() => {
    // 認証状態を確認
    if (!AdminService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    setUser(AdminService.getCurrentUser());
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // トークンの有効性を確認
      const isValidToken = await AdminService.validateToken();
      if (!isValidToken) {
        navigate('/admin/login');
        return;
      }

      const statsData = await AdminService.getAnalysisStats();
      setStats(statsData);
    } catch (err) {
      console.error('ダッシュボードデータ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await AdminService.logout();
      navigate('/admin/login');
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      await AdminService.exportAllData(format);
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert(`${format.toUpperCase()}エクスポートに失敗しました`);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ja-JP');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-cyan-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500/30 border-t-cyan-400"></div>
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            管理データを読み込み中...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="bg-slate-900/80 backdrop-blur-xl shadow-xl border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                <span>S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  SiteScan V2 管理システム
                </h1>
                <p className="text-slate-400 text-sm">
                  ようこそ、{user?.username || '管理者'}さん
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => handleExportData('json')}
                variant="outline"
                size="sm"
                className="border-slate-600/50 bg-slate-800/40 text-slate-200 hover:bg-slate-700/50"
              >
                📊 JSON出力
              </Button>
              <Button
                onClick={() => handleExportData('csv')}
                variant="outline"
                size="sm"
                className="border-slate-600/50 bg-slate-800/40 text-slate-200 hover:bg-slate-700/50"
              >
                📈 CSV出力
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-red-600/50 bg-red-900/20 text-red-300 hover:bg-red-800/30"
              >
                🔓 ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: '概要', icon: '📊' },
              { id: 'analyses', label: '分析履歴', icon: '🔍' },
              { id: 'users', label: 'ユーザー', icon: '👥' },
              { id: 'settings', label: '設定', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-6 py-4 text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-700/30"
                    : "text-slate-300 hover:text-slate-200 hover:bg-slate-700/20"
                )}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-400">総分析数</p>
                    <p className="text-2xl font-bold text-slate-200">{formatNumber(stats.totalAnalyses)}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-400">今日の分析</p>
                    <p className="text-2xl font-bold text-slate-200">{formatNumber(stats.todayAnalyses)}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-400">ユニークユーザー</p>
                    <p className="text-2xl font-bold text-slate-200">{formatNumber(stats.uniqueUsers)}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-500/20 rounded-xl">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-400">成功率</p>
                    <p className="text-2xl font-bold text-slate-200">{stats.performanceMetrics.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 人気URL と最近の分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 人気URL */}
              <Card title="人気の分析URL" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                <div className="space-y-3">
                  {stats.popularUrls.map((urlData, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {urlData.url}
                        </p>
                        <p className="text-xs text-slate-400">
                          最終分析: {formatDate(urlData.lastAnalyzed)} | {urlData.uniqueUsers}ユーザー
                        </p>
                      </div>
                      <div className="ml-4 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {urlData.count}回
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 最近の分析 */}
              <Card title="最近の分析" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                <div className="space-y-3">
                  {stats.recentAnalyses.map((analysis, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {analysis.url}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(analysis.completedAt)} | User: {analysis.userFingerprint.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <span className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
                          {analysis.score}
                        </span>
                        <button
                          onClick={() => navigate(`/admin/analysis/${analysis.id}`)}
                          className="text-cyan-400 hover:text-cyan-300 text-xs"
                        >
                          詳細
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* エラー統計 */}
            <Card title="エラー統計" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400 mb-4">エラー種別</p>
                  <div className="space-y-2">
                    {stats.errorStats.errorsByType.map((error, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">{error.type}</span>
                        <span className="text-sm font-medium text-red-400">{error.count}件</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-4">パフォーマンス指標</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">平均分析時間</span>
                      <span className="text-sm font-medium text-blue-400">{stats.performanceMetrics.averageAnalysisTime.toFixed(1)}秒</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">総エラー数</span>
                      <span className="text-sm font-medium text-red-400">{stats.errorStats.totalErrors}件</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analyses' && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">分析履歴管理</h2>
            <p className="text-slate-400">
              すべてのユーザーの分析履歴を表示・管理します。
              この機能は開発中です。
            </p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">ユーザー管理</h2>
            <p className="text-slate-400">
              アクティブユーザーの統計情報を表示します。
              この機能は開発中です。
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">システム設定</h2>
            <p className="text-slate-400">
              システム設定とメンテナンス機能を提供します。
              この機能は開発中です。
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;