# 🚨 Photo Display Issue - PDF Files Instead of Images

## Problem Identified

### **Root Cause:**
Photos are being saved as **PDF files** instead of **image files (JPG/PNG)**.

**Current Storage:**
```
.../other_documents/1769544025868_...pages_1.pdf  ← PDF file!
```

**Frontend Code:**
```tsx
<img src={c.profile_photo_url} />  ← Trying to display PDF as image ❌
```

**Result:** Photo doesn't display because browsers can't render PDFs in `<img>` tags.

---

## 📊 Why This Happens

### Current Flow:
1. Candidate uploads CV with embedded photo
2. Python parser extracts photo **page** → Still a PDF
3. Saves to Supabase → `*.pdf` file
4. Backend sets `profile_photo_url` → Points to PDF
5. Frontend tries `<img src="...pdf">` → **FAILS** ❌

### Required Flow:
1. Candidate uploads CV with embedded photo
2. Python parser extracts photo **image** → Convert to JPG/PNG
3. Saves to Supabase → `*.jpg` file
4. Backend sets `profile_photo_url` → Points to image
5. Frontend displays `<img src="...jpg">` → **WORKS** ✅

---

## 🔧 Solutions

### **Solution 1: Fix Python Parser (Recommended)**

**Update:** `recruitment-portal-python-parser/split_and_categorize.py`

**Add PDF-to-Image Conversion:**
```python
from pdf2image import convert_from_path
from PIL import Image
import io

def extract_photo_as_image(pdf_path, page_num):
    """Extract a photo page from PDF and convert to JPG"""
    # Convert PDF page to image
    images = convert_from_path(pdf_path, first_page=page_num, last_page=page_num)
    
    if images:
        img = images[0]
        # Save as JPG
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG', quality=95)
        img_buffer.seek(0)
        return img_buffer.getvalue()  # Return JPG bytes
    
    return None
```

**Requirements:**
```
pdf2image==1.16.3
Pillow==10.2.0
poppler-utils (system package)
```

**Then update split logic:**
```python
if doc_type == 'photos':
    # Convert PDF page to JPG image
    jpg_bytes = extract_photo_as_image(pdf_path, page_num)
    filename = f"photo_{timestamp}.jpg"  # Save as .jpg
    mime_type = "image/jpeg"
```

---

### **Solution 2: Backend PDF-to-Image Endpoint (Temporary Workaround)**

Create an endpoint that:
1. Takes PDF URL
2. Converts first page to image using Puppeteer
3. Returns image URL

**Pros:** Quick fix, no Python changes needed
**Cons:** Extra processing, slower

---

### **Solution 3: Frontend PDF Display (Quick Workaround)**

**Update frontend to handle PDF photos:**

```tsx
{c.profile_photo_url ? (
  c.profile_photo_url.endsWith('.pdf') ? (
    // Display PDF as embedded object or use PDF.js
    <embed 
      src={c.profile_photo_url} 
      type="application/pdf" 
      className="w-full h-full rounded-full"
    />
  ) : (
    // Normal image
    <img src={c.profile_photo_url} />
  )
) : (
  <User className="w-16 h-16 text-gray-400" />
)}
```

**Pros:** Works immediately
**Cons:** PDFs don't look good in circular avatars

---

## 🎯 Recommended Approach

### **Phase 1: Quick Fix (Now)**
Use frontend PDF detection to at least show something

### **Phase 2: Proper Fix (Next)**
Update Python parser to extract photos as actual image files

---

## 🔍 **Verification Test**

**Run this SQL to see all photo documents and their file types:**

```sql
SELECT 
  c.name,
  d.file_name,
  d.category,
  d.storage_path,
  CASE 
    WHEN d.storage_path LIKE '%.pdf' THEN 'PDF ❌'
    WHEN d.storage_path LIKE '%.jpg' THEN 'JPG ✅'
    WHEN d.storage_path LIKE '%.png' THEN 'PNG ✅'
    ELSE 'Unknown'
  END as file_type
FROM candidate_documents d
JOIN candidates c ON c.id = d.candidate_id
WHERE d.category = 'photos'
ORDER BY d.created_at DESC
LIMIT 10;
```

**Expected result:** All should show "PDF ❌" (confirming the issue)

---

## 💡 **Which Solution Do You Want?**

1. **Quick frontend fix** (shows PDF in card, not ideal but works) → I can do this now
2. **Proper Python parser fix** (converts PDF → JPG during extraction) → Need to update Python service
3. **Backend conversion endpoint** (converts on-demand) → More complex

**Which approach should I implement?** 🤔
