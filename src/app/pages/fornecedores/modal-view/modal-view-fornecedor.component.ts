import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Fornecedor } from '../../../interfaces/fornecedor';

@Component({
  selector: 'app-modal-view-fornecedor',
  templateUrl: './modal-view-fornecedor.component.html',
  styleUrls: ['./modal-view-fornecedor.component.scss']
})
export class ModalViewFornecedorComponent implements OnInit {

  fornecedor!: Fornecedor;

  constructor(
    public dialogRef: MatDialogRef<ModalViewFornecedorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Fornecedor // Recebe diretamente o objeto Fornecedor
  ) { }

  ngOnInit(): void {
    // Atribui os dados injetados à propriedade local
    this.fornecedor = this.data;
  }

  closeModal(): void {
    this.dialogRef.close();
  }

}