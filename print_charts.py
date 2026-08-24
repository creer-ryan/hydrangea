js = open('marketing.js', 'r', encoding='utf-8').read().splitlines()
for i, line in enumerate(js[1629:1699]):
    safe_line = line.encode('ascii', errors='backslashreplace').decode('ascii')
    print(f"Line {i+1630}: {safe_line}")
