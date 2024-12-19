import { Document } from './document.model';

export interface Topic {
  uuid: string;
  title: string;
  description?: string;
  parent_uuid?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  children?: Array<Topic>;
  documents: Document[];

  files?: Array<Document>;
}
