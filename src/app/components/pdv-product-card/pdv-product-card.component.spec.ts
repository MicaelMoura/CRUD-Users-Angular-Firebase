import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Produto } from '../../interfaces/produto';
import { PdvProductCardComponent } from './pdv-product-card.component';

describe('PdvProductCardComponent', () => {
  let fixture: ComponentFixture<PdvProductCardComponent>;
  const produto: Produto = {
    firebaseId: 'produto-1',
    nome: 'Produto teste',
    marca: 'Marca',
    fornecedorId: 'fornecedor-1',
    fornecedorNome: 'Fornecedor',
    valorUnitarioCompra: 5,
    valorUnitarioVenda: 10,
    codigoDeBarras: '7891234567895',
    quantidadeMinima: 1,
    unidadeDeMedida: 'UN',
    pesoNoCodigo: false,
    ncm: '00000000',
    cfop: '5102',
    origem: 0,
    csosn: '102',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PdvProductCardComponent],
      imports: [CommonModule, MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PdvProductCardComponent);
    fixture.componentInstance.produto = produto;
    fixture.detectChanges();
  });

  it('retorna o produto selecionado ao clicar no card', () => {
    spyOn(fixture.componentInstance.selectProduct, 'emit');

    fixture.debugElement.query(By.css('button')).nativeElement.click();

    expect(fixture.componentInstance.selectProduct.emit).toHaveBeenCalledOnceWith(produto);
  });
});
