import { Component, OnInit } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalEmpresasFormComponent>,
    private empresasService: EmpresasService // Injeta o serviço
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

  formatTelefone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,})/, '($1) $2');
    } else if (value.length > 0) {
      value = value.replace(/^(\d{0,})/, '($1');
    }
    this.formCompany.get('phone')?.setValue(value, { emitEvent: false });
  }

  formatCep(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 8) {
        value = value.substring(0, 8);
    }
    if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d{3})/, '$1-$2');
    }
    this.formCompany.get('cep')?.setValue(value, { emitEvent: false });
  }
}