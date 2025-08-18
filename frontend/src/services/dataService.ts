import { v4 as uuidv4 } from 'uuid';
import { db, DataBackup, AnalysisResult, UserSettings } from '../lib/database';
import { AnalysisService, SettingsService } from './analysisService';

// データエクスポート・インポートサービス
export class DataService {
  
  // データバックアップ作成
  static async createBackup(name: string, description?: string): Promise<string> {
    try {
      const [analyses, settings] = await Promise.all([
        db.analyses.toArray(),
        SettingsService.getSettings(),
      ]);

      const backupData = {
        analyses,
        settings: settings || {},
      };

      const backup: DataBackup = {
        name,
        description,
        data: backupData,
        createdAt: new Date(),
        size: JSON.stringify(backupData).length,
      };

      const backupId = await db.backups.add(backup);
      
      console.log(`✅ データバックアップが作成されました: ${name}`);
      return backupId.toString();
    } catch (error) {
      console.error('バックアップ作成エラー:', error);
      throw new Error(`バックアップの作成に失敗しました: ${error.message}`);
    }
  }

  // バックアップをファイルとしてダウンロード
  static async downloadBackup(backupId: number): Promise<void> {
    try {
      const backup = await db.backups.get(backupId);
      if (!backup) {
        throw new Error('バックアップが見つかりません');
      }

      const exportData = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        backup,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitescan-backup-${backup.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`📥 バックアップをダウンロードしました: ${backup.name}`);
    } catch (error) {
      console.error('バックアップダウンロードエラー:', error);
      throw error;
    }
  }

  // バックアップをファイルから復元
  static async restoreFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          // バックアップファイルの妥当性チェック
          if (!data.backup || !data.backup.data) {
            throw new Error('無効なバックアップファイルです');
          }

