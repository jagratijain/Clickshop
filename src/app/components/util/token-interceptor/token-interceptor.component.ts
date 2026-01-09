import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-token-interceptor',
  standalone: false,
  templateUrl: './token-interceptor.component.html',
  styleUrl: './token-interceptor.component.css'
})
export class TokenInterceptorComponent implements OnInit{
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log('Received params:', params);
      
      const token = params['token'];
      const userId = params['userId'];
      const role = params['role'];
      const isAdmin = params['isAdmin'] === 'true';

      if (token) {
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('role', role);
        localStorage.setItem('isAdmin', String(isAdmin));
        
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500);
      } else {
        console.error('No token received');
        
        this.router.navigate(['/login'], { 
          queryParams: { error: 'auth_failed' } 
        });
      }
    });
  }
}
