# Comprint CRM

A modern Customer Relationship Management system built with React, TypeScript, and Supabase.

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
- Real-time data sync with Supabase
- User authentication

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/comprint-crm.git
cd comprint-crm
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

Run the SQL schema in your Supabase SQL Editor:
- Execute `supabase/complete-schema.sql` to create all tables and seed data

5. Start the development server:
```bash
npm run dev
```

### Deployment

Deploy to Vercel:
```bash
npx vercel --prod
```

Make sure to add environment variables in Vercel:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Project Structure

```
comprint-crm/
├── api/                    # Vercel serverless API functions
│   └── index.js           # Main API handler
├── components/            # React components
│   ├── Dashboard.tsx
│   ├── LeadsTable.tsx
│   ├── ContactsTable.tsx
│   ├── AccountsTable.tsx
│   ├── Pipeline.tsx
│   ├── TasksView.tsx
│   ├── CalendarView.tsx
│   ├── EmailView.tsx
│   ├── ReportsView.tsx
│   ├── SettingsView.tsx
│   └── ...
├── contexts/              # React contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NavigationContext.tsx
├── services/              # API service layer
│   └── api.ts
├── supabase/              # Database schemas
│   ├── complete-schema.sql
│   └── schema.sql
├── App.tsx               # Main app component
├── types.ts              # TypeScript type definitions
└── ...
```

## Database Schema

The CRM uses the following main tables:
- `leads` - Lead/prospect information
- `contacts` - Contact details
- `accounts` - Company/organization data
- `deals` - Sales opportunities
- `tasks` - Task management
- `calendar_events` - Calendar entries
- `tickets` - Support tickets
- `campaigns` - Marketing campaigns
- `emails` - Email records
- `profiles` - User profiles
- `roles` - Role definitions with permissions

## API Endpoints

All API endpoints are available at `/api/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | Get all leads |
| POST | `/api/leads` | Create a lead |
| PUT | `/api/leads/:id` | Update a lead |
| DELETE | `/api/leads/:id` | Delete a lead |
| GET | `/api/contacts` | Get all contacts |
| GET | `/api/accounts` | Get all accounts |
| GET | `/api/deals` | Get all deals |
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/profiles` | Get all users |
| GET | `/api/roles` | Get all roles |
| GET | `/api/dashboard/stats` | Get dashboard statistics |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software for Comprint Technologies.

## Live Demo

Visit the live application: [https://comprint-crm.vercel.app](https://comprint-crm.vercel.app)
