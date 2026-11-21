# SplitEase 💸

SplitEase is a full-stack expense-sharing application designed to make splitting group expenses simple and transparent.

Users can create accounts, create expense groups, add members, record shared expenses, split expenses among multiple users, and view calculated balances.

## 🌐 Live Application

**Frontend:**  
https://splitease-lemon.vercel.app/

**Backend API:**  
https://splitease-backend-tcra.onrender.com/

**Swagger API Documentation:**  
https://splitease-backend-tcra.onrender.com/docs

---

## ✨ Features

- User registration and login
- JWT-based authentication
- Create and manage expense groups
- Add registered users to groups
- Record shared expenses
- Split expenses equally among multiple members
- Support for 2, 4, 5, 7, 10 or more participants
- Automatic balance calculation
- Expense history
- Responsive desktop and mobile interface
- Success and error feedback states
- Centralized frontend API configuration
- Public frontend and backend deployment
- Automated frontend CI using GitHub Actions

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Fetch API

### Backend

- FastAPI
- Python
- SQLAlchemy
- SQLite
- JWT Authentication
- Uvicorn

### DevOps & Deployment

- Git
- GitHub
- GitHub Actions
- Docker
- Render
- Vercel

---

## 🏗️ Architecture

```text
User
  │
  ▼
SplitEase Frontend
React + Vite
Vercel
  │
  │ HTTPS / REST API
  ▼
FastAPI Backend
Render
  │
  ▼
Database
```

---

## 🔐 Authentication Flow

```text
Register / Login
       │
       ▼
FastAPI Authentication API
       │
       ▼
JWT Access Token
       │
       ▼
Token stored by frontend
       │
       ▼
Authenticated API Requests
```

---

## 💰 Expense Splitting Flow

```text
Create Group
     │
     ▼
Add Members
     │
     ▼
Create Expense
     │
     ▼
Select Participant User IDs
     │
     ▼
Equal Split Calculation
     │
     ▼
Expense Saved
     │
     ▼
Balances Recalculated
```

Example:

```text
Expense: ₹1000

Participants:
User #3
User #4

Split:
User #3 → ₹500
User #4 → ₹500
```

The application can also split expenses between multiple users.

Example:

```text
₹5000 / 5 users

User #3 → ₹1000
User #4 → ₹1000
User #5 → ₹1000
User #6 → ₹1000
User #7 → ₹1000
```

---

## 🚀 Running SplitEase Locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd expense-splitter
```

### 2. Start the Backend

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
python -m uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

## 💻 Start the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173/
```

---

## 🐳 Docker

The backend contains a Dockerfile for containerized deployment.

The application starts FastAPI using Uvicorn and supports the dynamic `PORT` environment variable used by cloud deployment platforms.

---

## ⚙️ CI/CD

SplitEase uses GitHub Actions for frontend Continuous Integration.

Whenever frontend code is pushed to the configured branch, GitHub Actions automatically:

```text
Checkout Repository
        │
        ▼
Setup Node.js
        │
        ▼
Install Dependencies
npm ci
        │
        ▼
Build React Frontend
npm run build
        │
        ▼
Build Success / Failure
```

This helps detect frontend build problems before deployment.

---

## ☁️ Deployment

### Frontend

The React/Vite frontend is deployed using **Vercel**.

https://splitease-lemon.vercel.app/

### Backend

The FastAPI backend is containerized using Docker and deployed using **Render**.

https://splitease-backend-tcra.onrender.com/

### API Documentation

FastAPI automatically provides Swagger documentation:

https://splitease-backend-tcra.onrender.com/docs

---

## 📱 QR Code

A QR code can be used to directly access the live SplitEase application from a mobile device.

Live application:

https://splitease-lemon.vercel.app/

---

## 📂 Project Structure

```text
expense-splitter/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── frontend-ci.yml
│
├── backend/
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js
│   │   │
│   │   ├── components/
│   │   │   ├── AddMember.jsx
│   │   │   ├── SplitExpense.jsx
│   │   │   ├── SplitExpense.css
│   │   │   ├── StatusMessage.jsx
│   │   │   └── StatusMessage.css
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── responsive.css
│   │
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🎯 Project Objective

The objective of SplitEase is to demonstrate the development and deployment of a modern full-stack application while applying DevOps practices including:

- Version control with Git and GitHub
- Atomic commits
- Branch-based development
- Continuous Integration
- Docker containerization
- Cloud deployment
- API integration
- Production frontend/backend communication

---

## 🔮 Future Improvements

Possible future enhancements include:

- Member selection by name instead of User ID
- Group member list API
- Custom percentage or unequal splits
- Expense editing and deletion
- Settlement tracking
- Group invitations
- User profile management
- Improved analytics and charts

---

## 📌 Project Status

**SplitEase is live and functional.**

Frontend, backend, authentication, group management, multi-user expense splitting, CI, responsive design, and cloud deployment are operational.