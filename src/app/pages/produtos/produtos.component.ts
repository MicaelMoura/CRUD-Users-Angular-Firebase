import { Component, ViewChild, OnInit } from '@angular/core';
import { ProdutosService } from '../../services/produtos.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Produto } from '../../interfaces/produto';
import { AuthService } from '../../services/auth.services';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ModalViewProdutoComponent } from './modal-view/modal-view-produto.component';
import { ModalFormProdutoComponent } from './modal-form/modal-form-produto.component';
import { Router } from '@angular/router'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss'
})

export class ProdutosComponent implements OnInit {
  
  // Colunas da tabela. 'compra' e 'venda' para valores.
  displayedColumns: string[] = ['nome', 'marca', 'unidadeMedida', 'venda', 'action'];
  dataSource: any;
  listProdutos: Produto[] = [];


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public dialog: MatDialog,
    private produtosService: ProdutosService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.dataSource = new MatTableDataSource<any>(this.listProdutos);
  }

  public empresaIdAtual = this.authService.activeTenantId;

  ngOnInit() {
    this.getListProdutos(this.empresaIdAtual() || '');
  }

  // MÉTODO AGORA RECEBE O ID DA EMPRESA
  getListProdutos(empresaId: string) {
    if(empresaId == ''){
      this.snackBar.open('ID da empresa inválido.', 'Fechar', { duration: 3000 });
      this.router.navigate(['home']);
      return;
    }
    this.produtosService.getAllProdutos(empresaId).subscribe({
      next: (response: Produto[]) => {
        this.listProdutos = response;
        this.dataSource = new MatTableDataSource<any>(this.listProdutos);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.paginator._intl.itemsPerPageLabel = "Itens por página";
        response.forEach(async produto => {
          produto.nomeUnidadeMedida = await this.produtosService.getNomeUnidadeMedida(produto.unidadeDeMedida);
        });
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
      width: '1200px',
      height: '900px',
      data: produto
    });
  }

  // MÉTODO AGORA EXIGE O ID DA EMPRESA PARA EXCLUSÃO
  deleteProduto(produtoId: string) {
    const empresaId = this.empresaIdAtual();
    if (!empresaId) {
        alert('ID da empresa não definido. Não foi possível excluir o produto.');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        this.produtosService.deleteProduto(empresaId, produtoId)
            .then(() => {
                // Recarrega a lista após a exclusão
                this.getListProdutos(this.empresaIdAtual() || '');
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
        empresaId: this.empresaIdAtual() // Passa o ID da empresa para o modal
      } 
    })
    .afterClosed().subscribe((result: boolean) => {
      // Recarrega a lista apenas se a operação (criação/edição) foi bem-sucedida (result === true)
      const empresaId = this.empresaIdAtual();
      if (result === true && empresaId) {
        this.getListProdutos(empresaId);
      }
    });
  }
}