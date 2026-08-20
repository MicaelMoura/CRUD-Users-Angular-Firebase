import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StockService } from '../../services/stock.service'; 
import { Stock } from '../../interfaces/stock';
import { AuthService } from '../../services/auth.services';
import { ModalViewStockComponent } from './modal-view/modal-view-stock.component';
import { ModalFormStockComponent } from './modal-cadastro/modal-form-stock.component';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-stock',
    templateUrl: './stock.component.html',
    styleUrl: './stock.component.scss',
    standalone: false
})
export class StockComponent implements OnInit {

    // Colunas que serão exibidas na tabela
    displayedColumns: string[] = ['produto', 'fornecedor', 'quantidade', 'validade', 'tipoMovimento', 'dataMovimento', 'action'];
  
    dataSource!: MatTableDataSource<Stock>;
    listStock: Stock[] = [];
  
    // Propriedades da tabela
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

  // Injeção de dependências
    constructor(
        public dialog: MatDialog,
        private stockService: StockService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
    ) { }

    public empresaIdAtual = this.authService.activeTenantId;

    ngOnInit(): void {
        this.getListStock(this.empresaIdAtual() || '');
    }

  /**
   * Obtém a lista de movimentações de estoque da empresa logada
   */
    getListStock(empresaId: string) {
        if (!empresaId){
            this.snackBar.open('ID da empresa não encontrado. Faça o login novamente.', 'Fechar', { duration: 3000 });
            return;
        }
        this.stockService.getAllStockEntries(empresaId).pipe(
        // Usamos o operador map para converter a data
        map(entries => entries.map(entry => {
            // Verifica se dataMovimento é um Timestamp e converte para Date
            if (entry.dataMovimento && typeof entry.dataMovimento !== 'string') {
            // O método toDate() está disponível no objeto Timestamp do Firebase
            entry.dataMovimento = (entry.dataMovimento as any).toDate(); 
            }
            return entry;
        }))
        ).subscribe({
        next: (data: Stock[]) => {
            this.listStock = data;
            this.dataSource = new MatTableDataSource<Stock>(this.listStock);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.paginator._intl.itemsPerPageLabel = "Itens por página";
        },
        error: (err) => {
            console.error('Erro ao carregar lista de estoque:', err);
            this.snackBar.open('Erro ao carregar dados do estoque.', 'Fechar', { duration: 5000 });
        }
        });
    }

  /**
   * Aplica o filtro na tabela
   */
    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

  /**
   * Abre o modal para adicionar ou ajustar o estoque
   * (O ModalFormStockComponent será criado no próximo passo)
   */
    openStockFormModal(stockEntry?: Stock | null) {
        const empresaId = this.empresaIdAtual();
        if (!empresaId) {
            this.snackBar.open('ID da empresa não encontrado. Faça o login novamente.', 'Fechar', { duration: 3000 });
            return;
        }

        this.dialog.open(ModalFormStockComponent, {
        width: '900px',
        data: {
            stockEntry: stockEntry,
            empresaId: empresaId
        }
        }).afterClosed().subscribe((result) => {
        if (result) { 
            this.getListStock(empresaId);
        }
        });

    }

    openModalViewStock(stock: Stock) {
        this.dialog.open(ModalViewStockComponent, {
        width: '1000px',
        height: '500px',
        data: stock
        });
    }

    deleteStock(fornecedorId: string) {
        if (!this.empresaIdAtual()) {
            alert('Não é possível excluir. ID da empresa inválido.');
            return;
        }
        
        if (confirm('Tem certeza que deseja excluir este movimento? Esta ação é irreversível.')) {
            this.stockService.deleteStockEntry(this.empresaIdAtual() || '', fornecedorId)
                .then(() => {
                    // Recarrega a lista após a exclusão
                    this.getListStock(this.empresaIdAtual() || '');
                })
                .catch(error => {
                    console.error('Erro ao excluir movimento:', error);
                    alert('Ocorreu um erro ao excluir o movimento. Verifique o console.');
                });
        }
    }
}