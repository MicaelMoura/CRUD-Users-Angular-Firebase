import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormaPagamento, ItemVenda, Venda } from '../../interfaces/sales';
import { ProdutosService } from '../../services/produtos.service';
import { AuthService } from '../../services/auth.services';
import { VendasService } from '../../services/sales.service';
import { CashFlowService } from '../../services/cashflow.service';
import { HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SalesModalComponent } from './sales-modal/sales-modal.component';


@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent {

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent) {
    // Atalho F2 para abrir o pagamento
    if (event.key === 'F2') {
      event.preventDefault();
      this.exibirPagamentoModal();
    }
  }
  
  vendaForm!: FormGroup;
  itensVenda = signal<ItemVenda[]>([]); // Lista de itens no cupom
  carregando = signal<boolean>(false);
  formaPagamento = signal<FormaPagamento>('dinheiro');
  valorRecebido = signal(0);
  exibirPagamento = signal(false);

  totalVenda = computed(() => {
    return this.itensVenda().reduce((acc, item) => acc + item.subtotal, 0);
  });
  
  // Computados para exibição em tempo real
  subtotalGeral = computed(() => 
    this.itensVenda().reduce((acc, item) => acc + item.subtotal, 0)
  );

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private produtosService: ProdutosService,
    private authService: AuthService,
    private vendasService: VendasService,
    private cashFlowService: CashFlowService,
    private dialog: MatDialog,
  ) {
    this.vendaForm = this.fb.group({
      barcode: ['', [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(1)]]
    });
  }

  exibirPagamentoModal(): void {
    if (this.itensVenda().length === 0) {
      this.snackBar.open('Adicione ao menos um produto.', 'OK', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(SalesModalComponent, {
      width: '450px',
      data: { total: this.subtotalGeral() },
      disableClose: true // Obriga o usuário a usar os botões
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // O usuário confirmou, agora setamos os sinais e finalizamos
        this.formaPagamento.set(result.formaPagamento);
        this.valorRecebido.set(result.valorRecebido);
        this.finalizarVenda();
      }
    });
  }

  abrirPagamento() {
    if (this.itensVenda().length === 0) return;
    this.exibirPagamento.set(true);
  }

  async finalizarVenda() {
    const empresaId = this.authService.activeTenantId();
    if (!empresaId) return;

    this.carregando.set(true);

    try {
      const novaVenda: Venda = {
        data: new Date(),
        itens: this.itensVenda(),
        total: this.subtotalGeral(),
        formaPagamento: this.formaPagamento(),
        status: 'CONCLUIDA'
      };

      // 1. Gerar Registro da Venda
      await this.vendasService.salvarVenda(empresaId, novaVenda);

      // 2. Retirar do Estoque (Loop nos itens)
      for (const item of this.itensVenda()) {
        await this.produtosService.diminuirEstoque(empresaId, item.produtoId, item.quantidade);
      }

      // 3. Gerar entrada no CashFlow
      await this.cashFlowService.addCashFlow(empresaId, {
        dataMovimento: new Date(),
        tipo: 'ENTRADA',
        descricao: `Venda PDV - Itens: ${this.itensVenda().length}`,
        valor: this.subtotalGeral(),
        formaPagamento: this.formaPagamento()
      });

      this.snackBar.open('Venda finalizada com sucesso!', 'OK', { duration: 3000 });
      this.limparPDV();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Erro ao finalizar venda.', 'Fechar');
    } finally {
      this.carregando.set(false);
    }
  }

  limparPDV() {
    this.itensVenda.set([]);
    this.exibirPagamento.set(false);
    this.valorRecebido.set(0);
  }

  /**
   * 💡 PASSO 1: Leitura de código de barras
   * Acionado ao dar 'Enter' no input ou pelo scanner.
   */
  async onBarcodeRead(): Promise<void> {
    const code = this.vendaForm.value.barcode;
    const qtd = this.vendaForm.value.quantidade;
    const empresaId = this.authService.activeTenantId(); // Obtendo ID da empresa ativa

    if (!code || !empresaId) return;

    this.carregando.set(true);

    try {
      const produto = await this.produtosService.getProdutoByBarcode(empresaId, code);

      if (produto) {
        this.adicionarItemAoCupom(produto, qtd);
      } else {
        this.snackBar.open('Produto não encontrado!', 'Fechar', { duration: 3000 });
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      this.snackBar.open('Erro técnico ao buscar produto.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando.set(false);
      this.vendaForm.patchValue({ barcode: '', quantidade: 1 });
    }
  }

  private adicionarItemAoCupom(produto: any, quantidade: number): void {
    const novoItem: ItemVenda = {
      produtoId: produto.firebaseId,
      descricao: produto.nome, // Ajuste conforme seu campo de nome/descrição
      codigoBarras: produto.codigoDeBarras,
      quantidade: quantidade,
      valorUnitario: produto.valorUnitarioVenda, // Ajuste conforme seu campo de preço
      subtotal: produto.valorUnitarioVenda * quantidade
    };

    // Adiciona ao topo da lista
    this.itensVenda.update(itens => [novoItem, ...itens]);
  }
  
  removerItem(index: number): void {
    this.itensVenda.update(itens => {
      const novaLista = [...itens];
      novaLista.splice(index, 1);
      return novaLista;
    });
  }

  fecharPagamentoModal(): void {
    // 1. Esconde o modal
    this.exibirPagamento.set(false);

    // 2. Reseta o valor recebido e a forma de pagamento para o padrão
    this.valorRecebido.set(0);
    this.formaPagamento.set('dinheiro');

    // 3. Opcional: Devolve o foco para o campo de código de barras
    // Isso agiliza a retomada da venda sem precisar usar o mouse
    setTimeout(() => {
      const input = document.querySelector('input[formControlName="barcode"]') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }

  onFormaPagamentoChange(valor: any): void {
    console.log('Evento disparado no TS:', valor); 
    // Forçamos o tipo para garantir que o Signal aceite
    this.formaPagamento.set(valor as FormaPagamento);
  }
}