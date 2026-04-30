"""
Test script to manually extract profile photo from Abdullah CV and upload to Supabase
"""
import sys
sys.path.insert(0, 'D:/falisha/Recruitment Automation Portal (2)/python-parser')

import fitz
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('D:/falisha/Recruitment Automation Portal (2)/backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip('/')
SUPABASE_URL_FOR_CLIENT = SUPABASE_URL + '/'
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def extract_and_upload_photo():
    # Open PDF
    pdf_path = 'D:/falisha/Recruitment Automation Portal (2)/Abdullah cv.pdf'
    doc = fitz.open(pdf_path)
    page = doc[0]
    
    # Get images
    image_list = page.get_images(full=True)
    print(f"Found {len(image_list)} images in PDF")
    
    if not image_list:
        print("No images found!")
        return
    
    # Extract largest image
    largest_image = None
    largest_size = 0
    
    for i, img_info in enumerate(image_list):
        xref = img_info[0]
        base_img = doc.extract_image(xref)
        img_bytes = base_img["image"]
        img_ext = base_img["ext"]
        img_size = len(img_bytes)
        
        print(f"Image {i}: ext={img_ext}, size={img_size:,} bytes, dims={base_img['width']}x{base_img['height']}")
        
        if img_ext.lower() in ["jpg", "jpeg", "png", "webp"] and 5000 < img_size < 1000000:
            if img_size > largest_size:
                largest_image = {
                    "bytes": img_bytes,
                    "ext": img_ext,
                    "size": img_size
                }
                largest_size = img_size
                print(f"  → Selected as profile photo (size: {img_size:,} bytes)")
    
    doc.close()
    
    if not largest_image:
        print("No valid profile photo found!")
        return
    
    print(f"\nUploading photo ({largest_image['size']:,} bytes, .{largest_image['ext']})...")
    
    # Upload to Supabase
    supabase = create_client(SUPABASE_URL_FOR_CLIENT, SUPABASE_SERVICE_ROLE_KEY)
    
    # Use candidate ID instead of attachment ID
    candidate_id = "1f72d05c-1dbb-4527-9fec-4ecab315d228"  # Abdullah's candidate ID
    bucket_name = "documents"
    file_path = f"candidate_photos/{candidate_id}/profile.{largest_image['ext']}"
    
    print(f"Uploading to: {bucket_name}/{file_path}")
    
    # Upload
    response = supabase.storage.from_(bucket_name).upload(
        file_path, 
        largest_image["bytes"],
        file_options={"content-type": f"image/{largest_image['ext']}"}
    )
    
    print(f"Upload response: {response}")
    
    # Generate public URL
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"
    print(f"\nPublic URL: {public_url}")
    
    # Update candidate record
    print(f"\nUpdating candidate record...")
    result = supabase.table('candidates').update({
        'profile_photo_url': public_url
    }).eq('id', candidate_id).execute()
    
    print(f"Update result: {result}")
    print(f"\n✅ Done! Photo uploaded and candidate updated.")

if __name__ == "__main__":
    extract_and_upload_photo()
