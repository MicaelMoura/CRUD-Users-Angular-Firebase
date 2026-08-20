import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Empresas } from '../interfaces/empresas';
import { User } from '../interfaces/user';
import { AuthService } from './auth.services';
import { collectionData$, FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  constructor(
    private firebase: FirebaseService,
    private authService: AuthService,
  ) {}

  getEmpresas(): Observable<Empresas[]> {
    return collectionData$<Empresas>(
      collection(this.firebase.firestore, 'business'),
      'firebaseId',
    );
  }

  async addEmpresa(empresa: Empresas): Promise<string> {
    const authResult = await this.authService.registerUser(empresa.emailAdmin, empresa.senhaAdmin);
    const companyReference = doc(collection(this.firebase.firestore, 'business'));
    const empresaId = companyReference.id;

    await setDoc(companyReference, { ...empresa, firebaseId: empresaId });

    const empresaAdminUser: User = {
      id: authResult.user.uid,
      nome: empresa.nomeFantasia,
      email: empresa.emailAdmin,
      perfilId: 'perfil.id',
    };
    await setDoc(
      doc(this.firebase.firestore, 'business', empresaId, 'users', authResult.user.uid),
      empresaAdminUser,
    );

    return empresaId;
  }

  deleteEmpresa(empresaId: string): Promise<void> {
    return deleteDoc(doc(this.firebase.firestore, 'business', empresaId));
  }

  async updateEmpresa(empresaId: string, empresa: Empresas): Promise<void> {
    const businessPayload = {
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      endereco: empresa.endereco,
      telefone: empresa.telefone,
      email: empresa.email,
      cidade: empresa.cidade,
      bairro: empresa.bairro,
      cep: empresa.cep,
      complemento: empresa.complemento,
      emailAdmin: empresa.emailAdmin,
      senhaAdmin: empresa.senhaAdmin,
    };

    try {
      await updateDoc(doc(this.firebase.firestore, 'business', empresaId), businessPayload);
    } catch (error) {
      console.error(`Erro ao atualizar empresa ${empresaId}:`, error);
      throw new Error(`Falha ao atualizar a empresa: ${error instanceof Error ? error.message : 'Erro desconhecido.'}`);
    }
  }
}
