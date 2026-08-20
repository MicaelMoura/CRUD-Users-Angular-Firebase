import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  EmpresaPersistidaInput,
  EmpresaProvisionamentoInput,
  Empresas,
} from '../interfaces/empresas';
import { collectionData$, FirebaseService } from './firebase.service';

export function buildEmpresaPersistidaPayload(
  empresa: EmpresaPersistidaInput,
): EmpresaPersistidaInput {
  return {
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia,
    cnpj: empresa.cnpj,
    endereco: empresa.endereco,
    telefone: empresa.telefone,
    email: empresa.email,
    cidade: empresa.cidade ?? '',
    bairro: empresa.bairro ?? '',
    cep: empresa.cep ?? '',
    complemento: empresa.complemento ?? '',
    emailAdmin: empresa.emailAdmin,
  };
}

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  constructor(private firebase: FirebaseService) {}

  getEmpresas(): Observable<Empresas[]> {
    return collectionData$<Empresas>(
      collection(this.firebase.firestore, 'business'),
      'firebaseId',
    );
  }

  async addEmpresa(empresa: EmpresaProvisionamentoInput): Promise<string> {
    const provisionarEmpresa = httpsCallable<
      EmpresaProvisionamentoInput,
      { empresaId: string }
    >(this.firebase.functions, 'provisionarEmpresa');
    const result = await provisionarEmpresa(empresa);
    return result.data.empresaId;
  }

  deleteEmpresa(empresaId: string): Promise<void> {
    return deleteDoc(doc(this.firebase.firestore, 'business', empresaId));
  }

  async updateEmpresa(empresaId: string, empresa: EmpresaPersistidaInput): Promise<void> {
    const businessPayload = buildEmpresaPersistidaPayload(empresa);

    try {
      await updateDoc(doc(this.firebase.firestore, 'business', empresaId), businessPayload);
    } catch (error) {
      console.error(`Erro ao atualizar empresa ${empresaId}:`, error);
      throw new Error(`Falha ao atualizar a empresa: ${error instanceof Error ? error.message : 'Erro desconhecido.'}`);
    }
  }
}
