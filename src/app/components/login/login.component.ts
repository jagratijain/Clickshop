import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/authService/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;
  returnUrl: string = '/home';

  ngOnInit(): void {
    this.loginCheck();

    
    
  }

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast:HotToastService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loginCheck(){
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getUserRole();
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/home']);
      }
    }
    
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;

    const loginData = {
      username: username,
      password: password
    };

    this.authService.login(loginData).subscribe({
      next: (response: any) => {

        // Check user status first
        if (response.status !== 'ACTIVE') {
          this.toast.error("Your account is currently inactive. Please contact our admin team.");
          return;
        }

        // Handle successful login
        console.log('Login success:', response);
        this.toast.success("Succesfully logged in")
        
        // Store user info if needed
        if (response.userId) {
          localStorage.setItem('userId', response.userId);
        }
        
        if (response.role) {
          localStorage.setItem('role', response.role);
        }
        
        // Navigate to the return URL or dashboard
        console.log(response.role === 'ADMIN' || response.role === 'SUPER_ADMIN');
        
        if (response.role === 'ADMIN' || response.role === 'SUPER_ADMIN') {
          console.log("true con");
          this.router.navigate(['/admin/dashboard']);
        } else {
          
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        this.toast.error(error.error?.message || "Login failed. Please try again")
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
  
  initiateGoogleLogin(): void {
    this.authService.getGoogleAuthUrl().subscribe({
      next: (response: any) => {
        window.location.href = response.authUrl;
      },
      error: (error) => {
        console.error('Failed to get Google auth URL', error);
      }
    });
  }
}