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
import { Select } from 'primeng/select';

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
    TreeSelect,
    Select
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
    this.retrievedBlocks = [];

    if (this.query === '') {
      return;
    }
    const currentConversationId = this.conversationId || 'conversation_id';
    this.currentAnswer = '';

    this.searchToolSubscription = this.toolService
      .connect({
        query: this.query,
        model: this.selectedModel
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
            this.retrievedBlocks = data.metadata.artifacts
              .map((rr: any) => {
                const retrievedBlock: SearchRetrieval = {
                  type: rr.metadata.type == "PDF"
                    ? KnowledgeType.DOCUMENT
                    : KnowledgeType.TOPIC,
                  title: rr.metadata.document_name,
                  document_uuid: rr.metadata.document_id,
                  topic: {
                    uuid: rr.metadata.topic_uuid,
                    title: rr.metadata.topic_name
                  },
                  content_preview: rr.page_content,
                };
                return retrievedBlock;
              })

            if(this.retrievedBlocks.length == 0){this.kiContent = "No answer"}
            this.searchToolSubscription?.unsubscribe();
          }
        },
        error: err => {
          console.error('SSE Error:', err);
        }
      });
  }

  protected readonly KnowledgeType = KnowledgeType;
  models = ["gpt-4o-mini", "ollama-mistral", "mistral-large-latest"]
  selectedModel: string = "gpt-4o-mini";

  openBlock(searchBlock: SearchRetrieval) {
    console.log(searchBlock);
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
          data: { uuid: searchBlock.document_uuid },
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
