import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'recorder',
        loadComponent: () => import('../pages/recorder/recorder.page').then(m => m.RecorderPage)
      },
      {
        path: 'pitch-detail',
        loadComponent: () => import('../pages/pitch-detail/pitch-detail.page').then(m => m.PitchDetailPage)
      },
            {
        path: 'feedback-panel',
        loadComponent: () => import('../pages/feedback-panel/feedback-panel.page').then(m => m.FeedbackPanelPage)
      },
                  {
        path: 'rubrics-manager',
        loadComponent: () => import('../pages/rubrics-manager/rubrics-manager.page').then(m => m.RubricsManagerPage)
      },
      {
        path: 'history',
        loadComponent: () => import('../pages/history/history.page').then(m => m.HistoryPage)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];