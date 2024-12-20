import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, delay, Observable, of, tap } from 'rxjs';
import { Document } from '../models/document.model';
import { KnowledgeType, SearchRetrieval } from '../models/search-retrieval.model';
import { Topic } from '../models/topic.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private http = inject(HttpClient);
  private topicsSubject: BehaviorSubject<Topic[]> = new BehaviorSubject<Topic[]>([]);
  private topicsObservable = this.topicsSubject.asObservable();
  private topics = toSignal(this.topicsSubject, { initialValue: [] });

  private changeSelectedTopicSubject: BehaviorSubject<Topic | null> = new BehaviorSubject<Topic | null>(null);
  private changeSelectedTopicObservable = this.changeSelectedTopicSubject.asObservable();

  private baseUrl = environment.apiUrl;

  mockSearchRetrieval: SearchRetrieval[] = [
    {
      type: KnowledgeType.TOPIC,
      title: 'RM 88 Alpe Adria Villach Adria',
      topic: {
        uuid: '06ca581f-b314-4658-9a62-3a897165efb6',
        title: 'RM 88 Alpe Adria Villach Adria'
      },
      content_preview:
        'Ich habe diesen Onboarding-Plan zusammengestellt, um Ihnen den Einstieg in Ihre neue Rolle als im Team zu erleichtern...Nach 60 Tagen sind Sie aktiv ins Arbeitsleben eingebunden.',
      score: 33
    },
    {
      type: KnowledgeType.DOCUMENT,
      title: 'WIFO Sternradtour_Rosentaler Hof 2024_DE_OK.pdf',
      topic: {
        uuid: '06ca581f-b314-4658-9a62-3a897165efb6',
        title: 'RM 88 Alpe Adria Villach Adria'
      },
      content_preview:
        'Jedes Gepäckstück muss mit einer dunkelblauen Gepäckschleife versehen sein (Strichcode bitte gut sichtbar).9Auf jeder Schleife ist der Eigentümer, die Buchungsnummer sowie die Ge-samtanzahl  der  Gepäckstücke  pro  Buchung...',
      score: 33
    },
    {
      type: KnowledgeType.FAQ,
      title: 'FAQ 1',
      topic: {
        uuid: '06ca581f-b314-4658-9a62-3a897165efb6',
        title: 'RM 88 Alpe Adria Villach Adria'
      },
      faq_uuid: '66af6f2a-478e-4dce-8b00-f12b64e37f8c',
      content_preview: 'jkslöföskdlfjsjl',
      score: 33
    }
  ];

  constructor() {
    this.refreshTree();
  }

  refreshTree(): void {
    this.http.get<Topic[]>(`${this.baseUrl}/topic/tree`).subscribe(topics => {
      this.topicsSubject.next(topics);
    });
  }

  getAllTopics(): Observable<Topic[]> {
    return this.topicsObservable;
  }

  changeSelectedTopic(): Observable<Topic | null> {
    return this.changeSelectedTopicObservable;
  }

  getTopicByUUID(uuid: string): Observable<Topic> {
    return this.http.get<Topic>(`${this.baseUrl}/topic/${uuid}`)
  }

  deleteTopic(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/topic/${uuid}`).pipe(
      tap(() => {
        this.refreshTree();
      })
    );
  }

  getTopicDocuments(uuid: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/topic/${uuid}/documents`).pipe();
  }

  getAllDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/document`);
  }

  deleteDocumentByUUID(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/document/${uuid}`);
  }

  getBreadcrumbsRouteOfTopic(uuid: string): Topic[] {
    const route: Topic[] = [];

    const findTopicPath = (topics: Topic[], targetUUID: string): boolean => {
      for (const topic of topics) {
        route.push(topic);
        if (topic.uuid === targetUUID) {
          return true;
        }

        if (topic.children && topic.children.length > 0) {
          const foundInChildren = findTopicPath(topic.children, targetUUID);
          if (foundInChildren) {
            return true;
          }
        }

        route.pop();
      }
      return false;
    };

    const topics = this.topicsSubject.getValue();
    const found = findTopicPath(topics, uuid);

    if (!found) {
      return [];
    }

    return route;
  }

  createTopic(parent_uuid: string): Observable<Topic> {

    let topicPath = ""
    if(parent_uuid != "") {
      topicPath = `/${parent_uuid}`
    }
    return this.http
      .post<Topic>(`${this.baseUrl}/topic${topicPath}`, {
        title: 'Entwurf-' + formatDate(new Date(), 'yyyy-MM-dd', 'en-US') + " neues Thema"
      })
      .pipe(
        tap((newTopic: Topic) => {
          const topics = this.topicsSubject.getValue();

          const addTopicToParent = (topics: Topic[], targetId: string): boolean => {
            for (const topic of topics) {
              if (topic.uuid === targetId) {
                topic.children?.push(newTopic);
                return true;
              }

              // If the topic has children, recursively search in the children
              if (topic.children && topic.children.length > 0) {
                const foundInChildren = addTopicToParent(topic.children, targetId);
                if (foundInChildren) {
                  return true;
                }
              }
            }
            return false;
          };

          if (newTopic.parent_uuid == null) {
            topics.push(newTopic);
          } else {
            addTopicToParent(topics, newTopic.parent_uuid);
          }

          this.topicsSubject.next(topics);
        })
      );
  }

  updateTopic(topic: Topic) {
    return this.http.put(`${this.baseUrl}/topic/${topic.uuid}`, topic).pipe(
      tap(() => {
        const topics = this.topicsSubject.getValue();
        // Define a recursive helper function to find and update the topic
        const recursiveSearchAndUpdate = (topicList: Topic[]) => {
          const foundIndex = topicList.findIndex(t => t.uuid === topic.uuid);
          if (foundIndex >= 0) {
            topicList[foundIndex] = topic;
          } else {
            // If not found, check children recursively
            topicList.forEach(t => {
              if (t.children) {
                recursiveSearchAndUpdate(t.children);
              }
            });
          }
        };

        recursiveSearchAndUpdate(topics);
        this.refreshTree();
      })
    );
  }

  retrievalKnowledge(query: string, topic_uuid: string): Observable<SearchRetrieval[]> {
    return of(this.mockSearchRetrieval).pipe(delay(1000));
  }

  uploadDocument(topicUuid: string, file: File): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Document>(`${this.baseUrl}/document/topic/${topicUuid}/upload`, formData);
  }

  getDocuments(topicUuid: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/topic/${topicUuid}/document`);
  }

  downloadPdf(documentUuid: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/document/${documentUuid}/download`, {
      responseType: 'blob'
    });
  }

  setSelectedTopic(topic: Topic) {
    this.changeSelectedTopicSubject.next(topic);
  }
}
