import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventSourceController, EventSourcePlus, SseMessage } from 'event-source-plus';

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl;

  constructor(private zone: NgZone) {

  }

  search(body: { query: string; conversation_id: string | 'conversation_id', user: "default-user" }): Observable<HttpEvent<string>> {
    return this.http.post(this.baseUrl + '/stream', body, {
      observe: 'events',
      reportProgress: true,
      responseType: 'text'
    });
  }

  private eventSource: EventSourcePlus | null = null;
  private isConnected = false;
  private controller!: EventSourceController;

  connect(body: { query: string; conversation_id: string, user: string, response_mode: string, inputs: string[] | null }): Observable<MessageEvent> {
    const subject = new ReplaySubject<MessageEvent>(1);

    this.close();

    this.eventSource = new EventSourcePlus("xxx", {
      maxRetryCount: 1,
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer xxx`,
      },
    });

    this.isConnected = true;
    this.eventSource.retryInterval = 3000;

    this.controller = this.eventSource.listen({
      onMessage: (res: SseMessage) => {
        try {
          const message = res.data;
          this.zone.run(() => {
            subject.next(new MessageEvent('message', { data: message }));
          });
        } catch (error) {
          console.error('Failed to parse message:', res.data, error);
        }
      },

      onRequestError: ({ request, error }) => {
        console.error('[Request Error]', request, error);
        this.reconnect(body, subject);
      },

      onResponseError: ({ response }) => {
        console.error('[Response Error]', response.status, response.body);
        if (response.status >= 400) {
          this.reconnect(body, subject);
        }
      },
    });

    return subject.asObservable();
  }


  close(): void {
    if (this.eventSource) {
      this.controller.abort();

      this.eventSource = null;
      this.isConnected = false;
      console.log('SSE Connection closed');
    }
  }

  private reconnect(
    body: { query: string; conversation_id: string, user: string, response_mode: string, inputs: string[] | null },
    subject: ReplaySubject<MessageEvent>
  ): void {
    if (this.isConnected) return;

    console.log('Reconnecting to SSE in 1 second...');
    setTimeout(() => {
      this.zone.run(() => {
        this.connect(body).subscribe(subject);
      });
    }, 1000);
  }

}
