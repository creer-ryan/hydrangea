html = open('marketing.html', 'r', encoding='utf-8').read().splitlines()
for i, line in enumerate(html[26:80]):
    safe_line = line.encode('ascii', errors='backslashreplace').decode('ascii')
    print(f"Line {i+27}: {safe_line}")
