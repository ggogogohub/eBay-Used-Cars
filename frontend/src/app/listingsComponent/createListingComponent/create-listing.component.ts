import { Component, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../../services/web.service';
import { GeocodingService } from '../../../services/geocoding.service';
import { MapComponent } from '../../shared/map/map.component';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'create-listing',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, MapComponent, ImageUploadComponent],
  templateUrl: './create-listing.component.html',
  styleUrl: './create-listing.component.css'
})
export class CreateListingComponent {
  newListing: {
    vehicle_model: string;
    price: number | null;
    mileage: number | null;
    location: string;
    car_type: string;
    listing_age: number;
    coordinates: any | null;
    images: any[];
  } = {
    vehicle_model: '',
    price: null,
    mileage: null,
    location: '',
    car_type: '',
    listing_age: 0,
    coordinates: null,
    images: []
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // For location preview map
  previewCoordinates: [number, number] | null = null;

  // Reference to the image upload component
  @ViewChild(ImageUploadComponent) imageUploadComponent!: ImageUploadComponent;

  carTypes = [
    'sedan', 'suv', 'truck', 'coupe', 'hatchback',
    'convertible', 'wagon', 'minivan', 'luxury'
  ];

  constructor(
    private webService: WebService,
    private router: Router,
    private geocodingService: GeocodingService,
    private cloudinaryService: CloudinaryService,
    private toastService: ToastService
  ) { }

  submitListing() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Check if there are files selected but not uploaded
    if (this.imageUploadComponent && this.imageUploadComponent.hasFilesToUpload()) {
      // Show a message to the user
      this.errorMessage = 'Please upload your images first by clicking the "Upload Files" button';
      this.toastService.error('Please upload your images first');
      this.isLoading = false;
      return;
    }

    // Validate form
    if (!this.validateForm()) {
      this.isLoading = false;
      return;
    }

    // Geocode the location before creating the listing
    this.geocodeLocation();
  }

  /**
   * Preview the location on the map when the user enters a location
   */
  previewLocation() {
    if (this.newListing.location) {
      this.geocodingService.geocodeLocation(this.newListing.location).subscribe({
        next: (coordinates) => {
          if (coordinates && coordinates.coordinates && coordinates.coordinates.length === 2) {
            // Swap coordinates for Leaflet (Leaflet uses [lat, lng] while GeoJSON uses [lng, lat])
            const [lng, lat] = coordinates.coordinates;
            this.previewCoordinates = [lat, lng];
          } else {
            this.previewCoordinates = null;
          }
        },
        error: () => {
          this.previewCoordinates = null;
        }
      });
    } else {
      this.previewCoordinates = null;
    }
  }

  /**
   * Geocode the location string to coordinates for submission
   */
  geocodeLocation() {
    this.geocodingService.geocodeLocation(this.newListing.location).subscribe({
      next: (coordinates) => {
        // Add coordinates to the listing if found
        this.newListing.coordinates = coordinates;

        // Create the listing with coordinates
        this.createListing();
      },
      error: (error) => {
        console.error('Error geocoding location:', error);
        // Continue with listing creation even if geocoding fails
        this.createListing();
      }
    });
  }

  /**
   * Create the listing with the webservice
   */
  createListing() {
    this.webService.createListing(this.newListing).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Listing created successfully!';

        // Show success toast notification
        this.toastService.success('Listing created successfully!');

        // Reset form
        this.newListing.vehicle_model = '';
        this.newListing.price = null;
        this.newListing.mileage = null;
        this.newListing.location = '';
        this.newListing.car_type = '';
        this.newListing.listing_age = 0;
        this.newListing.coordinates = null;
        this.newListing.images = [];

        // Navigate to the new listing after a short delay
        setTimeout(() => {
          this.router.navigate(['/listings', response.listing_id]);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.error || 'Failed to create listing. Please try again.';
        this.errorMessage = errorMsg;
        this.toastService.error(errorMsg);
        console.error('Error creating listing:', error);
      }
    });
  }

  validateForm(): boolean {
    if (!this.newListing.vehicle_model) {
      this.errorMessage = 'Vehicle model is required';
      return false;
    }

    if (!this.newListing.price || this.newListing.price <= 0) {
      this.errorMessage = 'Please enter a valid price';
      return false;
    }

    if (!this.newListing.mileage || this.newListing.mileage < 0) {
      this.errorMessage = 'Please enter a valid mileage';
      return false;
    }

    if (!this.newListing.location) {
      this.errorMessage = 'Location is required';
      return false;
    }

    if (!this.newListing.car_type) {
      this.errorMessage = 'Car type is required';
      return false;
    }

    // Check if there are images uploaded
    if (!this.newListing.images || this.newListing.images.length === 0) {
      this.errorMessage = 'At least one image is required';
      return false;
    }

    return true;
  }

  /**
   * Handle images uploaded from the image upload component
   */
  onImagesUploaded(images: any[]) {
    this.newListing.images = images;
    console.log('Images uploaded:', images);
  }
}
