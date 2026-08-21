import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Produto } from '../../interfaces/produto';

@Component({
  selector: 'app-pdv-product-history',
  templateUrl: './pdv-product-history.component.html',
  styleUrl: './pdv-product-history.component.scss',
  standalone: false,
})
export class PdvProductHistoryComponent {
  @Input({ required: true }) title = '';
  @Input() products: Produto[] = [];

  @Output() closePanel = new EventEmitter<void>();
  @Output() selectProduct = new EventEmitter<Produto>();
}
