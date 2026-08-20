import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EmpresasService } from '../../../services/empresas.service';
import {
  EmpresaDialogResult,
  ModalEmpresasFormComponent,
} from './modal-form-empresas.component';

describe('ModalEmpresasFormComponent', () => {
  let component: ModalEmpresasFormComponent;
  let fixture: ComponentFixture<ModalEmpresasFormComponent>;
  let empresasService: jasmine.SpyObj<EmpresasService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ModalEmpresasFormComponent, EmpresaDialogResult>>;

  beforeEach(async () => {
    empresasService = jasmine.createSpyObj<EmpresasService>('EmpresasService', [
      'addEmpresa',
      'updateEmpresa',
    ]);
    empresasService.addEmpresa.and.resolveTo('tenant-created');
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ModalEmpresasFormComponent],
      providers: [
        { provide: EmpresasService, useValue: empresasService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEmpresasFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exige e-mail e senha forte somente para provisionar uma nova empresa', () => {
    expect(component.formCompany.controls['emailAdmin'].hasError('required')).toBeTrue();
    expect(component.formCompany.controls['senhaAdmin'].hasError('required')).toBeTrue();

    component.formCompany.controls['senhaAdmin'].setValue('curta');

    expect(component.formCompany.controls['senhaAdmin'].hasError('minlength')).toBeTrue();
  });

  it('envia a senha somente para a callable de provisionamento', async () => {
    component.formCompany.patchValue({
      razaoSocial: 'Empresa Teste Ltda',
      nomeFantasia: 'Empresa Teste',
      cnpj: '00.000.000/0001-00',
      email: 'contato@example.com',
      telefone: '(00) 00000-0000',
      endereco: 'Rua Teste, 1',
      bairro: 'Centro',
      cidade: 'Cidade-UF',
      cep: '00000-000',
      complemento: '',
      emailAdmin: 'admin@example.com',
      senhaAdmin: 'senha-inicial-segura',
    });

    await component.saveCompany();

    expect(empresasService.addEmpresa).toHaveBeenCalledWith(jasmine.objectContaining({
      emailAdmin: 'admin@example.com',
      senhaAdmin: 'senha-inicial-segura',
    }));
    expect(dialogRef.close).toHaveBeenCalledOnceWith({
      changed: true,
      empresaId: 'tenant-created',
    });
  });
});
