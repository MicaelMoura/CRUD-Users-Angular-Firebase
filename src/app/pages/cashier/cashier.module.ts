import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Angular Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

// Componentes do Módulo Caixa
import { CashierComponent } from './cashier.component';
import { ModalEntradaComponent } from './entradas/modal-entrada.component';
import { ModalSaidaComponent } from './saidas/modal-saida.component';

// Definição das Rotas do Módulo Caixa
const routes: Routes = [
    {
        path: '',
        component: CashierComponent
    }
];

@NgModule({
    declarations: [
        CashierComponent,
        ModalEntradaComponent,
        ModalSaidaComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes), // Rotas específicas do módulo
        ReactiveFormsModule,
        FormsModule,
        
        // Módulos do Material
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatDialogModule,
        MatSnackBarModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule, 
        MatMomentDateModule 
    ],
    // Os modais não precisam ser exportados, mas os componentes de rotas sim.
    // Como este módulo é carregado via lazy loading, não é necessário exportar nada.
})
export class CaixaModule { }