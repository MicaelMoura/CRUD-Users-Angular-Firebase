import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Fornecedor } from '../../../interfaces/fornecedor';
import { FornecedoresService } from '../../../services/fornecedores.service';

@Component({
  selector: 'app-modal-form-fornecedor',
  templateUrl: './modal-form-fornecedor.component.html',
  styleUrls: ['./modal-form-fornecedor.component.scss']
})
export class ModalFormFornecedorComponent implements OnInit {

  formFornecedor!: FormGroup;
  isEditMode = false;
  
  // O modal recebe o fornecedor (opcional) e o ID da empresa atual
  currentEmpresaId: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalFormFornecedorComponent>,
    private fornecedoresService: FornecedoresService,
    @Inject(MAT_DIALOG_DATA) public data: { fornecedor: Fornecedor | null, empresaId: string }
  ) {
    this.currentEmpresaId = data.empresaId;
  }

  ngOnInit(): void {
    this.buildForm();
    
    // Configura o modo de edição se os dados do fornecedor estiverem presentes
    if (this.data.fornecedor) {
      this.isEditMode = true;
      // Preenche o formulário com os dados existentes
      this.formFornecedor.patchValue(this.data.fornecedor);
    }
  }

  buildForm() {
    this.formFornecedor = this.fb.group({
      // O 'id' é necessário para a atualização, mas não é um campo visível
      id: [null],
      razaoSocial: ['', Validators.required],
      cnpj: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      representante: ['', Validators.required],
      observacoes: ['']
    });
    
    // Adiciona o empresaid de forma invisível, mas essencial para a criação/edição
    this.formFornecedor.addControl('empresaid', this.fb.control(this.currentEmpresaId));
    // Se o ID da empresa não deve ser alterado, ele é desabilitado no formulário
    this.formFornecedor.get('empresaid')?.disable();
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  saveFornecedor(): void {
    if (this.formFornecedor.valid) {
      // Cria uma cópia dos valores e re-habilita o campo empresaid para que o valor seja incluído no payload
      const fornecedorData = { ...this.formFornecedor.getRawValue() }; 
      
      if (this.isEditMode && fornecedorData.id) {
        // Modo Edição
        this.fornecedoresService.updateFornecedor(this.currentEmpresaId, fornecedorData.id, fornecedorData)
          .then(() => {
            console.log('Fornecedor atualizado com sucesso!');
            this.dialogRef.close(true); // Retorna true para indicar sucesso
          })
          .catch(error => {
            console.error('Erro ao atualizar fornecedor:', error);
          });
      } else {
        // Modo Criação
        // O id é nulo neste caso e será gerado pelo Firestore
        delete fornecedorData.id; 
        this.fornecedoresService.addFornecedor(this.currentEmpresaId, fornecedorData)
          .then(() => {
            console.log('Fornecedor salvo com sucesso!');
            this.dialogRef.close(true);
          })
          .catch(error => {
            console.error('Erro ao salvar fornecedor:', error);
          });
      }
    }
  }
}