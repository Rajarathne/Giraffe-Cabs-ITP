# 🚖 Giraffe Cabs - Cab Services Management System

A comprehensive MERN stack application for managing cab services in Sri Lanka. This system provides both customer and admin interfaces for booking vehicles, managing rentals, and maintaining service records.

## 🌟 Features

### For Customers
- **User Registration & Authentication** - Secure signup and login with role-based access
- **Vehicle Booking** - Book vehicles for various purposes (wedding, airport transfer, daily hire, etc.)
- **Vehicle Rental Requests** - Submit requests to rent out personal vehicles
- **Fleet Viewing** - Browse and filter available vehicles
- **Profile Management** - Update personal information and view rental history

### For Admins
- **Dashboard Overview** - Real-time statistics and analytics
- **Vehicle Management** - Add, edit, delete, and manage vehicle fleet
- **Rental Management** - Approve/reject rental requests and set conditions
- **Service Record Management** - Track vehicle maintenance and service history
- **Booking Management** - Monitor and manage customer bookings
- **Financial Management** - Track revenue and expenses

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling
- **Font Awesome** - Icons

## 📁 Project Structure

```
giraffe-cabs/
├── backend/
│   ├── Controllers/
│   │   ├── authController.js
│   │   ├── vehicleController.js
│   │   ├── rentalController.js
│   │   ├── serviceController.js
│   │   └── bookingController.js
│   ├── Models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Rental.js
│   │   ├── ServiceRecord.js
│   │   └── Booking.js
│   ├── Routes/
│   │   ├── authRoutes.js
│   │   ├── vehicleRoutes.js
│   │   ├── rentalRoutes.js
│   │   ├── serviceRoutes.js
│   │   └── bookingRoutes.js
│   ├── Middleware/
│   │   └── authMiddleware.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.js
│   │   │   ├── LandingPage.css
│   │   │   ├── Home.js
│   │   │   ├── Home.css
│   │   │   ├── AdminDashboard.js
│   │   │   ├── AdminDashboard.css
│   │   │   ├── VehicleList.js
│   │   │   ├── VehicleList.css
│   │   │   └── ProtectedRoute.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd giraffe-cabs
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://Rahal:rTbIif5S6AUYyIcr@cluster0.wrmom9e.mongodb.net/giraffe-cabs
   JWT_SECRET=your_jwt_secret_key_here
   ```

5. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

6. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Usage

### Customer Flow
1. Visit the landing page
2. Sign up for a new account or login
3. Browse available services and vehicles
4. Book a vehicle or submit rental requests
5. Manage profile and view booking history

### Admin Flow
1. Login with admin credentials
2. Access the admin dashboard
3. Manage vehicles, rentals, and service records
4. Monitor bookings and financial data

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create new vehicle (Admin)
- `PUT /api/vehicles/:id` - Update vehicle (Admin)
- `DELETE /api/vehicles/:id` - Delete vehicle (Admin)

### Rentals
- `POST /api/rentals` - Create rental request
- `GET /api/rentals/my-rentals` - Get user's rentals
- `GET /api/rentals/all` - Get all rentals (Admin)
- `PUT /api/rentals/:id/status` - Update rental status (Admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/all` - Get all bookings (Admin)

### Service Records
- `GET /api/services` - Get all service records (Admin)
- `POST /api/services` - Create service record (Admin)
- `PUT /api/services/:id` - Update service record (Admin)
- `DELETE /api/services/:id` - Delete service record (Admin)

## 🎨 Key Features

### Vehicle Management
- Support for multiple vehicle types (vans, buses, cars, bikes, etc.)
- Detailed vehicle information including specifications and pricing
- Image upload support for vehicle photos
- Availability tracking

### Rental System
- Customer can request to rent their vehicles
- Admin approval workflow with conditions and monthly fees
- Status tracking (pending, approved, rejected, active, completed)

### Service Records
- Comprehensive maintenance tracking
- Cost management and reporting
- Service history per vehicle
- Upcoming service alerts

### User Management
- Role-based access control (Customer/Admin)
- Secure authentication with JWT
- Profile management with data validation

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes with middleware
- Input validation and sanitization
- CORS configuration

## 📊 Database Schema

### User Model
- Personal information (name, email, phone, address)
- Role-based access (customer/admin)
- Authentication data

### Vehicle Model
- Vehicle details (number, type, brand, model, year)
- Specifications (capacity, fuel type, transmission)
- Pricing (daily/monthly rates)
- Availability status

### Rental Model
- User and vehicle references
- Rental terms and conditions
- Status tracking and approval workflow
- Financial details

### Service Record Model
- Vehicle maintenance history
- Service details and costs
- Technician and provider information
- Warranty tracking

## 🚀 Deployment

### Backend Deployment
1. Deploy to platforms like Heroku, Railway, or DigitalOcean
2. Set up MongoDB Atlas for production database
3. Configure environment variables
4. Set up SSL certificates

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to platforms like Netlify, Vercel, or AWS S3
3. Configure API endpoints for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact:
- Email: info@giraffecabs.lk
- Phone: +94 11 234 5678

## 🎯 Future Enhancements

- Real-time GPS tracking
- Mobile app development
- Payment integration
- Advanced analytics and reporting
- Multi-language support
- Driver management system
- Route optimization














































































