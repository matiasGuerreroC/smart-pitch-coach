import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonButton, IonBadge, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  eyeOutline, micOutline, timeOutline, alertCircleOutline, 
  playCircleOutline, checkmarkCircleOutline, sparklesOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-pitch-detail',
  templateUrl: './pitch-detail.page.html',
  styleUrls: ['./pitch-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, FormsModule, IonIcon, IonButton, IonBadge, IonSegment, IonSegmentButton, IonLabel]
})
export class PitchDetailPage {
  activeTab: 'no-verbal' | 'verbal' = 'no-verbal';

  // Reporte estructurado proveniente de la IA y base de datos
  reporteData = {
    titulo: 'Pitch Postulación VIU - Versión Final',
    scoreGlobal: 76,
    duracion: '2:45 min',
    fecha: '16 Mayo, 2026',
    
    // Módulo 1: Lenguaje No Verbal (Visión por Computadora)
    noVerbal: {
      score: 82,
      contactoVisual: '84%',
      postura: 'Estable',
      // Recortes de escenas o fotogramas clave con marcas de tiempo (Timestamps)
      anotacionesVideo: [
        {
          id: 'nv-1',
          timestamp: '00:42',
          tipo: 'alerta',
          titulo: 'Pérdida de Contacto Visual',
          desc: 'Desviaste la mirada hacia abajo por más de 4 segundos. ¿Estabas leyendo notas?',
          thumbnail: 'assets/thumbnails/clip_0042.jpg' // Simulación de ruta en S3
        },
        {
          id: 'nv-2',
          timestamp: '01:15',
          tipo: 'exito',
          titulo: 'Excelente Expresión Corporal',
          desc: 'Uso óptimo de manos para gesticular y enfatizar la ventaja competitiva.',
          thumbnail: 'assets/thumbnails/clip_0115.jpg'
        },
        {
          id: 'nv-3',
          timestamp: '02:02',
          tipo: 'alerta',
          titulo: 'Parpadeo Excesivo / Nerviosismo',
          desc: 'Se detectó un pico en la tasa de parpadeo coincidiendo con la sección de modelo de negocios.',
          thumbnail: 'assets/thumbnails/clip_0202.jpg'
        }
      ]
    },

    // Módulo 2: Lenguaje Verbal (NLP / Transcripción)
    verbal: {
      score: 69,
      muletillasCount: 14,
      ritmo: '145 palabras/min',
      anotacionesTexto: [
        {
          id: 'v-1',
          timestamp: '00:15',
          tipo: 'critico',
          titulo: 'Uso de Muletilla Repetitiva',
          desc: 'Repetición consecutiva de "eh... o sea". Intenta pausar en lugar de rellenar con sonido.'
        },
        {
          id: 'v-2',
          timestamp: '01:40',
          tipo: 'alerta',
          titulo: 'Omisión de Base Tecnológica',
          desc: 'Mencionas el problema pero olvidas detallar el componente científico/tecnológico requerido por ANID.'
        }
      ]
    }
  };

  constructor() {
    addIcons({ 
      eyeOutline, micOutline, timeOutline, alertCircleOutline, 
      playCircleOutline, checkmarkCircleOutline, sparklesOutline 
    });
  }

  reproducirFragmento(timestamp: string) {
    console.log(`Moviendo reproductor al segundo exacto: ${timestamp}`);
    // Aquí se inyectará la lógica para controlar el API nativa del Player de video
  }
}