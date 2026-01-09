import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from '../services/authService/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // First check if we have a token
    if (!this.authService.getToken()) {
      this.router.navigate(['/login']);
      return of(false);
    }
    
    // Verify token validity with server
    return this.authService.checkAuth().pipe(
      map(response => {
        return true;
      }),
      catchError(error => {
        console.error('Auth guard check failed:', error);
        
        // If error 401/403, redirect to login
        // this.router.navigate(['/login']), { 
        //   queryParams: { returnUrl: state.url }
        // });
        return of(false);
      })
    );
  }
}