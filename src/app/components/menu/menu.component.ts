import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.services';
import { NAME_SOFTWARE } from '../../../constants'

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss',
    standalone: false
})
export class MenuComponent {
  nameSoftware: string = NAME_SOFTWARE;

  constructor(
    private rota: Router,
    private authService: AuthService
  ) {}
  
  isSystemAdmin = computed(() => this.authService.isSystemAdmin());

  async logout(): Promise<void> {
    const empresa = this.authService.activeTenantId();
    await this.authService.logout();
    await this.rota.navigate(empresa ? ['login', empresa] : ['login']);
  }
}
