# View Access & Role-Based Navigation Feature

## Overview

This feature implements role-based access control with **Pre-Sales** and **Post-Sales** views, allowing admins to control which sections of the CRM users can access and switch between views.

## Features Implemented

### 1. **Pre-Sales View**
Users with Pre-Sales access can see:
- Leads (CRM)
- Accounts
- Contacts
- Deals

### 2. **Post-Sales View**
Users with Post-Sales access can see:
- Sales Entry
- Partners

### 3. **Both Views**
Admins and users with "both" access can:
- Switch between Pre-Sales and Post-Sales views
- See all sections
- Access a view switcher dropdown in the navigation

### 4. **Common Sections** (Available in all views)
- Dashboard (adapts based on current view)
- Quote Builder
- Carepack Tracker
- Tasks
- Calendar
- Emails
- Reports
- Settings
- Admin Panel (admin/superadmin only)

## Database Migration

**⚠️ IMPORTANT: Run this SQL on your Supabase database first!**

```sql
-- Migration: Add view_access column to users table

-- Add view_access column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS view_access VARCHAR(50) NOT NULL DEFAULT 'presales';

-- Add check constraint to ensure valid values
ALTER TABLE users
ADD CONSTRAINT check_view_access
CHECK (view_access IN ('presales', 'postsales', 'both'));

-- Set admin users to have 'both' access
UPDATE users
SET view_access = 'both'
WHERE role IN ('admin', 'superadmin');

-- Add comment
COMMENT ON COLUMN users.view_access IS 'Determines which view the user has access to: presales, postsales, or both';
```

## Backend Changes

### 1. **User Model** (`backend/app/models/User.py`)
- Added `view_access` field with values: `presales`, `postsales`, or `both`
- Default: `presales`

### 2. **User Schema** (`backend/app/schemas/UserSchema.py`)
- Updated `UserOut`, `UserCreate`, and `UserUpdate` to include `viewAccess`

## Frontend Changes

### 1. **Types** (`types.ts`)
- Added `viewAccess` field to `User` interface
- Created `ViewAccess` type

### 2. **View Context** (`contexts/ViewContext.tsx`) - NEW
- Manages current view state
- Determines if user can switch views
- Persists view selection in localStorage

### 3. **View Switcher Component** (`components/ViewSwitcher.tsx`) - NEW
- Dropdown to switch between Pre-Sales and Post-Sales views
- Only visible to users with "both" access or admins
- Shows view descriptions

### 4. **Sidebar** (`components/Sidebar.tsx`)
- Updated navigation items with view assignments
- Filters nav items based on current view
- Includes ViewSwitcher component
- Reorganized sections: Overview, Pre-Sales, Post-Sales, Tools, System

### 5. **App** (`App.tsx`)
- Added `ViewProvider` to the context provider chain

### 6. **Admin Page** (`components/AdminPage.tsx`)
- Added "View Access" dropdown in user creation/edit form
- Options:
  - Pre-Sales (Leads, Accounts, Contacts, Deals)
  - Post-Sales (Sales Entry, Partners)
  - Both (All Features)

## How to Use

### For Admins:

1. **Assign View Access to Users:**
   - Go to Admin Panel
   - Create or edit a user
   - Select "View Access" dropdown:
     - **Pre-Sales**: User only sees leads, accounts, contacts, deals
     - **Post-Sales**: User only sees sales entry, partners
     - **Both**: User can switch between views

2. **Switch Views (Admins):**
   - Look for the view switcher dropdown in the sidebar (below the logo)
   - Click to select Pre-Sales or Post-Sales view
   - Navigation menu updates automatically
   - Selection is saved and persists across sessions

### For Regular Users:

- Users see only the sections assigned to their view access
- No view switcher if they only have one view
- Dashboard adapts to show relevant metrics for their view

## View Assignments

| View Access  | Navigation Items Visible |
|--------------|-------------------------|
| **presales** | Dashboard, CRM/Leads, Accounts, Contacts, Deals, Tools, Settings |
| **postsales** | Dashboard, Sales Entry, Partners, Tools, Settings |
| **both** | All items + View Switcher to toggle |

## Technical Details

### View Filtering Logic (`Sidebar.tsx`)
```typescript
const filteredItems = navItems.filter(item => {
  // Filter by role
  if (item.roles && user) {
    if (!item.roles.includes(user.role)) return false;
  }

  // Filter by view
  if (item.view) {
    if (item.view === 'both') return true;
    return item.view === currentView;
  }

  return true;
});
```

### Navigation Item Structure
```typescript
interface NavItem {
  id: NavigationItem;
  label: string;
  icon: React.ReactNode;
  section: string;
  roles?: string[];
  view?: 'presales' | 'postsales' | 'both';
}
```

## Testing Checklist

- [ ] Run database migration on Supabase
- [ ] Create test users with different view access levels
- [ ] Verify Pre-Sales user only sees Pre-Sales sections
- [ ] Verify Post-Sales user only sees Post-Sales sections
- [ ] Verify admin can switch between views
- [ ] Verify view selection persists after refresh
- [ ] Test creating/editing users with view access in Admin Panel
- [ ] Verify navigation filters correctly based on view

## Future Enhancements (Optional)

- Dashboard widgets that adapt based on current view
- View-specific reports
- Permission-based actions within sections
- Audit log for view switches

## File Changes Summary

**New Files:**
- `contexts/ViewContext.tsx` - View state management
- `components/ViewSwitcher.tsx` - View switcher dropdown
- `backend/add_view_access_migration.sql` - Database migration
- `VIEW_ACCESS_FEATURE_GUIDE.md` - This guide

**Modified Files:**
- `backend/app/models/User.py` - Added view_access field
- `backend/app/schemas/UserSchema.py` - Added viewAccess to schemas
- `types.ts` - Added viewAccess to User interface
- `components/Sidebar.tsx` - View filtering and switcher
- `App.tsx` - Added ViewProvider
- `components/AdminPage.tsx` - View access dropdown in user form

---

**Ready to Deploy!** 🚀

Next steps:
1. Run the database migration on Supabase
2. Deploy to Vercel
3. Test with different user accounts
