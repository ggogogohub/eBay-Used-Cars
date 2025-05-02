import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  isVerifying: boolean = true;
  isTokenValid: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Get token from URL query parameter
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (this.token) {
        this.verifyToken();
      } else {
        this.isVerifying = false;
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      }
    });
  }

  verifyToken() {
    this.isVerifying = true;
    this.errorMessage = '';

    this.authService.verifyResetToken(this.token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.isTokenValid = true;
      },
      error: (error) => {
        this.isVerifying = false;
        this.isTokenValid = false;
        const errorMsg = error.error?.error || 'Invalid or expired token. Please request a new password reset.';
        this.errorMessage = errorMsg;
        // Show error toast notification
        this.toastService.error(errorMsg);
      }
    });
  }

  resetPassword() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validate password
    if (!this.password || this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      this.isLoading = false;
      return;
    }

    // Validate password confirmation
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      this.isLoading = false;
      return;
    }

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Password reset successful!';

        // Show success toast notification
        this.toastService.success('Password reset successful! You can now log in.');

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.error || 'Failed to reset password. Please try again.';
        this.errorMessage = errorMsg;

        // Show error toast notification
        this.toastService.error(errorMsg);
      }
    });
  }
}
