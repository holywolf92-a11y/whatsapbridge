#!/usr/bin/env python3
import fitz
import requests
import os

pdf_path = r"D:\falisha\Recruitment Automation Portal (2)\Hamna Ghouri Resume.pdf"
supabase_url = "https://hncvsextwmvjydcukdwx.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc19zdXBlcmFkbWluIjp0cnVlLCJpc3MiOiJzdXBhYmFzZSIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MCwicm9sZSI6InN0b3JhZ2Vfc3VwZXJ1c2VyIn0.EK6VwQlMX4zPY6ycGZjJFj_s9cLTnUe5VvfWJJ97i5Y"
attachment_id = "test-photo-extraction"

print("🔍 Extracting photo from PDF...")
pdf_document = fitz.open(pdf_path)
first_page = pdf_document[0]
images = first_page.get_images(full=True)

print(f"Found {len(images)} images")

if images:
    for idx, img_info in enumerate(images):
        xref = img_info[0]
        base_image = pdf_document.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        image_size = len(image_bytes)
        
        print(f"\nImage {idx}:")
        print(f"  Size: {image_size:,} bytes")
        print(f"  Format: {image_ext}")
        
        if 5000 < image_size < 1000000:
            print(f"  ✅ Size is valid!")
            
            # Try to upload
            bucket_name = "documents"
            file_path = f"candidate_photos/{attachment_id}/profile.{image_ext}"
            upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{file_path}"
            
            headers = {
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": f"image/{image_ext}",
            }
            
            print(f"\n📤 Uploading to Supabase...")
            print(f"   URL: {upload_url}")
            
            response = requests.post(upload_url, data=image_bytes, headers=headers)
            print(f"   Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{file_path}"
                print(f"   ✅ Upload successful!")
                print(f"   Public URL: {public_url}")
            else:
                print(f"   ❌ Upload failed: {response.text}")
        else:
            print(f"  ❌ Size invalid")

pdf_document.close()
