import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../../services/web.service';
import { GeocodingService } from '../../../services/geocoding.service';
import { MapComponent } from '../../shared/map/map.component';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'edit-listing',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, MapComponent, ImageUploadComponent],
  templateUrl: './edit-listing.component.html',
  styleUrl: './edit-listing.component.css'
})
export class EditListingComponent implements OnInit {
  listingId: string = '';
  listing: any = {
    vehicle_model: '',
    price: null,
    mileage: null,
    location: '',
    car_type: '',
    listing_age: 0,
    coordinates: null,
    images: []
  };

  originalListing: any = null; // To track changes
  isLoading = true;
  isSaving = false;
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
    private route: ActivatedRoute,
    private geocodingService: GeocodingService,
    private cloudinaryService: CloudinaryService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.listingId = this.route.snapshot.paramMap.get('id') || '';
    if (this.listingId) {
      this.loadListing(this.listingId);
    } else {
      this.isLoading = false;
      this.errorMessage = 'No listing ID provided';
      this.toastService.error('No listing ID provided');
      this.router.navigate(['/listings']);
    }
  }

  loadListing(id: string) {
    this.isLoading = true;
    this.webService.getListing(id).subscribe({
      next: (listing) => {
        this.listing = listing;
        this.originalListing = JSON.parse(JSON.stringify(listing)); // Deep copy
        this.isLoading = false;

        // Set preview coordinates if available
        if (this.listing.coordinates && 
            this.listing.coordinates.coordinates && 
            this.listing.coordinates.coordinates.length === 2) {
          const [lng, lat] = this.listing.coordinates.coordinates;
          this.previewCoordinates = [lat, lng];
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load listing. Please try again.';
        this.toastService.error('Failed to load listing. Please try again.');
        console.error('Error loading listing:', error);
      }
    });
  }

  updateListing() {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Check if there are files selected but not uploaded
    if (this.imageUploadComponent && this.imageUploadComponent.hasFilesToUpload()) {
      this.errorMessage = 'Please upload your images first by clicking the "Upload Files" button';
      this.toastService.error('Please upload your images first');
      this.isSaving = false;
      return;
    }

    // Validate form
    if (!this.validateForm()) {
      this.isSaving = false;
      return;
    }

    // Geocode the location before updating the listing
    this.geocodeLocation();
  }

  /**
   * Preview the location on the map when the user enters a location
   */
  previewLocation() {
    if (this.listing.location) {
      this.geocodingService.geocodeLocation(this.listing.location).subscribe({
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
    this.geocodingService.geocodeLocation(this.listing.location).subscribe({
      next: (coordinates) => {
        // Add coordinates to the listing if found
        this.listing.coordinates = coordinates;

        // Update the listing with coordinates
        this.saveListingUpdate();
      },
      error: (error) => {
        console.error('Error geocoding location:', error);
        // Continue with listing update even if geocoding fails
        this.saveListingUpdate();
      }
    });
  }

  /**
   * Save the listing update with the webservice
   */
  saveListingUpdate() {
    // Create a copy of the listing without the _id field
    const listingUpdate = { ...this.listing };
    delete listingUpdate._id;

    this.webService.updateListing(this.listingId, listingUpdate).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage = 'Listing updated successfully!';
        this.toastService.success('Listing updated successfully!');

        // Navigate back to the listing detail page after a short delay
        setTimeout(() => {
          this.router.navigate(['/listings', this.listingId]);
        }, 1500);
      },
      error: (error) => {
        this.isSaving = false;
        const errorMsg = error.error?.error || 'Failed to update listing. Please try again.';
        this.errorMessage = errorMsg;
        this.toastService.error(errorMsg);
        console.error('Error updating listing:', error);
      }
    });
  }

  validateForm(): boolean {
    if (!this.listing.vehicle_model) {
      this.errorMessage = 'Vehicle model is required';
      this.toastService.error('Vehicle model is required');
      return false;
    }

    if (!this.listing.price || this.listing.price <= 0) {
      this.errorMessage = 'Please enter a valid price';
      this.toastService.error('Please enter a valid price');
      return false;
    }

    if (!this.listing.mileage || this.listing.mileage < 0) {
      this.errorMessage = 'Please enter a valid mileage';
      this.toastService.error('Please enter a valid mileage');
      return false;
    }

    if (!this.listing.location) {
      this.errorMessage = 'Location is required';
      this.toastService.error('Location is required');
      return false;
    }

    if (!this.listing.car_type) {
      this.errorMessage = 'Car type is required';
      this.toastService.error('Car type is required');
      return false;
    }

    // Check if there are images
    if (!this.listing.images || this.listing.images.length === 0) {
      this.errorMessage = 'At least one image is required';
      this.toastService.error('At least one image is required');
      return false;
    }

    return true;
  }

  /**
   * Handle images uploaded from the image upload component
   */
  onImagesUploaded(images: any[]) {
    this.listing.images = images;
    console.log('Images uploaded:', images);
  }

  /**
   * Cancel editing and return to listing detail
   */
  cancelEdit() {
    this.router.navigate(['/listings', this.listingId]);
  }
}
