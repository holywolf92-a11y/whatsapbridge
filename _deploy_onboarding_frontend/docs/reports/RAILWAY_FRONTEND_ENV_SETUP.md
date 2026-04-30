# Railway Frontend Environment Variables Setup

## Required Variables

You need to add these environment variables to your Railway **frontend service**:

### Go to Railway Dashboard:
1. Open your project: https://railway.app
2. Click on your **frontend service** (exquisite-surprise)
3. Go to the **Variables** tab
4. Add the following variables:

```bash
VITE_SUPABASE_URL=https://hncvsextwmvjydcukdwx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjczMjksImV4cCI6MjA4Mjg0MzMyOX0.rYj3fDqOPEqZGHMjlVdU2MbLjxqYlLJ-dJMnNjPmJN0
```

## Why These Are Needed:

- **VITE_SUPABASE_URL**: The Supabase project URL
- **VITE_SUPABASE_ANON_KEY**: Public anonymous key for client-side auth

**Note:** The `VITE_` prefix is required for Vite to expose these to the browser bundle.

## After Adding Variables:

Railway will automatically trigger a rebuild and redeploy your frontend.

## Security Note:

These are **public keys** meant to be exposed to the client. The service role key is kept secret in the backend only.
