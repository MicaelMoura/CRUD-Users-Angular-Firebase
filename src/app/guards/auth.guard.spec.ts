import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.services';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  let authState: {
    uid: string | null;
    tenant: string | null;
    role: string | null;
  };

  beforeEach(() => {
    authState = { uid: null, tenant: null, role: null };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            waitUntilReady: () => Promise.resolve(),
            userUid: () => authState.uid,
            activeTenantId: () => authState.tenant,
            userRole: () => authState.role,
          },
        },
      ],
    });
  });

  it('permite usuário autenticado com tenant e papel restaurados', async () => {
    authState = { uid: 'user-a', tenant: 'tenant-a', role: 'usuario' };

    const result = await TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBeTrue();
  });

  it('redireciona sessão incompleta para o login', async () => {
    const router = TestBed.inject(Router);

    const result = await TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(router.serializeUrl(result as ReturnType<Router['parseUrl']>)).toBe('/login');
  });
});
