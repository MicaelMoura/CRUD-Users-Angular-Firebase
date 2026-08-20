import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { CashFlowService } from '../../services/cashflow.service';
import { CashFlow } from '../../interfaces/cashflow';
import { AuthService } from '../../services/auth.services';
import { FechamentoCaixa } from '../../interfaces/fechamento-caixa';
// Importar os modais de entrada/saída que criaremos
import { ModalEntradaComponent } from './entradas/modal-entrada.component';
import { ModalSaidaComponent } from './saidas/modal-saida.component';
import { ModalFechamentoCaixaComponent } from './fechamento-caixa/modal-fechamento-caixa.component';
import { ModalAberturaCaixaComponent } from './abertura-caixa/modal-abertura-caixa.component';

@Component({
    selector: 'app-caixa',
    templateUrl: './cashier.component.html',
    styleUrls: ['./cashier.component.scss'],
    standalone: false
})
export class CashierComponent implements OnInit {

  caixaStatus = signal<'ABERTO' | 'FECHADO'>('FECHADO');
  lastFechamento = signal<FechamentoCaixa | null>(null);

  displayedColumns: string[] = ['data', 'tipo', 'descricao', 'valor', 'action'];
  dataSource!: MatTableDataSource<CashFlow>;
  listCashFlow: CashFlow[] = [];
  saldoAtual: number = 0;
  
