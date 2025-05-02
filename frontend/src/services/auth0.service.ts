import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { ToastService } from './toast.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth0AuthService {
  private baseUrl = environment.apiUrl;
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private isInitialLogin = true; // Flag to track initial login

  // Add loading state to prevent premature profile requests
  private isAuthenticatingSubject = new BehaviorSubject<boolean>(false);
  isAuthenticating$ = this.isAuthenticatingSubject.asObservable();

  constructor(
    private auth0: Auth0Service,
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService,
    private toastService: ToastService
  ) {
    // Initialize auth state from stored token
    this.initializeAuthState();

    // Check if we're in a redirect callback scenario
    if (window.location.search.includes('code=')) {
      // Clear any stale state data
      localStorage.removeItem('auth0.state');

      // We're in a redirect callback scenario, handle it gracefully
      this.handleAuth0Redirect();
    }

    // Subscribe to Auth0 authentication state
    this.auth0.isAuthenticated$.subscribe(isAuthenticated => {
      this.isLoggedInSubject.next(isAuthenticated);
      console.log('Auth0 isAuthenticated:', isAuthenticated);

      // If authenticated with Auth0, get the user profile
      if (isAuthenticated) {
        // Check if we're on the auth page and redirect if needed
        if (window.location.pathname.includes('/auth')) {
          this.router.navigate(['/']);
        }

        // Only handle the user once to avoid multiple redirects
        if (this.isInitialLogin) {
          this.isInitialLogin = false; // Set flag to false immediately
          this.auth0.user$.subscribe(user => {
            if (user) {
              this.handleAuth0User(user);
            }
          });
        }
      }
    });
  }

  /**
   * Initialize authentication state from stored token
   */
  private initializeAuthState(): void {
    // Initialize with a short delay to ensure TokenService is ready
    setTimeout(() => {
      try {
        // Check if authenticated with TokenService
        if (this.tokenService.isAuthenticated()) {
          this.isLoggedInSubject.next(true);
        }
      } catch (error) {
        console.error('Error checking token authentication:', error);
      }

      // Also check Auth0 authentication state
      this.auth0.isAuthenticated$.subscribe({
        next: (isAuthenticated) => {
          console.log('Auth0 isAuthenticated:', isAuthenticated);

          if (isAuthenticated) {
            this.auth0.user$.subscribe({
              next: (user) => {
                if (user) {
                  try {
                    // If authenticated with Auth0 but not with our backend, handle the user
                    if (!this.tokenService.isAuthenticated()) {
                      this.handleAuth0User(user);
                    }
                  } catch (error) {
                    console.error('Error checking token authentication for Auth0 user:', error);
                    // Handle the user anyway if there's an error
                    this.handleAuth0User(user);
                  }
                }
              },
              error: (error) => console.error('Error getting Auth0 user:', error)
            });
          }
        },
        error: (error) => console.error('Error checking Auth0 authentication state:', error)
      });
    }, 100);
  }

  /**
   * Handle Auth0 redirect callback gracefully
   */
  private handleAuth0Redirect(): void {
    // Set authenticating state to true if not already set
    if (localStorage.getItem('auth0Authenticating') === 'true') {
      this.isAuthenticatingSubject.next(true);
    }

    // Clear the URL parameters to prevent repeated redirect processing
    const cleanUrl = window.location.origin + window.location.pathname;

    // First try to handle the redirect callback
    this.auth0.handleRedirectCallback().subscribe({
      next: (result) => {
        console.log('Auth0 redirect callback successful');
        // If we have a result, we've just been redirected from Auth0
        if (result) {
          // Keep the authenticating state true until we complete the backend login
          this.isAuthenticatingSubject.next(true);

          // Navigate to the target URL or home
          const targetUrl = result.appState?.target || '/';
          this.router.navigateByUrl(targetUrl);
        }

        // Clean up the URL
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, cleanUrl);
        }
      },
      error: (error) => {
        console.error('Error handling Auth0 redirect:', error);

        // Even if there's an error, we should clear the URL parameters
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, cleanUrl);
        }

        // Check if we're already authenticated despite the error
        this.auth0.isAuthenticated$.subscribe(isAuthenticated => {
          if (isAuthenticated) {
            console.log('Already authenticated with Auth0 despite redirect error');
            // Keep the authenticating state true
            this.isAuthenticatingSubject.next(true);

            // Get the user profile and proceed with login
            this.auth0.user$.subscribe(user => {
              if (user) {
                this.handleAuth0User(user);
              } else {
                // Reset authenticating state if no user
                this.isAuthenticatingSubject.next(false);
                localStorage.removeItem('auth0Authenticating');
              }
            });
          } else {
            // Reset authenticating state
            this.isAuthenticatingSubject.next(false);
            localStorage.removeItem('auth0Authenticating');

            // If not authenticated and we have an error, redirect to login page
            this.router.navigate(['/auth'], {
              queryParams: { error: 'Authentication failed. Please try again.' }
            });
          }
        });
      }
    });
  }

  // Login with Google via Auth0
  loginWithGoogle(returnUrl: string = '/'): void {
    // Set authenticating state to true
    this.isAuthenticatingSubject.next(true);

    // Reset the initial login flag when starting a new login
    this.isInitialLogin = true;

    // Check if we have a stored redirect URL
    const storedRedirectUrl = sessionStorage.getItem('redirectUrl');
    if (storedRedirectUrl) {
      returnUrl = storedRedirectUrl;
      // Clear it after reading
      sessionStorage.removeItem('redirectUrl');
    }

    // Clear any existing URL parameters to prevent issues with the redirect
    if (window.history && window.history.replaceState && window.location.search) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // Clear any stale state data
    localStorage.removeItem('auth0.state');

    // Store the current time to detect and handle stale redirects
    try {
      localStorage.setItem('auth0LoginAttempt', Date.now().toString());

      // Also store a flag indicating we're in the authentication process
      localStorage.setItem('auth0Authenticating', 'true');
      localStorage.setItem('auth0AuthStartTime', Date.now().toString());

      // Set a timeout to clear the flag after 30 seconds in case the callback doesn't happen
      setTimeout(() => {
        if (localStorage.getItem('auth0Authenticating') === 'true') {
          console.log('Auth0 authentication timeout reached, clearing flag');
          this.isAuthenticatingSubject.next(false);
          localStorage.removeItem('auth0Authenticating');
          localStorage.removeItem('auth0AuthStartTime');
        }
      }, 30000);
    } catch (e) {
      console.error('Error storing auth0 state:', e);
    }

    // Initiate the Auth0 login process
    try {
      this.auth0.loginWithRedirect({
        appState: {
          target: returnUrl,
          timestamp: Date.now(), // Add timestamp to detect stale redirects
          authenticating: true // Add flag to indicate we're authenticating
        },
        authorizationParams: {
          connection: 'google-oauth2',
          prompt: 'login',
          redirect_uri: window.location.origin // Use dynamic origin instead of hardcoded URL
        }
      });
    } catch (e) {
      console.error('Error initiating Auth0 login:', e);
      // Reset authenticating state
      this.isAuthenticatingSubject.next(false);
      localStorage.removeItem('auth0Authenticating');

      // Fallback to manual redirect if Auth0 SDK fails
      this.router.navigate(['/auth'], {
        queryParams: { error: 'Failed to initiate login. Please try again.' }
      });
    }
  }

  // Logout from Auth0
  logout(): void {
    console.log('Starting Auth0 logout process');

    // First, call our backend logout endpoint to invalidate the token
    this.http.get<any>(`${this.baseUrl}/auth/logout`).subscribe({
      next: () => {
        console.log('Backend logout successful');
        // Show success toast notification with longer duration (8 seconds)
        this.toastService.success('Logged out successfully', 8000);
      },
      error: (err) => {
        console.error('Backend logout failed, continuing with client-side logout:', err);
        // Show error toast notification with longer duration (8 seconds)
        this.toastService.error('Error during logout, please try again', 8000);
      },
      complete: () => {
        // Continue with client-side cleanup regardless of backend response
        this.completeLogout();
      }
    });
  }

  /**
   * Complete the logout process by clearing all client-side data and redirecting
   */
  private completeLogout(): void {
    // Clear all auth-related data
    this.tokenService.clearTokens();

    // Clear additional Auth0-specific data
    localStorage.removeItem('auth0LoginAttempt');
    sessionStorage.removeItem('redirectUrl');

    // Clear Auth0 state data
    localStorage.removeItem('auth0.state');
    localStorage.removeItem('auth0.is.authenticated');

    // Update login state
    this.isLoggedInSubject.next(false);

    try {
      // Logout from Auth0 without federated logout to avoid Google redirect
      this.auth0.logout({
        logoutParams: {
          returnTo: window.location.origin,
          // Remove federated: true to prevent Google redirect
        }
      });
    } catch (e) {
      console.error('Error during Auth0 logout:', e);
      // Even if Auth0 logout fails, force a full page reload to clear state
      window.location.href = '/';
    }
  }

  // Get access token from Auth0
  getAccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token') || !!localStorage.getItem('auth0Token');
  }

  // Get user profile from Auth0
  getProfile(): Observable<any> {
    // Only make the request if user is authenticated
    if (!this.isAuthenticated()) {
      console.log('Skipping Auth0 profile request - user not authenticated');
      return of(null);
    }
    return new Observable<any>(observer => {
      const subscription = this.auth0.user$.subscribe({
        next: (user) => observer.next(user),
        error: (err) => observer.error(err),
        complete: () => observer.complete()
      });

      return () => subscription.unsubscribe();
    });
  }

  // Handle Auth0 user - login with our backend
  private handleAuth0User(user: any): void {
    console.log('Auth0 user:', user);

    // Make sure we're in authenticating state
    this.isAuthenticatingSubject.next(true);

    // Validate user object
    if (!user || !user.sub || !user.email) {
      console.error('Invalid Auth0 user object:', user);
      this.isAuthenticatingSubject.next(false);
      localStorage.removeItem('auth0Authenticating');
      this.handleAuthError('Invalid user data received from Auth0');
      return;
    }

    // Get Auth0 token to include in backend request
    this.auth0.getAccessTokenSilently().subscribe({
      next: (auth0Token) => {
        // Check if we already have a valid token (to avoid duplicate logins)
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Verify token is still valid
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp > currentTime) {
              console.log('Already have a valid token, skipping backend login');
              this.isLoggedInSubject.next(true);
              // Reset authenticating state
              this.isAuthenticatingSubject.next(false);
              localStorage.removeItem('auth0Authenticating');
              return;
            } else {
              console.log('Existing token expired, proceeding with new login');
              localStorage.removeItem('token');
            }
          } catch (e) {
            console.error('Error parsing existing token:', e);
            localStorage.removeItem('token');
          }
        }

        // Check for login attempt timestamp to detect stale redirects
        const loginAttemptTime = localStorage.getItem('auth0LoginAttempt');
        if (loginAttemptTime) {
          const timeSinceLogin = Date.now() - parseInt(loginAttemptTime, 10);
          // If it's been more than 5 minutes, this might be a stale redirect
          if (timeSinceLogin > 5 * 60 * 1000) {
            console.warn('Potential stale Auth0 redirect detected');
          }
          // Clear the timestamp
          localStorage.removeItem('auth0LoginAttempt');
        }

        // Store Auth0 token for API calls
        this.tokenService.saveAuth0Token(auth0Token);

        // Proceed with backend login
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${auth0Token}`
        });

        console.log('Sending login request to backend with Auth0 token');
        this.http.post<any>(`${this.baseUrl}/auth/login-auth0`, {
          auth0_id: user.sub,
          email: user.email,
          name: user.name || user.email.split('@')[0] // Use part of email as name if not provided
        }, { headers }).subscribe({
          next: (response) => {
            if (response && response.token) {
              console.log('Successfully received token from backend');

              // Show success toast notification
              this.toastService.success('Login successful!');

              // Store token and refresh token
              this.tokenService.saveToken(response.token, response.refreshToken);

              // Store user data for token refresh
              const userData = {
                username: user.email, // Use email as username for Auth0 users
                auth0Id: user.sub,
                auth0Token: auth0Token, // Store Auth0 token for API calls
                loginTime: new Date().toISOString()
              };
              this.tokenService.saveUserData(userData);

              // Update login state
              this.isLoggedInSubject.next(true);

              // Reset authenticating state
              this.isAuthenticatingSubject.next(false);
              localStorage.removeItem('auth0Authenticating');

              // Log token expiration info
              try {
                const payload = JSON.parse(atob(response.token.split('.')[1]));
                const expiresAt = payload.exp * 1000; // Convert to milliseconds
                const expiresIn = Math.floor((expiresAt - Date.now()) / 1000 / 60); // Minutes
                console.log(`Auth0 token will expire in ${expiresIn} minutes`);
              } catch (e) {
                console.error('Error parsing token after Auth0 login:', e);
              }

              // Store a flag in localStorage to show toast after page reload
              localStorage.setItem('showLoginToast', 'true');

              // Force a page refresh to ensure all components recognize the authenticated state
              window.location.reload();
            } else {
              // Handle missing token case
              console.error('No token received from server');
              // Reset authenticating state
              this.isAuthenticatingSubject.next(false);
              localStorage.removeItem('auth0Authenticating');
              this.handleAuthError('Authentication failed: No token received');
            }
          },
          error: (error) => {
            console.error('Error logging in with Auth0:', error);
            // Reset authenticating state
            this.isAuthenticatingSubject.next(false);
            localStorage.removeItem('auth0Authenticating');

            // Add specific error handling based on error type
            if (error.status === 404) {
              this.handleAuthError('User not found. Please register first.');
            } else if (error.status === 401) {
              this.handleAuthError('Authentication failed. Invalid credentials.');
            } else if (error.status === 0) {
              // Network error
              this.handleAuthError('Unable to connect to the server. Please check your internet connection.');
            } else {
              this.handleAuthError(error.error?.message || 'Authentication failed. Please try again.');
            }
          }
        });
      },
      error: (error) => {
        console.error('Error getting Auth0 access token:', error);
        // Reset authenticating state
        this.isAuthenticatingSubject.next(false);
        localStorage.removeItem('auth0Authenticating');
        this.handleAuthError('Failed to get authentication token. Please try again.');
      }
    });
  }

  /**
   * Handles authentication errors by showing appropriate messages
   */
  private handleAuthError(message: string): void {
    // Reset login state
    this.isLoggedInSubject.next(false);

    // Show error toast notification with longer duration (8 seconds)
    this.toastService.error(message, 8000);

    // Navigate to auth page with error message
    this.router.navigate(['/auth'], {
      queryParams: { error: message }
    });
  }
}

