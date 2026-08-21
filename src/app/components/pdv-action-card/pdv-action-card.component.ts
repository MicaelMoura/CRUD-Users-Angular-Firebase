import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pdv-action-card',
  templateUrl: './pdv-action-card.component.html',
  styleUrl: './pdv-action-card.component.scss',
  standalone: false,
})
export class PdvActionCardComponent {
  @Input({ required: true }) icon = '';
  @Input({ required: true }) label = '';
  @Input() disabled = false;

  @Output() action = new EventEmitter<void>();

  trigger(): void {
    if (!this.disabled) {
      this.action.emit();
    }
  }
}
