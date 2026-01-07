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
    console.log('produto a salvar e empresa', produto, empresaId);
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

  async getProdutoByBarcode(empresaId: string, barcode: string): Promise<Produto | null> {
    const snapshot = await this.getCompanyProductsCollection(empresaId).ref
      .where('codigoDeBarras', '==', barcode) // Certifique-se que o campo no Firestore é 'codigoBarras'
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as Produto;
    return { ...data, firebaseId: doc.id };
  }
}