  // Variável para armazenar o ID da empresa ativa
  private empresaIdAtual = this.authService.activeTenantId;
  private cashFlowSubscription: Subscription | undefined;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public dialog: MatDialog,
    private cashFlowService: CashFlowService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.subscribeToCashFlowData();
    this.checkCaixaStatus();
  }

  async checkCaixaStatus() {
      const empresaId = this.empresaIdAtual();
      if (!empresaId) return;

      const last = await this.cashFlowService.getLastFechamento(empresaId);
      this.lastFechamento.set(last);
      
      // Atualiza o status
      this.caixaStatus.set(last?.status === 'ABERTO' ? 'ABERTO' : 'FECHADO');
  }

  async abrirCaixa(): Promise<void> {
    const empresaId = this.empresaIdAtual();
    const operadorUid = this.authService.userUid();

    if (!empresaId || !operadorUid) {
        this.snackBar.open('ID da empresa ou operador ausente.', 'Fechar', { duration: 3000 });
        return;
    }
    
    // 1. Abre o modal para obter o troco inicial
    const dialogRef = this.dialog.open(ModalAberturaCaixaComponent, {
      width: '400px',
      disableClose: true // Força o operador a tomar uma decisão
    });

    dialogRef.afterClosed().subscribe(async (trocoInicial: number | null) => {
        if (trocoInicial === null || trocoInicial === undefined) {
            this.snackBar.open('Abertura de caixa cancelada.', 'Fechar', { duration: 3000 });
            return;
        }

        // 2. Prepara o registro de abertura
        const registroAbertura: FechamentoCaixa = {
            empresaId: empresaId,
            operadorUid: operadorUid,
            dataAbertura: new Date(),
            dataFechamento: new Date(), // A data de fechamento é igual à de abertura para este registro
            status: 'ABERTO', // 💡 Status de Abertura
            valorInicialTroco: trocoInicial,
            totalSuprimentos: trocoInicial, // Suprimento inicial é igual ao troco
            // Zera todos os outros campos, que serão preenchidos no fechamento
            totalSangrias: 0,
            totalVendasDinheiro: 0,
            totalVendasCartaoDebito: 0,
            totalVendasCartaoCredito: 0,
            totalVendasPix: 0,
            totalOutrasEntradas: 0,
            totalEntradasLiquidas: 0,
            totalEsperado: trocoInicial,
            valorContado: 0,
            diferenca: 0,
        };

        try {
            // 3. Salva o registro no Firestore (Usando o saveFechamento que criamos)
            await this.cashFlowService.saveFechamento(empresaId, registroAbertura);
            
            this.snackBar.open(`Caixa aberto com R$ ${trocoInicial.toFixed(2).replace('.', ',')} de troco.`, 'Fechar', { duration: 4000 });
            this.checkCaixaStatus(); // 4. Atualiza o status
        } catch (error) {
            console.error('Erro ao abrir caixa:', error);
            this.snackBar.open('Erro ao registrar abertura do caixa.', 'Fechar', { duration: 5000 });
        }
    });
  }

  openFechamentoModal() {
    const empresaId = this.empresaIdAtual();
    const lastFechamento = this.lastFechamento();

    if (!empresaId || this.caixaStatus() === 'FECHADO' || !lastFechamento) {
        this.snackBar.open('Caixa não está aberto ou ID da empresa ausente.', 'Fechar', { duration: 3000 });
        return;
    }

    // 1. OBTÉM MOVIMENTAÇÕES E CALCULA O ESPERADO
    // (A lógica de cálculo de totais deve ser feita no serviço ou no modal)
    
    // 2. ABRE O MODAL DE CONFERÊNCIA (Novo componente a ser criado)
    // Passa o ID da empresa e a data/hora de abertura
    const dialogRef = this.dialog.open(ModalFechamentoCaixaComponent, {
        width: '500px',
        data: {
            empresaId: empresaId,
            dataAbertura: lastFechamento.dataFechamento, // O fechamento anterior é o ponto de partida
            valorTrocoInicial: lastFechamento.valorInicialTroco
        }
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result && result.fechamentoConcluido) {
            this.snackBar.open('Caixa fechado com sucesso!', 'Fechar', { duration: 3000 });
            this.checkCaixaStatus(); // Recarrega o status
        }
    });
  }
  
  ngOnDestroy(): void {
    this.cashFlowSubscription?.unsubscribe();
  }

  /**
   * Subscreve ao fluxo de dados de caixa para atualizar a lista e o saldo
   */
  subscribeToCashFlowData() {
    const empresaId = this.empresaIdAtual();
    if (empresaId) {
      this.cashFlowSubscription = this.cashFlowService.getAllCashFlow(empresaId)
        .subscribe({
          next: (data: CashFlow[]) => {
            // Converte Timestamp para Date para exibição (se necessário)
            this.listCashFlow = data.map(item => ({
                ...item,
                dataMovimento: (item.dataMovimento as any).toDate ? (item.dataMovimento as any).toDate() : item.dataMovimento 
            }));
            this.calculateBalance();
            this.dataSource = new MatTableDataSource<CashFlow>(this.listCashFlow);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          },
          error: (err) => {
            console.error('Erro ao carregar fluxo de caixa:', err);
            this.snackBar.open('Erro ao carregar dados do caixa.', 'Fechar', { duration: 3000 });
          }
        });
    }
  }
  
  /**
   * Calcula o saldo atual do caixa
   */
  calculateBalance() {
    this.saldoAtual = this.listCashFlow.reduce((saldo, item) => {
      if (item.tipo === 'ENTRADA') {
        return saldo + item.valor;
      } else if (item.tipo === 'SAÍDA') {
        return saldo - item.valor;
      }
      return saldo;
    }, 0); // O saldo inicial é zero
  }
  
  // --- Métodos de CRUD ---
  
  openModalEntrada(cashFlow?: CashFlow | null) {
    this.dialog.open(ModalEntradaComponent, {
      width: '600px',
      data: { cashFlow: cashFlow, empresaId: this.empresaIdAtual() }
    });
  }

  openModalSaida(cashFlow?: CashFlow | null) {
    this.dialog.open(ModalSaidaComponent, {
      width: '600px',
      data: { cashFlow: cashFlow, empresaId: this.empresaIdAtual() }
    });
  }
  
  deleteCashFlow(cashFlowId: string) {
    const empresaId = this.empresaIdAtual();
    if (!empresaId) {
      this.snackBar.open('ID da empresa inválida.', 'Fechar', { duration: 3000 });
      return;
    }

    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
        this.cashFlowService.deleteCashFlow(empresaId, cashFlowId)
            .then(() => {
                this.snackBar.open('Movimentação excluída com sucesso!', 'Fechar', { duration: 3000 });
            })
            .catch(error => {
                this.snackBar.open('Erro ao excluir movimentação.', 'Fechar', { duration: 3000 });
                console.error('Erro ao excluir:', error);
            });
    }
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}