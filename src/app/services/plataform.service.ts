import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Units } from '../interfaces/units';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PlataformService {
    
    
    constructor(
        private ngFirestore: AngularFirestore,
    ) {}

    public getUnits(): Observable<Units[]> {
        return this.ngFirestore
            .collection('plataform')
            .doc('vOyNkQyF32YgFkc1ijyy')
            .collection<Units>('Units')
            .valueChanges({ idField: 'id' }); 
    }
}