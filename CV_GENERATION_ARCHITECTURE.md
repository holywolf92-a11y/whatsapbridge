# 🏗️ Production-Grade CV Generation Architecture

## Executive Summary

**Current State**: Multiple competing frontend implementations, mock backend, no caching, client-side PDF generation only.

**Recommended State**: Unified server-side PDF generation with intelligent caching, queue system, and single source of truth.

---

## 🎯 World-Class Architecture Principles

### 1. **Separation of Concerns**
- **Backend**: PDF generation, storage, caching, queue management
- **Frontend**: Display, consumption, user interaction
- **Never**: Client-side PDF generation for production workloads

### 2. **Performance & Scalability**
- **Caching**: Generated PDFs stored in Supabase Storage
- **Lazy Generation**: Generate on-demand, cache forever (until candidate data changes)
- **Queue System**: Background jobs for bulk operations
- **CDN**: Serve PDFs via CDN for fast global access

### 3. **Reliability**
- **Idempotency**: Same input = same output (hash-based cache keys)
- **Retry Logic**: Automatic retries for failed generations
- **Error Handling**: Graceful degradation, detailed logging
- **Versioning**: Track CV versions when candidate data changes

### 4. **Security**
- **Signed URLs**: Time-limited access tokens
- **Access Control**: Role-based permissions (employer-safe vs internal)
- **Audit Trail**: Log all CV generations and downloads

---

## 📐 Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Public Profile   │  │ Candidate Mgmt   │  │ Bulk Export  │ │
│  │ (Public Link)    │  │ (Internal)       │  │ (Admin)      │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │          │
│           └─────────────────────┼────────────────────┘          │
│                                 │                               │
│                    ┌────────────▼────────────┐                 │
│                    │   Unified CV Service    │                 │
│                    │   (API Client)          │                 │
│                    └────────────┬────────────┘                 │
└──────────────────────────────────┼───────────────────────────────┘
                                   │
                                   │ HTTP API
                                   │
┌──────────────────────────────────▼───────────────────────────────┐
│                      BACKEND API LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  GET /api/candidates/:id/cv/employer-safe              │   │
│  │  GET /api/candidates/:id/cv/internal                   │   │
│  │  POST /api/candidates/bulk-cv/generate                 │   │
│  │  GET /api/candidates/:id/cv/status                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           CV Generation Controller                       │   │
│  │  - Request validation                                    │   │
│  │  - Cache checking                                        │   │
│  │  - Queue management                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   │
┌──────────────────────────────────▼───────────────────────────────┐
│                    CV GENERATION SERVICE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Cache Layer (Database)                                  │   │
│  │  - Check if PDF exists and is current                   │   │
│  │  - Return signed URL if cached                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PDF Generation Engine (Puppeteer/PDFKit)                │   │
│  │  - Fetch candidate data                                  │   │
│  │  - Apply template (employer-safe/internal)               │   │
│  │  - Generate PDF                                          │   │
│  │  - Upload to Supabase Storage                            │   │
│  │  - Store metadata in database                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Queue System (BullMQ/Redis)                             │   │
│  │  - Background job processing                             │   │
│  │  - Bulk CV generation                                    │   │
│  │  - Retry failed jobs                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   │
┌──────────────────────────────────▼───────────────────────────────┐
│                      STORAGE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Supabase Storage │  │ PostgreSQL       │  │ Redis Cache  │  │
│  │ (PDF Files)      │  │ (CV Metadata)    │  │ (Job Queue)  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### New Table: `generated_cvs`

```sql
CREATE TABLE IF NOT EXISTS generated_cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  format VARCHAR(20) NOT NULL CHECK (format IN ('employer-safe', 'internal', 'standard')),
  template VARCHAR(50) DEFAULT 'professional',
  storage_bucket VARCHAR(100) NOT NULL DEFAULT 'documents',
  storage_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  sha256 VARCHAR(64), -- For deduplication
  version_hash VARCHAR(64) NOT NULL, -- Hash of candidate data at generation time
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by UUID, -- User ID who triggered generation
  expires_at TIMESTAMP, -- Optional expiration for signed URLs
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one CV per candidate+format+version
  UNIQUE(candidate_id, format, version_hash)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_cvs_candidate_id ON generated_cvs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_generated_cvs_format ON generated_cvs(format);
CREATE INDEX IF NOT EXISTS idx_generated_cvs_version_hash ON generated_cvs(version_hash);
CREATE INDEX IF NOT EXISTS idx_generated_cvs_storage_path ON generated_cvs(storage_path);
```

### Cache Invalidation Strategy

