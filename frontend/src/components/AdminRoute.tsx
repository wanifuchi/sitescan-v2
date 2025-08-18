import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AdminService } from '../services/adminService';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ローカルストレージの認証状態を確認
        const localAuth = AdminService.isAuthenticated();
        
        if (!localAuth) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // サーバーでトークンの有効性を確認
        const isValidToken = await AdminService.validateToken();
        setIsAuthenticated(isValidToken);
      } catch (error) {
        console.error('認証チェックエラー:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500/30 border-t-cyan-400"></div>
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            認証状態を確認中...
          </h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 現在のURLを state として保存して、ログイン後にリダイレクトできるようにする
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;