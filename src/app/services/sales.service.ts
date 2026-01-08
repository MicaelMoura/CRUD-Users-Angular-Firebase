import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Venda } from '../interfaces/sales';

@Injectable({ providedIn: 'root' })
export class VendasService {
  constructor(private firestore: AngularFirestore) {}

  async salvarVenda(empresaId: string, venda: Venda): Promise<string> {
    const ref = await this.firestore
      .collection('business')
      .doc(empresaId)
      .collection('sales')
      .add(venda);
    return ref.id;
  }
}