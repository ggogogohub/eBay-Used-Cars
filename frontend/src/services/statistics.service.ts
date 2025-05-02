import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get summary statistics for all active listings
  getListingsSummary(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/listings/stats/summary`);
  }

  // Get average price by car type for active listings
  getAveragePriceByType(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/listings/stats/average_price_by_type`);
  }
}
