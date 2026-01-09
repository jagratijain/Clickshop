import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authService/auth.service';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;
  currentStep = 1;
  totalSteps = 4;
  otpVerified = false;
  isResendingOtp = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast:HotToastService
  ) {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email], [this.emailValidator()]],
      username: ['', [Validators.required, Validators.minLength(4)], [this.usernameValidator()]],

      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],

      contactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{6}(-\d{4})?$/)]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.loginCheck();
  }

  emailValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => this.authService.checkEmailExists(value)),
        map(response => response.exists ? { emailTaken: true } : null),
        catchError(() => of(null))
      );
    };
  }

  usernameValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => this.authService.checkUsernameExists(value)),
        map(response => response.exists ? { usernameTaken: true } : null),
        catchError(() => of(null))
      );
    };
  }

  loginCheck() {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getUserRole();
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/products']);
      }
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.validateStep1()) {
        this.currentStep++;
        this.sendOtp();
      }
    } else if (this.currentStep === 2) {
      if (this.otpVerified) {
        this.currentStep++;
      }
    } else if (this.currentStep === 3) {
      if (this.validateStep3()) {
        this.currentStep++;
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      if (this.currentStep === 2) {
        this.otpVerified = false;
      }
      this.currentStep--;
    }
  }

  validateStep1(): boolean {
    const nameControl = this.registerForm.get('name');
    const emailControl = this.registerForm.get('email');
    const usernameControl = this.registerForm.get('username');

    nameControl?.markAsTouched();
    emailControl?.markAsTouched();
    usernameControl?.markAsTouched();

    // Also check if async validation is pending
    return nameControl?.valid && emailControl?.valid && usernameControl?.valid && 
           !emailControl?.pending && !usernameControl?.pending ? true : false;
  }

  validateStep3(): boolean {
    const passwordControl = this.registerForm.get('password');
    const confirmPasswordControl = this.registerForm.get('confirmPassword');

    passwordControl?.markAsTouched();
    confirmPasswordControl?.markAsTouched();

    return passwordControl?.valid && confirmPasswordControl?.valid &&
      !this.registerForm.hasError('passwordMismatch') ? true : false;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const registerData = {
      name: this.registerForm.get('name')?.value,
      email: this.registerForm.get('email')?.value,
      username: this.registerForm.get('username')?.value,
      password: this.registerForm.get('password')?.value,
      contactNumber: this.registerForm.get('contactNumber')?.value,
      address: {
        addressLine1: this.registerForm.get('addressLine1')?.value,
        addressLine2: this.registerForm.get('addressLine2')?.value,
        city: this.registerForm.get('city')?.value,
        state: this.registerForm.get('state')?.value,
        zipCode: this.registerForm.get('zipCode')?.value
      }
    };

    this.authService.register(registerData).subscribe({
      next: (response: any) => {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          console.log(response);
          this.toast.success("You have been registered successfully, eager to serve you!")
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('userId', response.user.id);
            localStorage.setItem('role', response.user.role);
          }
          
          
        }
        
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error) => {
        console.log(error);
        this.isSubmitting = false;
        this.errorMessage = error.error || 'Registration failed. Please try again.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  getProgressPercentage(): number {
    return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
  }

  sendOtp() {
    const email = this.registerForm.get('email')?.value;
    const uname = this.registerForm.get('username')?.value;
    const name = this.registerForm.get('name')?.value;
    if (!email) return;
    if (!uname) return;
    if (!name) return;

    this.isResendingOtp = true;

    this.authService.sendOtp(email, name).subscribe({
      next: () => {
        this.isResendingOtp = false;
      },
      error: (error) => {
        console.error('Failed to send OTP:', error);
        this.isResendingOtp = false;
        this.errorMessage = 'Failed to send verification code. Please try again.';
      }
    });
  }

  handleOtpVerified(verified: boolean) {
    this.otpVerified = verified;
    if (verified) {
      this.currentStep++;
    }
  }

  handleResendOtp() {
    this.sendOtp();
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `${fieldName} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['email']) return 'Invalid email format';
    if (field.errors['pattern']) return 'Invalid phone number format';
    if (field.errors['emailTaken']) return 'Email is already registered';
    if (field.errors['usernameTaken']) return 'Username is already taken';
    
    return '';
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isFieldPending(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? field.pending : false;
  }

}
