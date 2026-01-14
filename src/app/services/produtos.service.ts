import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { combineLatest, firstValueFrom, map, Observable, of, switchMap } from 'rxjs';
import { Produto } from '../interfaces/produto';
import { AuthService } from './auth.services';
import { PlataformService } from './plataform.service';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {
  
  constructor(
    private dataBaseStore: AngularFirestore,
    private firestore: AngularFirestore,
    private authService: AuthService,
    private plataformService: PlataformService,
  ) {}
  
  buscarProdutosComEstoque(termo: string): Observable<any[]> {
    const empresaId = this.authService.activeTenantId();
    //const busca = termo.toUpperCase();

    return this.firestore.collection<Produto>(`business/${empresaId}/products`, ref => 
      ref.orderBy('nome').startAt(termo).endAt(termo + '\uf8ff').limit(5)
    ).valueChanges({ idField: 'id' }).pipe(
      switchMap(produtos => {
        if (produtos.length === 0) return of([]);

        // Para cada produto, criamos uma busca na coleção stock
        const buscasEstoque = produtos.map(produto => 
          this.firestore.collection(`business/${empresaId}/stock`, ref => 
            ref.where('produtoId', '==', produto.id).limit(1)
          ).valueChanges().pipe(
            map(stocks => ({
              ...produto,
              estoqueQtd: stocks.length > 0 ? (stocks[0] as any).quantidade : 0,
              stockId: stocks.length > 0 ? (stocks[0] as any).id : null
            }))
          )
        );

        // combinaLatest junta todos os resultados das buscas de estoque em um único array
        return combineLatest(buscasEstoque);
      })
    );
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
    //console.log('produto a salvar e empresa', produto, empresaId);
    produto.nome = produto.nome.toUpperCase(); // Garantir que o nome esteja em maiúsculas
    return this.getCompanyProductsCollection(empresaId).add(produto);
  }

  /**
   * Atualiza um produto específico em uma empresa específica.
   */
  updateProduto(empresaId: string, produtoId: string, data: Partial<Produto>): Promise<void> {
    data.nome = data.nome?.toUpperCase(); // Garantir que o nome esteja em maiúsculas
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

  async getNomeUnidadeMedida(codigo: string): Promise<string> {
    const units = await firstValueFrom(this.plataformService.getUnits());
    const unidade = units.find(u => u.id === codigo);
    return unidade?.name || 'Desconhecida';
  }
}