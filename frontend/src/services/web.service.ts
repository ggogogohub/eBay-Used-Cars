import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebService {
  private baseUrl = environment.apiUrl;
  pageSize: number = 12;

  constructor(private http: HttpClient) { }

  // Listings endpoints
  getListings(page: number, filters: any = {}, sortBy: string = '') {
    // Build the query string with filters
    let queryParams = `page=${page}&page_size=${this.pageSize}`;

    // Add non-empty filters to the query string
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        queryParams += `&${key}=${encodeURIComponent(filters[key])}`;
      }
    });

    // Add sorting if specified
    if (sortBy) {
      queryParams += `&sort_by=${sortBy}`;
    }

    return this.http.get<any>(`${this.baseUrl}/listings?${queryParams}`);
  }

  // Get listings by username
  getUserListings(username: string, page: number = 1, includeAll: boolean = false) {
    let url = `${this.baseUrl}/listings?username=${username}&page=${page}&page_size=${this.pageSize}`;

    // If includeAll is true, include all statuses (active, sold, reported)
    if (includeAll) {
      url += '&status=all';
    }

    return this.http.get<any>(url);
  }

  getListing(id: string) {
    return this.http.get<any>(`${this.baseUrl}/listings/${id}`);
  }

  createListing(listing: any) {
    return this.http.post<any>(`${this.baseUrl}/listings`, listing);
  }

  updateListing(id: string, listing: any) {
    return this.http.put<any>(`${this.baseUrl}/listings/${id}`, listing);
  }

  deleteListing(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/listings/${id}`);
  }

  markListingAsSold(id: string) {
    return this.http.put<any>(`${this.baseUrl}/listings/${id}/mark_sold`, {});
  }

  reportListing(id: string) {
    return this.http.post<any>(`${this.baseUrl}/listings/${id}/report`, {});
  }

  // Reviews endpoints
  getReviews(listingId: string) {
    return this.http.get<any>(`${this.baseUrl}/listings/${listingId}/reviews`);
  }

  addReview(listingId: string, review: any): Observable<any> {
    console.log('Adding review for listing:', listingId);
    console.log('Review data:', review);

    // Ensure rating is an integer
    const reviewData = {
      ...review,
      rating: parseInt(review.rating, 10)
    };

    console.log('Processed review data:', reviewData);

    return this.http.post<any>(`${this.baseUrl}/listings/${listingId}/reviews`, reviewData)
      .pipe(
        tap(response => {
          console.log('Review submission response:', response);
        }),
        catchError(error => {
          console.error('Error submitting review:', error);
          return throwError(() => error);
        })
      );
  }

  updateReview(listingId: string, reviewId: string, review: any) {
    // Ensure rating is an integer
    const reviewData = {
      ...review,
      rating: parseInt(review.rating, 10)
    };

    return this.http.put<any>(`${this.baseUrl}/listings/${listingId}/reviews/${reviewId}`, reviewData);
  }

  deleteReview(listingId: string, reviewId: string) {
    return this.http.delete<any>(`${this.baseUrl}/listings/${listingId}/reviews/${reviewId}`);
  }

  // Statistics endpoints
  getListingsSummary() {
    return this.http.get<any>(`${this.baseUrl}/listings/stats/summary`);
  }

  getAveragePriceByType() {
    return this.http.get<any>(`${this.baseUrl}/listings/stats/average_price_by_type`);
  }

  // Admin endpoints
  getAdminListings() {
    return this.http.get<any>(`${this.baseUrl}/admin/listings`);
  }

  deleteAdminListing(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/admin/listings/${id}`);
  }

  getUsers() {
    return this.http.get<any>(`${this.baseUrl}/admin/users`);
  }

  deleteUser(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/admin/users/${id}`);
  }

  updateUserRole(id: string, role: string) {
    return this.http.put<any>(`${this.baseUrl}/admin/users/${id}/role`, { role });
  }
}
