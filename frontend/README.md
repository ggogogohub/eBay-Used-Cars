# eBay Used Cars Frontend

Welcome to eBay Used Cars, a modern web application designed to revolutionize how people buy and sell used cars online. This document provides an overview of the frontend portion of our platform.

## 🚗 What is eBay Used Cars?

eBay Used Cars is a user-friendly online marketplace that connects car sellers with potential buyers. This platform offers a seamless experience for browsing, buying, and selling used vehicles with features like detailed listings, user reviews, and secure authentication.

## ✨ Key Features

### For Buyers

- **Intuitive Search & Filtering**: Find your perfect car by make, model, price range, or location
- **Detailed Vehicle Information**: View comprehensive details including photos, specifications, and pricing
- **User Reviews**: Read authentic reviews from other users before making a decision
- **Save Favorites**: Keep track of vehicles you're interested in

### For Sellers

- **Easy Listing Creation**: List your vehicle with a simple, guided process
- **Listing Management**: Edit, update, or mark your listings as sold
- **Profile Dashboard**: Track views and manage all your listings in one place
- **Secure Communication**: Connect with potential buyers safely

### For All Users

- **Secure Authentication**: Register and login with traditional credentials or Google account
- **User Profiles**: Manage your personal information and password
- **Responsive Design**: Enjoy a seamless experience on any device - desktop, tablet, or mobile
- **Real-time Notifications**: Stay informed with toast notifications for all actions

## 🔧 Technical Overview

The frontend is built with modern web technologies:

- **Framework**: Angular 17+
- **UI Components**: Custom-designed components with Bootstrap integration
- **State Management**: Angular services with RxJS
- **Authentication**: JWT-based authentication with refresh token support
- **Maps Integration**: Interactive location maps for listings
- **Image Handling**: Cloudinary integration for image uploads and optimization

## 🚀 Getting Started

### For Developers

1. **Prerequisites**:

   - Node.js 16.x or later
   - npm 8.x or later
   - Angular CLI 17.x

2. **Installation**:

   ```bash
   # Clone the repository
   git clone https://github.com/ggogogohub/eBay-Used-Cars.git

   # Navigate to the frontend directory
   cd directory-path/frontend

   # Install dependencies
   npm install

   # Start the development server
   ng serve
   ```

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:4200`

## 🔄 Integration with Backend

The frontend communicates with a robust backend API to handle data processing, authentication, and business logic. The backend runs on `http://localhost:5001` during development.

## 📱 Responsive Design

This application is designed to work flawlessly across all devices:

- **Desktop**: Full-featured experience with advanced filtering and detailed views
- **Tablet**: Optimized layouts for medium-sized screens
- **Mobile**: Touch-friendly interface with essential features for on-the-go access

## 🛠️ Project Structure

```
frontend/
├── src/
│   ├── app/                  # Application components
│   │   ├── homeComponent/    # Home page
│   │   ├── navComponent/     # Navigation bar
│   │   ├── listingsComponent/# Car listings and details
│   │   ├── authComponent/    # Authentication screens
│   │   ├── userProfileComponent/ # User profile management
│   │   └── reviewComponent/  # Review system
│   ├── services/             # API communication services
│   ├── assets/               # Static assets (images, icons)
│   └── styles/               # Global styles
└── angular.json              # Angular configuration
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **Input Validation**: Comprehensive form validation
- **Secure Password Handling**: Proper encryption and storage

## 🏗️ Building for Production

```bash
# Generate optimized production build
npm run build

# The compiled application will be in the dist/ directory
```

---

THANK YOU FOR VISITING THE eBay Used Cars FRONTEND DOCUMENTATION!
