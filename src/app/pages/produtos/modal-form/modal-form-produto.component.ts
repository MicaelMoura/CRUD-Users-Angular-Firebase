import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Produto } from '../../../interfaces/produto';
import { ProdutosService } from '../../../services/produtos.service';
import { AuthService } from '../../../services/auth.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlataformService } from '../../../services/plataform.service';
import { Unit } from '../../../interfaces/units';

@Component({
  selector: 'app-modal-form-produto',
  templateUrl: './modal-form-produto.component.html',
  styleUrls: ['./modal-form-produto.component.scss']
})
export class ModalFormProdutoComponent implements OnInit {

  formProduto!: FormGroup;
  isEditMode = false;
  currentEmpresaId: string;
  listUnits: Unit[] = [];
  dataSource!: MatTableDataSource<Unit>;

  constructor(
    private fb: FormBuilder,
    // Tipando o retorno do modal como boolean (sucesso/falha da operação)
    public dialogRef: MatDialogRef<ModalFormProdutoComponent, boolean>, 
    private produtosService: ProdutosService,
    private authService: AuthService, 
    private plataformService: PlataformService,
    private snackBar: MatSnackBar,
    // Recebe o produto (opcional para edição) e o ID da empresa atual
    @Inject(MAT_DIALOG_DATA) public data: { produto: Produto | null}
  ) {  
    this.dataSource = new MatTableDataSource<Unit>([]);
  }

  public empresaIdAtual = this.authService.activeTenantId; 

  ngOnInit(): void {
    this.getListUnits();
    this.buildForm();
    // Configura o modo de edição se os dados do produto estiverem presentes
    this.configurarModoEdicao();
  }
  getListUnits() {
    this.plataformService.getUnits().subscribe(data => {
      this.listUnits = data;
      this.dataSource = new MatTableDataSource(this.listUnits);
    });
  
  }

  private configurarModoEdicao() {
    
    if (this.data.produto) {
      this.isEditMode = true;
      this.formProduto.patchValue(this.data.produto);
    }
  }

  buildForm() {
    this.formProduto = this.fb.group({
      firebaseId: [null], 
      // DADOS PRINCIPAIS
      nome: ['', Validators.required],
      marca: ['', Validators.required],
      codigoDeBarras: [''], // Não é obrigatório
      unit: ['', Validators.required],
      
      // VALORES E ESTOQUE
      valorUnitarioCompra: [null, [Validators.required, Validators.min(0)]],
      valorUnitarioVenda: [null, [Validators.required, Validators.min(0)]],
      quantidadeMinima: [0, [Validators.required, Validators.min(0)]],
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
      const empresaId = this.empresaIdAtual();
      if(!empresaId){
        return;    
      }
      if (this.isEditMode && produtoData.firebaseId) {
        // Modo Edição
        const produtoId = produtoData.firebaseId;
        
        this.produtosService.updateProduto(empresaId, produtoId, produtoData)
          .then(() => {
            console.log('Produto atualizado com sucesso!');
            this.snackBar.open('Produto atualizado com sucesso!', 'Fechar', { duration: 3000 });
            this.closeModal(true); // Sucesso
          })
          .catch(error => {
            console.error('Erro ao atualizar produto:', error);
            this.snackBar.open('Erro ao atualizar produto:', 'Fechar', { duration: 3000 });
          });
      } else {
        // Modo Criação
        delete produtoData.firebaseId; // O ID será gerado pelo Firestore
        
        this.produtosService.addProduto(empresaId, produtoData)
          .then(() => {
            console.log('Produto salvo com sucesso!');
            this.snackBar.open('Produto salvo com sucesso!', 'Fechar', { duration: 3000 });
            this.closeModal(true);
          })
          .catch(error => {
            console.error('Erro ao salvar produto:', error);
            this.snackBar.open('Erro ao salvar produto:', 'Fechar', { duration: 3000 });
          });
      }
    }
  }
}