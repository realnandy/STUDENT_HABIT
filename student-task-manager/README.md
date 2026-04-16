# Student Task Manager

A full-stack web application for students to manage their tasks, assignments, and deadlines.

## Features

- User registration and login with JWT authentication
- Create, edit, delete tasks
- Track assignments with deadlines
- Organize tasks by subject and priority
- Mark tasks as completed
- Filter and search tasks
- Dark mode toggle
- Task statistics dashboard
- Overdue task highlighting

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)

## Installation

1. Clone or navigate to the project directory:
   ```bash
   cd student-task-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure MongoDB connection:
   
   Create a `.env` file in the root directory (optional, defaults to localhost):
   ```
   MONGO_URI=mongodb://localhost:27017/student_task_manager
   PORT=5000
   JWT_SECRET=your_secret_key
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Project Structure

```
student-task-manager/
├── frontend/
│   ├── index.html          # Login/Signup page
│   ├── dashboard.html      # Main dashboard
│   ├── css/
│   │   └── styles.css      # All styles
│   └── js/
│       ├── auth.js         # Authentication logic
│       └── dashboard.js    # Dashboard functionality
├── backend/
│   ├── server.js           # Express server
│   ├── config/
│   │   └── db.js           # Database connection
│   ├── models/
│   │   ├── User.js         # User model
│   │   └── Task.js         # Task model
│   ├── routes/
│   │   ├── authRoutes.js   # Auth API routes
│   │   └── taskRoutes.js   # Task API routes
│   └── middleware/
│       └── authMiddleware.js # JWT middleware
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats` - Get task statistics

## Usage

1. **Register**: Create a new account on the signup page
2. **Login**: Use your credentials to log in
3. **Add Tasks**: Click "Add New Task" to create tasks with title, description, subject, priority, and deadline
4. **Manage Tasks**: Mark tasks as complete, edit, or delete them
5. **Filter**: Use filters to find tasks by subject, priority, or status
6. **Statistics**: View your task completion statistics on the dashboard
7. **Dark Mode**: Toggle dark mode using the button in the bottom-left corner

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Protected routes require valid JWT token
- Input validation on both frontend and backend

## License

MIT
