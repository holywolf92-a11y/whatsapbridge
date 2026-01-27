# Unified Document Split & Classification Design

**Goal:** One automated system that handles all three scenarios without manual switches or flags.

---

## 1. The Three Possibilities (Recap)

| Scenario | Example | Behavior | Output |
|----------|---------|----------|--------|
| **1. One page = one doc** | P1â†’Passport, P2â†’Medical, P3â†’License | Split â†’ OCR + classify per page | 1 file per folder |
| **2. Multiple pages = one doc** | P1â€“2â†’CV, P3â€“4â†’Passport, P5â†’Medical | Split â†’ classify â†’ **group consecutive** same type â†’ merge | 1 multi-page PDF per folder |
| **3. Multiple docs on same page** | P2â†’Passport (top) + Medical (bottom) | Split â†’ **layout** â†’ regions â†’ classify each â†’ crop | 1 PDF per region |

---

## 2. Unified Decision Engine (High-Level)

```
Input: PDF
  â†“
Split PDF â†’ pages
  â†“
FOR each page:
  â”œâ”€ OCR + layout analysis
  â”œâ”€ DECISION:
  â”‚   â”œâ”€ IF single region (whole page = one doc):
  â”‚   â”‚     â†’ classify page â†’ add to doc group
  â”‚   â””â”€ IF multiple regions detected:
  â”‚         â†’ for each region: validate â†’ classify â†’ treat as separate doc
  â†“
Group consecutive pages with same doc_type (Possibility 2)
  â†“
Rebuild PDFs (1 per group) + crop regions (Possibility 3)
  â†“
Store: passport/, medical_reports/, cv_resume/, etc.
```

**No manual mode switch.** The system infers **single-region vs multi-region** from layout, then applies grouping.

---

## 3. Key Design Questions

### 3.1 How do we know â€œsingle regionâ€ vs â€œmultiple regionsâ€?

**Options:**

| Approach | Pros | Cons |
|----------|------|------|
| **A. Layout model** (e.g. LayoutLM, DocLayout, Detectron2) | Explicit layout + boxes | Heavier; needs training/fine-tuning |
| **B. OCR blocks + heuristics** (Textract/PyMuPDF blocks, whitespace, density) | Reuse existing OCR; no extra model | Heuristic tuning; may miss subtle splits |
| **C. â€œWhole pageâ€ first, then validate** | Simple: always treat page as single doc first | Fails Possibility 3 (multiple docs on same page) |
| **D. Hybrid** | Use OCR blocks â†’ cluster by proximity â†’ if 2+ â€œislandsâ€ with clear gap â†’ multi-region | Balances complexity and accuracy |

**Recommendation:** Start with **D (Hybrid)**. Use **AWS Textract** or **PyMuPDF** block-level output:

- Get bounding boxes per block (paragraph, line, word).
- Cluster blocks by vertical/horizontal proximity (e.g. gap > threshold = new region).
- If **one cluster** â†’ single region (Possibility 1 or 2).  
- If **multiple clusters** with sufficient separation â†’ multi-region (Possibility 3).

Refine thresholds (min gap, min cluster size) empirically.

---

### 3.2 What is â€œone documentâ€ for grouping? (Possibility 2)

**Rule:** Consecutive pages with the **same `doc_type`** form one logical document.

- **Example:** P1â€“2 both `cv_resume` â†’ one CV PDF (2 pages).  
- **Example:** P1 `cv_resume`, P2 `passport`, P3 `cv_resume` â†’ three documents: CV (1p), Passport (1p), CV (1p).

**Edge case:** Same `doc_type` on non-consecutive pages (e.g. two passports separated by medical).  
â†’ **Treat as two separate documents.** Grouping is **consecutive-only**. No cross-page grouping.

---

### 3.3 When do we crop vs when do we use full page?

- **Single region (whole page):** Use full page. No crop.
- **Multi-region:** For each validated region, crop page to region bbox â†’ feed cropped image (or tiny PDF) to classifier and storage. Output = one file per region.

---

## 4. Pipeline (Detailed)

### Phase 1: Page-level processing

```
per_page = []
for each page in PDF:
  img = render_page(page)           # e.g. PyMuPDF, pdf2image
  blocks = ocr_with_layout(img)     # Textract / PyMuPDF blocks with bbox
  regions = compute_regions(blocks) # cluster blocks â†’ list of bboxes

  if len(regions) == 1:
    # Whole page = one doc
    doc_type, confidence = classify(page_or_img, existing_candidate_context?)
    apply_safety_gates(doc_type, confidence, â€¦)
    per_page.append({ "page_idx": i, "doc_type": doc_type, "confidence": confidence, "region": None })
  else:
    # Multiple regions
    for r in regions:
      validate_region(r)  # min size, no overlap
      crop = crop(img, r)
      doc_type, confidence = classify(crop, â€¦)
      apply_safety_gates(doc_type, confidence, â€¦)
      per_page.append({ "page_idx": i, "doc_type": doc_type, "confidence": confidence, "region": r })
```

