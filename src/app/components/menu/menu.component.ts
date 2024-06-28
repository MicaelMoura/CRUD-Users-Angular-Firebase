import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NAME_SOFTWARE } from '../../../constants'

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  nameSoftware: string = NAME_SOFTWARE;

  constructor(private rota: Router) {}
  
  logout() {
    sessionStorage.clear();

    this.rota.navigate(['home']);
  }
}
