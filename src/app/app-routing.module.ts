import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { UsersComponent } from './pages/users/users.component';
import { EmpresasComponent } from './pages/empresas/empresas.component';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { FornecedoresComponent } from './pages/fornecedores/fornecedores.component';

const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'login', component: LoginComponent},
  {path: 'login/:business', component: LoginComponent },
  {path: 'home', component: HomeComponent},
  {path: 'users', component: UsersComponent},
  {path: 'empresas', component: EmpresasComponent},
  {path: 'produtos', component: ProdutosComponent},
  {path: 'fornecedores', component: FornecedoresComponent},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
