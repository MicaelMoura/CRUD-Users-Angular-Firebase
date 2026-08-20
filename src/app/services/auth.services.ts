import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop'; 
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { Empresas } from '../interfaces/empresas';
import {
    UserCredential,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

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
    public activeTenantId = this._activeTenantId.asReadonly();

    // PAPEL (ROLE) DO USUÁRIO NO TENANT ATIVO
    private _userRole = signal<UserRole>(null);
    public userRole = this._userRole.asReadonly();
    
    constructor(
        private firebase: FirebaseService,
    ) {
        // Observa mudanças no estado de autenticação (login/logout)
        onAuthStateChanged(this.firebase.auth, (user) => {
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
    
    // Define o Tenant ID ativo e busca o papel do usuário dentro desse Tenant.
    public async setActiveTenant(tenantId: string): Promise<void> {
        this._activeTenantId.set(tenantId);
        
        const uid = this.userUid();
        if (uid) {
            await this._fetchUserRole(tenantId, uid);
        } else {
            this._userRole.set(null);
        }
    }
    
    // Obtém o papel (role) do usuário logado na empresa ativa.
    private async _fetchUserRole(tenantId: string, uid: string): Promise<void> {
        try {
            const docRef = doc(this.firebase.firestore, 'business', tenantId, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
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
        const loginPromise = signInWithEmailAndPassword(this.firebase.auth, email, password);
        
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

    // Cria um novo usuário no Firebase Auth.
    registerUser(email: string, password: string): Promise<UserCredential> {
        return createUserWithEmailAndPassword(this.firebase.auth, email, password);
    }

    // Realiza o logout do usuário.
    logout(): Promise<void> {
        this._resetState();
        return signOut(this.firebase.auth);
    }

    async sendPasswordResetEmail(email: string): Promise<void> {
        try {
        await sendPasswordResetEmail(this.firebase.auth, email);
        } catch (error) {
        throw error;
        }
    }

    // public setPreLoginTenantId(tenantId: string | null): void {
    // // Apenas define o ID. Não carrega a role, pois o usuário ainda não está logado.
    //     this._activeTenantId.set(tenantId);
    // }

    public async getBusinessId(businessInput: string): Promise<string> {
        const docRef = doc(this.firebase.firestore, 'business', businessInput);

        console.log('Buscando empresa com ID:', businessInput);

        const docSnap = await getDoc(docRef);
        console.log('Buscando...');

        if (docSnap.exists()) {
            return docSnap.id; 
        } else {
            // Caso o documento não exista
            throw new Error(`Empresa '${businessInput}' não encontrada.`);
        }
    }

    public async setBusinessId(tenantId: string): Promise<void> {
        this._activeTenantId.set(tenantId);
        console.log('EmpresaId setado', tenantId);
        const uid = this.userUid();
        if (uid) {
            await this._fetchUserRole(tenantId, uid);
            //await this.loadTenantConfig();
        } else {
            this._userRole.set(null);
        }
    }
}
