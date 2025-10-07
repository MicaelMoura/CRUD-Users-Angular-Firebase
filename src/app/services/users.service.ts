import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private dataBaseStore: AngularFirestore) {}

  /**
   * Obtém a referência da sub-coleção 'users' para a empresa fornecida.
   * Path: empresas/{empresaId}/users
   */
  private getCompanyUsersCollection(empresaId: string): AngularFirestoreCollection<User> {
    return this.dataBaseStore
      .collection('empresas')
      .doc(empresaId)
      .collection<User>('users');
  }

  // --- MÉTODOS CRUD ---

  /**
   * Busca todos os usuários de uma empresa específica.
   */
  getAllUsers(empresaId: string): Observable<User[]> {
    return this.getCompanyUsersCollection(empresaId)
      .valueChanges({ idField: 'firebaseId' }) as Observable<User[]>;
  }

  /**
   * Adiciona um novo usuário à sub-coleção da empresa.
   */
  addUser(empresaId: string, user: User) {
    // Note: A interface User provavelmente deve ter o 'id' opcional ou não ser passado aqui.
    // Usamos o tipo genérico para que o AngularFirestore gere o ID do documento.
    return this.getCompanyUsersCollection(empresaId).add(user);
  }

  /**
   * Atualiza um usuário específico em uma empresa específica.
   * A função original não usava o ID da empresa. Agora ela precisa.
   */
  updateUser(empresaId: string, userId: string, data: Partial<User>): Promise<void> {
    return this.getCompanyUsersCollection(empresaId).doc(userId).update(data);
  }

  /**
   * Exclui um usuário da sub-coleção da empresa.
   */
  deleteUser(empresaId: string, userId: string): Promise<void> {
    return this.getCompanyUsersCollection(empresaId).doc(userId).delete();
  }
}