export interface Fornecedor {
    // ID do documento no Firestore (necessário para operações CRUD)
    id?: string; 

    // Dados principais
    corporate: string;
    fantasyName: string;
    cnpj: string;
    email: string;
    phone: string;
    salesRep: string;
    
    // Outros dados (opcional)
    observations?: string;
}