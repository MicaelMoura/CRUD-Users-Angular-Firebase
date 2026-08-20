import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
// import { HomeComponent } from './pages/home/home.component';
import { UsersComponent } from './pages/users/users.component';
import { EmpresasComponent } from './pages/empresas/empresas.component';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { FornecedoresComponent } from './pages/fornecedores/fornecedores.component';
import { StockComponent } from './pages/stock/stock.component';
import { CashierComponent } from './pages/cashier/cashier.component';
import { SalesComponent } from './pages/sales/sales.component';
import { authGuard } from './guards/auth.guard';
import { authorizationGuard } from './guards/authorization.guard';

const tenantAccess = {
  canActivate: [authGuard, authorizationGuard],
  data: { roles: ['usuario', 'administrador'] },
};

const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'login', component: LoginComponent},
  {path: 'login/:business', component: LoginComponent },
  // {path: 'home', component: HomeComponent},
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [authGuard, authorizationGuard],
    data: { roles: ['administrador'] },
  },
  {
    path: 'empresas',
    component: EmpresasComponent,
    canActivate: [authGuard, authorizationGuard],
    data: { roles: ['administrador'], systemTenantOnly: true },
  },
  {path: 'produtos', component: ProdutosComponent, ...tenantAccess},
  {path: 'fornecedores', component: FornecedoresComponent, ...tenantAccess},
  {path: 'stock', component: StockComponent, ...tenantAccess},
  {path: 'cashier', component: CashierComponent, ...tenantAccess},
  {path: 'vendas', component: SalesComponent, ...tenantAccess},
  {path: '**', redirectTo: 'login'},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
