import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { FirebaseError } from 'firebase/app';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { NAME_EMPRESA } from '../../constants';
import { UserAccess } from '../interfaces/user';
import { FirebaseService } from './firebase.service';

export type UserRole = UserAccess | null;

export const ACTIVE_TENANT_STORAGE_KEY = 'commercium.activeTenantId';
export const SYSTEM_TENANT_ID = NAME_EMPRESA.toLowerCase();

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUserUid = signal<string | null>(null);
  readonly userUid = this._currentUserUid.asReadonly();

  readonly isAuthenticated$: Observable<boolean> = toObservable(this.userUid).pipe(
    map((uid) => Boolean(uid)),
  );

  private readonly _activeTenantId = signal<string | null>(null);
  readonly activeTenantId = this._activeTenantId.asReadonly();

  private readonly _userRole = signal<UserRole>(null);
  readonly userRole = this._userRole.asReadonly();

  private authReadyResolved = false;
  private resolveAuthReady!: () => void;
  private readonly authReady = new Promise<void>((resolve) => {
    this.resolveAuthReady = resolve;
  });

  constructor(private firebase: FirebaseService) {
    onAuthStateChanged(this.firebase.auth, (user) => {
      void this.restoreAuthState(user);
    });
  }

  waitUntilReady(): Promise<void> {
    return this.authReady;
  }

  async loginForTenant(tenantInput: string, email: string, password: string): Promise<void> {
    const tenantId = this.normalizeTenantId(tenantInput);
    this.clearStoredTenant();

    try {
      const credential = await signInWithEmailAndPassword(this.firebase.auth, email, password);
      this._currentUserUid.set(credential.user.uid);
      await this.activateTenantForUser(tenantId, credential.user.uid, true);
    } catch (error: unknown) {
      await this.endRejectedSession();
      throw this.toAuthenticationError(error);
    }
  }

  async setActiveTenant(tenantInput: string): Promise<void> {
    const uid = this.userUid();
    if (!uid) {
      throw new Error('Usuário não autenticado.');
    }

    await this.activateTenantForUser(this.normalizeTenantId(tenantInput), uid, true);
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.firebase.auth);
    } finally {
      this.resetState();
    }
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.firebase.auth, email);
  }

  hasRole(...roles: UserAccess[]): boolean {
    const role = this.userRole();
    return role !== null && roles.includes(role);
  }

  isSystemAdmin(): boolean {
    return this.activeTenantId() === SYSTEM_TENANT_ID && this.userRole() === 'administrador';
  }

  private async restoreAuthState(user: FirebaseUser | null): Promise<void> {
    try {
      if (!user) {
        this.resetState();
        return;
      }

      this._currentUserUid.set(user.uid);
      const storedTenant = this.readStoredTenant();
      if (storedTenant) {
        try {
          await this.activateTenantForUser(storedTenant, user.uid, false);
        } catch {
          this.clearTenantState();
        }
      }
    } finally {
      if (!this.authReadyResolved) {
        this.authReadyResolved = true;
        this.resolveAuthReady();
      }
    }
  }

  private async activateTenantForUser(
    tenantId: string,
    uid: string,
    persist: boolean,
  ): Promise<void> {
    const membershipReference = doc(
      this.firebase.firestore,
      'business',
      tenantId,
      'users',
      uid,
    );
    const membership = await getDoc(membershipReference);

    if (!membership.exists()) {
      throw new Error('Usuário sem acesso à empresa informada.');
    }

    const membershipData = membership.data();
    const role = this.normalizeRole(membershipData['acesso'] ?? membershipData['perfilId']);
    if (!role) {
      throw new Error('O usuário não possui um papel válido nesta empresa.');
    }

    this._activeTenantId.set(tenantId);
    this._userRole.set(role);
    if (persist) {
      this.storeTenant(tenantId);
    }
  }

  private normalizeTenantId(value: string): string {
    const tenantId = value.trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,128}$/.test(tenantId)) {
      throw new Error('Identificador da empresa inválido.');
    }
    return tenantId;
  }

  private normalizeRole(value: unknown): UserAccess | null {
    return value === 'visitante' || value === 'usuario' || value === 'administrador'
      ? value
      : null;
  }

  private toAuthenticationError(error: unknown): Error {
    if (error instanceof Error && !(error instanceof FirebaseError)) {
      return error;
    }

    const code = error instanceof FirebaseError ? error.code : '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return new Error('E-mail ou senha inválidos.');
    }
    if (code === 'auth/too-many-requests') {
      return new Error('Acesso temporariamente bloqueado devido a muitas tentativas falhas.');
    }
    return new Error('Falha no login. Verifique suas credenciais e tente novamente.');
  }

  private async endRejectedSession(): Promise<void> {
    try {
      if (this.firebase.auth.currentUser) {
        await signOut(this.firebase.auth);
      }
    } finally {
      this.resetState();
    }
  }

  private resetState(): void {
    this._currentUserUid.set(null);
    this.clearTenantState();
  }

  private clearTenantState(): void {
    this._activeTenantId.set(null);
    this._userRole.set(null);
    this.clearStoredTenant();
  }

  private readStoredTenant(): string | null {
    return typeof sessionStorage === 'undefined'
      ? null
      : sessionStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
  }

  private storeTenant(tenantId: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
    }
  }

  private clearStoredTenant(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
    }
  }
}
