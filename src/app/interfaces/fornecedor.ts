export interface Fornecedor {
    // ID do documento no Firestore (necessário para operações CRUD)
    id?: string; 

    // Dados principais
    razaoSocial: string;
    cnpj: string;
    email: string;
    telefone: string;
    representante: string;
    
    // Outros dados (opcional)
    observacoes?: string; 

    // ID da empresa à qual este fornecedor está vinculado (Multi-empresa)
    empresaid: string;
}