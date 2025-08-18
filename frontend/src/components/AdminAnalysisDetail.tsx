import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminService } from '../services/adminService';
import { AnalysisResult } from '../lib/database';
import Button from './ui/Button';
import Card from './ui/Card';
import { cn } from '../lib/utils';

const AdminAnalysisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadAnalysis(id);
    }
  }, [id]);

  const loadAnalysis = async (analysisId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await AdminService.getAnalysisById(analysisId);
      if (result) {
        setAnalysis(result);
      } else {
        setError('分析結果が見つかりません');
      }
    } catch (err) {
      console.error('分析詳細取得エラー:', err);
      setError('分析結果の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!analysis || !id) return;

    const confirmed = confirm(
      `分析結果を削除しますか？\n\nURL: ${analysis.url}\n分析ID: ${id}\n\nこの操作は取り消せません。`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const success = await AdminService.deleteAnalysis(id);
      
      if (success) {
        alert('分析結果が削除されました');
        navigate('/admin/dashboard');
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除処理中にエラーが発生しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status: AnalysisResult['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">完了</span>;
      case 'processing':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">処理中</span>;
      case 'pending':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">待機中</span>;
      case 'failed':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">失敗</span>;
      default:
        return null;
    }
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
            分析詳細を読み込み中...
          </h2>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-2xl font-bold text-slate-200 mb-4">分析結果が見つかりません</h2>
          <p className="text-slate-400 mb-8">{error}</p>
          <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
            ダッシュボードに戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="bg-slate-900/80 backdrop-blur-xl shadow-xl border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← ダッシュボード
                </button>
                <span className="text-slate-600">|</span>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  分析詳細
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <p className="text-slate-300 font-medium">{analysis.url}</p>
                {getStatusBadge(analysis.status)}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                variant="danger"
                size="sm"
              >
                {isDeleting ? '削除中...' : '🗑️ 削除'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 基本情報 */}
          <div className="lg:col-span-1">
            <Card title="基本情報" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400">分析ID</label>
                  <p className="text-sm font-mono text-slate-200 break-all">{analysis.analysisId}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">URL</label>
                  <p className="text-sm text-slate-200 break-all">{analysis.url}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">ステータス</label>
                  <div className="mt-1">{getStatusBadge(analysis.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">開始日時</label>
                  <p className="text-sm text-slate-200">{formatDate(analysis.startedAt)}</p>
                </div>
                {analysis.completedAt && (
                  <div>
                    <label className="text-sm text-slate-400">完了日時</label>
                    <p className="text-sm text-slate-200">{formatDate(analysis.completedAt)}</p>
                  </div>
                )}
                {analysis.error && (
                  <div>
                    <label className="text-sm text-slate-400">エラー</label>
                    <p className="text-sm text-red-400">{analysis.error}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* メタデータ */}
            {analysis.metadata && (
              <Card title="メタデータ" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                <div className="space-y-3">
                  {analysis.metadata.totalPages && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">総ページ数</span>
                      <span className="text-sm text-slate-200">{analysis.metadata.totalPages}</span>
                    </div>
                  )}
                  {analysis.metadata.pagesAnalyzed && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">分析済みページ</span>
                      <span className="text-sm text-slate-200">{analysis.metadata.pagesAnalyzed}</span>
                    </div>
                  )}
                  {analysis.metadata.errorCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">エラー数</span>
                      <span className="text-sm text-red-400">{analysis.metadata.errorCount}</span>
                    </div>
                  )}
                  {analysis.metadata.duration && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">分析時間</span>
                      <span className="text-sm text-slate-200">{analysis.metadata.duration.toFixed(1)}秒</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* 分析結果 */}
          <div className="lg:col-span-2">
            {analysis.overallScore && (
              <Card title="総合評価" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 mb-6">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}
                    </div>
                    <div className="text-lg text-slate-400">
                      グレード: <span className="text-slate-200 font-medium">{analysis.grade || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* 各カテゴリの結果 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.seoData && (
                <Card title="SEO分析" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">スコア</span>
                      <span className={`text-xl font-bold ${getScoreColor(analysis.seoData.score)}`}>
                        {analysis.seoData.score}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">問題数</span>
                      <span className="text-sm text-red-400">{analysis.seoData.issues?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">提案数</span>
                      <span className="text-sm text-blue-400">{analysis.seoData.suggestions?.length || 0}</span>
                    </div>
                  </div>
                </Card>
              )}

              {analysis.performanceData && (
                <Card title="パフォーマンス" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">スコア</span>
                      <span className={`text-xl font-bold ${getScoreColor(analysis.performanceData.score)}`}>
                        {analysis.performanceData.score}
                      </span>
                    </div>
                    {analysis.performanceData.metrics?.loadTime && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">読み込み時間</span>
                        <span className="text-sm text-slate-200">{analysis.performanceData.metrics.loadTime.toFixed(2)}s</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">提案数</span>
                      <span className="text-sm text-blue-400">{analysis.performanceData.suggestions?.length || 0}</span>
                    </div>
                  </div>
                </Card>
              )}

              {analysis.securityData && (
                <Card title="セキュリティ" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">スコア</span>
                      <span className={`text-xl font-bold ${getScoreColor(analysis.securityData.score)}`}>
                        {analysis.securityData.score}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">HTTPS</span>
                      <span className={`text-sm ${analysis.securityData.httpsUsage ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.securityData.httpsUsage ? '有効' : '無効'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">脆弱性</span>
                      <span className="text-sm text-red-400">{analysis.securityData.vulnerabilities?.length || 0}</span>
                    </div>
                  </div>
                </Card>
              )}

              {analysis.accessibilityData && (
                <Card title="アクセシビリティ" className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">スコア</span>
                      <span className={`text-xl font-bold ${getScoreColor(analysis.accessibilityData.score)}`}>
                        {analysis.accessibilityData.score}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">WCAGレベル</span>
                      <span className="text-sm text-slate-200">{analysis.accessibilityData.wcagLevel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">違反数</span>
                      <span className="text-sm text-red-400">{analysis.accessibilityData.violations?.length || 0}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalysisDetail;