import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonButton, IonProgressBar, IonInput, IonSegment, IonSegmentButton, IonLabel, IonSelect, 
  IonSelectOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cloudUploadOutline, documentOutline, checkmarkCircle, 
  trashOutline, logoYoutube, linkOutline, bulbOutline,
  chevronBackOutline, chevronForwardOutline, optionsOutline
} from 'ionicons/icons';


@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.page.html',
  styleUrls: ['./recorder.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonIcon, IonButton, IonProgressBar, 
    IonInput, IonSegment, IonSegmentButton, IonLabel, IonSelect, IonSelectOption
  ]
})
export class RecorderPage implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  // Gestión de pestañas y modos de carga
  uploadMode: 'file' | 'link' = 'file';
  youtubeUrl: string = '';

  // Variables para la gestión y asignación de rúbricas
  rubricaSeleccionada: string = 'viu-anid'; // Valor por defecto
  listaRubricas = [
    // 2 Rúbricas cargadas por defecto en el core de AIPitch
    { id: 'viu-anid', nombre: 'VIU ANID (Predeterminada)', institucional: true },
    { id: 'corfo-crea', nombre: 'CORFO Crea y Valida', institucional: true },
    // Simulación de rúbricas que el usuario cargó previamente en el rubrics-manager
    { id: 'usr-01', nombre: 'Bases Concurso Startup Ciencia 2026', institucional: false },
    { id: 'usr-02', nombre: 'Fondo UDP Innovación Alumnos', institucional: false }
  ];
  
  // Estado de Archivos Locales
  selectedFile: File | null = null;
  isDragging = false;
  uploadProgress = 0;
  isUploading = false;
  uploadComplete = false;

  // Estado del Carrusel de Tips (EDITAR ESTOO OAOO OAO)
  currentTipIndex = 0;
  tipInterval: any;
  tips = [
    { title: 'Iluminación Frontal', desc: 'Asegúrate de que la luz dé directo a tu rostro. Las sombras dificultan que la IA evalúe correctamente tu contacto visual.' },
    { title: 'Evita el Eco', desc: 'Graba en un lugar cerrado y sin ruido ambiente. Un audio limpio mejora drásticamente la precisión de la transcripción del discurso.' },
    { title: 'Regla de los 3 Minutos', desc: 'Los fondos como VIU ANID penalizan videos que superen el tiempo estricto de las bases. Mantén tu ritmo controlado.' },
    { title: 'Encuadre de Cámara', desc: 'Ubica la cámara a la altura de tus ojos y mantén los hombros visibles. Esto ayuda al análisis de tu lenguaje no verbal.' }
  ];

  constructor() {
    addIcons({ 
      cloudUploadOutline, documentOutline, checkmarkCircle, 
      trashOutline, logoYoutube, linkOutline, bulbOutline,
      chevronBackOutline, chevronForwardOutline 
    });
  }

  ngOnInit() {
    // Iniciar la rotación automática del carrusel de tips cada 6 segundos
    this.tipInterval = setInterval(() => {
      this.nextTip();
    }, 6000);
  }

  ngOnDestroy() {
    if (this.tipInterval) clearInterval(this.tipInterval);
  }

  // Funciones del Carrusel
  nextTip() {
    this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
  }

  prevTip() {
    this.currentTipIndex = this.currentTipIndex === 0 ? this.tips.length - 1 : this.currentTipIndex - 1;
  }

  // Funciones de control de subida de archivos
  triggerSelect() { this.fileInput.nativeElement.click(); }
  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragging = true; }
  onDragLeave() { this.isDragging = false; }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.type.startsWith('video/')) {
      this.selectedFile = file;
      this.uploadComplete = false;
      this.uploadProgress = 0;
    } else {
      alert('Por favor, selecciona un archivo de video válido (.mp4, .mov, etc.)');
    }
  }

  subirVideo() {
    if (!this.selectedFile) return;
    this.isUploading = true;
    this.uploadProgress = 0;
    const interval = setInterval(() => {
      this.uploadProgress += 0.1;
      if (this.uploadProgress >= 1) {
        clearInterval(interval);
        this.isUploading = false;
        this.uploadComplete = true;
      }
    }, 300);
  }

  procesarEnlace() {
    if (!this.youtubeUrl.includes('youtube.com') && !this.youtubeUrl.includes('youtu.be')) {
      alert('Por favor, ingresa una URL de YouTube válida.');
      return;
    }
    this.isUploading = true;
    this.uploadProgress = 0;
    const interval = setInterval(() => {
      this.uploadProgress += 0.2;
      if (this.uploadProgress >= 1) {
        clearInterval(interval);
        this.isUploading = false;
        this.uploadComplete = true;
        console.log('Enlace de YouTube vinculado de manera exitosa para procesamiento.');
      }
    }, 200);
  }

  eliminarArchivo() {
    this.selectedFile = null;
    this.youtubeUrl = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadComplete = false;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }
}