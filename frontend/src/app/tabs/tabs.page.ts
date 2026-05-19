import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, videocamOutline, timeOutline, menuOutline, eyeOutline, chatbubblesOutline, cardOutline, logOutOutline } from 'ionicons/icons';
import { ActionSheetController } from '@ionic/angular';

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
    RouterLinkActive,
    IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent
  ],
  providers: [ActionSheetController]
})


export class TabsPage {

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private router: Router
  ) {
    addIcons({
      homeOutline, videocamOutline, eyeOutline, chatbubblesOutline,
      timeOutline, cardOutline, logOutOutline, menuOutline
    });
  }

  // Método para desplegar las opciones ocultas en celulares
  async abrirMenuMas() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Herramientas AIPitch',
      cssClass: 'custom-action-sheet', // Para darle nuestro look premium en el SCSS
      buttons: [
        {
          text: 'Detalle del Pitch',
          icon: 'eye-outline',
          handler: () => { this.router.navigate(['/tabs/pitch-detail']); }
        },
        {
          text: 'Retroalimentación completa',
          icon: 'chatbubbles-outline',
          handler: () => { this.router.navigate(['/tabs/feedback-panel']); }
        },
        {
          text: 'Gestor de Rúbricas',
          icon: 'card-outline',
          handler: () => { this.router.navigate(['/tabs/rubrics-manager']); }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });

    await actionSheet.present();
  }
}