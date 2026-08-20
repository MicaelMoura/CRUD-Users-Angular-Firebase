export type UserAccess = 'visitante' | 'usuario' | 'administrador';

export interface User {
    id?: string;
    firebaseId?: string;
    nome: string;
    email: string;
    acesso?: UserAccess;
    perfilId?: string;
}
