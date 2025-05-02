import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  requestPasswordReset() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.validateEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.isLoading = false;
      return;
    }

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'If your email is registered, you will receive a password reset link';
        // Show success toast notification
        this.toastService.success('Password reset link sent');
        this.email = ''; // Clear the form
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.error || 'Failed to request password reset. Please try again.';
        this.errorMessage = errorMsg;
        // Show error toast notification
        this.toastService.error(errorMsg);
      }
    });
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
