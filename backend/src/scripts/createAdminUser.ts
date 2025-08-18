import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database';
import { AdminUser } from '../models/AdminUser';

async function createAdminUser() {
  try {
    // データベース接続を初期化
    await AppDataSource.initialize();
    console.log('データベースに接続しました');

    const adminUserRepository = AppDataSource.getRepository(AdminUser);

    // 既存の管理者ユーザーをチェック
    const existingAdmin = await adminUserRepository.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('管理者ユーザー "admin" は既に存在します');
      process.exit(0);
    }

    // パスワードをハッシュ化
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);

    // 新しい管理者ユーザーを作成
    const adminUser = adminUserRepository.create({
      username: 'admin',
      email: 'admin@sitescan.local',
      passwordHash,
      role: 'admin',
      isActive: true
    });

    await adminUserRepository.save(adminUser);

    console.log('✅ 管理者ユーザーが作成されました:');
    console.log('  ユーザー名: admin');
    console.log('  パスワード: admin123');
    console.log('  メール: admin@sitescan.local');
    console.log('');
    console.log('⚠️  セキュリティのため、初回ログイン後にパスワードを変更してください');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  createAdminUser();
}

export default createAdminUser;