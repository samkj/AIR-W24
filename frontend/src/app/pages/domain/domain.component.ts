import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast, ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-domain',
  standalone: true,
  imports: [RouterOutlet, Toast, ConfirmDialog, ToastModule],
  templateUrl: './domain.component.html',
  styleUrl: './domain.component.scss',
  host: {
    class: 'flex-1 m-8 overflow-auto bg-surface-0 rounded-lg shadow'
  }
})
export class DomainComponent implements OnInit {
  ngOnInit(): void {}
}
