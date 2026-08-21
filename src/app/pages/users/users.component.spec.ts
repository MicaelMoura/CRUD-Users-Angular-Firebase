import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.services';
import { UsersService } from '../../services/users.service';
import { User } from '../../interfaces/user';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let usersService: jasmine.SpyObj<UsersService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let authService: { activeTenantId: () => string | null; userUid: () => string | null };
  let activeTenantId: string | null;

  const users: User[] = [
    { id: 'admin-1', nome: 'Ana Admin', email: 'ana@example.com', acesso: 'administrador' },
    { id: 'user-1', nome: 'Bruno User', email: 'bruno@example.com', acesso: 'usuario' },
  ];

  beforeEach(async () => {
    usersService = jasmine.createSpyObj<UsersService>('UsersService', ['getAllUsers', 'deleteUser']);
    usersService.getAllUsers.and.returnValue(of(users));
    usersService.deleteUser.and.resolveTo();
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    activeTenantId = 'tenant-test';
    authService = { activeTenantId: () => activeTenantId, userUid: () => 'admin-1' };

    await TestBed.configureTestingModule({
      imports: [
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSortModule,
        MatTableModule,
        NoopAnimationsModule,
      ],
      declarations: [UsersComponent],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']) },
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega somente os usuários do tenant ativo com IDs normalizados', () => {
    expect(usersService.getAllUsers).toHaveBeenCalledOnceWith('tenant-test');
    expect(component.dataSource.data).toEqual(users);
    expect(component.isLoading).toBeFalse();
  });

  it('abre o cadastro com o tenant ativo e sem lista de empresas', () => {
    dialog.open.and.returnValue({} as ReturnType<MatDialog['open']>);
    component.openModalAddUser();
    const config = dialog.open.calls.mostRecent().args[1];
    expect(config?.data).toEqual({ user: null, empresaId: 'tenant-test' });
    expect(Object.hasOwn(config?.data as object, 'empresas')).toBeFalse();
  });

  it('não permite iniciar a remoção do próprio acesso', () => {
    component.deleteUser(users[0]);
    expect(dialog.open).not.toHaveBeenCalled();
    expect(usersService.deleteUser).not.toHaveBeenCalled();
  });

  it('confirma e remove acesso usando o ID e tenant corretos', fakeAsync(() => {
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);
    component.deleteUser(users[1]);
    flushMicrotasks();
    expect(usersService.deleteUser).toHaveBeenCalledOnceWith('tenant-test', 'user-1');
  }));

  it('distingue lista filtrada e aplica o filtro sem recriar o data source', () => {
    const dataSource = component.dataSource;
    component.applyFilter({ target: { value: '  BRUNO ' } } as unknown as Event);
    expect(component.dataSource).toBe(dataSource);
    expect(component.dataSource.filter).toBe('bruno');
    expect(component.filterValue).toBe('BRUNO');
  });

  it('apresenta um estado de erro quando a consulta falha', () => {
    spyOn(console, 'error');
    usersService.getAllUsers.and.returnValue(throwError(() => new Error('falha de rede')));
    component.getListUsers('tenant-test');
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('Não foi possível carregar');
  });

  it('não consulta caminho vazio quando não há tenant ativo', () => {
    activeTenantId = null;
    usersService.getAllUsers.calls.reset();
    const noTenantFixture = TestBed.createComponent(UsersComponent);
    noTenantFixture.detectChanges();
    expect(usersService.getAllUsers).not.toHaveBeenCalled();
    expect(noTenantFixture.componentInstance.errorMessage).toContain('Nenhuma empresa ativa');
    noTenantFixture.destroy();
  });

  it('mantém o conteúdo fora da área ocupada pelo menu', () => {
    const menu = fixture.nativeElement.querySelector('app-menu') as HTMLElement;
    const page = fixture.nativeElement.querySelector('.users-page') as HTMLElement;
    page.style.transition = 'none';
    const desktop = window.innerWidth > 900;
    menu.style.cssText = desktop
      ? 'display:block;float:left;width:250px;height:800px'
      : 'display:block;float:none;width:100%;height:56px';
    if (desktop) {
      expect(getComputedStyle(page).marginLeft).toBe('250px');
      menu.classList.add('menu-collapsed');
      expect(getComputedStyle(page).marginLeft).toBe('74px');
    } else {
      expect(getComputedStyle(page).marginLeft).toBe('0px');
      expect(page.getBoundingClientRect().width)
        .toBeCloseTo((fixture.nativeElement as HTMLElement).getBoundingClientRect().width, 0);
    }
  });
});
