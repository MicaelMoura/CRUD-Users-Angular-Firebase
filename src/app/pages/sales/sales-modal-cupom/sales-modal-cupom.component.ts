import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sales-modal-cupom',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './sales-modal-cupom.component.html',
  styleUrl: './sales-modal-cupom.component.scss'
})
export class SalesModalCupomComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<SalesModalCupomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Aqui chegam os dados da venda
  ) {}

  ngOnInit() {
    // Dispara a impressão automaticamente ao abrir
    setTimeout(() => {
      window.print();
    }, 500);
  }

  fechar() {
    this.dialogRef.close();
  }
}