import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { EmpresasService } from '../../../services/empresas.service'; // Importe o serviço
import { Empresas } from '../../../interfaces/empresas'; // Importe a interface

@Component({
  selector: 'app-companies-form',
  templateUrl: './modal-form-empresas.component.html',
  styleUrls: ['./modal-form-empresas.component.scss']
})
export class ModalEmpresasFormComponent implements OnInit {
  formCompany!: FormGroup;

  private empresasService: EmpresasService  = inject(EmpresasService);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalEmpresasFormComponent>,
  ) { }

    ngOnInit(): void {
    this.formCompany = this.fb.group({
        razaoSocial: ['', Validators.required],
        nomeFantasia: ['', Validators.required],
        cnpj: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telefone: ['',Validators.required],
        endereco: ['', Validators.required],
        bairro: ['', Validators.required],
        cidadeUf: ['', Validators.required],
        cep: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{3}$/)]]
    });
    }

  closeModal(): void {
    this.dialogRef.close();
  }

  saveCompany(): void {
    if (this.formCompany.valid) {
      // Cria o objeto da empresa a partir do formulário
      const novaEmpresa: Empresas = { ...this.formCompany.value };

      // Chama o método do serviço e fecha o modal SOMENTE após o salvamento
      this.empresasService.addEmpresa(novaEmpresa)
        .then(() => {
          console.log('Empresa salva com sucesso!');
          this.dialogRef.close();
        })
        .catch(error => {
          console.error('Erro ao salvar a empresa:', error);
          // Opcional: mostrar uma mensagem de erro para o usuário
        });
    }
  }
}