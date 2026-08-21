import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { collection, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { CreateUserInput, UpdateUserInput, User } from '../interfaces/user';
import { collectionData$, FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class UserAdminFunctionsClient {
  constructor(private firebase: FirebaseService) {}

  async provision(empresaId: string, user: CreateUserInput): Promise<string> {
    const callable = httpsCallable<
      CreateUserInput & { empresaId: string },
      { userId: string }
    >(this.firebase.functions, 'provisionarUsuario');
    const result = await callable({ empresaId, ...user });
    return result.data.userId;
  }

  async update(empresaId: string, userId: string, data: UpdateUserInput): Promise<void> {
    const callable = httpsCallable<
      UpdateUserInput & { empresaId: string; userId: string },
      { userId: string }
    >(this.firebase.functions, 'atualizarUsuario');
    await callable({ empresaId, userId, ...data });
  }

  async remove(empresaId: string, userId: string): Promise<void> {
    const callable = httpsCallable<
      { empresaId: string; userId: string },
      { userId: string }
    >(this.firebase.functions, 'removerAcessoUsuario');
    await callable({ empresaId, userId });
  }
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(
    private firebase: FirebaseService,
    private adminFunctions: UserAdminFunctionsClient,
  ) {}

  private collectionPath(empresaId: string) {
    return collection(this.firebase.firestore, 'business', empresaId, 'users');
  }

  getAllUsers(empresaId: string): Observable<User[]> {
    return collectionData$<User>(this.collectionPath(empresaId), 'id');
  }

  async getUserById(empresaId: string, userId: string): Promise<User | null> {
    const snapshot = await getDoc(doc(this.collectionPath(empresaId), userId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as User : null;
  }

  async addUser(empresaId: string, user: CreateUserInput): Promise<string> {
    return this.adminFunctions.provision(empresaId, user);
  }

  async updateUser(empresaId: string, userId: string, data: UpdateUserInput): Promise<void> {
    await this.adminFunctions.update(empresaId, userId, data);
  }

  async deleteUser(empresaId: string, userId: string): Promise<void> {
    await this.adminFunctions.remove(empresaId, userId);
  }
}
