import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EmpresasService } from '../../../services/empresas.service';
import {
  EmpresaPersistidaInput,
  EmpresaProvisionamentoInput,
  Empresas,
} from '../../../interfaces/empresas';

export interface EmpresaDialogResult {
  changed: boolean;
  empresaId?: string;
}

@Component({
    selector: 'app-companies-form',
    templateUrl: './modal-form-empresas.component.html',
    styleUrls: ['./modal-form-empresas.component.scss'],
    standalone: false
})
export class ModalEmpresasFormComponent implements OnInit {
  formCompany!: FormGroup;
  isEditMode = false;
  isSaving = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalEmpresasFormComponent, EmpresaDialogResult>,
    private empresasService: EmpresasService,
    @Inject(MAT_DIALOG_DATA) public data: Empresas | null,
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
      cidade: ['', Validators.required],
      cep: ['', [Validators.required]],
      complemento: [''],
      emailAdmin: ['', [Validators.required, Validators.email]],
      senhaAdmin: [''],
    });

    if (this.data) {
      this.isEditMode = true;
      this.formCompany.patchValue(this.data);
    } else {
      this.formCompany.controls['senhaAdmin'].setValidators([
        Validators.required,
        Validators.minLength(12),
      ]);
      this.formCompany.controls['senhaAdmin'].updateValueAndValidity();
    }
  }

  closeModal(): void {
    this.dialogRef.close({ changed: false });
  }

  async saveCompany(): Promise<void> {
    this.errorMessage = '';
    if (this.formCompany.invalid || this.isSaving) {
      this.formCompany.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const rawValue = this.formCompany.getRawValue() as EmpresaProvisionamentoInput;
    const { senhaAdmin, ...empresaData } = rawValue;

    try {
      if (this.isEditMode) {
        await this.empresasService.updateEmpresa(
          this.data!.firebaseId,
          empresaData as EmpresaPersistidaInput,
        );
        this.dialogRef.close({ changed: true });
      } else {
        const empresaId = await this.empresasService.addEmpresa({ ...empresaData, senhaAdmin });
        this.dialogRef.close({ changed: true, empresaId });
      }
    } catch (error: unknown) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Não foi possível salvar a empresa.';
    } finally {
      this.isSaving = false;
    }
  }
}
