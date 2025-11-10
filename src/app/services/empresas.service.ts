import { inject, Injectable } from '@angular/core';
import { Observable, switchAll } from 'rxjs';
import { Firestore, collection, doc, setDoc, DocumentReference, deleteDoc, CollectionReference, updateDoc,
} from '@angular/fire/firestore';
import { Empresas } from '../interfaces/empresas';
import { AuthService } from './auth.services';
import { User } from '../interfaces/user';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private authService: AuthService = inject(AuthService);
  private firestore: Firestore = inject(Firestore);

  constructor(private dataBaseStore: AngularFirestore) { }

  getEmpresas(): Observable<Empresas[]> { 
        // Usa valueChanges para obter um Observable do array de dados
        return this.dataBaseStore.collection<Empresas>('business')
            // O idField garante que o ID do documento seja incluído no objeto como 'firebaseId'
          .valueChanges({ idField: 'firebaseId' }); 
  }

  async addEmpresa(empresa: Empresas): Promise<string> {
    // 1. CRIA O USUÁRIO DE LOGIN NO FIREBASE AUTH (ANTES DO FIRESTORE)
    const authResult = await this.authService.registerUser(empresa.emailAdmin, empresa.senhaAdmin);
    const authUid = authResult.user.uid;

    // 2. Obtém uma referência de documento com um ID gerado automaticamente
    const newDocRef = doc(collection(this.firestore, 'business'));
    const empresaId = newDocRef.id;

    await setDoc(newDocRef, {
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
    });

    const usuarioRef: DocumentReference<User> = doc(
        this.getUsuariosCollectionRef(empresaId), // Obtém a CollectionReference
        authUid // Usa o authUid como ID do documento
    );

    // Usa o authUid obtido do Firebase Auth
    const primeiroAdmin: User = {
        nome: `Administrador de ${empresa.razaoSocial}`,
        email: empresa.emailAdmin,
        perfilId: '', // Role de administrador
        authUid: authUid, // Vínculo com o usuário de login
    };
    await setDoc(usuarioRef, primeiroAdmin);

    return empresaId;
  }

  // Adiciona o método para excluir uma empresa
  async deleteEmpresa(empresaId: string): Promise<void> {
    const empresaRef = doc(this.firestore, `business/${empresaId}`);
    await deleteDoc(empresaRef);
  }

  // Método para atualizar uma empresa
  async updateEmpresa(empresaId: string, empresa: Empresas): Promise<void> {
    const empresaRef = doc(this.firestore, `empresas`, empresaId);
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
      await updateDoc(empresaRef, businessPayload);
    } catch (error){
      console.error(`Erro ao atualizar empresa ${empresaId}:`, error);
      throw new Error(`Falha ao atualizar a empresa: ${error instanceof Error ? error.message : 'Erro desconhecido.'}`);
    }
  }

  private getUsuariosCollectionRef(empresaId: string): CollectionReference<User, User> {
        // Tipagem forte da CollectionReference para garantir que as funções CRUD usem o tipo Usuario
        return collection(this.firestore, `business/${empresaId}/users`) as CollectionReference<User, User>;
  }
}