import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { FornecedoresService } from '../../services/fornecedores.service'; 
import { Fornecedor } from '../../interfaces/fornecedor';
import { AuthService } from '../../services/auth.services';
import { Router } from '@angular/router'; 
import { MatSnackBar } from '@angular/material/snack-bar';
// IMPORTAÇÃO DOS NOVOS MODAIS
import { ModalFormFornecedorComponent } from './modal-form/modal-form-fornecedor.component'; 
import { ModalViewFornecedorComponent } from './modal-view/modal-view-fornecedor.component'; 

@Component({
  selector: 'app-fornecedores',
  templateUrl: './fornecedores.component.html',
  styleUrls: ['./fornecedores.component.scss']
})
export class FornecedoresComponent implements OnInit {

  displayedColumns: string[] = ['fantasyName', 'cnpj', 'email', 'action'];
  dataSource!: MatTableDataSource<Fornecedor>;
  listFornecedores: Fornecedor[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public dialog: MatDialog,
    private authService: AuthService,
    private fornecedoresService: FornecedoresService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.dataSource = new MatTableDataSource<Fornecedor>([]);
  }

  public empresaIdAtual = this.authService.activeTenantId;

  ngOnInit(): void {
    this.getListFornecedores(this.empresaIdAtual() || '');
  }

  // Busca a lista de fornecedores da empresa atual (Multi-empresa)
  getListFornecedores(empresaId: string) {
    if(empresaId == ''){
      this.snackBar.open('ID da empresa inválido.', 'Fechar', { duration: 3000 });
      this.router.navigate(['home']);
      return;
    }
    this.fornecedoresService.getAllFornecedores(empresaId).subscribe(data => {
      this.listFornecedores = data;
      this.dataSource = new MatTableDataSource(this.listFornecedores);
      
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.paginator._intl.itemsPerPageLabel = "Itens por página";
    });
  }

  // Aplica o filtro na tabela
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Abre o modal para ADICIONAR ou EDITAR um fornecedor
  openFornecedorFormModal(fornecedor: Fornecedor | null = null) {
    if (!this.empresaIdAtual()) {
      this.snackBar.open('Não é possível adicionar/editar. ID da empresa inválido.', 'Fechar', { duration: 3000 });
      return;
    }
    
    this.dialog.open(ModalFormFornecedorComponent, {
      width: '900px',
      // Passa o fornecedor (para edição) e o ID da empresa (para o CRUD)
      data: { 
          fornecedor: fornecedor, 
          empresaId: this.empresaIdAtual()
      } 
    }).afterClosed().subscribe((result) => {
      // Recarrega a lista somente se a operação no modal foi bem sucedida
      if (result) { 
        this.getListFornecedores(this.empresaIdAtual() || '');
      }
    });
  }

  // Abre o modal de visualização
  openModalViewFornecedor(fornecedor: Fornecedor) {
    this.dialog.open(ModalViewFornecedorComponent, {
      width: '800px', // Ajustei a largura
      data: fornecedor // Passa o objeto completo
    });
  }

  // Exclui um fornecedor
  deleteFornecedor(fornecedorId: string) {
    if (!this.empresaIdAtual()) {
      alert('Não é possível excluir. ID da empresa inválido.');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir este fornecedor? Esta ação é irreversível.')) {
        this.fornecedoresService.deleteFornecedor(this.empresaIdAtual() || '', fornecedorId)
            .then(() => {
                // Recarrega a lista após a exclusão
                this.getListFornecedores(this.empresaIdAtual() || '');
            })
            .catch(error => {
                console.error('Erro ao excluir fornecedor:', error);
                alert('Ocorreu um erro ao excluir o fornecedor. Verifique o console.');
            });
    }
  }
}