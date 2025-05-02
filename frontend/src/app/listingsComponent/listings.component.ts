import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebService } from '../../services/web.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { ListingAgePipe } from '../pipes/listing-age.pipe';

@Component({
  selector: 'listings',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ListingAgePipe],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.css'
})
export class ListingsComponent {
  listings: any[] = [];
  page: number = 1;
  totalPages: number = 1;
  isLoggedIn = false;
  isSeller = false;
  userProfile: any;
  activeFilterCount = 0;
  isLoading = false;
  sortOption = 'newest';
  goToPageInput: number | null = null;

  // Available sort options
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Debounce timer for real-time filtering
  private filterTimer: any;

  filters: any = {
    vehicle_model: '',
    price: '',
    mileage: '',
    location: '',
    car_type: ''
  };

  constructor(
    private webService: WebService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadListings();
    this.checkAuthStatus();
    this.updateActiveFilterCount();
  }

  checkAuthStatus() {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;

      if (isLoggedIn) {
        this.loadUserProfile();
      } else {
        this.isSeller = false;
      }
    });
  }

  loadUserProfile() {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isSeller = profile.role === 'seller';
      },
      error: () => {
        this.isSeller = false;
      }
    });
  }

  loadListings() {
    this.isLoading = true;

    // Create a copy of filters with only non-empty values
    const activeFilters: {[key: string]: any} = {};
    Object.keys(this.filters).forEach(key => {
      if (this.filters[key] !== null && this.filters[key] !== undefined && this.filters[key] !== '') {
        activeFilters[key] = this.filters[key];
      }
    });

    this.webService.getListings(this.page, activeFilters, this.sortOption).subscribe(
      response => {
        if (response) {
          this.listings = response.listings;
          this.totalPages = response.total_pages;
          this.isLoading = false;

          // We no longer need to process coordinates for listing cards
          // since we removed the map from the cards
        }
      }
    );
  }

  previousPage() {
    if (this.page > 1) {
      this.page = this.page - 1;
      this.loadListings();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page = this.page + 1;
      this.loadListings();
    }
  }

  /**
   * Go to a specific page
   * @param pageNumber The page number to go to
   */
  goToPage(pageNumber: number | null) {
    if (!pageNumber || pageNumber < 1 || pageNumber > this.totalPages) {
      return;
    }

    // Only reload if the page is different
    if (pageNumber !== this.page) {
      this.page = pageNumber;
      this.loadListings();
    }

    // Reset the input field after navigation
    this.goToPageInput = null;
  }

  // Handle input changes with debounce for real-time filtering
  onFilterChange() {
    // Clear any existing timer
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }

    // Set a new timer to apply filters after 300ms of inactivity
    this.filterTimer = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  applyFilters() {
    // Reset to first page when applying filters
    this.page = 1;
    this.updateActiveFilterCount();
    this.loadListings();
  }

  // Handle sort option change
  onSortChange() {
    this.loadListings();
  }

  // Count active filters for UI feedback
  updateActiveFilterCount() {
    this.activeFilterCount = Object.values(this.filters).filter(value =>
      value !== null && value !== undefined && value !== ''
    ).length;
  }

  clearFilters() {
    this.filters = {
      vehicle_model: '',
      price: '',
      mileage: '',
      location: '',
      car_type: ''
    };
    this.activeFilterCount = 0;
    this.page = 1;
    this.loadListings();
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
}
