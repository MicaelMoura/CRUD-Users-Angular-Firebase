import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { CashFlow } from '../interfaces/cashflow';
import { FechamentoCaixa } from '../interfaces/fechamento-caixa'; 
import { ResumoCaixa } from '../interfaces/resumo-caixa';
import firebase from 'firebase/compat/app';

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

  private getCashFlowCollection(empresaId: string): AngularFirestoreCollection<CashFlow> {
    if (!empresaId) {
        throw new Error("ID da empresa inválido para construir a coleção CashFlow.");
    }
    return this.firestore
        .collection('business')
        .doc(empresaId)
        .collection<CashFlow>('cashflow'); 
  }

  async getCashFlowSummary(empresaId: string, dataAbertura: Date): Promise<ResumoCaixa> {
    // 1. Validação
    if (!empresaId) {
        throw new Error("ID da empresa é obrigatório.");
    }

    const dataAberturaTimestamp = firebase.firestore.Timestamp.fromDate(dataAbertura);

    // 2. Cria a consulta (Query)
    const collectionRef = this.getCashFlowCollection(empresaId);
    
    // Filtra lançamentos *após* a data de abertura do caixa
    const snapshot = await collectionRef.ref
        // Filtra: Somente lançamentos cuja dataMovimento é maior que a dataAbertura
        // NOTA: No Firestore, consultas de intervalo em campos Timestamp podem exigir o Firebase Timestamp
        // Se 'dataMovimento' for um Date, o AngularFirestore lida com a conversão.
         .where('dataMovimento', '>', dataAberturaTimestamp) 
         .orderBy('dataMovimento', 'asc')
         .get();
        console.log('abertura', dataAberturaTimestamp);

    // 3. Inicializa o objeto de resumo
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
    // 4. Agrega os resultados
    snapshot.docs.forEach(docSnapshot => {
        const item = docSnapshot.data();

        // Garante que é um número válido para a soma
        const valor = item.valor || 0; 

        if (item.tipo === 'ENTRADA') {
            resumo.totalGeralEntradas += valor;
            
            // Supondo que você use uma descrição padronizada para Suprimentos
            if (item.descricao.toLowerCase().includes('suprimento')) {
                 resumo.totalSuprimentos += valor;
            } else if (item.formaPagamento === 'dinheiro') {
                resumo.totalVendasDinheiro += valor;
            } else if (item.formaPagamento === 'debito') {
                resumo.totalVendasCartaoDebito += valor;
            } else if (item.formaPagamento === 'credito') {
                resumo.totalVendasCartaoCredito += valor;
            } else if (item.formaPagamento === 'pix') { // Usando Transferência como PIX/TED
                resumo.totalVendasPix += valor;
            }
            console.log('tipo entrada')
            // Outras formas de entrada podem ser adicionadas
        } else if (item.tipo === 'SAÍDA') {
            console.log('tipo saida')
            resumo.totalGeralSaidas += valor;

            // Supondo que você use uma descrição padronizada para Sangrias/Retiradas
            if (item.descricao.toLowerCase().includes('sangria') || item.descricao.toLowerCase().includes('retirada')) {
                resumo.totalSangrias += valor;
            } else {
                // Todas as outras saídas são consideradas despesas do período
                resumo.totalDespesas += valor;
            }
        }
    });

    // 5. Retorna o resumo
    return resumo;
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
  
  private getFechamentoCollection(empresaId: string): AngularFirestoreCollection<FechamentoCaixa> {
    if (!empresaId) {
        // Lança um erro aqui, mas o componente deve tratar antes
        throw new Error("ID da empresa inválido para construir a coleção.");
    }
    return this.firestore
        .collection('business') // Coleção principal
        .doc(empresaId)         // Documento da empresa
        .collection<FechamentoCaixa>('caixa_fechamento'); // Sub-coleção
  }

  async getLastFechamento(empresaId: string): Promise<FechamentoCaixa | null> {
        if (!empresaId) return null;
        
        const collectionRef = this.getFechamentoCollection(empresaId);
        
        // Usa .ref para acessar o objeto de consulta nativo do Firebase SDK
        const snapshot = await collectionRef.ref
            .orderBy('dataFechamento', 'desc') // Ordena por data de fechamento mais recente
            .limit(1) // Pega apenas o último
            .get(); // Executa a consulta e retorna um Promise
        
        if (snapshot.empty) {
            return null; // Caixa nunca foi aberto/fechado
        }

        const docSnapshot = snapshot.docs[0];
        const docData = docSnapshot.data() as FechamentoCaixa; 
        docData.id = docSnapshot.id;
        if (typeof (docData.dataAbertura as any).toDate === 'function') {
            docData.dataAbertura = (docData.dataAbertura as any).toDate();
        }
        if (typeof (docData.dataFechamento as any).toDate === 'function') {
            docData.dataFechamento = (docData.dataFechamento as any).toDate();
        }
        return docData;
    }

  async saveFechamento(empresaId: string, fechamento: FechamentoCaixa): Promise<void> {
        if (!empresaId) {
            throw new Error("ID da empresa inválido para salvar o fechamento.");
        }
        
        // O método add() cria um novo documento com ID automático
        await this.getFechamentoCollection(empresaId).add(fechamento); 
    }
}