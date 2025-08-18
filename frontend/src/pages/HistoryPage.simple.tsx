import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { useAnalysisHistory, AnalysisService } from '../services/analysisService';
import { DataService } from '../services/dataService';
import { AnalysisResult } from '../lib/database';

const HistoryPageSimple: React.FC = () => {
  const analyses = useAnalysisHistory(50) || [];
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleScreenshot = async () => {
    try {
      const element = document.body;
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 1,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      const link = document.createElement('a');
      link.download = `sitescan-history-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      showMessage('success', 'スクリーンショットが保存されました');
    } catch (error) {
      console.error('スクリーンショットエラー:', error);
      showMessage('error', 'スクリーンショットの保存に失敗しました');
    }
  };

  const handleExportCSV = async () => {
    if (analyses.length === 0) {
      showMessage('error', 'エクスポートする履歴がありません');
      return;
    }

    setIsExporting(true);
    try {
      await DataService.exportToCSV();
      showMessage('success', 'CSVファイルがダウンロードされました');
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      showMessage('error', `CSVエクスポートに失敗しました: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('この分析結果を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      await AnalysisService.deleteAnalysis(analysisId);
      showMessage('success', '分析結果が削除されました');
    } catch (error) {
      console.error('削除エラー:', error);
      showMessage('error', '削除に失敗しました');
    }
  };

  const handleReAnalysis = async (url: string) => {
    try {
      const analysisId = await AnalysisService.startAnalysis(url);
      showMessage('success', '再分析を開始しました');
      // 分析ページにリダイレクト
      window.location.href = `/analysis/${analysisId}`;
    } catch (error) {
      console.error('再分析エラー:', error);
      showMessage('error', `再分析の開始に失敗しました: ${error.message}`);
    }
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}分前`;
    } else if (hours < 24) {
      return `${hours}時間前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // 統計情報を計算
  const stats = {
    total: analyses.length,
    completed: analyses.filter(a => a.status === 'completed').length,
    processing: analyses.filter(a => a.status === 'processing').length,
    failed: analyses.filter(a => a.status === 'failed').length,
    averageScore: analyses.filter(a => a.overallScore).length > 0 
      ? Math.round(analyses.filter(a => a.overallScore).reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyses.filter(a => a.overallScore).length)
      : 0,
    successRate: analyses.length > 0 ? Math.round((analyses.filter(a => a.status === 'completed').length / analyses.length) * 100) : 0,
  };

  if (analyses === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500/30 border-t-cyan-400"></div>
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">履歴を読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <div className="bg-slate-900/80 backdrop-blur-xl shadow-xl border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                分析履歴
              </h1>
              <p className="text-slate-400 mt-2">ブラウザに保存された分析結果</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportCSV}
                disabled={isExporting || analyses.length === 0}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-lg hover:shadow-green-500/25 font-medium text-sm disabled:opacity-50"
              >
                📊 CSV出力
              </button>
              <button
                onClick={handleScreenshot}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 font-medium text-sm"
              >
                📸 スクリーンショット
              </button>
              <Link 
                to="/" 
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-medium text-sm"
              >
                新しい分析
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? "bg-green-900/30 border-green-500/50 text-green-300" 
              : "bg-red-900/30 border-red-500/50 text-red-300"
          }`}>
            {message.text}
          </div>
        )}

        {/* 統計情報 */}
        {analyses.length > 0 && (
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl">
              <div className="text-xs text-slate-400 mb-1">総分析数</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {stats.total}
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl">
              <div className="text-xs text-slate-400 mb-1">完了</div>
              <div className="text-2xl font-bold text-green-400">
                {stats.completed}
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl">
              <div className="text-xs text-slate-400 mb-1">処理中</div>
              <div className="text-2xl font-bold text-blue-400">
                {stats.processing}
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl">
              <div className="text-xs text-slate-400 mb-1">失敗</div>
              <div className="text-2xl font-bold text-red-400">
                {stats.failed}
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl">
              <div className="text-xs text-slate-400 mb-1">成功率</div>
              <div className="text-2xl font-bold text-green-400">
                {stats.successRate}%
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl">
              <div className="text-xs text-slate-400 mb-1">平均スコア</div>
              <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore}
              </div>
            </div>
          </div>
        )}

        {analyses.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center shadow-2xl">
            <div className="text-6xl mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">📊</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-3">
              まだ分析履歴がありません
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              ウェブサイトの分析を開始して、パフォーマンス、セキュリティ、アクセシビリティを解析しましょう。
              すべてのデータはブラウザ内に安全に保存されます。
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-medium text-lg"
            >
              分析を開始
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      スコア
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      分析日時
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/30 divide-y divide-slate-700/30">
                  {analyses.map((analysis) => (
                    <tr key={analysis.analysisId} className="hover:bg-slate-700/30 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-200 max-w-xs truncate" title={analysis.url}>
                          {analysis.url}
                        </div>
                        <div className="text-xs text-slate-400">ID: {analysis.analysisId.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(analysis.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {analysis.overallScore ? (
                          <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                            {analysis.overallScore}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatDate(analysis.startedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {analysis.status === 'completed' ? (
                            <>
                              <Link
                                to={`/analysis/${analysis.analysisId}`}
                                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                              >
                                詳細
                              </Link>
                              <button
                                onClick={() => handleReAnalysis(analysis.url)}
                                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                              >
                                再分析
                              </button>
                            </>
                          ) : analysis.status === 'processing' ? (
                            <span className="text-slate-400">処理中...</span>
                          ) : analysis.status === 'failed' ? (
                            <button
                              onClick={() => handleReAnalysis(analysis.url)}
                              className="text-orange-400 hover:text-orange-300 transition-colors duration-200"
                            >
                              再試行
                            </button>
                          ) : (
                            <span className="text-slate-400">待機中...</span>
                          )}
                          <button
                            onClick={() => handleDeleteAnalysis(analysis.analysisId)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200 ml-2"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* プライバシー注記 */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6 shadow-xl">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-cyan-400 text-xl">🔒</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-slate-200 mb-2">プライバシー保護</h3>
              <p className="text-sm text-slate-400">
                すべての分析結果はあなたのブラウザ内にのみ保存されており、外部サーバーには送信されません。
                ブラウザのデータを削除すると、すべての履歴が消去されます。
                重要なデータは定期的にエクスポートすることをお勧めします。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPageSimple;