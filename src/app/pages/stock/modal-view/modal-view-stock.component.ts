import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Stock } from '../../../interfaces/stock';

@Component({
    selector: 'app-modal-view-stock',
    templateUrl: './modal-view-stock.component.html',
    styleUrl: './modal-view-stock.component.scss',
    standalone: false
})
export class ModalViewStockComponent {
  
  // A propriedade que guardará os dados do registro de estoque
  stockData: Stock;

  constructor(
    public dialogRef: MatDialogRef<ModalViewStockComponent>,
    // Recebe os dados do registro de estoque
    @Inject(MAT_DIALOG_DATA) public data: Stock
  ) {
    this.stockData = data;
  }

  // Fecha o modal
  closeModal() {
    this.dialogRef.close();
  }
}