import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonButton, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, lockClosedOutline, personAddOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon, IonButton, IonInput]
})
export class RegisterPage implements OnInit {

  nombre: string = '';
  email: string = '';
  pass: string = '';

  constructor() {
    addIcons({ personOutline, mailOutline, lockClosedOutline, personAddOutline });
  }

  ngOnInit() {}

  onRegister() {
    console.log('Creando payload para el pipeline de registro de FastAPI:', this.nombre, this.email);
    // Aquí va el POST asíncrono para dar de alta al usuario en Postgres
  }
}