import json

log_path = r"C:\Users\Claire\.gemini\antigravity\brain\38c8fdfe-3372-44db-ab1e-26364f4728f6\.system_generated\logs\transcript_full.jsonl"
lines = open(log_path, 'r', encoding='utf-8').read().splitlines()

all_segments = []

for idx, line in enumerate(lines):
    data = json.loads(line)
    tool_calls = data.get('tool_calls', [])
    for tc in tool_calls:
        name = tc.get('name', '')
        if 'view_file' in name:
            args = tc.get('args', {})
            path = args.get('AbsolutePath', '')
            if 'marketing.html' in path:
                start = args.get('StartLine', 1)
                end = args.get('EndLine', 800)
                if idx + 1 < len(lines):
                    resp_data = json.loads(lines[idx+1])
                    content = resp_data.get('content', '')
                    if content and 'Showing lines' in content:
                        # Extract lines from content
                        # content format: "Showing lines X to Y of Z...\n[line1]\n[line2]..."
                        content_lines = content.splitlines()[1:]
                        all_segments.append((start, end, content_lines))

print(f"Collected {len(all_segments)} segments.")
# Sort segments by start line
all_segments.sort(key=lambda x: x[0])
for s, e, cl in all_segments:
    print(f"Segment: {s} to {e}, actual lines: {len(cl)}")
