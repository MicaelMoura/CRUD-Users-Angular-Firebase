import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Produto } from '../interfaces/produto';
import { AuthService } from './auth.services';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {
  
  constructor(
    private dataBaseStore: AngularFirestore,
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}
  
  buscarProdutosPorNome(termo: string): Observable<Produto[]> {
    const empresaId = this.authService.activeTenantId();
    
    // Convertemos para maiúsculas se os seus produtos estiverem salvos assim,
    // pois o Firestore é case-sensitive.
    const busca = termo.toUpperCase();

    return this.firestore.collection<Produto>(`business/${empresaId}/products`, ref => 
      ref.orderBy('nome')
         .startAt(termo)
         .endAt(termo + '\uf8ff')
         .limit(10) // Limitamos para não sobrecarregar a interface
    ).valueChanges({ idField: 'id' });
  }

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