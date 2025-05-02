import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Auth0AuthService } from '../../services/auth0.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'auth',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  isLoginMode = true;
  loginData = {
    username: '',
    password: ''
  };
  registerData = {
    username: '',
    password: '',
    role: 'buyer' // Default role
  };
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showLoginPassword = false;
  showRegisterPassword = false;

  constructor(
    private authService: AuthService,
    private auth0Service: Auth0AuthService,
    private router: Router,
    private toastService: ToastService
  ) { }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin() {
    // Validate form
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    // Additional validation
    if (this.loginData.username.trim().length < 3) {
      this.errorMessage = 'Username must be at least 3 characters long';
      return;
    }

    if (this.loginData.password.trim().length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData.username, this.loginData.password).subscribe({
      next: () => {
        this.isLoading = false;
        // Show toast notification instead of success message
        this.toastService.success('Login successful!');
        // Navigate to home page after successful login
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;

        // Handle validation errors from backend
        let errorMsg = '';
        if (error.error?.errors) {
          const validationErrors = error.error.errors;
          if (validationErrors.username) {
            errorMsg = `Username error: ${validationErrors.username}`;
          } else if (validationErrors.password) {
            errorMsg = `Password error: ${validationErrors.password}`;
          } else {
            errorMsg = 'Validation error. Please check your input.';
          }
        } else {
          // Use the error message from the backend or a default message
          errorMsg = error.error?.message || 'Login failed. Please check your credentials.';
        }

        // Set the error message for display in the UI
        this.errorMessage = errorMsg;

        // Also show as a toast notification
        this.toastService.error(errorMsg);

        console.log('Login error message:', errorMsg);
      }
    });
  }

  onRegister() {
    // Validate form
    if (!this.registerData.username || !this.registerData.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    // Additional validation
    if (this.registerData.username.trim().length < 3) {
      this.errorMessage = 'Username must be at least 3 characters long';
      return;
    }

    if (this.registerData.password.trim().length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.isLoading = false;
        // Show toast notification
        this.toastService.success('Registration successful! You can now log in.');
        // Switch to login mode after successful registration
        setTimeout(() => {
          this.isLoginMode = true;
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;

        // Handle validation errors
        let errorMsg = '';
        if (error.error?.errors) {
          const validationErrors = error.error.errors;
          if (validationErrors.username) {
            errorMsg = `Username error: ${validationErrors.username}`;
          } else if (validationErrors.password) {
            errorMsg = `Password error: ${validationErrors.password}`;
          } else {
            errorMsg = 'Validation error. Please check your input.';
          }
        } else {
          // Use the error message from the backend or a default message
          errorMsg = error.error?.error || error.error?.message || 'Registration failed. Please try again.';
        }

        // Set the error message for display in the UI
        this.errorMessage = errorMsg;

        // Also show as a toast notification
        this.toastService.error(errorMsg);

        console.log('Registration error message:', errorMsg);
      }
    });
  }

  // Login with Google using Auth0
  loginWithGoogle() {
    console.log('Login with Google clicked');
    this.auth0Service.loginWithGoogle();
  }
}
