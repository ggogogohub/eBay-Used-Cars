import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, tap, throwError, of } from 'rxjs';
import { TokenService } from './token.service';
import { ToastService } from './toast.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private authUrl = `${this.baseUrl}/auth`;
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private toastService: ToastService
  ) {
    // Initialize login state after a short delay to ensure TokenService is ready
    setTimeout(() => {
      try {
        const isAuthenticated = this.tokenService.isAuthenticated();
        this.isLoggedInSubject.next(isAuthenticated);
        console.log('Auth state initialized:', isAuthenticated);
      } catch (error) {
        console.error('Error initializing auth state:', error);
        // Default to logged out if there's an error
        this.isLoggedInSubject.next(false);
      }
    }, 100);

    // Set up periodic token check (every 5 minutes)
    // Increased from 1 minute to 5 minutes to reduce unnecessary checks with longer token lifetime
    setInterval(() => {
      try {
        this.checkTokenStatus();
      } catch (error) {
        console.error('Error checking token status:', error);
      }
    }, 300000);

    // Update login state when storage changes (for multi-tab support)
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' || event.key === 'access_token') {
        try {
          const isAuthenticated = this.tokenService.isAuthenticated();
          this.isLoggedInSubject.next(isAuthenticated);
        } catch (error) {
          console.error('Error updating auth state from storage event:', error);
        }
      }
    });
  }

  private hasToken(): boolean {
    return this.tokenService.isAuthenticated();
  }

  /**
   * Checks token status and updates login state
   */
  private checkTokenStatus(): void {
    try {
      const isAuthenticated = this.tokenService.isAuthenticated();
      this.isLoggedInSubject.next(isAuthenticated);

      // If authenticated, check if token is about to expire
      if (isAuthenticated) {
        try {
          const expirationTime = this.tokenService.getTokenExpirationTime();

          // If token is about to expire (less than 15 minutes), try to refresh it
          // Increased from 5 minutes to 15 minutes to ensure smoother experience with 4-hour tokens
          if (expirationTime < 900 && expirationTime > 0) {
            console.log(`Token will expire in ${expirationTime} seconds, refreshing...`);
            this.tokenService.refreshAccessToken().subscribe({
              next: () => console.log('Token refreshed successfully'),
              error: (error) => console.error('Error refreshing token:', error)
            });
          }
        } catch (error) {
          console.error('Error checking token expiration:', error);
        }
      }
    } catch (error) {
      console.error('Error in checkTokenStatus:', error);
      // Default to logged out if there's an error
      this.isLoggedInSubject.next(false);
    }
  }

  login(username: string, password: string): Observable<any> {
    // Trim username and password to handle whitespace
    username = username.trim();
    password = password.trim();

    // Create Basic Auth header
    const authHeader = 'Basic ' + btoa(username + ':' + password);
    console.log('Auth header (encoded):', authHeader);
    console.log('Username:', username);
    console.log('Password length:', password.length);

    const headers = new HttpHeaders({
      'Authorization': authHeader
    });

    console.log('Sending login request to:', `${this.baseUrl}/auth/login`);

    return this.http.get<any>(`${this.baseUrl}/auth/login`, { headers })
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          if (response && response.token) {
            // Store token and refresh token
            this.tokenService.saveToken(response.token, response.refreshToken);

            // Store user data
            this.tokenService.saveUserData({
              username: username,
              loginTime: new Date().toISOString()
            });

            // Update login state
            this.isLoggedInSubject.next(true);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.error);

          // Handle specific error cases
          if (error.status === 401) {
            return throwError(() => ({
              error: { message: 'Invalid username or password. Please try again.' }
            }));
          } else if (error.status === 404) {
            return throwError(() => ({
              error: { message: 'User not found. Please check your username or register a new account.' }
            }));
          } else if (error.status === 0) {
            // Network error
            return throwError(() => ({
              error: { message: 'Unable to connect to the server. Please check your internet connection.' }
            }));
          }

          return throwError(() => error);
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/register`, userData);
  }

  logout(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auth/logout`)
      .pipe(
        tap(() => {
          // Clear all tokens and auth data
          this.tokenService.clearTokens();
          this.isLoggedInSubject.next(false);
          // Show success toast notification
          this.toastService.success('Logged out successfully');
        }),
        catchError(error => {
          // Even if server logout fails, clear local tokens
          this.tokenService.clearTokens();
          this.isLoggedInSubject.next(false);
          // Show error toast notification
          this.toastService.error('Error during logout, but you have been logged out locally');
          return throwError(() => error);
        })
      );
  }

  isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  getProfile(): Observable<any> {
    // Only make the request if user is authenticated
    if (!this.isAuthenticated()) {
      console.log('Skipping profile request - user not authenticated');
      return of(null); // Return empty observable
    }
    return this.http.get<any>(`${this.baseUrl}/auth/profile`);
  }

  deleteAccount(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/auth/delete`)
      .pipe(
        tap(() => {
          this.tokenService.clearTokens();
          this.isLoggedInSubject.next(false);
        }),
        catchError(error => {
          // Don't clear tokens on error - only on success
          return throwError(() => error);
        })
      );
  }

  /**
   * Request a password reset email
   * @param email User's email address
   * @returns Observable with the response
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.authUrl}/request-password-reset`, { email })
      .pipe(
        catchError(error => {
          console.error('Password reset request error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Verify a password reset token
   * @param token Reset token
   * @returns Observable with the response
   */
  verifyResetToken(token: string): Observable<any> {
    return this.http.post(`${this.authUrl}/verify-reset-token`, { token })
      .pipe(
        catchError(error => {
          console.error('Token verification error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Reset password with token
   * @param token Reset token
   * @param password New password
   * @returns Observable with the response
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.authUrl}/reset-password`, { token, password })
      .pipe(
        catchError(error => {
          console.error('Password reset error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Change password while logged in
   * @param currentPassword User's current password
   * @param newPassword User's new password
   * @returns Observable with the response
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/change-password`, { current_password: currentPassword, new_password: newPassword })
      .pipe(
        tap(() => {
          // Show success toast notification
          this.toastService.success('Password changed successfully');
        }),
        catchError(error => {
          console.error('Password change error:', error);
          // Show error toast notification
          const errorMsg = error.error?.error || 'Failed to change password. Please try again.';
          this.toastService.error(errorMsg);
          return throwError(() => error);
        })
      );
  }
}