          await this.restoreBackup(data.backup);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };

      reader.readAsText(file);
    });
  }

  // バックアップを復元
  static async restoreBackup(backup: DataBackup): Promise<void> {
    try {
      // 確認ダイアログ
      const confirmed = confirm(
        `既存のデータを削除して「${backup.name}」を復元しますか？\n\n` +
        `この操作は取り消せません。事前に現在のデータをバックアップすることをお勧めします。`
      );

      if (!confirmed) {
        return;
      }

      // トランザクション内で復元実行
      await db.transaction('rw', db.analyses, db.settings, async () => {
        // 既存データを削除
        await db.analyses.clear();
        await db.settings.clear();

        // バックアップデータを復元
        if (backup.data.analyses && backup.data.analyses.length > 0) {
          await db.analyses.bulkAdd(backup.data.analyses);
        }

        if (backup.data.settings) {
          await db.settings.add({
            ...backup.data.settings as UserSettings,
            updatedAt: new Date(),
          });
        }
      });

      console.log(`✅ バックアップが復元されました: ${backup.name}`);
    } catch (error) {
      console.error('バックアップ復元エラー:', error);
      throw new Error(`バックアップの復元に失敗しました: ${error.message}`);
    }
  }

  // バックアップ一覧を取得
  static async getBackups(): Promise<DataBackup[]> {
    try {
      return await db.backups.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('バックアップ一覧取得エラー:', error);
      return [];
    }
  }

  // バックアップを削除
  static async deleteBackup(backupId: number): Promise<void> {
    try {
      await db.backups.delete(backupId);
      console.log(`🗑️ バックアップが削除されました: ${backupId}`);
    } catch (error) {
      console.error('バックアップ削除エラー:', error);
      throw error;
    }
  }

  // CSVエクスポート
  static async exportToCSV(): Promise<void> {
    try {
      const analyses = await db.analyses
        .where('status')
        .equals('completed')
        .toArray();

      if (analyses.length === 0) {
        throw new Error('エクスポートする分析結果がありません');
      }

      const csvHeaders = [
        'URL',
        '分析日時',
        '完了日時',
        '総合スコア',
        'グレード',
        'SEOスコア',
        'パフォーマンススコア',
        'セキュリティスコア',
        'アクセシビリティスコア',
        'モバイルスコア',
        '分析時間(秒)',
      ];

      const csvRows = analyses.map(analysis => [
        `"${analysis.url}"`,
        analysis.startedAt.toISOString(),
        analysis.completedAt?.toISOString() || '',
        analysis.overallScore || '',
        analysis.grade || '',
        analysis.seoData?.score || '',
        analysis.performanceData?.score || '',
        analysis.securityData?.score || '',
        analysis.accessibilityData?.score || '',
        analysis.mobileData?.score || '',
        analysis.metadata?.duration || '',
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitescan-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('📊 CSVエクスポートが完了しました');
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      throw error;
    }
  }

  // JSON形式で全データをエクスポート
  static async exportAllData(): Promise<void> {
    try {
      const [analyses, settings, stats] = await Promise.all([
        db.analyses.toArray(),
        SettingsService.getSettings(),
        AnalysisService.getAnalysisStats(),
      ]);

      const exportData = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        summary: {
          totalAnalyses: analyses.length,
          stats,
        },
        data: {
          analyses,
          settings,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitescan-full-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('📦 全データエクスポートが完了しました');
    } catch (error) {
      console.error('全データエクスポートエラー:', error);
      throw error;
    }
  }

  // データストレージ使用量を取得
  static async getStorageUsage(): Promise<{
    used: number;
    available?: number;
    percentage?: number;
    breakdown: {
      analyses: number;
      settings: number;
      backups: number;
    };
  }> {
    try {
      const [analyses, settings, backups] = await Promise.all([
        db.analyses.toArray(),
        db.settings.toArray(),
        db.backups.toArray(),
      ]);

      const analysesSize = JSON.stringify(analyses).length;
      const settingsSize = JSON.stringify(settings).length;
      const backupsSize = JSON.stringify(backups).length;
      const totalUsed = analysesSize + settingsSize + backupsSize;

      let available: number | undefined;
      let percentage: number | undefined;

      // Storage API が利用可能な場合
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          if (estimate.quota && estimate.usage) {
            available = estimate.quota - estimate.usage;
            percentage = (estimate.usage / estimate.quota) * 100;
          }
        } catch (e) {
          console.warn('Storage estimate failed:', e);
        }
      }

      return {
        used: totalUsed,
        available,
        percentage,
        breakdown: {
          analyses: analysesSize,
          settings: settingsSize,
          backups: backupsSize,
        },
      };
    } catch (error) {
      console.error('ストレージ使用量取得エラー:', error);
      return {
        used: 0,
        breakdown: {
          analyses: 0,
          settings: 0,
          backups: 0,
        },
      };
    }
  }

  // データベースを最適化
  static async optimizeDatabase(): Promise<{
    deletedCount: number;
    savedSpace: number;
  }> {
    try {
      const beforeSize = (await this.getStorageUsage()).used;
      
      // 古い分析結果をクリーンアップ
      const deletedCount = await AnalysisService.cleanupOldAnalyses();
      
      // 失敗した分析結果をクリーンアップ（7日以上前）
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const failedDeleted = await db.analyses
        .where('status')
        .equals('failed')
        .and(analysis => analysis.startedAt < sevenDaysAgo)
        .delete();

      const afterSize = (await this.getStorageUsage()).used;
      const savedSpace = beforeSize - afterSize;

      console.log(`🧹 データベース最適化完了: ${deletedCount + failedDeleted}件削除, ${savedSpace}バイト節約`);

      return {
        deletedCount: deletedCount + failedDeleted,
        savedSpace,
      };
    } catch (error) {
      console.error('データベース最適化エラー:', error);
      throw error;
    }
  }

  // File System Access API を使用したバックアップ（対応ブラウザのみ）
  static async saveBackupWithFileSystemAPI(backupId: number): Promise<void> {
    if (!('showSaveFilePicker' in window)) {
      throw new Error('このブラウザはFile System Access APIに対応していません');
    }

    try {
      const backup = await db.backups.get(backupId);
      if (!backup) {
        throw new Error('バックアップが見つかりません');
      }

      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: `sitescan-backup-${backup.name}.json`,
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] },
        }],
      });

      const writable = await fileHandle.createWritable();
      
      const exportData = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        backup,
      };

      await writable.write(JSON.stringify(exportData, null, 2));
      await writable.close();

      console.log(`💾 ファイルシステムにバックアップを保存しました: ${backup.name}`);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('ファイル保存がキャンセルされました');
        return;
      }
      console.error('ファイルシステム保存エラー:', error);
      throw error;
    }
  }
}

// File format utilities
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatStoragePercentage(percentage: number): string {
  return `${Math.round(percentage * 10) / 10}%`;
}