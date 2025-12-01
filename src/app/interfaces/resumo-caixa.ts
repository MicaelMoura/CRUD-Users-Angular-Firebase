export interface ResumoCaixa {
  // Entradas
  totalVendasDinheiro: number;
  totalVendasCartaoDebito: number;
  totalVendasCartaoCredito: number;
  totalVendasPix: number;
  
  // Saídas (Despesas, Suprimentos e Sangrias)
  totalDespesas: number; 
  totalSuprimentos: number; // Entrada para troco
  totalSangrias: number; // Retirada de dinheiro
  
  // Total de Entradas e Saídas para auditoria
  totalGeralEntradas: number;
  totalGeralSaidas: number;
}