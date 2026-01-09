import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../../services/user/profile.service';
import { User } from '../../../models/User';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Password change
  showPasswordForm: boolean = false;
  passwordForm: FormGroup;
  passwordError: string = '';
  passwordSuccess: string = '';
  isChangingPassword: boolean = false;

  // Profile editing
  isEditing: boolean = false;
  profileForm: FormGroup;
  profileError: string = '';
  profileSuccess: string = '';
  isSubmitting: boolean = false;

  constructor(
    private userService: ProfileService,
    private fb: FormBuilder
  ) {
    // Initialize password form
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.checkPasswords });

    // Initialize profile form
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userService.getUserProfile().subscribe({
      next: (userData) => {
        this.user = userData;
        this.isLoading = false;
        console.log(this.user);
        
        // Initialize form with user data
        this.profileForm.patchValue({
          name: this.user.name,
          username: this.user.username,
          email: this.user.email,
          phone: this.user.phone || '',
          address: this.user.address || ''
        });
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load your profile information.';
        this.isLoading = false;
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
      this.passwordError = '';
      this.passwordSuccess = '';
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form with current user data if canceling edit
      this.profileForm.patchValue({
        name: this.user.name,
        username: this.user.username,
        email: this.user.email,
        phone: this.user.phone || '',
        address: this.user.address || ''
      });
      this.profileError = '';
      this.profileSuccess = '';
    }
  }

  checkPasswords(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notMatching: true };
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.errors?.['notMatching']) {
        this.passwordError = 'New passwords do not match.';
      } else {
        this.passwordError = 'Please fill all fields correctly.';
      }
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const oldPassword = this.passwordForm.get('oldPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;

    this.userService.changePassword(oldPassword, newPassword).subscribe({
      next: (response) => {
        // Force success message regardless of response format
        this.passwordSuccess = 'Password changed successfully!';
        this.isChangingPassword = false;
        setTimeout(() => {
          this.togglePasswordForm();
        }, 2000);
      },
      error: (error) => {
        // Check if this is a false error (password was actually changed)
        if (error.status === 200) {
          this.passwordSuccess = 'Password changed successfully!';
          setTimeout(() => {
            this.togglePasswordForm();
          }, 2000);
        } else {
          this.passwordError = error.error && typeof error.error === 'string' 
            ? error.error 
            : 'Failed to change password. Please try again.';
        }
        this.isChangingPassword = false;
      }
    });
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileError = 'Please fill all required fields correctly.';
      return;
    }

    this.isSubmitting = true;
    this.profileError = '';
    this.profileSuccess = '';

    const profileData = this.profileForm.value;

    this.userService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.profileSuccess = 'Profile updated successfully!';
        this.isSubmitting = false;
        setTimeout(() => {
          this.toggleEditMode();
          this.successMessage = 'Your profile has been updated.';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        }, 1500);
      },
      error: (error) => {
        this.profileError = error.error && typeof error.error === 'string'
          ? error.error
          : 'Failed to update profile. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
