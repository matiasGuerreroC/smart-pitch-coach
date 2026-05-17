import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonIcon, IonButton, IonBadge, IonProgressBar 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  sparklesOutline, checkmarkCircleOutline, alertCircleOutline, 
  trendingUpOutline, trophyOutline, shieldCheckmarkOutline, 
  arrowForwardOutline, analyticsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-feedback-panel',
  templateUrl: './feedback-panel.page.html',
  styleUrls: ['./feedback-panel.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonIcon, 
    IonButton, IonBadge, IonProgressBar
  ]
})
export class FeedbackPanelPage implements OnInit {
  
  // Datos consolidados del análisis de IA cruzados con rúbrica ANID
  feedbackData = {
    pitchTitulo: 'Pitch Postulación VIU - Versión Final',
    fechaEvaluacion: '17 Mayo, 2026',
    scoreFinal: 76,
    estadoRubrica: 'Aprobación Crítica',
    
    // Desglose de macro-métricas para los gráficos de anillo y lineales
    metricas: {
      estructuraVerbal: 69,    // NLP
      lenguajeNoVerbal: 82,    // Computer Vision
      coherenciaCientifica: 78 // Alineación con bases VIU
    },

    // Distribución del tiempo del Pitch (Métrica clave para fondos de 3 minutos)
    distribucionTiempo: [
      { seccion: 'Problema & Oportunidad', porcentaje: 25, status: 'ok' },
      { seccion: 'Solución & Base Científica', porcentaje: 45, status: 'ok' },
      { seccion: 'Modelo de Negocios / Plan', porcentaje: 18, status: 'bajo' },
      { seccion: 'Equipo & Cierre', porcentaje: 12, status: 'ok' }
    ],

    // Recomendaciones críticas automatizadas redactadas por la IA
    insightsCriticos: [
      {
        id: 1,
        tipo: 'warning',
        categoria: 'Lenguaje Verbal',
        titulo: 'Debilidad en la Defensa Tecnológica',
        descripcion: 'Dedicas solo un 12% del tiempo a detallar el componente científico/tecnológico. La rúbrica ANID VIU exige profundizar en la validación de la hipótesis en este punto.'
      },
      {
        id: 2,
        tipo: 'success',
        categoria: 'Lenguaje No Verbos',
        titulo: 'Excelente Dominio Escénico',
        descripcion: 'Tu contacto visual se mantuvo estable en un 84%. Los algoritmos de gesticulación detectaron un uso óptimo de manos para enfatizar los hitos del proyecto.'
      },
      {
        id: 3,
        tipo: 'danger',
        categoria: 'Ritmo y Oratoria',
        titulo: 'Pico de Ansiedad Detectado',
        descripcion: 'En el minuto 01:40 tu velocidad de habla subió a 165 palabras por minuto, coincidiendo con el uso repetitivo de la muletilla "eh... o sea".'
      }
    ]
  };

  constructor() {
    addIcons({
      sparklesOutline, checkmarkCircleOutline, alertCircleOutline,
      trendingUpOutline, trophyOutline, shieldCheckmarkOutline,
      arrowForwardOutline, analyticsOutline
    });
  }

  ngOnInit() {}
  
  getScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 65) return 'warning';
    return 'danger';
  }
}