### Phase 2: Grouping (Possibility 2)

- Sort `per_page` by `(page_idx, region order)`.
- Traverse in order. Consecutive **items** with same `doc_type` â†’ one group.
- **Important:** A â€œitemâ€ is either a full page or a region. So we have a **flat list** of classified units (page or region), then group consecutive same `doc_type`.

```text
Example:
  [{page:1, doc_type: cv_resume}, {page:2, doc_type: cv_resume}, {page:3, doc_type: passport}]
  â†’ groups: [ {doc_type: cv_resume, pages: [1,2]}, {doc_type: passport, pages: [3]} ]
```

### Phase 3: Rebuild & store

- **Full-page groups:** Extract pages from original PDF â†’ merge into one PDF per group â†’ save to `{doc_type}/`.
- **Region-level â€œgroupsâ€:** Each region is its own 1-page (cropped) PDF â†’ save to `{doc_type}/`.

---

## 5. Automation Safety Gates (Mandatory)

| Gate | Purpose | Implementation |
|------|---------|----------------|
| **Confidence â‰¥ 0.88** | Avoid misclassification | Reject or flag if `confidence < 0.88`. Option: `other_documents` + â€œneeds reviewâ€ instead of hard reject. |
| **No overlapping regions** | Correct split in Possibility 3 | For each pair of regions on same page: IoU == 0 (or < small Îµ). Drop or merge if overlap. |
| **Min region size** | Filter noise | Min width/height (e.g. 5% of page) or min area (e.g. 1% of page). Drop tiny regions. |
| **ID uniqueness** | No identity mix | For passport/ID-like docs: extract passport_no, CNIC, etc. If multiple regions on same page have **different** IDs â†’ keep separate. If **same** ID â†’ treat as one doc (e.g. front+back). Optional: same ID across **pages** â†’ same person; validate against candidate. |

**Confidence:**

- Below threshold: **Do not** auto-categorize as specific type. Either:
  - Assign `other_documents` and flag for review, or
  - Retry with different prompt/model, or
  - Reject and surface error.

**Overlap:**

- Use IoU (Intersection over Union). If IoU > 0.01, treat as overlap â†’ resolve (merge small into large, or drop one) per policy.

**Min region size:**

- Configurable % of page width/height or area. Tune so headers/footers and tiny artefacts are excluded.

**ID uniqueness:**

- Run identity extraction (you already have this) on each region/page.
- Use for:
  - **Rejection:** passport in region A â‰  candidateâ€™s passport â†’ reject.
  - **Deduplication:** same passport on two regions (e.g. front/back) â†’ one doc.
  - **No mix:** different IDs on same page â†’ ensure we never merge those into one document.

---

## 6. Data Structures (Suggested)

### 6.1 Per-page / per-region output

```json
{
  "page_idx": 0,
  "region": null,
  "doc_type": "passport",
  "confidence": 0.94,
  "bbox": null
}
```

For a region on the same page:

```json
{
  "page_idx": 1,
  "region": { "x": 0.1, "y": 0, "width": 0.4, "height": 0.5 },
  "doc_type": "passport",
  "confidence": 0.93,
  "bbox": { "x": 0.1, "y": 0, "width": 0.4, "height": 0.5 }
}
```

### 6.2 Grouping output (Possibility 2 style)

```json
[
  { "doc_type": "cv_resume", "pages": [0, 1], "regions": [] },
  { "doc_type": "passport", "pages": [2], "regions": [] },
  { "doc_type": "medical_reports", "pages": [3], "regions": [{ "page": 3, "bbox": {â€¦} }] }
]
```

- `pages`: list of page indices in this group.
- `regions`: for groups that are region-based (Possibility 3), one entry per region (page + bbox).

### 6.3 Stored output

- **Path convention:** `{doc_type}/` e.g. `passport/`, `medical_reports/`, `cv_resume/`.
- **File naming:** e.g. `{candidate_id}_{doc_type}_{timestamp}_{page_range}.pdf` to avoid overwrites and keep traceability.

---

## 7. Tech Stack: AWS Textract vs OpenAI Vision-Only

### Why AWS (Textract) was suggested

- **Block-level OCR + geometry:** Textract returns word/line/block bounding boxes. That gives precise layout for region clustering (Possibility 3) without an extra model.
- **Forms / tables:** Strong on structured documents (passports, forms).
- **Single vendor for layout:** You use OpenAI for classification; Textract was an optional *layout* source.

