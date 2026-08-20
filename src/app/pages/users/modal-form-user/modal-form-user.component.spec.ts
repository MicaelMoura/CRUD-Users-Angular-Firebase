import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ModalFormUserComponent } from './modal-form-user.component';
import { UsersService } from '../../../services/users.service';

describe('ModalFormUserComponent', () => {
  let component: ModalFormUserComponent;
  let fixture: ComponentFixture<ModalFormUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
      ],
      declarations: [ModalFormUserComponent],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj<MatDialogRef<ModalFormUserComponent>>('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: { user: null, empresas: [] } },
        { provide: UsersService, useValue: jasmine.createSpyObj<UsersService>('UsersService', ['addUser', 'updateUser']) },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalFormUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
