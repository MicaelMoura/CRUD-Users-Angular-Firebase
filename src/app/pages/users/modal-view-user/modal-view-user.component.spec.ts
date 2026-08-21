import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { ModalViewUserComponent } from './modal-view-user.component';

describe('ModalViewUserComponent', () => {
  let component: ModalViewUserComponent;
  let fixture: ComponentFixture<ModalViewUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule],
      declarations: [ModalViewUserComponent],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj<MatDialogRef<ModalViewUserComponent>>('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: { id: 'uid-test', nome: 'Usuário Teste', email: 'teste@example.com', acesso: 'usuario' } },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalViewUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exibe o perfil normalizado', () => {
    expect(component.accessLabel).toBe('Usuário');
  });
});
