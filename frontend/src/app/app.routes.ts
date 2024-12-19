import { Routes } from '@angular/router';
import { DomainComponent } from './pages/domain/domain.component';
import { TopicViewComponent } from './pages/domain/topic-view/topic-view.component';
import { TopicEditComponent } from './pages/domain/topic-edit/topic-edit.component';
import { SearchComponent } from './pages/domain/search/search.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'domain/search',
    pathMatch: 'full',
  },
  {
    path: 'domain',
    component: DomainComponent,
    children: [
      { path: 'topic/:uuid', component: TopicViewComponent },
      { path: 'topic/add', component: TopicEditComponent },
      { path: 'topic/add/:uuid', component: TopicEditComponent },
      { path: 'topic/edit/:uuid', component: TopicEditComponent },
      { path: 'search', component: SearchComponent },
    ],
  },
];
