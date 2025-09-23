import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() textButton: string;
  @Input() size: string = 'auto';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled: boolean = false;

  @Output() buttonClick: EventEmitter<void> = new EventEmitter<void>();

  onClick() {
    this.buttonClick.emit();
  }
}
