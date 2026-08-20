import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.services';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'loginForTenant',
      'sendPasswordResetEmail',
    ]);
    authService.loginForTenant.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [LoginComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']) },
        { provide: AuthService, useValue: authService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('autentica antes de navegar para a área interna', async () => {
    component.loginForm.setValue({
      business: 'tenant-a',
      email: 'user@example.com',
      password: 'senha-segura',
    });

    await component.onLogin();

    expect(authService.loginForTenant).toHaveBeenCalledOnceWith(
      'tenant-a',
      'user@example.com',
      'senha-segura',
    );
    expect(router.navigate).toHaveBeenCalledOnceWith(['vendas']);
  });
});
