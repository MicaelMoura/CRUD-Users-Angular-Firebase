import { Component, ViewChild, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.services';

import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ModalViewUserComponent } from './modal-view-user/modal-view-user.component';
import { ModalFormUserComponent } from './modal-form-user/modal-form-user.component';
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


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public dialog: MatDialog,
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    this.dataSource = new MatTableDataSource<any>(this.listUsers);
  }

  public empresaIdAtual = this.authService.activeTenantId;

  ngOnInit() {
    this.getListUsers(this.empresaIdAtual() || '');
  }

  // MÉTODO AGORA RECEBE O ID DA EMPRESA
  getListUsers(empresaId: string) {
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
    if (!this.empresaIdAtual()) {
        alert('ID da empresa não definido. Não foi possível excluir o usuário.');
        return;
    }
    // Passar o ID da empresa e o ID do usuário para o serviço
    this.usersService.deleteUser(this.empresaIdAtual() || '', firebaseId);
  }

  openModalAddUser(user: User | null = null) {
    this.dialog.open(ModalFormUserComponent, {
      width: '1000px',
      height: '430px',
      data: { user: user, empresas: this.listEmpresas } // Passa a lista de empresas
    })
    .afterClosed().subscribe(() => {
      // Recarregar a lista após o fechamento do modal
      if (this.empresaIdAtual()) {
        this.getListUsers(this.empresaIdAtual() || '');
      }
    });
  }
}