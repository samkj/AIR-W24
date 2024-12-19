import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileRemoveEvent, FileSelectEvent, FileUpload, FileUploadEvent } from 'primeng/fileupload';
import { InputText } from 'primeng/inputtext';
import { Document } from '../../models/document.model';
import { Topic } from '../../models/topic.model';
import { TopicService } from '../../services/topic.service';

interface UploadEvent {
  originalEvent: Event;
  files: File[];
}

enum Mode {
  EDIT = 'edit',
  ADD = 'add'
}

@Component({
  selector: 'app-topic-document-item-upload-dialog',
  standalone: true,
  imports: [Button, InputText, FileUpload, FormsModule],
  templateUrl: './topic-document-upload-dialog.component.html',
  styleUrl: './topic-document-upload-dialog.component.scss'
})
export class TopicDocumentUploadDialogComponent {
  private messageService = inject(MessageService);
  private config = inject(DynamicDialogConfig);
  private topicService = inject(TopicService);

  ref = inject(DynamicDialogRef);
  isUploading = signal(false);
  dialogData = signal<{ file: Document; mode: Mode; topic: Topic }>(this.config.data);
  mode = computed(() => this.dialogData().mode);
  isAddMode = computed(() => this.mode() === Mode.ADD);
  isEditMode = computed(() => this.mode() === Mode.EDIT);
  uploadedFiles = signal<File[]>([]);
  file = computed(() => (this.mode() === Mode.EDIT ? this.dialogData().file : null));
  // TODO: build name update and maybe document replacement
  newName = signal(this.config.data?.file?.name);

  onUpload(event: FileUploadEvent) {
    const currentFiles = this.uploadedFiles();
    this.uploadedFiles.set([...currentFiles, ...event.files]);

    this.messageService.add({
      severity: 'info',
      summary: 'File Uploaded',
      detail: ''
    });
  }

  choose($event: MouseEvent, callback: any) {
    callback();
  }

  save(): void {
    this.isUploading.set(true);
    const file = this.uploadedFiles()[0];
    this.topicService.uploadDocument(this.dialogData().topic.uuid, file).subscribe(document => {
      this.isUploading.set(false);
      this.ref.close(document);
    });
  }

  onSelect($event: FileSelectEvent) {
    const currentFiles = this.uploadedFiles();
    this.uploadedFiles.set([...currentFiles, ...$event.files]);
  }

  onRemove($event: FileRemoveEvent) {
    this.uploadedFiles.set([]);
  }
}
