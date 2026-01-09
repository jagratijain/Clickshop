import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authService/auth.service';

@Component({
  selector: 'app-role-redirect',
  standalone: false,
  templateUrl: './role-redirect.component.html',
  styleUrl: './role-redirect.component.css'
})
export class RoleRedirectComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const role = this.authService.getUserRole();

    if (this.authService.isLoggedIn()) {
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/home']);
      }
    } else {
      this.router.navigate(['/home']);
    }
  }
}

