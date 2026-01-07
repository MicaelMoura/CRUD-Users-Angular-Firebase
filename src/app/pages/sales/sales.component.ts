import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemVenda } from '../../interfaces/sales';
import { ProdutosService } from '../../services/produtos.service';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent implements OnInit {
  
  vendaForm!: FormGroup;
  itensVenda = signal<ItemVenda[]>([]); // Lista de itens no cupom
  carregando = signal<boolean>(false);
  
  // Computados para exibição em tempo real
  subtotalGeral = computed(() => 
    this.itensVenda().reduce((acc, item) => acc + item.subtotal, 0)
  );

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private produtosService: ProdutosService,
    private authService: AuthService
  ) {
    this.vendaForm = this.fb.group({
      barcode: ['', [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {}

  /**
   * 💡 PASSO 1: Leitura de código de barras
   * Acionado ao dar 'Enter' no input ou pelo scanner.
   */
  async onBarcodeRead(): Promise<void> {
    const code = this.vendaForm.value.barcode;
    const qtd = this.vendaForm.value.quantidade;
    const empresaId = this.authService.activeTenantId(); // Obtendo ID da empresa ativa

    if (!code || !empresaId) return;

    this.carregando.set(true);

    try {
      const produto = await this.produtosService.getProdutoByBarcode(empresaId, code);

      if (produto) {
        this.adicionarItemAoCupom(produto, qtd);
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

  private adicionarItemAoCupom(produto: any, quantidade: number): void {
    const novoItem: ItemVenda = {
      produtoId: produto.firebaseId,
      descricao: produto.nome, // Ajuste conforme seu campo de nome/descrição
      codigoBarras: produto.codigoDeBarras,
      quantidade: quantidade,
      valorUnitario: produto.valorUnitarioVenda, // Ajuste conforme seu campo de preço
      subtotal: produto.valorUnitarioVenda * quantidade
    };

    // Adiciona ao topo da lista
    this.itensVenda.update(itens => [novoItem, ...itens]);
  }
  
  removerItem(index: number): void {
    this.itensVenda.update(itens => {
      const novaLista = [...itens];
      novaLista.splice(index, 1);
      return novaLista;
    });
  }
}