import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateUserInput, UpdateUserInput, User, UserAccess } from '../../../interfaces/user';
import { UsersService } from '../../../services/users.service';

export interface UserFormDialogData {
  user: User | null;
  empresaId: string;
}

type UserForm = FormGroup<{
  nome: FormControl<string>;
  email: FormControl<string>;
  acesso: FormControl<UserAccess>;
  senha: FormControl<string>;
  confirmarSenha: FormControl<string>;
}>;

@Component({
  selector: 'app-modal-form-user',
  templateUrl: './modal-form-user.component.html',
  styleUrl: './modal-form-user.component.scss',
  standalone: false,
})
export class ModalFormUserComponent implements OnInit {
  formUser!: UserForm;
  isEditMode = false;
  isSaving = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private formBuilder: NonNullableFormBuilder,
    readonly dialogRef: MatDialogRef<ModalFormUserComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) readonly data: UserFormDialogData,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.isEditMode = Boolean(this.data.user);
    this.formUser = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      acesso: ['usuario' as UserAccess, Validators.required],
      senha: [''],
      confirmarSenha: [''],
    }, { validators: this.passwordsMatchValidator });

    if (this.data.user) {
      this.formUser.patchValue({
        nome: this.data.user.nome,
        email: this.data.user.email,
        acesso: this.data.user.acesso ?? 'usuario',
      });
    } else {
      this.formUser.controls.senha.setValidators([
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(128),
      ]);
      this.formUser.controls.confirmarSenha.setValidators(Validators.required);
      this.formUser.controls.senha.updateValueAndValidity();
      this.formUser.controls.confirmarSenha.updateValueAndValidity();
    }
  }

  closeModal(result = false): void {
    if (!this.isSaving) {
      this.dialogRef.close(result);
    }
  }

  async saveUser(): Promise<void> {
    this.errorMessage = '';
    if (this.formUser.invalid || this.isSaving) {
      this.formUser.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const value = this.formUser.getRawValue();
    const common: UpdateUserInput = {
      nome: value.nome.trim(),
      email: value.email.trim().toLowerCase(),
      acesso: value.acesso,
    };

    try {
      if (this.isEditMode) {
        const userId = this.data.user?.id;
        if (!userId) {
          throw new Error('Identificador do usuário não encontrado.');
        }
        await this.usersService.updateUser(this.data.empresaId, userId, common);
        this.snackBar.open('Usuário atualizado com sucesso.', 'Fechar', { duration: 4000 });
      } else {
        const input: CreateUserInput = { ...common, senha: value.senha };
        await this.usersService.addUser(this.data.empresaId, input);
        this.snackBar.open('Usuário cadastrado com sucesso.', 'Fechar', { duration: 4000 });
      }
      this.dialogRef.close(true);
    } catch (error: unknown) {
      console.error('Não foi possível salvar o usuário.', error);
      this.errorMessage = error instanceof Error && error.message
        ? error.message
        : 'Não foi possível salvar o usuário.';
    } finally {
      this.isSaving = false;
    }
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const senha = control.get('senha')?.value;
    const confirmarSenha = control.get('confirmarSenha')?.value;
    return senha === confirmarSenha ? null : { passwordMismatch: true };
  }
}
