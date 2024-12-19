import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { DialogService } from 'primeng/dynamicdialog';
import { Editor } from 'primeng/editor';
import { InputText } from 'primeng/inputtext';
import { SplitButton } from 'primeng/splitbutton';
import { Tooltip } from 'primeng/tooltip';
import { switchMap } from 'rxjs';
import { TopicDocumentItemComponent } from '../../../components/topic-document-item/topic-document-item.component';
import { TopicDocumentUploadDialogComponent } from '../../../components/topic-document-upload-dialog/topic-document-upload-dialog.component';
import { Topic } from '../../../models/topic.model';
import { TopicService } from '../../../services/topic.service';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-topic-edit',
  standalone: true,
  imports: [
    Divider,
    TopicDocumentItemComponent,
    Button,
    RouterLink,
    Tooltip,
    InputText,
    FormsModule,
    Editor,
    SplitButton,
    ReactiveFormsModule,
    TableModule,
  ],
  templateUrl: './topic-edit.component.html',
  styleUrl: './topic-edit.component.scss',
  host: {
    class: 'flex flex-col justify-space-between h-full'
  }
})
export class TopicEditComponent implements OnInit {
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private topicService = inject(TopicService);
  private router = inject(Router);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);

  topic = signal<Topic | undefined>(undefined);
  breadcrumbs = computed(() =>
    this.topic() ? this.topicService.getBreadcrumbsRouteOfTopic(this.topic()!.uuid) : []
  );
  topicForm = this.fb.group({
    title: ['', Validators.required],
    description: ['']
  });
  isSaving = signal(false);

  items = [
    {
      label: 'Neues hochladen',
      command: () => this.createFile()
    }
  ];

  ngOnInit() {
    this.route.params
      .pipe(switchMap(params => this.topicService.getTopicByUUID(params['uuid'])))
      .subscribe(topic => {
        if (!topic) return;

        const title = this.route.snapshot.queryParams['new'] === 'true' ? '' : topic.title;
        const description = topic.description;
        this.topicForm.patchValue({ title, description });

        this.topicService.setSelectedTopic(topic);
        this.topic.set(topic);
      });
  }

  createFile(): void {
    this.dialogService
      .open(TopicDocumentUploadDialogComponent, {
        header: 'Dokument erstellen',
        width: '50%',
        modal: true,
        closable: true,
        baseZIndex: 200,
        data: { mode: 'add', topic: this.topic() }
      })
      .onClose.subscribe(document => this.topic()?.documents.push(document));
  }

  deleteTopic(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Möchten Sie wirklich das Thema löschen?',
      header: 'Thema löschen',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'Abbrechen',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Löschen',
        severity: 'danger'
      },

      accept: () => {
        this.topicService.deleteTopic(this.topic()!.uuid).subscribe(() => {
          this.messageService.add({
            severity: 'info',
            summary: 'Bestätigung',
            detail: 'Thema gelöscht'
          });
          this.router.navigate(['/domain']);
        });
      }
    });
  }

  saveTopic() {
    if (!this.topicForm.valid) return;

    this.isSaving.set(true);
    this.topicService
      .updateTopic({
        ...this.topicForm.value,
        uuid: this.topic()?.uuid,
        parent_uuid: this.topic()?.parent_uuid
      } as Topic)
      .subscribe(() => {
        this.isSaving.set(false);
        this.router.navigate(['domain/topic', this.topic()!.uuid]);
      });
  }

  discardTopic() {
    this.router.navigate(['domain/topic', this.topic()!.uuid]);
  }
}
