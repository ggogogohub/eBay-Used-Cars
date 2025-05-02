import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, throwError, switchMap, Observable, of, firstValueFrom } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { CsrfService } from '../services/csrf.service';
import { Auth0AuthService } from '../services/auth0.service';

function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const csrfService = inject(CsrfService);
  const auth0Service = inject(Auth0AuthService);

  // Skip profile requests if user is not authenticated
  if ((req.url.includes('/auth/profile') || req.url.includes('/api/user')) && 
      !isAuthenticated()) {
    console.log('Skipping profile request - user not authenticated');
    return of(new HttpResponse({ status: 200, body: null }));
  }

  // Skip token check for authentication endpoints
  if (req.url.includes('/auth/login') ||
      req.url.includes('/auth/register') ||
      req.url.includes('/auth/login-auth0') ||
      req.url.includes('/auth/refresh-token')) {
    return next(req);
  }

  // Check if Auth0 is in the process of authenticating
  // If so, and this is a profile request, delay it
  if ((req.url.includes('/auth/profile') || req.url.includes('/api/user')) &&
      localStorage.getItem('auth0Authenticating') === 'true') {
    console.log('Auth0 is authenticating, delaying profile request');

    // Check how long Auth0 has been authenticating
    const auth0AuthStartTime = localStorage.getItem('auth0AuthStartTime');
    if (auth0AuthStartTime) {
      const startTime = parseInt(auth0AuthStartTime, 10);
      const currentTime = Date.now();
      const authDuration = currentTime - startTime;

      // If it's been more than 30 seconds, clear the flag and proceed
      if (authDuration > 30000) {
        console.log('Auth0 authentication taking too long, clearing flag and proceeding');
        localStorage.removeItem('auth0Authenticating');
        localStorage.removeItem('auth0AuthStartTime');
        // Continue with the request
      } else {
        return throwError(() => new Error('Auth0 is still authenticating'));
      }
    } else {
      // Set the start time if it doesn't exist
      localStorage.setItem('auth0AuthStartTime', Date.now().toString());
      return throwError(() => new Error('Auth0 is still authenticating'));
    }
  }

  try {
    // Get the auth token
    const token = tokenService.getToken();

    // If no token exists, proceed with the original request
    if (!token) {
      return next(req);
    }

    try {
      // Check if token is about to expire (less than 15 minutes)
      // Increased from 5 minutes to 15 minutes to ensure smoother experience with 4-hour tokens
      const tokenExpirationTime = tokenService.getTokenExpirationTime();
      if (tokenExpirationTime > 0 && tokenExpirationTime < 900) {
        // Token is about to expire, try to refresh it
        return refreshTokenAndProceed(req, next, tokenService, router);
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      // Continue with the token we have
    }

    // Token is valid, add it to the request
    return addTokenAndProceed(req, next, token, tokenService, router);
  } catch (error) {
    console.error('Error in auth interceptor:', error);
    // If there's an error, proceed with the original request
    return next(req);
  }
};

/**
 * Refresh the token and then proceed with the request
 */
function refreshTokenAndProceed(req: any, next: any, tokenService: TokenService, router: Router): Observable<any> {
  return tokenService.refreshAccessToken().pipe(
    switchMap(() => {
      // Get the new token
      const newToken = tokenService.getToken();
      if (newToken) {
        // Token refreshed successfully, proceed with the request
        return addTokenAndProceed(req, next, newToken, tokenService, router);
      } else {
        // Failed to refresh token, proceed without token
        return next(req);
      }
    }),
    catchError(error => {
      console.error('Error refreshing token:', error);

      // If refresh fails and it's not an API call that can be anonymous, redirect to login
      if (!isAnonymousEndpoint(req.url)) {
        // Clear tokens
        tokenService.clearTokens();

        // Redirect to login page
        router.navigate(['/auth'], {
          queryParams: {
            error: 'Your session has expired. Please log in again.',
            returnUrl: window.location.pathname
          }
        });
      }

      // Continue with the original request (will likely fail with 401)
      return next(req);
    })
  );
}

/**
 * Add token to request and proceed
 */
function addTokenAndProceed(req: any, next: any, token: string, tokenService: TokenService, router: Router): Observable<any> {
  // Prepare headers
  let headers = req.headers.set('x-access-token', token);

  // Check if we have an Auth0 token for API calls
  const auth0Token = tokenService.getAuth0Token();
  if (auth0Token && (req.url.includes('/auth/profile') || req.url.includes('/api/user'))) {
    // For profile and user endpoints, use Auth0 token in Authorization header
    headers = headers.set('Authorization', `Bearer ${auth0Token}`);
  }

  // Add CSRF token for non-GET requests
  const csrfService = inject(CsrfService);
  const csrfToken = csrfService.getToken();
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
    headers = headers.set('X-CSRF-TOKEN', csrfToken);
  }

  // Add token to request headers
  const authReq = req.clone({ headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        // Check if this is a profile request that failed
        if (req.url.includes('/auth/profile') || req.url.includes('/api/user')) {
          console.warn('Profile/user request failed with 401, attempting token refresh');

          // Log token details for debugging
          const token = tokenService.getToken();
          console.log('Current token exists:', !!token);
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const expiresAt = payload.exp * 1000; // Convert to milliseconds
              const now = Date.now();
              console.log('Token expires in:', Math.floor((expiresAt - now) / 1000), 'seconds');
            } catch (e) {
              console.error('Error parsing token:', e);
            }
          }

          // Try to refresh the token for profile requests too
          return tokenService.refreshAccessToken().pipe(
            switchMap(() => {
              // Get the new token
              const newToken = tokenService.getToken();
              if (newToken) {
                console.log('Token refreshed successfully, retrying profile request');
                // Token refreshed successfully, retry the request
                const newHeaders = req.headers.set('x-access-token', newToken);
                const newAuthReq = req.clone({ headers: newHeaders });
                return next(newAuthReq);
              } else {
                console.warn('Token refresh failed, proceeding with error');
                return throwError(() => error);
              }
            }),
            catchError((refreshError) => {
              console.error('Error refreshing token for profile request:', refreshError);
              return throwError(() => error);
            })
          );
        }

        // Try to refresh the token
        return tokenService.refreshAccessToken().pipe(
          switchMap(() => {
            // Get the new token
            const newToken = tokenService.getToken();
            if (newToken) {
              // Token refreshed successfully, retry the request
              const newHeaders = req.headers.set('x-access-token', newToken);
              const newAuthReq = req.clone({ headers: newHeaders });
              return next(newAuthReq);
            } else {
              // Failed to refresh token, redirect to login
              tokenService.clearTokens();
              router.navigate(['/auth'], {
                queryParams: { error: 'Authentication failed. Please log in again.' }
              });
              return throwError(() => error);
            }
          }),
          catchError(() => {
            // If refresh fails, clear tokens and redirect to login
            tokenService.clearTokens();
            router.navigate(['/auth'], {
              queryParams: { error: 'Authentication failed. Please log in again.' }
            });
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
}

/**
 * Check if an endpoint can be accessed anonymously
 */
function isAnonymousEndpoint(url: string): boolean {
  const anonymousEndpoints = [
    '/auth/',
    '/listings',
    '/home',
    '/assets/',
    '/favicon.ico'
  ];

  return anonymousEndpoints.some(endpoint => url.includes(endpoint));
};
