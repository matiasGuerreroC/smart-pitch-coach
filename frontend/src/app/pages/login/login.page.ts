import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonButton, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, logInOutline, sparklesOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon, IonButton, IonInput]
})
export class LoginPage implements OnInit {
  
  email: string = '';
  pass: string = '';

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, logInOutline, sparklesOutline });
  }

  ngOnInit() {}

  onLogin() {
    console.log('Disparando flujo de autenticación JWT hacia FastAPI:', this.email);
    // Aquí va elservicio HTTP hacia tu endpoint de login
  }
}