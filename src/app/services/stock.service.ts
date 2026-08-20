import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Stock } from '../interfaces/stock';
import { collectionData$, FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class StockService {
  constructor(private firebase: FirebaseService) {}

  private collectionPath(empresaId: string) {
    return collection(this.firebase.firestore, 'business', empresaId, 'stock');
  }

  getAllStockEntries(empresaId: string): Observable<Stock[]> {
    return collectionData$<Stock>(this.collectionPath(empresaId), 'id');
  }

  addStockEntry(empresaId: string, stockEntry: Omit<Stock, 'id'>) {
    return addDoc(this.collectionPath(empresaId), stockEntry);
  }

  updateStockEntry(empresaId: string, stockEntryId: string, data: Partial<Stock>): Promise<void> {
    return updateDoc(doc(this.collectionPath(empresaId), stockEntryId), data);
  }

  deleteStockEntry(empresaId: string, stockEntryId: string): Promise<void> {
    return deleteDoc(doc(this.collectionPath(empresaId), stockEntryId));
  }

  async diminuirEstoque(empresaId: string, produtoId: string, quantidade: number): Promise<void> {
    const stockQuery = query(
      this.collectionPath(empresaId),
      where('produtoId', '==', produtoId),
      limit(1),
    );
    const snapshot = await getDocs(stockQuery);

    if (snapshot.empty) {
      throw new Error('Estoque não localizado.');
    }

    await updateDoc(snapshot.docs[0].ref, { quantidade: increment(-quantidade) });
  }

  async getQuantidadeEmEstoque(empresaId: string, produtoId: string): Promise<number> {
    const stockQuery = query(
      this.collectionPath(empresaId),
      where('produtoId', '==', produtoId),
      limit(1),
    );
    const snapshot = await getDocs(stockQuery);

    if (snapshot.empty) {
      return 0;
    }

    return Number(snapshot.docs[0].data()['quantidade'] ?? 0);
  }
}
