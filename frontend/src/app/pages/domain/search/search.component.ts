import { Component, signal } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { InputGroup } from 'primeng/inputgroup';
import { Button } from 'primeng/button';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import { Topic } from '../../../models/topic.model';
import { KnowledgeType, SearchRetrieval } from '../../../models/search-retrieval.model';
import { TopicService } from '../../../services/topic.service';
import { TopicDocumentPdfPreviewDialogComponent } from '../../../components/topic-document-pdf-preview-dialog/topic-document-pdf-preview-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';
import { Skeleton } from 'primeng/skeleton';
import { TreeSelect } from 'primeng/treeselect';
import { TreeNode } from 'primeng/api';
import { Document } from '../../../models/document.model';
import { Subscription } from 'rxjs';
import { ToolService } from '../../../services/tool.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    InputText,
    InputGroup,
    Button,
    InputGroupAddon,
    NgClass,
    FormsModule,
    Divider,
    Tag,
    RouterLink,
    Skeleton,
    TreeSelect
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  isStyleActive: boolean = false;
  query: string = '';

  askKi = false;

  kiContent = '';
  selectTopic: any;
  isLoading = false;

  topicFilter = false;
  retrievedBlocks: SearchRetrieval[] = [];
  treeNodes = signal<TreeNode[]>([]);
  conversationId: string = '';

  currentAnswer: string = '';
  searchToolSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private topicService: TopicService,
    private router: Router,
    private dialogService: DialogService,
    private toolService: ToolService
  ) {
    this.route.queryParams.subscribe(params => {
      this.isStyleActive = false;
      this.askKi = false;
      this.query = params['text'];
      if (params['askAI'] == 'true') {
        this.askAI();
      }
    });

    this.topicService.getAllTopics().subscribe(topics => {
      this.treeNodes.set(
        topics.map(t => {
          return this.mapTopicToTreeNode(t);
        })
      );
    });
  }

  askAI() {
    this.askKi = true;
    this.isStyleActive = true;
    this.kiContent = '';

    if (this.query === '') {
      return;
    }
    const currentConversationId = this.conversationId || 'conversation_id';
    this.currentAnswer = '';

    this.searchToolSubscription = this.toolService
      .connect({
        query: this.query,
        conversation_id: '',
        user: 'default-user',
        response_mode: 'streaming',
        inputs: null
      })
      .subscribe({
        next: event => {
          const data = JSON.parse(event.data);
          if (data.event == 'message') {
            this.kiContent += data.answer;
          }
          if (data.event == 'message_end') {
            setTimeout(() => {
              this.isStyleActive = false;
            }, 1500);
            this.retrievedBlocks = data.metadata.retriever_resources.map((rr: any) => {
              const retrievedBlock: SearchRetrieval = {
                type: rr.document_name.includes('.pdf')
                  ? KnowledgeType.DOCUMENT
                  : KnowledgeType.TOPIC,
                title: rr.document_name,
                topic: {
                  uuid: rr.document_id,
                  title: rr.document_name
                },
                content_preview: rr.content,
                score: rr.score
              };
              return retrievedBlock;
            }).filter((r: SearchRetrieval) => r.score > 0.2);
            this.searchToolSubscription?.unsubscribe();
          }
        },
        error: err => {
          console.error('SSE Error:', err);
        }
      });
  }

  protected readonly KnowledgeType = KnowledgeType;

  retrieveBlocks() {
    this.retrievedBlocks = [];
    this.isLoading = true;
    this.topicService.retrievalKnowledge(this.query, '').subscribe(blocks => {
      this.retrievedBlocks = blocks;
      this.isLoading = false;
    });
  }

  openBlock(searchBlock: SearchRetrieval) {
    switch (searchBlock.type) {
      case KnowledgeType.FAQ:
        this.router.navigate(['/domain/topic', searchBlock.topic.uuid]);
        break;
      case KnowledgeType.TOPIC:
        this.router.navigate(['/domain/topic', searchBlock.topic.uuid]);
        break;
      case KnowledgeType.DOCUMENT:
        this.dialogService.open(TopicDocumentPdfPreviewDialogComponent, {
          header: searchBlock.title,
          modal: true,
          closable: true,
          width: '70%',
          position: 'top',
          data: { document_uuid: searchBlock.document_uuid },
          breakpoints: {
            '960px': '75vw',
            '640px': '90vw'
          }
        });
        break;
      default:
    }
  }

  private mapTopicToTreeNode(topic: Topic): TreeNode<Document> {
    const topicChildrenTreeNodes =
      topic.children?.map(child => this.mapTopicToTreeNode(child)) || [];

    return {
      key: topic.uuid,
      label: topic.title,
      selectable: true,
      children: [...topicChildrenTreeNodes],
      expanded: false,
      expandedIcon: 'pi pi-folder-open',
      type: 'url',
      collapsedIcon: 'pi pi-folder'
    };
  }
}
