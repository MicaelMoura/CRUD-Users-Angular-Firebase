import { Component, OnInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { FornecedoresService } from '../../services/fornecedores.service'; 
import { Fornecedor } from '../../interfaces/fornecedor';
import { AuthService } from '../../services/auth.services';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'; 
// IMPORTAÇÃO DOS NOVOS MODAIS
import { ModalFormFornecedorComponent } from './modal-form/modal-form-fornecedor.component'; 
import { ModalViewFornecedorComponent } from './modal-view/modal-view-fornecedor.component'; 

@Component({
  selector: 'app-fornecedores',
  templateUrl: './fornecedores.component.html',
  styleUrls: ['./fornecedores.component.scss']
})
export class FornecedoresComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['razaoSocial', 'cnpj', 'email', 'action'];
  dataSource!: MatTableDataSource<Fornecedor>;
  listFornecedores: Fornecedor[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
 currentEmpresaId: string | null = null;
 private tenantSubscription!: Subscription;

  constructor(public dialog: MatDialog,
    private authService: AuthService,
    private fornecedoresService: FornecedoresService,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource<Fornecedor>([]);
  }

  ngOnInit(): void {
    this.inscreverObservarTenant();
  }
  inscreverObservarTenant() {
    this.tenantSubscription = this.authService.activeTenantId.subscribe(tenantId => {
      this.currentEmpresaId = tenantId;
      
      // Chama a listagem de usuários APENAS se o ID da empresa estiver disponível
      if (this.currentEmpresaId) {
        this.getListFornecedores(this.currentEmpresaId); 
      } else {
        // Opcional: Limpar a lista se o ID do tenant for removido (logout)
        this.listFornecedores = [];
        this.dataSource = new MatTableDataSource<any>(this.listFornecedores);
        
        this.router.navigate(['home']);
      }
    });
  }

  ngOnDestroy() {
    // Cancelar a inscrição para evitar vazamentos de memória
    if (this.tenantSubscription) {
      this.tenantSubscription.unsubscribe();
    }
  }

  // Busca a lista de fornecedores da empresa atual (Multi-empresa)
  getListFornecedores(empresaId: string) {
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
    if (!this.currentEmpresaId) {
      alert('Não é possível adicionar/editar. ID da empresa inválido.');
      return;
    }
    
    this.dialog.open(ModalFormFornecedorComponent, {
      width: '900px',
      // Passa o fornecedor (para edição) e o ID da empresa (para o CRUD)
      data: { 
          fornecedor: fornecedor, 
          empresaId: this.currentEmpresaId 
      } 
    }).afterClosed().subscribe((result) => {
      // Recarrega a lista somente se a operação no modal foi bem sucedida
      if (result) { 
        this.inscreverObservarTenant();
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
    if (!this.currentEmpresaId) {
      alert('Não é possível excluir. ID da empresa inválido.');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir este fornecedor? Esta ação é irreversível.')) {
        this.fornecedoresService.deleteFornecedor(this.currentEmpresaId, fornecedorId)
            .then(() => {
                // Recarrega a lista após a exclusão
                this.inscreverObservarTenant();
            })
            .catch(error => {
                console.error('Erro ao excluir fornecedor:', error);
                alert('Ocorreu um erro ao excluir o fornecedor. Verifique o console.');
            });
    }
  }
}