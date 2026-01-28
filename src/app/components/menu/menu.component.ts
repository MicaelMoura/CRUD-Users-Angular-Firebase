import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.services';
import { NAME_SOFTWARE, NAME_EMPRESA } from '../../../constants'

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  nameSoftware: string = NAME_SOFTWARE;
  nameEmpresa: string = NAME_EMPRESA.toLowerCase();

  constructor(
    private rota: Router,
    private authService: AuthService
  ) {}
  
   isSystemAdmin = computed(() => {
    const tenantId = this.authService.activeTenantId();
    return tenantId?.toLowerCase() === this.nameEmpresa;
  });

  logout() {
    const empresa = this.authService.activeTenantId();

    sessionStorage.clear();

    if (empresa) {
      this.rota.navigate(['login', empresa]);
    } else {
      this.rota.navigate(['login']);
    }
  }
}
