export interface Empresas {
    firebaseId: string,
    razaoSocial: string,
    nomeFantasia: string,
    cnpj: string,
    endereco: string,
    telefone: string,
    email: string
    cidade?: string,
    bairro?: string,
    cep?: string,
    complemento?: string
    emailAdmin: string; // E-mail inicial para o primeiro administrador
    senhaAdmin: string; // NOVO: Senha para criação do login
}