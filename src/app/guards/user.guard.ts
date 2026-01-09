import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/authService/auth.service';

@Injectable({
  providedIn: 'root'
})
export class userGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) { }
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const role = this.authService.getUserRole();
    const url = state.url;
    
    // Allow access to /products page for all users regardless of login status
    if (url.includes('/products')) {
      return true;
    }
    
    // Allow access if user is logged in with USER role
    if (this.authService.isLoggedIn() && role === 'USER') {
      return true;
    }
    
    // If not logged in, redirect to login page
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // If logged in but not as USER (i.e., as ADMIN), redirect to admin dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/admin/dashboard']);
      return false;
    }
    
    return false;
  }
}