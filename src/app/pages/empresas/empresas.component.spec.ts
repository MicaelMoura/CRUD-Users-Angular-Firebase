import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NEVER } from 'rxjs';

import { EmpresasComponent } from './empresas.component';
import { AuthService } from '../../services/auth.services';
import { EmpresasService } from '../../services/empresas.service';

describe('EmpresasComponent', () => {
  let component: EmpresasComponent;
  let fixture: ComponentFixture<EmpresasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmpresasComponent],
      providers: [
        { provide: MatDialog, useValue: jasmine.createSpyObj<MatDialog>('MatDialog', ['open']) },
        { provide: AuthService, useValue: { activeTenantId: () => 'tenant-test' } },
        { provide: EmpresasService, useValue: { getEmpresas: () => NEVER } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpresasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
