"""
Test face detection on Abdullah CV image using OpenCV
"""
import cv2
import numpy as np
from PIL import Image
import fitz

# Load the CV page as image
pdf_path = 'D:/falisha/Recruitment Automation Portal (2)/Abdullah cv.pdf'
doc = fitz.open(pdf_path)
page = doc[0]

# Render page to image at high DPI for better face detection
mat = fitz.Matrix(2, 2)  # 2x zoom for better quality
pix = page.get_pixmap(matrix=mat)
img_data = pix.tobytes("png")
doc.close()

# Convert to OpenCV format
nparr = np.frombuffer(img_data, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

print(f"Image size: {img.shape[1]} x {img.shape[0]} px")

# Try OpenCV's built-in face detection
try:
    # Use Haar Cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(100, 100),  # Minimum face size
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    
    print(f"\nFound {len(faces)} face(s) using Haar Cascade")
    
    if len(faces) > 0:
        # Get the first (usually largest/best) face
        x, y, w, h = faces[0]
        
        print(f"Face location: x={x}, y={y}, width={w}, height={h}")
        print(f"Face covers: {(w*h)/(img.shape[0]*img.shape[1])*100:.1f}% of image")
        
        # Crop face with some padding (20% on each side)
        padding = int(max(w, h) * 0.2)
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(img.shape[1], x + w + padding)
        y2 = min(img.shape[0], y + h + padding)
        
        face_crop = img[y1:y2, x1:x2]
        
        # Save the cropped face
        cv2.imwrite('abdullah-face-detected.jpg', face_crop)
        print(f"\n✅ Face extracted and saved as abdullah-face-detected.jpg")
        print(f"   Size: {x2-x1} x {y2-y1} px")
    else:
        print("\n❌ No face detected with Haar Cascade")
        print("   This could mean:")
        print("   - Photo quality is too low")
        print("   - Face is turned/occluded")
        print("   - Need different detection algorithm")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
