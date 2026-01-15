import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Stock } from '../interfaces/stock';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  constructor(private firestore: AngularFirestore) { }

  /**
   * Obtém a referência da sub-coleção 'stock' para a empresa fornecida.
   * Path: business/{empresaId}/stock
   */
  private getCompanyStockCollection(empresaId: string): AngularFirestoreCollection<Stock> {
    return this.firestore
      .collection('business')
      .doc(empresaId)
      .collection<Stock>('stock');
  }

  /**
   * Obtém todos os registros de estoque (movimentações) da empresa.
   */
  getAllStockEntries(empresaId: string): Observable<Stock[]> {
    // Ordenar por dataMovimento descendente para mostrar os mais recentes primeiro
    return this.getCompanyStockCollection(empresaId).valueChanges({ idField: 'id' });
  }

  /**
   * Adiciona um novo registro de movimento de estoque (entrada ou ajuste)
   */
  addStockEntry(empresaId: string, stockEntry: Omit<Stock, 'id'>): Promise<any> {
    // Usamos Omit<'id'> pois o Firestore gera o ID
    return this.getCompanyStockCollection(empresaId).add({
        ...stockEntry 
    });
  }

  /**
   * Atualiza um registro de movimento de estoque específico (Geralmente usado apenas para correção de dados)
   */
  updateStockEntry(empresaId: string, stockEntryId: string, data: Partial<Stock>): Promise<void> {
    return this.getCompanyStockCollection(empresaId).doc(stockEntryId).update(data);
  }

  /**
   * Exclui um registro de movimento de estoque.
   */
  deleteStockEntry(empresaId: string, stockEntryId: string): Promise<void> {
    return this.getCompanyStockCollection(empresaId).doc(stockEntryId).delete();
  }

  async diminuirEstoque(empresaId: string, produtoId: string, quantidade: number): Promise<void> {
    const dec = -1 * quantidade;
    const query = this.firestore.collection(`business/${empresaId}/stock`, ref => 
      ref.where('produtoId', '==', produtoId).limit(1)
    );
    const snapshot = await firstValueFrom(query.get());
    if (snapshot.empty) {
      console.error(`Registro de estoque não encontrado para o produto: ${produtoId}`);
      // Você pode optar por lançar um erro ou criar o registro de estoque aqui
      throw new Error('Estoque não localizado.');
    }
    const stockId = snapshot.docs[0].id;
    return this.getCompanyStockCollection(empresaId).doc(stockId).update({
      estoque: firebase.firestore.FieldValue.increment(dec)
    } as any);
  }

  async getQuantidadeEmEstoque(empresaId: string, produtoId: string): Promise<number> {
    const query = this.firestore.collection(`business/${empresaId}/stock`, ref => 
      ref.where('produtoId', '==', produtoId).limit(1)
    );
    const snapshot = await firstValueFrom(query.get());
    this.getCompanyStockCollection(empresaId).doc(snapshot.docs[0].id);
    const data = snapshot.docs[0].data() as Stock;
    return data.quantidade;
  }
}