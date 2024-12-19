import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Editor } from 'primeng/editor';
import { Tooltip } from 'primeng/tooltip';
import { switchMap } from 'rxjs';
import { TopicDocumentItemComponent } from '../../../components/topic-document-item/topic-document-item.component';
import { Topic } from '../../../models/topic.model';
import { TopicService } from '../../../services/topic.service';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-topic-view',
  standalone: true,
  imports: [
    Button,
    Tooltip,
    Divider,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    DatePipe,
    TopicDocumentItemComponent,
    RouterLink,
    Editor,
    FormsModule,
    ReactiveFormsModule,
    TableModule
  ],
  templateUrl: './topic-view.component.html',
  styleUrl: './topic-view.component.scss',
  host: {
    class: 'flex flex-col bg-surface-0 justify-space-between h-full'
  }
})
export class TopicViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private topicService = inject(TopicService);

  public = input(false);
  topic = signal<Topic | null>(null);
  breadcrumbs = computed(() =>
    this.topic() ? this.topicService.getBreadcrumbsRouteOfTopic(this.topic()!.uuid) : []
  );
  editorControl = computed(() => new FormControl(this.topic()?.description || ''));

  ngOnInit() {
    this.route.params
      .pipe(switchMap(params => this.topicService.getTopicByUUID(params['uuid'])))
      .subscribe(topic => {
        this.topic.set(topic);
        this.topicService.setSelectedTopic(topic);
      });
  }
}
