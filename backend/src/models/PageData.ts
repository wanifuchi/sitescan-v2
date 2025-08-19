import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Analysis } from './Analysis';

@Entity('page_data')
export class PageData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Analysis, { onDelete: 'CASCADE' })
  analysis!: Analysis;

  @Column({ type: 'uuid' })
  analysisId!: string;

  @Column({ type: 'varchar', length: 2048 })
  url!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'int' })
  statusCode!: number;

  @Column({ type: 'float' })
  loadTime!: number;

  @Column({ type: 'varchar', length: 100 })
  contentType!: string;

  @Column({ type: 'int' })
  size!: number;

  @Column({ type: 'int' })
  depth!: number;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  parentUrl?: string;

  @Column('jsonb')
  links!: string[];

  @Column('jsonb')
  images!: string[];

  @Column('jsonb')
  errors!: string[];

  @Column('text', { nullable: true })
  content?: string;

  @CreateDateColumn()
  crawledAt!: Date;
}