import React, { useState, useEffect } from 'react';
import { useSettings, SettingsService } from '../services/analysisService';
import { DataService, formatFileSize } from '../services/dataService';
import { db, clearDatabase } from '../lib/database';
import Card from './ui/Card';
import Button from './ui/Button';
import { cn } from '../lib/utils';

const PrivacySettings: React.FC = () => {
  const settings = useSettings();
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStorageUsage();
  }, []);

  const loadStorageUsage = async () => {
    try {
      const usage = await DataService.getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.error('ストレージ使用量取得エラー:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSettingChange = async (key: string, value: any) => {
    try {
      const currentSettings = settings || {};
      const updatedSettings = {
        ...currentSettings,
        privacy: {
          ...currentSettings.privacy,
          [key]: value,
        },
      };
      
      await SettingsService.updateSettings(updatedSettings);
      showMessage('success', '設定が保存されました');
    } catch (error) {
      console.error('設定保存エラー:', error);
      showMessage('error', '設定の保存に失敗しました');
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      await DataService.exportAllData();
      showMessage('success', 'データのエクスポートが完了しました');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      showMessage('error', 'データのエクスポートに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const backupName = `手動バックアップ-${new Date().toLocaleDateString('ja-JP')}`;
      await DataService.createBackup(backupName, 'プライバシー設定画面から作成');
      showMessage('success', 'バックアップが作成されました');
      await loadStorageUsage(); // 使用量を更新
    } catch (error) {
      console.error('バックアップ作成エラー:', error);
      showMessage('error', 'バックアップの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    setIsLoading(true);
    try {
      const result = await DataService.optimizeDatabase();
      showMessage('success', `最適化完了: ${result.deletedCount}件のデータを削除し、${formatFileSize(result.savedSpace)}の容量を節約しました`);
      await loadStorageUsage(); // 使用量を更新
    } catch (error) {
      console.error('最適化エラー:', error);
      showMessage('error', 'データベースの最適化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    const confirmed = confirm(
      'すべてのデータを削除しますか？\n\n' +
      '・すべての分析履歴が削除されます\n' +
      '・設定がリセットされます\n' +
      '・この操作は取り消せません\n\n' +
      '続行する前にデータをエクスポートすることをお勧めします。'
    );

    if (!confirmed) return;

    const doubleConfirm = confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。');
    if (!doubleConfirm) return;

    setIsLoading(true);
    try {
      await clearDatabase();
      showMessage('success', 'すべてのデータが削除されました');
      await loadStorageUsage(); // 使用量を更新
    } catch (error) {
      console.error('データ削除エラー:', error);
      showMessage('error', 'データの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      await DataService.restoreFromFile(file);
      showMessage('success', 'データが復元されました');
      await loadStorageUsage(); // 使用量を更新
    } catch (error) {
      console.error('インポートエラー:', error);
      showMessage('error', `データの復元に失敗しました: ${error.message}`);
    } finally {
      setIsLoading(false);
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  const privacySettings = settings?.privacy || { saveHistory: true, shareAnalytics: false };

  return (
    <div className="space-y-8">
      {/* メッセージ表示 */}
      {message && (
        <div className={cn(
          "p-4 rounded-lg border",
          message.type === 'success' 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        )}>
          {message.text}
        </div>
      )}

      {/* プライバシー設定 */}
      <Card title="プライバシー設定">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">分析履歴の保存</h3>
              <p className="text-sm text-gray-600">
                分析結果をブラウザのローカルストレージに保存します。
                無効にすると、ブラウザを閉じると分析結果が失われます。
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.saveHistory}
                onChange={(e) => handleSettingChange('saveHistory', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">匿名使用統計の共有</h3>
              <p className="text-sm text-gray-600">
                サービス改善のために匿名化された使用統計を共有します。
                個人を特定できる情報は含まれません。
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.shareAnalytics}
                onChange={(e) => handleSettingChange('shareAnalytics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* データ管理 */}
      <Card title="データ管理">
        <div className="space-y-6">
          {/* ストレージ使用量 */}
          {storageUsage && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ストレージ使用量</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">総使用量</div>
                  <div className="font-medium">{formatFileSize(storageUsage.used)}</div>
                </div>
                <div>
                  <div className="text-gray-600">分析結果</div>
                  <div className="font-medium">{formatFileSize(storageUsage.breakdown.analyses)}</div>
                </div>
                <div>
                  <div className="text-gray-600">設定</div>
                  <div className="font-medium">{formatFileSize(storageUsage.breakdown.settings)}</div>
                </div>
                <div>
                  <div className="text-gray-600">バックアップ</div>
                  <div className="font-medium">{formatFileSize(storageUsage.breakdown.backups)}</div>
                </div>
              </div>
              {storageUsage.percentage && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>ブラウザストレージ使用率</span>
                    <span>{storageUsage.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* データ操作ボタン */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleExportData}
              disabled={isLoading}
              variant="outline"
              fullWidth
            >
              📥 データをエクスポート
            </Button>

            <Button
              onClick={handleCreateBackup}
              disabled={isLoading}
              variant="outline"
              fullWidth
            >
              💾 バックアップを作成
            </Button>

            <Button
              onClick={handleOptimizeDatabase}
              disabled={isLoading}
              variant="outline"
              fullWidth
            >
              🧹 データベースを最適化
            </Button>

            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                disabled={isLoading}
                className="hidden"
              />
              <Button
                as="span"
                disabled={isLoading}
                variant="outline"
                fullWidth
                className="cursor-pointer"
              >
                📤 バックアップから復元
              </Button>
            </label>
          </div>
        </div>
      </Card>

      {/* データ削除 */}
      <Card title="データ削除" className="border-red-200">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">注意</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>この操作により以下のデータが完全に削除されます：</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>すべての分析履歴</li>
                    <li>ユーザー設定</li>
                    <li>保存されたバックアップ</li>
                  </ul>
                  <p className="mt-2 font-medium">この操作は取り消せません。事前にデータをエクスポートすることを強くお勧めします。</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleClearAllData}
            disabled={isLoading}
            variant="danger"
            fullWidth
          >
            🗑️ すべてのデータを削除
          </Button>
        </div>
      </Card>

      {/* プライバシーポリシー */}
      <Card title="プライバシーについて">
        <div className="prose prose-sm max-w-none">
          <h3>データの保存場所</h3>
          <p>
            SiteScan V2は、プライバシーを最優先に設計されています。
            すべての分析結果は<strong>あなたのブラウザ内のみ</strong>に保存され、
            外部サーバーには送信されません。
          </p>

          <h3>データの安全性</h3>
          <ul>
            <li>分析結果はIndexedDBを使用してローカルに暗号化保存</li>
            <li>サードパーティトラッカーは一切使用していません</li>
            <li>分析対象のウェブサイト以外への通信は行いません</li>
          </ul>

          <h3>データの管理</h3>
          <ul>
            <li>いつでもデータをエクスポート・削除できます</li>
            <li>ブラウザのデータを削除すると、すべての履歴が消去されます</li>
            <li>定期的なバックアップの作成をお勧めします</li>
          </ul>

          <h3>管理者について</h3>
          <p>
            サイト管理者は別途、サーバー側で全ユーザーの分析ログを
            確認できる機能を持っていますが、これはサービス改善と
            サポート目的に限定されます。
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PrivacySettings;