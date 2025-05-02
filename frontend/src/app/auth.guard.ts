import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  
  if (token) {
    return true;
  }
  
  // Redirect to login page if not authenticated
  return router.parseUrl('/auth');
};
