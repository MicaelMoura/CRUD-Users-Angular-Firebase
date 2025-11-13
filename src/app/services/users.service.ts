import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, deleteDoc, updateDoc, CollectionReference, 
  DocumentReference, query, where, setDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';
import { AuthService } from './auth.services';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getUsuariosCollectionRef(empresaId: string): CollectionReference<User, User> {
    
    return collection(this.firestore, `business/${empresaId}/users`) as CollectionReference<User, User>;
  }

  /**
   * Busca todos os usuários de uma empresa específica.
   */
  getAllUsers(empresaId: string): Observable<User[]> {
    const usuariosCollection = this.getUsuariosCollectionRef(empresaId);

    return collectionData(usuariosCollection, { idField: 'id' }) as Observable<User[]>;
  }

  /**
   * Adiciona um novo usuário à sub-coleção da empresa.
   */
  addUser(empresaId: string, user: User) {
    const usuarioRef: DocumentReference<User> = doc(
      this.getUsuariosCollectionRef(empresaId), // Obtém a CollectionReference
      //idUser // Usa o authUid como ID do documento
    );
    
    // Observe que agora 'usuario' DEVE ter o authUid definido antes de chamar esta função
    return setDoc(usuarioRef, user);
  }

  /**
   * Atualiza um usuário específico em uma empresa específica.
   * A função original não usava o ID da empresa. Agora ela precisa.
   */
  updateUser(empresaId: string, userId: string, data: Partial<User>): Promise<void> {
    const usuarioRef: DocumentReference = doc(
      this.firestore,
      `empresas/${empresaId}/usuarios/${userId}`
    );
    return updateDoc(usuarioRef, data);
  }

  /**
   * Exclui um usuário da sub-coleção da empresa.
   */
  deleteUser(empresaId: string, userId: string): Promise<void> {
    const usuarioRef: DocumentReference = doc(
      this.firestore,
      `empresas/${empresaId}/usuarios/${userId}`
    );
    return deleteDoc(usuarioRef);
  }
}