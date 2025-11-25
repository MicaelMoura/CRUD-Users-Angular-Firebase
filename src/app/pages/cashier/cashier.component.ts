import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { CashFlowService } from '../../services/cashflow.service';
import { CashFlow } from '../../interfaces/cashflow';
import { AuthService } from '../../services/auth.services';
// Importar os modais de entrada/saída que criaremos
import { ModalEntradaComponent } from './entradas/modal-entrada.component';
import { ModalSaidaComponent } from './saidas/modal-saida.component';

@Component({
  selector: 'app-caixa',
  templateUrl: './cashier.component.html',
  styleUrls: ['./cashier.component.scss']
})
export class CashierComponent implements OnInit {

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
  
  // Lógica de fechamento de caixa simplificada (apenas exibição)
  // O FECHAMENTO REAL precisaria de uma coleção separada 'caixa_fechamentos'
  fecharCaixa() {
    this.snackBar.open(`Fechamento de Caixa: Saldo Final R$ ${this.saldoAtual.toFixed(2)}.`, 'OK', { duration: 5000 });
    // Lógica para registrar o fechamento no banco de dados, se necessário
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}