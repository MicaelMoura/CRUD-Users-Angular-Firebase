import { Component, EventEmitter, Input, Output } from '@angular/core';

export type PdvSearchMode = 'venda' | 'consulta';

@Component({
  selector: 'app-pdv-search-mode-toggle',
  templateUrl: './pdv-search-mode-toggle.component.html',
  styleUrl: './pdv-search-mode-toggle.component.scss',
  standalone: false,
})
export class PdvSearchModeToggleComponent {
  @Input() mode: PdvSearchMode = 'venda';
  @Output() modeChange = new EventEmitter<PdvSearchMode>();
}
