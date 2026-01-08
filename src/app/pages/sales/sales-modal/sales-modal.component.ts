import { Component, Inject, signal, computed, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormaPagamento, ItemVenda } from '../../../interfaces/sales';

@Component({
  selector: 'app-sales-modal',
  templateUrl: './sales-modal.component.html',
  styleUrls: ['./sales-modal.component.scss']
})
export class SalesModalComponent {
  formaPagamento = signal<FormaPagamento>('dinheiro');
  valorRecebido = signal<number>(0);

  @HostListener('window:keydown', ['$event'])
  handleModalKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // Só confirma se a lógica de valor permitir
      if (this.podeConfirmar()) {
        event.preventDefault();
        this.confirmar();
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelar();
    }
  }

  podeConfirmar = computed(() => {
    if (this.formaPagamento() === 'dinheiro') {
      // Se for dinheiro, exige valor igual ou maior que o total
      return this.valorRecebido() >= this.data.total;
    }
    // Se for PIX, Débito ou Crédito, habilita automaticamente
    return true; 
  });
  
  troco = computed(() => {
    const diff = this.valorRecebido() - this.data.total;
    return diff > 0 ? diff : 0;
  });

  constructor(
    public dialogRef: MatDialogRef<SalesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { total: number }
  ) {}

  confirmar() {
    // Retorna os dados para o componente principal
    this.dialogRef.close({
      formaPagamento: this.formaPagamento(),
      valorRecebido: this.valorRecebido()
    });
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}