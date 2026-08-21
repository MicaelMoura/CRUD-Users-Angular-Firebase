import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormaPagamento, ItemVenda, Venda } from '../../interfaces/sales';
import { ProdutosService } from '../../services/produtos.service';
import { AuthService } from '../../services/auth.services';
import { VendasService } from '../../services/sales.service';
import { CashFlowService } from '../../services/cashflow.service';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SalesModalComponent } from './sales-modal-finalizar-venda/sales-modal-finalizar.component';
import { debounceTime, distinctUntilChanged, firstValueFrom, Observable, of, switchMap } from 'rxjs';
import { Produto } from '../../interfaces/produto';
import { StockService } from '../../services/stock.service';
import { SalesModalCupomComponent } from './sales-modal-cupom/sales-modal-cupom.component';
import { UsersService } from '../../services/users.service';
import { ModalViewProdutoComponent } from '../produtos/modal-view/modal-view-produto.component';


@Component({
    selector: 'app-sales',
    templateUrl: './sales.component.html',
    styleUrls: ['./sales.component.scss'],
    standalone: false
})
export class SalesComponent implements OnInit {

  @ViewChild('productSearch') productSearch?: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (event.key === 'F2') {
      event.preventDefault();
      this.exibirPagamentoModal();
    } else if (event.key === 'F3') {
      event.preventDefault();
      this.limparVenda();
    }
  }

  searchControl = new FormControl('');
  produtosFiltrados$!: Observable<Produto[]>;
  produtosRecentes = signal<Produto[]>([]);
  historicoLeituras = signal<Produto[]>([]);
  painelHistorico = signal<'recentes' | 'historico' | null>(null);
  modoPesquisa = signal<'venda' | 'consulta'>('venda');
  idVenda = signal(this.gerarIdVenda());
  inicioVenda = signal(new Date());
  
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
  nomeOperador = 'Operador autenticado';
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
    private estoqueService: StockService,
    private usersService: UsersService,
  ) {
    this.vendaForm = this.fb.group({
      barcode: ['', [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(1)]]
    });
    this.filtraggemProdutos();
  }

  async ngOnInit(): Promise<void> {
    const empresaId = this.authService.activeTenantId();
    const userId = this.authService.userUid();
    if (!empresaId || !userId) {
      return;
    }

    try {
      const operador = await this.usersService.getUserById(empresaId, userId);
      this.nomeOperador = operador?.nome || this.nomeOperador;
    } catch (error: unknown) {
      console.error('Não foi possível carregar o operador do caixa.', error);
    }
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
    this.idVenda.set(this.gerarIdVenda());
    this.inicioVenda.set(new Date());

  }

  limparVenda(): void {
    if (this.itensVenda().length === 0) {
      this.snackBar.open('A venda já está vazia.', 'OK', { duration: 2200 });
      return;
    }

    this.limparPDV();
    this.snackBar.open('Venda limpa com sucesso.', 'OK', { duration: 2200 });
  }

  selecionarModoPesquisa(modo: 'venda' | 'consulta'): void {
    this.modoPesquisa.set(modo);
    this.painelHistorico.set(null);
    setTimeout(() => this.productSearch?.nativeElement.focus());
  }

  async processarBuscaAtual(event?: KeyboardEvent): Promise<void> {
    if (this.autocompleteTrigger?.panelOpen && this.autocompleteTrigger.activeOption) {
      return;
    }

    event?.preventDefault();
    const valor = this.searchControl.value?.trim() || '';
    const empresaId = this.authService.activeTenantId();
    if (!valor || !empresaId || this.carregando()) {
      return;
    }

    const { termo, quantidade } = this.extrairTermoEQuantidade(valor);
    this.carregando.set(true);

    try {
      let produto: Produto | null = null;
      let quantidadeFinal = quantidade;

      if (/^\d+$/.test(termo)) {
        const info = await this.processarCodigoBarras(termo);
        produto = info?.produto || null;
        if (produto && info?.isBalanca) {
          quantidadeFinal = produto.pesoNoCodigo
            ? info.quantidadeOuPeso
            : this.calculaPeso(info.quantidadeOuPeso, produto.valorUnitarioVenda);
        }
      } else {
        const produtos = await firstValueFrom(this.produtosService.buscarProdutosComEstoque(termo));
        produto = produtos[0] || null;
      }

      if (!produto) {
        this.snackBar.open('Produto não encontrado.', 'Fechar', { duration: 3000 });
        return;
      }

      this.executarAcaoProduto(produto, quantidadeFinal);
    } catch (error: unknown) {
      console.error('Não foi possível processar a pesquisa do produto.', error);
      this.snackBar.open('Não foi possível consultar o produto.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando.set(false);
    }
  }

  mostrarUltimosItens(): void {
    this.painelHistorico.set('recentes');
  }

  mostrarHistorico(): void {
    this.painelHistorico.set('historico');
  }

  fecharHistorico(): void {
    this.painelHistorico.set(null);
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
        
        this.executarAcaoProduto(produto, qtdFinal);
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
    if (!produto.firebaseId || !Number.isFinite(quantidade) || quantidade <= 0) {
      this.snackBar.open('Não foi possível adicionar o produto.', 'Fechar', { duration: 3000 });
      return;
    }

    const novoItem: ItemVenda = {
      produtoId: produto.firebaseId,
      descricao: produto.nome,
      codigoBarras: produto.codigoDeBarras,
      quantidade: quantidade,
      valorUnitario: produto.valorUnitarioVenda,
      subtotal: produto.valorUnitarioVenda * quantidade,
    };

    this.itensVenda.update((itens) => {
      const itemExistente = itens.find((item) => item.produtoId === novoItem.produtoId);
      if (!itemExistente) {
        return [novoItem, ...itens];
      }

      return itens.map((item) => item.produtoId === novoItem.produtoId
        ? {
            ...item,
            quantidade: item.quantidade + quantidade,
            subtotal: item.valorUnitario * (item.quantidade + quantidade),
          }
        : item);
    });

    this.historicoLeituras.update((produtos) => [produto, ...produtos]);
    this.produtosRecentes.update((produtos) => [
      produto,
      ...produtos.filter((item) => item.firebaseId !== produto.firebaseId),
    ].slice(0, 4));
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

    setTimeout(() => this.productSearch?.nativeElement.focus(), 100);
  }

  onFormaPagamentoChange(valor: any): void {
    console.log('Evento disparado no TS:', valor); 
    // Forçamos o tipo para garantir que o Signal aceite
    this.formaPagamento.set(valor as FormaPagamento);
  }

  onProdutoSelecionado(produto: Produto): void {
    if(!produto.firebaseId) return;
    const { quantidade } = this.extrairTermoEQuantidade(this.textoDigitadoBusca);
    this.executarAcaoProduto(produto, quantidade);
  }

  private executarAcaoProduto(produto: Produto, quantidade: number): void {
    if (this.modoPesquisa() === 'consulta') {
      this.dialog.open(ModalViewProdutoComponent, {
        data: produto,
        width: '620px',
        maxWidth: '94vw',
      });
    } else {
      this.adicionarItemAoCupom(produto, quantidade);
    }

    this.searchControl.setValue(''); 
    this.textoDigitadoBusca = '';
    setTimeout(() => this.productSearch?.nativeElement.focus());
  }

  private extrairTermoEQuantidade(valor: string): { termo: string; quantidade: number } {
    const partes = valor.trim().split(/x/i);
    if (partes.length > 1) {
      const quantidade = Number(partes[0]);
      if (Number.isFinite(quantidade) && quantidade > 0) {
        return { termo: partes.slice(1).join('x').trim(), quantidade };
      }
    }

    return { termo: valor.trim(), quantidade: 1 };
  }

  private gerarIdVenda(): string {
    const timestamp = Date.now().toString().slice(-6);
    return `PDV-${timestamp}`;
  }

  private perguntarImpressao(urlDanfe: string) {
    const snak = this.snackBar.open('NFC-e Autorizada!', 'IMPRIMIR', { duration: 10000 });
    
    snak.onAction().subscribe(() => {
      // Abre o PDF da SEFAZ em uma nova aba para impressão
      window.open(urlDanfe, '_blank');
    });
  }
}
