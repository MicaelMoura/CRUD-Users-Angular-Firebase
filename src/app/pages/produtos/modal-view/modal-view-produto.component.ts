import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Produto } from '../../../interfaces/produto';

@Component({
    selector: 'app-modal-view-produto',
    templateUrl: './modal-view-produto.component.html',
    styleUrls: ['./modal-view-produto.component.scss'],
    standalone: false
})
export class ModalViewProdutoComponent implements OnInit {

  produtoData!: Produto;

  constructor(
    public dialogRef: MatDialogRef<ModalViewProdutoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Produto // Recebe diretamente o objeto Produto
  ) { }

  ngOnInit(): void {
    // Atribui os dados injetados à propriedade local
    this.produtoData = this.data;
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}