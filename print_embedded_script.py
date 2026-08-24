html = open('marketing.html', 'r', encoding='utf-8').read().splitlines()
for i, line in enumerate(html[623:719]):
    safe_line = line.encode('ascii', errors='backslashreplace').decode('ascii')
    print(f"Line {i+624}: {safe_line}")
