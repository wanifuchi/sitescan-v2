#!/bin/bash

# =============================================================================
# SiteScan V2 - ドメインURL一括更新スクリプト
# =============================================================================

echo "🌐 SiteScan V2 ドメインURL更新スクリプト"
echo "============================================="

# 新しいドメインをユーザーに入力してもらう
read -p "新しいドメイン名を入力してください (例: site-scan-v2.vercel.app): " NEW_DOMAIN

if [ -z "$NEW_DOMAIN" ]; then
    echo "❌ ドメイン名が入力されていません。"
    exit 1
fi

# 現在のドメイン
OLD_DOMAIN="site-scan-v2.vercel.app"
OLD_URL="https://$OLD_DOMAIN"
NEW_URL="https://$NEW_DOMAIN"

echo "📝 更新内容:"
echo "  旧URL: $OLD_URL"
echo "  新URL: $NEW_URL"
echo ""

read -p "この内容で更新しますか？ (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ 更新をキャンセルしました。"
    exit 1
fi

echo "🔄 ファイル更新を開始..."

# 更新対象ファイルリスト
declare -a files=(
    "README.md"
    "DEPLOYMENT.md"
    "RAILWAY_DEPLOY_STEPS.md"
    "VERCEL_DOMAIN_SETUP.md"
    "frontend/index.html"
    "frontend/vercel.json"
    "backend/.env.example"
    "backend/railway.json"
)

updated_count=0

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  📄 更新中: $file"
        
        # macOS用のsedコマンド（バックアップ付き）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i ".bak" "s|$OLD_DOMAIN|$NEW_DOMAIN|g" "$file"
            sed -i ".bak" "s|$OLD_URL|$NEW_URL|g" "$file"
            # バックアップファイル削除
            rm -f "$file.bak"
        else
            # Linux用のsedコマンド
            sed -i "s|$OLD_DOMAIN|$NEW_DOMAIN|g" "$file"
            sed -i "s|$OLD_URL|$NEW_URL|g" "$file"
        fi
        
        ((updated_count++))
    else
        echo "  ⚠️  ファイルが見つかりません: $file"
    fi
done

echo ""
echo "✅ ファイル更新完了: $updated_count ファイル更新"

# Railway環境変数更新の案内
echo ""
echo "🔄 次に必要な手動作業:"
echo "1. Railway バックエンドの環境変数更新:"
echo "   CORS_ORIGIN=$NEW_URL"
echo ""
echo "2. Vercel でのドメイン設定:"
echo "   - https://vercel.com/dashboard"
echo "   - Settings → Domains → Add: $NEW_DOMAIN"
echo ""
echo "3. 動作確認:"
echo "   - 新URL: $NEW_URL"
echo "   - 管理画面: $NEW_URL/admin/login"
echo ""

read -p "Git コミットを実行しますか？ (y/N): " git_commit
if [[ $git_commit =~ ^[Yy]$ ]]; then
    echo "📦 Git コミット実行中..."
    
    git add .
    git commit -m "🌐 ドメインURL更新: $NEW_DOMAIN

- 全プロジェクトファイルのURL更新
- $OLD_DOMAIN → $NEW_DOMAIN
- メタタグ、ドキュメント、設定ファイル一括更新

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    read -p "GitHub にプッシュしますか？ (y/N): " git_push
    if [[ $git_push =~ ^[Yy]$ ]]; then
        echo "🚀 GitHub プッシュ実行中..."
        git push origin main
        echo "✅ GitHub プッシュ完了"
    fi
fi

echo ""
echo "🎉 ドメイン更新作業完了！"
echo "📋 次のステップ: VERCEL_DOMAIN_SETUP.md を参照してVercelでドメイン設定を行ってください。"