export interface Produto {
    firebaseId?: string; // ID do documento no Firestore
    
    // Campo obrigatório para a arquitetura Multi-Empresa
    empresaid: string;
    
    // Campos do Produto
    nome: string;
    marca: string;
    valorUnitarioCompra: number;
    valorUnitarioVenda: number;
    codigoDeBarras: string; // Pode ser string para lidar com zeros à esquerda
    quantidadeMinima: number;
    unidadeDeMedida: string; // Ex: UN, KG, L
}