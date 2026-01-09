// src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/authService/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(): boolean {
    // Check if user is logged in and has admin role
    if (this.authService.isLoggedIn() && 
    (this.authService.getUserRole() === 'ADMIN' || this.authService.getUserRole() === 'SUPER_ADMIN')) {
      return true;
    }
    if (this.authService.isLoggedIn()) {
      // User is logged in but not admin
      this.router.navigate(['/products']);

    } else {
      // User not logged in
      this.router.navigate(['/login']);
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}