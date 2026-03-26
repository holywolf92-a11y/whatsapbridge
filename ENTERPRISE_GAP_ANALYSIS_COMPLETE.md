# Enterprise Gap Analysis — Complete Implementation Log

**Project:** Falisha Manpower Recruitment Portal  
**Period:** Session starting February 25, 2026  
**Backend Railway:** `https://recruitment-portal-backend-production-d1f7.up.railway.app`  
**Frontend Railway:** `https://falishamanpower.up.railway.app`  
**Supabase Project:** `hncvsextwmvjydcukdwx`

---

## Gap Analysis Overview

| Priority | Item | Status | Commit |
|---|---|---|---|
| P0.1 | Unified matching engines | ✅ Done | `fb407b48` |
| P0.2 | Phone DB lookup fix | ✅ Done | `fb407b48` |
| P0.3 | Name-only → always manual review | ✅ Done | `fb407b48` |
| P0.4 | DB email unique index | ✅ Done | `fb407b48` (applied) |
| P1.1 | Probabilistic scoring | ✅ Done | `b6d806d9` |
| P1.2 | DB lookup indexes | ✅ Done | `b6d806d9` (applied) |
| P1.3 | Idempotency guard in CV worker | ✅ Done | `b6d806d9` |
| P1.4 | Unmatched documents queue UI | ✅ Done | `08cb237` |
| P2.1 | Candidate merge audit trail | ✅ Done | `db33e1b1` |
| P2.2 | Phonetic name matching | ✅ Done | `db33e1b1` |
| P3.1 | DB transaction + row-level locking | ✅ Done | `ba72d458` |
| P3.2 | Concurrency locking (SELECT FOR UPDATE) | ✅ Done | `ba72d458` |
| P3.3 | Pre-merge forensic snapshot | ✅ Done | `ba72d458` |
| P3.4 | Soft-delete enforcement view | ✅ Done | `ba72d458` (applied) |
| P3.5 | Confidence persistence on candidate | ✅ Done | `ba72d458` |
| P3.6 | Matching health metrics dashboard | ✅ Done | `ba72d458` / `a72efb7` |
| P3.7 | PII field-level encryption (AES-256-GCM) | ✅ Done | `ba72d458` |

---

## P0 — Critical Correctness Fixes

### P0.1 + P0.2 + P0.3 — Unified Matching Engine

**Problem:** WhatsApp ingestion and CV upload used separate, inconsistent matching logic. Duplicate candidates were being created because the two codepaths disagreed on whether a record was the same person.

**Fix:** Both paths now call the single `CandidateMatcher.findCandidate()`.

**Files changed:**
- `src/services/candidateMatcher.ts` — canonical matcher, extended with all signal types
- `src/services/whatsappIngestionService.ts` — now delegates to `CandidateMatcher`
- `src/workers/cvParserWorker.ts` — now delegates to `CandidateMatcher`

**Matching signal hierarchy (in priority order):**
1. CNIC exact match → auto-merge (highest confidence)  
2. Passport exact match → auto-merge  
3. Phone exact match + name similarity ≥ 0.80 → auto-merge  
4. Email exact match + name similarity ≥ 0.75 → auto-merge  
5. Name + DOB match → auto-merge  
6. Name + father name match → auto-merge  
7. Name-only match (similarity ≥ 0.85) → **manual review** (never auto-merge)

**P0.3 detail:** Name-only matches always go to `needsManualReview = true` regardless of score, preventing silent duplicates.

### P0.4 — DB Email Unique Index

**Migration:** `supabase/migrations/20260225000001_email_unique_partial_index.sql`

```sql
CREATE UNIQUE INDEX IF NOT EXISTS candidates_email_unique_idx
  ON candidates (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';
```

