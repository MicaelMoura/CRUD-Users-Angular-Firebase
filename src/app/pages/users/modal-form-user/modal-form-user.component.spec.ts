import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UsersService } from '../../../services/users.service';
import { ModalFormUserComponent, UserFormDialogData } from './modal-form-user.component';

describe('ModalFormUserComponent', () => {
  let fixture: ComponentFixture<ModalFormUserComponent>;
  let component: ModalFormUserComponent;
  let usersService: jasmine.SpyObj<UsersService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ModalFormUserComponent>>;

  async function configure(data: UserFormDialogData): Promise<void> {
    usersService = jasmine.createSpyObj<UsersService>('UsersService', ['addUser', 'updateUser']);
    usersService.addUser.and.resolveTo('new-user-id');
    usersService.updateUser.and.resolveTo();
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      declarations: [ModalFormUserComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: UsersService, useValue: usersService },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ModalFormUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('não possui campo de empresa e exige senha segura no cadastro', async () => {
    await configure({ user: null, empresaId: 'tenant-test' });
    expect(component.formUser.contains('empresaid')).toBeFalse();
    expect(fixture.nativeElement.querySelector('mat-select[formcontrolname="empresaid"]')).toBeNull();
    component.formUser.patchValue({ senha: 'curta', confirmarSenha: 'curta' });
    expect(component.formUser.invalid).toBeTrue();
  });

  it('rejeita senhas diferentes', async () => {
    await configure({ user: null, empresaId: 'tenant-test' });
    component.formUser.patchValue({ senha: 'senha-segura-123', confirmarSenha: 'outra-senha-456' });
    expect(component.formUser.hasError('passwordMismatch')).toBeTrue();
  });

  it('cadastra no tenant ativo com perfil e payload sem campos auxiliares', async () => {
    await configure({ user: null, empresaId: 'tenant-test' });
    component.formUser.setValue({
      nome: '  Maria Silva  ', email: 'MARIA@EXAMPLE.COM', acesso: 'usuario',
      senha: 'senha-segura-123', confirmarSenha: 'senha-segura-123',
    });
    await component.saveUser();
    expect(usersService.addUser).toHaveBeenCalledOnceWith('tenant-test', {
      nome: 'Maria Silva', email: 'maria@example.com', acesso: 'usuario', senha: 'senha-segura-123',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('edita pelo UID normalizado e sincroniza nome, e-mail e perfil', async () => {
    await configure({
      empresaId: 'tenant-test',
      user: { id: 'uid-123', nome: 'Maria', email: 'maria@example.com', acesso: 'usuario' },
    });
    component.formUser.patchValue({ nome: 'Maria Atualizada', email: 'nova@example.com', acesso: 'administrador' });
    await component.saveUser();
    expect(usersService.updateUser).toHaveBeenCalledOnceWith('tenant-test', 'uid-123', {
      nome: 'Maria Atualizada', email: 'nova@example.com', acesso: 'administrador',
    });
  });

  it('mantém o modal aberto e exibe o erro do backend', async () => {
    await configure({
      empresaId: 'tenant-test',
      user: { id: 'uid-123', nome: 'Maria', email: 'maria@example.com', acesso: 'usuario' },
    });
    spyOn(console, 'error');
    usersService.updateUser.and.rejectWith(new Error('Este e-mail já está cadastrado.'));
    await component.saveUser();
    expect(component.errorMessage).toBe('Este e-mail já está cadastrado.');
    expect(dialogRef.close).not.toHaveBeenCalledWith(true);
  });
});
