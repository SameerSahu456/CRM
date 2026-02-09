from fastapi import APIRouter

from app.api.v1.endpoints import (
    accounts,
    admin,
    auth,
    calendar_events,
    carepacks,
    contacts,
    dashboard,
    deals,
    email_templates,
    emails,
    leads,
    master_data,
    notifications,
    partners,
    products,
    quotes,
    sales_entries,
    settings,
    tasks,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(sales_entries.router, prefix="/data/sales-entries", tags=["Sales Entries"])
api_router.include_router(partners.router, prefix="/data/partners", tags=["Partners"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads"])
api_router.include_router(dashboard.router, prefix="/data/dashboard", tags=["Dashboard"])
api_router.include_router(admin.router, prefix="/admin/users", tags=["Admin"])
api_router.include_router(master_data.router, prefix="/data/master", tags=["Master Data"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["Quotes"])
api_router.include_router(carepacks.router, prefix="/carepacks", tags=["Carepacks"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["Contacts"])
api_router.include_router(deals.router, prefix="/deals", tags=["Deals"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(calendar_events.router, prefix="/calendar-events", tags=["Calendar Events"])
api_router.include_router(email_templates.router, prefix="/email-templates", tags=["Email Templates"])
api_router.include_router(emails.router, prefix="/emails", tags=["Emails"])
