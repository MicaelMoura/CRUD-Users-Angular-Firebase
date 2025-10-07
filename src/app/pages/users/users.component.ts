import { Component, ViewChild, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { User } from '../../interfaces/user';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ModalViewUserComponent } from './modal-view-user/modal-view-user.component';
import { ModalFormUserComponent } from './modal-form-user/modal-form-user.component';
import { EmpresasService } from '../../services/empresas.service'; // Importar o serviço de empresas
import { Empresas } from '../../interfaces/empresas'; // Importar a interface de empresas

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})

export class UsersComponent implements OnInit {
  
  displayedColumns: string[] = ['id', 'name', 'email', 'action'];
  dataSource: any;
  listUsers: User[] = [];
  listEmpresas: Empresas[] = []; // Adicionar a lista de empresas

  // VARIÁVEL DE ESTADO MULTI-EMPRESA
  // **ATENÇÃO:** VOCÊ DEVE SUBSTITUIR ESTE VALOR MOCK PELO ID REAL DA EMPRESA DO USUÁRIO LOGADO
  currentEmpresaId: string = 'ID_DA_EMPRESA_ATUAL_MOCK'; 

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usersService: UsersService,
    public dialog: MatDialog,
    private empresasService: EmpresasService // Injetar o serviço de empresas
  ) {
    this.dataSource = new MatTableDataSource<any>(this.listUsers);
  }

  ngOnInit() {
    // Chamar a listagem apenas se o ID da empresa atual for válido
    if (this.currentEmpresaId && this.currentEmpresaId !== 'ID_DA_EMPRESA_ATUAL_MOCK') {
      this.gelListUsers(this.currentEmpresaId); 
    } else {
      console.warn('ID da empresa não definido. Os dados não serão carregados. (Ajuste "currentEmpresaId" no users.component.ts)');
    }
    
    this.getListEmpresas(); // Chamar o método para buscar a lista de empresas
  }

  // MÉTODO AGORA RECEBE O ID DA EMPRESA
  gelListUsers(empresaId: string) {
    // Passar o ID da empresa para o serviço
    this.usersService.getAllUsers(empresaId).subscribe({
      next: (response: any) => {
        this.listUsers = response;
        this.dataSource = new MatTableDataSource<any>(this.listUsers);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.paginator._intl.itemsPerPageLabel="Itens por página";
      },
      error: (err) => {
        console.log('Erro: ', err);
      }
    });
  }

  getListEmpresas() {
    this.empresasService.getEmpresas().subscribe(data => {
      this.listEmpresas = data;
    });
  }

  ngAfterViewInit() {
    this.orderUsers();
  }

  orderUsers() {
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

  openModalViewUser(user: User) {
    this.dialog.open(ModalViewUserComponent, {
      width: '1000px',
      height: '430px',
      data: user
    })
  }

  // MÉTODO AGORA EXIGE O ID DA EMPRESA PARA EXCLUSÃO
  deleteUser(firebaseId: string) {
    if (!this.currentEmpresaId || this.currentEmpresaId === 'ID_DA_EMPRESA_ATUAL_MOCK') {
        alert('ID da empresa não definido. Não foi possível excluir o usuário.');
        return;
    }
    // Passar o ID da empresa e o ID do usuário para o serviço
    this.usersService.deleteUser(this.currentEmpresaId, firebaseId);
  }

  openModalAddUser(user: User | null = null) {
    this.dialog.open(ModalFormUserComponent, {
      width: '1000px',
      height: '430px',
      data: { user: user, empresas: this.listEmpresas } // Passa a lista de empresas
    })
    .afterClosed().subscribe(() => {
      // Recarregar a lista após o fechamento do modal
      if (this.currentEmpresaId && this.currentEmpresaId !== 'ID_DA_EMPRESA_ATUAL_MOCK') {
        this.gelListUsers(this.currentEmpresaId);
      }
    });
  }
}