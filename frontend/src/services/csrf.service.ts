import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CsrfService {
  private readonly baseUrl = environment.apiUrl;
  private csrfToken: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get a CSRF token from the server
   * @returns Observable with the CSRF token
   */
  getCsrfToken(): Observable<string> {
    // If we already have a token, return it
    if (this.csrfToken) {
      return of(this.csrfToken);
    }

    // Otherwise, get a new token from the server
    return this.http.get<any>(`${this.baseUrl}/auth/csrf-token`)
      .pipe(
        tap(response => {
          if (response && response.csrfToken) {
            this.csrfToken = response.csrfToken;
          }
        }),
        catchError(error => {
          console.error('Error getting CSRF token:', error);
          return of('');
        })
      );
  }

  /**
   * Get the current CSRF token
   * @returns The current CSRF token or null if not available
   */
  getToken(): string | null {
    return this.csrfToken;
  }

  /**
   * Clear the CSRF token
   */
  clearToken(): void {
    this.csrfToken = null;
  }
}
