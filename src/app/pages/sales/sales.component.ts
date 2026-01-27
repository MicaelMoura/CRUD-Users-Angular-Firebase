import { Component, signal, computed } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormaPagamento, ItemVenda, Venda } from '../../interfaces/sales';
import { ProdutosService } from '../../services/produtos.service';
import { AuthService } from '../../services/auth.services';
import { VendasService } from '../../services/sales.service';
import { CashFlowService } from '../../services/cashflow.service';
import { HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SalesModalComponent } from './sales-modal-finalizar-venda/sales-modal-finalizar.component';
import { debounceTime, distinctUntilChanged, Observable, of, switchMap } from 'rxjs';
import { Produto } from '../../interfaces/produto';
import { StockService } from '../../services/stock.service';
import { SalesModalCupomComponent } from './sales-modal-cupom/sales-modal-cupom.component';


@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent {

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent) {
    // Atalho F2 para abrir o pagamento
    if (event.key === 'F2') {
      event.preventDefault();
      this.exibirPagamentoModal();
    }
  }

  searchControl = new FormControl('');
  produtosFiltrados$: Observable<Produto[]>;  
  
  vendaForm!: FormGroup;
  itensVenda = signal<ItemVenda[]>([]); // Lista de itens no cupom
  carregando = signal<boolean>(false);
  formaPagamento = signal<FormaPagamento>('dinheiro');
  valorRecebido = signal(0);
  exibirPagamento = signal(false);
  exibirCupomImpressao = signal(false);
  nomeEmpresa = 'Minha Empresa Ltda';
  enderecoEmpresa = 'Rua Exemplo, 123 - Cidade - Estado';
  telefoneEmpresa = '(00) 0000-0000';
  dataAtual = new Date();
  nomeOperador = 'Operador PDV';
  textoDigitadoBusca = '';

  totalVenda = computed(() => {
    return this.itensVenda().reduce((acc, item) => acc + item.subtotal, 0);
  });
  
  // Computados para exibição em tempo real
  subtotalGeral = computed(() => 
    this.itensVenda().reduce((acc, item) => acc + item.subtotal, 0)
  );

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private produtosService: ProdutosService,
    private authService: AuthService,
    private vendasService: VendasService,
    private cashFlowService: CashFlowService,
    private dialog: MatDialog,
    private estoqueService: StockService
  ) {
    this.vendaForm = this.fb.group({
      barcode: ['', [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(1)]]
    });
    this.filtraggemProdutos();
  }
  filtraggemProdutos() {
      this.produtosFiltrados$ = this.searchControl.valueChanges.pipe(
      debounceTime(300), // Aguarda 300ms após o utilizador parar de digitar
      distinctUntilChanged(),
      
      switchMap(valor => {
        if (typeof valor === 'string' && valor.length > 2) {
          let termoBusca = valor;
          if (valor.toLowerCase().includes('x')) {
            termoBusca = valor.split(/x|X/)[1] || '';
          }
          if (termoBusca.length < 2) return of([]);
          return this.produtosService.buscarProdutosComEstoque(termoBusca);
        } else {
          return [];
        }
      })
    );
  }

  validarCodigoDeBarras(codigo: string): boolean {
    console.log('Validando código de barras:', codigo);
    // 1. Verifica se o código tem 8, 12, 13 ou 14 dígitos e é apenas número
    if (!/^\d{8,14}$/.test(codigo) || ![8, 12, 13, 14].includes(codigo.length)) {
      return false;
    }

    // 2. Separa o dígito verificador (último número) do corpo do código
    const corpo = codigo.substring(0, codigo.length - 1);
    const digitoInformado = parseInt(codigo.charAt(codigo.length - 1));

    // 3. Inverte o corpo para começar a multiplicação da direita para a esquerda
    const corpoInvertido = corpo.split('').reverse();

    let soma = 0;
    for (let i = 0; i < corpoInvertido.length; i++) {
      // Pesos alternados: posições ímpares multiplicam por 3, pares por 1
      // (Considerando a contagem a partir da direita)
      const peso = (i % 2 === 0) ? 3 : 1;
      soma += parseInt(corpoInvertido[i]) * peso;
    }

    // 4. Calcula o dígito correto
    const resto = soma % 10;
    const digitoCalculado = (resto === 0) ? 0 : 10 - resto;
    console.log("terminou a validação codigo de barras");
    return digitoCalculado === digitoInformado;
  }

  exibirPagamentoModal(): void {
    if (this.itensVenda().length === 0) {
      this.snackBar.open('Adicione ao menos um produto.', 'OK', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(SalesModalComponent, {
      width: '450px',
      data: { total: this.subtotalGeral() },
      disableClose: true // Obriga o usuário a usar os botões
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // O usuário confirmou, agora setamos os sinais e finalizamos
        this.formaPagamento.set(result.formaPagamento);
        this.valorRecebido.set(result.valorRecebido);
        this.finalizarVenda();
      }
    });
  }

  abrirPagamento() {
    if (this.itensVenda().length === 0) return;
    this.exibirPagamento.set(true);
  }

  async finalizarVenda() {
    const empresaId = this.authService.activeTenantId();
    if (!empresaId) return;

    this.carregando.set(true);

    try {
      const novaVenda: Venda = {
        data: new Date(),
        itens: this.itensVenda(),
        total: this.subtotalGeral(),
        formaPagamento: this.formaPagamento(),
        status: 'CONCLUIDA'
      };

      // 1. Gerar Registro da Venda
      const vendaId = await this.vendasService.salvarVenda(empresaId, novaVenda);

      // // 2. Pergunta ao usuário se deseja emitir NFC-e (ou faz automático)
      // const emitirNf = confirm("Deseja emitir o Cupom Fiscal (NFC-e)?");

      // if (emitirNf) {
      //   this.snackBar.open('Comunicando com a SEFAZ...', 'Aguarde');
        
      //   // Aqui você chamaria sua API de emissão (Ex: FocusNFe, PlugNotas, etc)
      //   const retornoSefaz = await this.vendasService.emitirNfce(empresaId, vendaId, novaVenda);
        
      //   if (retornoSefaz.sucesso) {
      //     this.perguntarImpressao(retornoSefaz.urlDanfe);
      //   }
      // }

      //
      //3. Retirar do Estoque (Loop nos itens)
      for (const item of this.itensVenda()) {
        console.log('idProduto', item.produtoId);
        await this.estoqueService.diminuirEstoque(empresaId, item.produtoId, item.quantidade);
      }

      // 4. Gerar entrada no CashFlow
      await this.cashFlowService.addCashFlow(empresaId, {
        dataMovimento: new Date(),
        tipo: 'ENTRADA',
        descricao: `Venda PDV - Itens: ${this.itensVenda().length}`,
        valor: this.subtotalGeral(),
        formaPagamento: this.formaPagamento()
      });

      const dadosParaCupom = {
        empresaNome: 'Sua Loja LTDA',
        empresaEndereco: 'Rua das Flores, 123',
        itens: this.itensVenda(), // Pegando do seu Signal
        valorTotal: this.totalVenda(),
        formaPagamento: '' + this.formaPagamento(),
        dataHora: new Date(),
      };

      this.dialog.open(SalesModalCupomComponent, {
        data: dadosParaCupom,
        width: '350px',
        disableClose: true // Obriga o usuário a interagir ou fechar no botão
      }).afterClosed().subscribe(() => {
        this.limparPDV(); // Só limpa após fechar o cupom
      });

      this.snackBar.open('Venda finalizada com sucesso!', 'OK', { duration: 3000 });
      this.limparPDV();
    } catch (error) {
      console.error(error);
      this.snackBar.open('Erro ao finalizar venda.', 'Fechar');
    } finally {
      this.carregando.set(false);
    }
  }

  limparPDV() {
    this.itensVenda.set([]);
    this.exibirPagamento.set(false);
    this.valorRecebido.set(0);

    this.searchControl.setValue('');
    this.itensVenda.set([]); // Lista de itens no cupom
    this.carregando.set(false); 
    this.formaPagamento.set('dinheiro');
    this.valorRecebido.set(0);
    this.exibirPagamento.set(false);

  }

  /**
   * 💡 PASSO 1: Leitura de código de barras
   * Acionado ao dar 'Enter' no input ou pelo scanner.
   */
  async onBarcodeRead(): Promise<void> {
    let code = this.vendaForm.value.barcode;
    let qtd = this.vendaForm.value.quantidade;
    const empresaId = this.authService.activeTenantId(); // Obtendo ID da empresa ativa
    let partes = null;

    if (!code || !empresaId) return;
    if(code.includes('x')) {
      partes = code.split('x');
      if(partes[0] && !isNaN(partes[0])) qtd = partes[0];
    }

    if (!this.validarCodigoDeBarras(partes ? partes[1] : code)) {
      // Exibe a mensagem de erro
      this.snackBar.open('Dígito verificador do código de barras inválido!', 'Atenção', {
        duration: 3000,
        panelClass: ['error-snackbar'] // Estilo customizado
      });
      return;
    }

    const info = await this.processarCodigoBarras(partes ? partes[1] : code);
    if (!info) return;

    this.carregando.set(true);

    try {
      const produto = info.produto;

      if (produto) {
        let qtdFinal: number;
        if (info.isBalanca)
        {
          qtdFinal = produto.pesoNoCodigo ? info.quantidadeOuPeso : this.calculaPeso(info.quantidadeOuPeso, produto.valorUnitarioVenda);
        } else {
          qtdFinal = qtd;
        }
        
        this.adicionarItemAoCupom(produto, qtdFinal);
      } else {
        this.snackBar.open('Produto não encontrado!', 'Fechar', { duration: 3000 });
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      this.snackBar.open('Erro técnico ao buscar produto.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando.set(false);
      this.vendaForm.patchValue({ barcode: '', quantidade: 1 });
    }
  }
  calculaPeso(valorObtido: number, valorVendaProduto: number): number {
    let peso = valorObtido * 1000 / valorVendaProduto;
    let inteiro = peso / 1000
    let resultadoSextoDigito = inteiro.toString().substring(0, 6);
    return parseFloat(resultadoSextoDigito);
  }

  private adicionarItemAoCupom(produto: Produto, quantidade: number): void {
    const novoItem: ItemVenda = {
      produtoId: produto.firebaseId!,
      descricao: produto.nome, // Ajuste conforme seu campo de nome/descrição
      codigoBarras: produto.codigoDeBarras,
      quantidade: quantidade,
      valorUnitario: produto.valorUnitarioVenda,
      subtotal: produto.valorUnitarioVenda * quantidade,
    };

    // Adiciona ao topo da lista
    this.itensVenda.update(itens => [novoItem, ...itens]);
  }

  async processarCodigoBarras(codigoCompleto: string) {
    let produto = null;
    // Etiquetas de balança geralmente começam com '2' e têm 13 dígitos
    if (codigoCompleto.startsWith('2') && codigoCompleto.length === 13) {
      
      // Extrai o ID do produto (posições 1 a 6)
      // Ex: 2000050012501 -> ID do produto é 00005
      const codigoProduto = codigoCompleto.substring(1, 6).replace(/^0+/, '');

      produto = await this.produtosService.getProdutoByBarcode(this.authService.activeTenantId()!, codigoProduto);
      console.log('produto', produto);
      if(!produto) {
        console.log('codigo encontrado', codigoProduto);
        this.snackBar.open('Produto não encontrado!', 'Fechar', { duration: 3000 });
        return;
      }
      
      // Extrai o valor/peso (posições 7 a 12)
      // Ex: 01250 -> vira 1.250
      const valorBruto = codigoCompleto.substring(7, 12);
      // Divide por 1000 para 3 casas (peso) ou 100 para 2 (preço)
      let valorExtraido: number;
      if(!produto.pesoNoCodigo) {
        valorExtraido = parseFloat(valorBruto) / 100;
      } else {
        valorExtraido = parseFloat(valorBruto) / 1000; 
      }
      

      return {
        isBalanca: true,
        codigoBase: codigoProduto,
        quantidadeOuPeso: valorExtraido,
        produto: produto
      };
    }
    produto = await this.produtosService.getProdutoByBarcode(this.authService.activeTenantId()!, codigoCompleto);
    return { isBalanca: false, codigoBase: codigoCompleto, quantidadeOuPeso: 1, produto: produto };
  }
  
  removerItem(index: number): void {
    this.itensVenda.update(itens => {
      const novaLista = [...itens];
      novaLista.splice(index, 1);
      return novaLista;
    });
  }

  fecharPagamentoModal(): void {
    // 1. Esconde o modal
    this.exibirPagamento.set(false);

    // 2. Reseta o valor recebido e a forma de pagamento para o padrão
    this.valorRecebido.set(0);
    this.formaPagamento.set('dinheiro');

    // 3. Opcional: Devolve o foco para o campo de código de barras
    // Isso agiliza a retomada da venda sem precisar usar o mouse
    setTimeout(() => {
      const input = document.querySelector('input[formControlName="barcode"]') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }

  onFormaPagamentoChange(valor: any): void {
    console.log('Evento disparado no TS:', valor); 
    // Forçamos o tipo para garantir que o Signal aceite
    this.formaPagamento.set(valor as FormaPagamento);
  }

  onProdutoSelecionado(produto: Produto): void {
    if(!produto.firebaseId) return;
    let quantidade = 1;
    console.log('Texto digitado na busca:', this.textoDigitadoBusca);
    const partes = this.textoDigitadoBusca.toLowerCase().split('x');
    if (this.textoDigitadoBusca.toLowerCase().includes('x')) {
      const possivelQtd = Number(partes[0]);
      
      // Se o que vem antes do 'x' for um número válido, usamos ele
      if (!isNaN(possivelQtd) && possivelQtd > 0) {
        quantidade = possivelQtd;
      }
      console.log('Quantidade extraída do input:', quantidade);
    }
    this.adicionarItemAoCupom(produto, quantidade);
    this.searchControl.setValue(''); 
  }

  private perguntarImpressao(urlDanfe: string) {
    const snak = this.snackBar.open('NFC-e Autorizada!', 'IMPRIMIR', { duration: 10000 });
    
    snak.onAction().subscribe(() => {
      // Abre o PDF da SEFAZ em uma nova aba para impressão
      window.open(urlDanfe, '_blank');
    });
  }
}