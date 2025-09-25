import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EmpresasService } from '../../../services/empresas.service';
import { Empresas } from '../../../interfaces/empresas';

@Component({
  selector: 'app-companies-form',
  templateUrl: './modal-form-empresas.component.html',
  styleUrls: ['./modal-form-empresas.component.scss'],
})
export class ModalEmpresasFormComponent implements OnInit {
  formCompany!: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalEmpresasFormComponent>,
    private empresasService: EmpresasService,
    @Inject(MAT_DIALOG_DATA) public data: Empresas
  ) { }

  ngOnInit(): void {
    this.formCompany = this.fb.group({
      razaoSocial: ['', Validators.required],
      nomeFantasia: ['', Validators.required],
      cnpj: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required]],
      endereco: ['', Validators.required],
      bairro: ['', Validators.required],
      cidadeUf: ['', Validators.required],
      cep: ['', [Validators.required]]
    });

    if (this.data) {
      this.isEditMode = true;
      this.formCompany.patchValue(this.data);
    }
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  saveCompany(): void {
    if (this.formCompany.valid) {
      const empresaData = { ...this.formCompany.value };
      if (this.isEditMode) {
        this.empresasService.updateEmpresa(this.data.id, empresaData)
          .then(() => {
            console.log('Empresa atualizada com sucesso!');
            this.dialogRef.close();
          })
          .catch(error => {
            console.error('Erro ao atualizar a empresa:', error);
          });
      } else {
        this.empresasService.addEmpresa(empresaData)
          .then(() => {
            console.log('Empresa salva com sucesso!');
            this.dialogRef.close();
          })
          .catch(error => {
            console.error('Erro ao salvar a empresa:', error);
          });
      }
    }
  }
}