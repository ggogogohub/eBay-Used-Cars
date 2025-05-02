import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterModule, Event } from '@angular/router';
import { NavComponent } from './navComponent/nav.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastComponent } from './toastComponent/toast.component';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, NavComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'eBay Used Cars';
  isHomePage = false;
  isLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Check if current route is home page
    this.checkIfHomePage(this.router.url);

    // Subscribe to route changes
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkIfHomePage(event.urlAfterRedirects);
    });

    // Subscribe to authentication state
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    // Check if we need to show a login toast after page reload (for Auth0 login)
    if (localStorage.getItem('showLoginToast') === 'true') {
      // Show the login success toast
      this.toastService.success('Login successful!');
      // Remove the flag
      localStorage.removeItem('showLoginToast');
    }
  }

  // Method to handle logout from footer
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Successfully logged out');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        this.router.navigate(['/']);
      }
    });
  }

  // Check if current route is home page
  private checkIfHomePage(url: string): void {
    this.isHomePage = url === '/' || url === '/home';
  }
}
