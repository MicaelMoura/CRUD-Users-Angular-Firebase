import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { PdvSearchModeToggleComponent } from './pdv-search-mode-toggle.component';

describe('PdvSearchModeToggleComponent', () => {
  let fixture: ComponentFixture<PdvSearchModeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PdvSearchModeToggleComponent],
      imports: [MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PdvSearchModeToggleComponent);
    fixture.detectChanges();
  });

  it('inicia no modo de venda e emite o modo consulta ao clicar na lupa', () => {
    spyOn(fixture.componentInstance.modeChange, 'emit');

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons[0].attributes['aria-pressed']).toBe('true');
    buttons[1].nativeElement.click();

    expect(fixture.componentInstance.modeChange.emit).toHaveBeenCalledOnceWith('consulta');
  });
});
