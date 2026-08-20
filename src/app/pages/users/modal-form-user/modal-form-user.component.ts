import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../../interfaces/user';
import { UsersService } from '../../../services/users.service';
import { Empresas } from '../../../interfaces/empresas';

@Component({
    selector: 'app-modal-form-user',
    templateUrl: './modal-form-user.component.html',
    styleUrl: './modal-form-user.component.scss',
    standalone: false
})
export class ModalFormUserComponent implements OnInit {

  formUser!: FormGroup;
  isEditMode = false;
  empresas: Empresas[] = []; 

  constructor(
    private formBuilder: FormBuilder, 
    public dialogRef: MatDialogRef<ModalFormUserComponent, boolean>, 
    @Inject(MAT_DIALOG_DATA) public data: { user: User | null, empresas: Empresas[] }, 
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.empresas = this.data.empresas;

    if (this.data.user) {
        this.isEditMode = true;
        this.formUser.patchValue(this.data.user);
    }
  }

  buildForm() {
    this.formUser = this.formBuilder.group({
      firebaseId: [null], 
      nome: [null, [Validators.required, Validators.minLength(3)]],
      email: [null, [Validators.required, Validators.email]],
      empresaid: [null, [Validators.required]] 
    });
  }

  /**
   * MÉTODO AJUSTADO para receber um resultado (boolean) para o componente pai.
   * Se chamado sem argumentos (como no botão 'fechar'), retorna 'false'.
   */
  closeModal(result: boolean = false) { 
    this.dialogRef.close(result);
  }

  saveUser() {
    if (this.formUser.valid) {
      const userData = this.formUser.getRawValue();
      const empresaId = userData.empresaid;
      
      if (this.isEditMode) {
        const userId = userData.firebaseId; 
        
        if (!userId) {
          console.error("ID do usuário (firebaseId) está faltando para a edição.");
          return;
        }

        this.usersService.updateUser(empresaId, userId, userData)
          // CHAMA closeModal(true)
          .then(() => this.closeModal(true)) 
          .catch(err => console.error('Erro ao editar usuário', err));
      } else {
        delete userData.firebaseId; 
        
        this.usersService.addUser(empresaId, userData)
          // CHAMA closeModal(true)
          .then(() => this.closeModal(true)) 
          .catch(err => console.error('Erro ao adicionar usuário', err));
      }
    }
  }
}