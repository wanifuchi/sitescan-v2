# 🚂 Railway デプロイ詳細手順

## 📋 準備完了状況
- ✅ GitHubリポジトリ: https://github.com/wanifucks/website-analyzer-v2
- ✅ Vercelフロントエンド: https://frontend-g50sldbhl-wanifucks.vercel.app
- 🔄 次：Railway バックエンドデプロイ

## 🚀 Railway デプロイ手順（ブラウザ操作）

### ステップ1: Railway プロジェクト作成

1. **Railway にアクセス**
   - https://railway.app/ を開く
   - GitHub アカウントでログイン

2. **新プロジェクト作成**
   - 右上 "New Project" をクリック
   - "Deploy from GitHub repo" を選択
   - `website-analyzer-v2` を検索・選択

3. **初期設定**
   - プロジェクト名: `sitescan-v2-backend`
   - デプロイ確認（自動開始）

### ステップ2: サービス設定

1. **Root Directory 設定**
   - デプロイされたサービスをクリック
   - "Settings" タブを開く
   - "Source" セクションで "Root Directory" を `backend` に設定
   - "Deploy" をクリックして再デプロイ

2. **ビルド・起動コマンド確認**
   ```
   Build Command: npm ci
   Start Command: npm start
   ```

### ステップ3: PostgreSQL データベース追加

1. **データベース追加**
   - プロジェクトダッシュボードで "+ New" をクリック
   - "Database" を選択
   - "PostgreSQL" を選択

2. **接続確認**
   - データベースが作成されると `DATABASE_URL` が自動設定される
   - Variables タブで確認可能

### ステップ4: 環境変数設定

Backend サービスの "Variables" タブで以下を設定：

#### 必須設定（手動追加）
```bash
# アプリケーション
NODE_ENV=production
JWT_SECRET=SiteScan-V2-Super-Secure-JWT-Secret-Key-For-Admin-Authentication-256bit-2024
PORT=3002
CORS_ORIGIN=https://frontend-g50sldbhl-wanifucks.vercel.app

# Puppeteer（重要！）
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
PUPPETEER_DISABLE_HEADLESS_WARNING=true

# 管理者デフォルト設定
ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_EMAIL=admin@sitescan.local
ADMIN_DEFAULT_PASSWORD=SiteScan2024Admin!

# セキュリティ
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API制限
API_TIMEOUT=30000
MAX_CONCURRENT_ANALYSES=3

# 分析設定
ANALYSIS_TIMEOUT=120000
MAX_PAGES_PER_ANALYSIS=50
CRAWLER_DELAY=1000
```

#### 自動設定（確認のみ）
- `DATABASE_URL` - PostgreSQL接続文字列（自動設定）
- `PORT` - アプリケーションポート
- `RAILWAY_DEPLOYMENT_ID` - デプロイID（自動設定）

### ステップ5: デプロイ実行・確認

1. **再デプロイ**
   - 環境変数設定後、"Deploy" をクリック
   - ビルドログを監視（3-5分程度）

2. **ビルド成功確認**
   ```
   ✓ Dependencies installed
   ✓ Docker image built  
   ✓ Chrome dependencies installed
   ✓ Application started on port 3002
   ```

3. **URL取得**
   - "Settings" → "Domains" で生成されたURLを取得
   - 例: `https://sitescan-v2-backend-production.up.railway.app`

4. **ヘルスチェック**
   - `{railway-url}/api/health` にアクセス
   - 以下が返されることを確認：
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-08-18T...",
     "database": { "connected": true },
     "services": { "analysis": "ready" }
   }
   ```

### ステップ6: 管理者ユーザー作成

1. **Railway コンソール経由**
   - Service → "Console" タブ
   - `npm run create-admin` を実行

2. **または直接API経由**
   ```bash
   curl -X POST https://your-railway-url/api/admin/setup \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "email": "admin@sitescan.local",
       "password": "SiteScan2024Admin!"
     }'
   ```

## 🌐 Vercel フロントエンド環境変数更新

Railway デプロイ完了後：

1. **Vercel ダッシュボード**
   - https://vercel.com/dashboard
   - `frontend-g50sldbhl-wanifucks` プロジェクトを開く

2. **環境変数設定**
   - "Settings" → "Environment Variables"
   ```bash
   VITE_API_BASE_URL=https://your-railway-url.railway.app
   VITE_APP_NAME=SiteScan V2
   VITE_APP_VERSION=2.0.0
   VITE_ENABLE_PWA=true
   ```

3. **再デプロイ**
   - "Deployments" タブで最新デプロイメントの "..." → "Redeploy"

## ✅ 最終確認チェックリスト

### Railway バックエンド
- [ ] ビルド成功
- [ ] `/api/health` でヘルスチェック応答
- [ ] PostgreSQL 接続確認
- [ ] 環境変数設定完了
- [ ] Puppeteer/Chrome 動作確認

### Vercel フロントエンド  
- [ ] API URL 更新
- [ ] 再デプロイ実行
- [ ] フロントエンド ⇔ バックエンド通信確認

### 管理機能
- [ ] 管理者ユーザー作成
- [ ] `/admin` ログイン確認
- [ ] ダッシュボード表示確認

### 全体動作
- [ ] サイト分析実行
- [ ] データ保存（IndexedDB）
- [ ] 管理者画面でデータ確認
- [ ] CSV/JSON エクスポート

## 🚨 トラブルシューティング

### よくある問題

1. **Puppeteer エラー**
   ```
   Error: Could not find Chrome
   ```
   **解決**: Dockerfile でChrome依存関係が正しくインストールされているか確認

2. **データベース接続エラー**
   ```
   Error: Connection refused
   ```
   **解決**: PostgreSQL サービスが起動し、`DATABASE_URL` が設定されているか確認

3. **CORS エラー**
   ```
   Access-Control-Allow-Origin error
   ```
   **解決**: `CORS_ORIGIN` にVercel URLが正しく設定されているか確認

### ログ確認方法
- Railway: Service → "Logs" タブ
- エラーの特定と修正

## 📞 サポート情報

問題が発生した場合：
1. Railway ログを確認
2. 環境変数設定を再確認
3. GitHub Issues で問題報告

---

**推定完了時間**: 15-30分  
**必要な操作**: ブラウザベースの設定作業のみ