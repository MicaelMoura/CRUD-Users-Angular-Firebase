import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private dataBaseStore: AngularFirestore) {}

  getAllUsers() {
    return this.dataBaseStore.collection('users', user => user.orderBy('nome')).valueChanges({idField: 'firebaseId'}) as Observable<any[]>;
  }

  addUser(user: User) {
    return this.dataBaseStore.collection('users').add(user);
  }

  updateUser(id: string, data: Partial<User>): Promise<void> {
      return this.dataBaseStore.doc(id).update(data);
  }

  deleteUser(userId: string) {
    return this.dataBaseStore.collection('users').doc(userId).delete();
  }
}
