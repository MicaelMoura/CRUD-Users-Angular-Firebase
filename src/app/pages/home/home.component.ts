import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  userName: string = 'Usuário';

  ngOnInit() {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('userName') : null;
    if (stored) {
      this.userName = stored;
    }
  }
}
