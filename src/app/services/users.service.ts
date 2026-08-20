import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { User } from '../interfaces/user';
import { collectionData$, FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private firebase: FirebaseService) {}

  private collectionPath(empresaId: string) {
    return collection(this.firebase.firestore, 'business', empresaId, 'users');
  }

  getAllUsers(empresaId: string): Observable<User[]> {
    return collectionData$<User>(this.collectionPath(empresaId), 'id');
  }

  addUser(empresaId: string, user: User) {
    return addDoc(this.collectionPath(empresaId), user);
  }

  updateUser(empresaId: string, userId: string, data: Partial<User>): Promise<void> {
    return updateDoc(doc(this.collectionPath(empresaId), userId), data);
  }

  deleteUser(empresaId: string, userId: string): Promise<void> {
    return deleteDoc(doc(this.collectionPath(empresaId), userId));
  }
}
