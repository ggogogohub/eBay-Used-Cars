import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebService } from '../../services/web.service';
import { ListingAgePipe } from '../pipes/listing-age.pipe';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'home',
  standalone: true,
  imports: [RouterModule, CommonModule, ListingAgePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  title = 'Welcome to eBay Used Cars';
  featuredListings: any[] = [];
  isLoggedIn = false;
  isSeller = false;

  // Reference to the pipe to ensure it's recognized by Angular
  private listingAgePipe: ListingAgePipe = new ListingAgePipe();

  constructor(
    private webService: WebService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Get featured listings (first page)
    this.webService.getListings(1).subscribe(
      response => {
        if (response && response.listings) {
          // Get up to 3 featured listings
          this.featuredListings = response.listings.slice(0, 3);
        }
      }
    );

    // Check authentication status
    this.checkAuthStatus();
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
        this.isSeller = profile.role === 'seller';
      },
      error: () => {
        this.isSeller = false;
      }
    });
  }

  // Method to handle logout from footer
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Successfully logged out');
        window.location.reload(); // Reload the page to update UI
      },
      error: (error) => {
        console.error('Error during logout:', error);
        window.location.reload(); // Reload anyway to ensure UI is updated
      }
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
}
