import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { UsersComponent } from './pages/users/users.component';
import { EmpresasComponent } from './pages/empresas/empresas.component';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { FornecedoresComponent } from './pages/fornecedores/fornecedores.component';
import { StockComponent } from './pages/stock/stock.component';
import { CashierComponent } from './pages/cashier/cashier.component';
import { SalesComponent } from './pages/sales/sales.component';

const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'login', component: LoginComponent},
  {path: 'login/:business', component: LoginComponent },
  {path: 'home', component: HomeComponent},
  {path: 'users', component: UsersComponent},
  {path: 'empresas', component: EmpresasComponent},
  {path: 'produtos', component: ProdutosComponent},
  {path: 'fornecedores', component: FornecedoresComponent},
  {path: 'stock', component: StockComponent},
  {path: 'cashier', component: CashierComponent},
  {path: 'vendas', component: SalesComponent},

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
