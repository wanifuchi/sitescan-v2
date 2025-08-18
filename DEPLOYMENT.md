# SiteScan V2 - デプロイメントガイド

## 📋 デプロイ現状

### ✅ 完了済み
- [x] GitHub リポジトリ作成・推送 (https://github.com/wanifucks/website-analyzer-v2)
- [x] Vercel フロントエンド デプロイ (https://frontend-g50sldbhl-wanifucks.vercel.app)

### 🔄 実行中・予定
- [ ] Railway バックエンド デプロイ
- [ ] PostgreSQL データベース設定
- [ ] 環境変数設定
- [ ] 管理者ユーザー初期作成
- [ ] 動作確認・テスト

## 構成

- **バックエンド**: Railway (PostgreSQL含む) + Docker
- **フロントエンド**: Vercel
- **データベース**: Railway PostgreSQL
- **アーキテクチャ**: プライバシー重視の二重アクセス設計

## 1. Railway でバックエンドをデプロイ

### 前提条件
- Githubアカウント
- Railwayアカウント（https://railway.app/）
- Docker対応（Puppeteer + Chrome）

### 手順

1. **GitHubリポジトリ準備**
   ```bash
   # 既に完了済み
   Repository: https://github.com/wanifucks/website-analyzer-v2
   Branch: main
   Backend Path: /backend
   ```

2. **Railway で新しいプロジェクト作成**
   - https://railway.app/ にアクセス
   - "New Project" をクリック
   - "Deploy from GitHub repo" を選択
   - `website-analyzer-v2` リポジトリを選択

3. **サービス設定**
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci`  
   - **Start Command**: `npm start`
   - **Port**: `3002`
   - **Dockerfile**: 自動検出（Puppeteer + Chrome対応）

4. **PostgreSQL データベース追加**
   - プロジェクトダッシュボードで "+ New" をクリック
   - "Database" → "PostgreSQL" を選択
   - 自動的に `DATABASE_URL` 環境変数が設定される

5. **環境変数設定**
   Railway dashboard で以下を設定:

   #### 必須環境変数
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key-256bit
   PORT=3002
   CORS_ORIGIN=https://frontend-g50sldbhl-wanifucks.vercel.app
   
   # データベース（自動設定）
   DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
   
   # Puppeteer設定
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
   PUPPETEER_DISABLE_HEADLESS_WARNING=true
   
   # 管理者設定
   ADMIN_DEFAULT_USERNAME=admin
   ADMIN_DEFAULT_EMAIL=admin@sitescan.local
   ADMIN_DEFAULT_PASSWORD=SecureAdmin123!
   
   # セキュリティ設定
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # API設定
   API_TIMEOUT=30000
   MAX_CONCURRENT_ANALYSES=3
   
   # 分析設定
   ANALYSIS_TIMEOUT=120000
   MAX_PAGES_PER_ANALYSIS=50
   CRAWLER_DELAY=1000
   ```

6. **カスタムドメイン設定（オプション）**
   - Settings → Domains → Generate Domain

## 2. Vercel でフロントエンドをデプロイ

### 手順

1. **Vercel アカウント作成**
   - https://vercel.com/ にアクセス
   - GitHubアカウントでサインアップ

2. **新しいプロジェクト作成**
   - "New Project" をクリック
   - GitHubリポジトリを選択
   - Root Directory を `frontend` に設定

3. **ビルド設定**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **環境変数設定**
   ```
   VITE_API_URL=https://your-railway-app.railway.app
   ```

5. **デプロイ実行**
   - "Deploy" をクリック

## 3. 設定の更新

### バックエンド CORS 設定更新

RailwayのダッシュボードでFRONTEND_URLを正しいVercel URLに更新:
```
FRONTEND_URL=https://your-actual-vercel-app.vercel.app
```

### フロントエンド API URL 更新

VercelのダッシュボードでVITE_API_URLを正しいRailway URLに更新:
```
VITE_API_URL=https://your-actual-railway-app.railway.app
```

## 4. 動作確認

1. **バックエンド ヘルスチェック**
   ```
   https://your-railway-app.railway.app/api/health
   ```

2. **フロントエンド アクセス**
   ```
   https://your-vercel-app.vercel.app
   ```

3. **データベース接続確認**
   ヘルスチェックで database.connected: true になることを確認

## 5. カスタムドメイン設定（オプション）

### Railway (バックエンド)
1. Settings → Domains
2. Custom Domain を追加
3. DNS設定でCNAMEレコードを設定

### Vercel (フロントエンド)
1. Project Settings → Domains
2. Custom Domain を追加
3. DNS設定でCNAMEレコードを設定

## 6. 継続的デプロイ

GitHubにpushすると自動的にデプロイされます:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 7. 環境変数一覧

### Railway (バックエンド)
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://your-vercel-app.vercel.app
PORT=3002
```

### Vercel (フロントエンド)
```env
VITE_API_URL=https://your-railway-app.railway.app
```

## 8. トラブルシューティング

### よくある問題

1. **CORS エラー**
   - Railway の FRONTEND_URL が正しく設定されているか確認
   - Vercel の実際のURLと一致しているか確認

2. **API 接続エラー**
   - Vercel の VITE_API_URL が正しく設定されているか確認
   - Railway のサービスが正常に起動しているか確認

3. **データベース接続エラー**
   - PostgreSQL サービスが起動しているか確認
   - DATABASE_URL が正しく設定されているか確認

### ログ確認

**Railway:**
- Project Dashboard → Service → Deployments → Logs

**Vercel:**
- Project Dashboard → Functions → View Function Logs

## 9. 費用について

### Railway
- 無料枠: $5/月まで無料
- PostgreSQL: 無料枠に含まれる
- 超過後: 従量課金

### Vercel
- 無料枠: 個人利用は無料
- 商用利用: Pro プラン $20/月〜

## 10. バックアップとメンテナンス

### データベースバックアップ
```bash
# Railway CLI インストール
npm install -g @railway/cli

# ログイン
railway login

# バックアップ
railway run pg_dump $DATABASE_URL > backup.sql
```

### アップデート
1. 本番環境では機能テスト後にデプロイ
2. 段階的ロールアウトの検討
3. 定期的な依存関係の更新

---

このガイドに従って、無料でフル機能のWebサイト分析ツールをデプロイできます！