import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProductsComponent } from './components/user/products/products.component';
import { ProductDetailComponent } from './components/user/product-detail/product-detail.component';
import { CartComponent } from './components/user/cart-items/cart-items.component';
import { OrdersComponent } from './components/user/orders/orders.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';
import { ViewUsersComponent } from './components/admin/view-users/view-users.component';
import { AdminGuard } from './guards/admin.guard';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { ViewAdminsComponent } from './components/admin/view-admins/view-admins.component';
import { ViewProductsComponent } from './components/admin/view-products/view-products.component';
import { EditProductsComponent } from './components/admin/manage-products/edit-products.component';
import { OrderManageComponent } from './components/admin/order-manage/order-manage.component';
import { OrderDetailComponent } from './components/admin/order-detail/order-detail.component';
import { WishlistComponent } from './components/user/wishlist/wishlist.component';
import { RoleRedirectComponent } from './components/util/role-redirect/role-redirect.component';
import { userGuard } from './guards/user.guard';
import { TokenInterceptorComponent } from './components/util/token-interceptor/token-interceptor.component';
import { HomeComponent } from './components/user/home/home.component';
import { FeaturedproductsComponent } from './components/user/featuredproducts/featuredproducts.component';
import { RecentproductsComponent } from './components/user/recentproducts/recentproducts.component';
import { ReportsComponent } from './components/admin/reports/reports.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: RoleRedirectComponent },
  { path: 'intercept', component: TokenInterceptorComponent },
  { path: 'register', component: RegisterComponent,},
  { path: 'products', component: ProductsComponent},
  { path: 'featured', component: FeaturedproductsComponent},
  { path: 'newlyadded', component: RecentproductsComponent},
  { path: 'product/:id', component: ProductDetailComponent},
  { path: 'home', component: HomeComponent},
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard, userGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard, userGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard, userGuard] },
  { path: 'wishlist', component: WishlistComponent, canActivate: [AuthGuard, userGuard] },
  
  // Admin route
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'viewusers', component: ViewUsersComponent },
      { path: 'viewadmins', component: ViewAdminsComponent },
      { path: 'viewproducts', component: ViewProductsComponent },
      { path: 'viewproducts/edit/:id', component: EditProductsComponent },
      { path: 'viewproducts/add', component: EditProductsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'vieworders', component: OrderManageComponent  },
      { path: 'vieworders/:id', component: OrderDetailComponent }
    ]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
