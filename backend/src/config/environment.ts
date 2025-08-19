// 環境変数の設定とデフォルト値
export const config = {
  // アプリケーション設定
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3002,
  appName: process.env.APP_NAME || 'SiteScan V2 API',
  appVersion: process.env.APP_VERSION || '2.0.0',

  // データベース設定
  databaseUrl: process.env.DATABASE_URL || 
                process.env.DATABASE_PUBLIC_URL || 
                process.env.POSTGRES_URL ||
                process.env.DATABASE_PRIVATE_URL,

  // JWT認証設定
  jwtSecret: process.env.JWT_SECRET || 'sitescan-v2-default-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // 管理者認証設定
  adminDefaultUsername: process.env.ADMIN_DEFAULT_USERNAME || 'admin',
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'SiteScan2024Admin!',
  adminDefaultEmail: process.env.ADMIN_DEFAULT_EMAIL || 'admin@sitescan.local',

  // セキュリティ設定
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // CORS設定
  corsOrigin: process.env.CORS_ORIGIN || 'https://site-scan-v2.vercel.app',

  // ログ設定
  logLevel: process.env.LOG_LEVEL || 'info',
};

// 環境変数の検証
export function validateEnvironment(): void {
  const requiredEnvVars = [];
  const warnings: string[] = [];

  // データベースURLの確認
  if (!config.databaseUrl) {
    warnings.push('No database URL found. Using local development database.');
  }

  // JWT Secretの確認
  if (config.jwtSecret === 'sitescan-v2-default-jwt-secret-change-in-production' && 
      config.nodeEnv === 'production') {
    warnings.push('Using default JWT secret in production. Please set JWT_SECRET environment variable.');
  }

  // 警告を出力
  if (warnings.length > 0) {
    console.log('⚠️ Environment Configuration Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
}