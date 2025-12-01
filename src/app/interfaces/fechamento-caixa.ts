export interface FechamentoCaixa {
  id?: string;
  empresaId: string;
  operadorUid: string; // Quem fez o fechamento
  
  // Período e Estado
  dataAbertura: Date | string; // Data/Hora do início do turno/dia
  dataFechamento: Date | string; // Data/Hora do fechamento
  status: 'ABERTO' | 'FECHADO';

  // Valores de Movimentação
  valorInicialTroco: number; // Suprimento inicial (Troco)
  totalSuprimentos: number; // Outros suprimentos
  totalSangrias: number; // Total de retiradas
  totalVendasDinheiro: number;
  totalVendasCartaoDebito: number;
  totalVendasCartaoCredito: number;
  totalVendasPix: number;
  totalOutrasEntradas: number; // Ex: Transferências
  
  // Cálculo de Conferência
  totalEntradasLiquidas: number; // (Vendas + Suprimentos)
  totalEsperado: number; // valorInicialTroco + totalEntradasLiquidas - totalSangrias
  valorContado: number; // Valor físico contado
  diferenca: number; // valorContado - totalEsperado (Sobra ou Falta)
  
  // Relatório
  observacoes?: string;
}