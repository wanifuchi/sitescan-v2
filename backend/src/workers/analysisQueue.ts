import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface QueueJob {
  id: string;
  type: string;
  data: any;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

class SimpleAnalysisQueue extends EventEmitter {
  private jobs: Map<string, QueueJob> = new Map();
  private processing: boolean = false;
  private maxConcurrency: number = 3;
  private activeJobs: number = 0;

  constructor() {
    super();
    this.startProcessing();
  }

  async add(type: string, data: any): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: QueueJob = {
      id: jobId,
      type,
      data,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    logger.info(`Job added to queue: ${jobId}`, { type, data });
    
    // 処理開始をトリガー
    setImmediate(() => this.processJobs());
    
    return jobId;
  }

  private async startProcessing(): Promise<void> {
    this.processing = true;
    this.processJobs();
  }

  private async processJobs(): Promise<void> {
    if (!this.processing || this.activeJobs >= this.maxConcurrency) {
      return;
    }

    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (pendingJobs.length === 0) {
      return;
    }

    const job = pendingJobs[0];
    this.activeJobs++;
    job.status = 'processing';

    try {
      logger.info(`Processing job: ${job.id}`, { type: job.type });
      
      // 実際の分析処理を実行
      const result = await this.executeJob(job);
      
      job.status = 'completed';
      job.completedAt = new Date();
      
      this.emit('completed', job, result);
      
      logger.info(`Job completed: ${job.id}`, { result });
      
    } catch (error) {
      job.attempts++;
      
      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();
        
        this.emit('failed', job, error);
        
        logger.error(`Job failed permanently: ${job.id}`, { 
          error: error.message, 
          attempts: job.attempts 
        });
      } else {
        job.status = 'pending';
        
        // 指数バックオフで再試行
        const delay = Math.pow(2, job.attempts) * 1000;
        setTimeout(() => {
          logger.info(`Retrying job: ${job.id} (attempt ${job.attempts + 1})`, { delay });
          this.processJobs();
        }, delay);
      }
    } finally {
      this.activeJobs--;
      
      // 次のジョブを処理
      setImmediate(() => this.processJobs());
    }
  }

  private async executeJob(job: QueueJob): Promise<any> {
    // 実際の分析処理を実行
    const { analysisId, url, options } = job.data;
    
    logger.info(`Executing analysis for: ${url}`, { analysisId, options });
    
    // 動的に分析関数をインポートして実行
    try {
      const { executeAnalysisJob } = await import('./analysisWorker');
      return await executeAnalysisJob({ analysisId, url, options });
    } catch (error) {
      logger.error(`Failed to execute analysis job: ${error.message}`);
      throw error;
    }
  }

  getJobStatus(jobId: string): QueueJob | undefined {
    return this.jobs.get(jobId);
  }

  getQueueStats(): { pending: number; processing: number; completed: number; failed: number } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      pending: jobs.filter(job => job.status === 'pending').length,
      processing: jobs.filter(job => job.status === 'processing').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length
    };
  }

  // 古いジョブをクリーンアップ
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt < oneHourAgo) {
        this.jobs.delete(jobId);
      }
    }
  }
}

// シングルトンインスタンス
export const analysisQueue = new SimpleAnalysisQueue();

// 定期的なクリーンアップ
setInterval(() => {
  analysisQueue.cleanup();
}, 30 * 60 * 1000); // 30分ごと

export default analysisQueue;