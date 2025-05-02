# eBay Used Cars API

Welcome to the eBay Used Cars API documentation. This powerful backend system drives used car marketplace platform, handling everything from user authentication to listing management and reviews.

## 📊 Overview

The eBay Used Cars API is the engine behind used car marketplace, providing all the necessary functionality to create a seamless experience for buyers and sellers. Built with modern technologies and best practices, API ensures security, performance, and reliability.

## 🌟 Key Features

### User Management

- **Secure Authentication**: Multiple authentication methods including traditional username/password and Google integration
- **User Profiles**: Complete user profile management
- **Role-Based Access**: Different capabilities for buyers, sellers, and administrators
- **Account Security**: Password change, reset, and account deletion capabilities

### Listing Management

- **Create & Update Listings**: Full CRUD operations for vehicle listings
- **Advanced Filtering**: Search and filter listings by multiple criteria
- **Status Tracking**: Mark listings as active, sold, or reported
- **Statistics**: Get insights on listing views, prices, and market trends

### Review System

- **User Reviews**: Allow buyers to leave reviews on listings
- **Rating System**: 5-star rating system with text reviews
- **Review Management**: Update or delete reviews as needed

### Administrative Tools

- **Content Moderation**: Tools to manage reported listings
- **User Management**: Administrative capabilities to manage user accounts
- **System Monitoring**: Track system performance and usage

## 🔧 Technical Architecture

Our API is built using a modern tech stack:

- **Framework**: Flask (Python)
- **Database**: MongoDB (NoSQL)
- **Authentication**: JWT (JSON Web Tokens) with refresh token support
- **Security**: CSRF protection, input validation, and password encryption
- **Documentation**: OpenAPI/Swagger specification

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or later
- MongoDB 4.4 or later
- Basic understanding of RESTful APIs

### Quick Start Guide

1. **Set Up Your Environment**:

   ```bash
   # Clone the repository
   git clone <repository-url>

   # Navigate to the backend directory
   cd backend

   ```

2. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Your Database**:
   Make sure MongoDB is running on your system (default: localhost:27017)

4. **Start the API Server**:

   ```bash
   python app.py
   ```

5. **Access the API**:
   The API will be available at `http://localhost:5001`

## 📘 API Documentation

### Authentication Endpoints

| Endpoint                       | Method | Description                       | Access        |
| ------------------------------ | ------ | --------------------------------- | ------------- |
| `/auth/register`               | POST   | Register a new user               | Public        |
| `/auth/login`                  | GET    | Authenticate and get access token | Public        |
| `/auth/login-auth0`            | POST   | Authenticate with Google          | Public        |
| `/auth/profile`                | GET    | Get user profile information      | Authenticated |
| `/auth/logout`                 | GET    | Logout and invalidate token       | Authenticated |
| `/auth/change-password`        | POST   | Change user password              | Authenticated |
| `/auth/request-password-reset` | POST   | Request password reset email      | Public        |
| `/auth/reset-password`         | POST   | Reset password with token         | Public        |
| `/auth/delete`                 | DELETE | Delete user account               | Authenticated |

### Listing Endpoints

| Endpoint                   | Method | Description                     | Access        |
| -------------------------- | ------ | ------------------------------- | ------------- |
| `/listings`                | GET    | Get all listings with filtering | Public        |
| `/listings`                | POST   | Create a new listing            | Sellers       |
| `/listings/{id}`           | GET    | Get a specific listing          | Public        |
| `/listings/{id}`           | PUT    | Update a listing                | Owner         |
| `/listings/{id}`           | DELETE | Delete a listing                | Owner         |
| `/listings/{id}/mark_sold` | PUT    | Mark listing as sold            | Owner         |
| `/listings/{id}/report`    | POST   | Report a listing                | Authenticated |
| `/listings/stats/summary`  | GET    | Get market statistics           | Public        |

### Review Endpoints

| Endpoint                             | Method | Description                   | Access        |
| ------------------------------------ | ------ | ----------------------------- | ------------- |
| `/listings/{id}/reviews`             | GET    | Get all reviews for a listing | Public        |
| `/listings/{id}/reviews`             | POST   | Add a review to a listing     | Authenticated |
| `/listings/{id}/reviews/{review_id}` | PUT    | Update a review               | Owner         |
| `/listings/{id}/reviews/{review_id}` | DELETE | Delete a review               | Admin/Owner   |

### Admin Endpoints

| Endpoint                 | Method | Description                | Access |
| ------------------------ | ------ | -------------------------- | ------ |
| `/admin/listings`        | GET    | Get reported/sold listings | Admin  |
| `/admin/listings/{id}`   | DELETE | Delete a listing           | Admin  |
| `/admin/users`           | GET    | Get all users              | Admin  |
| `/admin/users/{id}`      | DELETE | Delete a user              | Admin  |
| `/admin/users/{id}/role` | PUT    | Update user role           | Admin  |

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication system
- **Password Encryption**: All passwords are securely hashed using bcrypt
- **CSRF Protection**: Protection against cross-site request forgery
- **Input Validation**: Comprehensive validation of all input data
- **Token Blacklisting**: Invalidation of tokens on logout
- **Rate Limiting**: Protection against brute force attacks

## 📊 Data Models

### User

- Username
- Email
- Password (hashed)
- Role (buyer/seller/admin)
- Auth0 ID (for Google authentication)

### Listing

- Vehicle model
- Price
- Mileage
- Location (with coordinates)
- Car type
- Status (active/sold/reported)
- Images
- Views count
- User ID (owner)

### Review

- Rating (1-5)
- Comment
- User ID (reviewer)
- Listing ID
- Timestamp

## 🧪 Testing

**Postman Collection**:

- Import our Postman collection for easy API testing
- Pre-configured requests for all endpoints
- Environment variables for easy configuration

## 📦 Deployment

The API is designed to be easily deployed to various environments:

- **Development**: Local deployment for development and testing
- **Staging**: Pre-production environment for final testing
- **Production**: Scalable deployment for production use

## 🔄 Database Management

### Exporting Data

To export data from MongoDB for backup or migration:

```bash
# Export users collection
mongoexport --uri="mongodb://localhost:27017/automarket" --collection=users --out=users.json

# Export listings collection
mongoexport --uri="mongodb://localhost:27017/automarket" --collection=listings --out=listings.json

# Export other collections as needed
```

### Importing Data

To import existing data:

```bash
# Import users collection
mongoimport --uri="mongodb://localhost:27017/automarket" --collection=users --file=users.json

# Import listings collection
mongoimport --uri="mongodb://localhost:27017/automarket" --collection=listings --file=listings.json
```

---
