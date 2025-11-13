import { inject, Injectable } from '@angular/core';
import { Observable, switchAll } from 'rxjs';
import { Firestore, collection, doc, setDoc, DocumentReference, deleteDoc, CollectionReference, updateDoc,
} from '@angular/fire/firestore';
import { Empresas } from '../interfaces/empresas';
import { AuthService } from './auth.services';
import { User } from '../interfaces/user';
import { Profile } from '../interfaces/Profile';
//import {profileService} from './profileService.services'
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {

  constructor(private dataBaseStore: AngularFirestore,
    private authService: AuthService,
    //private profileService:
  ) { }

  getEmpresas(): Observable<Empresas[]> { 
        // Usa valueChanges para obter um Observable do array de dados
        return this.dataBaseStore.collection<Empresas>('business')
            // O idField garante que o ID do documento seja incluído no objeto como 'firebaseId'
          .valueChanges({ idField: 'firebaseId' }); 
  }

  async addEmpresa(empresa: Empresas): Promise<string> {
    // 1. CRIA O USUÁRIO DE LOGIN NO FIREBASE AUTH (Antes do Firestore)
    const authResult = await this.authService.registerUser(empresa.emailAdmin, empresa.senhaAdmin);
    const authUid = authResult.user!.uid;

    // 2. Obtém uma referência de documento COM ID GERADO (Compat)
    const newDocRef = this.dataBaseStore.collection('business').ref.doc();
    const empresaId = newDocRef.id;

    // 3. Persiste a empresa no Firestore (Compat set)
    await newDocRef.set({ 
        ...empresa, 
        firebaseId: empresaId 
    });
    
    // 4. Cria o usuário administrador na sub-coleção (Compat set)
    const empresaAdminUser: User = {
      id: authUid,
      nome: empresa.nomeFantasia,
      email: empresa.emailAdmin,
      empresaId: empresaId,
      perfilId: 'perfil.id',
    };
    
    // 💡 Método auxiliar para a sub-coleção precisa ser refeito para Compat, 
    // mas vamos fazer a chamada direta aqui assumindo que você não usará a função auxiliar modular.
    await this.dataBaseStore
        .collection('business').doc(empresaId)
        .collection('users').doc(authUid).set(empresaAdminUser);
    
    return empresaId;
  }

  // Adiciona o método para excluir uma empresa
  async deleteEmpresa(empresaId: string): Promise<void> {
    return this.dataBaseStore.collection('business').doc(empresaId).delete();
  }

  // Método para atualizar uma empresa
  async updateEmpresa(empresaId: string, empresa: Empresas): Promise<void> {
    const businessPayload: any = {
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
      senhaAdmin: empresa.senhaAdmin
    }
    try{
      this.dataBaseStore.collection('business').doc(empresaId).update(businessPayload);  
    } catch (error){
      console.error(`Erro ao atualizar empresa ${empresaId}:`, error);
      throw new Error(`Falha ao atualizar a empresa: ${error instanceof Error ? error.message : 'Erro desconhecido.'}`);
    }
  }
}