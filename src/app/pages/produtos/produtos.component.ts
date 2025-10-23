import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { ProdutosService } from '../../services/produtos.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Produto } from '../../interfaces/produto';
import { AuthService } from '../../services/auth.services';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ModalViewProdutoComponent } from './modal-view/modal-view-produto.component';
import { ModalFormProdutoComponent } from './modal-form/modal-form-produto.component';

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss'
})

export class ProdutosComponent implements OnInit {
  private authService: AuthService = inject(AuthService);
  
  // Colunas da tabela. 'compra' e 'venda' para valores.
  displayedColumns: string[] = ['id', 'nome', 'marca', 'venda', 'action'];
  dataSource: any;
  listProdutos: Produto[] = [];

  // VARIÁVEL DE ESTADO MULTI-EMPRESA
  private currentEmpresaId: string = this.authService.activeTenantId() ?? '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private produtosService: ProdutosService,
    public dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<any>(this.listProdutos);
  }

  ngOnInit() {
    // Chamar a listagem apenas se o ID da empresa atual for válido
    if (this.currentEmpresaId) {
      this.getListProdutos(this.currentEmpresaId); 
    } else {
      console.warn('ID da empresa não definido. Os dados de produtos não serão carregados.');
    }
  }

  // MÉTODO AGORA RECEBE O ID DA EMPRESA
  getListProdutos(empresaId: string) {
    this.produtosService.getAllProdutos(empresaId).subscribe({
      next: (response: Produto[]) => {
        this.listProdutos = response;
        this.dataSource = new MatTableDataSource<any>(this.listProdutos);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.paginator._intl.itemsPerPageLabel = "Itens por página";
      },
      error: (err) => {
        console.log('Erro ao carregar produtos: ', err);
      }
    });
  }

  ngAfterViewInit() {
    this.orderProdutos();
  }

  orderProdutos() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openModalViewProduto(produto: Produto) {
    this.dialog.open(ModalViewProdutoComponent, {
      width: '1000px',
      height: '430px',
      data: produto
    });
  }

  // MÉTODO AGORA EXIGE O ID DA EMPRESA PARA EXCLUSÃO
  deleteProduto(produtoId: string) {
    if (!this.currentEmpresaId) {
        alert('ID da empresa não definido. Não foi possível excluir o produto.');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        this.produtosService.deleteProduto(this.currentEmpresaId, produtoId)
            .then(() => {
                // Recarrega a lista após a exclusão
                this.getListProdutos(this.currentEmpresaId); 
            })
            .catch(err => console.error('Erro ao excluir produto:', err));
    }
  }

  openModalFormProduto(produto: Produto | null = null) {
    // NOTE: O ModalFormProdutoComponent precisará apenas do ID da empresa para CRUD.
    this.dialog.open(ModalFormProdutoComponent, {
      width: '1000px',
      height: '600px', // Aumentei a altura para acomodar mais campos
      data: { 
        produto: produto,
        empresaId: this.currentEmpresaId // Passa o ID da empresa para o modal
      } 
    })
    .afterClosed().subscribe((result: boolean) => {
      // Recarrega a lista apenas se a operação (criação/edição) foi bem-sucedida (result === true)
      if (result === true && this.currentEmpresaId) {
        this.getListProdutos(this.currentEmpresaId);
      }
    });
  }
}