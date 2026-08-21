import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { By } from '@angular/platform-browser';
import { SaleSummaryComponent } from './sale-summary.component';

describe('SaleSummaryComponent', () => {
  let fixture: ComponentFixture<SaleSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SaleSummaryComponent],
      imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SaleSummaryComponent);
    fixture.componentInstance.saleId = 'PDV-123456';
    fixture.detectChanges();
  });

  it('exibe o estado vazio e mantém a finalização desabilitada', () => {
    expect(fixture.nativeElement.textContent).toContain('Sua venda está vazia');

    const finalizeButton = fixture.debugElement.query(By.css('.finalize-button')).nativeElement as HTMLButtonElement;
    expect(finalizeButton.disabled).toBeTrue();
  });
});
