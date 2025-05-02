// This file provides a way to load environment variables in Angular
// It's used by both environment.ts and environment.prod.ts

// Function to get environment variables with fallbacks
// In Angular, environment variables are typically handled at build time
// For simplicity, we'll just use the fallback values directly
export function getEnvVar(key: string, fallback: string): string {
  // In a real production setup, you would use a proper environment variable loading mechanism
  // For Angular, this typically involves using environment.ts and environment.prod.ts files
  // along with Angular CLI configuration

  // For now, we'll just return the fallback value
  return fallback;
}

// Auth0 configuration
export const auth0Config = {
  domain: getEnvVar('AUTH0_DOMAIN', 'dev-edvs1qdwrdg2ltp5.us.auth0.com'),
  clientId: getEnvVar('AUTH0_CLIENT_ID', 'IDcPVuJlCIdnYDk9S73iE2sIOUp9cvnC'),
  redirectUri: getEnvVar('AUTH0_REDIRECT_URI', 'http://localhost:4200/'),
  scope: 'openid profile email'
};

// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: getEnvVar('CLOUDINARY_CLOUD_NAME', 'dhp2ieqda'),
  uploadPreset: getEnvVar('CLOUDINARY_UPLOAD_PRESET', 'ebay_used_cars')
};

// API URL configuration
export const apiConfig = {
  development: 'http://localhost:5001',
  production: getEnvVar('API_URL', 'https://api.ebayusedcars.com')
};
