import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Fornecedor } from '../interfaces/fornecedor';
import { collectionData$, FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class FornecedoresService {
  constructor(private firebase: FirebaseService) {}

  private collectionPath(empresaId: string) {
    return collection(this.firebase.firestore, 'business', empresaId, 'supplier');
  }

  getAllFornecedores(empresaId: string): Observable<Fornecedor[]> {
    return collectionData$<Fornecedor>(this.collectionPath(empresaId), 'id');
  }

  addFornecedor(empresaId: string, fornecedor: Omit<Fornecedor, 'id'>) {
    return addDoc(this.collectionPath(empresaId), fornecedor);
  }

  updateFornecedor(empresaId: string, fornecedorId: string, data: Partial<Fornecedor>): Promise<void> {
    return updateDoc(doc(this.collectionPath(empresaId), fornecedorId), data);
  }

  deleteFornecedor(empresaId: string, fornecedorId: string): Promise<void> {
    return deleteDoc(doc(this.collectionPath(empresaId), fornecedorId));
  }
}
