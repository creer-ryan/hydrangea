import re

with open('marketing.html', 'rb') as f:
    html_bytes = f.read()
html = html_bytes.decode('utf-8', errors='replace')

# 1. Extract Mode Selector
mode_selector_match = re.search(r'<!-- Mode Selector \(總表 vs 明細\) -->.*?</div>', html, re.DOTALL)
if not mode_selector_match:
    print("Mode selector not found")
else:
    mode_selector_str = mode_selector_match.group(0)

# 2. Extract sub-panels
def extract_div(html, div_id):
    pattern = f'<div id="{div_id}"'
    start_idx = html.find(pattern)
    if start_idx == -1: return ""
    open_divs = 0
    end_idx = start_idx
    while end_idx < len(html):
        if html[end_idx:end_idx+4] == '<div':
            open_divs += 1
            end_idx += 4
        elif html[end_idx:end_idx+5] == '</div':
            open_divs -= 1
            end_idx += 5
            if open_divs == 0:
                # include the trailing >
                end_idx = html.find('>', end_idx) + 1
                break
        else:
            end_idx += 1
    return html[start_idx:end_idx]

sub_panel_client = extract_div(html, "sub-panel-client")
sub_panel_sales = extract_div(html, "sub-panel-sales")
sub_panel_analyst = extract_div(html, "sub-panel-analyst")

# 3. Remove Mode Selector and summary-dashboard-panel
if mode_selector_match:
    html = html.replace(mode_selector_str, '')
summary_dashboard_panel = extract_div(html, "summary-dashboard-panel")
if summary_dashboard_panel:
    html = html.replace(summary_dashboard_panel, '')

# 4. Remove details-list-panel wrapper but keep contents
details_panel_str = extract_div(html, "details-list-panel")
if details_panel_str:
    # Remove the wrapper
    inner_content = details_panel_str
    inner_content = re.sub(r'^<div id="details-list-panel"[^>]*>', '', inner_content)
    inner_content = re.sub(r'</div>$', '', inner_content.strip())
    html = html.replace(details_panel_str, inner_content)

# 5. Insert tabs in the top nav
tab_insert_point = '<button class="marketing-tab-btn" data-target="panel-firms"'
new_tab = '<button class="marketing-tab-btn" data-target="panel-sales" style="padding: 10px 24px; border: none; background: transparent; font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s ease;">營業員專頁</button>\n                '
html = html.replace(tab_insert_point, new_tab + tab_insert_point)

# Cache buster for JS
html = html.replace('src="marketing.js"', 'src="marketing.js?v=3"')

# 6. Build the injection block for a specific role
def build_panel_injection(role, role_name_en, panel_content, original_table_html):
    # original_table_html is everything inside the <div id="panel-role"> after the header
    return f"""
            <!-- Mode Selector -->
            <div style="display:flex; gap:12px; margin-bottom:16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                <button class="btn mode-btn active" id="btn-mode-summary-{role}" style="padding: 8px 24px; font-weight:600; cursor:pointer; border-radius:4px; border:1px solid #D1D5DB; background:#5C8ED6; color:white;">總表 <span style="font-size:11px; font-weight:normal;">Summary</span></button>
                <button class="btn mode-btn" id="btn-mode-details-{role}" style="padding: 8px 24px; font-weight:600; cursor:pointer; border-radius:4px; border:1px solid #D1D5DB; background:white; color:#374151;">明細 <span style="font-size:11px; font-weight:normal;">Details</span></button>
            </div>
            
            <div id="summary-container-{role}" style="display:block;">
                {panel_content}
            </div>
            
            <div id="details-container-{role}" style="display:none;">
                {original_table_html}
            </div>
"""

# 7. Modify Panel Clients
panel_clients_html = extract_div(html, "panel-clients")
if panel_clients_html:
    table_start = panel_clients_html.find('<div class="data-table-wrapper"')
    if table_start != -1:
        header_html = panel_clients_html[:table_start]
        rest_html = panel_clients_html[table_start:-6]
        sub_client = sub_panel_client.replace('display:none;', 'display:grid;')
        sub_client = sub_client.replace('sub-dashboard-panel', '') # Remove class to prevent js interference
        new_panel_clients = header_html + build_panel_injection('client', 'Client', sub_client, rest_html) + "</div>"
        html = html.replace(panel_clients_html, new_panel_clients)

# 8. Modify Panel Researchers
panel_researchers_html = extract_div(html, "panel-researchers")
if panel_researchers_html:
    table_start = panel_researchers_html.find('<div class="data-table-wrapper"')
    if table_start != -1:
        header_html = panel_researchers_html[:table_start]
        rest_html = panel_researchers_html[table_start:-6]
        sub_analyst = sub_panel_analyst.replace('display:none;', 'display:grid;')
        sub_analyst = sub_analyst.replace('sub-dashboard-panel', '')
        new_panel_researchers = header_html + build_panel_injection('analyst', 'Analyst', sub_analyst, rest_html) + "</div>"
        html = html.replace(panel_researchers_html, new_panel_researchers)

# 9. Create Panel Sales
panel_firms_start = html.find('<div id="panel-firms"')
if panel_firms_start != -1:
    sub_sales = sub_panel_sales.replace('display:none;', 'display:grid;')
    sub_sales = sub_sales.replace('sub-dashboard-panel', '')
    panel_sales_html = f"""
        <!-- Panel 3c: 營業員專頁 (Sales list) -->
        <div id="panel-sales" class="marketing-content-panel">
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center;">
                <h3 style="margin:0;">營業員專頁</h3>
            </div>
            {build_panel_injection('sales', 'Sales', sub_sales, '<div class="data-table-wrapper"><div style="padding: 20px; text-align:center; color:#666;">營業員明細列表即將推出</div></div>')}
        </div>\n\n"""
    html = html[:panel_firms_start] + panel_sales_html + html[panel_firms_start:]

with open('marketing.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Done")
