import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ButtonComponent } from './components/button/button.component';
import { LoginComponent } from './pages/login/login.component';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './components/menu/menu.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AngularFireModule } from '@angular/fire/compat'; 
import { environment } from '../environments/environment';
//import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { UsersComponent } from './pages/users/users.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule} from '@angular/material/table';
import { MatSortModule} from '@angular/material/sort';
import { MatPaginatorModule} from '@angular/material/paginator';
import { ModalFormUserComponent } from './pages/users/modal-form-user/modal-form-user.component';

@NgModule({
  declarations: [
    AppComponent,
    ButtonComponent,
    LoginComponent,
    HomeComponent,
    MenuComponent,
    UsersComponent,
    ModalFormUserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
  ],
  providers: [
    //provideFirebaseApp(() => initializeApp({"projectId":"curso-angular-8e009","appId":"1:1030430354633:web:4406e95e86574a7496f118","storageBucket":"curso-angular-8e009.appspot.com","apiKey":"AIzaSyBe5ZFIlFEbUqcIPDWLD8YKFozSEP4oAOM","authDomain":"curso-angular-8e009.firebaseapp.com","messagingSenderId":"1030430354633"})),
    provideFirestore(() => getFirestore())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
