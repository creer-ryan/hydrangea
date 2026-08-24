js = open('marketing.js', 'r', encoding='utf-8').read().splitlines()
for i, line in enumerate(js[1699:1779]):
    safe_line = line.encode('ascii', errors='backslashreplace').decode('ascii')
    print(f"Line {i+1700}: {safe_line}")
