"""
Standalone test for CV sanitization logic — no HTTP server needed.
Reads:  D:\falisha\1777540935403_Ayesha_Saddiqa-_CV-.pdf
Writes: D:\falisha\_test_sanitized_output.pdf
"""

import re
import fitz
import base64
from PIL import Image, ImageDraw
import io

# ── Falisha contact constants ─────────────────────────────────────────────────
FALISHA_EMAIL       = "support@falishajobs.com"
FALISHA_PHONE       = "+92 330 3333335"
FALISHA_BANNER_TEXT = (
    f"Presented by Falisha Manpower Recruitment Agency  |  "
    f"Contact: {FALISHA_EMAIL}  |  WhatsApp: {FALISHA_PHONE}"
)
FALISHA_FOOTER_TEXT = f"Falisha Manpower  |  {FALISHA_EMAIL}  |  {FALISHA_PHONE}"
CONTACT_REPLACEMENT = "Contact via Falisha"

# ── Detection regexes ─────────────────────────────────────────────────────────
_CV_EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
_CV_PHONE_RE = re.compile(
    r'(\+?92[\s\-]?\d{3}[\s\-]?\d{7,8})'
    r'|(\b0\d{2,3}[\s\-]?\d{6,8}\b)'
    r'|(\+\d{1,3}[\s\-]\d{3,5}[\s\-]\d{4,9})'
    r'|(\+\d{7,15}\b)'                               # international no-space: +97452027739
    r'|(\b\d{4}[\s\-]\d{7}\b)',
)
_CV_LINKEDIN_RE = re.compile(r'linkedin\.com/in/[a-zA-Z0-9_\-]+', re.IGNORECASE)
_DIGITAL_MIN_CHARS = 80


def _span_has_contact(text: str) -> bool:
    t = text.strip()
    if not t:
        return False
    if _CV_EMAIL_RE.search(t):
        return True
    if _CV_PHONE_RE.search(t):
        return True
    if _CV_LINKEDIN_RE.search(t):
        return True
    return False


def _add_falisha_banners(doc):
    BANNER_H    = 30
    FOOTER_H    = 22
    BANNER_FILL = (0.0, 0.36, 0.57)
    FOOTER_FILL = (0.10, 0.10, 0.10)
    WHITE       = (1.0, 1.0, 1.0)

    for page_num, page in enumerate(doc):
        w = page.rect.width
        h = page.rect.height

        if page_num == 0:
            banner_rect = fitz.Rect(0, 0, w, BANNER_H)
            page.draw_rect(banner_rect, color=BANNER_FILL, fill=BANNER_FILL, fill_opacity=0.5, overlay=True)
            page.insert_textbox(
                fitz.Rect(8, 5, w - 8, BANNER_H - 4),
                FALISHA_BANNER_TEXT,
                fontsize=7.2,
                color=WHITE,
                align=fitz.TEXT_ALIGN_LEFT,
                overlay=True,
            )

        footer_rect = fitz.Rect(0, h - FOOTER_H, w, h)
        page.draw_rect(footer_rect, color=FOOTER_FILL, fill=FOOTER_FILL, overlay=True)
        page.insert_textbox(
            fitz.Rect(8, h - FOOTER_H + 4, w - 8, h - 4),
            FALISHA_FOOTER_TEXT,
            fontsize=7.0,
            color=WHITE,
            align=fitz.TEXT_ALIGN_CENTER,
            overlay=True,
        )


