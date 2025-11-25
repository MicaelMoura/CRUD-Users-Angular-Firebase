import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { CashFlow } from '../interfaces/cashflow';

@Injectable({
  providedIn: 'root'
})
export class CashFlowService {

  constructor(private firestore: AngularFirestore) { }

  /**
   * Obtém a referência da sub-coleção 'cashflow' para a empresa fornecida.
   * Path: business/{empresaId}/cashflow
   */
  private getCompanyCashFlowCollection(empresaId: string): AngularFirestoreCollection<CashFlow> {
    return this.firestore
      .collection('business')
      .doc(empresaId)
      .collection<CashFlow>('cashflow'); // Nome da subcoleção
  }
  
  /**
   * Obtém todas as movimentações de caixa de uma empresa.
   */
  getAllCashFlow(empresaId: string): Observable<CashFlow[]> {
    return this.getCompanyCashFlowCollection(empresaId).valueChanges({ idField: 'id' });
  }

  /**
   * Adiciona uma nova movimentação de caixa (Entrada ou Saída).
   */
  addCashFlow(empresaId: string, item: Omit<CashFlow, 'id'>): Promise<any> {
    return this.getCompanyCashFlowCollection(empresaId).add(item);
  }

  /**
   * Atualiza uma movimentação de caixa específica.
   */
  updateCashFlow(empresaId: string, cashFlowId: string, data: Partial<CashFlow>): Promise<void> {
    return this.getCompanyCashFlowCollection(empresaId).doc(cashFlowId).update(data);
  }

  /**
   * Exclui uma movimentação de caixa específica.
   */
  deleteCashFlow(empresaId: string, cashFlowId: string): Promise<void> {
    return this.getCompanyCashFlowCollection(empresaId).doc(cashFlowId).delete();
  }
  
  
}