```sql
-- Function to calculate candidate data hash
CREATE OR REPLACE FUNCTION calculate_candidate_version_hash(candidate_id UUID)
RETURNS VARCHAR(64) AS $$
DECLARE
  data_hash VARCHAR(64);
BEGIN
  SELECT encode(
    digest(
      CONCAT(
        COALESCE(name, ''),
        COALESCE(position, ''),
        COALESCE(nationality, ''),
        COALESCE(experience_years::text, ''),
        COALESCE(skills, ''),
        COALESCE(languages, ''),
        COALESCE(updated_at::text, '')
      ),
      'sha256'
    ),
    'hex'
  ) INTO data_hash
  FROM candidates
  WHERE id = candidate_id;
  
  RETURN data_hash;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 Implementation Plan

### Phase 1: Backend PDF Generation Service

**Technology Stack:**
- **Puppeteer** (recommended) or **PDFKit** for PDF generation
- **Handlebars** or **React Server Components** for templating
- **BullMQ** with Redis for job queue
- **Supabase Storage** for file storage

**Key Functions:**

```typescript
// cvGeneratorService.ts

interface CVGenerationOptions {
  candidateId: string;
  format: 'employer-safe' | 'internal' | 'standard';
  template?: 'professional' | 'modern' | 'compact';
  forceRegenerate?: boolean;
}

async function generateCV(options: CVGenerationOptions): Promise<{
  cv_url: string;
  cached: boolean;
  version_hash: string;
}> {
  // 1. Check cache
  const cached = await checkCache(options);
  if (cached && !options.forceRegenerate) {
    return { cv_url: cached.signed_url, cached: true, version_hash: cached.version_hash };
  }
  
  // 2. Fetch candidate data
  const candidate = await getCandidateById(options.candidateId);
  const documents = await getCandidateDocuments(options.candidateId);
  
  // 3. Calculate version hash
  const versionHash = await calculateCandidateVersionHash(options.candidateId);
  
  // 4. Generate PDF
  const pdfBuffer = await renderPDFToBuffer({
    candidate,
    documents,
    format: options.format,
    template: options.template || 'professional',
  });
  
  // 5. Upload to storage
  const storagePath = `cvs/${options.candidateId}/${options.format}_${versionHash}.pdf`;
  await uploadToStorage(storagePath, pdfBuffer);
  
  // 6. Store metadata
  await saveCVMetadata({
    candidateId: options.candidateId,
    format: options.format,
    storagePath,
    versionHash,
  });
  
  // 7. Generate signed URL
  const signedUrl = await generateSignedUrl(storagePath, { expiresIn: '7d' });
  
  return { cv_url: signedUrl, cached: false, version_hash: versionHash };
}
```

### Phase 2: Frontend Consolidation

**Unified CV Service Component:**

```typescript
// components/CVService.tsx

export function useCVGeneration(candidateId: string) {
  const [loading, setLoading] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  
  const generateCV = async (format: 'employer-safe' | 'internal') => {
    setLoading(true);
    try {
      const response = await apiClient.getCandidateCV(candidateId, format);
      setCvUrl(response.cv_url);
      return response.cv_url;
    } finally {
      setLoading(false);
    }
  };
  
  return { generateCV, loading, cvUrl };
}
```

**Replace all existing CV components:**
- `CVGenerator.tsx` → Use unified service
- `EmployerSafeCV.tsx` → Use unified service
- `PublicCandidateProfile.tsx` → Use unified service (for download button)

### Phase 3: Automatic Generation on Upload

**Option A: Immediate Generation (Recommended)**
```typescript
// In cvParserWorker.ts or documentVerificationWorker.ts

