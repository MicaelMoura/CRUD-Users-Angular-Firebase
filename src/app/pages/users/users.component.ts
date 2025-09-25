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
    this.gelListUsers();
    this.getListEmpresas(); // Chamar o método para buscar a lista de empresas
  }

  gelListUsers() {
    this.usersService.getAllUsers().subscribe({
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

  deleteUser(firebaseId: string) {
    this.usersService.deleteUser(firebaseId);
  }

  openModalAddUser(user: User | null = null) {
    this.dialog.open(ModalFormUserComponent, {
      width: '1000px',
      height: '430px',
      data: { user: user, empresas: this.listEmpresas } // Passar a lista de empresas junto com os dados do usuário
    })
    .afterClosed().subscribe(() => {
      this.gelListUsers();
    });
  }
}