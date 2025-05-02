import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Auth0AuthService } from '../../services/auth0.service';
import { merge } from 'rxjs';

@Component({
  selector: 'navigation',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent {
  isLoggedIn = false;
  isSeller = false;
  isAdmin = false;
  userProfile: any;
  isScrolled = false;

  constructor(
    private authService: AuthService,
    private auth0Service: Auth0AuthService
  ) { }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  ngOnInit() {
    // Check initial scroll position
    this.onWindowScroll();

    // Merge the login status from both services
    merge(
      this.authService.isLoggedIn$,
      this.auth0Service.isLoggedIn$
    ).subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;

      if (loggedIn) {
        this.loadUserProfile();
      } else {
        this.isSeller = false;
        this.isAdmin = false;
      }
    });
  }

  loadUserProfile() {
    // First check if Auth0 is in the process of authenticating
    this.auth0Service.isAuthenticating$.subscribe(isAuthenticating => {
      if (isAuthenticating) {
        console.log('Auth0 is still authenticating, delaying profile request');
        // Don't make profile requests while authenticating
        return;
      }

    // Check if we're using Auth0
    this.auth0Service.isLoggedIn$.subscribe(isAuth0LoggedIn => {
      if (isAuth0LoggedIn) {
        console.log('Loading profile for Auth0 user');
        // Get Auth0 token first
        this.auth0Service.getAccessToken().subscribe({
          next: (auth0Token) => {
            // Store Auth0 token for API calls
            localStorage.setItem('auth0Token', auth0Token);

            // Now get the profile with the Auth0 token
            this.authService.getProfile().subscribe({
              next: (profile) => {
                this.userProfile = profile;
                this.isSeller = profile.role === 'seller';
                this.isAdmin = profile.role === 'admin';
                console.log('Auth0 User Profile:', profile);
                console.log('Is Admin:', this.isAdmin);
                console.log('Is Seller:', this.isSeller);
              },
              error: (error) => {
                console.error('Error loading profile with Auth0 token:', error);

                // If we get a 401, it might be because the token isn't fully processed yet
                if (error.status === 401) {
                  console.log('Got 401 on profile request, might need to wait for token processing');
                  // We'll let the page refresh from the Auth0 service handle this
                }
              }
            });
          },
          error: (error) => {
            console.error('Error getting Auth0 token for profile:', error);
          }
        });
      } else {
        // Regular authentication
        this.authService.getProfile().subscribe({
          next: (profile) => {
            this.userProfile = profile;
            this.isSeller = profile.role === 'seller';
            this.isAdmin = profile.role === 'admin';
            console.log('Regular User Profile:', profile);
            console.log('Is Admin:', this.isAdmin);
            console.log('Is Seller:', this.isSeller);
          },
          error: (error) => {
            console.error('Error loading profile:', error);
            this.isSeller = false;
            this.isAdmin = false;
          }
        });
      }
    }).unsubscribe(); // Unsubscribe to prevent memory leaks
  }).unsubscribe(); // Unsubscribe from isAuthenticating
  }

  logout(event?: Event) {
    // Prevent default link behavior if called from a link
    if (event) {
      event.preventDefault();
    }

    // Check if user is logged in with Auth0
    this.auth0Service.isLoggedIn$.subscribe(isAuth0LoggedIn => {
      if (isAuth0LoggedIn) {
        // Logout from Auth0
        this.auth0Service.logout();
      } else {
        // Properly logout from regular auth using the auth service
        this.authService.logout().subscribe({
          next: () => {
            console.log('Successfully logged out');
            // Force a full page reload to clear any in-memory state
            window.location.href = '/';
          },
          error: (error) => {
            console.error('Error during logout:', error);
            // Even if there's an error, clear local storage and reload
            window.location.href = '/';
          }
        });
      }
    }).unsubscribe(); // Unsubscribe immediately after checking
  }
}
