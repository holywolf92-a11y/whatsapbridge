# AWS Setup Guide (Textract / CLI)

## 1. Rotate Your Password (Do this first!)

Your console password was shared. **Change it immediately:**

1. Sign in: https://939883131149.signin.aws.amazon.com/console  
2. **IAM** → **Users** → **textract-service** → **Security credentials**  
3. **Change password** (or use "Assign new console password" if admin)

---

## 2. Create Access Keys (for CLI / SDK / app)

Console username/password **cannot** be used for `aws` CLI or SDK. You need **Access Keys**:

1. Sign in to AWS Console (link above).  
2. **IAM** → **Users** → **textract-service** → **Security credentials**.  
3. **Access keys** → **Create access key**.  
4. Choose **Command Line Interface (CLI)** or **Application running outside AWS**.  
5. **Create**.  
6. **Copy** the **Access key ID** and **Secret access key** (you won’t see the secret again).

---

## 3. Configure AWS CLI (local / dev)

**Option A – Environment variables (recommended)**

```powershell
$env:AWS_ACCESS_KEY_ID = "AKIA..."
$env:AWS_SECRET_ACCESS_KEY = "your-secret-key"
$env:AWS_DEFAULT_REGION = "us-east-1"
```

**Option B – AWS configure**

```powershell
aws configure
# Enter Access Key ID, Secret Access Key, default region (e.g. us-east-1)
```

**Option C – Credentials file**

Edit `~/.aws/credentials` (or `%USERPROFILE%\.aws\credentials` on Windows):

```ini
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = your-secret-key
```

Then `~/.aws/config`:

```ini
[default]
region = us-east-1
```

---

## 4. Verify connection

```powershell
aws sts get-caller-identity
```

You should see your account ID (`939883131149`) and user (`textract-service`).

---

## 5. Using in your app (Python parser / backend)

**Never** put access keys in code. Use environment variables:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION` (e.g. `us-east-1`)

For Railway / production, add these in the service **Environment variables** (not in repo).

---

## 6. Enable Textract permissions (script)

Use the project script to create an IAM policy and attach it to your parser IAM user:

1. **Admin credentials:** Run with **root** or an IAM user that has `iam:CreatePolicy` and `iam:AttachUserPolicy`. Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (and `AWS_DEFAULT_REGION`) via env or `.env`.

2. **Run:**

   ```powershell
   .\enable-textract-permissions.ps1 --user textract-service
   ```

   This creates `RecruitmentPortalTextractPolicy` (grants `textract:DetectDocumentText` only) and attaches it to `textract-service`. Idempotent: safe to re-run.

3. **If caller is root:** `--user` is required (e.g. `--user textract-service`).  
   If caller is an IAM user: `--user` is optional; policy is attached to self when omitted.

4. **Verify only (no IAM changes):** Use parser user keys, then:

   ```powershell
   .\enable-textract-permissions.ps1 --verify-only
   ```

   Confirms AWS creds + Textract access. If you see *SubscriptionRequiredException*, enable Textract in AWS Console → Textract → Get started (first-time use).

5. **`.env`:** The script loads `AWS_*` from `recruitment-portal-python-parser\.env` or `Recruitment Automation Portal (2)\python-parser\.env` when not set in the environment.

---

## Quick reference

| Purpose              | Use                               |
|----------------------|-----------------------------------|
| Web console login    | URL + username + **password**     |
| CLI / SDK / app      | **Access Key ID** + **Secret Key**|

**Console URL:** https://939883131149.signin.aws.amazon.com/console  
**Account ID:** `939883131149`  
**IAM user:** `textract-service`
