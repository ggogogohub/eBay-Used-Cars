import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  /**
   * Set a cookie with the given name, value, and expiration days
   * @param name Cookie name
   * @param value Cookie value
   * @param days Days until expiration
   * @param secure Whether the cookie should be secure (HTTPS only)
   * @param sameSite SameSite attribute ('Strict', 'Lax', or 'None')
   */
  setCookie(name: string, value: string, days: number = 1, secure: boolean = true, sameSite: 'Strict' | 'Lax' | 'None' = 'Lax'): void {
    try {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      const secureFlag = secure ? '; Secure' : '';
      const sameSiteFlag = `; SameSite=${sameSite}`;
      document.cookie = `${name}=${value}; ${expires}; path=/; ${secureFlag}${sameSiteFlag}`;
    } catch (error) {
      console.error(`Error setting cookie '${name}':`, error);
    }
  }

  /**
   * Get a cookie by name
   * @param name Cookie name
   * @returns Cookie value or empty string if not found
   */
  getCookie(name: string): string {
    try {
      const nameEQ = `${name}=`;
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }
      return '';
    } catch (error) {
      console.error(`Error getting cookie '${name}':`, error);
      return '';
    }
  }

  /**
   * Delete a cookie by name
   * @param name Cookie name
   */
  deleteCookie(name: string): void {
    try {
      // Set multiple variations to ensure the cookie is deleted in all scenarios
      // This handles different path and domain combinations
      document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
      document.cookie = `${name}=; Max-Age=-99999999; path=/; domain=${window.location.hostname};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;

      // Also try with Secure and SameSite attributes
      document.cookie = `${name}=; Max-Age=-99999999; path=/; Secure; SameSite=Strict;`;
      document.cookie = `${name}=; Max-Age=-99999999; path=/; Secure; SameSite=Lax;`;

      console.log(`Attempted to delete cookie: ${name}`);
    } catch (error) {
      console.error(`Error deleting cookie '${name}':`, error);
    }
  }

  /**
   * Check if a cookie exists
   * @param name Cookie name
   * @returns True if cookie exists, false otherwise
   */
  hasCookie(name: string): boolean {
    try {
      return this.getCookie(name) !== '';
    } catch (error) {
      console.error(`Error checking if cookie '${name}' exists:`, error);
      return false;
    }
  }

  /**
   * Clear all cookies related to authentication
   */
  clearAllAuthCookies(): void {
    try {
      // List of common auth-related cookie names to clear
      const authCookies = [
        'access_token',
        'refresh_token',
        'auth0_token',
        'user_data',
        'token',
        'auth0.is.authenticated',
        'auth0.idtoken',
        'auth0.accesstoken',
        'auth0.refreshtoken',
        'XSRF-TOKEN',
        'auth_session',
        'auth_state',
        'auth_nonce'
      ];

      // Clear each cookie
      authCookies.forEach(cookieName => {
        this.deleteCookie(cookieName);
      });

      // Also try to clear any cookies that start with common prefixes
      const allCookies = document.cookie.split(';');
      for (let i = 0; i < allCookies.length; i++) {
        const cookie = allCookies[i].trim();
        const cookieParts = cookie.split('=');
        const cookieName = cookieParts[0];

        // Check if this cookie is related to authentication
        if (
          cookieName.includes('auth') ||
          cookieName.includes('token') ||
          cookieName.includes('session') ||
          cookieName.includes('user') ||
          cookieName.includes('login')
        ) {
          this.deleteCookie(cookieName);
        }
      }

      console.log('Cleared all authentication cookies');
    } catch (error) {
      console.error('Error clearing all auth cookies:', error);
    }
  }
}
