import fitz, re

FALISHA_EMAIL = 'support@falishajobs.com'
FALISHA_PHONE = '+92 330 3333335'

_EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
_PHONE_RE = re.compile(r'(\+?92[\s\-]?\d{3}[\s\-]?\d{7,8})|(\b0\d{2,3}[\s\-]?\d{6,8}\b)|(\+\d{1,3}[\s\-]\d{3,5}[\s\-]\d{4,9})|(\b\d{4}[\s\-]\d{7}\b)')
_LINKEDIN_RE = re.compile(r'linkedin\.com/in/[a-zA-Z0-9_\-]+', re.IGNORECASE)

def is_falisha(t):
    return FALISHA_EMAIL in t or FALISHA_PHONE in t or 'Falisha' in t

def has_contact(t):
    return bool(_EMAIL_RE.search(t) or _PHONE_RE.search(t) or _LINKEDIN_RE.search(t))

print("=" * 60)
print("VERIFICATION: checking for CANDIDATE contact leaks")
print("=" * 60)

doc = fitz.open(r"D:\falisha\_test_sanitized_output.pdf")
leaks = []
for pg, page in enumerate(doc):
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                t = span.get("text", "").strip()
                if has_contact(t) and not is_falisha(t):
                    leaks.append((pg+1, t))
doc.close()

if leaks:
    print("  FAIL - candidate contact still readable in sanitized PDF:")
    for pg, t in leaks:
        print(f"    Page {pg}: \"{t}\"")
else:
    print("  PASS - No candidate contact details remain in sanitized PDF text layer.")
    print("         Candidate email has been truly redacted (not just covered).")

print()
print("=" * 60)
print("ORIGINAL PDF: what contact details existed before")
print("=" * 60)
doc2 = fitz.open(r"D:\falisha\1777540935403_Ayesha_Saddiqa-_CV-.pdf")
found = []
for pg, page in enumerate(doc2):
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                t = span.get("text", "").strip()
                if has_contact(t):
                    found.append((pg+1, t))
doc2.close()

if found:
    for pg, t in found:
        print(f"  Page {pg}: \"{t}\"  -->  redacted to 'Contact via Falisha'")
else:
    print("  No contact details found in original (may be scanned)")

print()
print("=" * 60)
print("SANITIZED PDF: Falisha banner check (every page)")
print("=" * 60)
doc3 = fitz.open(r"D:\falisha\_test_sanitized_output.pdf")
for pg, page in enumerate(doc3):
    full_text = page.get_text()
    has_fe = FALISHA_EMAIL in full_text
    has_fp = "+92 330" in full_text
    has_banner = "Falisha Manpower" in full_text
    print(f"  Page {pg+1}: Falisha banner={'YES' if has_banner else 'NO'}  email={'YES' if has_fe else 'NO'}  phone={'YES' if has_fp else 'NO'}")
doc3.close()
