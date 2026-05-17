import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonIcon, IonButton, IonBadge, IonSpinner 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cloudUploadOutline, documentTextOutline, trashOutline, 
  checkmarkCircleOutline, cardOutline, optionsOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-rubrics-manager',
  templateUrl: './rubrics-manager.page.html',
  styleUrls: ['./rubrics-manager.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonIcon, 
    IonButton, IonBadge, IonSpinner
  ]
})
export class RubricsManagerPage implements OnInit {
  
  isDragging = false;
  isUploading = false;
  selectedFile: File | null = null;

  // Listado simulado de rúbricas ya procesadas por el pipeline de IA
  rubricasInstaladas = [
    {
      id: 'rub-01',
      concurso: 'ANID VIU 2026',
      descripcion: 'Valorización de la Investigación en la Universidad. Énfasis en base científica y modelo de negocios.',
      tipoArchivo: 'PDF',
      fechaCarga: '10 Mayo, 2026',
      estado: 'Activa',
      criteriosExtraidos: 5
    },
    {
      id: 'rub-02',
      concurso: 'CORFO Crea y Valida',
      descripcion: 'Línea de I+D+i empresarial. Evaluación estricta del problema de mercado y la novedad tecnológica.',
      tipoArchivo: 'DOCX',
      fechaCarga: '02 Mayo, 2026',
      estado: 'Activa',
      criteriosExtraidos: 4
    }
  ];

  constructor() {
    addIcons({
      cloudUploadOutline, documentTextOutline, trashOutline,
      checkmarkCircleOutline, cardOutline, optionsOutline
    });
  }

  ngOnInit() {}

  // Manejo del Drag & Drop nativo
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validarYAsignarArchivo(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.validarYAsignarArchivo(event.target.files[0]);
    }
  }

  validarYAsignarArchivo(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf' || extension === 'doc' || extension === 'docx') {
      this.selectedFile = file;
    } else {
      alert('Formato no permitido. Por favor sube un archivo PDF o Word (.doc, .docx)');
    }
  }

  // Simulación del envío al backend (FastAPI + Celery para extracción de texto)
  subirRubrica() {
    if (!this.selectedFile) return;
    
    this.isUploading = true;
    
    setTimeout(() => {
      this.rubricasInstaladas.unshift({
        id: 'rub-' + (this.rubricasInstaladas.length + 1),
        concurso: this.selectedFile!.name.replace(/\.[^/.]+$/, ""), // Remueve extensión
        descripcion: 'Rúbrica personalizada extraída mediante procesamiento de lenguaje natural (NLP).',
        tipoArchivo: this.selectedFile!.name.split('.').pop()?.toUpperCase() || 'PDF',
        fechaCarga: 'Hoy',
        estado: 'Activa',
        criteriosExtraidos: 6
      });
      
      this.isUploading = false;
      this.selectedFile = null;
    }, 2500); // Simulamos 2.5 segundos de parsing de IA
  }

  eliminarRubrica(id: string) {
    this.rubricasInstaladas = this.rubricasInstaladas.filter(r => r.id !== id);
  }
}