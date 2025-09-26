# AskMate - Q&A Web Application

A complete Q&A web application for classrooms built with React.js, Node.js, Express.js, and MongoDB.

## Features

- **Class-based Groups**: Teachers can create classes with unique codes, students join using codes
- **Q&A System**: Ask questions, provide answers, vote on content
- **File Uploads**: Attach images, PDFs, and documents to questions/answers
- **Search & Filter**: Find questions by keywords or tags
- **User Profiles**: Track activity and manage account
- **Admin Tools**: Teachers can moderate content
- **Real-time Updates**: Modern UI with responsive design

## Tech Stack

### Frontend
- React.js 19 with functional components and hooks
- React Router for navigation
- Axios for API calls
- React Hot Toast for notifications
- React Icons for UI icons
- Date-fns for date formatting
- Custom CSS for styling

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Multer for file uploads
- Express Validator for input validation
- Helmet for security
- CORS for cross-origin requests

## Project Structure

```
AskMate/
├── FrontEnd/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── Server/                  # Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── uploads/            # File uploads directory
│   ├── server.js           # Main server file
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd AskMate
```

### 2. Backend Setup
```bash
cd Server
npm install
```

Create a `.env` file in the Server directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://singlapulkit1103_db_user:pulkit2005@askmate.31u5zre.mongodb.net/
JWT_SECRET=askmate_super_secret_jwt_key_2024_secure_random_string_here
NODE_ENV=development
```

**Quick Setup**: You can also run `npm run create-env` from the root directory to automatically create the .env file.

Start the backend server:
```bash
npm run dev
# or
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd FrontEnd
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Database Setup
Make sure MongoDB is running on your system. The application will automatically create the database and collections when you first run it.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Classes
- `POST /api/classes/create` - Create new class
- `POST /api/classes/join` - Join class with code
- `GET /api/classes` - Get user's classes
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class settings
- `DELETE /api/classes/:id` - Delete class

### Questions
- `GET /api/questions/class/:classId` - Get class questions
- `GET /api/questions/:id` - Get single question
- `POST /api/questions/class/:classId` - Create question
- `PUT /api/questions/:id` - Update question
- `POST /api/questions/:id/vote` - Vote on question
- `DELETE /api/questions/:id` - Delete question

### Answers
- `GET /api/answers/question/:questionId` - Get question answers
- `POST /api/answers/question/:questionId` - Create answer
- `PUT /api/answers/:id` - Update answer
- `POST /api/answers/:id/vote` - Vote on answer
- `POST /api/answers/:id/accept` - Accept answer
- `DELETE /api/answers/:id` - Delete answer

## Usage

### For Teachers
1. Sign up with a teacher account
2. Create a new class
3. Share the 6-character class code with students
4. Manage class settings and moderate content
5. Answer questions and help students

### For Students
1. Sign up with a student account
2. Join classes using the class code
3. Ask questions and provide answers
4. Vote on helpful content
5. Upload files with questions/answers

## File Uploads

The application supports file uploads for:
- Images (JPEG, PNG, GIF, WebP)
- PDFs
- Office documents (Word, Excel, PowerPoint)
- Text files

Maximum file size: 10MB per file
Maximum files per upload: 5

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- File type and size validation
- Rate limiting
- CORS protection
- Helmet security headers

## Deployment

### Backend (Render/Heroku)
1. Set environment variables in your hosting platform
2. Connect to MongoDB Atlas or your cloud database
3. Deploy the Server folder

### Frontend (Netlify/Vercel)
1. Build the frontend: `npm run build`
2. Deploy the dist folder
3. Update API base URL in the frontend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
