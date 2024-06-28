import { Component, ViewChild } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { User } from '../../interfaces/user';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ModalViewUserComponent } from './modal-view-user/modal-view-user.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})

export class UsersComponent {
  
  displayedColumns: string[] = ['id', 'name', 'email', 'role', 'benefits', 'action'];
  dataSource: any;
  listUsers: User[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private usersService: UsersService,
    public dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<any>(this.listUsers);
  }

  ngOnInit() {
    this.gelListUsers();
  }

  gelListUsers() {
    this.usersService.getAllUsers().subscribe({
      next: (response: any) => {
        this.listUsers = response;
        this.dataSource = new MatTableDataSource<any>(this.listUsers);
        this.orderUsers();
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

  // Modal
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
}
