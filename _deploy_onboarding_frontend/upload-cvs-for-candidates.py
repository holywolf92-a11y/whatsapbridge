"""
Upload CV to inbox and trigger parsing for existing candidates
"""
import sys
sys.path.insert(0, 'D:/falisha/Recruitment Automation Portal (2)')

import os
import requests
import hmac
import hashlib
from pathlib import Path

# Configuration
BACKEND_URL = "https://exquisite-surprise-production.up.railway.app"
HMAC_SECRET = "your-hmac-secret-here"  # Update with actual secret

def upload_cv_for_candidate(cv_file_path: str, candidate_name: str):
    """Upload CV to inbox for an existing candidate"""
    
    if not os.path.exists(cv_file_path):
        print(f"❌ CV file not found: {cv_file_path}")
        return
    
    file_name = os.path.basename(cv_file_path)
    print(f"\n📄 Uploading CV: {file_name}")
    print(f"👤 For candidate: {candidate_name}")
    
    # Read CV file
    with open(cv_file_path, 'rb') as f:
        cv_content = f.read()
    
    print(f"   File size: {len(cv_content):,} bytes")
    
    # Upload to backend inbox endpoint
    # This will:
    # 1. Store the CV in Supabase Storage
    # 2. Categorize the document
    # 3. Extract candidate info
    # 4. Match to existing candidate by name/email
    # 5. Trigger CV parsing (including photo extraction)
    
    files = {
        'file': (file_name, cv_content, 'application/pdf')
    }
    
    data = {
        'sender_name': candidate_name,
        'sender_email': '',  # Optional
        'sender_phone': '',  # Optional
    }
    
    try:
        print(f"   Uploading to {BACKEND_URL}/api/inbox/upload...")
        response = requests.post(
            f"{BACKEND_URL}/api/inbox/upload",
            files=files,
            data=data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   Attachment ID: {result.get('id', 'unknown')}")
            print(f"   Document type: {result.get('document_type', 'unknown')}")
            print(f"   Matched candidate: {result.get('candidate', {}).get('name', 'unknown')}")
            print(f"\n⏳ CV parsing and photo extraction will run automatically...")
            print(f"   Check Railway logs for: [PHOTO_EXTRACT] candidate_id=...")
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 80)
    print("CV UPLOADER FOR EXISTING CANDIDATES")
    print("=" * 80)
    print("\n⚠️  INSTRUCTIONS:")
    print("1. Place CV files in this directory")
    print("2. Update the file paths below")
    print("3. Run this script\n")
    
    # Update these paths with actual CV file locations
    cvs_to_upload = [
        # ("path/to/cv.pdf", "Candidate Name"),
        # Example:
        # ("D:/falisha/CVs/Sharafat Ali CV.pdf", "Sharafat Ali"),
        # ("D:/falisha/CVs/M. Abdullah CV.pdf", "M. Abdullah"),
    ]
    
    if not cvs_to_upload:
        print("❌ No CVs configured for upload!")
        print("   Please update the 'cvs_to_upload' list in this script.")
        print("\n📝 Where are the CV files?")
        print("   - Check your Downloads folder")
        print("   - Check the Inbox UI for uploaded files")
        print("   - Ask user for CV file locations")
        sys.exit(1)
    
    for cv_path, candidate_name in cvs_to_upload:
        upload_cv_for_candidate(cv_path, candidate_name)
        print()
    
    print("=" * 80)
    print("✅ UPLOAD COMPLETE")
    print("=" * 80)
    print("\n🔍 Next steps:")
    print("1. Wait 10-30 seconds for CV parsing to complete")
    print("2. Check Railway logs for photo extraction status")
    print("3. Refresh candidate profile pages to see photos")
    print("4. If no photo appears, check logs for face detection results")
