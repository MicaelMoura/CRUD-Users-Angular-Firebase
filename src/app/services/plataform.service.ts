import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Unit } from '../interfaces/units';
import { Observable } from 'rxjs';
import { Payment } from '../interfaces/payment';

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

    public getPayments(): Observable<Payment[]> {
        return this.ngFirestore
            .collection('plataform')
            .doc('vOyNkQyF32YgFkc1ijyy')
            .collection<Payment>('payments')
            .valueChanges({ idField: 'id' }); 
    }
}