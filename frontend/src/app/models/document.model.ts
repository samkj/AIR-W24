import { Base } from './base.model';

export interface Document extends Base {
  name: string;
  mimeType: string;
  last_changed_by: string;
  topicUuid?: string | null | undefined;
}
