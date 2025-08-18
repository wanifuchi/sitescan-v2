# SiteScan V2

プライバシー重視の次世代ウェブサイト分析ツール - URLを入力するだけで、SEO、パフォーマンス、セキュリティ、アクセシビリティを総合分析します。

## 🌟 主な特徴

### 🔒 プライバシー・ファースト
- **完全ブラウザ保存**: 個人の分析データはあなたのブラウザ内にのみ保存
- **サーバー保存なし**: 個人特定可能なデータは外部サーバーに送信されません
- **GDPR準拠**: プライバシー・バイ・デザインの原則に基づく設計

### ⚡ 高速・オフライン対応
- **PWA対応**: インストール可能で、ネイティブアプリのような体験
- **オフライン閲覧**: 過去の分析結果はインターネット接続なしで確認可能
- **瞬時表示**: ローカルデータで高速な結果表示

### 📊 包括的分析
- **SEO分析**: メタタグ、見出し構造、キーワード密度
- **パフォーマンス**: Core Web Vitals、リソース分析
- **セキュリティ**: HTTPS、脆弱性チェック
- **アクセシビリティ**: WCAG 2.1準拠チェック
- **モバイル対応**: レスポンシブ分析

### 🛡️ デュアルアクセス・システム
- **一般ユーザー**: 自分の分析データのみ閲覧（ブラウザ保存）
- **サイト管理者**: 専用管理画面で利用状況を把握（認証制御）

## 🚀 クイックスタート

### 📋 前提条件
- Node.js 18以上
- npm または yarn
- PostgreSQL（管理者機能用）

### ⚡ 簡単起動
```bash
# プロジェクトクローン
git clone https://github.com/your-username/sitescan-v2.git
cd sitescan-v2

# 簡単起動スクリプト
./quick-start.sh
```

### 🔧 手動起動
```bash
# バックエンド起動 (Port 3002)
cd backend
npm install
npm start &

# フロントエンド起動 (Port 3000)  
cd frontend
npm install
npm run dev &
```

### 🌐 アクセス
- **一般ユーザー**: http://localhost:3000
- **管理者画面**: http://localhost:3000/admin
- **API**: http://localhost:3002
- **ヘルスチェック**: http://localhost:3002/health

### ⏹️ 停止
```bash
./stop.sh
```

## 🏗️ アーキテクチャ

### システム構成

```
┌─────────────────┐    ┌─────────────────┐
│   一般ユーザー   │    │  サイト管理者    │
│                 │    │                 │
│ ブラウザ内保存   │    │  管理画面       │
│ (IndexedDB)     │    │  (認証制御)     │
└─────────────────┘    └─────────────────┘
          │                       │
          └───────────┬───────────┘
                      │
              ┌───────────────┐
              │   API Server  │
              │  (Express)    │
              └───────────────┘
                      │
              ┌───────────────┐
              │  PostgreSQL   │
              │ (管理者用のみ) │
              └───────────────┘
```

### データフロー

#### 一般ユーザー
1. **分析実行**: API → 結果取得 → ブラウザ保存
2. **結果表示**: ローカルデータ → 高速表示
3. **履歴管理**: ブラウザ内完結

#### 管理者
1. **認証**: JWT認証 → 管理画面アクセス
2. **データ閲覧**: PostgreSQL → 全分析データ確認
3. **統計表示**: 利用状況ダッシュボード

## 📁 プロジェクト構造

```
sitescan-v2/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # APIコントローラー
│   │   ├── middleware/      # 認証・認可
│   │   ├── models/          # データモデル
│   │   ├── routes/          # APIルート
│   │   └── services/        # ビジネスロジック
│   ├── database.js          # DB接続・設定
│   └── server.js           # サーバーエントリー
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # UIコンポーネント
│   │   ├── pages/          # ページコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── lib/            # ユーティリティ
│   │   ├── admin/          # 管理者画面
│   │   └── db/             # IndexedDB操作
│   └── public/
├── docs/                   # ドキュメント
├── quick-start.sh          # 簡単起動
├── stop.sh                # 停止スクリプト
└── README.md
```

## 🔧 環境設定

### 必須環境変数

#### バックエンド (.env)
```bash
# データベース (管理者機能用)
DATABASE_URL=postgresql://username:password@localhost:5432/sitescan

# 認証
JWT_SECRET=your-secure-jwt-secret

# 分析API
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_PAGESPEED_API_KEY=your-pagespeed-api-key
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# サーバー設定
PORT=3002
NODE_ENV=production
```

#### フロントエンド (.env.local)
```bash
# API接続
VITE_API_BASE_URL=http://localhost:3002

# アプリケーション設定
VITE_APP_NAME=SiteScan
VITE_APP_VERSION=2.0.0
```

## 🎛️ 管理者機能

### 初期管理者作成
```bash
# バックエンドコンソールで実行
node scripts/create-admin.js --username admin --password your-secure-password
```

### 管理画面機能
- **📊 ダッシュボード**: 利用統計、最新分析一覧
- **📝 分析管理**: 全ユーザーの分析データ確認
- **🔍 検索・フィルタ**: URL、日付、ステータスでの絞り込み
- **📈 統計表示**: 人気URL、利用傾向分析
- **🗑️ データ管理**: 不要データの削除

## 🛠 技術スタック

### 簡易版
- **バックエンド**: Node.js, Express.js, CORS
- **フロントエンド**: React 18, TypeScript, Tailwind CSS, Vite

### 完全版（準備済み）
- **バックエンド**: PostgreSQL, Redis, Puppeteer, Bull Queue
- **フロントエンド**: Chart.js, React Query, React Router
- **レポート**: PDFKit, CSV-Writer

