import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadedDocument } from './entities/uploaded-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadedDocument])],
  exports: [TypeOrmModule],
})
export class UploadedDocumentsModule {}
