import { Injectable } from '@angular/core';
import { CookieService } from './cookie.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface TokenData {
  token: string;
  refreshToken?: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_DATA_KEY = 'user_data';
  private readonly AUTH0_TOKEN_KEY = 'auth0_token';
  private readonly baseUrl = environment.apiUrl;

  // In-memory token cache for better security
  private tokenCache: { [key: string]: any } = {};

  constructor(
    private cookieService: CookieService,
    private http: HttpClient
  ) {
    // Initialize the token cache
    this.initializeTokenCache();
  }

  /**
   * Initialize the token cache from storage
   */
  private initializeTokenCache(): void {
    try {
      // Try to get token from cookie
      const encryptedData = this.cookieService.getCookie(this.ACCESS_TOKEN_KEY);
      if (encryptedData) {
        try {
          const decryptedData = this.decrypt(encryptedData);
          const tokenData: TokenData = JSON.parse(decryptedData);
          this.tokenCache[this.ACCESS_TOKEN_KEY] = tokenData;
        } catch (e) {
          console.error('Error parsing token from cookie:', e);
        }
      }

      // For backward compatibility, check localStorage
      const token = localStorage.getItem('token');
      if (token && !this.tokenCache[this.ACCESS_TOKEN_KEY]) {
        try {
          // Parse token to get expiration
          const payload = this.parseToken(token);
          const tokenData: TokenData = {
            token,
            expiresAt: payload.exp
          };
          this.tokenCache[this.ACCESS_TOKEN_KEY] = tokenData;
        } catch (e) {
          console.error('Error parsing token from localStorage:', e);
        }
      }

      // Check for Auth0 token
      const auth0Token = localStorage.getItem('auth0Token');
      if (auth0Token) {
        this.tokenCache[this.AUTH0_TOKEN_KEY] = auth0Token;
      }

      // Check for user data
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          this.tokenCache[this.USER_DATA_KEY] = userData;
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }
    } catch (e) {
      console.error('Error initializing token cache:', e);
    }
  }

  /**
   * Save access token
   * @param token JWT token
   * @param refreshToken Optional refresh token
   */
  saveToken(token: string, refreshToken?: string): void {
    try {
      // Parse token to get expiration
      const payload = this.parseToken(token);
      const expiresAt = payload.exp;

      // Store token data
      const tokenData: TokenData = {
        token,
        refreshToken,
        expiresAt
      };

      // Store in memory
      this.tokenCache[this.ACCESS_TOKEN_KEY] = tokenData;

      // Store in cookie (for persistence across page refreshes)
      // We store only the encrypted version in the cookie
      // Store for 7 days to match the extended session duration
      const encryptedData = this.encrypt(JSON.stringify(tokenData));
      this.cookieService.setCookie(this.ACCESS_TOKEN_KEY, encryptedData, 7);

      // For backward compatibility, also store in localStorage
      // This will be removed in a future update
      localStorage.setItem('token', token);

      if (refreshToken) {
        // Store refresh token in a secure HTTP-only cookie (via backend)
        this.http.post(`${this.baseUrl}/auth/store-refresh-token`, { refreshToken })
          .subscribe({
            next: () => console.log('Refresh token stored securely'),
            error: (err) => console.error('Failed to store refresh token securely', err)
          });
      }
    } catch (error) {
      console.error('Error saving token', error);
    }
  }

  /**
   * Get the current access token
   * @returns The access token or null if not found
   */
  getToken(): string | null {
    try {
      // First try to get from memory cache
      if (this.tokenCache[this.ACCESS_TOKEN_KEY]) {
        try {
          const tokenData = this.tokenCache[this.ACCESS_TOKEN_KEY];
          if (this.isTokenValid(tokenData)) {
            return tokenData.token;
          } else {
            console.log('Token in memory cache is expired, attempting to refresh');
          }
        } catch (e) {
          console.error('Error validating token from cache:', e);
        }
      }

      // If not in memory, try to get from cookie
      try {
        const encryptedData = this.cookieService.getCookie(this.ACCESS_TOKEN_KEY);
        if (encryptedData) {
          try {
            const decryptedData = this.decrypt(encryptedData);
            const tokenData: TokenData = JSON.parse(decryptedData);

            // Store in memory for future use
            this.tokenCache[this.ACCESS_TOKEN_KEY] = tokenData;

            if (this.isTokenValid(tokenData)) {
              return tokenData.token;
            } else {
              console.log('Token in cookie is expired, attempting to refresh');
            }
          } catch (e) {
            console.error('Error parsing token from cookie:', e);
          }
        }
      } catch (e) {
        console.error('Error getting token from cookie:', e);
      }

      // For backward compatibility, try localStorage
      try {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Check if token is valid
            const payload = this.parseToken(token);
            if (payload.exp > Date.now() / 1000) {
              // Valid token, store it in memory cache for future use
              const tokenData: TokenData = {
                token,
                expiresAt: payload.exp
              };
              this.tokenCache[this.ACCESS_TOKEN_KEY] = tokenData;
              return token;
            } else {
              console.log('Token in localStorage is expired, attempting to refresh');
              // Remove expired token
              localStorage.removeItem('token');
            }
          } catch (e) {
            console.error('Error parsing token from localStorage:', e);
            // Remove invalid token
            localStorage.removeItem('token');
          }
        }
      } catch (e) {
        console.error('Error getting token from localStorage:', e);
      }

      console.log('No valid token found in any storage');
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Get the refresh token
   * @returns The refresh token or null if not found
   */
  getRefreshToken(): string | null {
    try {
      // First try to get from memory cache
      if (this.tokenCache[this.ACCESS_TOKEN_KEY]?.refreshToken) {
        return this.tokenCache[this.ACCESS_TOKEN_KEY].refreshToken;
      }

      // If not in memory, try to get from cookie
      const encryptedData = this.cookieService.getCookie(this.ACCESS_TOKEN_KEY);
      if (encryptedData) {
        const decryptedData = this.decrypt(encryptedData);
        const tokenData: TokenData = JSON.parse(decryptedData);
        return tokenData.refreshToken || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting refresh token', error);
      return null;
    }
  }

  /**
   * Clear all tokens and authentication data
   */
  clearTokens(): void {
    // Clear memory cache
    this.tokenCache = {};

    // Clear all auth-related cookies using the enhanced method
    this.cookieService.clearAllAuthCookies();

    // Clear localStorage (for backward compatibility and to be thorough)
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('auth0Token');

    // Clear any other potential auth-related items from localStorage
    const authRelatedKeys = ['auth', 'token', 'user', 'session', 'login'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && authRelatedKeys.some(prefix => key.includes(prefix))) {
        localStorage.removeItem(key);
      }
    }

    // Clear sessionStorage as well
    sessionStorage.removeItem('auth0.is.authenticated');
    sessionStorage.removeItem('redirectUrl');

    // Clear refresh token from server
    this.http.post(`${this.baseUrl}/auth/clear-refresh-token`, {})
      .subscribe({
        next: () => console.log('Refresh token cleared from server'),
        error: (err) => console.error('Failed to clear refresh token from server', err)
      });

    console.log('All tokens and authentication data cleared');
  }

  /**
   * Check if the current token is valid
   * @returns True if token is valid, false otherwise
   */
  isAuthenticated(): boolean {
    try {
      const token = this.getToken();
      if (!token) return false;

      try {
        const payload = this.parseToken(token);
        return payload.exp > Date.now() / 1000;
      } catch (error) {
        console.error('Error parsing token during authentication check:', error);
        return false;
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get time until token expiration in seconds
   * @returns Seconds until expiration or 0 if token is invalid
   */
  getTokenExpirationTime(): number {
    try {
      const token = this.getToken();
      if (!token) return 0;

      try {
        const payload = this.parseToken(token);
        const expiresAt = payload.exp;
        const now = Date.now() / 1000;
        return Math.max(0, expiresAt - now);
      } catch (error) {
        console.error('Error parsing token for expiration time:', error);
        return 0;
      }
    } catch (error) {
      console.error('Error getting token expiration time:', error);
      return 0;
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @returns Observable with the new token or error
   */
  refreshAccessToken(): Observable<any> {
    console.log('Attempting to refresh access token');
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      console.warn('No refresh token available, cannot refresh access token');
      return throwError(() => new Error('No refresh token available'));
    }

    // Get user data to handle legacy tokens
    const userData = this.getUserData();
    const username = userData?.username;

    // Prepare request data
    const requestData: any = { refreshToken };

    // Add username for legacy token support
    if (username) {
      requestData.username = username;
      console.log('Including username in refresh token request for legacy support');
    }

    console.log('Sending refresh token request to server');
    return this.http.post<any>(`${this.baseUrl}/auth/refresh-token`, requestData)
      .pipe(
        tap(response => {
          if (response && response.token) {
            console.log('Successfully refreshed access token');
            this.saveToken(response.token, response.refreshToken || refreshToken);

            // If we got a message about legacy token upgrade, log it
            if (response.message && response.message.includes('Legacy token upgraded')) {
              console.log('Refresh token format upgraded successfully');
            }

            // Log token expiration info
            try {
              const payload = this.parseToken(response.token);
              const expiresAt = payload.exp * 1000; // Convert to milliseconds
              const expiresIn = Math.floor((expiresAt - Date.now()) / 1000 / 60); // Minutes
              console.log(`New token will expire in ${expiresIn} minutes`);
            } catch (e) {
              console.error('Error parsing refreshed token:', e);
            }
          } else {
            console.warn('Refresh token response did not contain a new token');
          }
        }),
        catchError(error => {
          console.error('Error refreshing token:', error);

          // If we get a 401 or 403, the refresh token might be invalid or expired
          if (error.status === 401 || error.status === 403) {
            console.warn('Refresh token is invalid or expired, clearing all tokens');
            this.clearTokens();
          }

          return throwError(() => error);
        })
      );
  }

  /**
   * Save Auth0 token
   * @param token Auth0 token
   */
  saveAuth0Token(token: string): void {
    this.tokenCache[this.AUTH0_TOKEN_KEY] = token;
    // Store for 7 days to match the extended session duration
    this.cookieService.setCookie(this.AUTH0_TOKEN_KEY, this.encrypt(token), 7);

    // For backward compatibility
    localStorage.setItem('auth0Token', token);
  }

  /**
   * Get Auth0 token
   * @returns Auth0 token or null if not found
   */
  getAuth0Token(): string | null {
    // First try memory cache
    if (this.tokenCache[this.AUTH0_TOKEN_KEY]) {
      return this.tokenCache[this.AUTH0_TOKEN_KEY];
    }

    // Then try cookie
    const encryptedToken = this.cookieService.getCookie(this.AUTH0_TOKEN_KEY);
    if (encryptedToken) {
      const token = this.decrypt(encryptedToken);
      this.tokenCache[this.AUTH0_TOKEN_KEY] = token;
      return token;
    }

    // For backward compatibility
    return localStorage.getItem('auth0Token');
  }

  /**
   * Save user data
   * @param userData User data object
   */
  saveUserData(userData: any): void {
    const encryptedData = this.encrypt(JSON.stringify(userData));
    this.tokenCache[this.USER_DATA_KEY] = userData;
    this.cookieService.setCookie(this.USER_DATA_KEY, encryptedData, 7); // Store for 7 days

    // For backward compatibility
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  /**
   * Get user data
   * @returns User data object or null if not found
   */
  getUserData(): any {
    // First try memory cache
    if (this.tokenCache[this.USER_DATA_KEY]) {
      return this.tokenCache[this.USER_DATA_KEY];
    }

    // Then try cookie
    const encryptedData = this.cookieService.getCookie(this.USER_DATA_KEY);
    if (encryptedData) {
      try {
        const decryptedData = this.decrypt(encryptedData);
        const userData = JSON.parse(decryptedData);
        this.tokenCache[this.USER_DATA_KEY] = userData;
        return userData;
      } catch (error) {
        console.error('Error parsing user data', error);
      }
    }

    // For backward compatibility
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        return JSON.parse(userDataStr);
      } catch (error) {
        console.error('Error parsing user data from localStorage', error);
      }
    }

    return null;
  }

  /**
   * Parse JWT token
   * @param token JWT token
   * @returns Decoded token payload
   */
  private parseToken(token: string): any {
    try {
      if (!token || typeof token !== 'string' || !token.includes('.')) {
        throw new Error('Invalid token format');
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      try {
        const rawPayload = atob(base64);
        const decodedPayload = decodeURIComponent(
          rawPayload
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        return JSON.parse(decodedPayload);
      } catch (e) {
        console.error('Error decoding token payload:', e);
        throw new Error('Failed to decode token payload');
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      // Return a minimal valid payload with expired token
      return { exp: 0 };
    }
  }

  /**
   * Check if token data is valid
   * @param tokenData Token data object
   * @returns True if token is valid, false otherwise
   */
  private isTokenValid(tokenData: TokenData): boolean {
    try {
      if (!tokenData || !tokenData.token || !tokenData.expiresAt) {
        return false;
      }

      const now = Date.now() / 1000;
      return tokenData.expiresAt > now;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  /**
   * Simple encryption for token storage
   * Note: This is not secure for production, but better than plaintext
   * @param text Text to encrypt
   * @returns Encrypted text
   */
  private encrypt(text: string): string {
    // In a real production app, use a proper encryption library
    // This is a simple XOR encryption for demonstration
    // Use a derived key from environment variables for better security
    const key = environment.auth0.clientId.substring(0, 16);
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }

    return btoa(result);
  }

  /**
   * Simple decryption for token storage
   * @param encryptedText Encrypted text
   * @returns Decrypted text
   */
  private decrypt(encryptedText: string): string {
    // In a real production app, use a proper encryption library
    // Use a derived key from environment variables for better security
    const key = environment.auth0.clientId.substring(0, 16);
    const text = atob(encryptedText);
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }

    return result;
  }
}
