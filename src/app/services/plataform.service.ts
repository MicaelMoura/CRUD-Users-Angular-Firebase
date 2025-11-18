import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Unit } from '../interfaces/units';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PlataformService {
    
    
    constructor(
        private ngFirestore: AngularFirestore,
    ) {}

    public getUnits(): Observable<Unit[]> {
        return this.ngFirestore
            .collection('plataform')
            .doc('vOyNkQyF32YgFkc1ijyy')
            .collection<Unit>('units')
            .valueChanges({ idField: 'id' }); 
    }
}