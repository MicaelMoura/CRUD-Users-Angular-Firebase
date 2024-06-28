import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NAME_SOFTWARE, SLOGAN } from '../../../constants'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  userName: string;
  nameSoftware: string = NAME_SOFTWARE;
  slogan: string = SLOGAN;

  constructor(private rota: Router) {}

  login(){
    // Guarda o nome do usuário no sessionStorage
    sessionStorage.setItem('userName', this.userName);

    // Manda para a home
    this.rota.navigate(['home']);
  }
}
