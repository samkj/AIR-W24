export enum KnowledgeType {
  FAQ = "FAQ",
  TOPIC = "TOPIC",
  DOCUMENT = "DOCUMENT"
}

export interface SearchRetrieval {
  type: KnowledgeType; // FAQ, TOPIC, DOCUMENT
  title: string; // FAQ-Question, TOPIC Title, Document name
  topic: {
    uuid: string;
    title: string;
  }
  document_uuid?: string; // set if type document
  content_preview: string; // prew
}
