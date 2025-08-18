# 🌐 Vercel カスタムドメイン設定ガイド

## 📋 現在の状況
- 旧URL: https://frontend-g50sldbhl-wanifucks.vercel.app
- 新URL: `site-scan-v2.vercel.app` に確定・設定完了

## 🎯 推奨URL候補

### 第1候補グループ（シンプル）
- `site-scan-v2.vercel.app` ✅ **確定済み**
- `sitescan.vercel.app`
- `sitescanner.vercel.app`

### 第2候補グループ（機能性重視）
- `website-analyzer.vercel.app`
- `site-analyzer.vercel.app`
- `web-analyzer.vercel.app`

### 第3候補グループ（V2表示）
- `sitescan-v2.vercel.app`
- `sitescanv2.vercel.app`
- `sitescan2.vercel.app`

## 🚀 設定手順（推奨：Vercel無料サブドメイン）

### ステップ1: Vercel ダッシュボードにアクセス

1. **Vercel にログイン**
   - https://vercel.com/dashboard
   - GitHubアカウントでサインイン

2. **プロジェクト選択**
   - SiteScan V2 プロジェクトをクリック

### ステップ2: ドメイン設定

1. **Settings タブを開く**
   - プロジェクト画面で "Settings" をクリック

2. **Domains セクションへ移動**
   - 左サイドバーで "Domains" をクリック

3. **新しいドメイン追加**
   - "Add" ボタンをクリック
   - 希望するドメイン名を入力（例：`site-scan-v2.vercel.app`）
   - "Add" をクリック

### ステップ3: ドメイン利用可能性確認

#### 利用可能な場合 ✅
```
✓ Domain added successfully
✓ site-scan-v2.vercel.app is now pointing to your project
```

#### 既に使用されている場合 ❌
```
❌ Domain site-scan-v2.vercel.app is not available
```
→ 次の候補を試す

### ステップ4: SSL証明書確認

1. **自動SSL証明書発行**
   - Vercel が自動的にHTTPS証明書を発行
   - 通常1-5分で完了

2. **証明書状態確認**
   - Domains セクションで "Valid Configuration" の緑チェックを確認

### ステップ5: 動作確認

1. **新URLへアクセス**
   - 例：https://site-scan-v2.vercel.app

2. **リダイレクト確認**
   - 新URL（site-scan-v2.vercel.app）がメイン、古いURLも継続利用可能
   - 自動リダイレクトは設定されません（両方とも有効）

## 🔄 関連設定の更新が必要な箇所

### 1. Railway バックエンド環境変数
```bash
CORS_ORIGIN=https://site-scan-v2.vercel.app
```

### 2. プロジェクトファイルの更新
- `README.md` の URL 更新
- `DEPLOYMENT.md` の URL 更新  
- `RAILWAY_DEPLOY_STEPS.md` の URL 更新
- `frontend/index.html` の meta タグ更新

### 3. ソーシャルメタタグ更新
```html
<!-- Open Graph -->
<meta property="og:url" content="https://site-scan-v2.vercel.app" />

<!-- Twitter Card -->  
<meta name="twitter:url" content="https://site-scan-v2.vercel.app" />
```

## 💰 コストと制限

### Vercel 無料サブドメイン
- **コスト**: 完全無料
- **SSL**: 自動発行・更新
- **制限**: vercel.app サブドメインのみ
- **利用可能性**: 先着順

### カスタムドメイン（オプション）
- **コスト**: ドメイン購入費（年額$10-50）
- **メリット**: 完全なブランディング
- **設定**: DNS設定が必要

## ⚡ 即座に実行可能な手順

1. **Vercel ダッシュボード**を開く
2. **候補リストから順番に試す**
   - sitescan.vercel.app
   - site-scan-v2.vercel.app ✅ **確定済み**  
   - sitescanner.vercel.app
   - website-analyzer.vercel.app
3. **利用可能なドメインを設定**
4. **5分後に新URLで動作確認**

## 📋 設定後の確認チェックリスト

- [ ] 新URLでサイトが正常に表示される
- [ ] SSL証明書が有効（🔒マーク表示）
- [ ] サイト分析機能が正常動作
- [ ] モバイル表示も問題なし
- [ ] 管理画面（/admin）への遷移も正常

## 🔄 設定完了後の作業

1. **Railway CORS設定更新**
   - 新URLを `CORS_ORIGIN` に設定

2. **プロジェクトファイル一括更新**
   - 古いURLを新URLに置換

3. **関係者への新URL通知**

## 🚨 注意事項

- 新URL（site-scan-v2.vercel.app）がメイン、古いURLも継続利用可能
- 新しいドメインは即座に有効になります
- Railway の CORS 設定更新まで管理者機能は使用不可
- ドメイン名は後から変更可能（いつでも追加・削除可能）

---

**推定所要時間**: 5-10分  
**必要な操作**: ブラウザでの簡単な設定のみ