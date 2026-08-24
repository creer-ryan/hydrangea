js = open('marketing.js', 'r', encoding='utf-8').read().splitlines()
for i, line in enumerate(js[189:249]):
    safe_line = line.encode('ascii', errors='backslashreplace').decode('ascii')
    print(f"Line {i+190}: {safe_line}")
