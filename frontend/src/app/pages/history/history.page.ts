import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonContent, IonIcon, IonButton, IonBadge 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  timeOutline, eyeOutline, micOutline, arrowForwardOutline, 
  videocamOutline, calendarOutline, chevronForwardOutline, trendingUpOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonIcon, IonButton, IonBadge
  ]
})
export class HistoryPage implements OnInit {

  // Listado cronológico de ensayos previos del usuario
  listaEnsayos = [
    {
      id: 'p-03',
      titulo: 'Pitch Postulación VIU - Versión Final',
      fecha: '17 Mayo, 2026',
      rubrica: 'VIU ANID',
      scoreGlobal: 76,
      scoreNoVerbal: 82,
      scoreVerbal: 69
    },
    {
      id: 'p-02',
      titulo: 'Ensayo Ajuste de Tiempo y Oratoria',
      fecha: '14 Mayo, 2026',
      rubrica: 'VIU ANID',
      scoreGlobal: 68,
      scoreNoVerbal: 70,
      scoreVerbal: 65
    },
    {
      id: 'p-01',
      titulo: 'Primer Intento - Estructura Básica',
      fecha: '08 Mayo, 2026',
      rubrica: 'VIU ANID',
      scoreGlobal: 52,
      scoreNoVerbal: 55,
      scoreVerbal: 48
    }
  ];

  constructor() {
    addIcons({
      timeOutline, eyeOutline, micOutline, arrowForwardOutline,
      videocamOutline, calendarOutline, chevronForwardOutline, trendingUpOutline
    });
  }

  ngOnInit() {}
}