// After candidate is created/updated
await generateCV({
  candidateId: candidate.id,
  format: 'employer-safe',
  template: 'professional',
});
```

**Option B: Lazy Generation (Current)**
- Generate on first request
- Cache for subsequent requests

---

## 🚀 Performance Optimizations

### 1. **Intelligent Caching**
- Cache key: `candidate_id + format + version_hash`
- Cache invalidation: When candidate data changes
- Storage: Supabase Storage (cheap, fast, CDN-backed)

### 2. **Background Processing**
- Bulk operations → Queue system
- Single requests → Synchronous (fast path)
- Failed jobs → Automatic retry with exponential backoff

### 3. **CDN Integration**
- Serve PDFs via Supabase CDN
- Signed URLs with expiration
- Global edge caching

### 4. **Lazy Loading**
- Frontend: Load CV on-demand
- Backend: Generate only when requested
- Pre-generate: Optional for high-priority candidates

---

## 🔒 Security Considerations

### 1. **Access Control**
```typescript
// Middleware
function validateCVAccess(req: Request, res: Response, next: NextFunction) {
  const { candidateId, format } = req.params;
  const user = req.user;
  
  if (format === 'internal' && !user.isAdmin) {
    return res.status(403).json({ error: 'Internal CVs require admin access' });
  }
  
  // Check if user has access to candidate
  // ...
}
```

### 2. **Signed URLs**
- Time-limited (7 days default)
- Single-use optional (for sensitive CVs)
- Audit logging for all accesses

### 3. **Data Privacy**
- Employer-safe: Remove contact info, CNIC, address
- Internal: Full data access
- Public profile: Employer-safe only

---

## 📊 Monitoring & Observability

### Metrics to Track:
1. **Generation Time**: P50, P95, P99
2. **Cache Hit Rate**: Should be >80%
3. **Error Rate**: Should be <1%
4. **Storage Usage**: Track PDF storage growth
5. **Queue Depth**: Monitor job queue size

### Logging:
```typescript
logger.info('CV generated', {
  candidateId,
  format,
  cached: false,
  generationTime: 1234,
  fileSize: 456789,
  versionHash,
});
```

---

## 🎯 Migration Strategy

### Step 1: Implement Backend Service (Week 1)
- [ ] Set up Puppeteer/PDFKit
- [ ] Create database schema
- [ ] Implement cache checking
- [ ] Implement PDF generation
- [ ] Upload to Supabase Storage
- [ ] Create API endpoints

### Step 2: Frontend Consolidation (Week 2)
- [ ] Create unified CV service hook
- [ ] Update `PublicCandidateProfile.tsx` to use backend
- [ ] Update `CVGenerator.tsx` to use backend
- [ ] Update `EmployerSafeCV.tsx` to use backend
- [ ] Remove client-side PDF generation code

### Step 3: Queue System (Week 3)
- [ ] Set up Redis/BullMQ
- [ ] Implement background job processing
- [ ] Add bulk CV generation endpoint
- [ ] Add retry logic

### Step 4: Automatic Generation (Week 4)
- [ ] Add CV generation to CV upload workflow
- [ ] Add CV generation to candidate update workflow
- [ ] Test end-to-end flow

### Step 5: Cleanup (Week 5)
- [ ] Remove old mock implementations
- [ ] Remove unused frontend components
- [ ] Update documentation
- [ ] Performance testing

---

## 💰 Cost Analysis

### Current (Client-Side):
- **Cost**: $0 (but poor UX, inconsistent)
- **Performance**: Slow, unreliable
- **Scalability**: Limited by client device

### Recommended (Server-Side):
- **Supabase Storage**: ~$0.021/GB/month (very cheap)
- **Compute**: Railway/Render ~$20-50/month (handles thousands of CVs)
- **Redis**: Railway Redis ~$5/month (for queue)
- **Total**: ~$25-55/month for production-grade system

**ROI**: 
- Better user experience
- Consistent output
- Scalable to thousands of candidates
- Professional appearance

---

## ✅ Success Criteria

1. **Performance**: CV generation < 2 seconds (cached) or < 5 seconds (new)
2. **Reliability**: 99.9% success rate
3. **Cache Hit Rate**: >80% (most requests use cached PDFs)
4. **Consistency**: Single source of truth, no duplicate implementations
5. **Scalability**: Handle 1000+ CV generations per day

---

## 🔄 Alternative Approaches Considered

### ❌ Client-Side Generation (Current)
- **Pros**: No server cost
- **Cons**: Inconsistent, slow, unreliable, poor mobile support
- **Verdict**: Not production-grade

### ❌ Serverless Functions (AWS Lambda/Vercel)
- **Pros**: Auto-scaling, pay-per-use
- **Cons**: Cold starts, timeout limits, vendor lock-in
- **Verdict**: Good for low volume, not ideal for bulk operations

### ✅ Dedicated Backend Service (Recommended)
- **Pros**: Full control, consistent performance, queue support
- **Cons**: Requires infrastructure management
- **Verdict**: Best for production workloads

---

## 📝 Next Steps

1. **Review this architecture** with your team
2. **Choose PDF library**: Puppeteer (better HTML rendering) vs PDFKit (lighter)
3. **Set up infrastructure**: Redis for queue, ensure Supabase Storage is ready
4. **Start with Phase 1**: Implement backend service
5. **Test thoroughly**: Generate 100+ CVs, measure performance
6. **Deploy gradually**: Feature flag, monitor, iterate

---

**Questions?** Let's discuss implementation details or specific requirements.
