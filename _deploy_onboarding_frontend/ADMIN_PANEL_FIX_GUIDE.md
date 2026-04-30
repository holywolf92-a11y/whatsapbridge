# Admin Panel Visibility Fix

## Problem
The Admin Panel button was not visible in the sidebar even after admin login, because the admin user's Supabase account didn't have the `role: 'admin'` metadata set.

## Solution Applied
1. **Updated Supabase Admin Metadata** ✅
   - The admin user (admin@falisha.com) now has `role: 'admin'` in their Supabase user_metadata
   - This was done by running the Node.js script: `seed-admin-role.js`

2. **Added Backend Seed Endpoint** ✅
   - New endpoint added: `POST /api/auth/seed-admin`
   - Located in: `backend/src/routes/auth.ts`
   - This endpoint can update existing admin users or create new ones with proper role metadata
   - Automatically spreads existing metadata to avoid data loss

## How It Works
The Admin Panel visibility checks for: `user.role === 'Admin'`

The role is derived from Supabase user_metadata.role:
- If metadata has `role: 'admin'` → becomes `'Admin'` (capitalized)
- The admin check then passes, and the button appears

## What You Need to Do

### Step 1: Test the Fix
1. **Log Out** - Click the logout button or clear your session
2. **Log Back In** - Use credentials:
   - Email: `admin@falisha.com`
   - Password: `admin123`
3. **Verify** - You should now see the **"Admin Panel"** button in the SYSTEM section of the sidebar (with a shield icon ⭐)

### Step 2: Use the Admin Panel
Once logged in as admin, click the Admin Panel button to access:
- **List Employees** - View all registered employees
- **Create Employee** - Add new employee accounts
- **Manage Access** - Change passwords or delete employee accounts

## Technical Details

### Files Changed
- `backend/src/routes/auth.ts` - Added `POST /api/auth/seed-admin` endpoint

### New Endpoint
```
POST /api/auth/seed-admin
Content-Type: application/json
```

**Response:**
```json
{
  "message": "Admin user updated with admin role",
  "user": {
    "id": "59317c93-1160-4295-8cff-360fcb14f400",
    "email": "admin@falisha.com",
    "role": "admin"
  }
}
```

### If You Need to Re-run the Seed Admin Script
```bash
cd backend
node seed-admin-role.js
```

## Troubleshooting

### Admin Panel Still Not Showing?
1. **Clear Browser Cache**: Press Ctrl+Shift+Delete and clear all cache
2. **Hard Refresh**: Press Ctrl+Shift+R to force refresh the page
3. **Re-login**: Log out completely and log back in

### Still Issues?
Check browser console (F12) and look for:
- Make sure`user.role` value in console logs is `'Admin'` (capital A)
- Verify Supabase session is loaded with metadata
- Check that your authentication context is properly reading user metadata

## Confirmation
✅ Admin user metadata updated successfully
✅ Backend seed endpoint added and committed
✅ Frontend builds without errors
✅ All changes pushed to GitHub repositories

Your Admin Panel should now be fully functional!
