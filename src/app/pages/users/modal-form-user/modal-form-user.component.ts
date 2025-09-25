import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../../interfaces/user';
import { UsersService } from '../../../services/users.service';
import { Empresas } from '../../../interfaces/empresas';

@Component({
  selector: 'app-modal-form-user',
  templateUrl: './modal-form-user.component.html',
  styleUrl: './modal-form-user.component.scss'
})
export class ModalFormUserComponent implements OnInit {

  formUser: FormGroup;
  isEditMode = false;
  empresas: Empresas[] = []; // Criar a propriedade para a lista de empresas

  constructor(
    private formBuilder: FormBuilder, 
    public dialogRef: MatDialogRef<ModalFormUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User, empresas: Empresas[] },
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.empresas = this.data.empresas; // Atribuir a lista de empresas

    if (this.data.user) {
        this.isEditMode = true;
        this.formUser.patchValue(this.data.user);

        // Verifique se o ID da empresa do usuário existe na lista de empresas.
        const empresaDoUsuario = this.empresas.find(emp => emp.firebaseId === this.data.user.empresaid);
        console.log('empresas:', this.empresas.map(e => e.firebaseId));
        
        if (empresaDoUsuario) {
          // Se encontrou, define o valor no formulário.
          this.formUser.get('empresaid')?.setValue(this.data.user.empresaid);
          console.log('ID da empresa do usuário:', this.data.user.empresaid);
          console.log('Empresa encontrada:', empresaDoUsuario);
        } else {
          console.log('ID da empresa do usuário não encontrado na lista de empresas:', this.data.user.empresaid);
        }
    }
  }

  buildForm() {
    this.formUser = this.formBuilder.group({
      id: [null], 
      nome: [null, [Validators.required, Validators.minLength(3)]],
      email: [null, [Validators.required, Validators.email]],
      empresaid: [null, [Validators.required]] // Novo campo para a empresa
    });
  }

  closeModal() { this.dialogRef.close() }

  saveUser() {
    if (this.formUser.valid) {
      const userData = this.formUser.value;
      if (this.isEditMode) {
        this.usersService.updateUser(userData.id, userData)
          .then(() => this.closeModal())
          .catch(err => console.error('Erro ao editar usuário', err));
      } else {
        this.usersService.addUser(userData)
          .then(() => this.closeModal())
          .catch(err => console.error('Erro ao adicionar usuário', err));
      }
    }
  }
}