import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Produto } from '../../../interfaces/produto';
import { ProdutosService } from '../../../services/produtos.service';
import { AuthService } from '../../../services/auth.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlataformService } from '../../../services/plataform.service';
import { Unit } from '../../../interfaces/units';
import { Fornecedor } from '../../../interfaces/fornecedor';
import { FornecedoresService } from '../../../services/fornecedores.service';

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
  listFornecedores: Fornecedor[] = [];
  dataSource!: MatTableDataSource<Unit>;
  dataSourceFornecedores!: MatTableDataSource<Fornecedor>;

  constructor(
    private fb: FormBuilder,
    // Tipando o retorno do modal como boolean (sucesso/falha da operação)
    public dialogRef: MatDialogRef<ModalFormProdutoComponent, boolean>, 
    private produtosService: ProdutosService,
    private authService: AuthService, 
    private plataformService: PlataformService,
    private fornecedorService: FornecedoresService, 
    private snackBar: MatSnackBar,
    // Recebe o produto (opcional para edição) e o ID da empresa atual
    @Inject(MAT_DIALOG_DATA) public data: { produto: Produto | null}
  ) {  
    this.dataSource = new MatTableDataSource<Unit>([]);
    this.dataSourceFornecedores = new MatTableDataSource<Fornecedor>([]);
  }

  public empresaIdAtual = this.authService.activeTenantId; 

  ngOnInit(): void {
    this.getListUnits();
    this.getListFornecedores();
    this.buildForm();
    // Configura o modo de edição se os dados do produto estiverem presentes
    this.configurarModoEdicao();
  }

  getListFornecedores() {
    const empresaId = this.empresaIdAtual();
    if(empresaId == ''){
      this.snackBar.open('ID da empresa inválido.', 'Fechar', { duration: 3000 });
      return;
    }
    this.fornecedorService.getAllFornecedores(empresaId!).subscribe(data => {
      this.listFornecedores = data;
      this.dataSourceFornecedores = new MatTableDataSource(this.listFornecedores);
    });
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
      unidadeDeMedida: ['', Validators.required],
      fornecedorId: ['', Validators.required],
      
      // VALORES E ESTOQUE
      valorUnitarioCompra: [0, [Validators.required, Validators.min(0)]],
      valorUnitarioVenda: [0, [Validators.required, Validators.min(0)]],
      quantidadeMinima: [0, [Validators.required, Validators.min(0)]],

      // NOTA FISCAL
      ncm: ['00000000', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      cfop: ['5102', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
      origem: [0, [Validators.required, Validators.min(0), Validators.max(7)]],
      csosn: ['102', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
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
      
      const fornecedor = this.listFornecedores.find(f => f.id === produtoData.fornecedorId);

      const produtoEntry: Omit<Produto, 'id'> = {
        firebaseId: produtoData.firebaseId,
        nome: produtoData.nome,
        fornecedorId: produtoData.fornecedorId,
        fornecedorNome: fornecedor?.fantasyName || '',
        codigoDeBarras: produtoData.codigoDeBarras,
        marca: produtoData.marca,
        quantidadeMinima: produtoData.quantidadeMinima,
        unidadeDeMedida: produtoData.unidadeDeMedida,
        valorUnitarioCompra: produtoData.valorUnitarioCompra,
        valorUnitarioVenda: produtoData.valorUnitarioVenda,
        estoque: 0, 
        
        // Nota fiscal
        ncm: produtoData.ncm || '00000000',
        cfop: produtoData.cfop || '5102',
        origem: produtoData.origem || 0,
        csosn: produtoData.csosn || '102', // Padrão para Simples Nacional
      };

      if (this.isEditMode && produtoEntry.firebaseId) {
        // Modo Edição
        const produtoId = produtoEntry.firebaseId;
        
        this.produtosService.updateProduto(empresaId, produtoId, produtoEntry)
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
        delete produtoEntry.firebaseId; // O ID será gerado pelo Firestore
        
        this.produtosService.addProduto(empresaId, produtoEntry)
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