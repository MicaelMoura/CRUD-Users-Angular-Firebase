import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { EmpresasService } from '../../services/empresas.service'; 
import { Empresas } from '../../interfaces/empresas'; 
import { ModalEmpresasFormComponent } from './modal-form-empresas/modal-form-empresas.component';
import { ModalViewEmpresasComponent } from './modal-view-empresas/modal-view-empresas.component';

@Component({
  selector: 'app-empresas',
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.scss']
})
export class EmpresasComponent implements OnInit {
  displayedColumns: string[] = ['name', 'cnpj', 'action'];
  dataSource!: MatTableDataSource<Empresas>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private empresasService: EmpresasService = inject(EmpresasService);
  
  constructor(public dialog: MatDialog) {
    this.dataSource = new MatTableDataSource<Empresas>([]);
  }

  ngOnInit(): void {
    this.getListEmpresas();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Novo método para abrir o modal de adição ou edição
  openCompanyFormModal(empresas?: Empresas | null) {
    this.dialog.open(ModalEmpresasFormComponent, {
      width: '900px',
      data: empresas // Passa os dados da empresa para o modal
    })
    .afterClosed().subscribe(() => {
      this.getListEmpresas();
    });
  }

  openModalViewCompany(empresas: Empresas) {
    this.dialog.open(ModalViewEmpresasComponent, {
      width: '1000px',
      height: '430px',
      data: empresas
    });
  }

  deleteCompany(companyId: string) {
    // Chama o método de exclusão do serviço
    this.empresasService.deleteEmpresa(companyId);
  }

  getListEmpresas() {
    this.empresasService.getEmpresas().subscribe(data => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.paginator._intl.itemsPerPageLabel="Itens por página";
    });
  }
}