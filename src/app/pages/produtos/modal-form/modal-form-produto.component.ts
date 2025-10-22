import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Produto } from '../../../interfaces/produto';
import { ProdutosService } from '../../../services/produtos.service';

@Component({
  selector: 'app-modal-form-produto',
  templateUrl: './modal-form-produto.component.html',
  styleUrls: ['./modal-form-produto.component.scss']
})
export class ModalFormProdutoComponent implements OnInit {

  formProduto!: FormGroup;
  isEditMode = false;
  currentEmpresaId: string;

  constructor(
    private fb: FormBuilder,
    // Tipando o retorno do modal como boolean (sucesso/falha da operação)
    public dialogRef: MatDialogRef<ModalFormProdutoComponent, boolean>, 
    private produtosService: ProdutosService,
    // Recebe o produto (opcional para edição) e o ID da empresa atual
    @Inject(MAT_DIALOG_DATA) public data: { produto: Produto | null, empresaId: string }
  ) {
    this.currentEmpresaId = data.empresaId;
  }

  ngOnInit(): void {
    this.buildForm();
    
    // Configura o modo de edição se os dados do produto estiverem presentes
    if (this.data.produto) {
      this.isEditMode = true;
      this.formProduto.patchValue(this.data.produto);
      
      // Se estiver em edição, desabilita o campo empresaid para que não seja alterado,
      // mas o valor será recuperado no getRawValue()
      this.formProduto.get('empresaid')?.disable();
    }
  }

  buildForm() {
    this.formProduto = this.fb.group({
      firebaseId: [null], 
      // DADOS PRINCIPAIS
      nome: ['', Validators.required],
      marca: ['', Validators.required],
      codigoDeBarras: [''], // Não é obrigatório
      unidadeDeMedida: ['', Validators.required],
      
      // VALORES E ESTOQUE
      valorUnitarioCompra: [null, [Validators.required, Validators.min(0)]],
      valorUnitarioVenda: [null, [Validators.required, Validators.min(0)]],
      quantidadeMinima: [0, [Validators.required, Validators.min(0)]],
      
      // ID DA EMPRESA (Campo crucial para a arquitetura multi-empresa)
      empresaid: [this.currentEmpresaId, Validators.required]
    });
  }

  // Método para fechar o modal, retornando o resultado da operação (false por padrão)
  closeModal(result: boolean = false): void {
    this.dialogRef.close(result);
  }

  saveProduto(): void {
    if (this.formProduto.valid) {
      // Usa getRawValue para incluir campos desabilitados (como o empresaid)
      const produtoData = this.formProduto.getRawValue(); 
      const empresaId = produtoData.empresaid;
      
      if (this.isEditMode && produtoData.firebaseId) {
        // Modo Edição
        const produtoId = produtoData.firebaseId;
        
        this.produtosService.updateProduto(empresaId, produtoId, produtoData)
          .then(() => {
            console.log('Produto atualizado com sucesso!');
            this.closeModal(true); // Sucesso
          })
          .catch(error => {
            console.error('Erro ao atualizar produto:', error);
          });
      } else {
        // Modo Criação
        delete produtoData.firebaseId; // O ID será gerado pelo Firestore
        
        this.produtosService.addProduto(empresaId, produtoData)
          .then(() => {
            console.log('Produto salvo com sucesso!');
            this.closeModal(true);
          })
          .catch(error => {
            console.error('Erro ao salvar produto:', error);
          });
      }
    }
  }
}