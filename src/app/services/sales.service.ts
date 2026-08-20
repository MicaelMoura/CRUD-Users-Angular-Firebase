import { Injectable } from '@angular/core';
import { addDoc, collection } from 'firebase/firestore';
import { Venda } from '../interfaces/sales';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class VendasService {
  constructor(private firebase: FirebaseService) {}

  async salvarVenda(empresaId: string, venda: Venda): Promise<string> {
    const source = collection(this.firebase.firestore, 'business', empresaId, 'sales');
    const reference = await addDoc(source, venda);
    return reference.id;
  }

  async emitirNfce(empresaId: string, vendaId: string, venda: Venda) {
    return { sucesso: true, urlDanfe: 'https://example.com/danfe.pdf' };
  }
}
