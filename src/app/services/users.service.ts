import { Injectable, } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private firestore: AngularFirestore) { }

  private getUsuariosCollectionRef(empresaId: string): AngularFirestoreCollection<User> {
    return this.firestore
          .collection('business')
          .doc(empresaId)
          .collection<User>('users');
  }

  /**
   * Busca todos os usuários de uma empresa específica.
   */
  getAllUsers(empresaId: string): Observable<User[]> {
    return this.getUsuariosCollectionRef(empresaId).valueChanges({ idField: 'id' });
  }

  /**
   * Adiciona um novo usuário à sub-coleção da empresa.
   */
  addUser(empresaId: string, user: User) {
    return this.getUsuariosCollectionRef(empresaId).add(user);
  }

  /**
   * Atualiza um usuário específico em uma empresa específica.
   * A função original não usava o ID da empresa. Agora ela precisa.
   */
  updateUser(empresaId: string, userId: string, data: Partial<User>): Promise<void> {
    return this.getUsuariosCollectionRef(empresaId).doc(userId).update(data);
  }

  /**
   * Exclui um usuário da sub-coleção da empresa.
   */
  deleteUser(empresaId: string, userId: string): Promise<void> {
    return this.getUsuariosCollectionRef(empresaId).doc(userId).delete();
  }
}