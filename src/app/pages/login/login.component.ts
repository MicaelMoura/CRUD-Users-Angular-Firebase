import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { NAME_SOFTWARE, SLOGAN } from '../../../constants'
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  nameSoftware: string = NAME_SOFTWARE;
  slogan: string = SLOGAN;

  private snackBar: MatSnackBar = inject(MatSnackBar);
  private authService: AuthService = inject(AuthService);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      business: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {}

  async onLogin() {
    this.errorMessage = '';
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, preencha o formulário corretamente.';
      return;
    }

    const businessId = await this.authService.getBusinessId(this.loginForm.value.business);
    await this.authService.setBusinessId(businessId);

    try {
      const { email, password } = this.loginForm.value;
      await this.afAuth.signInWithEmailAndPassword(email, password);
      console.log('Login efetuado com sucesso!');

      this.router.navigate(['home']); // Redireciona para a home
    } catch (error: any) {
      console.error('Erro no login:', error.message);
      this.errorMessage = 'Email ou senha incorretos.';
    }
  }

  async recoverPassword(): Promise<void> {
    this.errorMessage = '';
    const emailControl = this.loginForm.get('email');

    if (emailControl && emailControl.valid) {
      try {
        await this.afAuth.sendPasswordResetEmail(emailControl.value);
        this.snackBar.open('Email de recuperação enviado! Verifique sua caixa de entrada.', 'Fechar', { duration: 3000 });
      } catch (error: any) {
        console.error('Erro ao enviar email de recuperação:', error.message);
      }
    } else {
      this.snackBar.open('Por favor, insira um email válido para continuar', 'Fechar', { duration: 3000 });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }
}