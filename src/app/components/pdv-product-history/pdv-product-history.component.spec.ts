import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { PdvProductHistoryComponent } from './pdv-product-history.component';

describe('PdvProductHistoryComponent', () => {
  let fixture: ComponentFixture<PdvProductHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PdvProductHistoryComponent],
      imports: [CommonModule, MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PdvProductHistoryComponent);
    fixture.componentInstance.title = 'Histórico de leituras';
    fixture.detectChanges();
  });

  it('informa o estado vazio e permite fechar o painel', () => {
    spyOn(fixture.componentInstance.closePanel, 'emit');
    expect(fixture.nativeElement.textContent).toContain('Nenhum produto foi adicionado');

    fixture.debugElement.query(By.css('header button')).nativeElement.click();

    expect(fixture.componentInstance.closePanel.emit).toHaveBeenCalled();
  });
});
