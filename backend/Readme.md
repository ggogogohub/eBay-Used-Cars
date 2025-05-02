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

   # Navigate to the project directory
   cd ebay_used_cars
   ```

2. **Install Backend Dependencies**:

   ```bash
   # Navigate to the backend directory
   cd backend

   # Install Python dependencies
   pip install -r requirements.txt
   ```

3. **Configure Your Database**:

   ```bash
   # Make sure MongoDB is running on your system (default: localhost:27017)

   # Import the provided dataset (from project root directory)
   cd ..
   mongoimport --uri="mongodb://localhost:27017/ebay_used_cars" --collection=users --file="MongoDB Exported/ebay_used_cars.users.json" --jsonArray
   mongoimport --uri="mongodb://localhost:27017/ebay_used_cars" --collection=listings --file="MongoDB Exported/ebay_used_cars.listings.json" --jsonArray

   # Return to backend directory
   cd backend
   ```

4. **Set Up Environment Variables**:

   ```bash
   # Create a .env file in the backend directory
   echo "MONGODB_URI=mongodb://localhost:27017/ebay_used_cars
   SECRET_KEY=mysecret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   SENDGRID_API_KEY=your_sendgrid_key
   FROM_EMAIL=your_verified_email@example.com" > .env
   ```

5. **Start the API Server**:

   ```bash
   python app.py
   ```

6. **Access the API**:
   The API will be available at `http://localhost:5001`

7. **Test with Provided Accounts**:
   You can use the test accounts listed in the "Database Management" section below.

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

### Using the Provided Dataset

This project comes with pre-exported MongoDB data in the `MongoDB Exported` directory:

- `ebay_used_cars.users.json`: Contains user accounts with roles (admin, seller, buyer)
- `ebay_used_cars.listings.json`: Contains car listings with details, images, and reviews

#### Importing the Dataset

To import the provided dataset into your MongoDB instance:

```bash
# Navigate to the project root directory
cd /path/to/ebay_used_cars

# Import users collection
mongoimport --uri="mongodb://localhost:27017/ebay_used_cars" --collection=users --file="MongoDB Exported/ebay_used_cars.users.json" --jsonArray

# Import listings collection
mongoimport --uri="mongodb://localhost:27017/ebay_used_cars" --collection=listings --file="MongoDB Exported/ebay_used_cars.listings.json" --jsonArray
```

> **Note**: The `--jsonArray` flag is important as the export files are in JSON array format.

#### Test User Accounts

After importing the dataset, you can use these test accounts:

| Username         | Password  | Role   |
| ---------------- | --------- | ------ |
| admin@cars.com   | admin123  | admin  |
| seller@cars.com  | seller123 | seller |
| buyer@cars.com   | buyer123  | buyer  |
| seller2@cars.com | seller123 | seller |
| buyer2@cars.com  | buyer123  | buyer  |

### Exporting Your Data

To export your MongoDB data for backup or migration:

```bash
# Export users collection
mongoexport --uri="mongodb://localhost:27017/ebay_used_cars" --collection=users --out=users.json --jsonArray

# Export listings collection
mongoexport --uri="mongodb://localhost:27017/ebay_used_cars" --collection=listings --out=listings.json --jsonArray

# Export other collections as needed
```

### Troubleshooting MongoDB Import/Export

If you encounter issues with the import/export commands:

1. **MongoDB Tools Installation**: Ensure you have MongoDB Database Tools installed

   ```bash
   # For Windows (using chocolatey)
   choco install mongodb-database-tools

   # For macOS (using Homebrew)
   brew install mongodb/brew/mongodb-database-tools

   # For Ubuntu/Debian
   sudo apt-get install mongodb-database-tools
   ```

2. **Path Issues**: Make sure the MongoDB tools are in your system PATH

3. **Connection Issues**: Verify your MongoDB server is running

   ```bash
   # Check if MongoDB is running
   mongosh
   ```

4. **Database Name**: Ensure you're using the correct database name (`ebay_used_cars`)

---
