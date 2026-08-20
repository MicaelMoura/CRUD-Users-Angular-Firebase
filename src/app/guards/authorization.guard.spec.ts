import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { UserAccess } from '../interfaces/user';
import { AuthService } from '../services/auth.services';
import { authorizationGuard } from './authorization.guard';

describe('authorizationGuard', () => {
  const state = {} as RouterStateSnapshot;
  let role: UserAccess;
  let systemAdmin: boolean;

  beforeEach(() => {
    role = 'usuario';
    systemAdmin = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            waitUntilReady: () => Promise.resolve(),
            userUid: () => 'user-a',
            activeTenantId: () => 'tenant-a',
            hasRole: (...roles: UserAccess[]) => roles.includes(role),
            isSystemAdmin: () => systemAdmin,
          },
        },
      ],
    });
  });

  it('permite papel autorizado', async () => {
    const route = { data: { roles: ['usuario', 'administrador'] } } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => authorizationGuard(route, state));

    expect(result).toBeTrue();
  });

  it('bloqueia rota administrativa para usuário comum', async () => {
    const router = TestBed.inject(Router);
    const route = { data: { roles: ['administrador'] } } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => authorizationGuard(route, state));

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/login/tenant-a');
  });

  it('restringe empresas ao administrador do tenant do sistema', async () => {
    role = 'administrador';
    const router = TestBed.inject(Router);
    const route = {
      data: { roles: ['administrador'], systemTenantOnly: true },
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => authorizationGuard(route, state));

    expect(router.serializeUrl(result as ReturnType<Router['parseUrl']>)).toBe('/vendas');
  });
});
