import json
import re

log_path = r"C:\Users\Claire\.gemini\antigravity\brain\38c8fdfe-3372-44db-ab1e-26364f4728f6\.system_generated\logs\transcript_full.jsonl"
lines = open(log_path, 'r', encoding='utf-8').read().splitlines()

original_lines = {}

for idx, line in enumerate(lines):
    data = json.loads(line)
    tool_calls = data.get('tool_calls', [])
    for tc in tool_calls:
        name = tc.get('name', '')
        if 'view_file' in name:
            args = tc.get('args', {})
            path = args.get('AbsolutePath', '')
            if 'marketing.html' in path:
                if idx + 1 < len(lines):
                    resp_data = json.loads(lines[idx+1])
                    content = resp_data.get('content', '')
                    if content:
                        # Parse lines
                        for cl in content.splitlines():
                            # Match line numbers like "  123: content" or "123: content"
                            m = re.match(r'^\s*(\d+):\s*(.*)', cl)
                            if m:
                                line_no = int(m.group(1))
                                line_content = m.group(2)
                                # Since python backslashreplace / escapes might be written in content,
                                # we should decode them if they are unicode escapes, but in transcript_full
                                # they are saved as raw unicode characters because json.loads parses them.
                                # Let's save it. We always trust the latest view_file before step 400 (which was when refactoring started)
                                if data['step_index'] < 400:
                                    original_lines[line_no] = line_content

print(f"Total lines reconstructed: {len(original_lines)}")
if original_lines:
    max_line = max(original_lines.keys())
    print(f"Max line number: {max_line}")
    # Check if there are any missing lines
    missing = [i for i in range(1, max_line + 1) if i not in original_lines]
    print(f"Missing lines: {missing}")
    
    # Write to a test file
    with open('reconstructed_marketing.html', 'w', encoding='utf-8') as f:
        for i in range(1, max_line + 1):
            f.write(original_lines.get(i, '') + '\n')
    print("Saved to reconstructed_marketing.html")