## 📁 プロジェクト構造

```
website-analyzer/
├── backend/
│   ├── server.js          # 簡易版サーバー
│   ├── src/               # 完全版ソース
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.simple.tsx # 簡易版アプリ
│   │   ├── pages/         # ページコンポーネント
│   │   └── i18n/ja.json  # 日本語リソース
│   └── package.json
├── quick-start.sh         # 簡単起動スクリプト
├── stop.sh               # 停止スクリプト
└── README.md
```

## 🔧 開発環境セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### 依存関係のインストール
```bash
# バックエンド
cd backend && npm install

# フロントエンド  
cd frontend && npm install
```

### 🔑 API設定（高度な機能利用時）

より高度な分析機能を利用するには、以下のAPIキーの設定が必要です：

#### 1. **Google Gemini AI API**（必須 - 本番設定済み）
- **用途**: AI深層分析、改善提案生成
- **取得方法**:
  1. [Google AI Studio](https://makersuite.google.com/app/apikey)でAPIキー取得
  2. Gemini 2.0 Flash Experimental モデルを選択
- **設定**: `GEMINI_API_KEY`

#### 2. **Google PageSpeed Insights API**（必須 - 本番設定済み）
- **用途**: Core Web Vitals、パフォーマンス分析
- **取得方法**:
  1. [Google Cloud Console](https://console.cloud.google.com)でプロジェクト作成
  2. PageSpeed Insights API を有効化
  3. APIキーを作成
- **設定**: `GOOGLE_PAGESPEED_API_KEY`

#### 3. **Google Custom Search API**（本番設定済み）
- **用途**: 競合分析、SERP分析、実際の検索結果データ取得
- **取得方法**:
  1. Google Cloud Console で Custom Search API を有効化
  2. APIキーを作成
  3. [Programmable Search Engine](https://programmablesearchengine.google.com/)で検索エンジン作成
  4. 検索エンジンIDを取得
- **設定**:
  - `GOOGLE_API_KEY`
  - `GOOGLE_SEARCH_ENGINE_ID`

#### 4. **Google Search Console API**（オプション）
- **用途**: 実際の検索パフォーマンスデータ取得
- **現在の状況**: モックデータで代替動作中
- **取得方法**:
  1. Google Cloud Console で Search Console API を有効化
  2. サービスアカウントを作成
  3. JSONキーファイルをダウンロード
- **設定**: 
  - `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON文字列)
  - または `GOOGLE_APPLICATION_CREDENTIALS` (ファイルパス)

### 環境変数の設定
```bash
# backend/.env ファイルを作成
cp backend/.env.example backend/.env

# 各APIキーを設定
vim backend/.env
```

### 🎯 現在の本番環境状況

**✅ 設定済みAPI（フル機能利用可能）:**
- **GEMINI_API_KEY**: AI深層分析・改善提案
- **GOOGLE_PAGESPEED_API_KEY**: Core Web Vitals実測値
- **GOOGLE_API_KEY**: 競合分析・SERP分析の実データ
- **GOOGLE_SEARCH_ENGINE_ID**: 検索結果データ取得

**⚠️ 未設定API（代替機能で動作）:**
- **Search Console API**: モックデータで検索パフォーマンス表示

### API未設定時の動作
APIキーが設定されていない場合でも、以下の機能は利用可能です：
- 基本的なサイト分析（HTML構造、メタタグ等）
- レスポンシブデザインチェック
- 基本的なSEO分析
- フォールバックデータによる分析表示

## 📊 使用方法

1. `./quick-start.sh` でツールを起動
2. ブラウザで http://localhost:3000 を開く
3. URLを入力して「分析開始」をクリック
4. 分析結果を確認（現在は開始確認のみ）

## 🔍 API エンドポイント

```
GET  /api/health                # ヘルスチェック
POST /api/analysis/start        # 分析開始
GET  /api/analysis/history      # 分析履歴
```

## 🌟 特徴

- **完全日本語対応**: UI、エラーメッセージ、全て日本語
- **モダンなUI/UX**: Tailwind CSSによる美しいインターフェース
- **レスポンシブ対応**: モバイル・タブレット・デスクトップ対応
- **リアルタイム状況表示**: サーバー接続状況をリアルタイム表示

## 📝 今後の拡張

完全版に移行する際は、以下のファイルを使用してください：
- `backend/src/index.ts` - 完全版バックエンド
- `frontend/src/App.tsx` - 完全版フロントエンド
- `docker-compose.yml` - データベース環境

## API仕様

### 分析開始
```
POST /api/analysis/start
Body: { "url": "https://example.com", "options": {...} }
```

### 分析結果取得
```
GET /api/analysis/:id
```

### 分析履歴
```
GET /api/analysis/history
```

## 🌍 PWA機能

### インストール
- デスクトップ・モバイルでアプリとしてインストール可能
- ホーム画面への追加、フルスクリーン表示

### オフライン機能
- **分析結果閲覧**: インターネット接続不要
- **設定管理**: ローカル設定の保存・読込
- **データ同期**: 接続復旧時の自動同期

## 🔒 セキュリティ

### 一般ユーザー
- **データ暗号化**: ブラウザ内データの暗号化オプション
- **プライバシー保護**: 個人データの外部送信なし
- **セキュア通信**: HTTPS強制

### 管理者
- **認証**: JWT + ハッシュ化パスワード
- **認可**: ロールベースアクセス制御
- **監査ログ**: 管理者操作の記録
- **レート制限**: API乱用防止

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**SiteScan V2** - プライバシーを守りながら、より良いウェブサイトを作る