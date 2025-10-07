import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ButtonComponent } from './components/button/button.component';
import { LoginComponent } from './pages/login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './components/menu/menu.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AngularFireModule } from '@angular/fire/compat'; 
import { environment } from '../environments/environment';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { UsersComponent } from './pages/users/users.component';
import { ModalFormUserComponent } from './pages/users/modal-form-user/modal-form-user.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { EmpresasComponent } from './pages/empresas/empresas.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask  } from 'ngx-mask';
import { ModalEmpresasFormComponent} from './pages/empresas/modal-form-empresas/modal-form-empresas.component';
import { ModalViewEmpresasComponent} from './pages/empresas/modal-view-empresas/modal-view-empresas.component';
import { FornecedoresComponent } from './pages/fornecedores/fornecedores.component';
import { ModalFormFornecedorComponent } from './pages/fornecedores/modal-form/modal-form-fornecedor.component';
import { ModalViewFornecedorComponent } from './pages/fornecedores/modal-view/modal-view-fornecedor.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule} from '@angular/material/table';
import { MatSortModule} from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ModalViewUserComponent } from './pages/users/modal-view-user/modal-view-user.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';


@NgModule({
  declarations: [
    AppComponent,
    ButtonComponent,
    LoginComponent,
    HomeComponent,
    MenuComponent,
    UsersComponent,
    ModalViewUserComponent,
    ModalFormUserComponent,
    EmpresasComponent,
    ModalEmpresasFormComponent,
    ModalViewEmpresasComponent,
    FornecedoresComponent,
    ModalFormFornecedorComponent,
    ModalViewFornecedorComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSelectModule,
    MatIcon,
    MatCardModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    NoopAnimationsModule,
    NgxMaskDirective, 
    NgxMaskPipe, 
  ],
  providers: [
    provideFirebaseApp(() => initializeApp(
      {
        "projectId":"curso-angular-8e009",
        "appId":"1:1030430354633:web:4406e95e86574a7496f118",
        "storageBucket":"curso-angular-8e009.appspot.com",
        "apiKey":"AIzaSyBe5ZFIlFEbUqcIPDWLD8YKFozSEP4oAOM",
        "authDomain":"curso-angular-8e009.firebaseapp.com",
        "messagingSenderId":"1030430354633"
      }
    )),
    provideFirestore(() => getFirestore()),
    provideNgxMask(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
