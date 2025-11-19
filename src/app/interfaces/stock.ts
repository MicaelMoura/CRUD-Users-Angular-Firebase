export interface Stock {
    // ID gerado pelo Firestore, usado para identificação
    id?: string;
    
    // ID do produto selecionado
    produtoId: string;
    produtoNome:string;
    
    // ID do fornecedor
    fornecedorId: string;
    fornecedorNome: string;
    
    quantidade: number;
    
    validade: string; 
    
    // Tipo de movimento: 'ENTRADA' (para nova compra/lote) ou 'AJUSTE' (para perda/estrago)
    tipoMovimento: 'ENTRADA' | 'AJUSTE'; 
    motivoAjuste?: string; 
    
    // Data da criação/movimentação
    dataMovimento: Date; 
}