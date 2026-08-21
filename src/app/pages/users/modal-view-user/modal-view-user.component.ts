import { Component, Inject } from '@angular/core';
import { User } from '../../../interfaces/user';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-modal-view-user',
    templateUrl: './modal-view-user.component.html',
    styleUrl: './modal-view-user.component.scss',
    standalone: false
})
export class ModalViewUserComponent {
  
  constructor(
    readonly dialogRef: MatDialogRef<ModalViewUserComponent>,
    @Inject(MAT_DIALOG_DATA) readonly userData: User,
  ) {}

  closeModal(): void {
    this.dialogRef.close();
  }

  get accessLabel(): string {
    return {
      administrador: 'Administrador',
      usuario: 'Usuário',
      visitante: 'Visitante',
    }[this.userData.acesso] ?? 'Não informado';
  }
}
