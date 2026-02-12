# Role Hierarchy & Access Control

## Role Levels

Comprint CRM implements a hierarchical role-based access control system with the following roles:

### 1. **Superadmin** (Highest Level)
- **Email**: `superadmin@comprint.com`
- **Password**: `superadmin123`
- **Access Level**: Unrestricted access to all features and data
- **View Access**: Both (Pre-Sales + Post-Sales)
- **Permissions**:
  - ✅ Full access to Admin Panel
  - ✅ Create, edit, delete all users
  - ✅ Manage all system settings
  - ✅ Access all modules (Pre-Sales + Post-Sales)
  - ✅ View all data across the organization
  - ✅ Configure system-wide settings
  - ✅ Can switch between Pre-Sales and Post-Sales views
  - ✅ Cannot be restricted by other users

### 2. **Admin**
- **Example Email**: `admin@comprint.com` / `admin@gmail.com`
- **Password**: `admin123` / `1`
- **Access Level**: High-level access with some potential restrictions
- **View Access**: Both (Pre-Sales + Post-Sales) by default
- **Permissions**:
  - ✅ Access to Admin Panel
  - ✅ Create, edit users (except superadmin)
  - ✅ Manage products, partners
  - ✅ Access all modules (Pre-Sales + Post-Sales)
  - ✅ View data across departments
  - ✅ Can switch between Pre-Sales and Post-Sales views
  - ⚠️ May have data restrictions in future updates

### 3. **Business Head**
- **Access Level**: Department-wide access
- **View Access**: Configurable (Pre-Sales, Post-Sales, or Both)
- **Permissions**:
  - ✅ View all data in assigned department
  - ✅ Approve partners
  - ✅ Generate reports
  - ✅ Manage team members
  - ❌ Cannot access Admin Panel

### 4. **Branch Head**
- **Access Level**: Branch-level access
- **View Access**: Configurable (Pre-Sales, Post-Sales, or Both)
- **Permissions**:
  - ✅ View branch data
  - ✅ Manage branch team
  - ✅ Access assigned modules
  - ❌ Cannot access Admin Panel

### 5. **Product Head**
- **Access Level**: Product-focused access
- **View Access**: Typically Post-Sales
- **Permissions**:
  - ✅ Manage product catalog
  - ✅ View sales data for products
  - ✅ Access product-related modules
  - ❌ Cannot access Admin Panel

### 6. **Sales Manager**
- **Access Level**: Team management
- **View Access**: Configurable (Pre-Sales, Post-Sales, or Both)
- **Permissions**:
  - ✅ View team performance
  - ✅ Manage team targets
  - ✅ Access assigned modules
  - ❌ Cannot access Admin Panel

### 7. **Salesperson** (Base Level)
- **Access Level**: Individual contributor
- **View Access**: Assigned by admin (Pre-Sales or Post-Sales)
- **Permissions**:
  - ✅ Access assigned modules only
  - ✅ Manage own leads/sales
  - ✅ View own data
  - ❌ Cannot access Admin Panel
  - ❌ Cannot view other users' data

## Access Matrix

| Feature | Superadmin | Admin | Business Head | Branch Head | Product Head | Sales Manager | Salesperson |
|---------|------------|-------|---------------|-------------|--------------|---------------|-------------|
| **Admin Panel** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User Management** | ✅ Full | ✅ Limited | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Switcher** | ✅ | ✅ | ✅* | ❌ | ❌ | ✅* | ❌ |
| **Pre-Sales Modules** | ✅ | ✅ | ✅* | ✅* | ❌* | ✅* | ✅* |
| **Post-Sales Modules** | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* |
| **All Data Visibility** | ✅ | ✅ | Department | Branch | Product | Team | Own |
| **Settings** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*\* = Based on assigned `view_access` setting*

## View Access Configuration

Each user (except Superadmin who always has "both") can be assigned one of three view access levels:

### **Pre-Sales View**
- CRM / Leads
- Accounts
- Contacts
- Deals
- Common tools (Quote Builder, Tasks, Calendar, etc.)

