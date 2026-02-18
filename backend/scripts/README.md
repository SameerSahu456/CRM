# Backend Scripts

## Seed Data Script

The `seed_data.py` script populates the database with comprehensive test data for development and testing.

### Prerequisites

1. **PostgreSQL database** must be running
2. **Database created**: `comprint_crm`
3. **Migrations applied**: Run `alembic upgrade head` first

### How to Run

From the `backend` directory:

```bash
poetry run python scripts/seed_data.py
```

Or from the project root:

```bash
cd backend && poetry run python scripts/seed_data.py
```

### What Gets Created

| Entity | Count | Description |
|--------|-------|-------------|
| Users | 20 | Admin, managers, sales reps, support, presales |
| Products | 15 | Printers, toners, ink, accessories, services |
| Partners | 15 | Resellers, distributors, integrators |
| Accounts | 50 | Companies across various industries |
| Contacts | 100 | Business contacts linked to accounts |
| Leads | 80 | Sales leads at various stages |
| Deals | 60 | Deals at different pipeline stages |
| Tasks | 100 | Follow-ups, calls, meetings, demos |
| Sales Entries | 50 | Historical sales records |
| Calendar Events | 40 | Meetings, calls, trainings |
| Email Templates | 10 | Common email templates |

### Login Credentials

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@comprint.com` | `admin123` |
| Manager | `manager1@comprint.com` | `password123` |
| Sales | `sales1@comprint.com` | `password123` |
| Support | `support1@comprint.com` | `password123` |
| Presales | `presales1@comprint.com` | `password123` |

### Notes

- **Clears existing data**: The script will delete all existing data before seeding
- **Safe to re-run**: You can run the script multiple times
- **Random data**: Names, values, and dates are randomly generated each time

### Troubleshooting

**Database connection error:**
Check your `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/comprint_crm
```

**Migration errors:**
Run migrations first:
```bash
poetry run alembic upgrade head
```

