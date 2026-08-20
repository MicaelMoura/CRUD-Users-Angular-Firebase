import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { CashFlow } from '../interfaces/cashflow';
import { FechamentoCaixa } from '../interfaces/fechamento-caixa';
import { ResumoCaixa } from '../interfaces/resumo-caixa';
import { collectionData$, FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class CashFlowService {
  constructor(private firebase: FirebaseService) {}

  private cashFlowCollection(empresaId: string) {
    if (!empresaId) {
      throw new Error('ID da empresa inválido para construir a coleção CashFlow.');
    }
    return collection(this.firebase.firestore, 'business', empresaId, 'cashflow');
  }

  private closingCollection(empresaId: string) {
    if (!empresaId) {
      throw new Error('ID da empresa inválido para construir a coleção.');
    }
    return collection(this.firebase.firestore, 'business', empresaId, 'caixa_fechamento');
  }

  async getCashFlowSummary(empresaId: string, dataAbertura: Date): Promise<ResumoCaixa> {
    const cashFlowQuery = query(
      this.cashFlowCollection(empresaId),
      where('dataMovimento', '>', Timestamp.fromDate(dataAbertura)),
      orderBy('dataMovimento', 'asc'),
    );
    const snapshot = await getDocs(cashFlowQuery);
    const resumo: ResumoCaixa = {
      totalVendasDinheiro: 0,
      totalVendasCartaoCredito: 0,
      totalVendasCartaoDebito: 0,
      totalVendasPix: 0,
      totalDespesas: 0,
      totalSuprimentos: 0,
      totalSangrias: 0,
      totalGeralEntradas: 0,
      totalGeralSaidas: 0,
    };

    snapshot.docs.forEach((document) => {
      const item = document.data() as CashFlow;
      const valor = item.valor || 0;

      if (item.tipo === 'ENTRADA') {
        resumo.totalGeralEntradas += valor;
        if (item.descricao.toLowerCase().includes('suprimento')) {
          resumo.totalSuprimentos += valor;
        } else if (item.formaPagamento === 'dinheiro') {
          resumo.totalVendasDinheiro += valor;
        } else if (item.formaPagamento === 'debito') {
          resumo.totalVendasCartaoDebito += valor;
        } else if (item.formaPagamento === 'credito') {
          resumo.totalVendasCartaoCredito += valor;
        } else if (item.formaPagamento === 'pix') {
          resumo.totalVendasPix += valor;
        }
      } else if (item.tipo === 'SAÍDA') {
        resumo.totalGeralSaidas += valor;
        const description = item.descricao.toLowerCase();
        if (description.includes('sangria') || description.includes('retirada')) {
          resumo.totalSangrias += valor;
        } else {
          resumo.totalDespesas += valor;
        }
      }
    });

    return resumo;
  }

  getAllCashFlow(empresaId: string): Observable<CashFlow[]> {
    return collectionData$<CashFlow>(this.cashFlowCollection(empresaId), 'id');
  }

  addCashFlow(empresaId: string, item: Omit<CashFlow, 'id'>) {
    return addDoc(this.cashFlowCollection(empresaId), item);
  }

  updateCashFlow(empresaId: string, cashFlowId: string, data: Partial<CashFlow>): Promise<void> {
    return updateDoc(doc(this.cashFlowCollection(empresaId), cashFlowId), data);
  }

  deleteCashFlow(empresaId: string, cashFlowId: string): Promise<void> {
    return deleteDoc(doc(this.cashFlowCollection(empresaId), cashFlowId));
  }

  async getLastFechamento(empresaId: string): Promise<FechamentoCaixa | null> {
    if (!empresaId) {
      return null;
    }

    const closingQuery = query(
      this.closingCollection(empresaId),
      orderBy('dataFechamento', 'desc'),
      limit(1),
    );
    const snapshot = await getDocs(closingQuery);
    if (snapshot.empty) {
      return null;
    }

    const closingDocument = snapshot.docs[0];
    const data = closingDocument.data() as FechamentoCaixa;
    return {
      ...data,
      id: closingDocument.id,
      dataAbertura: this.toDate(data.dataAbertura),
      dataFechamento: this.toDate(data.dataFechamento),
    };
  }

  async saveFechamento(empresaId: string, fechamento: FechamentoCaixa): Promise<void> {
    await addDoc(this.closingCollection(empresaId), fechamento);
  }

  private toDate(value: Date | string): Date | string {
    return value instanceof Timestamp ? value.toDate() : value;
  }
}
