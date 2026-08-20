import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NAME_SOFTWARE, SLOGAN } from '../../../constants'
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.services';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  nameSoftware: string = NAME_SOFTWARE;
  slogan: string = SLOGAN;
  nameBusiness: string = '';
  showBusinessField = true;

  private snackBar: MatSnackBar = inject(MatSnackBar);
  private authService: AuthService = inject(AuthService);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      business: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const empresaParam = params.get('business');
      if (empresaParam) {
        this.nameBusiness = empresaParam;
        this.showBusinessField = false;
        this.loginForm.patchValue({ business: this.nameBusiness });
      }
    });
  }

  async onLogin() {
    try {
      this.errorMessage = '';
      if (this.loginForm.invalid) {
        this.snackBar.open('Por favor, preencha o formulário corretamente.', 'Fechar', { duration: 4000 });
        return;
      }

      const { business, email, password } = this.loginForm.value;

      if ((!business && !this.nameBusiness) || !email || !password) {
        this.snackBar.open('Por favor, preencha todos os campos.', 'Fechar', { duration: 4000 });
        return;
      }

      if (this.nameBusiness == '') {
        this.nameBusiness = business; 
      }

      await this.authService.loginForTenant(this.nameBusiness, email, password);
      await this.router.navigate(['vendas']);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível realizar o login.';
      this.snackBar.open(message, 'Fechar', { duration: 4000 });
    }
  }

  async recoverPassword(): Promise<void> {
    this.errorMessage = '';
    const emailControl = this.loginForm.get('email');

    if (emailControl && emailControl.valid) {
      try {
        await this.authService.sendPasswordResetEmail(emailControl.value);
        this.snackBar.open('Email de recuperação enviado! Verifique sua caixa de entrada.', 'Fechar', { duration: 3000 });
      } catch {
        this.snackBar.open('Não foi possível enviar o e-mail de recuperação.', 'Fechar', { duration: 3000 });
      }
    } else {
      this.snackBar.open('Por favor, insira um email válido para continuar', 'Fechar', { duration: 3000 });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }
}
