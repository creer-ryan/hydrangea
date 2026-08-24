import re

with open('marketing.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the mode toggle block
old_mode_block_regex = r"const btnModeSummary = document\.getElementById\('btn-mode-summary'\);.*?btnModeDetails\.addEventListener\('click', \(\) => \{.*?\n        \}\);\n    \}"
mode_match = re.search(old_mode_block_regex, js, re.DOTALL)
if mode_match:
    new_mode_logic = """
    // --- Dynamic Mode Toggle for Individual Dashboards ---
    const roles = ['client', 'analyst', 'sales'];
    roles.forEach(role => {
        const btnSummary = document.getElementById(`btn-mode-summary-${role}`);
        const btnDetails = document.getElementById(`btn-mode-details-${role}`);
        const panelSummary = document.getElementById(`summary-container-${role}`);
        const panelDetails = document.getElementById(`details-container-${role}`);

        if (btnSummary && btnDetails && panelSummary && panelDetails) {
            btnSummary.addEventListener('click', () => {
                btnSummary.classList.add('active');
                btnSummary.style.background = '#5C8ED6';
                btnSummary.style.color = 'white';
                
                btnDetails.classList.remove('active');
                btnDetails.style.background = 'white';
                btnDetails.style.color = '#374151';
                
                panelSummary.style.display = 'grid'; // changed from flex to grid for correct layout
                panelDetails.style.display = 'none';
                
                if(typeof refreshDashboards === 'function') refreshDashboards();
            });

            btnDetails.addEventListener('click', () => {
                btnDetails.classList.add('active');
                btnDetails.style.background = '#5C8ED6';
                btnDetails.style.color = 'white';
                
                btnSummary.classList.remove('active');
                btnSummary.style.background = 'white';
                btnSummary.style.color = '#374151';
                
                panelDetails.style.display = 'block';
                panelSummary.style.display = 'none';
            });
        }
    });
"""
    js = js.replace(mode_match.group(0), new_mode_logic)
else:
    print("Could not find mode toggle block in marketing.js")

# Remove dashboard sidebar logic
sidebar_logic_regex = r"const subTabBtns = document\.querySelectorAll\('\.dashboard-sidebar \.tab-btn'\);.*?\}\);"
sidebar_match = re.search(sidebar_logic_regex, js, re.DOTALL)
if sidebar_match:
    js = js.replace(sidebar_match.group(0), "// Dashboard sidebar logic removed")

with open('marketing.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated marketing.js")
