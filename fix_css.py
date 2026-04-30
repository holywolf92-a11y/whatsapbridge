css_path = r'd:\falisha\recruitment-portal-frontend\src\index.css'
lines = open(css_path, encoding='utf-8').readlines()
print('Total lines before:', len(lines))
print('Line 1331:', repr(lines[1330][:60]))

# Keep only custom CSS (first 1330 lines), prepend @import
custom_css = ''.join(lines[:1330])
new_content = '@import "tailwindcss";\n\n' + custom_css

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

lines2 = open(css_path, encoding='utf-8').readlines()
print('New line count:', len(lines2))
print('Line 1:', repr(lines2[0]))
print('Line 3:', repr(lines2[2][:60]))
