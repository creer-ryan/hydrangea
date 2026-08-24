import re

js = open('marketing.js', 'r', encoding='utf-8').read()
for m in re.finditer(r'(\w+)\.(style|classList|innerHTML|innerText|addEventListener|querySelector)', js):
    var = m.group(1)
    # find where var is declared
    decl = re.search(fr'(const|let|var)\s+{var}\s*=', js[:m.start()])
    if decl:
        # print the usage line
        line_no = js.count('\n', 0, m.start()) + 1
        # Check if it's protected by an "if" statement
        # simple check: is there "if (var)" or "if(var)" or "if ( ... var ... )" nearby?
        # We can extract the block context
        context = js[max(0, m.start()-100):m.start()]
        is_checked = f"if ({var})" in context or f"if({var})" in context or f"if ( {var}" in context or f"if({var}" in context or f"if (container)" in context or f"if (matchingBtn)" in context or f"if (panel)" in context or f"if (originalSaveRecord)" in context or f"if (btnSummary" in context or f"if (btnDetails" in context or f"if (btnService" in context
        if not is_checked:
            # Let's print for manual verification
            print(f"Line {line_no}: {m.group(0)} (potential unchecked)")
