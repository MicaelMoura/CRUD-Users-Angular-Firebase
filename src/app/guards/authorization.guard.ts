import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserAccess } from '../interfaces/user';
import { AuthService } from '../services/auth.services';

export const authorizationGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitUntilReady();

  const tenantId = authService.activeTenantId();
  if (!tenantId || !authService.userUid()) {
    return router.parseUrl('/login');
  }

  if (route.data['systemTenantOnly'] === true && !authService.isSystemAdmin()) {
    return router.parseUrl('/vendas');
  }

  const roles = route.data['roles'] as UserAccess[] | undefined;
  if (roles && !authService.hasRole(...roles)) {
    return router.createUrlTree(['/login', tenantId]);
  }

  return true;
};
