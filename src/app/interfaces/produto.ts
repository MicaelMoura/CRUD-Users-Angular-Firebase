export interface Produto {
    firebaseId?: string; // ID do documento no Firestore
    
    // Campos do Produto
    nome: string;
    marca: string;
    fornecedorId: string;
    fornecedorNome: string;

    valorUnitarioCompra: number;
    valorUnitarioVenda: number;
    codigoDeBarras: string; // Pode ser string para lidar com zeros à esquerda
    quantidadeMinima: number;
    unidadeDeMedida: string; // Ex: UN, KG, L
    nomeUnidadeMedida?: string; // Ex: Unidade, Quilograma, Litro (usado para exibição)
    estoqueQtd?: number; // Quantidade em estoque, só é usado para trazer a quantidade na hora da busca

    // Nota fiscal
    ncm: string;
    cfop: string;
    origem: number;
    csosn: string;
}