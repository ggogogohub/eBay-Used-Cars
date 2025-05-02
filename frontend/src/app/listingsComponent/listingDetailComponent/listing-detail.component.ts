import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebService } from '../../../services/web.service';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { MapComponent } from '../../shared/map/map.component';
import { ListingAgePipe } from '../../pipes/listing-age.pipe';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'listing-detail',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, MapComponent, ListingAgePipe],
  templateUrl: './listing-detail.component.html',
  styleUrl: './listing-detail.component.css'
})
export class ListingDetailComponent {
  listing: any;
  reviews: any[] = [];
  isLoggedIn = false;
  isSeller = false;
  isOwner = false;
  isAdmin = false;
  newReview = {
    review_text: '',
    rating: 5
  };
  userProfile: any;
  showReportModal = false;
  showSoldModal = false;
  showEditReviewModal = false;
  actionSuccess = '';
  showDeleteReviewModal = false;
  showFeatureModal = false;
  actionInProgress = false;
  actionError = '';
  featureModalMessage = '';

  // For editing reviews
  editingReview: any = {
    _id: '',
    review_text: '',
    rating: 5
  };

  // For deleting reviews
  reviewToDelete: any = null;

  // No longer needed since we're using direct buttons

  constructor(
    private route: ActivatedRoute,
    private webService: WebService,
    private authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadListing(id);
      this.loadReviews(id);
    }

