import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router'; 

import { toObservable } from '@angular/core/rxjs-interop'; 
import { Observable, from, map, of, catchError, throwError } from 'rxjs';
import { Empresas } from '../interfaces/empresas';

import { AngularFireAuth } from '@angular/fire/compat/auth'; 
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';

// Tipagem
export type UserRole = 'visitante' | 'usuario' | 'administrador' | null;

@Injectable({
    providedIn: 'root'
})
export class AuthService {
        
    // DADOS DO USUÁRIO AUTHENTICADO
    private _currentUserUid = signal<string | null>(null);
    public userUid = this._currentUserUid.asReadonly();
    
    // NOVO: Observable derivado do Signal userUid, que é o padrão usado pelo AuthGuard
    public isAuthenticated$: Observable<boolean> = toObservable(this.userUid).pipe(
        map(uid => !!uid)
    );
    
    // DADOS DO TENANT ATIVO
    private _activeTenantId = signal<string | null>(null);
    public activeTenantId = toObservable(this._activeTenantId);
    
    // PAPEL (ROLE) DO USUÁRIO NO TENANT ATIVO
    private _userRole = signal<UserRole>(null);
    public userRole = this._userRole.asReadonly();
    
    // ====================================================================
    // INICIALIZAÇÃO
    // ====================================================================

    constructor(
        private ngAuth: AngularFireAuth, // Use o AngularFireAuth (Compat)
        private ngFirestore: AngularFirestore, // Use o AngularFirestore (Compat)
        private router: Router
    ) {
        // Observa mudanças no estado de autenticação (login/logout)
        this.ngAuth.onAuthStateChanged((user) => {
            if (user) {
                this._currentUserUid.set(user.uid);
            } else {
                this._resetState();
            }
        });
    }

    private _resetState(): void {
        this._currentUserUid.set(null);
        this._activeTenantId.set(null);
        this._userRole.set(null);
    }
    
    // ====================================================================
    // MÉTODOS PÚBLICOS
    // ====================================================================
    
    /**
     * Define o Tenant ID ativo e busca o papel do usuário dentro desse Tenant.
     * @param tenantId O ID da empresa (tenant).
     */
    public async setActiveTenant(tenantId: string): Promise<void> {
        this._activeTenantId.set(tenantId);
        
        const uid = this.userUid();
        if (uid) {
            await this._fetchUserRole(tenantId, uid);
        } else {
            this._userRole.set(null);
        }
    }
    
    /**
     * Obtém o papel (role) do usuário logado na empresa ativa.
     * @param tenantId O ID da empresa.
     * @param uid O UID do Firebase Auth.
     */
    private async _fetchUserRole(tenantId: string, uid: string): Promise<void> {
        try {
            const docRef = this.ngFirestore
            .collection('business') // Acessa a coleção raiz
            .doc(tenantId)          // Acessa o documento da empresa
            .collection('users') // Acessa a sub-coleção de usuários
            .doc(uid);              // Acessa o documento do usuário (o usuário logado)

            // Obtém o valor do documento como uma Promise (requer .toPromise() no Compat)
            const docSnap = await docRef.get().toPromise();
            if (docSnap && docSnap.exists) {
                const data = docSnap.data();
                const role = data?.['acesso'] as UserRole;
                this._userRole.set(role || 'visitante');
            } else {
                this._userRole.set('visitante'); // Usuário autenticado, mas sem papel definido no tenant
            }
        } catch (error) {
            console.error('Erro ao buscar papel do usuário no Firestore:', error);
            this._userRole.set(null);
        }
    }
    
    /**
     * Realiza o login com email e senha.
     * Retorna o UID.
     */
    login(email: string, password: string): Observable<string> {
        const loginPromise = this.ngAuth.signInWithEmailAndPassword(email, password);
        
        return from(loginPromise).pipe(
            map(userCredential => userCredential.user!.uid), 
            catchError((error: any) => {
                console.error('Erro de Autenticação do Firebase:', error.code, error.message);

                let errorMessage = 'Falha no Login. Verifique suas credenciais.';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                    errorMessage = 'E-mail ou senha inválidos.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Acesso temporariamente bloqueado devido a muitas tentativas falhas.';
                }
                console.error('Erro tratado:', error.code); 
                return throwError(() => new Error(errorMessage));
            })
        );
    }

    /**
     * Cria um novo usuário no Firebase Auth. Usado pelo gerenciamento de usuários.
     */
    registerUser(email: string, password: string): Promise<firebase.auth.UserCredential> {
        return this.ngAuth.createUserWithEmailAndPassword(email, password);
    }

    /**
     * Realiza o logout do usuário.
     */
    logout(): Promise<void> {
        this._resetState();
        return this.ngAuth.signOut();
    }

    async sendPasswordResetEmail(email: string): Promise<void> {
        try {
        await this.ngAuth.sendPasswordResetEmail(email);
        } catch (error) {
        throw error;
        }
    }

    public setPreLoginTenantId(tenantId: string | null): void {
    // Apenas define o ID. Não carrega a role, pois o usuário ainda não está logado.
        this._activeTenantId.set(tenantId);
    }

    public async getBusinessId(businessInput: string): Promise<string> {
        const docRef = this.ngFirestore
        .collection('business')
        .doc<Empresas>(businessInput); 

        // 💡 Acessa o documento e espera a Promise
        const docSnap = await docRef.get().toPromise(); 

        if (docSnap && docSnap.exists) {
            // Retorna o ID do documento que foi encontrado no Firestore
            return docSnap.id; 
        } else {
            // Caso o documento não exista
            throw new Error(`Empresa '${businessInput}' não encontrada.`);
        }
    }

    public async setBusinessId(tenantId: string): Promise<void> {
        this._activeTenantId.set(tenantId);
        
        const uid = this.userUid();
        if (uid) {
            await this._fetchUserRole(tenantId, uid);
            //await this.loadTenantConfig();
        } else {
            this._userRole.set(null);
        }
    }
}