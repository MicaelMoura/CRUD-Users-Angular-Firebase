import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-form-user',
  templateUrl: './modal-form-user.component.html',
  styleUrl: './modal-form-user.component.scss'
})
export class ModalFormUserComponent {

  planosSaude = [
    {
      id: 1,
      descricao: 'Viva-Bem'
    },
    {
      id: 2,
      descricao: 'A vida é uma festa'
    },
    {
      id: 3,
      descricao: 'QuaseLá'
    }
  ];

  planosOdonto = [
    {
      id: 1,
      descricao: 'SorriDente'
    },
    {
      id: 2,
      descricao: 'Unidente'
    },
    {
      id: 3,
      descricao: 'Dentin'
    }
  ];

  formUser: FormGroup;

  constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<ModalFormUserComponent>) {}

  ngOnInit() {
    this.buildForm();
  }

  buildForm() {
    this.formUser = this.formBuilder.group({
      name: [null, [Validators.required, Validators.minLength(3)]],
      email: [null, [Validators.required, Validators.email]],
      sector: [null, [Validators.required, Validators.minLength(2)]],
      role: [null, [Validators.required, Validators.minLength(3)]],
      healthPlan: [''],
      dentalPlan: [''],
    });
  }

  closeModal() { this.dialogRef.close() }

}
