export interface CashFlow {
    id?: string; 
    tipo: 'ENTRADA' | 'SAÍDA';
    descricao: string;
    valor: number;
    dataMovimento: Date | any; 
    formaPagamento: string;
    entidadeId?: string | null; 
}