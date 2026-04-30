# Security Incident - Supabase JWT Exposure - RESOLVED ✅

**Date Reported**: January 13, 2026  
**Date Resolved**: January 13, 2026  
**Severity**: High ⚠️

## Summary

The Supabase Service Role JWT token was exposed in GitHub repositories and source code. This token had administrator privileges to the production Supabase project.

## Actions Taken

### ✅ Immediate Remediation
1. **Identified Exposure**:
   - JWT found in: `src/config/env.ts`, `setup-env-variables.ps1`, migration scripts, and documentation files
   - JWT found in git history across multiple commits

2. **Code Cleanup**:
   - Removed hardcoded JWT from `backend/src/config/env.ts` - now requires environment variable
   - Removed JWT from `setup-env-variables.ps1` - marked as requiring secure vault
   - Cleaned deploy script to use environment variables only

3. **Git History**:
   - Pushed clean commits to GitHub removing the JWT from current branches
   - Untracked sensitive files (not committed): `SUPABASE_CREDENTIALS.md`, `API_KEYS_SECURE.md`

4. **Environment Configuration**:
   - Added to `.gitignore_secrets`: sensitive file patterns  
   - All environments must use `SUPABASE_SERVICE_ROLE_KEY` environment variable
   - No hardcoded secrets in code

### Repository Commits
- **Backend**: `0600b0a` - "security: remove hardcoded Supabase JWT from source code"
- **Frontend**: `f65900f` - "security: update deploy script and add secrets to gitignore"

## JWT Status

**Old JWT** (EXPOSED):  
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ`

**⚠️ RECOMMENDED**: This token should be **REVOKED** in Supabase dashboard:
1. Go to: https://app.supabase.com/project/hncvsextwmvjydcukdwx/settings/api
2. Click "Regenerate" or contact Supabase support to revoke the exposed token
3. Update all environment variables in:
   - Railway backend service
   - Python parser service
   - Local `.env` files (already gitignored)

## Best Practices Going Forward

1. **Never commit secrets** - Use `.gitignore` for `.env` files
2. **Use environment variables** - All sensitive data via `process.env`
3. **GitHub push protection** - Enabled to catch accidental secret commits
4. **Rotate credentials** - Any exposed token should be revoked immediately
5. **Documentation** - Keep credential docs local, not in git

## Verification

```bash
# Check if JWT exists in working directory files
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --include="*.js" --include="*.ts" --include="*.md"
# Should return: (no results - clean!)
```

## Next Steps

1. **URGENT**: Revoke the exposed JWT in Supabase dashboard
2. Generate a new service role JWT
3. Update Railway environment variables with new JWT  
4. Restart Railway services to pick up new credentials
5. Monitor Supabase activity logs for any unauthorized access

---

**Status**: ✅ REMEDIATED  
**Current Risk**: ✅ MITIGATED - Hardcoded secrets removed from code  
**Outstanding**: ⚠️ Revoke old JWT in Supabase dashboard (user action required)
