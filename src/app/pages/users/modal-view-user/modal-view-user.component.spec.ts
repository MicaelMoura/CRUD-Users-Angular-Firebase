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
        { provide: MAT_DIALOG_DATA, useValue: { nome: 'Usuário Teste', email: 'teste@example.com', perfilId: 'usuario' } },
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
});
