import { Component, inject, OnInit, signal } from '@angular/core';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TopicService } from '../../services/topic.service';

@Component({
  selector: 'app-topic-document-item-dialog',
  standalone: true,
  imports: [PdfJsViewerModule],
  templateUrl: './topic-document-pdf-preview-dialog.component.html',
  styleUrl: './topic-document-pdf-preview-dialog.component.scss'
})
export class TopicDocumentPdfPreviewDialogComponent implements OnInit {
  private topicSerivce = inject(TopicService);
  private dialogData = inject(DynamicDialogConfig);
  // hack to satisfy pdf library
  pdf = signal<Blob>(null!);
  ngOnInit(): void {
    this.topicSerivce
      .downloadPdf(this.dialogData.data.uuid)
      .subscribe(blob => this.pdf.set(blob));
  }
}
