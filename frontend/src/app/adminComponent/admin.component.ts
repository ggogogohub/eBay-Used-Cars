import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../services/web.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'admin',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  isAdmin = false;
  activeTab = 'listings'; // 'listings' or 'users'
  
  // Listings data
  reportedListings: any[] = [];
  soldListings: any[] = [];
  
  // Users data
  users: any[] = [];
  
  // Action states
  isLoading = true;
  actionInProgress = false;
  actionError = '';
  actionSuccess = '';
  
  // Modals
  showDeleteListingModal = false;
  showDeleteUserModal = false;
  showChangeRoleModal = false;
  listingToDelete: any = null;
  userToDelete: any = null;
  userToChangeRole: any = null;
  newRole = '';

  constructor(
    private webService: WebService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.checkAdminStatus();
  }

  checkAdminStatus() {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.isAdmin = profile.role === 'admin';
        if (this.isAdmin) {
          this.loadData();
        }
      },
      error: (error) => {
        console.error('Error checking admin status:', error);
        this.isAdmin = false;
      }
    });
  }

  loadData() {
    if (this.activeTab === 'listings') {
      this.loadListings();
    } else {
      this.loadUsers();
    }
  }

  loadListings() {
    this.isLoading = true;
    this.actionError = '';
    this.actionSuccess = '';
    
    this.webService.getAdminListings().subscribe({
      next: (response) => {
        // Separate reported and sold listings
        this.reportedListings = response.filter((listing: any) => listing.status === 'reported');
        this.soldListings = response.filter((listing: any) => listing.status === 'sold');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admin listings:', error);
        this.actionError = 'Failed to load listings. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.actionError = '';
    this.actionSuccess = '';
    
    this.webService.getUsers().subscribe({
      next: (response) => {
        this.users = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.actionError = 'Failed to load users. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Tab switching
  switchTab(tab: string) {
    this.activeTab = tab;
    this.loadData();
  }

  // Listing actions
  openDeleteListingModal(listing: any) {
    this.listingToDelete = listing;
    this.showDeleteListingModal = true;
    this.actionError = '';
  }

  closeDeleteListingModal() {
    this.showDeleteListingModal = false;
  }

  deleteListing() {
    if (!this.listingToDelete) return;
    
    this.actionInProgress = true;
    this.actionError = '';
    
    this.webService.deleteAdminListing(this.listingToDelete._id).subscribe({
      next: (response) => {
        this.actionInProgress = false;
        this.showDeleteListingModal = false;
        this.actionSuccess = 'Listing deleted successfully.';
        
        // Reload listings
        this.loadListings();
      },
      error: (error) => {
        this.actionInProgress = false;
        this.actionError = 'Failed to delete listing. Please try again.';
        console.error('Error deleting listing:', error);
      }
    });
  }

  // User actions
  openDeleteUserModal(user: any) {
    this.userToDelete = user;
    this.showDeleteUserModal = true;
    this.actionError = '';
  }

  closeDeleteUserModal() {
    this.showDeleteUserModal = false;
  }

  deleteUser() {
    if (!this.userToDelete) return;
    
    this.actionInProgress = true;
    this.actionError = '';
    
    this.webService.deleteUser(this.userToDelete._id).subscribe({
      next: (response) => {
        this.actionInProgress = false;
        this.showDeleteUserModal = false;
        this.actionSuccess = 'User deleted successfully.';
        
        // Reload users
        this.loadUsers();
      },
      error: (error) => {
        this.actionInProgress = false;
        this.actionError = 'Failed to delete user. Please try again.';
        console.error('Error deleting user:', error);
      }
    });
  }

  openChangeRoleModal(user: any) {
    this.userToChangeRole = user;
    this.newRole = user.role;
    this.showChangeRoleModal = true;
    this.actionError = '';
  }

  closeChangeRoleModal() {
    this.showChangeRoleModal = false;
  }

  changeUserRole() {
    if (!this.userToChangeRole || !this.newRole) return;
    
    this.actionInProgress = true;
    this.actionError = '';
    
    this.webService.updateUserRole(this.userToChangeRole._id, this.newRole).subscribe({
      next: (response) => {
        this.actionInProgress = false;
        this.showChangeRoleModal = false;
        this.actionSuccess = `User role updated to ${this.newRole}.`;
        
        // Reload users
        this.loadUsers();
      },
      error: (error) => {
        this.actionInProgress = false;
        this.actionError = 'Failed to update user role. Please try again.';
        console.error('Error updating user role:', error);
      }
    });
  }
}