**You do not need AWS.** The same pipeline can run **OpenAI Vision API only** — no Textract, no AWS.

---

### Vision-only stack (OpenAI only)

Use **OpenAI Vision API** (GPT-4o / GPT-4o-mini with image input) for:

1. **Layout + "single vs multi-region"**  
   Send page image → ask: *"How many distinct document regions on this page? If multiple, describe each (e.g. top half = passport, bottom half = medical) and approximate position: top/middle/bottom, left/right, or % of page."*  
   Parse → 1 region = whole page (Possibility 1/2), 2+ regions = Possibility 3.

2. **Classification**  
   Same Vision call can return `doc_type` per region, or a second call per crop. Return `doc_type` + `confidence` (0.0–1.0) for the ≥ 0.88 gate.

3. **Identity extraction**  
   For passport/ID-like docs: *"Extract name, passport_no, CNIC, expiry_date, etc. Return JSON."* Use for **ID uniqueness** and rejection (e.g. passport ≠ candidate).

4. **Region splitting (Possibility 3)**  
   Vision gives *approximate* layout (e.g. "top 50%", "bottom 50%"). Split the page into bands, crop, then optionally re-classify each crop. Less precise than Textract boxes, but often enough for "passport top, medical bottom" layouts.

**Pipeline (Vision-only):**

```
PDF → split pages → render each page as image (PyMuPDF)
  ↓
FOR each page:
  Vision API: layout + classify (single vs multi-region; doc_type(s) + confidence)
  IF single region → apply gates, add to per_page list
  IF multi-region → split by Vision-described bands → crop each → (optional) Vision classify per crop
  → apply gates, add each region to per_page list
  ↓
Group consecutive same doc_type → rebuild PDFs → store
```

- **PDF → pages / images:** PyMuPDF. **Rebuild PDF:** PyMuPDF / ReportLab. **Everything else:** OpenAI only.

---

### Vision-only vs Textract + OpenAI

| Aspect | Vision-only (OpenAI) | Textract + OpenAI |
|--------|----------------------|-------------------|
| **Vendors** | OpenAI only | AWS + OpenAI |
| **Setup** | No AWS, no Textract keys | Textract + IAM, etc. |
| **Layout precision** | Approximate (top/middle/bottom, %) | Precise word/block boxes |
| **Possibility 3** | Heuristic splits from Vision description | Block clustering → exact crops |
| **Classification** | Vision (image → doc_type + confidence) | Same; Vision or text+LLM |
| **Identity extraction** | Vision (image → JSON) | Textract text → LLM or existing pipeline |
| **OCR quality** | Good for reading; not dedicated OCR | Very strong on forms/tables |
| **Cost** | Vision API per image (and per crop if 2-step) | Textract per page + OpenAI |

**When Vision-only is enough:** No AWS, one API. Simple layouts (one doc per page, or top/bottom half). Approximate region boundaries OK.

**When Textract helps:** Precise bounding boxes; complex, irregular layouts; heavy forms/tables (passports) and max OCR accuracy.

---

### Tech stack summary

| Component | Option | Notes |
|-----------|--------|-------|
| **PDF â†’ pages** | PyMuPDF (fitz) | You already use it. Fast, good rendering. *(Same for both.)* |
| **Layout / OCR** | **Vision-only:** OpenAI Vision | **Textract:** AWS Textract blocks + clustering. **Vision:** Describe layout (single vs multi-region; approximate bands). |
| **Classifier** | OpenAI Vision (GPT-4o / GPT-4o-mini) | Image → `doc_type` + `confidence`. Vision-only: **image input only**; no OCR. |
| **Identity extraction** | Vision: OpenAI Vision; Textract: existing | **Vision:** Image -> JSON (name, passport_no, CNIC, expiry) for ID-uniqueness. **Textract:** existing pipeline. |
| **Rebuild PDF** | PyMuPDF / ReportLab | Merge pages; for regions, 1-page PDF per crop. *(Same for both.)* |

---

## 8. Edge Cases & Open Questions

| Case | Handling |
|------|----------|
| **Low confidence on all regions** | Mark whole page/region as `other_documents`, flag for review. Donâ€™t auto-store as passport/medical/etc. |
| **Overlapping regions** | Reject overlap; merge or drop one region by policy. |
| **Same doc_type, same ID, non-consecutive pages** | Still **two documents** (grouping is consecutive-only). Store both; downstream dedup possible if needed. |
| **Mixed: P1 full-page passport, P2 two regions (passport + medical)** | P1 â†’ one unit. P2 â†’ two units (passport region, medical region). Grouping: P1 passport + P2 passport region â†’ one passport PDF? **Policy choice.** Simpler: **group only consecutive full-page units.** Region units are always 1 â€œfileâ€ each. Easier to implement. |
| **CV multi-page** | Group consecutive `cv_resume` pages into one PDF. |
| **Passport spread on 2 pages** | Two pages, same `doc_type` â†’ one passport PDF (2 pages). ID uniqueness: same passport_no on both â†’ one identity. |

