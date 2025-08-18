import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService, AdminCredentials } from '../services/adminService';
import Button from './ui/Button';
import Card from './ui/Card';
import { cn } from '../lib/utils';

interface AdminLoginProps {
  onLoginSuccess?: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState<AdminCredentials>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await AdminService.login(credentials);
      
      if (result.success) {
        console.log('✅ 管理者ログイン成功');
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          // デフォルトでは管理ダッシュボードにリダイレクト
          navigate('/admin/dashboard');
        }
      } else {
        setError(result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AdminCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
    // エラーをクリア
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.1),transparent_50%)] -z-10" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* ロゴ */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-2xl text-white font-bold text-xl mb-6 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl opacity-20"></div>
            <span className="relative z-10">S</span>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            管理者ログイン
          </h1>
          <p className="text-slate-400">
            SiteScan V2 管理システム
          </p>
        </div>

        <Card variant="elevated" className="backdrop-blur-xl bg-slate-800/40 border border-slate-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}

            {/* ユーザー名 */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-slate-200">
                ユーザー名
              </label>
              <input
                type="text"
                id="username"
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={cn(
                  "w-full px-4 py-3 text-sm rounded-xl border-2 transition-all duration-300",
                  "focus:ring-4 focus:ring-cyan-500/30 focus:border-cyan-400",
                  "bg-slate-900/50 backdrop-blur-sm text-slate-200 placeholder-slate-400",
                  error ? "border-red-400/50 focus:border-red-400" : "border-slate-600/50"
                )}
                placeholder="管理者ユーザー名を入力"
                required
                autoComplete="username"
              />
            </div>

            {/* パスワード */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 pr-12 text-sm rounded-xl border-2 transition-all duration-300",
                    "focus:ring-4 focus:ring-cyan-500/30 focus:border-cyan-400",
                    "bg-slate-900/50 backdrop-blur-sm text-slate-200 placeholder-slate-400",
                    error ? "border-red-400/50 focus:border-red-400" : "border-slate-600/50"
                  )}
                  placeholder="管理者パスワードを入力"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-200 transition-colors duration-200"
                >
                  {showPassword ? (
                    <span className="text-sm">🙈</span>
                  ) : (
                    <span className="text-sm">👁️</span>
                  )}
                </button>
              </div>
            </div>

            {/* ログインボタン */}
            <Button
              type="submit"
              disabled={isLoading || !credentials.username || !credentials.password}
              loading={isLoading}
              variant="gradient"
              fullWidth
              className="h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                  認証中...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="mr-3">🔐</span>
                  管理者としてログイン
                </span>
              )}
            </Button>

            {/* 注意事項 */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-amber-400 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-slate-200 mb-1">管理者アクセス</h3>
                  <p className="text-xs text-slate-400">
                    このページは認証された管理者のみがアクセスできます。
                    不正アクセスの試行は記録され、監視されています。
                  </p>
                </div>
              </div>
            </div>
          </form>
        </Card>

        {/* フッター */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-200 text-sm transition-colors duration-200"
          >
            ← 一般ユーザー画面に戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;