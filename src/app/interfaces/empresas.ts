export interface Empresas {
    firebaseId: string;
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
    cidade?: string;
    bairro?: string;
    cep?: string;
    complemento?: string;
    emailAdmin: string;
}

export type EmpresaPersistidaInput = Omit<Empresas, 'firebaseId'>;

/** A senha é transitória e nunca representa um documento do Firestore. */
export interface EmpresaProvisionamentoInput extends EmpresaPersistidaInput {
    senhaAdmin: string;
}
