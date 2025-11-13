import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { NAME_SOFTWARE, SLOGAN } from '../../../constants'
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.services';
import { ActivatedRoute } from '@angular/router';

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
  nameBusiness: string = '';
  showBusinessField = true;

  private snackBar: MatSnackBar = inject(MatSnackBar);
  private authService: AuthService = inject(AuthService);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth,
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

      // Obtém e define o ID da empresa
      const businessId = await this.authService.getBusinessId(this.nameBusiness.toLowerCase());
      await this.authService.setBusinessId(businessId);

      // Realiza o login do usuário
      await this.afAuth.signInWithEmailAndPassword(email, password);
      this.router.navigate(['home']);

    } catch (error: any) {
      console.error('Erro no login:', error);
      this.snackBar.open(error, 'Fechar', { duration: 4000 });
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