export type UserAccess = 'visitante' | 'usuario' | 'administrador';

export interface User {
    id?: string;
    nome: string;
    email: string;
    acesso: UserAccess;
    perfilId?: UserAccess;
}

export interface CreateUserInput {
    nome: string;
    email: string;
    senha: string;
    acesso: UserAccess;
}

export interface UpdateUserInput {
    nome: string;
    email: string;
    acesso: UserAccess;
}