    this.authService.isLoggedIn$.subscribe(
      loggedIn => {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          this.loadUserProfile();
        }
      }
    );
  }

  loadListing(id: string) {
    this.webService.getListing(id).subscribe(
      listing => {
        this.listing = listing;

        // Check if listing has coordinates
        if (this.listing && this.listing.coordinates &&
            this.listing.coordinates.coordinates &&
            this.listing.coordinates.coordinates.length === 2) {
          // Swap coordinates for Leaflet (Leaflet uses [lat, lng] while GeoJSON uses [lng, lat])
          const [lng, lat] = this.listing.coordinates.coordinates;
          this.listing.mapCoordinates = [lat, lng];

          // Add location name to the listing for the map display
          this.listing.locationName = this.listing.location || 'Unknown Location';
        }
      }
    );
  }

  loadReviews(id: string) {
    this.webService.getReviews(id).subscribe(
      reviews => {
        this.reviews = reviews;
      }
    );
  }

  loadUserProfile() {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isSeller = profile.role === 'seller';
        this.isAdmin = profile.role === 'admin';

        // Check if the user is the owner of the listing
        if (this.listing && this.listing.user_id) {
          this.isOwner = this.listing.user_id === profile._id;
        }
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  submitReview() {
    console.log('Submit review called');

    if (!this.listing || !this.newReview.review_text) {
      console.error('Cannot submit review: listing or review text is missing');
      return;
    }

    console.log('Submitting review for listing ID:', this.listing._id);
    console.log('Review data:', this.newReview);

    this.webService.addReview(this.listing._id, this.newReview).subscribe({
      next: (response) => {
        console.log('Review submitted successfully:', response);
        // Show success toast notification
        this.toastService.success('Review submitted successfully!');

        // Reset form
        this.newReview = {
          review_text: '',
          rating: 5
        };
        // Reload reviews
        this.loadReviews(this.listing._id);
      },
      error: (error) => {
        console.error('Error submitting review:', error);
        // Show error toast notification
        this.toastService.error('Failed to submit review. Please try again.');
      }
    });
  }

  // Helper method to generate an array for star rating display
  generateRatingArray(rating: number): number[] {
    return Array(rating).fill(0).map((_, i) => i + 1);
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format date and time for display
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Check if a URL is a video file
   * @param url The URL to check
   * @returns True if the URL is a video file, false otherwise
   */
  isVideo(url: string): boolean {
    // Check if the URL contains video or common video extensions
    return url.includes('/video/') ||
           url.toLowerCase().endsWith('.mp4') ||
           url.toLowerCase().endsWith('.webm') ||
           url.toLowerCase().endsWith('.ogg') ||
           url.toLowerCase().endsWith('.mov');
  }

  // Mark listing as sold
  markAsSold() {
    if (!this.listing) return;

    this.actionInProgress = true;
    this.actionError = '';

    this.webService.markListingAsSold(this.listing._id).subscribe({
      next: (response) => {
        this.actionInProgress = false;
        this.showSoldModal = false;

        // Show success message (will be displayed in the UI)
        this.actionSuccess = 'Listing has been successfully marked as sold!';

        // Show success toast notification
        this.toastService.success('Listing has been successfully marked as sold!');

        // Reload the listing to show updated status
        this.loadListing(this.listing._id);

        // Clear success message after 5 seconds
        setTimeout(() => {
          this.actionSuccess = '';
        }, 5000);
      },
      error: (error) => {
        this.actionInProgress = false;
        this.actionError = 'Failed to mark listing as sold. Please try again.';
        // Show error toast notification
        this.toastService.error('Failed to mark listing as sold. Please try again.');
        console.error('Error marking listing as sold:', error);
      }
    });
  }

  // Report listing
  reportListing() {
    if (!this.listing) return;

    this.actionInProgress = true;
    this.actionError = '';

    this.webService.reportListing(this.listing._id).subscribe({
      next: (response) => {
        this.actionInProgress = false;
        this.showReportModal = false;
        // Show success toast notification
        this.toastService.success('Listing has been reported successfully');
        // Reload the listing to show updated status
        this.loadListing(this.listing._id);
      },
      error: (error) => {
        this.actionInProgress = false;
        this.actionError = 'Failed to report listing. Please try again.';
        // Show error toast notification
        this.toastService.error('Failed to report listing. Please try again.');
        console.error('Error reporting listing:', error);
      }
    });
  }

  // Open/close modals
  openReportModal() {
    this.showReportModal = true;
    this.actionError = '';
  }

  closeReportModal() {
    this.showReportModal = false;
  }

  openSoldModal() {
    this.showSoldModal = true;
    this.actionError = '';
  }

  closeSoldModal() {
    this.showSoldModal = false;
  }

  // Review Management Methods
  editReview(review: any) {
    this.editingReview = {
      _id: review._id,
      review_text: review.review_text,
      rating: review.rating
    };
    this.showEditReviewModal = true;
    this.actionError = '';
  }

  closeEditReviewModal() {
    this.showEditReviewModal = false;
  }

  updateReview() {
    if (!this.listing || !this.editingReview._id) return;

    this.actionInProgress = true;
    this.actionError = '';

    this.webService.updateReview(this.listing._id, this.editingReview._id, {
      review_text: this.editingReview.review_text,
      rating: this.editingReview.rating
    }).subscribe({
      next: (response) => {
        this.actionInProgress = false;
        this.showEditReviewModal = false;
        // Show success toast notification
        this.toastService.success('Review updated successfully');
        // Reload reviews to show the updated review
        this.loadReviews(this.listing._id);
      },
      error: (error) => {
        this.actionInProgress = false;
        this.actionError = 'Failed to update review. Please try again.';
        // Show error toast notification
        this.toastService.error('Failed to update review. Please try again.');
        console.error('Error updating review:', error);
      }
    });
  }

  deleteReview(review: any) {
    this.reviewToDelete = review;
    this.showDeleteReviewModal = true;
    this.actionError = '';
  }

  closeDeleteReviewModal() {
    this.showDeleteReviewModal = false;
  }

  // Feature Coming Soon Modal
  openFeatureModal(feature: string) {
    this.featureModalMessage = `This feature (${feature}) is coming soon!`;
    this.showFeatureModal = true;
  }

  closeFeatureModal() {
    this.showFeatureModal = false;
  }

  // Removed dropdown toggle methods as we're using direct buttons now

  confirmDeleteReview() {
    if (!this.listing || !this.reviewToDelete) return;

    this.actionInProgress = true;
    this.actionError = '';

    this.webService.deleteReview(this.listing._id, this.reviewToDelete._id).subscribe({
      next: (response) => {
        this.actionInProgress = false;
        this.showDeleteReviewModal = false;
        // Show success toast notification
        this.toastService.success('Review deleted successfully');
        // Reload reviews to reflect the deletion
        this.loadReviews(this.listing._id);
      },
      error: (error) => {
        this.actionInProgress = false;
        this.actionError = 'Failed to delete review. Please try again.';
        // Show error toast notification
        this.toastService.error('Failed to delete review. Please try again.');
        console.error('Error deleting review:', error);
      }
    });
  }
}
