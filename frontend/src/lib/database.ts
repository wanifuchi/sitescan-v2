import Dexie, { Table } from 'dexie';

// 分析結果の型定義
export interface AnalysisResult {
  id?: number;
  analysisId: string; // UUID
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  
  // 総合スコア
  overallScore?: number;
  grade?: string;
  
  // 分析結果データ
  seoData?: SEOAnalysis;
  performanceData?: PerformanceAnalysis;
  securityData?: SecurityAnalysis;
  accessibilityData?: AccessibilityAnalysis;
  mobileData?: MobileAnalysis;
  technologyData?: TechnologyAnalysis;
  
  // メタデータ
  metadata?: {
    userAgent?: string;
    viewport?: string;
    analysisVersion?: string;
    totalPages?: number;
    pagesAnalyzed?: number;
    errorCount?: number;
    duration?: number; // 分析時間（秒）
  };
}

// SEO分析結果
export interface SEOAnalysis {
  score: number;
  issues: Issue[];
  metaTags: {
    title?: string;
    description?: string;
    keywords?: string;
    hasTitle: boolean;
    hasDescription: boolean;
    titleLength: number;
    descriptionLength: number;
  };
  headings: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    structure: Array<{ level: number; text: string }>;
  };
  structuredData: {
    hasJsonLd: boolean;
    schemas: string[];
  };
  suggestions: Suggestion[];
}

// パフォーマンス分析結果
export interface PerformanceAnalysis {
  score: number;
  metrics: {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    tti?: number; // Time to Interactive
    tbt?: number; // Total Blocking Time
    cls?: number; // Cumulative Layout Shift
    loadTime?: number;
  };
  resourceSizes: {
    total: number;
    html: number;
    css: number;
    js: number;
    images: number;
    fonts: number;
    other: number;
  };
  suggestions: Suggestion[];
}

// セキュリティ分析結果
export interface SecurityAnalysis {
  score: number;
  httpsUsage: boolean;
  mixedContent: {
    hasIssues: boolean;
    count: number;
  };
  securityHeaders: {
    contentSecurityPolicy: boolean;
    strictTransportSecurity: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    referrerPolicy: boolean;
  };
  vulnerabilities: Issue[];
  suggestions: Suggestion[];
}

// アクセシビリティ分析結果
export interface AccessibilityAnalysis {
  score: number;
  wcagLevel: 'A' | 'AA' | 'AAA' | 'fail';
  violations: Issue[];
  colorContrast: {
    passed: number;
    failed: number;
    total: number;
  };
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  suggestions: Suggestion[];
}

// モバイル分析結果
export interface MobileAnalysis {
  score: number;
  viewport: {
    hasViewportMeta: boolean;
    isResponsive: boolean;
  };
  touchTargets: {
    appropriate: number;
    tooSmall: number;
    total: number;
  };
  textSize: {
    readable: boolean;
    averageSize: number;
  };
  suggestions: Suggestion[];
}

// 技術スタック分析結果
export interface TechnologyAnalysis {
  frameworks: Array<{ name: string; version?: string; confidence: number }>;
  libraries: Array<{ name: string; version?: string; confidence: number }>;
  cms: Array<{ name: string; version?: string; confidence: number }>;
  servers: Array<{ name: string; version?: string }>;
  analytics: Array<{ name: string; confidence: number }>;
}

// 共通インターフェース
export interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  element?: string;
  line?: number;
  column?: number;
  impact?: string;
}

export interface Suggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact?: string;
  effort?: 'low' | 'medium' | 'high';
}

// ユーザー設定
export interface UserSettings {
  id?: number;
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  analysisOptions: {
    maxDepth: number;
    maxPages: number;
    skipImages: boolean;
    skipCSS: boolean;
    skipJS: boolean;
  };
  privacy: {
    saveHistory: boolean;
    shareAnalytics: boolean;
  };
  notifications: {
    analysisComplete: boolean;
    weeklyReport: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// データバックアップ
export interface DataBackup {
  id?: number;
  name: string;
  description?: string;
  data: {
    analyses: AnalysisResult[];
    settings: UserSettings;
  };
  createdAt: Date;
  size: number; // バイト数
}

// Dexieデータベースクラス
export class SiteScanDatabase extends Dexie {
  analyses!: Table<AnalysisResult>;
  settings!: Table<UserSettings>;
  backups!: Table<DataBackup>;

  constructor() {
    super('SiteScanV2Database');
    
    this.version(1).stores({
      analyses: '++id, analysisId, url, status, startedAt, completedAt, overallScore',
      settings: '++id, createdAt, updatedAt',
      backups: '++id, name, createdAt, size'
    });

    // インデックス設定
    this.analyses.hook('creating', function (primKey, obj, trans) {
      obj.startedAt = obj.startedAt || new Date();
    });

    this.settings.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = obj.createdAt || new Date();
      obj.updatedAt = obj.updatedAt || new Date();
    });

    this.settings.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
    });

    this.backups.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = obj.createdAt || new Date();
    });
  }
}

// データベースインスタンス
export const db = new SiteScanDatabase();

// デフォルト設定
export const defaultSettings: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  theme: 'auto',
  language: 'ja',
  analysisOptions: {
    maxDepth: 3,
    maxPages: 50,
    skipImages: false,
    skipCSS: false,
    skipJS: false,
  },
  privacy: {
    saveHistory: true,
    shareAnalytics: false,
  },
  notifications: {
    analysisComplete: true,
    weeklyReport: false,
  },
};

// データベース初期化
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    
    // 初期設定の確認・作成
    const existingSettings = await db.settings.count();
    if (existingSettings === 0) {
      await db.settings.add({
        ...defaultSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    console.log('✅ SiteScan V2 データベースが初期化されました');
  } catch (error) {
    console.error('❌ データベース初期化エラー:', error);
    throw error;
  }
}

// データベース統計情報取得
export async function getDatabaseStats() {
  try {
    const [analysisCount, settingsCount, backupCount] = await Promise.all([
      db.analyses.count(),
      db.settings.count(),
      db.backups.count(),
    ]);

    const totalSize = await db.analyses.toArray().then(analyses => 
      analyses.reduce((total, analysis) => {
        return total + JSON.stringify(analysis).length;
      }, 0)
    );

    return {
      analyses: analysisCount,
      settings: settingsCount,
      backups: backupCount,
      totalSize,
      isSupported: !!window.indexedDB,
    };
  } catch (error) {
    console.error('データベース統計取得エラー:', error);
    return {
      analyses: 0,
      settings: 0,
      backups: 0,
      totalSize: 0,
      isSupported: false,
    };
  }
}

// データベースのクリア（開発/テスト用）
export async function clearDatabase(): Promise<void> {
  try {
    await db.transaction('rw', db.analyses, db.settings, db.backups, async () => {
      await db.analyses.clear();
      await db.settings.clear();
      await db.backups.clear();
    });
    
    // デフォルト設定を再作成
    await db.settings.add({
      ...defaultSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✅ データベースがクリアされました');
  } catch (error) {
    console.error('❌ データベースクリアエラー:', error);
    throw error;
  }
}