import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, FormsModule, Button],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    class: 'flex items-center px-8 gap-6 border-b-2 w-full h-16 bg-surface-50'
  }
})
export class HeaderComponent {}
