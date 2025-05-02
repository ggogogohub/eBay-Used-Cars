import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { WebService } from '../../services/web.service';
import { ListingAgePipe } from '../pipes/listing-age.pipe';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'user-profile',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ListingAgePipe],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  userProfile: any;
  userListings: any[] = [];
  isLoading = true;
  errorMessage = '';
  showDeleteConfirm = false;
  showSoldModal = false;
  showChangePasswordModal = false;
  selectedListing: any = null;
  selectedListingId: string = '';

  // Password change form
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordError = '';
  isChangingPassword = false;

  constructor(
    private authService: AuthService,
    private webService: WebService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isLoading = false;

        // If user is a seller, load their listings
        if (profile.role === 'seller') {
          this.loadUserListings();
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load profile. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadUserListings() {
    // Get the username from the profile
    const username = this.userProfile.username;

    // Get all listings (active, sold, reported) for this user by username
    this.webService.getUserListings(username, 1, true).subscribe({
      next: (response) => {
        if (response && response.listings) {
          this.userListings = response.listings;
        } else {
          this.userListings = [];
        }
      },
      error: (error) => {
        console.error('Error loading user listings:', error);
        this.userListings = [];
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Successfully logged out');
        // Force a full page reload to clear any in-memory state
        window.location.href = '/';
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Even if there's an error, force reload to clear state
        window.location.href = '/';
      }
    });
  }

  confirmDeleteAccount() {
    this.showDeleteConfirm = true;
  }

  cancelDeleteAccount() {
    this.showDeleteConfirm = false;
  }

  deleteAccount() {
    this.isLoading = true;
    this.authService.deleteAccount().subscribe({
      next: () => {
        // Show success toast notification
        this.toastService.success('Account deleted successfully');
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage = 'Failed to delete account. Please try again.';
        // Show error toast notification
        this.toastService.error('Failed to delete account. Please try again.');
        this.isLoading = false;
        this.showDeleteConfirm = false;
      }
    });
  }

  /**
   * Open the Mark as Sold modal
   * @param listingId The ID of the listing to mark as sold
   * @param event The click event (to prevent navigation)
   */
  markListingAsSold(listingId: string, event: Event) {
    // Prevent the click from navigating to the listing detail page
    event.preventDefault();
    event.stopPropagation();

    if (!listingId) return;

    // Find the listing in the user's listings
    const listing = this.userListings.find(l => l._id === listingId);
    if (!listing) return;

    // Set the selected listing and show the modal
    this.selectedListing = listing;
    this.selectedListingId = listingId;
    this.showSoldModal = true;
  }

  /**
   * Cancel marking a listing as sold
   */
  cancelMarkAsSold() {
    this.showSoldModal = false;
    this.selectedListing = null;
    this.selectedListingId = '';
  }

  /**
   * Confirm marking a listing as sold
   */
  confirmMarkAsSold() {
    if (!this.selectedListingId) {
      this.cancelMarkAsSold();
      return;
    }

    // Show loading state
    this.isLoading = true;

    this.webService.markListingAsSold(this.selectedListingId).subscribe({
      next: (response) => {
        // Hide the modal
        this.showSoldModal = false;

        // Show success toast notification
        this.toastService.success('Listing has been successfully marked as sold!');

        // Reset selected listing
        this.selectedListing = null;
        this.selectedListingId = '';

        // Reload the user's listings to reflect the change
        this.loadUserListings();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error marking listing as sold:', error);
        this.errorMessage = 'Failed to mark listing as sold. Please try again.';
        // Show error toast notification
        this.toastService.error('Failed to mark listing as sold. Please try again.');
        this.isLoading = false;
      }
    });
  }

  // Open the change password modal
  openChangePasswordModal() {
    // Reset form and errors
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.passwordError = '';
    this.showChangePasswordModal = true;
  }

  // Close the change password modal
  closeChangePasswordModal() {
    this.showChangePasswordModal = false;
  }

  // Submit the change password form
  changePassword() {
    // Reset error
    this.passwordError = '';

    // Validate form
    if (!this.passwordForm.currentPassword) {
      this.passwordError = 'Current password is required';
      return;
    }

    if (!this.passwordForm.newPassword) {
      this.passwordError = 'New password is required';
      return;
    }

    if (this.passwordForm.newPassword.length < 8) {
      this.passwordError = 'New password must be at least 8 characters long';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'New passwords do not match';
      return;
    }

    // Set loading state
    this.isChangingPassword = true;

    // Call the auth service to change the password
    this.authService.changePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword)
      .subscribe({
        next: () => {
          this.isChangingPassword = false;
          this.showChangePasswordModal = false;
          // Toast notification is handled in the service
        },
        error: (error) => {
          this.isChangingPassword = false;
          // Set error message from response if available
          this.passwordError = error.error?.error || 'Failed to change password. Please try again.';
          // Toast notification is handled in the service
        }
      });
  }
}
