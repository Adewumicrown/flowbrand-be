import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Strategy } from './strategy.entity';
import { UploadedDocument } from '../../uploaded-documents/entities/uploaded-document.entity';

@Entity({ name: 'strategy_documents' })
export class StrategyDocument {
  @PrimaryColumn({ type: 'uuid' })
  strategy_id: string;

  @PrimaryColumn({ type: 'uuid' })
  document_id: string;

  @ManyToOne(() => Strategy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'strategy_id' })
  strategy: Strategy;

  @ManyToOne(() => UploadedDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: UploadedDocument;
}
