# eBay Used Cars - Full Stack Web Application

## Project Overview

This full-stack web application was developed as part of the assignment for the Full Stack Web Development module at Ulster University. The project implements a comprehensive online marketplace for used cars, inspired by eBay Motors, allowing users to browse, buy, and sell used vehicles. The application demonstrates proficiency in modern web development technologies, security implementation, and responsive design principles.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Database Design](#database-design)
6. [Third-Party Integrations](#third-party-integrations)
7. [Security Features](#security-features)
8. [Improvements from Previous Version](#improvements-from-previous-version)
9. [Installation and Setup](#installation-and-setup)
10. [Testing](#testing)
11. [Academic Reflection](#academic-reflection)
12. [Future Enhancements](#future-enhancements)
13. [References](#references)

## Technology Stack

### Frontend

- **Framework**: Angular 17
- **UI Components**: Custom components with Bootstrap integration
- **State Management**: Angular services with RxJS
- **Styling**: SCSS with custom theming
- **HTTP Client**: Angular HttpClient with interceptors

### Backend

- **Framework**: Flask (Python 3.8+)
- **API Architecture**: RESTful API design
- **Authentication**: JWT (JSON Web Tokens) with refresh token mechanism
- **Database**: MongoDB (NoSQL)
- **Security**: CSRF protection, input validation, rate limiting

### Development Tools

- **Version Control**: Git
- **Package Management**: npm (frontend), pip (backend)
- **Testing**: Postman for API testing
- **Deployment**: Local development environment with potential for cloud deployment

## System Architecture

The application follows a client-server architecture with a clear separation between the frontend and backend:

```
eBay Used Cars
│
├── Frontend (Angular)
│   ├── User Interface Components
│   ├── Services for API Communication
│   ├── Authentication & Authorization
│   ├── Form Validation
│   └── Responsive Design
│
├── Backend (Flask)
│   ├── RESTful API Endpoints
│   ├── Authentication System
│   ├── Business Logic
│   ├── Data Validation
│   └── External Service Integration
│
└── Database (MongoDB)
    ├── Main Collections
    │   ├── users - User accounts with roles
    │   └── listings - Car listings with embedded reviews
    │
    └── Supporting Collections
        ├── blacklist - Invalidated JWT tokens
        ├── refresh_tokens - Authentication refresh tokens
        ├── reset_tokens - Password reset functionality
        └── csrf_tokens - CSRF protection
```

## Frontend Implementation

### Core Components

1. **Home Component**: Landing page with featured listings and statistics
2. **Navigation Component**: Responsive navigation bar with authentication state management
3. **Listings Component**:
   - Main listings page with advanced filtering and pagination
   - Detailed listing view with image gallery and map integration
   - Create/Edit listing forms with validation
4. **Authentication Component**:
   - Login/Register forms
   - Password reset functionality
   - OAuth integration with Google (Auth0)
5. **User Profile Component**:
   - User information management
   - Password change functionality
   - Listing management for sellers
6. **Review Component**: Rating and review system for listings

### Key Features

- **Responsive Design**: Fully responsive layout that adapts to desktop, tablet, and mobile devices
- **Dynamic Content Loading**: Lazy loading and pagination for improved performance
- **Form Validation**: Comprehensive client-side validation with error messaging
- **Toast Notifications**: Real-time feedback for user actions
- **Image Handling**: Multiple image upload and gallery view for listings
- **Interactive Maps**: Location visualization for each listing
- **Authentication State Management**: Persistent login state with token refresh

### UI/UX Considerations

- **Dark Theme**: Modern dark-themed interface with accent colors
- **Accessibility**: ARIA attributes and keyboard navigation support
- **Loading States**: Clear loading indicators for asynchronous operations
- **Error Handling**: User-friendly error messages and recovery options
- **Confirmation Dialogs**: Preventing accidental actions with confirmation prompts

## Backend Implementation

### API Endpoints

#### Authentication

- **POST /auth/register**: User registration
- **GET /auth/login**: Traditional username/password authentication
- **POST /auth/login-auth0**: Google authentication via Auth0
- **GET /auth/profile**: Retrieve user profile information
- **POST /auth/change-password**: Change user password
- **POST /auth/request-password-reset**: Request password reset email
- **POST /auth/reset-password**: Reset password with token
- **GET /auth/logout**: Logout and invalidate tokens
- **DELETE /auth/delete**: Delete user account

#### Listings

- **GET /listings**: Retrieve listings with filtering and pagination
- **POST /listings**: Create new listing
- **GET /listings/{id}**: Get specific listing details
- **PUT /listings/{id}**: Update existing listing
- **DELETE /listings/{id}**: Delete listing
- **PUT /listings/{id}/mark_sold**: Mark listing as sold
- **POST /listings/{id}/report**: Report inappropriate listing
- **GET /listings/stats/average_price_by_type**: Get price statistics by car type
- **GET /listings/stats/summary**: Get overall marketplace statistics

#### Reviews

- **GET /listings/{id}/reviews**: Get all reviews for a listing
- **POST /listings/{id}/reviews**: Add a review to a listing
- **PUT /listings/{id}/reviews/{review_id}**: Update an existing review
- **DELETE /listings/{id}/reviews/{review_id}**: Delete a review

#### Admin Operations

- **GET /admin/listings**: Get reported or sold listings
- **DELETE /admin/listings/{id}**: Delete a listing (admin)
- **GET /admin/users**: Get all registered users
- **DELETE /admin/users/{id}**: Delete a user account (admin)
- **PUT /admin/users/{id}/role**: Update user role

### Security Implementation

- **JWT Authentication**: Secure token-based authentication
- **Token Refresh**: Automatic refresh of access tokens
- **Password Hashing**: bcrypt for secure password storage
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation of all input data
- **Error Handling**: Secure error responses without sensitive information

## Database Design

### MongoDB Collections

1. **Main Collections**:

   - **users**:

     - Username, email, password (hashed)
     - Role (buyer, seller, admin)
     - Auth0 ID (for Google authentication)
     - Registration date

   - **listings**:
     - Vehicle details (model, price, mileage, car type)
     - Location information (text and coordinates)
     - Status (active, sold, reported)
     - Images (Cloudinary URLs)
     - User ID (owner reference)
     - Views count
     - Embedded reviews (rating, text, user, timestamp)
     - Creation and update timestamps

2. **Supporting Collections**:

   - **blacklist**: Stores invalidated JWT tokens
   - **refresh_tokens**: Manages authentication refresh tokens
   - **reset_tokens**: Handles password reset functionality
   - **csrf_tokens**: Stores CSRF tokens for security

### Test User Accounts

The following test accounts are available after importing the dataset:

| Username                | Password      | Role   |
| ----------------------- | ------------- | ------ |
| admin@cars.com          | admin123      | admin  |
| seller@cars.com         | seller123     | seller |
| buyer@cars.com          | buyer123      | buyer  |
| seller2@cars.com        | seller123     | seller |
| buyer2@cars.com         | buyer123      | buyer  |
| badshasonu020@gmail.com | (Auth0 login) | admin  |

### Data Relationships

- One-to-many relationship between users and listings
- One-to-many relationship between listings and reviews
- One-to-many relationship between users and reviews

## Third-Party Integrations

### Cloudinary

Implemented Cloudinary for efficient image storage and management:

- **Image Upload**: Direct frontend uploads with signed URLs
- **Image Transformation**: On-the-fly resizing and optimization
- **Image Gallery**: Responsive image display with lazy loading
- **Storage Management**: Secure cloud storage with backup

### SendGrid

Integrated SendGrid for transactional email delivery:

- **Password Reset Emails**: Secure password reset links
- **Email Templates**: Professional HTML email templates
- **Delivery Tracking**: Email delivery and open rate tracking
- **Error Handling**: Fallback mechanisms for failed email delivery

### Leaflet Maps

Implemented Leaflet for interactive map functionality:

- **Location Display**: Map visualization of listing locations
- **Geocoding**: Converting addresses to coordinates
- **Custom Markers**: Branded map markers for listings
- **Interactive Controls**: Zoom and pan controls for map exploration

### Auth0

Integrated Auth0 for enhanced authentication options:

- **Google Login**: One-click authentication with Google accounts
- **OAuth Flow**: Secure OAuth 2.0 implementation
- **Token Management**: Secure handling of Auth0 tokens
- **User Profile Sync**: Synchronization between Auth0 and local user profiles

## Security Features

### Authentication Security

- **JWT Implementation**: Secure token generation and validation
- **Refresh Token Rotation**: Enhanced security with token rotation
- **Token Expiration**: Configurable token lifetimes
- **Secure Cookie Storage**: HttpOnly and Secure cookie flags

### Data Protection

- **Password Security**: bcrypt hashing with appropriate work factor
- **Input Sanitization**: Protection against injection attacks
- **XSS Prevention**: Content Security Policy implementation
- **CSRF Protection**: Anti-CSRF tokens for state-changing operations

### Access Control

- **Role-Based Authorization**: Different capabilities for buyers, sellers, and admins
- **Resource Ownership**: Verification of resource ownership before operations
- **Rate Limiting**: Protection against abuse and DoS attacks
- **IP Blocking**: Temporary blocking of suspicious IP addresses

## Improvements from Previous Version

### Backend Enhancements

#### Authentication System

- **Migrated from Basic Auth to JWT**: Implemented more secure and scalable JWT authentication
- **Added Refresh Token Mechanism**: Enhanced security and user experience with token refresh
- **Implemented Password Reset Flow**: Complete password reset functionality with email verification
- **Added Google Authentication**: Alternative login method via Auth0 integration
- **Improved Token Security**: Added token blacklisting and proper expiration handling

#### API Architecture

- **Restructured API Endpoints**: More consistent and RESTful API design
- **Enhanced Error Handling**: Standardized error responses with appropriate HTTP status codes
- **Improved Input Validation**: More comprehensive validation with detailed error messages
- **Added Rate Limiting**: Protection against brute force and DoS attacks
- **Implemented CSRF Protection**: Added protection against cross-site request forgery

#### Performance Optimization

- **Added Database Indexing**: Improved query performance with strategic indexes
- **Implemented Query Optimization**: More efficient database queries
- **Added Response Caching**: Reduced database load for frequently accessed data
- **Optimized Image Handling**: Better integration with Cloudinary for image management

### Frontend Improvements

#### User Interface

- **Redesigned UI**: Modern dark-themed interface with improved usability
- **Enhanced Responsiveness**: Better adaptation to different screen sizes
- **Added Toast Notifications**: Real-time feedback for user actions
- **Improved Form Validation**: More user-friendly validation with inline feedback
- **Added Loading States**: Clear loading indicators for better user experience

#### Feature Additions

- **Implemented Pagination Controls**: Enhanced navigation through listings
- **Added Password Change Functionality**: Secure password change for logged-in users
- **Enhanced Listing Management**: Added edit functionality for listings
- **Improved Profile Management**: More comprehensive user profile management
- **Added Map Integration**: Interactive maps for listing locations

#### Technical Improvements

- **Updated to Angular 17**: Leveraged latest framework features
- **Enhanced State Management**: Better handling of application state
- **Improved Error Handling**: More robust error recovery mechanisms
- **Added Interceptors**: Centralized HTTP request/response handling
- **Optimized Asset Loading**: Improved performance with lazy loading

## Installation and Setup

### Prerequisites

- Node.js 16.x or later
- npm 8.x or later
- Python 3.8 or later
- MongoDB 4.4 or later
- Git

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/ggogogohub/eBay-Used-Cars.git

# Navigate to the frontend directory
cd ebay_used_cars/frontend

# Install dependencies
npm install

# Start the development server
ng serve
```

### Backend Setup

```bash
# Navigate to the backend directory
cd ../backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Import MongoDB dataset (from project root directory)
cd ..
mongoimport --uri="mongodb://localhost:27017/ebay_used_cars" --collection=users --file="MongoDB Exported/ebay_used_cars.users.json" --jsonArray
mongoimport --uri="mongodb://localhost:27017/ebay_used_cars" --collection=listings --file="MongoDB Exported/ebay_used_cars.listings.json" --jsonArray

# Return to backend directory and start the server
cd backend
python app.py
```

### Environment Configuration

1. Create a `.env` file in the backend directory with the following variables:

   ```
   MONGODB_URI=mongodb://localhost:27017/ebay_used_cars
   MONGODB_DB=ebay_used_cars
   SECRET_KEY=mysecret
   SENDGRID_API_KEY=your_sendgrid_api_key
   FROM_EMAIL=your_verified_email@example.com
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   DEBUG=True
   PORT=5001
   FRONTEND_URL=http://localhost:4200
   ```

2. Configure Auth0 in the frontend:
   - Update the Auth0 configuration in `app.config.ts` with your Auth0 domain and client ID

## Testing

### API Testing with Postman

1. Import the provided Postman collection
2. Set up environment variables:
   - `baseURL`: http://localhost:5001
   - `jwt-token-user`: (will be automatically set after login)
   - `jwt-token-admin`: (will be automatically set after admin login)
3. Run the collection to test all API endpoints

### Frontend Testing

1. Navigate to http://localhost:4200 in your browser
2. Use the test accounts provided in the [Test User Accounts](#test-user-accounts) section
3. Test user flows:
   - Login with different user roles (admin, seller, buyer)
   - Browsing and filtering listings
   - Creating and managing listings (seller accounts)
   - Adding and managing reviews (buyer accounts)
   - Administrative functions (admin account)
   - Profile management

## Academic Reflection

This project demonstrates proficiency in several key areas of modern web development:

1. **Full-Stack Integration**: Successfully implemented and integrated both frontend and backend components to create a cohesive application.

2. **Security Implementation**: Applied industry best practices for authentication, authorization, and data protection.

3. **Database Design**: Designed an efficient NoSQL database schema with appropriate relationships and indexing.

4. **Third-Party Integration**: Successfully integrated multiple external services to enhance application functionality.

5. **Responsive Design**: Implemented a fully responsive design that works across different devices and screen sizes.

6. **User Experience**: Created an intuitive and user-friendly interface with appropriate feedback mechanisms.

7. **Code Organization**: Maintained clean, modular, and well-documented code throughout the project.

8. **Problem Solving**: Overcame various technical challenges, particularly in the areas of authentication and image handling.

## Future Enhancements

1. **Real-Time Chat**: Implement a messaging system for buyers and sellers
2. **Advanced Search**: Add more sophisticated search capabilities with filters
3. **Payment Integration**: Add payment processing for direct purchases
4. **Notification System**: Implement email and in-app notifications
5. **User Verification**: Add identity verification for enhanced trust
6. **Analytics Dashboard**: Provide sellers with insights about their listings
7. **Mobile Application**: Develop native mobile applications for iOS and Android
8. **Internationalization**: Add support for multiple languages and currencies

## References

1. Angular Documentation: https://angular.io/docs
2. Flask Documentation: https://flask.palletsprojects.com/
3. MongoDB Documentation: https://docs.mongodb.com/
4. JWT Authentication: https://jwt.io/introduction/
5. Cloudinary Documentation: https://cloudinary.com/documentation
6. SendGrid Documentation: https://docs.sendgrid.com/
7. Leaflet Maps Documentation: https://leafletjs.com/reference.html
8. Auth0 Documentation: https://auth0.com/docs/
9. OWASP Security Best Practices: https://owasp.org/www-project-top-ten/
10. Responsive Web Design Principles: https://web.dev/responsive-web-design-basics/

---

© 2025 eBay Used Cars Marketplace. This project was developed for academic purposes as part of assignment for the Full Stack Web Development module at Ulster University.
"# eBay-Used-Cars"
