import { Component, Inject, signal, computed, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormaPagamento, ItemVenda } from '../../../interfaces/sales';

@Component({
  selector: 'app-sales-modal',
  templateUrl: './sales-modal-finalizar.component.html',
  styleUrls: ['./sales-modal-finalizar.component.scss']
})
export class SalesModalComponent {
  formaPagamento = signal<FormaPagamento>('dinheiro');
  valorRecebido = signal<number>(0);
  pagamentosRealizados = signal<{ forma: string, valor: number }[]>([]);

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

  constructor(
    public dialogRef: MatDialogRef<SalesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { total: number }
  ) {}

  podeConfirmar = computed(() => {
    if (this.saldoRestante() <= 0) {
      // Se for dinheiro, exige valor igual ou maior que o total
      return true;
    }
    return false;
  });

  totalPago = computed(() => 
    this.pagamentosRealizados().reduce((acc, p) => acc + p.valor, 0)
  );

  saldoRestante = computed(() => {
    const restante = this.data.total - this.totalPago();
    return restante > 0 ? restante : 0;
  });
  
  troco = computed(() => {
    const excesso = this.totalPago() - this.data.total;
    return excesso > 0 ? excesso : 0;
  })

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
  
  adicionarPagamento(forma: string) {
    const valor = Number(this.valorRecebido());
    
    if (valor <= 0) return;

    // Adiciona à lista
    this.pagamentosRealizados.update(atual => [...atual, { forma, valor }]);
    
    // Reseta o campo de valor para o próximo
    this.valorRecebido.set(0);
  }

  removerPagamento(index: number) {
    this.pagamentosRealizados.update(atual => atual.filter((_, i) => i !== index));
  }
}