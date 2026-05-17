import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'recorder',
    loadComponent: () => import('./pages/recorder/recorder.page').then( m => m.RecorderPage)
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history/history.page').then( m => m.HistoryPage)
  },
  {
    path: 'pitch-detail',
    loadComponent: () => import('./pages/pitch-detail/pitch-detail.page').then( m => m.PitchDetailPage)
  },
  {
    path: 'feedback-panel',
    loadComponent: () => import('./pages/feedback-panel/feedback-panel.page').then( m => m.FeedbackPanelPage)
  },
  {
    path: 'rubrics-manager',
    loadComponent: () => import('./pages/rubrics-manager/rubrics-manager.page').then( m => m.RubricsManagerPage)
  },
];
