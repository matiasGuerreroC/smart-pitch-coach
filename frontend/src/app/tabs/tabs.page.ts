import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // Opcional: si usas enlaces directos
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonRouterOutlet // <-- 1. IMPORTANTE: Importar el outlet nativo de Ionic
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, videocamOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  // 2. IMPORTANTE: Añadirlo aquí abajo en la lista de imports para que el HTML lo reconozca
  imports: [
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel, 
    IonRouterOutlet, // <-- Declararlo aquí
    RouterLink,      // Lo añadimos ya que usamos el menú lateral en web
    RouterLinkActive // Lo añadimos para manejar los estados activos del menú
  ]
})
export class TabsPage {
  constructor() {
    addIcons({ homeOutline, videocamOutline, timeOutline });
  }
}