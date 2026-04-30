#!/usr/bin/env python3
import fitz  # PyMuPDF
import sys

pdf_path = r"D:\falisha\Recruitment Automation Portal (2)\Hamna Ghouri Resume.pdf"

try:
    print(f"📄 Analyzing: {pdf_path}")
    pdf_document = fitz.open(pdf_path)
    
    print(f"📖 Total pages: {pdf_document.page_count}\n")
    
    for page_num in range(min(3, pdf_document.page_count)):  # Check first 3 pages
        print(f"--- Page {page_num + 1} ---")
        page = pdf_document[page_num]
        images = page.get_images(full=True)
        
        print(f"Images found: {len(images)}")
        
        for img_index, img_info in enumerate(images):
            xref = img_info[0]
            base_image = pdf_document.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            image_size = len(image_bytes)
            
            print(f"  Image {img_index}: {image_size:,} bytes ({image_ext})")
            
            # Check if it meets criteria
            if 5000 < image_size < 1000000:
                print(f"    ✅ VALID PROFILE PHOTO SIZE")
            elif image_size <= 5000:
                print(f"    ❌ Too small (< 5KB)")
            else:
                print(f"    ❌ Too large (> 1MB)")
        
        print()
    
    pdf_document.close()
    print("✅ Analysis complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
