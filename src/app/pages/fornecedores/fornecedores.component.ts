import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { FornecedoresService } from '../../services/fornecedores.service'; 
import { Fornecedor } from '../../interfaces/fornecedor';
// IMPORTAÇÃO DOS NOVOS MODAIS
import { ModalFormFornecedorComponent } from './modal-form/modal-form-fornecedor.component'; 
import { ModalViewFornecedorComponent } from './modal-view/modal-view-fornecedor.component'; 

@Component({
  selector: 'app-fornecedores',
  templateUrl: './fornecedores.component.html',
  styleUrls: ['./fornecedores.component.scss']
})
export class FornecedoresComponent implements OnInit {

  displayedColumns: string[] = ['name', 'cnpj', 'email', 'action'];
  dataSource!: MatTableDataSource<Fornecedor>;
  listFornecedores: Fornecedor[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Injeção de dependências
  private fornecedoresService: FornecedoresService = inject(FornecedoresService);
  
  // Variável de controle para o sistema Multi-Empresa
  // VOCÊ DEVE SUBSTITUIR ESTA LINHA PELA LÓGICA REAL DE OBTENÇÃO DO ID DA EMPRESA ATUAL
  currentEmpresaId: string = 'ID_DA_EMPRESA_ATUAL_MOCK'; 

  constructor(public dialog: MatDialog) {
    this.dataSource = new MatTableDataSource<Fornecedor>([]);
  }

  ngOnInit(): void {
    if (this.currentEmpresaId && this.currentEmpresaId !== 'ID_DA_EMPRESA_ATUAL_MOCK') {
      this.getListFornecedores(this.currentEmpresaId);
    } else {
      // Mensagem de aviso se o ID da empresa não for real (durante o desenvolvimento)
      console.warn("ID da empresa não definido/mockado. Não foi possível carregar os fornecedores reais.");
      // Se necessário, você pode carregar dados mockados ou exibir um aviso na interface.
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
    if (!this.currentEmpresaId || this.currentEmpresaId === 'ID_DA_EMPRESA_ATUAL_MOCK') {
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
        this.getListFornecedores(this.currentEmpresaId); 
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
    if (!this.currentEmpresaId || this.currentEmpresaId === 'ID_DA_EMPRESA_ATUAL_MOCK') {
      alert('Não é possível excluir. ID da empresa inválido.');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir este fornecedor? Esta ação é irreversível.')) {
        this.fornecedoresService.deleteFornecedor(this.currentEmpresaId, fornecedorId)
            .then(() => {
                // Recarrega a lista após a exclusão
                this.getListFornecedores(this.currentEmpresaId); 
            })
            .catch(error => {
                console.error('Erro ao excluir fornecedor:', error);
                alert('Ocorreu um erro ao excluir o fornecedor. Verifique o console.');
            });
    }
  }
}