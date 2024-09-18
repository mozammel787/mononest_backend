# MONONEST

## Project Overview

This is a basic e-commerce website built using the MERN stack. The project includes user authentication via Firebase, server-side JWT token generation for secure communication, and Stripe integration for payments. Users can browse products, filter based on various criteria, manage their cart, and complete purchases.

## Key Features

1. **Responsive Frontend**:
   - Built with React.js, Tailwind CSS, and DaisyUI.
   - Works well on both mobile and desktop devices.
   - Key pages include:
     - **Home Page**: Displays featured products and store information.
     - **Product Page**: Showcases individual product details with an "Add to Cart" option.
     - **Products Listing Page**: Displays a list of all products with filtering options for categories, price, and ratings.
     - **Cart Page**: Users can view products added to their cart, update quantities, and remove items.
     - **Checkout Page**: Users input shipping details and proceed to payment.

2. **Backend API**:
   - Created using Express.js and Node.js.
   - API endpoints for product management, user management, and order processing.
   - JWT tokens are generated server-side for authenticated routes like cart access and order placement.

3. **Database Integration**:
   - MongoDB (Atlas) is used to store data.
   - Collections:
     - **Users Collection**: Stores user profiles linked to Firebase UIDs.
     - **Products Collection**: Stores product information such as name, description, price, images, and ratings.
     - **Orders Collection**: Stores user orders and links them to products and users.
   - CRUD operations implemented for products and orders.

4. **User Authentication**:
   - Firebase Authentication is used for user sign-up and login.
   - After login, the Firebase UID is used to generate a JWT token on the server.
   - The JWT token is stored on the client-side and used for authenticated requests.

5. **Cart Management**:
   - Users can add products to their cart and manage its contents (Context API or Redux).
   - Cart data persists across page reloads using session storage or local storage.
   - Cart is accessible only by authenticated users.

6. **Payment Integration**:
   - Integrated Stripe API for handling payments during the checkout process.
   - A payment form collects user details, processes the payment, and updates the order status.
   - A confirmation page displays the order details and payment confirmation.

## Technologies Used

### Frontend:
- React.js
- Tailwind CSS & DaisyUI
- Redux Toolkit for state management
- Firebase Authentication
- Stripe for payment integration

### Backend:
- Node.js and Express.js
- MongoDB (Atlas)
- JWT for authentication
- Firebase Authentication

### Deployment:
- Frontend: Vercel
- Backend: Render

## Link

### Live Link
- Frontend: [mononest](https://mononest.vercel.app/)
- Backend: [mononest-backend](https://mononest-backend.onrender.com)

### Repo Link
- Frontend: [mononest](https://github.com/mozammel787/MONONEST)
- Backend: [mononest-backend](https://github.com/mozammel787/mononest_backend)

## Installation and Setup

1. Clone the Frontend repository:

   ```bash
   git clone https://github.com/mozammel787/MONONEST.git

2. Clone the Backend repository:

   ```bash
   git clone https://github.com/mozammel787/mononest_backend.git

