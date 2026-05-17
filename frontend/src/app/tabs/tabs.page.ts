import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // Opcional: si usas enlaces directos
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonRouterOutlet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, videocamOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  // 
  imports: [
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel, 
    IonRouterOutlet, 
    RouterLink,      
    RouterLinkActive 
  ]
})
export class TabsPage {
  constructor() {
    addIcons({ homeOutline, videocamOutline, timeOutline });
  }
}