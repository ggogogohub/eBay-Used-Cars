import { Routes } from '@angular/router';
import { HomeComponent } from './homeComponent/home.component';
import { ListingsComponent } from './listingsComponent/listings.component';
import { ListingDetailComponent } from './listingsComponent/listingDetailComponent/listing-detail.component';
import { CreateListingComponent } from './listingsComponent/createListingComponent/create-listing.component';
import { EditListingComponent } from './listingsComponent/editListingComponent/edit-listing.component';
import { AuthComponent } from './authComponent/auth.component';
import { UserProfileComponent } from './userProfileComponent/user-profile.component';
import { StatisticsComponent } from './statisticsComponent/statistics.component';
import { AdminComponent } from './adminComponent/admin.component';
import { ForgotPasswordComponent } from './authComponent/forgotPasswordComponent/forgot-password.component';
import { ResetPasswordComponent } from './authComponent/resetPasswordComponent/reset-password.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'listings',
    component: ListingsComponent
  },
  {
    path: 'listings/:id',
    component: ListingDetailComponent
  },
  {
    path: 'create-listing',
    component: CreateListingComponent,
    canActivate: [authGuard]
  },
  {
    path: 'edit-listing/:id',
    component: EditListingComponent,
    canActivate: [authGuard]
  },
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'statistics',
    component: StatisticsComponent
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  }
];
