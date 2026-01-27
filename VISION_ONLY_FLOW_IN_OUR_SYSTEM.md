# Vision-Only Unified Split: Flow in Our System

This document describes **how** the full unified split (Possibilities 1–3 + safety gates) using **OpenAI Vision API only** plugs into our recruitment portal.

---

## 1. High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ENTRY POINTS                                                                │
│  • Manual upload (Candidate modal / Document upload)                         │
│  • Inbox attachment (Gmail / WhatsApp) → parsing job                         │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKEND                                                                     │
│  • Receives PDF (or image)                                                   │
│  • Preserve original: store in original_uploads/upload_<id>.pdf (audit)      │
│  • Optionally: candidate_id, source (web / inbox / etc.)                     │
│  • Calls Python parser: POST /split-and-categorize (NEW)                     │
│  • HMAC auth (same as /categorize-document)                                  │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PYTHON PARSER (recruitment-portal-python-parser)                            │
│  • Split PDF → pages (PyMuPDF)                                               │
│  • Render each page as image (PyMuPDF)                                       │
│  • FOR each page:                                                            │
│      Vision API: layout + classify (single vs multi-region; doc_type + conf) │
│      IF single region → apply gates → add to per_page                        │
│      IF multi-region → split by bands → crop → Vision per crop → gates       │
│  • Group consecutive same doc_type (Possibility 2)                           │
│  • Rebuild PDFs (1 per group) + crop regions → PDFs                          │
│  • Return: { success, documents: [ { doc_type, pages, regions?, identity,    │
│             confidence, pdf_base64, split_strategy }, ... ] }                │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKEND (continued)                                                         │
│  • For each logical doc in response:                                         │
│      - Run identity matching (if candidate_id or identity from doc)          │
│      - Apply ID-uniqueness gate (reject if passport ≠ candidate)             │
│      - Upload PDF to storage (Supabase)                                      │
│      - Create document record (candidate_documents / documents)              │
│      - Update candidate flags (passport_received, medical_received, etc.)    │
│  • Return to client: document(s), request_id                                 │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                                    │
│  • Candidate modal: documents listed by category (passport, medical, CV…)    │
│  • One uploaded PDF → multiple docs when split (no UX change per doc)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entry Points

| Source | Trigger | Input | Candidate context |
|--------|---------|-------|-------------------|
| **Manual upload** | User uploads PDF in Candidate modal or Document upload | File, `candidate_id`, source `web` | Yes |
| **Inbox (Gmail / WhatsApp)** | New attachment → parsing job | PDF URL or bytes, optional `candidate_id` | Maybe (matched later) |

- **Manual upload:** We always have `candidate_id`. Identity matching checks doc vs candidate.
- **Inbox:** We may not have `candidate_id` initially. We can use identity from Vision to **find or create** candidate, then attach docs.

---

## 3. Backend → Python Parser

### 3.1 New endpoint: `POST /split-and-categorize`

**Request (same shape as `/categorize-document` for compatibility):**

- `file_content`: base64-encoded PDF or image
- `file_name`: e.g. `docs.pdf`
- `mime_type`: `application/pdf` or image type
- `candidate_data` (optional): `{ id, name, passport, cnic, ... }` for ID-uniqueness check

**Headers:** `x-hmac-signature` (HMAC of body).

**Response:**

```json
{
  "success": true,
  "documents": [
    {
      "doc_type": "cv_resume",
      "pages": [0, 1],
      "regions": [],
      "confidence": 0.94,
      "identity": { "name": "...", "passport_no": "...", ... },
      "pdf_base64": "<base64 of rebuilt PDF>",
      "split_strategy": "grouped"
    },
    {
      "doc_type": "passport",
      "pages": [2],
      "regions": [],
      "confidence": 0.96,
      "identity": { "passport_no": "...", "passport_expiry": "...", ... },
      "pdf_base64": "<base64>",
      "split_strategy": "page"
    }
  ]
}
```

