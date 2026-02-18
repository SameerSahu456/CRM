# Comprint CRM

A full-stack CRM (Customer Relationship Management) application built with FastAPI (Python) backend and React (TypeScript) frontend.

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - Async ORM with PostgreSQL
- **Alembic** - Database migrations
- **Poetry** - Dependency management
- **Python 3.11+**

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons

### Database
- **PostgreSQL** - Primary database

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Poetry** (Python package manager)

---

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd CRM
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb comprint_crm
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
poetry install

# Copy environment file
cp .env.example .env  # or create .env manually

# Run migrations
poetry run alembic upgrade head

# Seed database (optional)
poetry run python scripts/seed_data.py

# Start backend server
poetry run python run.py
```

Backend runs at: `http://localhost:3002`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file (optional)
cp .env.example .env

# Edit .env if your backend runs on a different port
# VITE_API_URL=http://localhost:YOUR_PORT

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

> **Note:** If your backend runs on a port other than 3002, set `VITE_API_URL` in `frontend/.env`

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/comprint_crm

# Security
SECRET_KEY=your-secret-key-change-in-production

# CORS (comma-separated origins)
CORS_ORIGINS_STR=http://localhost:3000,http://localhost:5173

# Debug mode
DEBUG=false

# File uploads
UPLOAD_DIR=uploads
BASE_URL=http://localhost:3002
```

### Frontend (`frontend/.env`) - Optional

```env
# Backend API URL (if different from default port 3002)
VITE_API_URL=http://localhost:3002

# Gemini API Key (optional - for AI features)
GEMINI_API_KEY=your-api-key-here
```

> **Note:** The frontend `.env` is optional. By default, the API proxies to `http://localhost:3002`. Set `VITE_API_URL` if your backend runs on a different port.

---

## Project Structure

```
CRM/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access layer
│   │   └── utils/        # Utilities
│   ├── alembic/          # Database migrations
│   ├── scripts/          # Utility scripts
│   └── pyproject.toml    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── hooks/        # Custom hooks
│   │   ├── contexts/     # React contexts
│   │   └── types/        # TypeScript types
│   └── package.json      # Node dependencies
└── docs/                 # Documentation
```

---

## Common Commands

### Backend

```bash
# Start server
poetry run python run.py

# Run migrations
poetry run alembic upgrade head

# Create new migration
poetry run alembic revision --autogenerate -m "description"

# Seed database
poetry run python scripts/seed_data.py

# Format code
poetry run black .

# Lint code
poetry run ruff check .
```

### Frontend

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Default Login Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@comprint.com | admin123 |
| Manager | manager1@comprint.com | password123 |
| Sales | sales1@comprint.com | password123 |

---

## API Documentation

Once the backend is running, access the interactive API docs at:
- **Swagger UI**: http://localhost:3002/docs
- **ReDoc**: http://localhost:3002/redoc

---

## License

Private - All rights reserved.

