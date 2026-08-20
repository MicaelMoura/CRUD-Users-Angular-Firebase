import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CashFlowService } from '../../../services/cashflow.service';
import { CashFlow } from '../../../interfaces/cashflow';
import { AuthService } from '../../../services/auth.services';
import { PlataformService } from '../../../services/plataform.service';
import { Payment } from '../../../interfaces/payment';
import { MatTableDataSource } from '@angular/material/table';

@Component({
    selector: 'app-modal-form-entrada',
    templateUrl: './modal-entrada.component.html',
    styleUrls: ['./modal-entrada.component.scss'],
    standalone: false
})
export class ModalEntradaComponent implements OnInit {

  listPayments: Payment[] = [];
  dataSource!: MatTableDataSource<Payment>;

  formCashFlow!: FormGroup;
  isEditMode = false;
  // O tipo é fixo para este modal
  tipoMovimentacao: 'ENTRADA' = 'ENTRADA';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalEntradaComponent>,
    private cashFlowService: CashFlowService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private plataformService: PlataformService,
    @Inject(MAT_DIALOG_DATA) public data: { cashFlow: CashFlow | null}
  ) {}

  private empresaIdAtual = this.authService.activeTenantId;

  ngOnInit(): void {
    this.buildForm();
    this.getListPayments();
    this.convertDate();
  }

  private convertDate() {
    if (this.data.cashFlow) {
      this.isEditMode = true;
      this.formCashFlow.patchValue(this.data.cashFlow);

      // Converte Timestamp para Date para o datepicker (usando a mesma lógica anterior)
      const dataMovimento = this.data.cashFlow.dataMovimento;
      if (dataMovimento && (dataMovimento as any).toDate) {
        const dateObj: Date = (dataMovimento as any).toDate();
        // Garante que o mat-datepicker receba um objeto Date
        this.formCashFlow.get('dataMovimento')?.setValue(dateObj);
      }
    }
  }

  buildForm() {
    this.formCashFlow = this.fb.group({
      id: [null], // ID do Firebase/Firestore
      descricao: [null, [Validators.required, Validators.minLength(3)]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      dataMovimento: [new Date(), [Validators.required]],
      formaPagamento: ['Dinheiro', [Validators.required]],
      entidadeId: [null]
    });
  }

   getListPayments() {
    this.plataformService.getPayments().subscribe(data => {
      this.listPayments = data;
      this.dataSource = new MatTableDataSource(this.listPayments);
    });
  
  }

  closeModal() {
    this.dialogRef.close(false); // Retorna false para indicar que não houve sucesso
  }

  saveCashFlow() {
    if (this.formCashFlow.invalid) {
      this.snackBar.open('Preencha todos os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }
    const empresaId = this.empresaIdAtual();
    if (!empresaId) {
      this.snackBar.open('Não é possível adicionar/editar. ID da empresa inválido.', 'Fechar', { duration: 3000 });
      return;
    }
    const itemData = {
      ...this.formCashFlow.value,
      tipo: this.tipoMovimentacao,
      empresaid: empresaId
    } as CashFlow;
    
    if (this.isEditMode && itemData.id) {
      // Modo Edição
      this.cashFlowService.updateCashFlow(empresaId, itemData.id, itemData)
        .then(() => {
          this.snackBar.open('Entrada atualizada com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true); // Retorna true para indicar sucesso
        })
        .catch(error => {
          this.snackBar.open('Erro ao atualizar entrada.', 'Fechar', { duration: 3000 });
          console.error('Erro ao atualizar:', error);
        });
    } else {
      // Modo Criação
      delete itemData.id; 
      this.cashFlowService.addCashFlow(empresaId, itemData)
        .then(() => {
          this.snackBar.open('Entrada registrada com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        })
        .catch(error => {
          this.snackBar.open('Erro ao registrar entrada.', 'Fechar', { duration: 3000 });
          console.error('Erro ao registrar:', error);
        });
    }
  }
}