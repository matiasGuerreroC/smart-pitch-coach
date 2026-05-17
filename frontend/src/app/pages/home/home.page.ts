import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  documentTextOutline, videocamOutline, ribbonOutline, statsChartOutline 
} from 'ionicons/icons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon]
})
export class HomePage {
  constructor() {
    // Registrar los nuevos iconos del menú modular
    addIcons({ 
      documentTextOutline, 
      videocamOutline, 
      ribbonOutline, 
      statsChartOutline 
    });
  }
}