# Unified Split Implementation Todo

## Status

| # | Task | Status |
|---|------|--------|
| 1 | **Python:** Create `split_and_categorize.py` (split PDF, Vision per page) | ✅ Done |
| 2 | **Python:** Add `POST /split-and-categorize` endpoint + HMAC auth | ✅ Done |
| 3 | **Python:** Add grouping (Phase 2) + rebuild multi-page PDFs | ✅ Done |
| 4 | **Python:** Layout/regions (Phase 3) via **AWS Textract** | ✅ Done |
| 5 | **Backend:** Preserve original PDF in `original_uploads/` at ingest | ✅ Done |
| 6 | **Backend:** Call `/split-and-categorize`, create multiple doc records | ✅ Done |
| 7 | **Backend:** Store `split_strategy` in document metadata (optional) | ✅ Done |

---

## Done (Phase 1)

- **`recruitment-portal-python-parser/split_and_categorize.py`**
  - `pdf_to_page_images` / `image_to_page_images`
  - `classify_page_vision` (Vision API per page)
  - `apply_confidence_gate` (≥ 0.88 → else `other_documents`)
  - `extract_pages_as_pdf_bytes` (PyMuPDF)
  - `run_split_and_categorize` → `{ success, documents[] }` with `doc_type`, `pages`, `regions`, `confidence`, `identity`, `pdf_base64`, `split_strategy: "page"`

- **`main.py`**
  - `POST /split-and-categorize`: HMAC auth. Returns `{ success, engine_used, documents }`. Optional `use_textract` (false = force vision_only).

- **Dual OCR + Vision fallback**
  - **Primary:** AWS Textract + OpenAI Vision. **Fallback:** OpenAI Vision only. No manual toggle; engine chosen automatically.
  - **`textract_layout.detect_engine`**: lightweight Textract probe. On SubscriptionRequiredException, AccessDeniedException, timeout, throttling, etc. → `vision_only`; else `textract+vision`. Never raises.
  - **Engine A (textract+vision):** Textract layout → regions; Vision classify. Per-page fallback to Vision on Textract error.
  - **Engine B (vision_only):** Vision layout + classification (`VISION_LAYOUT_PROMPT`); multi-region bands → crop → optional 2nd Vision per crop.
  - **Response:** `engine_used: "vision_only" | "textract+vision"`. Per doc: `needs_review: true` when confidence < 0.88 (no blocking).
  - **Env:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`.

---

## How to test

1. Run parser: `.\run-parser.ps1` or `python -m uvicorn main:app --reload` from `recruitment-portal-python-parser`.
2. **Env:** `OPENAI_API_KEY`, `PYTHON_HMAC_SECRET` (required). **Optional:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` for Textract layout.
3. Call `POST /split-and-categorize` with HMAC-signed body: `file_content` (base64), `file_name`, `mime_type`, optional `use_textract` (true/false).
4. Expect `{ "success": true, "engine_used": "...", "documents": [ { "doc_type", "pages", "split_strategy": "page" | "region" | "grouped", "confidence", "identity", "pdf_base64", "needs_review" }, ... ] }`. Consecutive same-type full-page units are merged → `split_strategy: "grouped"`.

---

## Phase 2 grouping (done)

- **`group_consecutive_pages(documents, pdf_bytes, is_pdf)`**: Group **consecutive full-page** units (split_strategy `"page"`) with same `doc_type` → one logical document.
- **Rule:** Consecutive-only. Region units never grouped; they stay standalone.
- **Rebuild:** Extract pages from **original PDF** → merge via `extract_pages_as_pdf_bytes` → one multi-page PDF per group.
- **Output:** `split_strategy: "grouped"`, `pages: [0,1,2,…]`, `confidence`: min of group, `needs_review`: any true in group. Identity from first.
- **Edge cases:** Empty list; single doc; single image (no PDF, 1 page); region in between (no cross-region grouping); cv–passport–cv (3 docs); non-consecutive same type (no grouping).
- **Tests:** `python -m tests.test_grouping` (6 cases).

---

## Backend split-upload (done)

- **`POST /documents/split-upload`** (multer `file`, optional `candidate_id`, `candidate_data`, `use_textract`):
  1. **Preserve original:** `original_uploads/upload_<uuid>.pdf` in `documents` bucket (immutable).
  2. **Call parser:** `POST /split-and-categorize` (HMAC `x-hmac-signature`, body JSON: `file_content` base64, `file_name`, `mime_type`, `candidate_data`, `use_textract`).
  3. **Create candidate if none:** When no `candidate_id` (or not found), create from parser `identity` (or use existing if cnic/passport match).
  4. **Per `documents[]`:** Decode `pdf_base64` → upload to `candidateId/<folder>/...` → insert document (`pages`, `confidence`, `needs_review`, `metadata`).
- **Folder mapping:** `docTypeToFolder` — passport→passport/, cv_resume→cv_resume/, medical_reports→medical_reports/, certificates→certificates/, contracts→contracts/, national_id/cnic→national_id/, driving_license→driving_license/, unmapped→other_documents/.
- **Metadata:** `split_strategy`, `engine_used`, `needs_review` stored per document.
- **Migration:** `009_documents_split_metadata.sql` adds `pages`, `confidence`, `needs_review`, `metadata` to `documents`.
- **Env:** `PYTHON_CV_PARSER_URL` or `PARSER_URL`, `PYTHON_HMAC_SECRET` (required for split-upload).

---

## Next steps

- Run migration `009_documents_split_metadata.sql`. Ensure `PYTHON_CV_PARSER_URL` and `PYTHON_HMAC_SECRET` are set for split-upload.
- Frontend / inbox / Gmail / WhatsApp: switch upload to `POST /documents/split-upload` where appropriate.