**Open:**

1. **Grouping regions with previous pages:** Do we ever merge â€œlast pageâ€™s passportâ€ with â€œthis pageâ€™s passport regionâ€? Simplest: **no** â€“ region-only outputs are standalone 1-page PDFs. Reduces complexity.
2. **`other_documents` flow:** Auto-store in `other_documents/` and flag, or block storage until human review?
3. **Cost/latency:** Textract + OpenAI or **Vision API only** per page/region. Consider batching, caching, or lighter classifier for obvious cases.

---

## 9. Implementation Phases

### Phase 1: Possibility 1 only (1 page = 1 doc)

- Split PDF â†’ pages.
- Per page: **Vision-only:** render page as image -> Vision API (classify + identity). **Textract:** OCR (existing or Textract) â†’ **current** `categorize_document_with_ai` (or page-level variant).
- Apply confidence â‰¥ 0.88 gate.
- Store one file per page in `{doc_type}/`.
- **No** grouping, **no** layout.

### Phase 2: Possibility 2 (grouping)

- Add **consecutive same `doc_type`** grouping.
- Rebuild multi-page PDFs per group.
- Store one PDF per group.  
- Still no layout; whole page = one unit.

### Phase 3: Possibility 3 (layout + regions)

- **Option A (Vision-only):** Use OpenAI Vision for layout (single vs multi-region; approximate bands) + classify + identity. Split page by Vision-described bands, crop, re-classify per crop. No AWS.
- **Option B (Textract):** Add block-level OCR (Textract), block -> region clustering, multi-region detection -> validate (overlap, min size) -> classify per region -> crop -> store.
- Add **ID uniqueness** gate (extract IDs, validate, dedup same-doc regions) in both options.

### Phase 4: Hardening

- Tunable thresholds (confidence, min region size, overlap Îµ).
- `other_documents` + â€œneeds reviewâ€ flow.
- Monitoring, logging, metrics (e.g. % low-confidence, % multi-region).

---

### Optional hardening (recommended)

**1. Preserve original PDF (strongly recommended)**

Store the original uploaded PDF **once**, before any split:

```
original_uploads/
  └── upload_abc123.pdf
```

- **Reason:** Audit, reprocessing, disputes.
- **No impact** on current split/classify/store flow; add as a single write step at ingest.

**2. Add `split_strategy` field (optional)**

In response metadata (per logical doc, or top-level):

```json
"split_strategy": "page" | "grouped" | "region"
```

- **`page`:** Possibility 1 (one page = one doc).
- **`grouped`:** Possibility 2 (consecutive pages merged into one doc).
- **`region`:** Possibility 3 (region-level split on same page).

- **Helps:** Debugging, analytics, admin review later.

---

## 10. Summary

| Aspect | Proposal |
|--------|----------|
| **Decision logic** | Infer single vs multi-region from **layout** (block clustering). No user-facing mode. |
| **Grouping** | Consecutive same `doc_type` â†’ one PDF. Region-only units = one PDF each. |
| **Safety** | Confidence â‰¥ 0.88; no overlapping regions; min region size; ID uniqueness. |
| **Storage** | `passport/`, `medical_reports/`, `cv_resume/`, etc. One PDF per group or per region. |
| **Phasing** | 1 â†’ 2 â†’ 3 â†’ 4 as above. |

This gives you a **unified, automatic** document-split system that covers all three possibilities and enforces the specified safety gates.

---

## 11. Flow in Our System (Vision-Only)

For a **concrete** flow showing how the Vision-only unified split plugs into our recruitment portal (entry points, backend, Python parser, storage, frontend), see:

**→ [VISION_ONLY_FLOW_IN_OUR_SYSTEM.md](./VISION_ONLY_FLOW_IN_OUR_SYSTEM.md)**

That document covers:

- **Entry points:** Manual upload (Candidate modal), inbox attachments (Gmail / WhatsApp).
- **Backend:** Calls new `POST /split-and-categorize` on the Python parser; HMAC auth.
- **Python parser:** Split PDF → pages → Vision (layout + classify + identity) → gates → group → rebuild PDFs → return `documents[]` with `pdf_base64` per logical doc.
- **Backend (continued):** Identity matching, ID-uniqueness gate, upload to storage, create document records, update candidate flags.
- **Frontend:** No change per doc; multiple docs when one PDF is split.
