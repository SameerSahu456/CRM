# Zenith CRM

A modern Customer Relationship Management system built with React, TypeScript, and FastAPI.

## Features

### Core Modules
- **Dashboard** - Overview of key metrics, pipeline summary, and recent activities
- **Leads** - Track and manage potential customers with scoring and status tracking
- **Contacts** - Manage contact information with detailed profiles
- **Accounts** - Company/organization management with health scores
- **Deals/Pipeline** - Visual pipeline management with drag-and-drop stages
- **Tasks** - Task management with assignments and due dates
- **Calendar** - Event scheduling and meeting management
- **Email** - Email composition and tracking
- **Reports** - Analytics and reporting dashboards

### User Management
- **Users** - Team member management with pagination and search
- **Roles & Permissions** - Role-based access control (RBAC)
- Admin, Sales Manager, Sales Rep, Marketing, and Support roles

### Additional Features
- Dark/Light theme support
- Responsive design for mobile and desktop
- User authentication with JWT

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Python FastAPI + SQLAlchemy async + Pydantic v2
- **Database**: PostgreSQL

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zenith-crm.git
cd zenith-crm
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Set up the database:
```bash
# Create the database and tables
psql -U postgres -f backend/scripts/init_db.sql
```

5. Configure the backend:

Edit `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/zenith_crm
SECRET_KEY=your-secret-key
```

6. Start the backend server:
```bash
cd backend
python run.py
```

7. Start the frontend dev server (in a separate terminal):
```bash
npm run dev
```

## Project Structure

```
zenith-crm/
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/v1/        # API endpoints
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── repositories/  # Data access layer
│   │   ├── services/      # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   ├── main.py        # FastAPI app
│   │   ├── config.py      # Settings
│   │   └── database.py    # DB connection
│   ├── scripts/
│   │   └── init_db.sql    # Database init script
│   ├── requirements.txt
│   ├── .env
│   └── run.py             # Uvicorn entry point
├── components/            # React components
├── contexts/              # React contexts
├── services/              # API service layer
│   └── api.ts
├── App.tsx               # Main app component
├── types.ts              # TypeScript type definitions
└── ...
```

## Database Schema

The CRM uses 20 tables across 12 core entities and 8 sub-entity tables:

**Core**: leads, contacts, accounts, deals, tasks, calendar_events, tickets, campaigns, emails, notifications, profiles, roles

**Sub-entities**: lead_notes, lead_activities, lead_calls, lead_tasks, email_templates, account_notes, account_activities, account_documents

## API Endpoints

All API endpoints are available at `/api/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | Get all leads |
| POST | `/api/leads` | Create a lead |
| PUT | `/api/leads/{id}` | Update a lead |
| DELETE | `/api/leads/{id}` | Delete a lead |
| GET | `/api/contacts` | Get all contacts |
| GET | `/api/accounts` | Get all accounts |
| GET | `/api/deals` | Get all deals |
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/profiles` | Get all users |
| GET | `/api/roles` | Get all roles |
| GET | `/api/dashboard/stats` | Get dashboard statistics |
| POST | `/api/auth/login` | Authenticate user |

Full API documentation available at `http://localhost:3002/docs` when the backend is running.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software.
