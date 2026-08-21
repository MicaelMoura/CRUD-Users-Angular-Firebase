import { Component, EventEmitter, HostBinding, HostListener, Output, computed, signal } from '@angular/core';
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
  collapsed = signal(false);
  mobileOpen = signal(false);

  @Output() collapsedChange = new EventEmitter<boolean>();

  @HostBinding('class.menu-collapsed')
  get hostCollapsed(): boolean {
    return this.collapsed();
  }

  constructor(
    private rota: Router,
    private authService: AuthService
  ) {}
  
  isSystemAdmin = computed(() => this.authService.isSystemAdmin());

  toggleMenu(): void {
    if (this.isMobileViewport()) {
      this.mobileOpen.update((open) => !open);
      return;
    }

    this.collapsed.update((collapsed) => !collapsed);
    this.collapsedChange.emit(this.collapsed());
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  @HostListener('window:resize')
  handleResize(): void {
    if (!this.isMobileViewport()) {
      this.closeMobileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.closeMobileMenu();
  }

  async logout(): Promise<void> {
    const empresa = this.authService.activeTenantId();
    await this.authService.logout();
    await this.rota.navigate(empresa ? ['login', empresa] : ['login']);
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 900;
  }
}
