import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { AnalysisStatus, AnalysisOptions, AnalysisResults } from '../types/analysis';

@Entity('analyses')
@Index(['userFingerprint'])
@Index(['url'])
@Index(['status'])
@Index(['startedAt'])
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  url!: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status!: AnalysisStatus;

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ default: 0 })
  totalPages!: number;

  @Column({ default: 0 })
  crawledPages!: number;

  @Column({ default: 0 })
  errorCount!: number;

  @Column('jsonb', { nullable: true })
  results?: AnalysisResults;

  @Column('jsonb')
  options!: AnalysisOptions;

  // 管理者システム用の新しいフィールド
  @Column({ nullable: true })
  userFingerprint?: string;

  @Column({ nullable: true, type: 'inet' })
  userIp?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  overallScore?: number;

  @Column({ nullable: true, length: 10 })
  grade?: string;

  @Column({ nullable: true, type: 'text' })
  error?: string;

  @Column('jsonb', { nullable: true })
  metadata?: {
    totalPages?: number;
    pagesAnalyzed?: number;
    errorCount?: number;
    duration?: number;
    analysisEngine?: string;
    coreWebVitals?: any;
  };

  @Column('jsonb', { nullable: true })
  seoData?: {
    score: number;
    issues?: any[];
    suggestions?: any[];
    metrics?: any;
  };

  @Column('jsonb', { nullable: true })
  performanceData?: {
    score: number;
    metrics?: {
      loadTime?: number;
      firstContentfulPaint?: number;
      largestContentfulPaint?: number;
      cumulativeLayoutShift?: number;
    };
    suggestions?: any[];
  };

  @Column('jsonb', { nullable: true })
  securityData?: {
    score: number;
    httpsUsage?: boolean;
    vulnerabilities?: any[];
    recommendations?: any[];
  };

  @Column('jsonb', { nullable: true })
  accessibilityData?: {
    score: number;
    wcagLevel?: string;
    violations?: any[];
    suggestions?: any[];
  };

  @UpdateDateColumn()
  updatedAt!: Date;
}