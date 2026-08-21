import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Produto } from '../../interfaces/produto';

@Component({
  selector: 'app-pdv-product-card',
  templateUrl: './pdv-product-card.component.html',
  styleUrl: './pdv-product-card.component.scss',
  standalone: false,
})
export class PdvProductCardComponent {
  @Input({ required: true }) produto!: Produto;
  @Output() selectProduct = new EventEmitter<Produto>();
}
