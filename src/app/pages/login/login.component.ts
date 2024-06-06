import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  userName: string;

  constructor(private rota: Router) {}

  login(){
    // Guarda o nome do usuário no sessionStorage
    sessionStorage.setItem('userName', this.userName);

    // Manda para a home
    this.rota.navigate(['home']);
  }
}
