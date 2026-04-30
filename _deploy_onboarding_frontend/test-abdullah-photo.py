import fitz

doc = fitz.open('D:/falisha/Recruitment Automation Portal (2)/Abdullah cv.pdf')
page = doc[0]
img_list = page.get_images(full=True)

if img_list:
    xref = img_list[0][0]
    base_img = doc.extract_image(xref)
    print(f'Extension: {base_img["ext"]}')
    print(f'Size: {len(base_img["image"])} bytes')
    print(f'Width x Height: {base_img["width"]} x {base_img["height"]}')
    print(f'Colorspace: {base_img.get("colorspace", "unknown")}')
    
    # Save to test
    with open(f'abdullah-photo.{base_img["ext"]}', 'wb') as f:
        f.write(base_img["image"])
    print(f'Saved as abdullah-photo.{base_img["ext"]}')
else:
    print('No images found')
