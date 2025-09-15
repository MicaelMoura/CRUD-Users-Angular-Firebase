import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { NAME_SOFTWARE, SLOGAN } from '../../../constants'

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

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
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
}