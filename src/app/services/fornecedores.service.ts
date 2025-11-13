import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Fornecedor } from '../interfaces/fornecedor';

@Injectable({
  providedIn: 'root'
})
export class FornecedoresService {

  constructor(private firestore: AngularFirestore) { }

  /**
   * Obtém a referência da sub-coleção 'fornecedores' para a empresa fornecida.
   * Path: empresas/{empresaId}/fornecedores
   */
  private getCompanyFornecedoresCollection(empresaId: string): AngularFirestoreCollection<Fornecedor> {
    return this.firestore
      .collection('business')
      .doc(empresaId)
      .collection<Fornecedor>('fornecedores');
  }

  // --- MÉTODOS CRUD ---

  /**
   * Busca todos os fornecedores de uma empresa específica.
   */
  getAllFornecedores(empresaId: string): Observable<Fornecedor[]> {
    return this.getCompanyFornecedoresCollection(empresaId).valueChanges({ idField: 'id' });
  }

  /**
   * Adiciona um novo fornecedor à sub-coleção da empresa.
   */
  addFornecedor(empresaId: string, fornecedor: Omit<Fornecedor, 'id'>): Promise<any> {
    // Usamos Omit<'id'> pois o Firestore gera o ID
    return this.getCompanyFornecedoresCollection(empresaId).add(fornecedor);
  }

  /**
   * Atualiza os dados de um fornecedor específico.
   */
  updateFornecedor(empresaId: string, fornecedorId: string, data: Partial<Fornecedor>): Promise<void> {
    return this.getCompanyFornecedoresCollection(empresaId).doc(fornecedorId).update(data);
  }

  /**
   * Exclui um fornecedor da sub-coleção da empresa.
   */
  deleteFornecedor(empresaId: string, fornecedorId: string): Promise<void> {
    return this.getCompanyFornecedoresCollection(empresaId).doc(fornecedorId).delete();
  }
}