import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DialogService } from 'primeng/dynamicdialog';
import { TieredMenu } from 'primeng/tieredmenu';
import { Document } from '../../models/document.model';
import { Topic } from '../../models/topic.model';
import { TopicService } from '../../services/topic.service';
import {
  TopicDocumentPdfPreviewDialogComponent
} from '../topic-document-pdf-preview-dialog/topic-document-pdf-preview-dialog.component';

@Component({
  selector: 'app-topic-document-item',
  standalone: true,
  imports: [Button, TieredMenu, DialogModule],
  templateUrl: './topic-document-item.component.html',
  styleUrl: './topic-document-item.component.scss'
})
export class TopicDocumentItemComponent implements OnInit {
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private topicService = inject(TopicService);

  file = input.required<Document>();
  editMode = input.required<boolean>();
  topic = input.required<Topic>();
  visible = signal(false);
  imageUrl = signal<string | null>(null);
  items = computed(() => {
    return [
      {
        label: 'Download',
        icon: 'pi pi-download',
        command: () => {
          this.topicService.downloadPdf(this.file().uuid).subscribe(blob => {
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = this.file().name;
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
        }
      },
      {
        label: 'Delete',
        visible: this.editMode() && this.file()?.topicUuid != null &&
          this.file()?.topicUuid == this.topic().uuid,
        icon: 'pi pi-trash',
        command: () => {
          this.confirmationService.confirm({
            message: 'Are u sure to delete the document?',
            header: 'Delete document',
            icon: 'pi pi-info-circle',
            rejectLabel: 'Cancel',
            rejectButtonProps: {
              label: 'Close',
              severity: 'secondary',
              outlined: true
            },
            acceptButtonProps: {
              label: 'Delete',
              severity: 'danger'
            },

            accept: () => this.deleteDocument()
          });
        }
      }
    ];
  });

  ngOnInit(): void {
  }

  openView() {
    this.visible.set(true);
    this.dialogService.open(TopicDocumentPdfPreviewDialogComponent, {
      header: this.file().name,
      modal: true,
      closable: true,
      position: 'top',
      contentStyle: { 'overflow-y': 'unset' },
      width: '70%',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw'
      },
      data: {
        uuid: this.file().uuid
      }
    });
  }

  deleteDocument() {
    this.topicService.deleteDocumentByUUID(this.file().uuid).subscribe(() => {
      const topic = this.topic()!;
      const index = topic.documents.findIndex(document => document.uuid === this.file().uuid);
      topic.documents.splice(index, 1);

      this.messageService.add({
        severity: 'info',
        summary: 'Bestätigung',
        detail: 'Dokument wurde gelöscht'
      });
    });
  }

  getMimeTypeIcon(name: string): string {
    if (name.includes('.pdf')) return 'https://www.svgrepo.com/show/28209/pdf.svg';
    if (name.includes('.xlsx'))
      return 'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/file/excel.svg';
    return '';
  }
}
