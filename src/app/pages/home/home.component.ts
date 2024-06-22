import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  userName: string | null;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.userName = sessionStorage.getItem('userName');
    }
    else {
      this.userName = 'Usuário';
    }
  }

}
