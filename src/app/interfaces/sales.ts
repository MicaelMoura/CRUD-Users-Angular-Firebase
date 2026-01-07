export interface ItemVenda {
  id?: string;
  produtoId: string;
  descricao: string;
  codigoBarras: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface Venda {
  id?: string;
  data: Date;
  itens: ItemVenda[];
  total: number;
  status: 'ABERTA' | 'CONCLUIDA' | 'CANCELADA';
}