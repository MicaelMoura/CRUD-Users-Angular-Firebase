import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { collection } from 'firebase/firestore';
import { Unit } from '../interfaces/units';
import { Payment } from '../interfaces/payment';
import { collectionData$, FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class PlataformService {
  private readonly platformDocumentId = 'vOyNkQyF32YgFkc1ijyy';

  constructor(private firebase: FirebaseService) {}

  getUnits(): Observable<Unit[]> {
    const source = collection(this.firebase.firestore, 'plataform', this.platformDocumentId, 'units');
    return collectionData$<Unit>(source, 'id');
  }

  getPayments(): Observable<Payment[]> {
    const source = collection(this.firebase.firestore, 'plataform', this.platformDocumentId, 'payments');
    return collectionData$<Payment>(source, 'id');
  }
}
