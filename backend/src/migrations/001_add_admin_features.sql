-- SiteScan V2 管理者機能用のデータベース構造変更

-- admin_users テーブルの作成
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- analyses テーブルに管理者機能用フィールドを追加
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS user_fingerprint VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_ip INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS overall_score INTEGER,
ADD COLUMN IF NOT EXISTS grade VARCHAR(10),
ADD COLUMN IF NOT EXISTS error TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS seo_data JSONB,
ADD COLUMN IF NOT EXISTS performance_data JSONB,
ADD COLUMN IF NOT EXISTS security_data JSONB,
ADD COLUMN IF NOT EXISTS accessibility_data JSONB;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_analyses_user_fingerprint ON analyses(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_analyses_url ON analyses(url);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_started_at ON analyses(started_at);
CREATE INDEX IF NOT EXISTS idx_analyses_overall_score ON analyses(overall_score);

-- admin_users テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- updated_at トリガーの作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- admin_users テーブルにトリガーを適用
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- analyses テーブルにトリガーを適用（既存の場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_analyses_updated_at'
    ) THEN
        CREATE TRIGGER update_analyses_updated_at
            BEFORE UPDATE ON analyses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- データの整合性を保つためのコメント
COMMENT ON TABLE admin_users IS 'SiteScan V2 管理者ユーザー';
COMMENT ON COLUMN analyses.user_fingerprint IS 'ユーザー識別子（ブラウザフィンガープリント）';
COMMENT ON COLUMN analyses.overall_score IS '総合スコア（0-100）';
COMMENT ON COLUMN analyses.grade IS '評価グレード（A+, A, B+, B, C+, C, D, F）';
COMMENT ON COLUMN analyses.metadata IS '分析メタデータ（ページ数、エラー数、処理時間等）';
COMMENT ON COLUMN analyses.seo_data IS 'SEO分析結果';
COMMENT ON COLUMN analyses.performance_data IS 'パフォーマンス分析結果';
COMMENT ON COLUMN analyses.security_data IS 'セキュリティ分析結果';
COMMENT ON COLUMN analyses.accessibility_data IS 'アクセシビリティ分析結果';