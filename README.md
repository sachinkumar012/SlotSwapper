# SlotSwapper

A full-stack web application for swapping time slots between users. Built with React, Node.js, Express, and MongoDB. Deployed on Vercel.

## Features

- User authentication (signup/login)
- Create and manage personal time slots
- Mark slots as swappable
- Browse available swappable slots in the marketplace
- Request swaps with other users
- Accept or reject swap requests
- Real-time status updates

## Tech Stack

- **Frontend:** React, Axios, React Router
- **Backend:** Node.js, Express.js, MongoDB, Mongoose (Serverless functions on Vercel)
- **Authentication:** JWT (JSON Web Tokens)
- **Styling:** CSS
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (cloud instance like MongoDB Atlas)
- npm or yarn
- Vercel CLI (for deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/slotswapper.git
   cd slotswapper
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     MONGO_URI=your_mongodb_atlas_connection_string
     JWT_SECRET=your_jwt_secret_here
     ```

4. Build the frontend:
   ```bash
   npm run build
   ```

## Deployment to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

4. Set environment variables in Vercel dashboard:
   - Go to your project in Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add the following environment variables (set them as plain text, not referencing secrets unless you've created the secrets first):
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A secure secret key for JWT token generation
   - If you prefer to use secrets, first create them in the Secrets section of your Vercel account, then reference them in the environment variables (e.g., `@mongo_uri` for MONGO_URI).

5. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

## Usage

1. Sign up for a new account or log in with existing credentials
2. Create time slots in your dashboard
3. Mark slots as "Swappable" to make them available for others
4. Browse the marketplace to find available slots
5. Request swaps by selecting a slot you want and offering one of yours
6. Check your requests page to manage incoming and outgoing swap requests

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Events
- `GET /api/events` - Get user's events
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### Swaps
- `GET /api/swaps/swappable-slots` - Get all swappable slots
- `POST /api/swaps/swap-request` - Create a swap request
- `POST /api/swaps/swap-response/:requestId` - Respond to a swap request
- `GET /api/swaps/incoming` - Get incoming swap requests
- `GET /api/swaps/outgoing` - Get outgoing swap requests

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
