import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Produto } from '../interfaces/produto';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {

  constructor(private dataBaseStore: AngularFirestore) {}

  /**
   * Obtém a referência da sub-coleção 'produtos' para a empresa fornecida.
   * Path: empresas/{empresaId}/produtos
   */
  private getCompanyProductsCollection(empresaId: string): AngularFirestoreCollection<Produto> {
    return this.dataBaseStore
      .collection('business')
      .doc(empresaId)
      .collection<Produto>('products');
  }

  // --- MÉTODOS CRUD ---

  /**
   * Busca todos os produtos de uma empresa específica.
   */
  getAllProdutos(empresaId: string): Observable<Produto[]> {
    return this.getCompanyProductsCollection(empresaId)
      .valueChanges({ idField: 'firebaseId' }) as Observable<Produto[]>;
  }

  /**
   * Adiciona um novo produto à sub-coleção da empresa.
   */
  addProduto(empresaId: string, produto: Produto) {
    return this.getCompanyProductsCollection(empresaId).add(produto);
  }

  /**
   * Atualiza um produto específico em uma empresa específica.
   */
  updateProduto(empresaId: string, produtoId: string, data: Partial<Produto>): Promise<void> {
    return this.getCompanyProductsCollection(empresaId).doc(produtoId).update(data);
  }

  /**
   * Exclui um produto da sub-coleção da empresa.
   */
  deleteProduto(empresaId: string, produtoId: string): Promise<void> {
    return this.getCompanyProductsCollection(empresaId).doc(produtoId).delete();
  }
}