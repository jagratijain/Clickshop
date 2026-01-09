import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProductsComponent } from './components/user/products/products.component';
import { FormsModule } from '@angular/forms';
import { ProductDetailComponent } from './components/user/product-detail/product-detail.component';
import { CartComponent } from './components/user/cart-items/cart-items.component';
import { NavbarComponent } from './components/reusable/navbar/navbar.component';
import { OrdersComponent } from './components/user/orders/orders.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { AuthInterceptor } from './auth.interceptor';
import { ViewUsersComponent } from './components/admin/view-users/view-users.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminSidebarComponent } from './components/reusable/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './components/reusable/admin-header/admin-header.component';
import { AdminLayoutComponent } from './components/reusable/admin-layout/admin-layout.component';
import { ViewAdminsComponent } from './components/admin/view-admins/view-admins.component';
import { ViewProductsComponent } from './components/admin/view-products/view-products.component';
import { EditProductsComponent } from './components/admin/manage-products/edit-products.component';
import { OrderManageComponent } from './components/admin/order-manage/order-manage.component';
import { OrderDetailComponent } from './components/admin/order-detail/order-detail.component';
import { provideHotToastConfig } from '@ngxpert/hot-toast';
import { WishlistComponent } from './components/user/wishlist/wishlist.component';
import { RoleRedirectComponent } from './components/util/role-redirect/role-redirect.component';
import { GeminiAssistantComponent } from './components/util/gemini-assistant/gemini-assistant.component';
import { LucideAngularModule, Bot } from 'lucide-angular';
import { TokenInterceptorComponent } from './components/util/token-interceptor/token-interceptor.component';
import { OtpInputComponent } from './components/reusable/otp-input/otp-input.component';
import { HomeComponent } from './components/user/home/home.component';
import { FeaturedproductsComponent } from './components/user/featuredproducts/featuredproducts.component';
import { RecentproductsComponent } from './components/user/recentproducts/recentproducts.component';
import { ReportsComponent } from './components/admin/reports/reports.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ProductsComponent,
    ProductDetailComponent,
    CartComponent,
    NavbarComponent,
    OrdersComponent,
    ProfileComponent,
    ViewUsersComponent,
    AdminDashboardComponent,
    AdminSidebarComponent,
    AdminHeaderComponent,
    AdminLayoutComponent,
    ViewAdminsComponent,
    ViewProductsComponent,
    EditProductsComponent,
    OrderManageComponent,
    OrderDetailComponent,
    WishlistComponent,
    RoleRedirectComponent,
    GeminiAssistantComponent,
    TokenInterceptorComponent,
    OtpInputComponent,
    HomeComponent,
    FeaturedproductsComponent,
    RecentproductsComponent,
    ReportsComponent,

  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    LucideAngularModule.pick({Bot}),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideHotToastConfig({
      duration: 3000,
      position: 'top-center'
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
