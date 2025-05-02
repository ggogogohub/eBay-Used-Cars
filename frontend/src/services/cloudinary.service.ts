import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cloudinary } from '@cloudinary/url-gen';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private baseUrl = environment.apiUrl;
  private cloudName = environment.cloudinary.cloudName;
  private cloudinary: Cloudinary;

  constructor(private http: HttpClient) {
    // Initialize Cloudinary instance
    this.cloudinary = new Cloudinary({
      cloud: {
        cloudName: this.cloudName
      }
    });
  }

  /**
   * Upload an image to Cloudinary through our backend
   * @param file The file to upload
   * @returns Observable with the upload response
   */
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.baseUrl}/upload/image`, formData);
  }

  /**
   * Upload multiple images to Cloudinary through our backend
   * @param files Array of files to upload
   * @returns Observable with the upload response containing array of URLs
   */
  uploadMultipleImages(files: File[]): Observable<any> {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append('files', file);
    });

    return this.http.post<any>(`${this.baseUrl}/upload/images`, formData);
  }

  /**
   * Get a transformed URL for an image
   * @param publicId The public ID of the image
   * @param width Optional width for resizing
   * @returns The transformed URL
   */
  getImageUrl(publicId: string, width?: number): string {
    let url = `https://res.cloudinary.com/${environment.cloudinary.cloudName}/image/upload/`;

    // Add transformations if needed
    if (width) {
      url += `w_${width},c_scale/`;
    }

    url += publicId;
    return url;
  }
}