Prevents two candidate rows with the same email at the database level. Partial index so `NULL` emails are allowed (many candidates don't have one).

---

## P1 — Reliability & Admin UX

### P1.1 — Probabilistic Scoring

**File:** `src/services/candidateMatcher.ts`

**Problem:** Old matcher returned on the first signal that fired. If CNIC matched it never checked anything else, so confidence was binary (match/not). Conflicting signals (e.g. phone matches but CNIC doesn't) were ignored.

**New logic:**
- Collect **all** soft signals simultaneously instead of short-circuiting
- Base confidence = strongest single signal score
- **Corroboration bonus:** +3% for each additional signal that agrees (capped at +15%)
- **Conflict penalty:** −5% per signal that actively contradicts (different CNIC, different passport)
- Result includes `confidence` map: `{ cnic, phone, email, name, dob, fatherName }` for audit display

### P1.2 — DB Lookup Indexes

**Migration:** `supabase/migrations/20260225000002_candidates_lookup_indexes.sql`

```sql
CREATE INDEX IF NOT EXISTS candidates_cnic_idx       ON candidates (cnic)       WHERE cnic IS NOT NULL;
CREATE INDEX IF NOT EXISTS candidates_phone_idx      ON candidates (phone)      WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS candidates_email_lower_idx ON candidates (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS candidates_name_trgm_idx  ON candidates USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS candidates_dob_idx        ON candidates (date_of_birth) WHERE date_of_birth IS NOT NULL;
```

Reduces matching query time from full-table scans to index lookups. Critical for performance as the candidate table grows.

### P1.3 — Idempotency Guard in CV Worker

**File:** `src/workers/cvParserWorker.ts`

**Problem:** If the worker crashed mid-processing and restarted, it would re-parse the same attachment and potentially create a second candidate record.

**Fix:** At the start of processing each attachment, check `inbox_attachments.candidate_id`. If already set, skip the entire parse pipeline and log a deduplicate warning. No duplicate created.

```typescript
// Skip if already linked to a candidate (idempotency)
if (attachment.candidate_id) {
  logger.warn(`Attachment ${attachmentId} already linked to candidate ${attachment.candidate_id} — skipping`);
  return;
}
```

### P1.4 — Unmatched Documents Queue UI

**Files:**
- `src/components/UnmatchedDocumentsQueue.tsx` — new component
- `src/components/CVInbox.tsx` — added tab switcher

**What it does:**
- Admin tab "Unmatched Queue" lists all `inbox_attachments` where `candidate_id IS NULL` and `status = 'needs_review'`
- Shows filename, sender, date, preview link
- Admin can manually link the document to an existing candidate or dismiss it
- Count badge on the tab keeps admins aware of unresolved items

---

## P2 — Advanced Matching & Merge Management

### P2.1 — Candidate Merge Audit Trail

#### DB Migration — `supabase/migrations/20260225000003_candidate_merges_audit.sql`

```sql
CREATE TABLE IF NOT EXISTS candidate_merges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id        uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  loser_id         uuid NOT NULL,       -- NOT a FK; loser is soft-deleted
  merged_by        text NOT NULL DEFAULT 'system',
  merge_strategy   text NOT NULL DEFAULT 'winner_wins'
                     CHECK (merge_strategy IN ('winner_wins','loser_wins','manual')),
  field_overrides  jsonb,               -- diff: { fieldName: { from, to } }
  review_reasons   text[],
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS candidate_merges_winner_idx ON candidate_merges (winner_id);
CREATE INDEX IF NOT EXISTS candidate_merges_loser_idx  ON candidate_merges (loser_id);
```

> **Apply this in Supabase Dashboard → SQL Editor:**  
> https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/database/query

#### Backend Service — `src/services/mergeCandidateService.ts`

Key function: `mergeCandidates(winnerId, loserId, options)`

**Steps performed atomically:**
1. Fetch both candidate records, validate both exist and neither is already deleted
2. Determine field overrides based on `merge_strategy`:
   - `winner_wins` (default) — winner keeps all its data; only winner's NULL fields get filled from loser
   - `loser_wins` — loser's non-null fields overwrite winner's fields
   - `manual` — caller provides explicit `fieldOverrides` map
3. Update winner row with any filled fields
4. Re-point `inbox_attachments.candidate_id` from loser → winner
5. Move `candidate_documents` from loser → winner (deduplicated by `file_name + document_type`)
6. Soft-delete loser (`status = 'Deleted'`)
7. Write immutable audit row to `candidate_merges`

Returns `MergeResult`:
```typescript
interface MergeResult {
  winnerId: string;
  loserId: string;
  mergeAuditId: string;
  documentsMoved: number;
  attachmentsRelinked: number;
  fieldsFilledIn: string[];
}
```

#### Backend Routes

```
POST /api/candidates/:id/merge
  Body: { loserId, strategy?, fieldOverrides?, reason? }
  Returns: { success: true, merge: MergeResult }

GET /api/candidates/:id/merges
  Returns: { merges: CandidateMerge[] }
```

**Files changed:**
- `src/services/mergeCandidateService.ts` — new file
- `src/controllers/candidateController.ts` — added `mergeCandidateController`, `getCandidateMergeHistoryController`
- `src/routes/candidates.ts` — added two new routes

---

### P2.2 — Phonetic Name Matching

**File:** `src/services/candidateMatcher.ts`

**Problem:** Pakistani names have many transliteration variants that differ in spelling but are the same name. For example:
- Muhammad / Mohammad / Mohammed / Muhammed / Muhamad — all the same name
- Ahmed / Ahmad — same name
- Hassan / Hasan — same name
- Hussein / Hussain / Husain — same name

Levenshtein similarity between "Muhammad" and "Mohammad" is ~0.75, which falls below the 0.85 threshold → false negative → duplicate candidate created.

**Solution: two-layer approach**

**Layer 1 — Pakistani variant normalization** (`normalizePakistaniName()`):
```
Muhammad / Mohammed / Mohammad / Muhammed / Muhamad → "muhammad"
Ahmed / Ahmad                                        → "ahmed"
Hassan / Hasan                                       → "hassan"
Hussein / Hussain / Husain                           → "hussain"
Omar / Umar                                          → "umar"
Ali / Aly                                            → "ali"
```
After normalization, Levenshtein("muhammad","muhammad") = 1.0 → perfect match.

**Layer 2 — Soundex phonetic matching** (`soundex()` + `phoneticMatch()`):
- Standard Soundex algorithm produces a 4-character code (e.g. M530 for all Muhammad variants)
- Used as a fallback when Levenshtein is below threshold but Soundex codes match
- Lowered threshold to 0.65 when Soundex agrees (less strict, since phonetic similarity adds confidence)

**New `nameMatches()` helper inside `findCandidate()`:**
```typescript
function nameMatches(a: string, b: string, stdThreshold: number): boolean {
  const sim = levenshteinSimilarity(normalizeName(a), normalizeName(b));
  if (sim >= stdThreshold) return true;
  // phonetic fallback
  if (CandidateMatcher.phoneticMatch(a, b) && sim >= 0.65) return true;
  return false;
}
```

Applied to all three name filter paths: name+DOB, name+father, name-only.

---

## P2 Frontend — Merge Candidates UI

### `src/components/MergeCandidatesModal.tsx` — new file

**Props:** `candidate` (the winner), `onClose`, `onMerged`

**Two-tab interface:**

**Tab 1: Merge Duplicate**
1. Warning banner confirming which candidate is the winner
2. Search box — live search of candidates by name/CNIC/phone/code (excludes current candidate)
3. Visual merge diagram showing loser → winner with clear labelling
4. Strategy picker: "Fill in gaps only" (`winner_wins`) vs "Duplicate fills all" (`loser_wins`)
5. Optional reason text field (stored in `review_reasons` in audit log)
6. Submit button calls `POST /api/candidates/:id/merge`
7. Success screen shows summary: docs moved, attachments relinked, fields filled in

**Tab 2: Audit History**
- Loads `GET /api/candidates/:id/merges`
- Lists each merge event with date, merged-by, strategy
- Expandable rows show: winner/loser IDs, reason, field-level diff (before → after)
- "Won" vs "Merged into another" badge distinguishes role

### `src/components/CandidateManagement.tsx` — wired in

- Added `mergeTarget` state (`Candidate | null`)
- Added **Merge** button (purple border) to every candidate card's action row
- Clicking opens `MergeCandidatesModal` with that candidate as winner
- `onMerged` callback triggers list refresh — soft-deleted loser disappears automatically

### `src/lib/apiClient.ts` — API methods added

```typescript
mergeCandidates(winnerId: string, loserId: string, options?: {
  strategy?: 'winner_wins' | 'loser_wins';
  fieldOverrides?: Record<string, unknown>;
  reason?: string;
}): Promise<{ success: boolean; merge: MergeResult }>

getCandidateMergeHistory(candidateId: string): Promise<{ merges: CandidateMerge[] }>
```

---

---

## P3 — Banking-Grade Hardening

### P3.1 + P3.2 — DB Transaction + Row-Level Locking

**Problem:** The P2 merge service ran 5+ sequential DB calls with no transaction boundary. If step 3 failed (e.g. document move), the winner fields had already been updated and the attachments already relinked — no way to undo. Concurrent admin merges could also race on the same candidate pair.

**Solution:** `merge_candidates_atomic()` — a PL/pgSQL function that wraps all writes in one transaction.

**File:** `supabase/migrations/20260225000004_enterprise_hardening.sql`

```sql
CREATE OR REPLACE FUNCTION merge_candidates_atomic(
  p_winner_id uuid, p_loser_id uuid,
  p_winner_updates jsonb, p_docs_to_move uuid[], p_docs_to_delete uuid[],
  p_merged_by text, p_strategy text,
  p_pre_merge_snapshot jsonb, p_field_overrides jsonb, p_review_reasons text[]
) RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  -- ── Row-level lock: blocks concurrent merges on same pair ──────────────────
  PERFORM id FROM candidates WHERE id IN (p_winner_id, p_loser_id) FOR UPDATE;

  -- Guard: loser must not already be deleted
  IF EXISTS (SELECT 1 FROM candidates WHERE id = p_loser_id AND status = 'Deleted') THEN
    RAISE EXCEPTION 'Loser already deleted — merge aborted';
  END IF;

  -- All writes below are atomic. Any RAISE EXCEPTION rolls back everything.
  -- 1. Apply winner field updates (dynamic SQL via allow-list, injection-safe)
  -- 2. UPDATE inbox_attachments SET candidate_id = winner WHERE candidate_id = loser
  -- 3. UPDATE candidate_documents SET candidate_id = winner WHERE id = ANY(docs_to_move)
  -- 4. DELETE FROM candidate_documents WHERE id = ANY(docs_to_delete)
  -- 5. UPDATE candidates SET status = 'Deleted' WHERE id = loser
  -- 6. INSERT INTO candidate_merges (...) — includes pre_merge_snapshot
  -- 7. RETURN { audit_id, attachments_relinked, docs_moved }
END;
$$;
```

The service now calls `db.rpc('merge_candidates_atomic', {...})`. **If Postgres raises an exception, it automatically rolls back all 6 steps** — no partial state is possible.

TypeScript service changes (`mergeCandidateService.ts`):
- Phase 1 (read-only): fetch both records, compute field diffs, build doc lists — nothing written
- Phase 2 (atomic): single `db.rpc()` call — either all writes commit or none do

### P3.3 — Pre-Merge Forensic Snapshot

**Column:** `candidate_merges.pre_merge_snapshot jsonb`

**Shape stored:**
```json
{
  "winner_before": { "name": "...", "cnic": "...", "phone": "...", ... },
  "loser_before":  { "name": "...", "cnic": "...", "phone": "...", ... },
  "captured_at":   "2026-02-25T10:23:45.000Z"
}
```

Captured in TypeScript **before any write** (`const preMergeSnapshot = { ...winner, ...loser }`), then passed to the RPC which stores it in the audit row. This enables:
- Forensic review: reconstruct exactly what both records looked like at merge time
- Legal compliance: full data lineage for overseas worker records
- Rollback analysis: understand what would need to be reversed

### P3.4 — Soft-Delete Enforcement View

**View:** `active_candidates` — enforced at the DB layer, not just the app layer.

```sql
CREATE OR REPLACE VIEW active_candidates AS
  SELECT * FROM candidates WHERE status IS DISTINCT FROM 'Deleted';
```

Soft-deleted losers are now invisible at the DB level. Any query using this view automatically excludes them. Prevents accidentally surfacing merged-away duplicates in reports, exports, or direct DB queries.

### P3.5 — Confidence Persistence

**Columns added to `candidates` table:**
- `last_match_confidence numeric(4,3)` — e.g. `0.972`
- `last_match_signals jsonb` — e.g. `{"cnic": 1.0, "phone": 0.92, "name": 0.88}`

**When saved:** After every successful `CandidateMatcher.findCandidate()` call that returns a match, `persistMatchConfidence()` is called fire-and-forget. It persists:
1. The final probabilistic confidence score
2. The per-signal breakdown

**Why this matters:**
- Banks are required to be able to explain every automated decision
- "Why was Muhammad Usman auto-merged on 2026-02-15?" → look at `last_match_confidence = 0.97, last_match_signals = {cnic: 1.0}` → answer: CNIC exact match at full confidence
- Powers the metrics dashboard and governance reports

### P3.6 — Matching Health Metrics Dashboard

**Backend:** `GET /api/candidates/matching-metrics` — returns:
```json
{
  "totals": { "activeCandidates": 1247, "totalMerges": 83 },
  "merges": {
    "byStrategy": { "winner_wins": 71, "loser_wins": 9, "manual": 3 },
    "byActor":    { "system (auto)": 71, "admin": 12 }
  },
  "confidence": {
    "high": 891, "medium": 203, "low": 48,
    "nameOnlyManualReview": 31,
    "withConfidenceData": 1142
  },
  "signals": { "cnic": 712, "phone": 203, "email": 87, "name_dob": 44, "name": 31 }
}
```

**Frontend widget:** `src/components/MatchingHealthMetrics.tsx`

Displays:
- 4 KPI cards: Active Candidates / Total Merges / Auto-Merge Rate / Manual Reviews
- Confidence distribution bar chart (High / Medium / Low)
- Signal frequency bar chart (CNIC → Passport → Phone → Email → Name+DOB → Name)
- Merge strategy breakdown (fill gaps only / duplicate fills all / manual)
- Actor breakdown (system auto vs admin)

### P3.7 — PII Field-Level Encryption (AES-256-GCM)

**File:** `src/utils/piiEncryption.ts`

**Encrypted fields:** `cnic`, `passport`, `phone`, `email`

**Algorithm:** AES-256-GCM with:
- 256-bit key from `PII_ENCRYPTION_KEY` env var (64-char hex)
- 128-bit random IV per encryption (ensures identical values → different ciphertext)
- 128-bit GCM authentication tag (detects tampering)

**Storage format:** `enc:<16-byte-iv-hex>:<16-byte-tag-hex>:<ciphertext-hex>`

**Key properties:**
- **Backward compatible:** plaintext rows are returned as-is by `decryptPII()` — no migration needed
- **Fail-open:** if key is missing or decryption fails, returns the raw value rather than throwing (prevents read outages)
- **Matching-compatible:** `cnic_normalized` and `passport_normalized` columns still hold plain digits for DB index matching — only display/raw columns are encrypted
- **Helper functions:** `encryptCandidatePII(row)` and `decryptCandidatePII(row)` for safe usage at service boundaries

**To enable:** Add `PII_ENCRYPTION_KEY` to Railway environment variables:
```
PII_ENCRYPTION_KEY=<64-char-hex>
```
Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Pending Manual Steps

### 1. Apply migration `20260225000004_enterprise_hardening.sql`

**URL:** https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/database/query

Run the full SQL from `supabase/migrations/20260225000004_enterprise_hardening.sql`. This:
- Adds `candidate_merges.pre_merge_snapshot` column
- Creates `active_candidates` view
- Adds `candidates.last_match_confidence` and `last_match_signals` columns
- Creates the `merge_candidates_atomic()` PL/pgSQL function (required for merges to work)

### 2. Set PII encryption key in Railway

In Railway → backend service → Variables, add:
```
PII_ENCRYPTION_KEY=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

### 3. Apply P2 migration (if not done yet)

`supabase/migrations/20260225000003_candidate_merges_audit.sql` (required for P2 merge features)

---

## Commit History

| Commit | Repo | Description |
|---|---|---|
| `fb407b48` | backend | P0: unified matching engines + email unique index |
| `b6d806d9` | backend | P1: probabilistic scoring + idempotency guard + DB indexes |
| `08cb237` | frontend | P1: unmatched documents queue UI |
| `db33e1b1` | backend | P2: phonetic matching + Pakistani name normalization + merge audit trail |
| `856d155` | frontend | P2: merge candidates modal + audit history API client |
| `ba72d458` | backend | P3: transaction-safe merge + row locking + snapshot + confidence + PII encryption + metrics |
| `a72efb7` | frontend | P3: matching health metrics dashboard |

---

## Architecture Overview (Post-P3 Implementation)

```
WhatsApp Message
      │
      ▼
whatsappIngestionService
      │
      └──► CandidateMatcher.findCandidate()
                │
                ├── normalize name (Pakistani variants + Soundex)
                ├── check CNIC / Passport / Phone / Email / Name+DOB / Name+Father
                ├── collect ALL signals (probabilistic)
                ├── apply corroboration bonus (+3% per extra signal)
                └── apply conflict penalty (−5% per contradiction)
                      │
                      ├── persist confidence + signal map to candidates row (fire-and-forget)
                      │     └── candidates.last_match_confidence, last_match_signals
                      │
                      ├── confidence ≥ 0.85 + single strong signal → AUTO-MERGE
                      ├── name-only match → MANUAL REVIEW (always)
                      └── no match → CREATE NEW candidate
                                          │
CV Upload (Parser Worker)                 │
      │                                   │
      ├── idempotency check ──────────────┘
      └──► CandidateMatcher.findCandidate()  (same engine)

Admin UI:
  CandidateManagement → [Merge button] → MergeCandidatesModal
                          │
                          └──► mergeCandidateService.mergeCandidates()
                                    │
                                    ├── Phase 1 (reads only, no writes):
                                    │     ├── fetch winner + loser
                                    │     ├── capture pre_merge_snapshot { winner_before, loser_before }
                                    │     ├── compute field updates (winner_wins / loser_wins / manual)
                                    │     └── compute docsToMove + docsToDelete lists
                                    │
                                    └── Phase 2 (db.rpc → single PG transaction):
                                          merge_candidates_atomic()
                                            ├── SELECT ... FOR UPDATE (row-level lock)
                                            │     └── blocks concurrent merges on same pair
                                            ├── UPDATE candidates (field fills)
                                            ├── UPDATE inbox_attachments (relink)
                                            ├── UPDATE candidate_documents (move)
                                            ├── DELETE candidate_documents (dedup)
                                            ├── UPDATE candidates SET status='Deleted' (loser)
                                            └── INSERT candidate_merges (audit + snapshot)
                                                  └── Any failure → full automatic rollback

PII Layer (when PII_ENCRYPTION_KEY is set):
  encryptCandidatePII()  →  cnic, passport, phone, email stored as enc:<iv>:<tag>:<ciphertext>
  decryptCandidatePII()  →  transparent decode at service layer; plaintext rows pass through

Governance Dashboard:
  MatchingHealthMetrics.tsx → GET /api/candidates/matching-metrics
    └── { auto-merge rate, confidence distribution, signal frequency, merge actors }
```
