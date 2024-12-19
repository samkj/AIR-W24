import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import {AvatarModule} from 'primeng/avatar';
import { DrawerModule } from 'primeng/drawer';
import {HeaderComponent} from './components/header/header.component';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { PrimeNG } from 'primeng/config';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NgClass } from '@angular/common';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

const DefaultTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f1f7fe',
      100: '#e1edfd',
      200: '#bddbfa',
      300: '#83bef6',
      400: '#419cef',
      500: '#1981de',
      600: '#0c64bd',
      700: '#0c64bd',
      800: '#0d447e',
      900: '#113b69',
      950: '#0b2446'
    }
  },
});

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonModule,
    AvatarModule,
    DrawerModule,
    HeaderComponent,
    SidebarComponent,
    NgClass,
    ConfirmPopupModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: {
    class: 'flex w-screen h-screen bg-gray-100'
  },
})
export class AppComponent {
  public config: PrimeNG = inject(PrimeNG);
  collapsed = true;
  hover: boolean = false;

  constructor() {
    this.config.theme.set({
      preset: DefaultTheme,
      options: {
        darkModeSelector: '.my-app-dark',
        cssLayer: {
          name: 'primeng',
          order: 'tailwind-base, primeng, tailwind-utilities'
        }
      }
    });
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}
