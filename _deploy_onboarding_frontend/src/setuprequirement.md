# 🛠️ Falisha Manpower Portal - Setup Requirements

**Complete Technical Documentation & Installation Guide**

---

## 📋 Table of Contents

1. [Programming Languages](#1-programming-languages)
2. [Software Installation](#2-software-to-install)
3. [Frameworks & Libraries](#3-frameworks--libraries)
4. [External Services & APIs](#4-external-services--apis)
5. [Development Environment Setup](#5-development-environment-setup)
6. [Database Schema](#6-database-schema)
7. [Configuration Files](#7-configuration-files)
8. [Deployment Options](#8-deployment-options)
9. [Cost Breakdown](#9-cost-breakdown)
10. [Development Workflow](#10-development-workflow)
11. [Learning Resources](#11-learning-resources)
12. [Quick Start Guide](#12-quick-start-guide)

---

## 1️⃣ Programming Languages

### Frontend
- **TypeScript** (Primary language)
- **JavaScript** (ES6+)
- **HTML5**
- **CSS3**

### Backend
- **TypeScript/JavaScript** (Node.js)
- **Python** (for AI/CV parsing)
- **SQL** (Database queries)

---

## 2️⃣ Software to Install

### A. Core Development Tools

#### 1. Node.js & npm (Required)
- **Purpose:** JavaScript runtime environment
- **Version:** Node.js 18+ or 20+ (LTS recommended)
- **Download:** https://nodejs.org/
- **Verify Installation:**
  ```bash
  node --version  # Should show v20.x.x
  npm --version   # Should show 10.x.x
  ```

#### 2. Visual Studio Code (Recommended)
- **Purpose:** Code editor/IDE
- **Download:** https://code.visualstudio.com/
- **Essential Extensions:**
  - ESLint
  - Prettier - Code formatter
  - TypeScript Hero
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - GitLens
  - Auto Rename Tag
  - Path Intellisense
  - Thunder Client (API testing)

#### 3. Git (Required)
- **Purpose:** Version control system
- **Download:** https://git-scm.com/
- **Verify Installation:**
  ```bash
  git --version  # Should show 2.x.x
  ```

#### 4. Python (Required for AI features)
- **Purpose:** CV parsing, AI processing
- **Version:** Python 3.10+
- **Download:** https://www.python.org/
- **Verify Installation:**
  ```bash
  python --version  # Should show 3.10+
  pip --version
  ```

### B. Database & Backend Tools

#### 5. PostgreSQL (Required)
- **Purpose:** Relational database system
- **Version:** PostgreSQL 14+
- **Download:** https://www.postgresql.org/download/
- **Alternative:** Use Supabase (cloud-hosted PostgreSQL)

#### 6. Supabase CLI (Optional but Recommended)
```bash
npm install -g supabase
```

#### 7. Postman (Optional)
- **Purpose:** API testing and development
- **Download:** https://www.postman.com/

### C. Optional Tools

#### 8. Docker (Optional)
- **Purpose:** Containerization and deployment
- **Download:** https://www.docker.com/

#### 9. pgAdmin (Optional)
- **Purpose:** PostgreSQL GUI management tool
- **Download:** https://www.pgadmin.org/

---

## 3️⃣ Frameworks & Libraries

### A. Frontend Stack (React + TypeScript)

#### Initialize Project
```bash
npm create vite@latest falisha-portal -- --template react-ts
cd falisha-portal
npm install
```

#### Core Dependencies
```bash
# UI & Styling
npm install tailwindcss@4.0.0
npm install clsx tailwind-merge

# Icons
npm install lucide-react

# Charts & Visualization
npm install recharts

# Forms & Validation
npm install react-hook-form@7.55.0
npm install zod

# Date Handling
npm install date-fns

# File Handling
npm install react-dropzone

# Excel Export
npm install xlsx

# PDF Generation
npm install jspdf jspdf-autotable

# QR Code Generation
npm install qrcode.react

# Carousel
npm install react-slick slick-carousel
npm install @types/react-slick --save-dev

# Toast Notifications
npm install sonner@2.0.3

# Drag and Drop
npm install react-dnd react-dnd-html5-backend

# Animation
npm install motion

# HTTP Client
npm install axios

# Backend Connection
npm install @supabase/supabase-js
```

### B. Backend Stack (Node.js + TypeScript)

#### Initialize Backend
```bash
mkdir backend
cd backend
npm init -y
```

#### Core Dependencies
```bash
# Core Framework
npm install express
npm install @types/express --save-dev

# TypeScript Setup
npm install typescript ts-node @types/node --save-dev
npm install nodemon --save-dev

# Environment Variables
npm install dotenv

# Database
npm install @supabase/supabase-js
npm install pg
npm install @types/pg --save-dev

# Authentication
npm install jsonwebtoken bcrypt
npm install @types/jsonwebtoken @types/bcrypt --save-dev

# Validation
npm install zod

# File Upload
npm install multer
npm install @types/multer --save-dev

# Email Service
npm install nodemailer
npm install @types/nodemailer --save-dev

# HTTP Client
npm install axios

# Logging
npm install winston

# CORS
npm install cors
npm install @types/cors --save-dev

# Rate Limiting
npm install express-rate-limit

# Security
npm install helmet
npm install express-validator
```

### C. Python Backend (AI/CV Processing)

#### Setup Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on Mac/Linux
source venv/bin/activate
```

#### Install Python Packages
```bash
# AI & NLP
pip install openai
pip install transformers
pip install sentence-transformers

# Document Processing
pip install PyPDF2
pip install python-docx
pip install pdfplumber

# Image Processing & OCR
pip install pillow
pip install pytesseract
pip install opencv-python

# API Framework
pip install fastapi
pip install uvicorn[standard]

# Data Validation
pip install pydantic

# File Handling
pip install python-multipart

# Data Processing
pip install pandas
pip install numpy

# Database
pip install psycopg2-binary
pip install sqlalchemy

# HTTP Client
pip install httpx

# Save requirements
pip freeze > requirements.txt
```

---

## 4️⃣ External Services & APIs

### A. Required Services

#### 1. Supabase (Database, Auth, Storage)
- **Purpose:** PostgreSQL database + Authentication + File Storage
- **Sign Up:** https://supabase.com/
- **Pricing:** Free tier (500MB DB, 1GB storage, 50K MAU)

**Setup Steps:**
1. Create new Supabase project
2. Copy Project URL and API Keys
3. Create database tables (see schema below)
4. Configure Row Level Security (RLS)
5. Set up Storage buckets for files

**Environment Variables:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

#### 2. OpenAI API (AI/CV Parsing)
- **Purpose:** AI-powered CV parsing and candidate matching
- **Sign Up:** https://platform.openai.com/
- **Pricing:** 
  - GPT-3.5-turbo: $0.002/1K tokens
  - GPT-4: $0.03/1K tokens

**Environment Variables:**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

#### 3. WhatsApp Business API
**Option A: Twilio (Recommended for beginners)**
- **Sign Up:** https://www.twilio.com/
- **Pricing:** $0.005 per message
- **Setup:** Easier, faster approval

**Option B: Meta WhatsApp Business Platform**
- **Sign Up:** https://business.facebook.com/
- **Pricing:** Lower cost at scale
- **Setup:** More complex, longer approval

**Environment Variables (Twilio):**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
```

#### 4. Email Service
**Option A: Gmail SMTP (Free for testing)**
- Use App Password (not regular password)
- Limit: 500 emails/day

**Option B: SendGrid (Recommended for production)**
- **Sign Up:** https://sendgrid.com/
- **Pricing:** Free tier (100 emails/day)

**Environment Variables:**
```env
# Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OR SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

### B. Optional Services

#### 5. Cloud Storage
- **Supabase Storage** (included with Supabase)
- **AWS S3** (pay-as-you-go)
- **Cloudflare R2** (cheaper S3 alternative)

#### 6. SMS Service
- **Twilio SMS**
- **AWS SNS**
- **MessageBird**

#### 7. Video Call Integration (for interviews)
- **Daily.co** - https://www.daily.co/
- **Whereby** - https://whereby.com/
- **Zoom API** - https://marketplace.zoom.us/

#### 8. Payment Gateway (for premium features)
- **Stripe** - https://stripe.com/
- **PayPal** - https://www.paypal.com/

---

## 5️⃣ Development Environment Setup

### Project Structure

```
falisha-manpower-portal/
├── frontend/                     # React + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CandidateManagement.tsx
│   │   │   ├── CandidateBrowserEnhanced.tsx
│   │   │   └── ...
│   │   ├── lib/                 # Utilities & helpers
│   │   │   ├── mockData.ts
│   │   │   ├── supabaseClient.ts
│   │   │   └── utils.ts
│   │   ├── styles/              # Global styles
│   │   │   └── globals.css
│   │   ├── App.tsx              # Main app component
│   │   └── main.tsx             # Entry point
│   ├── .env                     # Environment variables
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
├── backend/                     # Node.js + TypeScript
│   ├── src/
│   │   ├── routes/              # API routes
│   │   │   ├── candidates.ts
│   │   │   ├── employers.ts
│   │   │   └── auth.ts
│   │   ├── controllers/         # Route handlers
│   │   ├── models/              # Data models
│   │   ├── middleware/          # Custom middleware
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Helper functions
│   │   └── server.ts            # Server entry point
│   ├── .env                     # Environment variables
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── python-services/             # Python AI services
│   ├── cv_parser/
│   │   ├── main.py
│   │   ├── parser.py
│   │   └── models.py
│   ├── matching_engine/
│   │   ├── main.py
│   │   └── matcher.py
│   ├── .env
│   ├── requirements.txt
│   └── README.md
│
├── database/
│   ├── migrations/              # Database migrations
│   ├── seeds/                   # Seed data
│   └── schema.sql               # Database schema
│
├── docs/                        # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── SETUP.md
│
├── .gitignore
├── setuprequirement.md          # This file
└── README.md
```

### Step-by-Step Setup

#### 1. Frontend Setup

```bash
# Create React + TypeScript project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install dependencies
npm install

# Install Tailwind CSS 4.0
npm install tailwindcss@4.0.0

# Install all required packages
npm install lucide-react recharts react-hook-form@7.55.0 \
  @supabase/supabase-js axios date-fns xlsx jspdf \
  qrcode.react sonner@2.0.3 motion react-dropzone

# Create environment file
touch .env

# Start development server
npm run dev
```

**Frontend .env file:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:3000
```

**Frontend vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
```

#### 2. Backend Setup

```bash
# Create backend directory
mkdir backend
cd backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express @supabase/supabase-js dotenv cors \
  jsonwebtoken bcrypt multer nodemailer axios winston zod helmet

# Install dev dependencies
npm install -D typescript @types/node @types/express \
  @types/cors @types/jsonwebtoken @types/bcrypt \
  @types/multer @types/nodemailer ts-node nodemon

# Initialize TypeScript
npx tsc --init

# Create environment file
touch .env
```

**Backend tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Backend package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest"
  }
}
```

**Backend .env file:**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Backend server.ts example:**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
// app.use('/api/candidates', candidateRoutes);
// app.use('/api/employers', employerRoutes);
// app.use('/api/auth', authRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

#### 3. Python Services Setup

```bash
# Create Python services directory
mkdir python-services
cd python-services

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install openai PyPDF2 python-docx pillow pytesseract \
  fastapi uvicorn pydantic python-multipart pandas numpy

# Save dependencies
pip freeze > requirements.txt

# Create environment file
touch .env
```

**Python .env file:**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
```

**Python main.py example:**
```python
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CV Parser API is running"}

@app.post("/parse-cv")
async def parse_cv(file: UploadFile = File(...)):
    # CV parsing logic here
    return {"filename": file.filename, "status": "parsed"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 6️⃣ Database Schema

### Supabase/PostgreSQL Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Candidates Table
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  nationality VARCHAR(100),
  country_of_interest VARCHAR(100),
  position VARCHAR(100),
  experience INTEGER,
  skills TEXT[],
  status VARCHAR(50) DEFAULT 'Applied',
  ai_score DECIMAL(3,1),
  passport_available BOOLEAN DEFAULT false,
  source VARCHAR(100),
  applied_date TIMESTAMP DEFAULT NOW(),
  auto_extracted BOOLEAN DEFAULT false,
  needs_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by UUID,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Employers Table
CREATE TABLE employers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  website VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Job Orders Table
CREATE TABLE job_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  job_title VARCHAR(255) NOT NULL,
  positions_available INTEGER NOT NULL,
  positions_filled INTEGER DEFAULT 0,
  country VARCHAR(100),
  city VARCHAR(100),
  salary_range VARCHAR(100),
  currency VARCHAR(10),
  requirements TEXT,
  benefits TEXT,
  status VARCHAR(50) DEFAULT 'Open',
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Communication Log Table
CREATE TABLE communication_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- email, whatsapp, sms, call
  direction VARCHAR(20), -- inbound, outbound
  subject VARCHAR(255),
  content TEXT,
  status VARCHAR(50),
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  metadata JSONB
);

-- 6. CV Versions Table
CREATE TABLE cv_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  job_order_id UUID REFERENCES job_orders(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  template_used VARCHAR(100),
  generated_by UUID,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Users Table (Admin/Staff)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'staff',
  name VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Application Forms Submissions
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL,
  source VARCHAR(100),
  ip_address VARCHAR(50),
  user_agent TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP
);

-- 9. Matching Results Table
CREATE TABLE matching_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_order_id UUID REFERENCES job_orders(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2),
  match_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_position ON candidates(position);
CREATE INDEX idx_candidates_country ON candidates(country_of_interest);
CREATE INDEX idx_documents_candidate_id ON documents(candidate_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_job_orders_status ON job_orders(status);
CREATE INDEX idx_communication_log_candidate_id ON communication_log(candidate_id);
CREATE INDEX idx_communication_log_type ON communication_log(type);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employers_updated_at BEFORE UPDATE ON employers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_orders_updated_at BEFORE UPDATE ON job_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 7️⃣ Configuration Files

### .gitignore

```gitignore
# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/
temp/

# Testing
coverage/
.nyc_output/

# Production
*.tgz
```

### Frontend tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Frontend globals.css

```css
@import "tailwindcss";

/* Your custom styles here */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 8️⃣ Deployment Options

### A. Frontend Deployment

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Production deployment
vercel --prod
```

**Features:**
- ✅ Free tier for personal projects
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Auto-deploy from Git
- ✅ Preview deployments for PRs

#### Option 2: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy

# Production deployment
netlify deploy --prod
```

#### Option 3: Cloudflare Pages
- Connect GitHub repository
- Auto-deploy on push
- Free unlimited bandwidth

### B. Backend Deployment

#### Option 1: Railway (Recommended for beginners)
1. Sign up at https://railway.app/
2. Connect GitHub repository
3. Select `backend` directory
4. Add environment variables
5. Deploy automatically

**Pricing:** $5 credit/month free tier

#### Option 2: Render
1. Sign up at https://render.com/
2. Connect GitHub repository
3. Create Web Service
4. Configure build & start commands
5. Add environment variables

**Pricing:** Free tier available

#### Option 3: DigitalOcean App Platform
1. Sign up at https://www.digitalocean.com/
2. Create new App
3. Connect GitHub repository
4. Configure components
5. Deploy

**Pricing:** Starting at $5/month

#### Option 4: AWS EC2 (Advanced)
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo-url
cd backend

# Install dependencies
npm install

# Install PM2 (process manager)
sudo npm install -g pm2

# Start application
pm2 start dist/server.js --name "falisha-backend"

# Setup auto-restart
pm2 startup
pm2 save
```

### C. Python Services Deployment

#### Option 1: Railway
Same as backend deployment

#### Option 2: Google Cloud Run
```bash
# Install Google Cloud SDK
# Then deploy:
gcloud run deploy cv-parser \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

#### Option 3: AWS Lambda (Serverless)
Use Serverless Framework or AWS SAM

### D. Database Deployment

#### Supabase (Recommended)
- Already cloud-hosted
- Automatic backups
- Global distribution
- No deployment needed

**Free Tier:**
- 500MB database
- 1GB file storage
- 50K monthly active users

**Paid Tier ($25/month):**
- 8GB database
- 100GB file storage
- 100K monthly active users

---

## 9️⃣ Cost Breakdown

### Development/Testing Phase (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Frontend (Vercel) | Free | $0 |
| Backend (Railway) | Hobby | $0 ($5 credit) |
| Database (Supabase) | Free | $0 |
| OpenAI API | Usage | $10-50 |
| WhatsApp (Twilio) | Usage | $20-30 |
| Email (SendGrid) | Free 100/day | $0 |
| Storage (Supabase) | 1GB | $0 |
| **Total** | | **$30-80** |

### Production Phase (100+ candidates/day)

| Service | Tier | Cost |
|---------|------|------|
| Frontend (Vercel) | Pro | $20 |
| Backend (Railway) | Starter | $20-50 |
| Database (Supabase) | Pro | $25 |
| OpenAI API | Usage | $100-300 |
| WhatsApp (Twilio) | Usage | $100-200 |
| Email (SendGrid) | Essentials | $20 |
| Storage (Supabase) | Additional | $10-20 |
| **Total** | | **$300-600** |

### Enterprise Phase (500+ candidates/day)

| Service | Tier | Cost |
|---------|------|------|
| Frontend (Vercel) | Pro | $20 |
| Backend (AWS/DO) | Scaled | $100-200 |
| Database (Supabase) | Team | $599 |
| OpenAI API | Usage | $500-1000 |
| WhatsApp (Twilio) | Usage | $300-500 |
| Email (SendGrid) | Pro | $90 |
| Storage (S3/R2) | Usage | $50-100 |
| CDN (Cloudflare) | Pro | $20 |
| Monitoring | Datadog/New Relic | $100-200 |
| **Total** | | **$1,800-3,000** |

---

## 🔟 Development Workflow

### Daily Development

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173

# Terminal 2 - Backend
cd backend
npm run dev
# Runs on http://localhost:3000

# Terminal 3 - Python Services
cd python-services
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload
# Runs on http://localhost:8000
```

### Git Workflow

```bash
# Initialize repository
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository
# Then push
git remote add origin https://github.com/yourusername/falisha-portal.git
git push -u origin main

# Feature development workflow
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
# Create Pull Request on GitHub

# After PR approval
git checkout main
git pull origin main
git branch -d feature/new-feature
```

### Code Quality

```bash
# ESLint setup
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Prettier setup
npm install -D prettier

# Run linting
npm run lint

# Format code
npm run format
```

---

## 1️⃣1️⃣ Learning Resources

### Essential Skills Timeline

| Skill | Learning Time | Priority |
|-------|---------------|----------|
| HTML/CSS | 2-4 weeks | High |
| JavaScript ES6+ | 4-8 weeks | High |
| TypeScript | 2-4 weeks | High |
| React | 4-8 weeks | High |
| Node.js/Express | 3-6 weeks | Medium |
| PostgreSQL/SQL | 2-4 weeks | Medium |
| Git/GitHub | 1-2 weeks | High |
| Python Basics | 2-4 weeks | Low |

### Recommended Free Courses

#### Frontend
1. **freeCodeCamp** - https://www.freecodecamp.org/
   - Responsive Web Design (HTML/CSS)
   - JavaScript Algorithms and Data Structures
   - Front End Development Libraries (React)

2. **The Odin Project** - https://www.theodinproject.com/
   - Full Stack JavaScript Path

3. **React Official Tutorial** - https://react.dev/learn

4. **TypeScript Handbook** - https://www.typescriptlang.org/docs/handbook/

#### Backend
1. **Node.js Documentation** - https://nodejs.org/docs/
2. **Express.js Guide** - https://expressjs.com/en/guide/routing.html
3. **PostgreSQL Tutorial** - https://www.postgresqltutorial.com/

#### Full Stack
1. **Full Stack Open** (University of Helsinki) - https://fullstackopen.com/
   - FREE comprehensive course
   - React, Node.js, MongoDB/PostgreSQL
   - Industry-recognized certificate

### Recommended Paid Courses (Optional)

1. **Udemy:**
   - React - The Complete Guide (Maximilian Schwarzmüller)
   - Node.js - The Complete Guide
   - TypeScript Course

2. **Frontend Masters:**
   - Complete Intro to React
   - Full Stack for Frontend Engineers

3. **Pluralsight:**
   - React Path
   - Node.js Path

### YouTube Channels

1. **Traversy Media** - Web development tutorials
2. **Web Dev Simplified** - Modern web development
3. **Fireship** - Quick tech explanations
4. **The Net Ninja** - Full courses on various topics

### Documentation to Bookmark

- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- Node.js: https://nodejs.org/
- Express: https://expressjs.com/
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

## 1️⃣2️⃣ Quick Start Guide

### For Absolute Beginners

#### Week 1-2: Setup & Basics
```bash
# Day 1-2: Install tools
- Install Node.js
- Install VS Code
- Install Git
- Create GitHub account

# Day 3-7: HTML/CSS basics
- Learn HTML structure
- Learn CSS styling
- Build simple webpage

# Day 8-14: JavaScript basics
- Variables, functions, loops
- Arrays and objects
- DOM manipulation
```

#### Week 3-4: Modern JavaScript
```bash
# ES6+ features
- Arrow functions
- Destructuring
- Promises and async/await
- Modules (import/export)

# Practice projects
- Todo list
- Calculator
- Weather app
```

#### Week 5-8: React Fundamentals
```bash
# React basics
- Components
- Props and State
- Hooks (useState, useEffect)
- Event handling

# Build projects
- Simple blog
- Shopping cart
- API integration
```

#### Week 9-12: TypeScript & Advanced React
```bash
# TypeScript
- Types and interfaces
- Generics
- Type inference

# Advanced React
- Context API
- Custom hooks
- Performance optimization
```

#### Week 13-16: Backend & Database
```bash
# Node.js & Express
- REST API creation
- Middleware
- Authentication

# PostgreSQL
- SQL queries
- Database design
- CRUD operations
```

#### Week 17-20: Build Falisha Portal
```bash
# Start building
- Set up project structure
- Create database schema
- Build UI components
- Connect frontend to backend
- Deploy to production
```

### Quick Setup (If You Know React)

```bash
# 1. Clone starter template
git clone https://github.com/yourusername/recruitment-portal-starter
cd recruitment-portal-starter

# 2. Install dependencies
cd frontend && npm install
cd ../backend && npm install
cd ../python-services && pip install -r requirements.txt

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Set up database
# Run SQL schema in Supabase dashboard

# 5. Start development
npm run dev:all

# 6. Open browser
# http://localhost:5173
```

---

## ✅ Pre-Launch Checklist

### Development Environment
- [ ] Node.js 18+ installed
- [ ] VS Code with extensions installed
- [ ] Git configured
- [ ] Python 3.10+ installed

### Accounts Created
- [ ] GitHub account
- [ ] Supabase account (with project created)
- [ ] OpenAI API key obtained
- [ ] Twilio account (for WhatsApp)
- [ ] SendGrid account (for email)
- [ ] Vercel/Netlify account

### Project Setup
- [ ] Frontend initialized with Vite
- [ ] Backend initialized with Express
- [ ] Python virtual environment created
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Git repository initialized

### Testing
- [ ] Frontend runs locally
- [ ] Backend API responds
- [ ] Database connection works
- [ ] File upload works
- [ ] Email sending works
- [ ] WhatsApp integration works

### Deployment
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Python services deployed
- [ ] Environment variables set in production
- [ ] Database backups configured
- [ ] Monitoring set up

---

## 🚀 Next Steps After Setup

1. **Build Core Features:**
   - Candidate management
   - CV parsing
   - Document upload
   - Search and filters

2. **Add Advanced Features:**
   - AI matching
   - WhatsApp automation
   - Email templates
   - Bulk operations

3. **Polish UI/UX:**
   - Responsive design
   - Loading states
   - Error handling
   - Animations

4. **Test Thoroughly:**
   - Unit tests
   - Integration tests
   - User acceptance testing
   - Performance testing

5. **Deploy to Production:**
   - Set up CI/CD
   - Configure monitoring
   - Set up analytics
   - Create backups

6. **Launch & Iterate:**
   - Soft launch to beta users
   - Collect feedback
   - Fix bugs
   - Add requested features

---

## 📞 Support & Resources

### Community
- **Stack Overflow** - https://stackoverflow.com/
- **Reddit r/reactjs** - https://reddit.com/r/reactjs
- **Reddit r/webdev** - https://reddit.com/r/webdev
- **Dev.to** - https://dev.to/

### Official Docs
- **React** - https://react.dev/
- **Supabase** - https://supabase.com/docs
- **Tailwind** - https://tailwindcss.com/docs

### Discord Communities
- Reactiflux
- Supabase Discord
- The Programmer's Hangout

---

## 📝 Final Notes

### Important Reminders

1. **Start Small:** Don't try to build everything at once
2. **Version Control:** Commit code frequently
3. **Test Often:** Test as you build, not after
4. **Security First:** Never commit API keys or secrets
5. **Document:** Write comments and documentation
6. **Backup:** Regular database backups
7. **Monitor:** Set up error tracking (Sentry)
8. **Scale Gradually:** Optimize when needed, not prematurely

### Security Best Practices

- ✅ Use environment variables for secrets
- ✅ Implement rate limiting
- ✅ Validate all user input
- ✅ Use HTTPS in production
- ✅ Implement proper authentication
- ✅ Set up CORS correctly
- ✅ Use prepared statements for SQL
- ✅ Regularly update dependencies

### Performance Optimization

- ✅ Use lazy loading for components
- ✅ Optimize images (WebP format)
- ✅ Implement caching (Redis)
- ✅ Use CDN for static assets
- ✅ Minimize bundle size
- ✅ Database query optimization
- ✅ Implement pagination
- ✅ Use connection pooling

---

**Good luck building the Falisha Manpower Portal! 🚀**

*Last Updated: December 2024*
*Version: 1.0*
