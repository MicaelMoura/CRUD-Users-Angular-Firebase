import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Empresas } from '../interfaces/empresas';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private empresasCollection: AngularFirestoreCollection<Empresas>;

  constructor(private firestore: AngularFirestore) {
    this.empresasCollection = this.firestore.collection<Empresas>('empresas');
  }

  getEmpresas(): Observable<Empresas[]> {
    return this.empresasCollection.valueChanges({ idField: 'firebaseId' });
  }

  addEmpresa(empresa: Empresas): Promise<any> {
    return this.empresasCollection.add(empresa);
  }

  // Adiciona o método para excluir uma empresa
  deleteEmpresa(id: string): Promise<void> {
    return this.empresasCollection.doc(id).delete();
  }

  // Método para atualizar uma empresa
  updateEmpresa(id: string, data: Partial<Empresas>): Promise<void> {
    return this.empresasCollection.doc(id).update(data);
  }
}