import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Stock } from '../../../interfaces/stock';
import { StockService } from '../../../services/stock.service';
import { FornecedoresService } from '../../../services/fornecedores.service'; 
import { Fornecedor } from '../../../interfaces/fornecedor'; 
import { ProdutosService } from '../../../services/produtos.service'; 
import { Produto } from '../../../interfaces/produto'; 
import { Subscription, combineLatest} from 'rxjs';
import { AuthService } from '../../../services/auth.services';

@Component({
  selector: 'app-modal-form-stock',
  templateUrl: './modal-form-stock.component.html',
  styleUrls: ['./modal-form-stock.component.scss']
})
export class ModalFormStockComponent implements OnInit {

  formStock!: FormGroup;
  isEditMode = false;
  
  // Dados de apoio para os selects
  listFornecedores: Fornecedor[] = [];
  listProdutos: Produto[] = []; // Deve ser carregado via ProdutosService
  
  motivosAjuste: string[] = ['Perda', 'Estragado', 'Vencimento', 'Inventário'];
  
  // Variáveis do modal
  stockEntryId: string | null = null;
  
  private dataSubscription: Subscription = new Subscription();
  
  // INJEÇÃO DE DEPENDÊNCIAS
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalFormStockComponent>,
    private stockService: StockService,
    private fornecedoresService: FornecedoresService,
    private produtosService: ProdutosService, 
    private snackBar: MatSnackBar,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: { stockEntry: Stock | null }
  ) {
    if (data.stockEntry) {
      this.isEditMode = true;
      this.stockEntryId = data.stockEntry.id || null;
    }
  }

  public empresaIdAtual = this.authService.activeTenantId; 

  ngOnInit(): void {
    this.buildForm();
    this.loadInitialData();

    // Lógica para preencher o formulário em modo de Edição
    this.preencherFormModEdit();
    
    // Lógica para esconder/mostrar o campo 'motivoAjuste'
    this.esconderCampoMotivoAjuste();
  }


  private preencherFormModEdit() {
    if (this.isEditMode && this.data.stockEntry) {
            
      const stockToPatch = { ...this.data.stockEntry } as any;
      
      // Aplica os valores corrigidos
      this.formStock.patchValue(stockToPatch);
      
      this.toggleAdjustmentField(this.data.stockEntry.tipoMovimento);
    }
  }

  private esconderCampoMotivoAjuste() {
    this.formStock.get('tipoMovimento')?.valueChanges.subscribe(value => {
      this.toggleAdjustmentField(value);
    });
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe();
  }

  /**
   * Configura o formulário reativo
   */
  buildForm() {
    // Inicializa o formulário com os campos obrigatórios
    this.formStock = this.fb.group({
      produtoId: [null, [Validators.required]],
      fornecedorId: [null, [Validators.required]],
      quantidade: [null, [Validators.required, Validators.min(1)]],
      validade: [null], // Validade não é obrigatória, mas recomendada
      tipoMovimento: ['ENTRADA', [Validators.required]], // Padrão: ENTRADA
      motivoAjuste: [null], // Campo condicional
    });
  }
  
  /**
   * Carrega Fornecedores e Produtos
   */
  loadInitialData() {
    const empresaId = this.empresaIdAtual();
    if (!empresaId){
        this.snackBar.open('Não é possível adicionar/editar. ID da empresa inválido.', 'Fechar', { duration: 3000 });
        return;
    }
    const fornecedores$ = this.fornecedoresService.getAllFornecedores(empresaId);
    
    const produtos$ = this.produtosService.getAllProdutos(empresaId);

    this.dataSubscription = combineLatest([fornecedores$, produtos$]).subscribe({
      next: ([fornecedores, produtos]) => {
        this.listFornecedores = fornecedores;
        this.listProdutos = produtos;
      },
      error: (err) => {
        console.error('Erro ao carregar dados iniciais:', err);
        this.snackBar.open('Erro ao carregar lista de produtos/fornecedores.', 'Fechar', { duration: 5000 });
      }
    });
  }

  /**
   * Alterna a obrigatoriedade e visibilidade do campo 'motivoAjuste'
   */
  toggleAdjustmentField(tipo: 'ENTRADA' | 'AJUSTE' | string | null) {
    const motivoControl = this.formStock.get('motivoAjuste');
    if (tipo === 'AJUSTE') {
      motivoControl?.setValidators(Validators.required);
    } else {
      motivoControl?.clearValidators();
      motivoControl?.setValue(null);
    }
    motivoControl?.updateValueAndValidity();
  }
  
  /**
   * Obtém o nome do Produto e Fornecedor selecionado
   */
  getNamesFromIds(formData: any) {
    const produto = this.listProdutos.find(p => p.firebaseId === formData.produtoId);
    const fornecedor = this.listFornecedores.find(f => f.id === formData.fornecedorId);
    
    return {
      produtoNome: produto ? produto.nome : 'Produto Desconhecido',
      fornecedorNome: fornecedor ? fornecedor.fantasyName : 'Fornecedor Desconhecido',
    };
  }

  /**
   * Salva ou Edita o registro de estoque
   */
  saveStockEntry() {

    const empresaId = this.empresaIdAtual();
    if (!empresaId){
        this.snackBar.open('Não é possível adicionar/editar. ID da empresa inválido.', 'Fechar', { duration: 3000 });
        return;
    }
    if (this.formStock.invalid) {
      this.formStock.markAllAsTouched();
      this.snackBar.open('Preencha todos os campos obrigatórios!', 'Fechar', { duration: 3000 });
      return;
    }

    const formData = this.formStock.value;
    const names = this.getNamesFromIds(formData);
    
    // Converte a quantidade para negativo se for um AJUSTE (Saída)
    // let finalQuantity = formData.quantidade;
    // if (formData.tipoMovimento === 'AJUSTE') {
    //     finalQuantity = -Math.abs(formData.quantidade);
    // }
    
    const stockEntry: Omit<Stock, 'id'> = {
      ...names,
      produtoId: formData.produtoId,
      fornecedorId: formData.fornecedorId,
      quantidade: formData.quantidade,
      validade: formData.validade,
      tipoMovimento: formData.tipoMovimento,
      motivoAjuste: formData.motivoAjuste,
      dataMovimento: new Date()
    };

    if (this.isEditMode && this.stockEntryId) {
      // MODO EDIÇÃO (Faz um update no registro, deve ser usado com cautela)
      this.stockService.updateStockEntry(empresaId, this.stockEntryId, stockEntry)
        .then(() => {
          this.snackBar.open('Movimentação atualizada com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        })
        .catch(error => {
          console.error('Erro ao atualizar movimentação:', error);
          this.snackBar.open('Erro ao atualizar movimentação.', 'Fechar', { duration: 5000 });
        });
    } else {
      // MODO CRIAÇÃO (Adiciona novo registro)
      this.stockService.addStockEntry(empresaId, stockEntry)
        .then(() => {
          this.snackBar.open('Movimentação de estoque salva com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        })
        .catch(error => {
          console.error('Erro ao salvar movimentação:', error);
          this.snackBar.open('Erro ao salvar movimentação de estoque.', 'Fechar', { duration: 5000 });
        });
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}