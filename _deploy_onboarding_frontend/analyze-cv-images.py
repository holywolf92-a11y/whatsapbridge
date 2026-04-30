"""
Analyze all images in Abdullah CV to understand what we're extracting
"""
import fitz
from PIL import Image
import io

pdf_path = 'D:/falisha/Recruitment Automation Portal (2)/Abdullah cv.pdf'
doc = fitz.open(pdf_path)

print(f"PDF has {doc.page_count} pages\n")

for page_num in range(min(2, doc.page_count)):
    page = doc[page_num]
    image_list = page.get_images(full=True)
    
    print(f"Page {page_num + 1}: Found {len(image_list)} images")
    print("-" * 80)
    
    for img_index, img_info in enumerate(image_list):
        xref = img_info[0]
        base_image = doc.extract_image(xref)
        
        img_bytes = base_image["image"]
        img_ext = base_image["ext"]
        img_width = base_image["width"]
        img_height = base_image["height"]
        img_size = len(img_bytes)
        
        # Calculate aspect ratio
        aspect_ratio = img_width / img_height if img_height > 0 else 0
        
        # Get image position on page
        img_rects = page.get_image_rects(xref)
        
        print(f"\nImage {img_index + 1}:")
        print(f"  Format: {img_ext}")
        print(f"  Dimensions: {img_width} x {img_height} px")
        print(f"  Aspect Ratio: {aspect_ratio:.2f} (1.0 = square, 0.75 = portrait)")
        print(f"  File Size: {img_size:,} bytes ({img_size/1024:.1f} KB)")
        print(f"  Colorspace: {base_image.get('colorspace', 'unknown')}")
        print(f"  Position on page: {len(img_rects)} rect(s)")
        
        if img_rects:
            rect = img_rects[0]
            print(f"    Top-left: ({rect.x0:.1f}, {rect.y0:.1f})")
            print(f"    Size on page: {rect.width:.1f} x {rect.height:.1f} pt")
            print(f"    Page coverage: {(rect.width * rect.height) / (page.rect.width * page.rect.height) * 100:.1f}%")
        
        # Try to detect if it's likely a profile photo
        is_small = img_width < 800 and img_height < 800
        is_portrait = 0.6 <= aspect_ratio <= 1.4  # Close to square or portrait
        is_reasonable_size = 5000 < img_size < 200000  # 5KB to 200KB
        
        likely_profile = is_small and is_portrait and is_reasonable_size
        
        print(f"  Likely profile photo? {'✅ YES' if likely_profile else '❌ NO'}")
        print(f"    - Small enough? {is_small} (< 800px)")
        print(f"    - Portrait/square? {is_portrait} (ratio 0.6-1.4)")
        print(f"    - Reasonable size? {is_reasonable_size} (5KB-200KB)")
        
        # Save for inspection
        with open(f'abdullah-img-page{page_num+1}-{img_index+1}.{img_ext}', 'wb') as f:
            f.write(img_bytes)
        print(f"  Saved as: abdullah-img-page{page_num+1}-{img_index+1}.{img_ext}")

doc.close()
