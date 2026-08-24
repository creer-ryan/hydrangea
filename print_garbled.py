html = open('marketing.html', 'r', encoding='utf-8').read()
for i, line in enumerate(html.splitlines()):
    if '\ufffd' in line:
        safe_line = repr(line).encode('ascii', errors='backslashreplace').decode('ascii')
        print(f"Line {i+1}: {safe_line}")