- **Possibility 1 (1 page = 1 doc):** Each `documents[]` has `pages: [i]`, `regions: []`, `split_strategy: "page"`.
- **Possibility 2 (multi-page = 1 doc):** Same `doc_type` on consecutive pages → one entry with `pages: [0,1]`, one `pdf_base64` (merged), `split_strategy: "grouped"`.
- **Possibility 3 (multi-doc on same page):** `regions` non-empty, `pdf_base64` per region (cropped 1-page PDFs), `split_strategy: "region"`.

**`split_strategy`** (optional): `"page"` | `"grouped"` | `"region"` per doc. Helps debugging, analytics, admin review.

Backend uses `doc_type`, `identity`, `pdf_base64` for storage, matching, and flags. Optionally persist `split_strategy` in document metadata.

### 3.2 When to call `/split-and-categorize` vs `/categorize-document`

| Use case | Endpoint | Behaviour |
|----------|----------|-----------|
| **Unified split (Vision-only)** | `/split-and-categorize` | Split → Vision per page/region → group → rebuild → return **multiple** docs |
| **Legacy “single doc”** | `/categorize-document` | Whole PDF → one category + identity (current behaviour) |

You can switch **upload** and **inbox** flows to `/split-and-categorize` when you want unified split. Keep `/categorize-document` for backward compatibility or single-doc paths.

---

## 4. Python Parser Internal Flow (Vision-Only)

### 4.1 Pipeline

1. **Decode** `file_content` → bytes.
2. **Split PDF → pages** (PyMuPDF). If image, treat as single “page”.
3. **Render** each page as image (PyMuPDF); keep `page_idx`.
4. **For each page:**
   - **Vision API** (single request per page):  
     - “How many distinct document regions on this page? If multiple, describe each (e.g. top half = passport, bottom half = medical) and approximate position: top/middle/bottom, left/right, or % of page.”  
     - “For each region (or whole page if single), give `doc_type` and `confidence` (0.0–1.0).”
   - Parse response → **single region** vs **multi-region**.
   - **If single region:**  
     - `doc_type`, `confidence` from Vision.  
     - Apply **safety gates** (confidence ≥ 0.88; if below → `other_documents` or reject).  
     - Append `{ page_idx, doc_type, confidence, region: null }` to `per_page`.
   - **If multi-region:**  
     - Split page by Vision-described bands (e.g. top 50% / bottom 50%).  
     - Crop each region → optional **second** Vision call per crop to confirm `doc_type` + `confidence`.  
     - Validate **no overlap**, **min region size**.  
     - For each region: apply gates → append `{ page_idx, doc_type, confidence, region }` to `per_page`.
5. **Group** consecutive `per_page` items with same `doc_type` (Possibility 2).
6. **Rebuild PDFs:**  
   - Full-page groups: extract pages from original PDF → merge → one PDF per group.  
   - Region groups: one 1-page PDF per cropped region.
7. **Identity:** For each group, run Vision identity extraction on its image(s) (or reuse from step 4 if already asked).  
   - Output `identity` per logical doc.
8. **Encode** each rebuilt PDF as `pdf_base64`.
9. **Return** `{ success, documents: [ ... ] }`.

### 4.2 Safety gates (in parser)

- **Confidence ≥ 0.88:** Else map to `other_documents` or skip.
- **No overlapping regions:** IoU &lt; ε for any two regions on same page.
- **Min region size:** Drop tiny regions (e.g. &lt; 5% page area).
- **ID uniqueness:** Handled in **backend** using `identity` + `candidate_data` (see below).

---

## 5. Backend After Python Returns

### 5.1 Per logical doc

1. **Identity matching** (when `candidate_id` or `candidate_data` exists):  
   - Compare `identity.passport_no`, `identity.cnic`, etc. to candidate.  
   - If **passport mismatch** → **reject** (or flag for review). **ID-uniqueness gate.**
2. **Storage:**  
   - Decode `pdf_base64` → buffer.  
   - Upload to Supabase Storage (e.g. `documents` bucket, path `{candidate_id}/{doc_type}/{timestamp}_{name}.pdf`).  
   - **Optional:** Persist `split_strategy` in document metadata (DB column or JSON) for debugging/analytics.
