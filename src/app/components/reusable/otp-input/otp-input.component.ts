import { Component, EventEmitter, Input, OnInit, Output, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/authService/auth.service';

@Component({
  selector: 'app-otp-input',
  standalone: false,
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.css'
})
export class OtpInputComponent implements OnInit, OnDestroy {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef>;
  @Input() email: string = '';
  @Output() otpVerified = new EventEmitter<boolean>();
  @Output() resendOtp = new EventEmitter<void>();
  
  otpForm: FormGroup;
  isVerifying = false;
  errorMessage = '';
  countdown = 0;
  countdownInterval: any;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.otpForm = this.formBuilder.group({
      digit1: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]]
    });
  }

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  onDigitInput(event: any, nextInput?: HTMLInputElement, prevInput?: HTMLInputElement): void {
    const value = event.target.value;
    
    if (value.length === 1 && nextInput) {
      nextInput.focus();
    }
    
    if (value.length === 0 && prevInput && event.key === 'Backspace') {
      prevInput.focus();
    }
    
    if (this.otpForm.valid) {
      this.verifyOtp();
    }
  }

  onKeyDown(event: KeyboardEvent, nextInput?: HTMLInputElement, prevInput?: HTMLInputElement): void {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (input.value === '' && prevInput) {
        prevInput.focus();
      }
    }
    
    if (event.key === 'ArrowRight' && nextInput) {
      nextInput.focus();
    }
    if (event.key === 'ArrowLeft' && prevInput) {
      prevInput.focus();
    }
    
    if (!/^\d$/.test(event.key) && 
        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    
    const pastedText = clipboardData.getData('text').trim();
    if (!pastedText.match(/^\d{6}$/)) return;
    
    const digits = pastedText.split('');
    
    this.otpForm.setValue({
      digit1: digits[0],
      digit2: digits[1],
      digit3: digits[2],
      digit4: digits[3],
      digit5: digits[4],
      digit6: digits[5]
    });
    
    if (this.otpForm.valid) {
      this.verifyOtp();
    }
  }

  getOtpValue(): string {
    return Object.values(this.otpForm.value).join('');
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;
    
    this.isVerifying = true;
    this.errorMessage = '';
    
    const otp = this.getOtpValue();
    
    this.authService.verifyOtp(this.email, otp).subscribe({
      next: (response: any) => {
        this.isVerifying = false;
        this.otpVerified.emit(true);
      },
      error: (error: any) => {
        this.isVerifying = false;
        this.errorMessage = error.error?.message || 'Invalid verification code. Please try again.';
      }
    });
  }

  handleResendOtp(): void {
    if (this.countdown > 0) return;
    
    this.otpForm.reset();
    this.errorMessage = ''
    this.resendOtp.emit();
    
    this.startCountdown();
  }

  startCountdown(): void {
    this.countdown = 60;
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }
}