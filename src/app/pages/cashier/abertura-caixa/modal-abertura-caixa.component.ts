import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-modal-abertura-caixa',
    templateUrl: './modal-abertura-caixa.component.html',
    styleUrls: ['./modal-abertura-caixa.component.scss'],
    standalone: false
})
export class ModalAberturaCaixaComponent {
  
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalAberturaCaixaComponent>,
    private snackBar: MatSnackBar // Adicionamos o SnackBar para feedback
  ) {
    this.form = this.fb.group({
      // Usamos uma string vazia inicialmente e validamos como min 0.
      valorInicialTroco: ['', [Validators.required, Validators.min(0)]] 
    });
  }

  onCancel(): void {
    // Fecha o modal retornando null ou false para indicar cancelamento
    this.dialogRef.close(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Por favor, preencha o valor do troco inicial.', 'Fechar', { duration: 3000 });
      return;
    }

    // 1. Obtém o valor como string (pode ter formatação de máscara)
    const valorString = this.form.value.valorInicialTroco;

    // 2. Tenta remover formatação de milhar e substituir vírgula por ponto para conversão
    let valorNumber = 0;
    if (typeof valorString === 'string') {
        const cleanedValue = valorString.replace(/\./g, '').replace(',', '.');
        valorNumber = parseFloat(cleanedValue);
    } else {
        valorNumber = valorString; // Se já for number (sem máscara)
    }

    if (isNaN(valorNumber)) {
        this.snackBar.open('Valor inválido. Use um formato numérico válido.', 'Fechar', { duration: 3000 });
        return;
    }
    
    // 3. Fecha o modal retornando o valor numérico (Troco Inicial)
    this.dialogRef.close(valorNumber);
  }
}