3. **DB:**  
   - Insert into `candidate_documents` (or `documents`) with `candidate_id`, `doc_type`, `storage_path`, `file_name`, etc. (and `split_strategy` if stored).
4. **Candidate flags:**  
   - If `doc_type` ∈ `passport` → `passport_received = true`.  
   - If `doc_type` ∈ `medical_reports` → `medical_received = true`.  
   - Same as today, but applied per **logical** doc.

### 5.2 Inbox-specific

- If **no** `candidate_id` initially: use `identity` to **find or create** candidate (e.g. by passport/CNIC/email).  
- Then attach all `documents[]` to that candidate as above.

### 5.3 Response to client

- Return **list** of created documents + `request_id` (e.g. for verification log).  
- Frontend already lists docs by category; it just sees more docs when one PDF was split.

---

## 6. Frontend Impact

- **Upload:** User still selects **one** file. Backend calls `/split-and-categorize`; multiple docs may be created.  
- **Candidate modal:** Documents list shows each logical doc (passport, medical, CV, etc.) as today.  
- **No change** to existing UI **per document**; only the **number** of docs can increase when we split.

Optional later:  
- “Split view” or metadata indicating “Created from split” for clarity.

---

## 7. Optional: Use Existing `/categorize-document` for “Single-Doc” Path

- **Single-doc path:** Backend sends same file to `/categorize-document` → one category + identity.  
- **Split path:** Backend sends same file to `/split-and-categorize` → multiple docs.

You can choose per flow (e.g. **inbox** always split, **manual upload** configurable) or migrate everything to split.

---

## 8. Optional Hardening (Recommended)

**1. Preserve original PDF (strongly recommended)**

- **When:** Backend receives the uploaded PDF **before** calling `/split-and-categorize`.
- **Where:** Store once in e.g. `original_uploads/upload_<id>.pdf` (Supabase Storage or same bucket, distinct prefix).
- **Reason:** Audit, reprocessing, disputes.
- **Impact:** Single write at ingest; no change to split/classify/store flow.

**2. Add `split_strategy` per document (optional)**

- **Who:** Python parser sets it per logical doc; backend persists in document metadata.
- **Values:** `"page"` (Possibility 1) | `"grouped"` (Possibility 2) | `"region"` (Possibility 3).
- **Helps:** Debugging, analytics, admin review later.

---

## 9. Summary: Flow Checklist

| Step | Component | Action |
|------|-----------|--------|
| 1 | Frontend / Inbox | User or system provides PDF (and optionally `candidate_id`). |
| 2 | Backend | **Preserve original** → `original_uploads/upload_<id>.pdf`. POST to Python `/split-and-categorize`. |
| 3 | Python parser | Split PDF → pages → Vision (layout + classify + identity) → gates → group → rebuild PDFs. |
| 4 | Python parser | Return `{ success, documents: [ { doc_type, pages, regions?, identity, confidence, pdf_base64, split_strategy } ] }`. |
| 5 | Backend | Identity matching + ID-uniqueness; reject or flag on mismatch. |
| 6 | Backend | Upload each `pdf_base64` to storage; create document records (optionally store `split_strategy`); update candidate flags. |
| 7 | Frontend | List documents by category as today; multiple docs when split. |

---

## 10. Where This Lives in the Repo

| Part | Location |
|------|----------|
| **New Python endpoint** | `recruitment-portal-python-parser/main.py` → `POST /split-and-categorize` |
| **Vision-only split logic** | New module e.g. `recruitment-portal-python-parser/split_and_categorize.py` (split, Vision, group, rebuild) |
| **Backend caller** | Document upload flow / verification worker (or inbox job) → HTTP client to `PYTHON_CV_PARSER_URL` + `/split-and-categorize` |
| **Storage + DB** | Existing `documentService` / `candidateDocumentService`; extend to “create many” from `documents[]` |
| **Original PDF** | Backend: write to `original_uploads/upload_<id>.pdf` at ingest (before split call) |
| **split_strategy** | Python: set per doc in response; Backend: optional DB column or metadata JSON |

---

This gives you a **concrete flow** for implementing the full unified split (Possibilities 1–3 + safety gates) with **OpenAI Vision API only** inside our current system.