def sanitize_digital_pdf(pdf_bytes: bytes) -> tuple:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_redacted = 0
    found_contacts = []

    for page_num, page in enumerate(doc):
        rects_to_redact = []

        for block in page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE).get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    span_text = span.get("text", "").strip()
                    if not span_text:
                        continue
                    if _span_has_contact(span_text):
                        bbox = span.get("bbox")
                        if bbox:
                            rects_to_redact.append(fitz.Rect(bbox))
                            found_contacts.append({
                                "page": page_num + 1,
                                "text": span_text,
                                "bbox": bbox,
                            })

        if rects_to_redact:
            for rect in rects_to_redact:
                expanded = fitz.Rect(rect.x0 - 1, rect.y0 - 2, rect.x1 + 60, rect.y1 + 2)
                page.add_redact_annot(
                    expanded,
                    text=CONTACT_REPLACEMENT,
                    fontsize=7.5,
                    fill=(0.94, 0.94, 0.94),
                    text_color=(0.25, 0.25, 0.25),
                )
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
            total_redacted += len(rects_to_redact)

    _add_falisha_banners(doc)
    out_bytes = doc.tobytes(garbage=4, deflate=True, clean=True)
    doc.close()
    return out_bytes, total_redacted, found_contacts


# ── Run the test ──────────────────────────────────────────────────────────────
INPUT_PDF  = r"D:\falisha\1777540935403_Ayesha_Saddiqa-_CV-.pdf"
OUTPUT_PDF = r"D:\falisha\_test_sanitized_output.pdf"

print("=" * 60)
print("CV Sanitization Test")
print("=" * 60)
print(f"Input:  {INPUT_PDF}")
print(f"Output: {OUTPUT_PDF}")
print()

with open(INPUT_PDF, "rb") as f:
    pdf_bytes = f.read()

print(f"Original size: {len(pdf_bytes):,} bytes")

# Probe
probe_doc  = fitz.open(stream=pdf_bytes, filetype="pdf")
pages      = len(probe_doc)
all_text   = "\n".join(probe_doc[i].get_text() for i in range(pages))
probe_doc.close()

print(f"Pages:         {pages}")
print(f"Total chars:   {len(all_text):,}")
print(f"Type detected: {'Digital PDF' if len(all_text.strip()) >= _DIGITAL_MIN_CHARS else 'Scanned/image PDF'}")
print()

# Find contacts BEFORE sanitization (preview)
print("── Contact details found in original PDF ──")
doc_preview = fitz.open(stream=pdf_bytes, filetype="pdf")
for pg_num, page in enumerate(doc_preview):
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                t = span.get("text", "").strip()
                if _span_has_contact(t):
                    print(f"  Page {pg_num+1} | bbox {[round(x,1) for x in span['bbox']]} | \"{t}\"")
doc_preview.close()
print()

# Sanitize
print("── Running sanitization ──")
out_bytes, count, found = sanitize_digital_pdf(pdf_bytes)
print(f"Redacted spans: {count}")
for item in found:
    print(f"  Page {item['page']} | \"{item['text']}\"  →  '{CONTACT_REPLACEMENT}'")

print()
print(f"Output size: {len(out_bytes):,} bytes")

with open(OUTPUT_PDF, "wb") as f:
    f.write(out_bytes)
print(f"Saved to: {OUTPUT_PDF}")

# Verify: check that contact strings are gone from the output
print()
print("── Verification: checking sanitized PDF for remaining contact text ──")
verify_doc = fitz.open(stream=out_bytes, filetype="pdf")
leaked = []
for pg_num, page in enumerate(verify_doc):
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                t = span.get("text", "").strip()
                if _span_has_contact(t):
                    leaked.append(f"Page {pg_num+1}: \"{t}\"")
verify_doc.close()

if leaked:
    print("  ⚠  Contact text still found in output (possible leak):")
    for l in leaked:
        print(f"    {l}")
else:
    print("  ✅ No candidate contact details found in output PDF text layer.")

print()
print("── Checking banner/footer text in output ──")
verify_doc2 = fitz.open(stream=out_bytes, filetype="pdf")
for pg_num, page in enumerate(verify_doc2):
    full_text = page.get_text()
    has_email = FALISHA_EMAIL in full_text
    has_phone = FALISHA_PHONE in full_text
    print(f"  Page {pg_num+1}: Falisha email={'✅' if has_email else '❌'}  phone={'✅' if has_phone else '❌'}")
verify_doc2.close()

print()
print("Test complete.")