### **Post-Sales View**
- Sales Entry
- Partners
- Common tools (Quote Builder, Tasks, Calendar, etc.)

### **Both Views**
- All Pre-Sales modules
- All Post-Sales modules
- View switcher to toggle between views
- Dashboard adapts to current view

## Creating Admin Users

### Local Database (Development)

Run the creation script:
```bash
cd backend
python3 create_superadmin.py
```

This creates:
- `superadmin@comprint.com` / `superadmin123`
- `admin@comprint.com` / `admin123`

### Supabase (Production)

Run this SQL in Supabase SQL Editor:

```sql
-- Create Superadmin
INSERT INTO users (email, password_hash, name, role, view_access, is_active)
VALUES (
  'superadmin@comprint.com',
  '<bcrypt_hash_of_password>',
  'Super Administrator',
  'superadmin',
  'both',
  true
)
ON CONFLICT (email) DO UPDATE
SET role = 'superadmin',
    view_access = 'both';

-- Create Admin
INSERT INTO users (email, password_hash, name, role, view_access, is_active)
VALUES (
  'admin@comprint.com',
  '<bcrypt_hash_of_password>',
  'Administrator',
  'admin',
  'both',
  true
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin',
    view_access = 'both';
```

To generate bcrypt hash:
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("your_password_here"))
```

## Role Assignment Best Practices

1. **Superadmin**: Limit to 1-2 users (system administrators only)
2. **Admin**: Assign to department heads and senior management
3. **Business Head**: Assign to team leaders managing multiple branches
4. **Branch Head**: Assign to location/branch managers
5. **Product Head**: Assign to product managers
6. **Sales Manager**: Assign to team supervisors
7. **Salesperson**: Assign to individual contributors

## View Access Assignment Guidelines

| Role | Recommended View Access |
|------|------------------------|
| Superadmin | Both (automatic) |
| Admin | Both |
| Business Head | Both |
| Branch Head | Both |
| Product Head | Post-Sales |
| Sales Manager | Pre-Sales or Both (based on responsibility) |
| Salesperson | Pre-Sales or Post-Sales (based on job function) |

## Security Notes

### Superadmin Protection
- Superadmin role should be assigned to technical administrators only
- Use strong passwords (minimum 12 characters)
- Enable 2FA if implemented
- Regularly audit superadmin actions
- Cannot be deleted or modified by admin users

### Admin Limitations (Future Enhancement)
While currently admins have similar access to superadmins, future updates may include:
- IP restrictions for admin accounts
- Time-based access controls
- Mandatory 2FA for admins
- Audit logging for admin actions
- Data export restrictions

### Role Change Restrictions
- Only superadmin can change user roles to superadmin
- Only superadmin can delete admin users
- Admins can manage all other user types

## Default Credentials Summary

| Email | Password | Role | View Access | Purpose |
|-------|----------|------|-------------|---------|
| superadmin@comprint.com | superadmin123 | superadmin | both | System Administration |
| admin@comprint.com | admin123 | admin | both | General Administration |
| admin@gmail.com | 1 | admin | both | Legacy Admin (for testing) |

**⚠️ Important**: Change all default passwords immediately in production!

## Testing Role Hierarchy

1. **Test Superadmin Access**:
   - Login as superadmin@comprint.com
   - Verify access to all modules
   - Check Admin Panel access
   - Test user creation/deletion

2. **Test Admin Access**:
   - Login as admin@comprint.com
   - Verify access to Admin Panel
   - Test creating users with different roles

3. **Test View Switcher**:
   - Login as superadmin or admin
   - Locate view switcher in sidebar
   - Toggle between Pre-Sales and Post-Sales
   - Verify navigation menu updates

4. **Test Regular User Access**:
   - Create a salesperson with Pre-Sales access
   - Login and verify only Pre-Sales modules visible
   - Verify Admin Panel is not accessible

---

**Last Updated**: 2026-02-10
**Version**: 1.0
