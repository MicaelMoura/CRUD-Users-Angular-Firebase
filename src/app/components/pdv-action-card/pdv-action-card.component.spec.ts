import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { PdvActionCardComponent } from './pdv-action-card.component';

describe('PdvActionCardComponent', () => {
  let fixture: ComponentFixture<PdvActionCardComponent>;
  let component: PdvActionCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PdvActionCardComponent],
      imports: [MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PdvActionCardComponent);
    component = fixture.componentInstance;
    component.icon = 'search';
    component.label = 'Consultar preço';
    fixture.detectChanges();
  });

  it('emite a ação ao clicar quando está habilitado', () => {
    spyOn(component.action, 'emit');

    fixture.debugElement.query(By.css('button')).nativeElement.click();

    expect(component.action.emit).toHaveBeenCalled();
  });

  it('não emite a ação quando está desabilitado', () => {
    spyOn(component.action, 'emit');
    component.disabled = true;
    fixture.detectChanges();

    fixture.debugElement.query(By.css('button')).nativeElement.click();

    expect(component.action.emit).not.toHaveBeenCalled();
  });
});
