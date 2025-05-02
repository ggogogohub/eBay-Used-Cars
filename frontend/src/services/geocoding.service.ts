import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  // Using Nominatim API (OpenStreetMap's geocoding service)
  private geocodingUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) { }

  /**
   * Convert a location string to coordinates
   * @param location The location string (e.g., "New York", "123 Main St, Boston, MA")
   * @returns An Observable with the coordinates in GeoJSON format or null if not found
   */
  geocodeLocation(location: string): Observable<any> {
    if (!location) {
      return of(null);
    }

    // Prepare the request parameters
    const params = {
      q: location,
      format: 'json',
      limit: '1'
    };

    // Add required headers for Nominatim usage policy
    const headers = {
      'User-Agent': 'eBay-Used-Cars-App',
      'Referer': environment.auth0.redirectUri
    };

    return this.http.get(this.geocodingUrl, { params, headers }).pipe(
      map((response: any) => {
        if (response && response.length > 0) {
          const result = response[0];

          // Create GeoJSON Point format
          return {
            type: 'Point',
            coordinates: [
              parseFloat(result.lon), // longitude first in GeoJSON
              parseFloat(result.lat)  // latitude second in GeoJSON
            ]
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Error geocoding location:', error);
        return of(null);
      })
    );
  }
}
