document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // Tab Switching Logic
    // ----------------------------------------------------
    const pageTitle = document.getElementById('report-page-title');
    const pageBadge = document.getElementById('report-page-badge');

    document.querySelector('.report-tabs').addEventListener('click', (e) => {
        const btn = e.target.closest('.report-tab-btn');
        if (!btn || e.target.classList.contains('close-tab-btn')) return;

        document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetId = btn.getAttribute('data-target');
        document.querySelectorAll('.report-content-panel').forEach(p => p.classList.remove('active'));
        
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        const titleText = btn.childNodes[0].textContent.trim();
        const subTitleEl = btn.querySelector('span');
        const subTitleText = subTitleEl ? subTitleEl.textContent.trim() : '';
        if (pageTitle) pageTitle.innerHTML = `報表專區 - ${titleText}<br><span style="font-size: 14px; font-weight: normal; color: #666;">${subTitleText}</span>`;
        if (pageBadge) pageBadge.textContent = btn.getAttribute('data-badge') || '固定式呈現';

        let newHash = '';
        if (targetId === 'panel-overview') newHash = '#perf-overview';
        else if (targetId === 'panel-analysis') newHash = '#perf-analysis';
        else if (targetId === 'panel-domestic-basic') newHash = '#domestic-basic';
        else if (targetId === 'panel-foreign-basic') newHash = '#foreign-basic';
        else if (targetId === 'panel-commission') newHash = '#commission';
        else if (targetId === 'panel-commission-settings') newHash = '#commission-settings';
        
        if (newHash && window.location.hash !== newHash) {
            history.replaceState(null, null, newHash);
        }
    });

    // ----------------------------------------------------
    // Mock Dataset Generation & Recursive Aggregation
    // ----------------------------------------------------
    // Raw leaf nodes data. We define the lowest level rows and aggregate upwards.
    const rawLeafData = [
        // 內法 -> 台股 -> 關係
        { id: 'dom-tw-rel-site-cc', parent: 'dom-tw-rel-site', level: 5, labels: ['', '', '', '', 'Co-Cover'], name: 'Co-Cover', org: 'domestic', prod: 'tw_stock', affiliate: 'related', grp1: 'site', grp2: 'co-cover', values: { '2025': [120, 110, 130, 115, 140, 150, 135, 120, 145, 160, 150, 175], '2026': { '01': [180], '02': [190], '03': [200], '04': [210], '05': [220], '06': { W1: 45, W2: 50, W3: 40, W4: 48, W5: 12 } } } },
        { id: 'dom-tw-rel-site-fg', parent: 'dom-tw-rel-site', level: 5, labels: ['', '', '', '', 'Fubon一般'], name: 'Fubon一般', org: 'domestic', prod: 'tw_stock', affiliate: 'related', grp1: 'site', grp2: 'fubon-general', values: { '2025': [80, 85, 90, 75, 85, 95, 80, 85, 90, 100, 95, 110], '2026': { '01': [115], '02': [120], '03': [125], '04': [130], '05': [140], '06': { W1: 30, W2: 32, W3: 28, W4: 31, W5: 9 } } } },
        { id: 'dom-tw-rel-site-oth', parent: 'dom-tw-rel-site', level: 5, labels: ['', '', '', '', '其他'], name: '其他', org: 'domestic', prod: 'tw_stock', affiliate: 'related', grp1: 'site', grp2: 'other', values: { '2025': [30, 25, 35, 20, 30, 40, 30, 25, 35, 40, 30, 45], '2026': { '01': [40], '02': [45], '03': [42], '04': [48], '05': [50], '06': { W1: 10, W2: 12, W3: 11, W4: 13, W5: 4 } } } },
        
        // 內法 -> 台股 -> 關係 -> 產壽險 (No specific group2, will have an implicit "其他" under it)
        { id: 'dom-tw-rel-pc-oth', parent: 'dom-tw-rel-pc', level: 5, labels: ['', '', '', '', '其他'], name: '其他', org: 'domestic', prod: 'tw_stock', affiliate: 'related', grp1: 'pc_life', grp2: 'other', values: { '2025': [150, 140, 160, 130, 170, 180, 165, 150, 175, 190, 180, 210], '2026': { '01': [220], '02': [210], '03': [230], '04': [225], '05': [240], '06': { W1: 55, W2: 58, W3: 52, W4: 56, W5: 19 } } } },
        
        // 內法 -> 台股 -> 關係 -> 其他客群1 (Implicit "其他" affiliate child)
        { id: 'dom-tw-rel-oth-oth', parent: 'dom-tw-rel-oth', level: 5, labels: ['', '', '', '', '其他'], name: '其他', org: 'domestic', prod: 'tw_stock', affiliate: 'related', grp1: 'other', grp2: 'other', values: { '2025': [40, 45, 50, 40, 45, 55, 45, 40, 50, 55, 50, 60], '2026': { '01': [65], '02': [60], '03': [62], '04': [68], '05': [70], '06': { W1: 15, W2: 15, W3: 16, W4: 17, W5: 7 } } } },

        // 內法 -> 台股 -> 一般
        { id: 'dom-tw-gen-oth', parent: 'dom-tw-gen', level: 4, labels: ['', '', '', '其他', ''], name: '其他', org: 'domestic', prod: 'tw_stock', affiliate: 'general', grp1: 'other', values: { '2025': [300, 280, 320, 290, 310, 340, 300, 310, 330, 350, 340, 370], '2026': { '01': [380], '02': [390], '03': [400], '04': [410], '05': [430], '06': { W1: 90, W2: 95, W3: 88, W4: 92, W5: 25 } } } },

        // 內法 -> 台股 -> 其他 (Affiliate)
        { id: 'dom-tw-oth-oth', parent: 'dom-tw-oth', level: 4, labels: ['', '', '', '其他', ''], name: '其他', org: 'domestic', prod: 'tw_stock', affiliate: 'other', grp1: 'other', values: { '2025': [50, 45, 55, 40, 50, 60, 50, 45, 55, 60, 55, 70], '2026': { '01': [75], '02': [70], '03': [72], '04': [78], '05': [80], '06': { W1: 18, W2: 20, W3: 19, W4: 21, W5: 6 } } } },

        // 內法 -> 海外股 -> 一般
        { id: 'dom-fgst-gen-oth', parent: 'dom-fgst-gen', level: 4, labels: ['', '', '', '其他', ''], name: '其他', org: 'domestic', prod: 'foreign_stock', affiliate: 'general', grp1: 'other', values: { '2025': [200, 180, 210, 190, 220, 240, 220, 200, 230, 250, 240, 280], '2026': { '01': [290], '02': [300], '03': [310], '04': [320], '05': [330], '06': { W1: 70, W2: 75, W3: 72, W4: 78, W5: 20 } } } },

        // 內法 -> 海外債 -> 一般
        { id: 'dom-fgbd-gen-oth', parent: 'dom-fgbd-gen', level: 4, labels: ['', '', '', '其他', ''], name: '其他', org: 'domestic', prod: 'foreign_bond', affiliate: 'general', grp1: 'other', values: { '2025': [150, 160, 140, 130, 160, 170, 150, 140, 160, 180, 170, 190], '2026': { '01': [200], '02': [190], '03': [210], '04': [205], '05': [220], '06': { W1: 45, W2: 50, W3: 48, W4: 52, W5: 15 } } } },

        // 外法 -> 台股 -> 一般
        { id: 'for-tw-gen-fi-cc', parent: 'for-tw-gen-fi', level: 5, labels: ['', '', '', '', 'Co-Cover'], name: 'Co-Cover', org: 'foreign', prod: 'tw_stock', affiliate: 'general', grp1: 'foreign_invest', grp2: 'co-cover', values: { '2025': [400, 420, 450, 410, 460, 500, 480, 450, 490, 520, 500, 560], '2026': { '01': [580], '02': [600], '03': [620], '04': [640], '05': [660], '06': { W1: 140, W2: 150, W3: 135, W4: 145, W5: 40 } } } },
        { id: 'for-tw-gen-fi-oth', parent: 'for-tw-gen-fi', level: 5, labels: ['', '', '', '', '其他'], name: '其他', org: 'foreign', prod: 'tw_stock', affiliate: 'general', grp1: 'foreign_invest', grp2: 'other', values: { '2025': [150, 160, 170, 140, 180, 200, 190, 170, 180, 210, 190, 230], '2026': { '01': [240], '02': [250], '03': [260], '04': [270], '05': [280], '06': { W1: 60, W2: 65, W3: 58, W4: 62, W5: 18 } } } }
    ];

    // Mid-level structural nodes (non-leaf). These will be aggregated recursively.
    const structuralNodes = [
        { id: 'dom-tw-rel-site', parent: 'dom-tw-rel', level: 4, labels: ['', '', '', '投信', ''], name: '投信', org: 'domestic', prod: 'tw_stock', affiliate: 'related', grp1: 'site' },
        { id: 'dom-tw-rel-pc', parent: 'dom-tw-rel', level: 4, labels: ['', '', '', '產壽險', ''], name: '產壽險', org: 'domestic', prod: 'tw_stock', affiliate: 'related', grp1: 'pc_life' },
        { id: 'dom-tw-rel-oth', parent: 'dom-tw-rel', level: 4, labels: ['', '', '', '其他', ''], name: '其他', org: 'domestic', prod: 'tw_stock', affiliate: 'related', grp1: 'other' },
        { id: 'dom-tw-rel', parent: 'prod-tw', level: 3, labels: ['', '', '關係', '', ''], name: '關係', org: 'domestic', prod: 'tw_stock', affiliate: 'related' },
        { id: 'dom-tw-gen', parent: 'prod-tw', level: 3, labels: ['', '', '一般', '', ''], name: '一般', org: 'domestic', prod: 'tw_stock', affiliate: 'general' },
        { id: 'dom-tw-oth', parent: 'prod-tw', level: 3, labels: ['', '', '其他', '', ''], name: '其他', org: 'domestic', prod: 'tw_stock', affiliate: 'other' },
        { id: 'prod-tw', parent: 'org-domestic', level: 2, labels: ['', '台股', '', '', ''], name: '台股', org: 'domestic', prod: 'tw_stock' },
        
        { id: 'dom-fgst-gen', parent: 'prod-fgst', level: 3, labels: ['', '', '一般', '', ''], name: '一般', org: 'domestic', prod: 'foreign_stock', affiliate: 'general' },
        { id: 'prod-fgst', parent: 'org-domestic', level: 2, labels: ['', '海外股', '', '', ''], name: '海外股', org: 'domestic', prod: 'foreign_stock' },
        
        { id: 'dom-fgbd-gen', parent: 'prod-fgbd', level: 3, labels: ['', '', '一般', '', ''], name: '一般', org: 'domestic', prod: 'foreign_bond', affiliate: 'general' },
        { id: 'prod-fgbd', parent: 'org-domestic', level: 2, labels: ['', '海外債', '', '', ''], name: '海外債', org: 'domestic', prod: 'foreign_bond' },
        
        { id: 'org-domestic', parent: 'total', level: 1, labels: ['內法', '', '', '', ''], name: '內法', org: 'domestic' },

        { id: 'for-tw-gen-fi', parent: 'for-tw-gen', level: 4, labels: ['', '', '', '外資', ''], name: '外資', org: 'foreign', prod: 'tw_stock', affiliate: 'general', grp1: 'foreign_invest' },
        { id: 'for-tw-gen', parent: 'prod-for-tw', level: 3, labels: ['', '', '一般', '', ''], name: '一般', org: 'foreign', prod: 'tw_stock', affiliate: 'general' },
        { id: 'prod-for-tw', parent: 'org-foreign', level: 2, labels: ['', '台股', '', '', ''], name: '台股', org: 'foreign', prod: 'tw_stock' },
        
        { id: 'org-foreign', parent: 'total', level: 1, labels: ['外法', '', '', '', ''], name: '外法', org: 'foreign' },
        
        { id: 'total', parent: null, level: 0, labels: ['總計', '', '', '', ''], name: '總計' }
    ];

    // Combine all nodes
    let allNodes = [...rawLeafData, ...structuralNodes];

    // Helper: Initialize empty values structure
    const createEmptyValues = () => ({
        '2025': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        '2026': {
            '01': [0],
            '02': [0],
            '03': [0],
            '04': [0],
            '05': [0],
            '06': { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 }
        }
    });

    // Helper: Recursively sum up child values into parent values
    const aggregateValues = () => {
        // Reset structural nodes values to 0
        structuralNodes.forEach(node => {
            node.values = createEmptyValues();
        });

        // Bottom-up aggregation: level 5 to level 0
        for (let lvl = 5; lvl >= 1; lvl--) {
            allNodes.forEach(node => {
                if (node.level === lvl) {
                    const parentNode = allNodes.find(p => p.id === node.parent);
                    if (parentNode) {
                        // Aggregate 2025 months
                        for (let m = 0; m < 12; m++) {
                            parentNode.values['2025'][m] += node.values['2025'][m] || 0;
                        }
                        // Aggregate 2026 months & weeks
                        parentNode.values['2026']['01'][0] += node.values['2026']['01'][0] || 0;
                        parentNode.values['2026']['02'][0] += node.values['2026']['02'][0] || 0;
                        parentNode.values['2026']['03'][0] += node.values['2026']['03'][0] || 0;
                        parentNode.values['2026']['04'][0] += node.values['2026']['04'][0] || 0;
                        parentNode.values['2026']['05'][0] += node.values['2026']['05'][0] || 0;
                        
                        const w6_2026 = parentNode.values['2026']['06'];
                        const node_w6 = node.values['2026']['06'];
                        if (w6_2026 && node_w6) {
                            w6_2026.W1 += node_w6.W1 || 0;
                            w6_2026.W2 += node_w6.W2 || 0;
                            w6_2026.W3 += node_w6.W3 || 0;
                            w6_2026.W4 += node_w6.W4 || 0;
                            w6_2026.W5 += node_w6.W5 || 0;
                        }
                    }
                }
            });
        }
    };

    aggregateValues();

    // ----------------------------------------------------
    // Dynamic Table Expansion & Sort States
    // ----------------------------------------------------
    let expandedCols = {
        '2025': false,
        '2026': false,
        '2026-06': true // Default June is expanded to weeks
    };

    let expandedRows = {
        'total': true,
        'org-domestic': true,
        'org-foreign': true,
        'prod-tw': true,
        'prod-fgst': true,
        'prod-fgbd': true,
        'prod-for-tw': true
        // Affiliates (lvl 3+) are collapsed by default
    };

    let sortCol = null; // Target column identifier
    let sortAsc = true;  // Sort direction
    let stickyWidths = [100, 100, 120, 120, 130];

    // Filter values
    let filterMonth = '202606';
    let filterKpi = 'volume';
    let filterOrg = 'all';
    let filterProduct = 'all';
    let filterAffiliate = 'all';
    let filterGroup1 = 'all';
    let filterGroup2 = 'all';

    // ----------------------------------------------------
    // Performance Overview Calculations
    // ----------------------------------------------------
    const getRowCalculatedMetrics = (node) => {
        const v = node.values;
        
        // 1. Calculate June 2026 MTD (W1 + W2 + W3 + W4 + W5)
        const junMTD = (v['2026']['06'].W1 || 0) + (v['2026']['06'].W2 || 0) + (v['2026']['06'].W3 || 0) + (v['2026']['06'].W4 || 0) + (v['2026']['06'].W5 || 0);

        // 2. Annualized (月化)
        const completedWeeks = 5;
        const totalWeeks = 5;
        const annualized = completedWeeks > 0 ? (junMTD / completedWeeks) * totalWeeks : 0;

        // 3. MoM (6月 MTD vs 5月整月)
        const mayTotal = v['2026']['05'][0];
        const mom = mayTotal > 0 ? ((junMTD - mayTotal) / mayTotal) * 100 : 0;

        // 4. YTD (Jan + Feb + Mar + Apr + May + Jun MTD)
        const ytd = v['2026']['01'][0] + v['2026']['02'][0] + v['2026']['03'][0] + v['2026']['04'][0] + v['2026']['05'][0] + junMTD;

        // 5. YoY Month (2026-06 MTD vs 2025-06 MTD). We assume 2025-06 MTD is 95% of 2025-06 total
        const jun2025Total = v['2025'][5];
        const jun2025MTD = jun2025Total * 0.95;
        const yoyMonth = jun2025MTD > 0 ? ((junMTD - jun2025MTD) / jun2025MTD) * 100 : 0;

        // 6. YoY YTD (2026 YTD vs 2025 YTD through June)
        const ytd2025 = v['2025'].slice(0, 5).reduce((a, b) => a + b, 0) + jun2025MTD;
        const yoyYtd = ytd2025 > 0 ? ((ytd - ytd2025) / ytd2025) * 100 : 0;

        // Scale factor for KPIs (Transaction Volume is raw, Commission is *0.008, Market Share is % of parent)
        let scale = 1.0;
        if (filterKpi === 'commission') scale = 0.008;

        return {
            marMTD: junMTD * scale,
            annualized: annualized * scale,
            mom,
            ytd: ytd * scale,
            yoyMonth,
            yoyYtd,
            values: {
                '2025_total': v['2025'].reduce((a, b) => a + b, 0) * scale,
                '2025_months': v['2025'].map(x => x * scale),
                '2026_01': v['2026']['01'][0] * scale,
                '2026_02': v['2026']['02'][0] * scale,
                '2026_03': v['2026']['03'][0] * scale,
                '2026_04': v['2026']['04'][0] * scale,
                '2026_05': v['2026']['05'][0] * scale,
                '2026_06_W1': v['2026']['06'].W1 * scale,
                '2026_06_W2': v['2026']['06'].W2 * scale,
                '2026_06_W3': v['2026']['06'].W3 * scale,
                '2026_06_W4': v['2026']['06'].W4 * scale,
                '2026_06_W5': v['2026']['06'].W5 * scale
            }
        };
    };

    // ----------------------------------------------------
    // Sorting with Hierarchy Preservation
    // ----------------------------------------------------
    // Recursively sorts the children array of a node ID, keeping them under their parent
    const getSortedSubtree = (parentId, filteredNodes) => {
        let directChildren = filteredNodes.filter(node => node.parent === parentId);
        
        if (sortCol) {
            directChildren.sort((a, b) => {
                const metricsA = getRowCalculatedMetrics(a);
                const metricsB = getRowCalculatedMetrics(b);
                let valA = 0;
                let valB = 0;

                if (sortCol === 'ann') { valA = metricsA.annualized; valB = metricsB.annualized; }
                else if (sortCol === 'mom') { valA = metricsA.mom; valB = metricsB.mom; }
                else if (sortCol === 'ytd') { valA = metricsA.ytd; valB = metricsB.ytd; }
                else if (sortCol === 'yoy_m') { valA = metricsA.yoyMonth; valB = metricsB.yoyMonth; }
                else if (sortCol === 'yoy_ytd') { valA = metricsA.yoyYtd; valB = metricsB.yoyYtd; }
                else if (sortCol === 'mtd') { valA = metricsA.marMTD; valB = metricsB.marMTD; }
                else if (sortCol === 'w1') { valA = metricsA.values['2026_03_W1']; valB = metricsB.values['2026_03_W1']; }
                else if (sortCol === 'w2') { valA = metricsA.values['2026_03_W2']; valB = metricsB.values['2026_03_W2']; }
                else if (sortCol === '2025_total') { valA = metricsA.values['2025_total']; valB = metricsB.values['2025_total']; }
                else if (sortCol === '2026_01') { valA = metricsA.values['2026_01']; valB = metricsB.values['2026_01']; }
                else if (sortCol === '2026_02') { valA = metricsA.values['2026_02']; valB = metricsB.values['2026_02']; }
                else if (sortCol && sortCol.startsWith('2025_')) {
                    const mIdx = parseInt(sortCol.split('_')[1], 10);
                    valA = metricsA.values['2025_months'][mIdx] || 0;
                    valB = metricsB.values['2025_months'][mIdx] || 0;
                }

                return sortAsc ? valA - valB : valB - valA;
            });
        }

        let result = [];
        directChildren.forEach(child => {
            result.push(child);
            // Append child's own sorted children recursively
            result = result.concat(getSortedSubtree(child.id, filteredNodes));
        });
        return result;
    };

    // ----------------------------------------------------
    // Table Rendering Engine
    // ----------------------------------------------------
    const renderTable = () => {
        const container = document.getElementById('onion-table-container');
        if (!container) return;

        // Apply filters to nodes
        let filteredNodes = allNodes.filter(node => {
            if (node.level === 0) return true; // Always show total
            if (filterOrg !== 'all' && node.org && node.org !== filterOrg) return false;
            if (filterProduct !== 'all' && node.prod && node.prod !== filterProduct) return false;
            if (filterAffiliate !== 'all' && node.affiliate && node.affiliate !== filterAffiliate) return false;
            if (filterGroup1 !== 'all' && node.grp1 && node.grp1 !== filterGroup1) return false;
            if (filterGroup2 !== 'all' && node.grp2 && node.grp2 !== filterGroup2) return false;
            return true;
        });

        // Re-construct the hierarchy list based on sorted subtree starting from Total (Total is level 0)
        let totalNode = filteredNodes.find(n => n.id === 'total');
        let sortedNodes = [];
        if (totalNode) {
            sortedNodes.push(totalNode);
            sortedNodes = sortedNodes.concat(getSortedSubtree('total', filteredNodes));
        }

        // Build expanded/collapsed structure based on parents
        const isRowVisible = (node) => {
            if (node.level === 0 || node.level === 1 || node.level === 2) return true; // Level 0, 1, 2 are always visible
            let p = node.parent;
            while (p) {
                if (!expandedRows[p]) return false;
                const pNode = allNodes.find(n => n.id === p);
                p = pNode ? pNode.parent : null;
            }
            return true;
        };

        const visibleNodes = sortedNodes.filter(isRowVisible);

        // Compute colspans for the header
        let span2025 = expandedCols['2025'] ? 12 : 1;
        let span2026 = 5 + (expandedCols['2026-06'] ? 6 : 1); // 1月 to 5月 + 6月 (expanded weeks or 1 col)
        
        let headerRow1 = `
            <tr>
                <th rowspan="2" class="col-sticky-1">單位<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Unit</span></th>
                <th rowspan="2" class="col-sticky-2">商品<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Product</span></th>
                <th rowspan="2" class="col-sticky-3">關係企業<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Affiliate</span></th>
                <th rowspan="2" class="col-sticky-4">客群類別<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Coverage Segment</span></th>
                <th rowspan="2" class="col-sticky-5">外資客群<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Foreign Coverage</span></th>
                
                <th colspan="${span2025}" class="col-group-header">2025 <button class="col-expand-btn expand-btn" data-col="2025">${expandedCols['2025'] ? '-' : '+'}</button></th>
                <th colspan="${span2026}" class="col-group-header">2026 <button class="col-expand-btn expand-btn" data-col="2026">${expandedCols['2026'] ? '-' : '+'}</button></th>
                
                <th rowspan="2" class="sortable-header" data-sort="ann">月化 ↕<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Ann.</span></th>
                <th rowspan="2" class="sortable-header" data-sort="mom">MoM ↕<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">MoM</span></th>
                <th rowspan="2" class="sortable-header" data-sort="ytd">YTD ↕<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">YTD</span></th>
                <th rowspan="2" class="sortable-header" data-sort="yoy_m">去年同期 YoY ↕<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">YoY (Month)</span></th>
                <th rowspan="2" class="sortable-header" data-sort="yoy_ytd">去年累月 YoY ↕<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">YoY (YTD)</span></th>
            </tr>
        `;

        let headerRow2 = '<tr>';
        
        // 2025 Month subheaders if expanded
        if (expandedCols['2025']) {
            for (let m = 1; m <= 12; m++) {
                headerRow2 += `<th class="sortable-header" data-sort="2025_${m-1}" style="font-size:11px;">${m}月 ↕</th>`;
            }
        } else {
            headerRow2 += `<th class="sortable-header" data-sort="2025_total" style="font-size:11px; font-weight: 600;">YTD 加總 ↕</th>`;
        }

        // 2026 Months
        headerRow2 += `<th class="sortable-header" data-sort="2026_01" style="font-size:11px;">1月 ↕</th>`;
        headerRow2 += `<th class="sortable-header" data-sort="2026_02" style="font-size:11px;">2月 ↕</th>`;
        headerRow2 += `<th class="sortable-header" data-sort="2026_03" style="font-size:11px;">3月 ↕</th>`;
        headerRow2 += `<th class="sortable-header" data-sort="2026_04" style="font-size:11px;">4月 ↕</th>`;
        headerRow2 += `<th class="sortable-header" data-sort="2026_05" style="font-size:11px;">5月 ↕</th>`;
        if (expandedCols['2026-06']) {
            headerRow2 += `<th class="sortable-header" data-sort="w1" style="font-size:11px;">6月 W1 ↕</th>`;
            headerRow2 += `<th class="sortable-header" data-sort="w2" style="font-size:11px;">6月 W2 ↕</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">6月 W3</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">6月 W4</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">6月 W5</th>`;
            headerRow2 += `<th class="sortable-header" data-sort="mtd" style="font-size:11px; background:#D0E8FF; color:#1E4670;">6月 MTD ↕</th>`;
        } else {
            headerRow2 += `<th class="col-group-header" style="font-size:11px;">6月 <button class="col-expand-btn expand-btn" data-col="2026-06">+</button></th>`;
        }
        
        headerRow2 += '</tr>';

        // Render Table Body
        let tbodyRows = '';
        let limit = 'all';
        const limitSelect = document.getElementById('select-row-limit');
        if (limitSelect) {
            limit = limitSelect.value;
        }
        let displayedNodes = visibleNodes;
        if (limit !== 'all') {
            const numLimit = parseInt(limit, 10);
            displayedNodes = visibleNodes.slice(0, numLimit);
        }
        displayedNodes.forEach(node => {
            const metrics = getRowCalculatedMetrics(node);
            
            // Indents and expansion toggles based on row level
            let labelsHTML = '';
            for (let l = 0; l < 5; l++) {
                let cellVal = node.labels[l] || '';
                let colClass = `col-sticky-${l + 1}`;
                
                // Add toggle buttons with fixed columns
                if (l === 0 && node.level === 0) {
                    labelsHTML += `<td class="${colClass} text-left"><strong>${cellVal}</strong></td>`;
                } else if (l === 0 && node.level === 1) {
                    let hasChildren = filteredNodes.some(n => n.parent === node.id);
                    let sign = expandedRows[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left"><button class="row-expand-btn" data-row="${node.id}">${sign}</button> ${cellVal}</td>`;
                } else if (l === 1 && node.level === 2) {
                    let hasChildren = filteredNodes.some(n => n.parent === node.id);
                    let sign = expandedRows[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left indent-1"><button class="row-expand-btn" data-row="${node.id}">${sign}</button> ${cellVal}</td>`;
                } else if (l === 2 && node.level === 3) {
                    let hasChildren = filteredNodes.some(n => n.parent === node.id);
                    let sign = expandedRows[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left indent-2"><button class="row-expand-btn" data-row="${node.id}">${sign}</button> ${cellVal}</td>`;
                } else if (l === 3 && node.level === 4) {
                    let hasChildren = filteredNodes.some(n => n.parent === node.id);
                    let sign = expandedRows[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left indent-3">${hasChildren ? `<button class="row-expand-btn" data-row="${node.id}">${sign}</button>` : ''} ${cellVal}</td>`;
                } else {
                    labelsHTML += `<td class="${colClass} text-left">${cellVal}</td>`;
                }
            }

            // Numeric Cells matching expanded columns
            let valCells = '';
            if (expandedCols['2025']) {
                metrics.values['2025_months'].forEach(mVal => {
                    valCells += `<td>${Math.round(mVal).toLocaleString()}</td>`;
                });
            } else {
                valCells += `<td style="font-weight: 600;">${Math.round(metrics.values['2025_total']).toLocaleString()}</td>`;
            }

            // 2026 1月 to 5月
            valCells += `<td>${Math.round(metrics.values['2026_01']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_02']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_03']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_04']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_05']).toLocaleString()}</td>`;

            // 2026 6月 weeks or total MTD
            if (expandedCols['2026-06']) {
                valCells += `<td>${Math.round(metrics.values['2026_06_W1']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_06_W2']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_06_W3']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_06_W4']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_06_W5']).toLocaleString()}</td>`;
                valCells += `<td style="font-weight: 700; background:#F2F8FD;">${Math.round(metrics.marMTD).toLocaleString()}</td>`; // June MTD
            } else {
                valCells += `<td style="font-weight: 600;">${Math.round(metrics.marMTD).toLocaleString()}</td>`;
            }

            // Calculated Columns
            let annText = Math.round(metrics.annualized).toLocaleString();
            let momText = metrics.mom.toFixed(1) + '%';
            let ytdText = Math.round(metrics.ytd).toLocaleString();
            let yoyMText = metrics.yoyMonth.toFixed(1) + '%';
            let yoyYtdText = metrics.yoyYtd.toFixed(1) + '%';

            // Bold styling for Total Row
            let rowStyle = node.level === 0 ? ' style="background: #EAF2F8; font-weight: bold;"' : '';

            tbodyRows += `
                <tr class="row-level-${node.level}"${rowStyle}>
                    ${labelsHTML}
                    ${valCells}
                    <td style="font-weight: 600; color: var(--color-personal);">${annText}</td>
                    <td style="color: ${metrics.mom >= 0 ? '#2E7D32' : '#C0392B'};">${momText}</td>
                    <td style="font-weight: 600;">${ytdText}</td>
                    <td style="color: ${metrics.yoyMonth >= 0 ? '#2E7D32' : '#C0392B'};">${yoyMText}</td>
                    <td style="color: ${metrics.yoyYtd >= 0 ? '#2E7D32' : '#C0392B'};">${yoyYtdText}</td>
                </tr>
            `;
        });

        // Set innerHTML
        container.innerHTML = `
            <thead>
                ${headerRow1}
                ${headerRow2}
            </thead>
            <tbody>
                ${tbodyRows}
            </tbody>
        `;

        // Attach listeners for headers and rows
        attachTableListeners();
    };

    // Helper: Recursively close children
    const closeRowChildren = (parentId) => {
        allNodes.forEach(n => {
            if (n.parent === parentId) {
                expandedRows[n.id] = false;
                closeRowChildren(n.id);
            }
        });
    };

    // Attach interaction listeners to generated elements
    const attachTableListeners = () => {
        // Row +/- buttons
        document.querySelectorAll('.row-expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rowId = btn.getAttribute('data-row');
                const isExpanding = btn.textContent.trim() === '+';
                
                if (isExpanding) {
                    expandedRows[rowId] = true;
                } else {
                    expandedRows[rowId] = false;
                    closeRowChildren(rowId); // Recursive collapse
                }
                renderTable();
            });
        });

        // Column expand/collapse buttons
        document.querySelectorAll('.col-expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const colKey = btn.getAttribute('data-col');
                
                if (colKey === '2025') {
                    expandedCols['2025'] = !expandedCols['2025'];
                } else if (colKey === '2026') {
                    expandedCols['2026-06'] = !expandedCols['2026-06']; // Toggles June weeks
                } else if (colKey === '2026-06') {
                    expandedCols['2026-06'] = true;
                }
                renderTable();
            });
        });

        // Column Sort header clicks
        document.querySelectorAll('.sortable-header').forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.getAttribute('data-sort');
                if (sortCol === sortBy) {
                    sortAsc = !sortAsc; // toggle direction
                } else {
                    sortCol = sortBy;
                    sortAsc = false; // default descending for numeric numbers
                }
                renderTable();
            });
        });

        // Initialize drag-to-resize columns
        initResizableColumns();
    };

    const applyStickyWidths = () => {
        let currentLeft = 0;
        for (let i = 0; i < 5; i++) {
            const colIndex = i + 1;
            const width = stickyWidths[i];
            
            const cells = document.querySelectorAll(`.col-sticky-${colIndex}`);
            cells.forEach(cell => {
                cell.style.setProperty('width', `${width}px`, 'important');
                cell.style.setProperty('min-width', `${width}px`, 'important');
                cell.style.setProperty('max-width', `${width}px`, 'important');
                cell.style.setProperty('left', `${currentLeft}px`, 'important');
            });
            currentLeft += width;
        }
    };

    const initResizableColumns = () => {
        const container = document.getElementById('onion-table-container');
        if (!container) return;

        for (let i = 1; i <= 5; i++) {
            const th = container.querySelector(`thead th.col-sticky-${i}`);
            if (th) {
                if (!th.querySelector('.resizer')) {
                    const resizer = document.createElement('div');
                    resizer.className = 'resizer';
                    th.appendChild(resizer);
                    
                    resizer.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        const startX = e.pageX;
                        const startWidth = stickyWidths[i - 1];
                        
                        const onMouseMove = (moveEvent) => {
                            const delta = moveEvent.pageX - startX;
                            stickyWidths[i - 1] = Math.max(50, startWidth + delta);
                            applyStickyWidths();
                        };
                        
                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };
                        
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    });
                }
            }
        }
        applyStickyWidths();
    };

    // Initial render
    renderTable();

    // ----------------------------------------------------
    // Filter Bindings
    // ----------------------------------------------------
    const resetBtn = document.getElementById('btn-reset-filters');
    const queryBtn = document.getElementById('btn-query-report');

    if (queryBtn) {
        queryBtn.addEventListener('click', () => {
            filterMonth = document.getElementById('filter-month').value;
            filterKpi = document.getElementById('filter-kpi').value;
            filterOrg = document.getElementById('filter-org').value;
            filterProduct = document.getElementById('filter-product').value;
            filterAffiliate = document.getElementById('filter-affiliate').value;
            filterGroup1 = document.getElementById('filter-group1').value;
            filterGroup2 = document.getElementById('filter-group2').value;

            // Update latest date text based on selected month
            const latestDateEl = document.getElementById('report-latest-date');
            if (filterMonth === '202606') {
                latestDateEl.textContent = '交易資料最新日期：2026/06/30';
            } else if (filterMonth === '202605') {
                latestDateEl.textContent = '交易資料最新日期：2026/05/31';
            } else if (filterMonth === '202604') {
                latestDateEl.textContent = '交易資料最新日期：2026/04/30';
            } else if (filterMonth === '202603') {
                latestDateEl.textContent = '交易資料最新日期：2026/03/31';
            } else if (filterMonth === '202602') {
                latestDateEl.textContent = '交易資料最新日期：2026/02/28';
            } else if (filterMonth === '202601') {
                latestDateEl.textContent = '交易資料最新日期：2026/01/31';
            } else {
                latestDateEl.textContent = '交易資料最新日期：2025/12/31';
            }

            renderTable();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('filter-month').value = '202606';
            document.getElementById('filter-kpi').value = 'volume';
            document.getElementById('filter-org').value = 'all';
            document.getElementById('filter-product').value = 'all';
            document.getElementById('filter-affiliate').value = 'all';
            document.getElementById('filter-group1').value = 'all';
            document.getElementById('filter-group2').value = 'all';
            const limitSelect = document.getElementById('select-row-limit');
            if (limitSelect) limitSelect.value = 'all';
            
            filterMonth = '202606';
            filterKpi = 'volume';
            filterOrg = 'all';
            filterProduct = 'all';
            filterAffiliate = 'all';
            filterGroup1 = 'all';
            filterGroup2 = 'all';

            document.getElementById('report-latest-date').textContent = '交易資料最新日期：2026/06/30';

            renderTable();
        });
    }

    const limitSelectEl = document.getElementById('select-row-limit');
    if (limitSelectEl) {
        limitSelectEl.addEventListener('change', () => {
            renderTable();
        });
    }

    // ----------------------------------------------------
    // Commission Settings Rule Management & Modal Interaction
    // ----------------------------------------------------
    let settingsRules = [
        {
            id: 1,
            account: '富邦投信',
            product: 'foreign_stock',
            productName: '海外股票',
            periodStart: '2026/01/01',
            periodEnd: '2026/06/30',
            setupDate: '2025/12/20',
            splits: [
                { sales: 'Ann Liao', pct: 50, color: '#0D47A1', bg: '#E3F2FD' },
                { sales: 'Charlie Zhao', pct: 30, color: '#1B5E20', bg: '#E8F5E9' },
                { sales: 'David Wang', pct: 20, color: '#E65100', bg: '#FFF3E0' }
            ]
        },
        {
            id: 2,
            account: '富邦人壽',
            product: 'tw_stock',
            productName: '台股',
            periodStart: '2026/01/01',
            periodEnd: '2026/12/31',
            setupDate: '2025/12/15',
            splits: [
                { sales: 'Ann Liao', pct: 100, color: '#0D47A1', bg: '#E3F2FD' }
            ]
        },
        {
            id: 3,
            account: '元大投信',
            product: 'foreign_bond',
            productName: '海外債',
            periodStart: '2026/01/01',
            periodEnd: '2026/06/30',
            setupDate: '2025/12/28',
            splits: [
                { sales: 'Charlie Zhao', pct: 70, color: '#1B5E20', bg: '#E8F5E9' },
                { sales: 'David Wang', pct: 30, color: '#E65100', bg: '#FFF3E0' }
            ]
        }
    ];

    let currentSettingEditId = null;

    const renderSettingsTable = () => {
        const tbody = document.getElementById('commission-settings-tbody');
        if (!tbody) return;

        // Apply filters
        const qAccount = document.getElementById('filter-setting-account').value.trim().toLowerCase();
        const qProd = document.getElementById('filter-setting-product').value;
        const qSales = document.getElementById('filter-setting-sales').value.trim().toLowerCase();

        let filtered = settingsRules;
        if (qAccount) {
            filtered = filtered.filter(r => r.account.toLowerCase().includes(qAccount));
        }
        if (qProd !== 'all') {
            filtered = filtered.filter(r => r.product === qProd);
        }
        if (qSales) {
            filtered = filtered.filter(r => r.splits.some(s => s.sales.toLowerCase().includes(qSales)));
        }

        const countTextEl = document.getElementById('settings-count-text');
        if (countTextEl) {
            countTextEl.textContent = `共 ${filtered.length} 筆分潤規則`;
        }

        tbody.innerHTML = filtered.map(rule => {
            const splitBadges = rule.splits.map(s => `
                <span style="background:${s.bg || '#f1f1f1'}; color:${s.color || '#333'}; padding:4px 10px; border-radius:12px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:4px;">
                    ${s.sales} <strong style="color:${s.color || '#333'};">${s.pct}%</strong>
                </span>
            `).join('');

            return `
                <tr>
                    <td class="text-left" style="font-weight: 600;">${rule.account}</td>
                    <td class="text-left" style="font-weight: 500;">${rule.productName}</td>
                    <td class="text-left">
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            ${splitBadges}
                        </div>
                    </td>
                    <td style="text-align:center; font-size: 13px;">${rule.periodStart} ~ ${rule.periodEnd}</td>
                    <td style="text-align:center; font-size: 13px; color:#666;">${rule.setupDate}</td>
                    <td style="text-align:center;">
                        <button class="edit-setting-rule-btn" data-id="${rule.id}" style="background:transparent; border:none; font-size:18px; cursor:pointer;" title="編輯">📝</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach listeners
        document.querySelectorAll('.edit-setting-rule-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'), 10);
                openCommissionModalForEdit(id);
            });
        });
    };

    const addModalRepRow = (sales = '', pct = '') => {
        const container = document.getElementById('modal-rep-rows-container');
        if (!container) return;

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '12px';
        row.className = 'modal-rep-row';

        row.innerHTML = `
            <input type="text" placeholder="營業員姓名 (如: Ann Liao)" class="modal-rep-sales-input" style="flex: 2; padding: 6px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-size:13px;" value="${sales}" required>
            <input type="number" placeholder="比例" class="modal-rep-pct-input" style="width: 80px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-size:13px; text-align:right;" value="${pct}" min="1" max="100" required>
            <span style="font-weight:600;">%</span>
            <button type="button" class="btn-delete-rep-row" style="background: transparent; border:none; font-size:16px; cursor:pointer; color:#C0392B;" title="刪除">🗑️</button>
        `;

        row.querySelector('.btn-delete-rep-row').addEventListener('click', () => {
            row.remove();
            updateModalPercentageTotal();
        });

        row.querySelector('.modal-rep-pct-input').addEventListener('input', updateModalPercentageTotal);
        row.querySelector('.modal-rep-sales-input').addEventListener('input', updateModalPercentageTotal);

        container.appendChild(row);
        updateModalPercentageTotal();
    };

    const updateModalPercentageTotal = () => {
        let total = 0;
        document.querySelectorAll('.modal-rep-row').forEach(row => {
            const val = parseInt(row.querySelector('.modal-rep-pct-input').value, 10);
            if (!isNaN(val)) total += val;
        });

        const totalEl = document.getElementById('modal-commission-percentage-total');
        const warningEl = document.getElementById('modal-commission-warning');
        const saveBtn = document.getElementById('save-commission-btn');

        totalEl.textContent = `${total}%`;

        if (total === 100) {
            totalEl.style.color = '#2E7D32';
            warningEl.style.display = 'none';
            saveBtn.removeAttribute('disabled');
        } else {
            totalEl.style.color = '#C0392B';
            warningEl.style.display = 'block';
            saveBtn.setAttribute('disabled', 'true');
        }
    };

    const openCommissionModalForEdit = (id) => {
        const rule = settingsRules.find(r => r.id === id);
        if (!rule) return;

        currentSettingEditId = id;
        document.getElementById('commission-modal-title').innerHTML = `編輯分潤設定<br><span style="font-size: 12px; font-weight: normal; color: #666;">Edit Commission Settings</span>`;
        document.getElementById('modal-commission-account').value = rule.account;
        document.getElementById('modal-commission-product').value = rule.product;
        document.getElementById('modal-commission-start-date').value = rule.periodStart;
        document.getElementById('modal-commission-end-date').value = rule.periodEnd;
        document.getElementById('modal-commission-setup-date').value = rule.setupDate;

        const container = document.getElementById('modal-rep-rows-container');
        container.innerHTML = '';

        rule.splits.forEach(s => {
            addModalRepRow(s.sales, s.pct);
        });

        document.getElementById('commission-modal').classList.add('show');
    };

    const openCommissionModalForAdd = () => {
        currentSettingEditId = null;
        document.getElementById('commission-modal-title').innerHTML = `新增分潤設定<br><span style="font-size: 12px; font-weight: normal; color: #666;">Add Commission Settings</span>`;
        document.getElementById('modal-commission-account').value = '';
        document.getElementById('modal-commission-product').value = 'foreign_stock';
        document.getElementById('modal-commission-start-date').value = '2026/07/01';
        document.getElementById('modal-commission-end-date').value = '2026/12/31';
        document.getElementById('modal-commission-setup-date').value = '2026/06/30';

        const container = document.getElementById('modal-rep-rows-container');
        container.innerHTML = '';

        addModalRepRow('', '');

        document.getElementById('commission-modal').classList.add('show');
    };

    const commissionModal = document.getElementById('commission-modal');
    const cancelCommissionBtn = document.getElementById('cancel-commission-btn');
    const saveCommissionBtn = document.getElementById('save-commission-btn');
    const addRepBtn = document.getElementById('btn-add-modal-rep');
    const addRuleBtn = document.getElementById('btn-add-commission-setting');

    if (addRuleBtn) addRuleBtn.addEventListener('click', openCommissionModalForAdd);
    if (addRepBtn) addRepBtn.addEventListener('click', () => addModalRepRow('', ''));
    if (cancelCommissionBtn) cancelCommissionBtn.addEventListener('click', () => commissionModal.classList.remove('show'));

    if (saveCommissionBtn) {
        saveCommissionBtn.addEventListener('click', () => {
            const accountVal = document.getElementById('modal-commission-account').value.trim();
            if (!accountVal) {
                alert('請輸入總歸戶/法人戶名稱！');
                return;
            }

            const productSelect = document.getElementById('modal-commission-product');
            const productName = productSelect.options[productSelect.selectedIndex].text;
            const productVal = productSelect.value;
            const startVal = document.getElementById('modal-commission-start-date').value;
            const endVal = document.getElementById('modal-commission-end-date').value;
            const setupVal = document.getElementById('modal-commission-setup-date').value;

            let splits = [];
            const palette = [
                { color: '#0D47A1', bg: '#E3F2FD' },
                { color: '#1B5E20', bg: '#E8F5E9' },
                { color: '#E65100', bg: '#FFF3E0' },
                { color: '#4A148C', bg: '#F3E5F5' },
                { color: '#006064', bg: '#E0F7FA' }
            ];

            let index = 0;
            document.querySelectorAll('.modal-rep-row').forEach(row => {
                const name = row.querySelector('.modal-rep-sales-input').value.trim();
                const pct = parseInt(row.querySelector('.modal-rep-pct-input').value, 10);
                if (name && !isNaN(pct)) {
                    const colorScheme = palette[index % palette.length];
                    splits.push({
                        sales: name,
                        pct: pct,
                        color: colorScheme.color,
                        bg: colorScheme.bg
                    });
                    index++;
                }
            });

            if (currentSettingEditId !== null) {
                // Edit mode
                const rule = settingsRules.find(r => r.id === currentSettingEditId);
                if (rule) {
                    rule.account = accountVal;
                    rule.product = productVal;
                    rule.productName = productName;
                    rule.periodStart = startVal;
                    rule.periodEnd = endVal;
                    rule.setupDate = setupVal;
                    rule.splits = splits;
                }
            } else {
                // Add mode
                const newId = settingsRules.length > 0 ? Math.max(...settingsRules.map(r => r.id)) + 1 : 1;
                settingsRules.push({
                    id: newId,
                    account: accountVal,
                    product: productVal,
                    productName: productName,
                    periodStart: startVal,
                    periodEnd: endVal,
                    setupDate: setupVal,
                    splits: splits
                });
            }

            commissionModal.classList.remove('show');
            renderSettingsTable();
            alert('分潤設定儲存成功！');
        });
    }

    const querySettingsBtn = document.getElementById('btn-query-settings');
    const resetSettingsBtn = document.getElementById('btn-reset-settings');

    if (querySettingsBtn) {
        querySettingsBtn.addEventListener('click', renderSettingsTable);
    }
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            document.getElementById('filter-setting-account').value = '';
            document.getElementById('filter-setting-product').value = 'all';
            document.getElementById('filter-setting-sales').value = '';
            document.getElementById('filter-setting-start').value = '2025/1/1';
            document.getElementById('filter-setting-end').value = '2026/12/31';
            renderSettingsTable();
        });
    }

    // Initial render for settings table
    renderSettingsTable();

    // ----------------------------------------------------
    // Hash Change Logic for Navigation
    // ----------------------------------------------------
    const handleHashChange = () => {
        const hash = window.location.hash;
        if (!hash) return;
        let targetId = '';
        if (hash === '#perf-overview') targetId = 'panel-overview';
        else if (hash === '#perf-analysis') targetId = 'panel-analysis';
        else if (hash === '#domestic-basic') targetId = 'panel-domestic-basic';
        else if (hash === '#foreign-basic') targetId = 'panel-foreign-basic';
        else if (hash === '#commission') targetId = 'panel-commission';
        else if (hash === '#commission-settings') targetId = 'panel-commission-settings';
        
        if (targetId) {
            const targetBtn = Array.from(document.querySelectorAll('.report-tab-btn')).find(btn => btn.getAttribute('data-target') === targetId);
            if (targetBtn) {
                targetBtn.click();
                window.scrollTo(0, 0);
            }
        }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);


    // =========================================================================
    // 內法基礎報表 (Domestic Basic Report) - 洋蔥式呈現實作
    // =========================================================================

    const rawLeafDataDomestic = [
        // 關係企業 -> 投信 -> 富邦投信 -> 專戶明細
        { id: 'dom-spec-xxx', parent: 'firm-fubon-site', level: 4, grp: 'site', labels: ['', '機構法人', '投信', '富邦投信', '一銀全委富邦XXX專戶', '9812345', 'A123456789', 'Ann Liao'], values: { '2025': [150, 160, 140, 155, 170, 180, 160, 170, 175, 190, 185, 200], '2026': { '01': [210], '02': [220], '03': [230], '04': [240], '05': [250], '06': [265], '07': [280], '08': { W1: 65, W2: 70, W3: 60, W4: 55, W5: 20 } } } },
        { id: 'dom-spec-ooo', parent: 'firm-fubon-site', level: 4, grp: 'site', labels: ['', '機構法人', '投信', '富邦投信', '復華全委富邦OOO專戶', '9856789', 'B987654321', 'Charlie Zhao'], values: { '2025': [100, 110, 95, 105, 120, 130, 110, 125, 130, 140, 135, 150], '2026': { '01': [160], '02': [170], '03': [175], '04': [180], '05': [185], '06': [195], '07': [205], '08': { W1: 48, W2: 52, W3: 45, W4: 42, W5: 15 } } } },
        
        // 關係企業 -> 產壽險 -> 富邦人壽 -> 明細
        { id: 'dom-life-fubon', parent: 'firm-fubon-life', level: 4, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '富邦人壽', '富邦人壽全委投資帳戶', '9888999', 'C112233445', 'David Lin'], values: { '2025': [120, 130, 110, 125, 140, 150, 130, 140, 150, 160, 155, 170], '2026': { '01': [180], '02': [195], '03': [190], '04': [200], '05': [205], '06': [215], '07': [225], '08': { W1: 52, W2: 58, W3: 50, W4: 48, W5: 16 } } } },
        { id: 'dom-pc-fubon', parent: 'firm-fubon-property', level: 4, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '富邦產險', '富邦產物保險資金帳戶', '9888777', 'C223344556', 'Ann Liao'], values: { '2025': [90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145], '2026': { '01': [150], '02': [155], '03': [160], '04': [165], '05': [170], '06': [175], '07': [180], '08': { W1: 40, W2: 42, W3: 38, W4: 36, W5: 12 } } } },

        // 一般 -> 投信 -> 復華投信 / 元大投信 / 中信投信 / 國泰投信 -> 明細
        { id: 'dom-gen-fuhwa', parent: 'firm-fuhwa-site', level: 4, grp: 'site', labels: ['', '機構法人', '投信', '復華投信', '復華高成長基金專戶', '9722334', 'D123987456', 'Ann Liao'], values: { '2025': [110, 115, 120, 125, 130, 140, 135, 145, 150, 160, 155, 170], '2026': { '01': [180], '02': [185], '03': [190], '04': [195], '05': [200], '06': [210], '07': [220], '08': { W1: 50, W2: 52, W3: 48, W4: 45, W5: 15 } } } },
        { id: 'dom-gen-yuanta', parent: 'firm-yuanta-site', level: 4, grp: 'site', labels: ['', '機構法人', '投信', '元大投信', '元大卓越基金專戶', '9711223', 'D998877665', 'Charlie Zhao'], values: { '2025': [200, 210, 190, 205, 220, 240, 220, 230, 245, 260, 250, 280], '2026': { '01': [290], '02': [300], '03': [310], '04': [320], '05': [330], '06': [345], '07': [360], '08': { W1: 85, W2: 90, W3: 80, W4: 75, W5: 25 } } } },
        { id: 'dom-gen-ctbc', parent: 'firm-ctbc-site', level: 4, grp: 'site', labels: ['', '機構法人', '投信', '中國信託投信', '中國信託成長基金專戶', '9733445', 'E554433221', 'Ann Liao'], values: { '2025': [80, 90, 85, 95, 100, 110, 95, 100, 105, 120, 110, 130], '2026': { '01': [140], '02': [130], '03': [135], '04': [145], '05': [150], '06': [160], '07': [170], '08': { W1: 40, W2: 42, W3: 38, W4: 35, W5: 12 } } } },
        { id: 'dom-gen-cathay-site', parent: 'firm-cathay-site', level: 4, grp: 'site', labels: ['', '機構法人', '投信', '國泰投信', '國泰台灣高股息基金專戶', '9744556', 'E667788990', 'Charlie Zhao'], values: { '2025': [140, 145, 150, 155, 160, 170, 165, 175, 180, 190, 185, 200], '2026': { '01': [210], '02': [215], '03': [220], '04': [225], '05': [230], '06': [240], '07': [250], '08': { W1: 60, W2: 62, W3: 58, W4: 55, W5: 18 } } } },

        // 一般 -> 產壽險 -> 國泰人壽 / 新光人壽 / 南山人壽 -> 明細
        { id: 'dom-gen-cathay-life', parent: 'firm-cathay-life', level: 4, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '國泰人壽', '國泰人壽全委投資帳戶', '9611223', 'F112233445', 'David Lin'], values: { '2025': [180, 190, 185, 195, 200, 210, 205, 215, 220, 230, 225, 240], '2026': { '01': [250], '02': [255], '03': [260], '04': [265], '05': [270], '06': [280], '07': [290], '08': { W1: 70, W2: 72, W3: 68, W4: 65, W5: 22 } } } },
        { id: 'dom-gen-shinkong-life', parent: 'firm-shinkong-life', level: 4, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '新光人壽', '新光人壽傳統型帳戶', '9622334', 'F223344556', 'Ann Liao'], values: { '2025': [110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165], '2026': { '01': [170], '02': [175], '03': [180], '04': [185], '05': [190], '06': [195], '07': [200], '08': { W1: 45, W2: 48, W3: 42, W4: 40, W5: 14 } } } },

        // 一般 -> 政府基金 -> 勞動基金 / 退撫基金 -> 明細
        { id: 'dom-gen-gov-labor', parent: 'firm-gov-labor', level: 4, grp: 'gov_fund', labels: ['', '機構法人', '政府基金', '勞動基金運用局', '勞動基金全委代操專戶A', '9511223', 'G112233445', 'David Lin'], values: { '2025': [250, 260, 255, 270, 280, 290, 285, 300, 310, 320, 315, 330], '2026': { '01': [340], '02': [350], '03': [360], '04': [370], '05': [380], '06': [390], '07': [400], '08': { W1: 95, W2: 100, W3: 90, W4: 85, W5: 30 } } } },

        // 一般 -> 銀行 -> 兆豐銀行 / 玉山銀行 -> 明細
        { id: 'dom-gen-bank-mega', parent: 'firm-bank-mega', level: 4, grp: 'bank', labels: ['', '機構法人', '銀行', '兆豐國際商業銀行', '兆豐銀行信託部專戶', '9411223', 'H112233445', 'Charlie Zhao'], values: { '2025': [130, 135, 140, 145, 150, 160, 155, 165, 170, 180, 175, 190], '2026': { '01': [200], '02': [205], '03': [210], '04': [215], '05': [220], '06': [230], '07': [240], '08': { W1: 55, W2: 58, W3: 52, W4: 50, W5: 17 } } } },

        // 一般 -> 證券 -> 凱基證券 -> 明細
        { id: 'dom-gen-sec-kgi', parent: 'firm-sec-kgi', level: 4, grp: 'sec', labels: ['', '機構法人', '證券', '凱基證券', '凱基證券自營部專戶', '9311223', 'I112233445', 'Ann Liao'], values: { '2025': [160, 165, 170, 175, 180, 190, 185, 195, 200, 210, 205, 220], '2026': { '01': [230], '02': [235], '03': [240], '04': [245], '05': [250], '06': [260], '07': [270], '08': { W1: 65, W2: 68, W3: 62, W4: 60, W5: 20 } } } }
    ];

    const structuralNodesDomestic = [
        // Level 3: 總歸戶 (關係企業下)
        { id: 'firm-fubon-site', parent: 'grp-site-rel', level: 3, grp: 'site', labels: ['', '機構法人', '投信', '富邦投信', '', '', '', ''], name: '富邦投信' },
        { id: 'firm-fubon-life', parent: 'grp-pc-rel', level: 3, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '富邦人壽', '', '', '', ''], name: '富邦人壽' },
        { id: 'firm-fubon-property', parent: 'grp-pc-rel', level: 3, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '富邦產險', '', '', '', ''], name: '富邦產險' },
        { id: 'firm-fubon-fut', parent: 'grp-fut-rel', level: 3, grp: 'futures', labels: ['', '機構法人', '期貨', '富邦期貨', '', '', '', ''], name: '富邦期貨' },
        { id: 'firm-fubon-bank', parent: 'grp-bank-rel', level: 3, grp: 'bank', labels: ['', '機構法人', '銀行', '台北富邦銀行', '', '', '', ''], name: '台北富邦銀行' },
        { id: 'firm-fubon-sec', parent: 'grp-sec-rel', level: 3, grp: 'sec', labels: ['', '機構法人', '證券', '富邦證券', '', '', '', ''], name: '富邦證券' },
        { id: 'firm-fubon-inv', parent: 'grp-inv-rel', level: 3, grp: 'inv_co', labels: ['', '一般', '投資公司', '富邦投資公司', '', '', '', ''], name: '富邦投資公司' },

        // Level 3: 總歸戶 (一般下)
        { id: 'firm-fuhwa-site', parent: 'grp-site-gen', level: 3, grp: 'site', labels: ['', '機構法人', '投信', '復華投信', '', '', '', ''], name: '復華投信' },
        { id: 'firm-yuanta-site', parent: 'grp-site-gen', level: 3, grp: 'site', labels: ['', '機構法人', '投信', '元大投信', '', '', '', ''], name: '元大投信' },
        { id: 'firm-ctbc-site', parent: 'grp-site-gen', level: 3, grp: 'site', labels: ['', '機構法人', '投信', '中國信託投信', '', '', '', ''], name: '中國信託投信' },
        { id: 'firm-cathay-site', parent: 'grp-site-gen', level: 3, grp: 'site', labels: ['', '機構法人', '投信', '國泰投信', '', '', '', ''], name: '國泰投信' },

        { id: 'firm-cathay-life', parent: 'grp-pc-gen', level: 3, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '國泰人壽', '', '', '', ''], name: '國泰人壽' },
        { id: 'firm-shinkong-life', parent: 'grp-pc-gen', level: 3, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '新光人壽', '', '', '', ''], name: '新光人壽' },
        { id: 'firm-nanshan-life', parent: 'grp-pc-gen', level: 3, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '南山人壽', '', '', '', ''], name: '南山人壽' },

        { id: 'firm-98-acc-a', parent: 'grp-98-gen', level: 3, grp: 'acc_98', labels: ['', '一般', '98戶', '98專戶A', '', '', '', ''], name: '98專戶A' },
        { id: 'firm-gen-corp-mtk', parent: 'grp-corp-gen', level: 3, grp: 'gen_corp', labels: ['', '一般', '一般法人', '聯發科技公司', '', '', '', ''], name: '聯發科技公司' },
        { id: 'firm-listed-foxconn', parent: 'grp-list-gen', level: 3, grp: 'listed', labels: ['', '一般', '上市櫃', '鴻海精密公司', '', '', '', ''], name: '鴻海精密公司' },
        { id: 'firm-retail-vip', parent: 'grp-ret-gen', level: 3, grp: 'retail', labels: ['', '一般', '自然人', 'VIP自然人戶張先生', '', '', '', ''], name: 'VIP自然人戶張先生' },
        { id: 'firm-inv-cheng-zhou', parent: 'grp-inv-gen', level: 3, grp: 'inv_co', labels: ['', '一般', '投資公司', '誠州投資公司', '', '', '', ''], name: '誠州投資公司' },
        { id: 'firm-sice-smbc', parent: 'grp-sice-gen', level: 3, grp: 'sice', labels: ['', '一般', '投顧代操', '三井住友投顧代操', '', '', '', ''], name: '三井住友投顧代操' },
        { id: 'firm-cbank-a', parent: 'grp-cbank-gen', level: 3, grp: 'corp_bank', labels: ['', '一般', '法金客群', '法金法人客戶A', '', '', '', ''], name: '法金法人客戶A' },
        { id: 'firm-gov-labor', parent: 'grp-gov-gen', level: 3, grp: 'gov_fund', labels: ['', '機構法人', '政府基金', '勞動基金運用局', '', '', '', ''], name: '勞動基金運用局' },
        { id: 'firm-gov-pension', parent: 'grp-gov-gen', level: 3, grp: 'gov_fund', labels: ['', '機構法人', '政府基金', '公務人員退撫基金', '', '', '', ''], name: '公務人員退撫基金' },
        { id: 'firm-hnw-pb', parent: 'grp-hnw-gen', level: 3, grp: 'hnw', labels: ['', '一般', '高端客戶', '私銀高端客戶專戶', '', '', '', ''], name: '私銀高端客戶專戶' },
        { id: 'firm-bills-mega', parent: 'grp-bill-gen', level: 3, grp: 'bills', labels: ['', '機構法人', '票券', '兆豐票券', '', '', '', ''], name: '兆豐票券' },
        { id: 'firm-fut-yuanta', parent: 'grp-fut-gen', level: 3, grp: 'futures', labels: ['', '機構法人', '期貨', '元大期貨', '', '', '', ''], name: '元大期貨' },
        { id: 'firm-bank-mega', parent: 'grp-bank-gen', level: 3, grp: 'bank', labels: ['', '機構法人', '銀行', '兆豐國際商業銀行', '', '', '', ''], name: '兆豐國際商業銀行' },
        { id: 'firm-bank-esun', parent: 'grp-bank-gen', level: 3, grp: 'bank', labels: ['', '機構法人', '銀行', '玉山商業銀行', '', '', '', ''], name: '玉山商業銀行' },
        { id: 'firm-sec-kgi', parent: 'grp-sec-gen', level: 3, grp: 'sec', labels: ['', '機構法人', '證券', '凱基證券', '', '', '', ''], name: '凱基證券' },
        { id: 'firm-oth-gen-node', parent: 'grp-oth-gen', level: 3, grp: 'other', labels: ['', '', '其他', '其他一般法人戶', '', '', '', ''], name: '其他一般法人戶' },

        // Level 2: 客群類別 (關係企業下)
        { id: 'grp-site-rel', parent: 'aff-rel', level: 2, grp: 'site', labels: ['', '機構法人', '投信', '', '', '', '', ''], name: '投信' },
        { id: 'grp-pc-rel', parent: 'aff-rel', level: 2, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '', '', '', '', ''], name: '產壽險' },
        { id: 'grp-inv-rel', parent: 'aff-rel', level: 2, grp: 'inv_co', labels: ['', '一般', '投資公司', '', '', '', '', ''], name: '投資公司' },
        { id: 'grp-fut-rel', parent: 'aff-rel', level: 2, grp: 'futures', labels: ['', '機構法人', '期貨', '', '', '', '', ''], name: '期貨' },
        { id: 'grp-bank-rel', parent: 'aff-rel', level: 2, grp: 'bank', labels: ['', '機構法人', '銀行', '', '', '', '', ''], name: '銀行' },
        { id: 'grp-sec-rel', parent: 'aff-rel', level: 2, grp: 'sec', labels: ['', '機構法人', '證券', '', '', '', '', ''], name: '證券' },
        { id: 'grp-oth-rel', parent: 'aff-rel', level: 2, grp: 'other', labels: ['', '', '其他', '', '', '', '', ''], name: '其他' },

        // Level 2: 客群類別 (一般下)
        { id: 'grp-site-gen', parent: 'aff-gen', level: 2, grp: 'site', labels: ['', '機構法人', '投信', '', '', '', '', ''], name: '投信' },
        { id: 'grp-pc-gen', parent: 'aff-gen', level: 2, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '', '', '', '', ''], name: '產壽險' },
        { id: 'grp-98-gen', parent: 'aff-gen', level: 2, grp: 'acc_98', labels: ['', '一般', '98戶', '', '', '', '', ''], name: '98戶' },
        { id: 'grp-corp-gen', parent: 'aff-gen', level: 2, grp: 'gen_corp', labels: ['', '一般', '一般法人', '', '', '', '', ''], name: '一般法人' },
        { id: 'grp-list-gen', parent: 'aff-gen', level: 2, grp: 'listed', labels: ['', '一般', '上市櫃', '', '', '', '', ''], name: '上市櫃' },
        { id: 'grp-ret-gen', parent: 'aff-gen', level: 2, grp: 'retail', labels: ['', '一般', '自然人', '', '', '', '', ''], name: '自然人' },
        { id: 'grp-inv-gen', parent: 'aff-gen', level: 2, grp: 'inv_co', labels: ['', '一般', '投資公司', '', '', '', '', ''], name: '投資公司' },
        { id: 'grp-sice-gen', parent: 'aff-gen', level: 2, grp: 'sice', labels: ['', '一般', '投顧代操', '', '', '', '', ''], name: '投顧代操' },
        { id: 'grp-cbank-gen', parent: 'aff-gen', level: 2, grp: 'corp_bank', labels: ['', '一般', '法金客群', '', '', '', '', ''], name: '法金客群' },
        { id: 'grp-gov-gen', parent: 'aff-gen', level: 2, grp: 'gov_fund', labels: ['', '機構法人', '政府基金', '', '', '', '', ''], name: '政府基金' },
        { id: 'grp-hnw-gen', parent: 'aff-gen', level: 2, grp: 'hnw', labels: ['', '一般', '高端客戶', '', '', '', '', ''], name: '高端客戶' },
        { id: 'grp-bill-gen', parent: 'aff-gen', level: 2, grp: 'bills', labels: ['', '機構法人', '票券', '', '', '', '', ''], name: '票券' },
        { id: 'grp-fut-gen', parent: 'aff-gen', level: 2, grp: 'futures', labels: ['', '機構法人', '期貨', '', '', '', '', ''], name: '期貨' },
        { id: 'grp-bank-gen', parent: 'aff-gen', level: 2, grp: 'bank', labels: ['', '機構法人', '銀行', '', '', '', '', ''], name: '銀行' },
        { id: 'grp-sec-gen', parent: 'aff-gen', level: 2, grp: 'sec', labels: ['', '機構法人', '證券', '', '', '', '', ''], name: '證券' },
        { id: 'grp-oth-gen', parent: 'aff-gen', level: 2, grp: 'other', labels: ['', '', '其他', '', '', '', '', ''], name: '其他' },

        // Level 1: 關係企業 / 一般 / 其他
        { id: 'aff-rel', parent: 'org-domestic-total', level: 1, labels: ['關係企業', '', '', '', '', '', '', ''], name: '關係企業' },
        { id: 'aff-gen', parent: 'org-domestic-total', level: 1, labels: ['一般', '', '', '', '', '', '', ''], name: '一般' },
        { id: 'aff-oth', parent: 'org-domestic-total', level: 1, labels: ['其他', '', '', '', '', '', '', ''], name: '其他' },

        // Level 0: 總計
        { id: 'org-domestic-total', parent: null, level: 0, labels: ['總計', '', '', '', '', '', '', ''], name: '總計' }
    ];

    let allNodesDomestic = [...rawLeafDataDomestic, ...structuralNodesDomestic];
    let expandedColsDomestic = { '2025': false, '2026': false, '2026-08': true };
    let expandedRowsDomestic = {
        'org-domestic-total': true,
        'aff-rel': true,
        'aff-gen': true,
        'grp-site-rel': true,
        'grp-pc-rel': true,
        'grp-site-gen': true,
        'firm-fubon-site': true
    };

    let sortColDomestic = null;
    let sortAscDomestic = true;
    let stickyWidthsDomestic = [90, 90, 90, 110, 160, 90, 110, 90];

    const createEmptyValuesDomestic = () => ({
        '2025': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        '2026': { 
            '01': [0], '02': [0], '03': [0], '04': [0], 
            '05': [0], '06': [0], '07': [0], 
            '08': { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 } 
        }
    });

    const aggregateValuesDomestic = () => {
        structuralNodesDomestic.forEach(node => { node.values = createEmptyValuesDomestic(); });
        for (let lvl = 4; lvl >= 1; lvl--) {
            allNodesDomestic.forEach(node => {
                if (node.level === lvl) {
                    const parentNode = allNodesDomestic.find(p => p.id === node.parent);
                    if (parentNode) {
                        for (let m = 0; m < 12; m++) {
                            parentNode.values['2025'][m] += node.values['2025'][m] || 0;
                        }
                        for (let m = 1; m <= 7; m++) {
                            const key = m < 10 ? `0${m}` : `${m}`;
                            if (parentNode.values['2026'][key] && node.values['2026'][key]) {
                                parentNode.values['2026'][key][0] += node.values['2026'][key][0] || 0;
                            }
                        }
                        
                        const w8 = parentNode.values['2026']['08'];
                        const node_w8 = node.values['2026']['08'];
                        if (w8 && node_w8) {
                            w8.W1 += node_w8.W1 || 0;
                            w8.W2 += node_w8.W2 || 0;
                            w8.W3 += node_w8.W3 || 0;
                            w8.W4 += node_w8.W4 || 0;
                            w8.W5 += node_w8.W5 || 0;
                        }
                    }
                }
            });
        }
    };
    aggregateValuesDomestic();

    const getRowCalculatedMetricsDomestic = (node) => {
        const v = node.values;
        const augMTD = (v['2026']['08'].W1 || 0) + (v['2026']['08'].W2 || 0) + (v['2026']['08'].W3 || 0) + (v['2026']['08'].W4 || 0) + (v['2026']['08'].W5 || 0);
        
        // Mock daily volume for August 18 (e.g. W3 daily average)
        const todayVal = Math.round((v['2026']['08'].W3 || 0) / 5);
        const julTotal = v['2026']['07'][0];
        const mom = julTotal > 0 ? ((augMTD - julTotal) / julTotal) * 100 : 0;
        
        let ytd = 0;
        for (let m = 1; m <= 7; m++) {
            const key = m < 10 ? `0${m}` : `${m}`;
            ytd += (v['2026'][key] ? v['2026'][key][0] : 0);
        }
        ytd += augMTD;

        // August annualized calculation (3 completed weeks)
        const annualized = Math.round((augMTD / 3) * 4.5);

        const total2025Domestic = v['2025'].reduce((a, b) => a + b, 0);
        const yoy = total2025Domestic > 0 ? ((ytd - total2025Domestic) / total2025Domestic) * 100 : 0;

        return {
            today: todayVal,
            annualized: annualized,
            marMTD: augMTD,
            mom: mom,
            ytd: ytd,
            yoy: yoy,
            values: {
                '2025_total': v['2025'].reduce((a, b) => a + b, 0),
                '2025_months': v['2025'].map(x => x),
                '2026_01': v['2026']['01'][0],
                '2026_02': v['2026']['02'][0],
                '2026_03': v['2026']['03'][0],
                '2026_04': v['2026']['04'][0],
                '2026_05': v['2026']['05'][0],
                '2026_06': v['2026']['06'][0],
                '2026_07': v['2026']['07'][0],
                '2026_08_W1': v['2026']['08'].W1,
                '2026_08_W2': v['2026']['08'].W2,
                '2026_08_W3': v['2026']['08'].W3,
                '2026_08_W4': v['2026']['08'].W4,
                '2026_08_W5': v['2026']['08'].W5
            }
        };
    };

    const getSortedSubtreeDomestic = (parentId, filteredNodes) => {
        let directChildren = filteredNodes.filter(node => node.parent === parentId);
        if (sortColDomestic) {
            directChildren.sort((a, b) => {
                const metricsA = getRowCalculatedMetricsDomestic(a);
                const metricsB = getRowCalculatedMetricsDomestic(b);
                let valA = 0, valB = 0;

                if (sortColDomestic === 'today') { valA = metricsA.today; valB = metricsB.today; }
                else if (sortColDomestic === 'ann') { valA = metricsA.annualized; valB = metricsB.annualized; }
                else if (sortColDomestic === 'mtd') { valA = metricsA.marMTD; valB = metricsB.marMTD; }
                else if (sortColDomestic === 'mom') { valA = metricsA.mom; valB = metricsB.mom; }
                else if (sortColDomestic === 'ytd') { valA = metricsA.ytd; valB = metricsB.ytd; }
                else if (sortColDomestic === 'yoy') { valA = metricsA.yoy; valB = metricsB.yoy; }
                else if (sortColDomestic === '2025_total') { valA = metricsA.values['2025_total']; valB = metricsB.values['2025_total']; }
                else if (sortColDomestic && sortColDomestic.startsWith('2026_')) {
                    const colKey = sortColDomestic;
                    valA = metricsA.values[colKey] || 0;
                    valB = metricsB.values[colKey] || 0;
                }
                else if (sortColDomestic && sortColDomestic.startsWith('2025_')) {
                    const mIdx = parseInt(sortColDomestic.split('_')[1], 10);
                    valA = metricsA.values['2025_months'][mIdx] || 0;
                    valB = metricsB.values['2025_months'][mIdx] || 0;
                }
                return sortAscDomestic ? valA - valB : valB - valA;
            });
        }
        let result = [];
        directChildren.forEach(child => {
            result.push(child);
            result = result.concat(getSortedSubtreeDomestic(child.id, filteredNodes));
        });
        return result;
    };

    const renderDomesticTable = () => {
        const container = document.getElementById('onion-table-domestic');
        if (!container) return;

        // Custom multiselect values filtering
        const groupCbs = document.querySelectorAll('#group-domestic-options input[type="checkbox"]');
        const selectedGroupValues = Array.from(groupCbs).filter(cb => cb.checked).map(cb => cb.value);
        const totalGroupsCount = groupCbs.length;

        const parentAccCbs = document.querySelectorAll('#parent-acc-domestic-options input[type="checkbox"]');
        const selectedParentAccValues = Array.from(parentAccCbs).filter(cb => cb.checked).map(cb => cb.value);
        const totalParentAccCount = parentAccCbs.length;

        const rawAccId = (document.getElementById('filter-account-id-domestic') ? document.getElementById('filter-account-id-domestic').value.trim() : '');
        const qSalesRaw = (document.getElementById('filter-sales-domestic') ? document.getElementById('filter-sales-domestic').value.trim() : '');
        const qInst = (document.getElementById('filter-inst-domestic') ? document.getElementById('filter-inst-domestic').value : 'all');

        const isStructuralEmptyDomestic = (n) => {
            if (n.level === 4) return false;
            const hasLeaf = allNodesDomestic.some(child => {
                if (child.level !== 4) return false;
                let p = child.parent;
                while (p) {
                    if (p === n.id) return true;
                    const pNode = allNodesDomestic.find(x => x.id === p);
                    p = pNode ? pNode.parent : null;
                }
                return false;
            });
            return !hasLeaf;
        };

        let filteredNodes = allNodesDomestic.filter(node => {
            if (node.level === 0) return true; // Always show Total
            
            // Check group category filter if not all selected
            if (selectedGroupValues.length < totalGroupsCount) {
                if (node.grp && !selectedGroupValues.includes(node.grp)) {
                    return false;
                }
            }

            // Preserve empty structural categories at level 1 & 2
            if (node.level <= 2 && isStructuralEmptyDomestic(node)) {
                return true;
            }

            // Check Parent Account multiselect filter if not all selected
            if (selectedParentAccValues.length < totalParentAccCount) {
                const matchesSelf = node.labels[3] && selectedParentAccValues.includes(node.labels[3]);
                if (!matchesSelf && node.level > 0 && node.level < 3) {
                    const hasMatchingDescendant = allNodesDomestic.some(child => {
                        let isChild = false;
                        let p = child.parent;
                        while(p) {
                            if (p === node.id) { isChild = true; break; }
                            const pNode = allNodesDomestic.find(n => n.id === p);
                            p = pNode ? pNode.parent : null;
                        }
                        return isChild && child.labels[3] && selectedParentAccValues.includes(child.labels[3]);
                    });
                    if (!hasMatchingDescendant) return false;
                } else if (!matchesSelf && (node.level === 3 || node.level === 4)) {
                    return false;
                }
            }

            // Check Inst. Entity filter (inst vs general)
            if (qInst !== 'all') {
                const targetInst = (qInst === 'inst' ? '機構法人' : '一般');
                const matchesSelf = (node.labels[1] === targetInst);
                if (!matchesSelf && node.level !== 1) {
                    const hasMatchingDescendant = allNodesDomestic.some(child => {
                        let isChild = false;
                        let p = child.parent;
                        while(p) {
                            if (p === node.id) { isChild = true; break; }
                            const pNode = allNodesDomestic.find(n => n.id === p);
                            p = pNode ? pNode.parent : null;
                        }
                        return isChild && (child.labels[1] === targetInst);
                    });
                    if (!hasMatchingDescendant) return false;
                }
            }

            // Check Account No / ID search
            if (rawAccId) {
                const cleanAccId = rawAccId.toLowerCase();
                const matchesSelf = (node.labels[5] && node.labels[5].toLowerCase().includes(cleanAccId)) ||
                                    (node.labels[6] && node.labels[6].toLowerCase().includes(cleanAccId)) ||
                                    cleanAccId.includes(node.labels[5] ? node.labels[5].toLowerCase() : '___') ||
                                    cleanAccId.includes(node.labels[6] ? node.labels[6].toLowerCase() : '___');
                if (!matchesSelf) {
                    const hasMatchingDescendant = allNodesDomestic.some(child => {
                        let isChild = false;
                        let p = child.parent;
                        while(p) {
                            if (p === node.id) { isChild = true; break; }
                            const pNode = allNodesDomestic.find(n => n.id === p);
                            p = pNode ? pNode.parent : null;
                        }
                        return isChild && ((child.labels[5] && child.labels[5].toLowerCase().includes(cleanAccId)) ||
                                          (child.labels[6] && child.labels[6].toLowerCase().includes(cleanAccId)) ||
                                          cleanAccId.includes(child.labels[5] ? child.labels[5].toLowerCase() : '___') ||
                                          cleanAccId.includes(child.labels[6] ? child.labels[6].toLowerCase() : '___'));
                    });
                    if (!hasMatchingDescendant) return false;
                }
            }

            // Check Sales Rep / Emp ID search
            if (qSalesRaw) {
                const cleanSales = qSalesRaw.toLowerCase();
                const matchesSelf = (node.labels[7] && node.labels[7].toLowerCase().includes(cleanSales)) ||
                                    cleanSales.includes(node.labels[7] ? node.labels[7].toLowerCase() : '___');
                if (!matchesSelf) {
                    const hasMatchingDescendant = allNodesDomestic.some(child => {
                        let isChild = false;
                        let p = child.parent;
                        while(p) {
                            if (p === node.id) { isChild = true; break; }
                            const pNode = allNodesDomestic.find(n => n.id === p);
                            p = pNode ? pNode.parent : null;
                        }
                        return isChild && ((child.labels[7] && child.labels[7].toLowerCase().includes(cleanSales)) ||
                                          cleanSales.includes(child.labels[7] ? child.labels[7].toLowerCase() : '___'));
                    });
                    if (!hasMatchingDescendant) return false;
                }
            }

            return true;
        });

        let totalNode = filteredNodes.find(n => n.id === 'org-domestic-total');
        let sortedNodes = [];
        if (totalNode) {
            sortedNodes.push(totalNode);
            sortedNodes = sortedNodes.concat(getSortedSubtreeDomestic('org-domestic-total', filteredNodes));
        }

        const isRowVisible = (node) => {
            if (node.level === 0 || node.level === 1 || node.level === 2) return true;
            let p = node.parent;
            while (p) {
                if (!expandedRowsDomestic[p]) return false;
                const pNode = allNodesDomestic.find(n => n.id === p);
                p = pNode ? pNode.parent : null;
            }
            return true;
        };

        const visibleNodes = sortedNodes.filter(isRowVisible);
        // Filter out level 4 nodes from main table (Level 3 總歸戶 is lowest level in main table)
        const mainTableVisibleNodes = visibleNodes.filter(node => node.level <= 3);

        // Slice rows based on dropdown limit
        let limit = 'all';
        const limitSelect = document.getElementById('select-row-limit-domestic');
        if (limitSelect) limit = limitSelect.value;
        let displayedNodes = mainTableVisibleNodes;
        if (limit !== 'all') {
            const numLimit = parseInt(limit, 10);
            displayedNodes = mainTableVisibleNodes.slice(0, numLimit);
        }

        let span2025 = expandedColsDomestic['2025'] ? 12 : 1;
        let span2026 = 13 + (expandedColsDomestic['2026-08'] ? 5 : 0); // 1~7月 (7) + 8月 (1) + MTD (1) + 月化 (1) + MoM (1) + YTD (1) + YoY (1) = 13 cols

        let headerRow1 = `
            <tr>
                <th rowspan="2" class="col-sticky-1">關係企業<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Affiliate</span></th>
                <th rowspan="2" class="col-sticky-2">機構法人<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Inst Entity</span></th>
                <th rowspan="2" class="col-sticky-3">客群類別<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Group Category</span></th>
                <th rowspan="2" class="col-sticky-4">總歸戶<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Parent Account</span></th>
                
                <th colspan="${span2025}" class="col-group-header">2025 <button class="col-expand-btn-domestic expand-btn" data-col="2025">${expandedColsDomestic['2025'] ? '-' : '+'}</button></th>
                <th colspan="${span2026}" class="col-group-header">2026 <button class="col-expand-btn-domestic expand-btn" data-col="2026">${expandedColsDomestic['2026'] ? '-' : '+'}</button></th>
                <th rowspan="2" class="sortable-header-domestic" data-sort="today" style="background:#EBF5FB; color:#1B4F72;">當日交易量 ↕</th>
            </tr>
        `;

        let headerRow2 = '<tr>';
        if (expandedColsDomestic['2025']) {
            for (let m = 1; m <= 12; m++) {
                headerRow2 += `<th class="sortable-header-domestic" data-sort="2025_${m-1}" style="font-size:11px;">${m}月 ↕</th>`;
            }
        } else {
            headerRow2 += `<th class="sortable-header-domestic" data-sort="2025_total" style="font-size:11px; font-weight: 600;">YTD ↕</th>`;
        }

        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_01" style="font-size:11px;">1月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_02" style="font-size:11px;">2月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_03" style="font-size:11px;">3月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_04" style="font-size:11px;">4月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_05" style="font-size:11px;">5月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_06" style="font-size:11px;">6月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_07" style="font-size:11px;">7月 ↕ +</th>`;
        
        if (expandedColsDomestic['2026-08']) {
            headerRow2 += `<th class="col-group-header" style="font-size:11px; background:#1A5276;">8月 <button class="col-expand-btn-domestic expand-btn" data-col="2026-08">-</button></th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第1週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第2週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第3週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第4週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第5週</th>`;
        } else {
            headerRow2 += `<th class="col-group-header" style="font-size:11px;">8月 <button class="col-expand-btn-domestic expand-btn" data-col="2026-08">+</button></th>`;
        }

        headerRow2 += `<th class="sortable-header-domestic" data-sort="mtd" style="font-size:11px; background:#D0E8FF; color:#1E4670;">MTD ↕</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="ann" style="font-size:11px;">月化 ↕</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="mom" style="font-size:11px;">MoM ↕</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="ytd" style="font-size:11px; font-weight:600;">YTD ↕</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="yoy" style="font-size:11px;">YoY ↕</th>`;
        headerRow2 += '</tr>';

        let tbodyRows = '';
        displayedNodes.forEach(node => {
            const metrics = getRowCalculatedMetricsDomestic(node);
            let labelsHTML = '';
            for (let l = 0; l < 4; l++) {
                let cellVal = node.labels[l] || '';
                let colClass = `col-sticky-${l + 1}`;
                
                if (l === 0 && node.level === 0) {
                    labelsHTML += `<td class="${colClass} text-left"><strong>${cellVal}</strong></td>`;
                } else if (l === 0 && node.level === 1) {
                    let sign = expandedRowsDomestic[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left"><button class="row-expand-btn-domestic row-expand-btn" data-row="${node.id}">${sign}</button> ${cellVal}</td>`;
                } else if (l === 2 && node.level === 2) {
                    let hasChildren = allNodesDomestic.some(n => n.parent === node.id && n.level <= 3);
                    let sign = expandedRowsDomestic[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left indent-1">${hasChildren ? `<button class="row-expand-btn-domestic row-expand-btn" data-row="${node.id}">${sign}</button>` : ''} ${cellVal}</td>`;
                } else if (l === 3 && node.level === 3) {
                    if (cellVal) {
                        labelsHTML += `<td class="${colClass} text-left indent-2"><a href="javascript:void(0)" class="parent-account-link btn-open-parent-detail" data-parent-id="${node.id}" data-parent-name="${cellVal}">${cellVal} 🔗</a></td>`;
                    } else {
                        labelsHTML += `<td class="${colClass} text-left indent-2"></td>`;
                    }
                } else {
                    labelsHTML += `<td class="${colClass} text-left">${cellVal}</td>`;
                }
            }

            let valCells = '';
            if (expandedColsDomestic['2025']) {
                metrics.values['2025_months'].forEach(mVal => {
                    valCells += `<td>${Math.round(mVal).toLocaleString()}</td>`;
                });
            } else {
                valCells += `<td style="font-weight: 600;">${Math.round(metrics.values['2025_total']).toLocaleString()}</td>`;
            }

            valCells += `<td>${Math.round(metrics.values['2026_01']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_02']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_03']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_04']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_05']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_06']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_07']).toLocaleString()}</td>`;

            if (expandedColsDomestic['2026-08']) {
                valCells += `<td>${Math.round(metrics.values['2026_08_W1']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W2']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W3']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W4']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W5']).toLocaleString()}</td>`;
            }

            valCells += `<td style="font-weight: 700; background:#F2F8FD;">${Math.round(metrics.marMTD).toLocaleString()}</td>`;
            valCells += `<td style="font-weight: 600; color: var(--color-personal);">${Math.round(metrics.annualized).toLocaleString()}</td>`;
            valCells += `<td style="color: ${metrics.mom >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.mom.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight: 600;">${Math.round(metrics.ytd).toLocaleString()}</td>`;
            valCells += `<td style="color: ${metrics.yoy >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.yoy.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight: 700; background:#EBF5FB;">${Math.round(metrics.today).toLocaleString()}</td>`;

            let rowStyle = node.level === 0 ? ' style="background: #EAF2F8; font-weight: bold;"' : '';

            tbodyRows += `
                <tr class="row-level-${node.level}"${rowStyle}>
                    ${labelsHTML}
                    ${valCells}
                </tr>
            `;
        });

        container.innerHTML = `
            <thead>
                ${headerRow1}
                ${headerRow2}
            </thead>
            <tbody>
                ${tbodyRows}
            </tbody>
        `;

        attachDomesticTableListeners();
    };

    // ----------------------------------------------------
    // Custom Multi-Select Component Event Binding for Group Category
    // ----------------------------------------------------
    const groupTrigger = document.getElementById('group-domestic-trigger');
    const groupDropdown = document.getElementById('group-domestic-dropdown');
    const groupLabel = document.getElementById('group-domestic-label');
    const groupSearch = document.getElementById('group-domestic-search');
    const btnSelectAllGroups = document.getElementById('btn-select-all-groups');
    const btnClearAllGroups = document.getElementById('btn-clear-all-groups');

    const updateGroupLabelText = () => {
        const groupCbs = document.querySelectorAll('#group-domestic-options input[type="checkbox"]');
        if (!groupCbs.length || !groupLabel) return;

        const checkedList = Array.from(groupCbs).filter(cb => cb.checked);
        const totalCount = groupCbs.length;

        if (checkedList.length === 0) {
            groupLabel.textContent = '未選取客群';
            groupLabel.style.color = '#94A3B8';
        } else if (checkedList.length === totalCount) {
            groupLabel.textContent = `全選 (${totalCount}項客群)`;
            groupLabel.style.color = 'var(--text-main)';
        } else if (checkedList.length <= 2) {
            const names = checkedList.map(cb => cb.parentElement.textContent.trim()).join(', ');
            groupLabel.textContent = names;
            groupLabel.style.color = 'var(--text-main)';
        } else {
            const firstTwo = checkedList.slice(0, 2).map(cb => cb.parentElement.textContent.trim()).join(', ');
            groupLabel.textContent = `${firstTwo} (+${checkedList.length - 2}項)`;
            groupLabel.style.color = 'var(--text-main)';
        }
    };

    if (groupTrigger && groupDropdown) {
        groupTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = groupDropdown.classList.contains('show');
            if (isOpen) {
                groupDropdown.classList.remove('show');
                groupTrigger.classList.remove('active');
            } else {
                groupDropdown.classList.add('show');
                groupTrigger.classList.add('active');
                if (groupSearch) groupSearch.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!groupDropdown.contains(e.target) && !groupTrigger.contains(e.target)) {
                groupDropdown.classList.remove('show');
                groupTrigger.classList.remove('active');
            }
        });

        groupDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        if (groupSearch) {
            groupSearch.addEventListener('input', () => {
                const q = groupSearch.value.trim().toLowerCase();
                document.querySelectorAll('#group-domestic-options .multiselect-option-item').forEach(item => {
                    const text = item.textContent.trim().toLowerCase();
                    item.style.display = text.includes(q) ? 'flex' : 'none';
                });
            });
        }

        if (btnSelectAllGroups) {
            btnSelectAllGroups.addEventListener('click', () => {
                document.querySelectorAll('#group-domestic-options input[type="checkbox"]').forEach(cb => { cb.checked = true; });
                updateGroupLabelText();
                renderDomesticTable();
            });
        }

        if (btnClearAllGroups) {
            btnClearAllGroups.addEventListener('click', () => {
                document.querySelectorAll('#group-domestic-options input[type="checkbox"]').forEach(cb => { cb.checked = false; });
                updateGroupLabelText();
                renderDomesticTable();
            });
        }

        document.querySelectorAll('#group-domestic-options input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                updateGroupLabelText();
                renderDomesticTable();
            });
        });

        updateGroupLabelText();
    }

    // ----------------------------------------------------
    // Custom Multi-Select Component Event Binding for Parent Account
    // ----------------------------------------------------
    const parentAccTrigger = document.getElementById('parent-acc-domestic-trigger');
    const parentAccDropdown = document.getElementById('parent-acc-domestic-dropdown');
    const parentAccLabel = document.getElementById('parent-acc-domestic-label');
    const parentAccSearch = document.getElementById('parent-acc-domestic-search');
    const btnSelectAllParentAcc = document.getElementById('btn-select-all-parent-acc');
    const btnClearAllParentAcc = document.getElementById('btn-clear-all-parent-acc');

    const updateParentAccLabelText = () => {
        const parentAccCbs = document.querySelectorAll('#parent-acc-domestic-options input[type="checkbox"]');
        if (!parentAccCbs.length || !parentAccLabel) return;

        const checkedList = Array.from(parentAccCbs).filter(cb => cb.checked);
        const totalCount = parentAccCbs.length;

        if (checkedList.length === 0) {
            parentAccLabel.textContent = '未選取總歸戶';
            parentAccLabel.style.color = '#94A3B8';
        } else if (checkedList.length === totalCount) {
            parentAccLabel.textContent = `全選 (${totalCount}個總歸戶)`;
            parentAccLabel.style.color = 'var(--text-main)';
        } else if (checkedList.length <= 2) {
            const names = checkedList.map(cb => cb.parentElement.textContent.trim()).join(', ');
            parentAccLabel.textContent = names;
            parentAccLabel.style.color = 'var(--text-main)';
        } else {
            const firstTwo = checkedList.slice(0, 2).map(cb => cb.parentElement.textContent.trim()).join(', ');
            parentAccLabel.textContent = `${firstTwo} (+${checkedList.length - 2}個)`;
            parentAccLabel.style.color = 'var(--text-main)';
        }
    };

    if (parentAccTrigger && parentAccDropdown) {
        parentAccTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = parentAccDropdown.classList.contains('show');
            if (isOpen) {
                parentAccDropdown.classList.remove('show');
                parentAccTrigger.classList.remove('active');
            } else {
                document.querySelectorAll('.multiselect-dropdown').forEach(d => d.classList.remove('show'));
                document.querySelectorAll('.multiselect-trigger').forEach(t => t.classList.remove('active'));

                parentAccDropdown.classList.add('show');
                parentAccTrigger.classList.add('active');
                if (parentAccSearch) parentAccSearch.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!parentAccDropdown.contains(e.target) && !parentAccTrigger.contains(e.target)) {
                parentAccDropdown.classList.remove('show');
                parentAccTrigger.classList.remove('active');
            }
        });

        parentAccDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        if (parentAccSearch) {
            parentAccSearch.addEventListener('input', () => {
                const q = parentAccSearch.value.trim().toLowerCase();
                document.querySelectorAll('#parent-acc-domestic-options .multiselect-option-item').forEach(item => {
                    const text = item.textContent.trim().toLowerCase();
                    item.style.display = text.includes(q) ? 'flex' : 'none';
                });
            });
        }

        if (btnSelectAllParentAcc) {
            btnSelectAllParentAcc.addEventListener('click', () => {
                document.querySelectorAll('#parent-acc-domestic-options input[type="checkbox"]').forEach(cb => { cb.checked = true; });
                updateParentAccLabelText();
                renderDomesticTable();
            });
        }

        if (btnClearAllParentAcc) {
            btnClearAllParentAcc.addEventListener('click', () => {
                document.querySelectorAll('#parent-acc-domestic-options input[type="checkbox"]').forEach(cb => { cb.checked = false; });
                updateParentAccLabelText();
                renderDomesticTable();
            });
        }

        document.querySelectorAll('#parent-acc-domestic-options input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                updateParentAccLabelText();
                renderDomesticTable();
            });
        });

        updateParentAccLabelText();
    }

    const closeRowChildrenDomestic = (parentId) => {
        allNodesDomestic.forEach(n => {
            if (n.parent === parentId) {
                expandedRowsDomestic[n.id] = false;
                closeRowChildrenDomestic(n.id);
            }
        });
    };

    const applyStickyWidthsDomestic = () => {
        let currentLeft = 0;
        for (let i = 0; i < 8; i++) {
            const colIndex = i + 1;
            const width = stickyWidthsDomestic[i];
            const cells = document.querySelectorAll(`#onion-table-domestic .col-sticky-${colIndex}, [id^="panel-parent-detail"] .col-sticky-${colIndex}, #modal-parent-detail .col-sticky-${colIndex}`);
            cells.forEach(cell => {
                cell.style.setProperty('width', `${width}px`, 'important');
                cell.style.setProperty('min-width', `${width}px`, 'important');
                cell.style.setProperty('max-width', `${width}px`, 'important');
                cell.style.setProperty('left', `${currentLeft}px`, 'important');
            });
            currentLeft += width;
        }
    };

    const initResizableColumnsDomestic = () => {
        const containers = document.querySelectorAll('#onion-table-domestic, [id^="panel-parent-detail"] .onion-table, #modal-parent-detail .onion-table');
        containers.forEach(container => {
            if (!container) return;

            for (let i = 1; i <= 8; i++) {
                const th = container.querySelector(`thead th.col-sticky-${i}`);
                if (th && !th.querySelector('.resizer')) {
                    const resizer = document.createElement('div');
                    resizer.className = 'resizer';
                    th.appendChild(resizer);
                    
                    resizer.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        const startX = e.pageX;
                        const startWidth = stickyWidthsDomestic[i - 1];
                        
                        const onMouseMove = (moveEvent) => {
                            const delta = moveEvent.pageX - startX;
                            stickyWidthsDomestic[i - 1] = Math.max(50, startWidth + delta);
                            applyStickyWidthsDomestic();
                        };
                        
                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };
                        
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    });
                }
            }
        });
        applyStickyWidthsDomestic();
    };

    const attachDomesticTableListeners = () => {
        document.querySelectorAll('.row-expand-btn-domestic').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rowId = btn.getAttribute('data-row');
                const isExpanding = btn.textContent.trim() === '+';
                if (isExpanding) {
                    expandedRowsDomestic[rowId] = true;
                } else {
                    expandedRowsDomestic[rowId] = false;
                    closeRowChildrenDomestic(rowId);
                }
                renderDomesticTable();
            });
        });

        document.querySelectorAll('.col-expand-btn-domestic').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const colKey = btn.getAttribute('data-col');
                if (colKey === '2025') {
                    expandedColsDomestic['2025'] = !expandedColsDomestic['2025'];
                } else if (colKey === '2026') {
                    expandedColsDomestic['2026-08'] = !expandedColsDomestic['2026-08'];
                } else if (colKey === '2026-08') {
                    expandedColsDomestic['2026-08'] = !expandedColsDomestic['2026-08'];
                }
                renderDomesticTable();
                renderAllParentAccountTabs();
            });
        });

        document.querySelectorAll('.sortable-header-domestic').forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.getAttribute('data-sort');
                if (sortColDomestic === sortBy) {
                    sortAscDomestic = !sortAscDomestic;
                } else {
                    sortColDomestic = sortBy;
                    sortAscDomestic = false;
                }
                renderDomesticTable();
            });
        });

        document.querySelectorAll('.btn-open-parent-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const parentId = btn.getAttribute('data-parent-id');
                const parentName = btn.getAttribute('data-parent-name');
                openParentAccountTab(parentId, parentName);
            });
        });

        initResizableColumnsDomestic();
    };

    const renderParentAccountTabContent = (parentId, parentName) => {
        const panel = document.getElementById(`panel-parent-detail-${parentId}`);
        if (!panel) return;

        const parentNode = allNodesDomestic.find(n => n.id === parentId);
        const leafNodes = allNodesDomestic.filter(n => n.parent === parentId && n.level === 4);

        const aff = parentNode ? parentNode.labels[0] || '關係企業' : '關係企業';
        const inst = parentNode ? parentNode.labels[1] || '機構法人' : '機構法人';
        const grp = parentNode ? parentNode.labels[2] || '投信' : '投信';

        let span2025 = expandedColsDomestic['2025'] ? 12 : 1;
        let span2026 = 13 + (expandedColsDomestic['2026-08'] ? 5 : 0);

        let headerRow1 = `
            <tr>
                <th rowspan="2" class="col-sticky-1">關係企業<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Affiliate</span></th>
                <th rowspan="2" class="col-sticky-2">機構法人<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Inst Entity</span></th>
                <th rowspan="2" class="col-sticky-3">客群類別<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Group Category</span></th>
                <th rowspan="2" class="col-sticky-4">總歸戶<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Parent Account</span></th>
                <th rowspan="2" class="col-sticky-5">客戶全銜<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Client Name</span></th>
                <th rowspan="2" class="col-sticky-6">帳號<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Account No</span></th>
                <th rowspan="2" class="col-sticky-7">ID<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">ID</span></th>
                <th rowspan="2" class="col-sticky-8">營業員<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Sales Rep</span></th>
                <th colspan="${span2025}" class="col-group-header">2025 <button class="col-expand-btn-domestic expand-btn" data-col="2025">${expandedColsDomestic['2025'] ? '-' : '+'}</button></th>
                <th colspan="${span2026}" class="col-group-header">2026 <button class="col-expand-btn-domestic expand-btn" data-col="2026">${expandedColsDomestic['2026'] ? '-' : '+'}</button></th>
                <th rowspan="2" class="sortable-header-domestic" data-sort="today" style="background:#EBF5FB; color:#1B4F72;">當日交易量 ↕</th>
            </tr>
        `;

        let headerRow2 = '<tr>';
        if (expandedColsDomestic['2025']) {
            for (let m = 1; m <= 12; m++) {
                headerRow2 += `<th class="sortable-header-domestic" data-sort="2025_${m-1}" style="font-size:11px;">${m}月 ↕</th>`;
            }
        } else {
            headerRow2 += `<th class="sortable-header-domestic" data-sort="2025_total" style="font-size:11px; font-weight:600;">YTD ↕</th>`;
        }

        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_01" style="font-size:11px;">1月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_02" style="font-size:11px;">2月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_03" style="font-size:11px;">3月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_04" style="font-size:11px;">4月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_05" style="font-size:11px;">5月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_06" style="font-size:11px;">6月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="2026_07" style="font-size:11px;">7月 ↕ +</th>`;

        if (expandedColsDomestic['2026-08']) {
            headerRow2 += `<th class="col-group-header" style="font-size:11px; background:#1A5276;">8月 <button class="col-expand-btn-domestic expand-btn" data-col="2026-08">-</button></th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第1週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第2週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第3週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第4週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第5週</th>`;
        } else {
            headerRow2 += `<th class="col-group-header" style="font-size:11px;">8月 <button class="col-expand-btn-domestic expand-btn" data-col="2026-08">+</button></th>`;
        }

        headerRow2 += `<th class="sortable-header-domestic" data-sort="mtd" style="font-size:11px; background:#D0E8FF; color:#1E4670;">MTD ↕</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="ann" style="font-size:11px;">月化 ↕</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="mom" style="font-size:11px;">MoM ↕</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="ytd" style="font-size:11px; font-weight:600;">YTD ↕</th>`;
        headerRow2 += `<th class="sortable-header-domestic" data-sort="yoy" style="font-size:11px;">YoY ↕</th>`;
        headerRow2 += '</tr>';

        let tbodyRows = '';
        leafNodes.forEach(node => {
            const metrics = getRowCalculatedMetricsDomestic(node);
            let labelsHTML = '';
            for (let l = 0; l < 8; l++) {
                let cellVal = node.labels[l] || '';
                let colClass = `col-sticky-${l + 1}`;
                labelsHTML += `<td class="${colClass} text-left">${cellVal}</td>`;
            }

            let valCells = '';
            if (expandedColsDomestic['2025']) {
                metrics.values['2025_months'].forEach(mVal => { valCells += `<td>${Math.round(mVal).toLocaleString()}</td>`; });
            } else {
                valCells += `<td style="font-weight:600;">${Math.round(metrics.values['2025_total']).toLocaleString()}</td>`;
            }

            for (let m = 1; m <= 7; m++) {
                const key = m < 10 ? `0${m}` : `${m}`;
                valCells += `<td>${Math.round(metrics.values[`2026_${key}`]).toLocaleString()}</td>`;
            }

            if (expandedColsDomestic['2026-08']) {
                valCells += `<td>${Math.round(metrics.values['2026_08_W1']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W2']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W3']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W4']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W5']).toLocaleString()}</td>`;
            }

            valCells += `<td style="font-weight:700; background:#F2F8FD;">${Math.round(metrics.marMTD).toLocaleString()}</td>`;
            valCells += `<td style="font-weight:600; color:var(--color-personal);">${Math.round(metrics.annualized).toLocaleString()}</td>`;
            valCells += `<td style="color:${metrics.mom >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.mom.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight:600;">${Math.round(metrics.ytd).toLocaleString()}</td>`;
            valCells += `<td style="color:${metrics.yoy >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.yoy.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight:700; background:#EBF5FB;">${Math.round(metrics.today).toLocaleString()}</td>`;

            tbodyRows += `<tr>${labelsHTML}${valCells}</tr>`;
        });

        panel.innerHTML = `
            <div class="report-filter-panel" style="padding:16px 20px; background:#F8FAFC; border-radius:8px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="margin:0 0 4px 0; font-size:16px; color:var(--fubon-dark);">內法基礎報表 ＞ 總歸戶客戶明細分頁：${parentName}</h3>
                    <span style="font-size:13px; color:#64748B;">所屬關係企業：${aff} ｜ 機構法人：${inst} ｜ 客群類別：${grp} ｜ 包含明細戶數：${leafNodes.length} 戶</span>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-secondary btn-back-main" style="padding:6px 16px; font-size:13px;">← 返回內法主表 Back</button>
                    <button class="btn-export" style="padding:6px 16px; font-size:13px;">↑ 匯出本專頁 Export</button>
                </div>
            </div>
            <div class="table-wrapper" style="overflow-x:auto;">
                <table class="onion-table">
                    <thead>${headerRow1}${headerRow2}</thead>
                    <tbody>${tbodyRows}</tbody>
                </table>
            </div>
        `;

        applyStickyWidthsDomestic();
        initResizableColumnsDomestic();

        const backBtn = panel.querySelector('.btn-back-main');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const mainDomTab = document.querySelector('[data-target="panel-domestic-basic"]');
                if (mainDomTab) mainDomTab.click();
            });
        }

        panel.querySelectorAll('.col-expand-btn-domestic').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const colKey = btn.getAttribute('data-col');
                if (colKey === '2025') {
                    expandedColsDomestic['2025'] = !expandedColsDomestic['2025'];
                } else if (colKey === '2026' || colKey === '2026-08') {
                    expandedColsDomestic['2026-08'] = !expandedColsDomestic['2026-08'];
                }
                renderDomesticTable();
                renderAllParentAccountTabs();
            });
        });
    };

    const renderAllParentAccountTabs = () => {
        document.querySelectorAll('.dynamic-tab').forEach(tab => {
            const parentId = tab.id.replace('tab-btn-detail-', '');
            const parentNode = allNodesDomestic.find(n => n.id === parentId);
            const parentName = parentNode ? parentNode.name || parentNode.labels[3] : '';
            if (parentId && parentName) {
                renderParentAccountTabContent(parentId, parentName);
            }
        });
    };

    const openParentAccountTab = (parentId, parentName) => {
        const tabsContainer = document.querySelector('.report-tabs');
        if (!tabsContainer) return;

        const existingTab = document.getElementById(`tab-btn-detail-${parentId}`);
        if (existingTab) {
            existingTab.click();
            return;
        }

        const parentNode = allNodesDomestic.find(n => n.id === parentId);
        const leafNodes = allNodesDomestic.filter(n => n.parent === parentId && n.level === 4);

        // 1. Create Tab Button
        const newTabBtn = document.createElement('button');
        newTabBtn.className = 'report-tab-btn dynamic-tab active';
        newTabBtn.id = `tab-btn-detail-${parentId}`;
        newTabBtn.setAttribute('data-target', `panel-parent-detail-${parentId}`);
        newTabBtn.setAttribute('data-badge', '總歸戶明細分頁');
        newTabBtn.style.cssText = 'line-height: 1.2; padding: 10px 16px; display:inline-flex; align-items:center; gap:6px;';
        newTabBtn.innerHTML = `
            <span>${parentName} 明細<br><span style="font-size: 11px; font-weight: normal; color: #666;">${leafNodes.length}戶合約</span></span>
            <span class="close-tab-btn" data-parent-id="${parentId}" style="font-size:16px; margin-left:4px; font-weight:bold; cursor:pointer;">&times;</span>
        `;

        // 2. Create Panel
        const newPanel = document.createElement('div');
        newPanel.className = 'report-content-panel dynamic-panel active';
        newPanel.id = `panel-parent-detail-${parentId}`;

        // Deactivate current tabs & panels
        document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.report-content-panel').forEach(p => p.classList.remove('active'));

        tabsContainer.appendChild(newTabBtn);
        const parentContainer = document.querySelector('.reports-container');
        parentContainer.appendChild(newPanel);

        // Render content
        renderParentAccountTabContent(parentId, parentName);

        // Update Page Header
        const pageTitle = document.getElementById('report-page-title');
        const pageBadge = document.getElementById('report-page-badge');
        if (pageTitle) pageTitle.innerHTML = `報表專區 - ${parentName} (總歸戶明細分頁)<br><span style="font-size:14px; font-weight:normal; color:#666;">Domestic Basic Report - ${parentName} Detail Sub-Tab</span>`;
        if (pageBadge) pageBadge.textContent = '總歸戶明細分頁';

        // Bind events for the new tab button & close button
        newTabBtn.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-tab-btn')) return;
            document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.report-content-panel').forEach(p => p.classList.remove('active'));
            newTabBtn.classList.add('active');
            newPanel.classList.add('active');
            if (pageTitle) pageTitle.innerHTML = `報表專區 - ${parentName} (總歸戶明細分頁)<br><span style="font-size:14px; font-weight:normal; color:#666;">Domestic Basic Report - ${parentName} Detail Sub-Tab</span>`;
            if (pageBadge) pageBadge.textContent = '總歸戶明細分頁';
        });

        const closeBtn = newTabBtn.querySelector('.close-tab-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                newTabBtn.remove();
                newPanel.remove();
                const mainDomTab = document.querySelector('[data-target="panel-domestic-basic"]');
                if (mainDomTab) mainDomTab.click();
            });
        }
    };

    const openParentAccountDetailModal = (parentId, parentName) => {
        const modal = document.getElementById('modal-parent-detail');
        const modalTitle = document.getElementById('modal-parent-title');
        const modalSubtitle = document.getElementById('modal-parent-subtitle');
        const modalCount = document.getElementById('modal-detail-count');
        const detailContainer = document.getElementById('onion-table-domestic-detail');
        if (!modal || !detailContainer) return;

        const parentNode = allNodesDomestic.find(n => n.id === parentId);
        const leafNodes = allNodesDomestic.filter(n => n.parent === parentId && n.level === 4);

        if (modalTitle) modalTitle.textContent = `總歸戶客戶明細 - ${parentName}`;
        if (modalSubtitle) {
            const aff = parentNode ? parentNode.labels[0] || '關係企業' : '關係企業';
            const inst = parentNode ? parentNode.labels[1] || '機構法人' : '機構法人';
            const grp = parentNode ? parentNode.labels[2] || '投信' : '投信';
            modalSubtitle.textContent = `所屬關係企業：${aff} ｜ 機構法人：${inst} ｜ 客群類別：${grp} ｜ 總歸戶：${parentName}`;
        }
        if (modalCount) modalCount.textContent = `包含明細戶數：${leafNodes.length} 戶`;

        let span2025 = expandedColsDomestic['2025'] ? 12 : 1;
        let span2026 = 13 + (expandedColsDomestic['2026-08'] ? 5 : 0);

        let headerRow1 = `
            <tr>
                <th rowspan="2" class="col-sticky-1">關係企業<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Affiliate</span></th>
                <th rowspan="2" class="col-sticky-2">機構法人<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Inst Entity</span></th>
                <th rowspan="2" class="col-sticky-3">客群類別<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Group Category</span></th>
                <th rowspan="2" class="col-sticky-4">總歸戶<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Parent Account</span></th>
                <th rowspan="2" class="col-sticky-5">客戶全銜<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Client Name</span></th>
                <th rowspan="2" class="col-sticky-6">帳號<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Account No</span></th>
                <th rowspan="2" class="col-sticky-7">ID<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">ID</span></th>
                <th rowspan="2" class="col-sticky-8">營業員<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Sales Rep</span></th>
                <th colspan="${span2025}" class="col-group-header">2025</th>
                <th colspan="${span2026}" class="col-group-header">2026</th>
                <th rowspan="2" style="background:#EBF5FB; color:#1B4F72;">當日交易量</th>
            </tr>
        `;

        let headerRow2 = '<tr>';
        if (expandedColsDomestic['2025']) {
            for (let m = 1; m <= 12; m++) headerRow2 += `<th style="font-size:11px;">${m}月</th>`;
        } else {
            headerRow2 += `<th style="font-size:11px; font-weight:600;">YTD</th>`;
        }

        for (let m = 1; m <= 7; m++) headerRow2 += `<th style="font-size:11px;">${m}月</th>`;
        if (expandedColsDomestic['2026-08']) {
            headerRow2 += `<th class="col-group-header" style="font-size:11px; background:#1A5276;">8月</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第1週</th><th style="font-size:11px; color:#888;">第2週</th><th style="font-size:11px; color:#888;">第3週</th><th style="font-size:11px; color:#888;">第4週</th><th style="font-size:11px; color:#888;">第5週</th>`;
        } else {
            headerRow2 += `<th class="col-group-header" style="font-size:11px;">8月</th>`;
        }

        headerRow2 += `<th style="font-size:11px; background:#D0E8FF; color:#1E4670;">MTD</th><th style="font-size:11px;">月化</th><th style="font-size:11px;">MoM</th><th style="font-size:11px; font-weight:600;">YTD</th><th style="font-size:11px;">YoY</th></tr>`;

        let tbodyRows = '';
        leafNodes.forEach(node => {
            const metrics = getRowCalculatedMetricsDomestic(node);
            let labelsHTML = '';
            for (let l = 0; l < 8; l++) {
                let cellVal = node.labels[l] || '';
                let colClass = `col-sticky-${l + 1}`;
                labelsHTML += `<td class="${colClass} text-left">${cellVal}</td>`;
            }

            let valCells = '';
            if (expandedColsDomestic['2025']) {
                metrics.values['2025_months'].forEach(mVal => { valCells += `<td>${Math.round(mVal).toLocaleString()}</td>`; });
            } else {
                valCells += `<td style="font-weight:600;">${Math.round(metrics.values['2025_total']).toLocaleString()}</td>`;
            }

            for (let m = 1; m <= 7; m++) {
                const key = m < 10 ? `0${m}` : `${m}`;
                valCells += `<td>${Math.round(metrics.values[`2026_${key}`]).toLocaleString()}</td>`;
            }

            if (expandedColsDomestic['2026-08']) {
                valCells += `<td>${Math.round(metrics.values['2026_08_W1']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W2']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W3']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W4']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W5']).toLocaleString()}</td>`;
            }

            valCells += `<td style="font-weight:700; background:#F2F8FD;">${Math.round(metrics.marMTD).toLocaleString()}</td>`;
            valCells += `<td style="font-weight:600; color:var(--color-personal);">${Math.round(metrics.annualized).toLocaleString()}</td>`;
            valCells += `<td style="color:${metrics.mom >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.mom.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight:600;">${Math.round(metrics.ytd).toLocaleString()}</td>`;
            valCells += `<td style="color:${metrics.yoy >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.yoy.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight:700; background:#EBF5FB;">${Math.round(metrics.today).toLocaleString()}</td>`;

            tbodyRows += `<tr>${labelsHTML}${valCells}</tr>`;
        });

        detailContainer.innerHTML = `<thead>${headerRow1}${headerRow2}</thead><tbody>${tbodyRows}</tbody>`;
        modal.classList.add('active');
    };

    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCloseModalFooter = document.getElementById('btn-close-modal-footer');
    const modalParentOverlay = document.getElementById('modal-parent-detail');

    [btnCloseModal, btnCloseModalFooter].forEach(btn => {
        if (btn) btn.addEventListener('click', () => {
            if (modalParentOverlay) modalParentOverlay.classList.remove('active');
        });
    });
    if (modalParentOverlay) {
        modalParentOverlay.addEventListener('click', (e) => {
            if (e.target === modalParentOverlay) modalParentOverlay.classList.remove('active');
        });
    }

    const btnQueryDomestic = document.getElementById('btn-query-domestic');
    const btnResetDomestic = document.getElementById('btn-reset-domestic');
    const kpiSelectDomestic = document.getElementById('filter-kpi-domestic');
    const prodSelectDomestic = document.getElementById('filter-product-domestic');
    const instSelectDomestic = document.getElementById('filter-inst-domestic');
    const sDateDom = document.getElementById('filter-start-date-domestic');
    const eDateDom = document.getElementById('filter-end-date-domestic');
    const accDom = document.getElementById('filter-account-id-domestic');
    const salesDom = document.getElementById('filter-sales-domestic');

    [kpiSelectDomestic, prodSelectDomestic, instSelectDomestic, sDateDom, eDateDom, accDom, salesDom].forEach(sel => {
        if (sel) {
            sel.addEventListener('change', () => {
                if (eDateDom && eDateDom.value) {
                    const latestLabel = document.getElementById('report-latest-date-domestic');
                    if (latestLabel) latestLabel.textContent = `交易資料最新日期：${eDateDom.value.replace(/-/g, '/')}`;
                }
                renderDomesticTable();
            });
            if (sel.tagName === 'INPUT' && sel.type === 'text') {
                sel.addEventListener('input', () => renderDomesticTable());
            }
        }
    });

    if (btnQueryDomestic) {
        btnQueryDomestic.addEventListener('click', () => {
            renderDomesticTable();
        });
    }

    if (btnResetDomestic) {
        btnResetDomestic.addEventListener('click', () => {
            const kpiSelect = document.getElementById('filter-kpi-domestic');
            if (kpiSelect) kpiSelect.value = 'volume';
            const prodSelect = document.getElementById('filter-product-domestic');
            if (prodSelect) prodSelect.value = 'tw_stock';
            const startDateInput = document.getElementById('filter-start-date-domestic');
            if (startDateInput) startDateInput.value = '2025-01-01';
            const endDateInput = document.getElementById('filter-end-date-domestic');
            if (endDateInput) endDateInput.value = '2026-08-18';
            const instSelect = document.getElementById('filter-inst-domestic');
            if (instSelect) instSelect.value = 'all';
            
            // Reset Group category checkboxes
            document.querySelectorAll('#group-domestic-options input[type="checkbox"]').forEach(cb => { cb.checked = true; });
            if (typeof updateGroupLabelText === 'function') updateGroupLabelText();
            const groupSearchInput = document.getElementById('group-domestic-search');
            if (groupSearchInput) {
                groupSearchInput.value = '';
                document.querySelectorAll('#group-domestic-options .multiselect-option-item').forEach(item => {
                    item.style.display = 'flex';
                });
            }

            // Reset Parent Account checkboxes
            document.querySelectorAll('#parent-acc-domestic-options input[type="checkbox"]').forEach(cb => { cb.checked = true; });
            if (typeof updateParentAccLabelText === 'function') updateParentAccLabelText();
            const parentAccSearchInput = document.getElementById('parent-acc-domestic-search');
            if (parentAccSearchInput) {
                parentAccSearchInput.value = '';
                document.querySelectorAll('#parent-acc-domestic-options .multiselect-option-item').forEach(item => {
                    item.style.display = 'flex';
                });
            }
            const accIdInput = document.getElementById('filter-account-id-domestic');
            if (accIdInput) accIdInput.value = '';
            const salesInput = document.getElementById('filter-sales-domestic');
            if (salesInput) salesInput.value = '';
            const limitSelect = document.getElementById('select-row-limit-domestic');
            if (limitSelect) limitSelect.value = 'all';

            renderDomesticTable();
        });
    }

    // Initial render for domestic basic table
    renderDomesticTable();

    // =========================================================================
    // 外法基礎報表 (Foreign Basic Report) - 11 欄固定維度與洋蔥式呈現在 2026/08
    // =========================================================================

    const rawLeafDataForeign = [
        // 關係企業 -> 一般 -> 外資 -> Co-Cover -> FMR (HK67H) -> 專戶明細
        { id: 'fmr-leaf-xxx', parent: 'firm-fmr-cocover', level: 5, grp: 'fini', labels: ['', '機構法人', '外資', 'Co-Cover', 'FMR', 'HK67H', '海外XXX專戶', 'F00123', '01', 'A998877665', 'Charlie Zhao'], values: { '2025': [300, 320, 290, 310, 340, 360, 320, 340, 350, 380, 370, 400], '2026': { '01': [420], '02': [440], '03': [430], '04': [450], '05': [460], '06': [480], '07': [500], '08': { W1: 120, W2: 125, W3: 115, W4: 110, W5: 30 } } } },
        { id: 'fmr-leaf-zzz', parent: 'firm-fmr-cocover', level: 5, grp: 'fini', labels: ['', '機構法人', '外資', 'Co-Cover', 'FMR', 'HK67H', '海外ZZZ專戶', 'F00124', '02', 'A998877666', 'Charlie Zhao'], values: { '2025': [200, 210, 195, 205, 220, 230, 210, 225, 230, 250, 240, 270], '2026': { '01': [280], '02': [290], '03': [300], '04': [310], '05': [320], '06': [335], '07': [350], '08': { W1: 85, W2: 90, W3: 82, W4: 78, W5: 15 } } } },
        
        // 關係企業 -> 一般 -> 外資 -> Co-Cover -> JP Morgan -> 明細
        { id: 'jpm-leaf-spec', parent: 'firm-jpm-cocover', level: 5, grp: 'fini', labels: ['', '機構法人', '外資', 'Co-Cover', 'JP Morgan', 'US88J', 'JPM Asia Opportunities Portfolio', 'F00789', '01', 'B112233445', 'Ann Liao'], values: { '2025': [250, 270, 240, 260, 280, 300, 270, 290, 300, 320, 310, 340], '2026': { '01': [360], '02': [380], '03': [370], '04': [390], '05': [400], '06': [415], '07': [430], '08': { W1: 100, W2: 105, W3: 98, W4: 92, W5: 35 } } } },
        
        // 一般 -> 外資 -> Fubon外資投行 -> Morgan Stanley -> 明細
        { id: 'ms-leaf-spec', parent: 'firm-ms-fubonib', level: 5, grp: 'fini', labels: ['', '機構法人', '外資', 'Fubon外資投行', 'Morgan Stanley', 'US99M', 'MS Institutional Equity Account', 'F00999', '01', 'C554433221', 'David Lin'], values: { '2025': [180, 195, 175, 190, 210, 225, 200, 210, 220, 240, 230, 260], '2026': { '01': [270], '02': [280], '03': [275], '04': [290], '05': [295], '06': [310], '07': [325], '08': { W1: 75, W2: 80, W3: 72, W4: 68, W5: 20 } } } }
    ];

    const structuralNodesForeign = [
        // Level 4: 總歸戶
        { id: 'firm-fmr-cocover', parent: 'fcat-cocover', level: 4, grp: 'fini', labels: ['', '', '', '', 'FMR', 'HK67H', '', '', '', '', ''], name: 'FMR' },
        { id: 'firm-jpm-cocover', parent: 'fcat-cocover', level: 4, grp: 'fini', labels: ['', '', '', '', 'JP Morgan', 'US88J', '', '', '', '', ''], name: 'JP Morgan' },
        { id: 'firm-ms-fubonib', parent: 'fcat-fubonib', level: 4, grp: 'fini', labels: ['', '', '', '', 'Morgan Stanley', 'US99M', '', '', '', '', ''], name: 'Morgan Stanley' },

        // Level 3: 外資客群 (在外資下)
        { id: 'fcat-cocover', parent: 'grp-fini-gen', level: 3, grp: 'fini', labels: ['', '', '', 'Co-Cover', '', '', '', '', '', '', ''], name: 'Co-Cover' },
        { id: 'fcat-fubon-gen', parent: 'grp-fini-gen', level: 3, grp: 'fini', labels: ['', '', '', 'Fubon一般', '', '', '', '', '', '', ''], name: 'Fubon一般' },
        { id: 'fcat-fubonib', parent: 'grp-fini-gen', level: 3, grp: 'fini', labels: ['', '', '', 'Fubon外資投行', '', '', '', '', '', '', ''], name: 'Fubon外資投行' },
        { id: 'fcat-fubonhft', parent: 'grp-fini-gen', level: 3, grp: 'fini', labels: ['', '', '', 'Fubon高頻', '', '', '', '', '', '', ''], name: 'Fubon高頻' },
        { id: 'fcat-referral', parent: 'grp-fini-gen', level: 3, grp: 'fini', labels: ['', '', '', 'Referral Broker', '', '', '', '', '', '', ''], name: 'Referral Broker' },
        { id: 'fcat-other', parent: 'grp-fini-gen', level: 3, grp: 'fini', labels: ['', '', '', '其他', '', '', '', '', '', '', ''], name: '其他' },

        // Level 2: 客群類別 (一般下)
        { id: 'grp-site-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'site', labels: ['', '機構法人', '投信', '', '', '', '', '', '', '', ''], name: '投信' },
        { id: 'grp-pc-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'pc_life', labels: ['', '機構法人', '產壽險', '', '', '', '', '', '', '', ''], name: '產壽險' },
        { id: 'grp-98-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'acc_98', labels: ['', '一般', '98戶', '', '', '', '', '', '', '', ''], name: '98戶' },
        { id: 'grp-corp-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'gen_corp', labels: ['', '一般', '一般法人', '', '', '', '', '', '', '', ''], name: '一般法人' },
        { id: 'grp-list-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'listed', labels: ['', '一般', '上市櫃', '', '', '', '', '', '', '', ''], name: '上市櫃' },
        { id: 'grp-ret-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'retail', labels: ['', '一般', '自然人', '', '', '', '', '', '', '', ''], name: '自然人' },
        { id: 'grp-inv-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'inv_co', labels: ['', '一般', '投資公司', '', '', '', '', '', '', '', ''], name: '投資公司' },
        { id: 'grp-sice-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'sice', labels: ['', '一般', '投顧代操', '', '', '', '', '', '', '', ''], name: '投顧代操' },
        { id: 'grp-cbank-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'corp_bank', labels: ['', '一般', '法金客群', '', '', '', '', '', '', '', ''], name: '法金客群' },
        { id: 'grp-gov-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'gov_fund', labels: ['', '機構法人', '政府基金', '', '', '', '', '', '', '', ''], name: '政府基金' },
        { id: 'grp-hnw-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'hnw', labels: ['', '一般', '高端客戶', '', '', '', '', '', '', '', ''], name: '高端客戶' },
        { id: 'grp-bill-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'bills', labels: ['', '機構法人', '票券', '', '', '', '', '', '', '', ''], name: '票券' },
        { id: 'grp-fut-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'futures', labels: ['', '機構法人', '期貨', '', '', '', '', '', '', '', ''], name: '期貨' },
        { id: 'grp-bank-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'bank', labels: ['', '機構法人', '銀行', '', '', '', '', '', '', '', ''], name: '銀行' },
        { id: 'grp-sec-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'sec', labels: ['', '機構法人', '證券', '', '', '', '', '', '', '', ''], name: '證券' },
        { id: 'grp-fini-gen', parent: 'aff-foreign-gen', level: 2, grp: 'fini', labels: ['', '機構法人', '外資', '', '', '', '', '', '', '', ''], name: '外資' },
        { id: 'grp-oth-foreign', parent: 'aff-foreign-gen', level: 2, grp: 'other', labels: ['', '', '其他', '', '', '', '', '', '', '', ''], name: '其他' },

        // Level 1: 關係企業 / 一般 / 其他
        { id: 'aff-foreign-rel', parent: 'org-foreign-total', level: 1, labels: ['關係企業', '', '', '', '', '', '', '', '', '', ''], name: '關係企業' },
        { id: 'aff-foreign-gen', parent: 'org-foreign-total', level: 1, labels: ['一般', '', '', '', '', '', '', '', '', '', ''], name: '一般' },
        { id: 'aff-foreign-oth', parent: 'org-foreign-total', level: 1, labels: ['其他', '', '', '', '', '', '', '', '', '', ''], name: '其他' },

        // Level 0: 總計
        { id: 'org-foreign-total', parent: null, level: 0, labels: ['總計', '', '', '', '', '', '', '', '', '', ''], name: '總計' }
    ];

    let allNodesForeign = [...rawLeafDataForeign, ...structuralNodesForeign];
    let expandedColsForeign = { '2025': false, '2026': false, '2026-08': true };
    let expandedRowsForeign = {
        'org-foreign-total': true,
        'aff-foreign-rel': false,
        'aff-foreign-gen': true,
        'grp-fini-gen': true,
        'fcat-cocover': true,
        'firm-fmr-cocover': true
    };

    let sortColForeign = null;
    let sortAscForeign = true;
    let stickyWidthsForeign = [85, 80, 90, 110, 110, 100, 140, 80, 50, 100, 85];

    const createEmptyValuesForeign = () => ({
        '2025': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        '2026': { 
            '01': [0], '02': [0], '03': [0], '04': [0], 
            '05': [0], '06': [0], '07': [0], 
            '08': { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 } 
        }
    });

    const aggregateValuesForeign = () => {
        structuralNodesForeign.forEach(node => { node.values = createEmptyValuesForeign(); });
        for (let lvl = 5; lvl >= 1; lvl--) {
            allNodesForeign.forEach(node => {
                if (node.level === lvl) {
                    const parentNode = allNodesForeign.find(p => p.id === node.parent);
                    if (parentNode) {
                        for (let m = 0; m < 12; m++) {
                            parentNode.values['2025'][m] += node.values['2025'][m] || 0;
                        }
                        for (let m = 1; m <= 7; m++) {
                            const key = m < 10 ? `0${m}` : `${m}`;
                            if (parentNode.values['2026'][key] && node.values['2026'][key]) {
                                parentNode.values['2026'][key][0] += node.values['2026'][key][0] || 0;
                            }
                        }
                        
                        const w8 = parentNode.values['2026']['08'];
                        const node_w8 = node.values['2026']['08'];
                        if (w8 && node_w8) {
                            w8.W1 += node_w8.W1 || 0;
                            w8.W2 += node_w8.W2 || 0;
                            w8.W3 += node_w8.W3 || 0;
                            w8.W4 += node_w8.W4 || 0;
                            w8.W5 += node_w8.W5 || 0;
                        }
                    }
                }
            });
        }
    };
    aggregateValuesForeign();

    const getRowCalculatedMetricsForeign = (node) => {
        const v = node.values;
        const augMTD = (v['2026']['08'].W1 || 0) + (v['2026']['08'].W2 || 0) + (v['2026']['08'].W3 || 0) + (v['2026']['08'].W4 || 0) + (v['2026']['08'].W5 || 0);
        
        const todayVal = Math.round((v['2026']['08'].W3 || 0) / 5);
        const julTotal = v['2026']['07'][0];
        const mom = julTotal > 0 ? ((augMTD - julTotal) / julTotal) * 100 : 0;
        
        let ytd = 0;
        for (let m = 1; m <= 7; m++) {
            const key = m < 10 ? `0${m}` : `${m}`;
            ytd += (v['2026'][key] ? v['2026'][key][0] : 0);
        }
        ytd += augMTD;

        const annualized = Math.round((augMTD / 3) * 4.5);

        const total2025Foreign = v['2025'].reduce((a, b) => a + b, 0);
        const yoy = total2025Foreign > 0 ? ((ytd - total2025Foreign) / total2025Foreign) * 100 : 0;

        return {
            today: todayVal,
            annualized: annualized,
            marMTD: augMTD,
            mom: mom,
            ytd: ytd,
            yoy: yoy,
            values: {
                '2025_total': v['2025'].reduce((a, b) => a + b, 0),
                '2025_months': v['2025'].map(x => x),
                '2026_01': v['2026']['01'][0],
                '2026_02': v['2026']['02'][0],
                '2026_03': v['2026']['03'][0],
                '2026_04': v['2026']['04'][0],
                '2026_05': v['2026']['05'][0],
                '2026_06': v['2026']['06'][0],
                '2026_07': v['2026']['07'][0],
                '2026_08_W1': v['2026']['08'].W1,
                '2026_08_W2': v['2026']['08'].W2,
                '2026_08_W3': v['2026']['08'].W3,
                '2026_08_W4': v['2026']['08'].W4,
                '2026_08_W5': v['2026']['08'].W5
            }
        };
    };

    const getSortedSubtreeForeign = (parentId, filteredNodes) => {
        let directChildren = filteredNodes.filter(node => node.parent === parentId);
        if (sortColForeign) {
            directChildren.sort((a, b) => {
                const metricsA = getRowCalculatedMetricsForeign(a);
                const metricsB = getRowCalculatedMetricsForeign(b);
                let valA = 0, valB = 0;

                if (sortColForeign === 'today') { valA = metricsA.today; valB = metricsB.today; }
                else if (sortColForeign === 'ann') { valA = metricsA.annualized; valB = metricsB.annualized; }
                else if (sortColForeign === 'mtd') { valA = metricsA.marMTD; valB = metricsB.marMTD; }
                else if (sortColForeign === 'mom') { valA = metricsA.mom; valB = metricsB.mom; }
                else if (sortColForeign === 'ytd') { valA = metricsA.ytd; valB = metricsB.ytd; }
                else if (sortColForeign === 'yoy') { valA = metricsA.yoy; valB = metricsB.yoy; }
                else if (sortColForeign === '2025_total') { valA = metricsA.values['2025_total']; valB = metricsB.values['2025_total']; }
                else if (sortColForeign && sortColForeign.startsWith('2026_')) {
                    const colKey = sortColForeign;
                    valA = metricsA.values[colKey] || 0;
                    valB = metricsB.values[colKey] || 0;
                }
                else if (sortColForeign && sortColForeign.startsWith('2025_')) {
                    const mIdx = parseInt(sortColForeign.split('_')[1], 10);
                    valA = metricsA.values['2025_months'][mIdx] || 0;
                    valB = metricsB.values['2025_months'][mIdx] || 0;
                }
                return sortAscForeign ? valA - valB : valB - valA;
            });
        }
        let result = [];
        directChildren.forEach(child => {
            result.push(child);
            result = result.concat(getSortedSubtreeForeign(child.id, filteredNodes));
        });
        return result;
    };

    const renderForeignTable = () => {
        const container = document.getElementById('onion-table-foreign');
        if (!container) return;

        const groupCbs = document.querySelectorAll('#group-foreign-options input[type="checkbox"]');
        const selectedGroupValues = Array.from(groupCbs).filter(cb => cb.checked).map(cb => cb.value);
        const totalGroupsCount = groupCbs.length;

        const parentAccCbs = document.querySelectorAll('#parent-acc-foreign-options input[type="checkbox"]');
        const selectedParentAccValues = Array.from(parentAccCbs).filter(cb => cb.checked).map(cb => cb.value);
        const totalParentAccCount = parentAccCbs.length;

        const foreignClientCbs = document.querySelectorAll('#foreign-client-options input[type="checkbox"]');
        const selectedForeignClientValues = Array.from(foreignClientCbs).filter(cb => cb.checked).map(cb => cb.value);
        const totalForeignClientCount = foreignClientCbs.length;

        const rawAccId = (document.getElementById('filter-account-id-foreign') ? document.getElementById('filter-account-id-foreign').value.trim() : '');
        const qSalesRaw = (document.getElementById('filter-sales-foreign') ? document.getElementById('filter-sales-foreign').value.trim() : '');
        const qInst = (document.getElementById('filter-inst-foreign') ? document.getElementById('filter-inst-foreign').value : 'all');

        const isStructuralEmpty = (n) => {
            if (n.level === 5) return false;
            const hasLeaf = allNodesForeign.some(child => {
                if (child.level !== 5) return false;
                let p = child.parent;
                while (p) {
                    if (p === n.id) return true;
                    const pNode = allNodesForeign.find(x => x.id === p);
                    p = pNode ? pNode.parent : null;
                }
                return false;
            });
            return !hasLeaf;
        };

        let filteredNodes = allNodesForeign.filter(node => {
            if (node.level === 0) return true;

            // Group Category Filter
            if (selectedGroupValues.length < totalGroupsCount) {
                if (node.grp && !selectedGroupValues.includes(node.grp)) {
                    return false;
                }
            }

            // Foreign Client Category Filter (Foreign Category is Level 3, labels[3])
            if (totalForeignClientCount > 0 && selectedForeignClientValues.length < totalForeignClientCount) {
                const matchesForeignCategory = (n) => {
                    const cat = (n.labels[3] || '').toLowerCase();
                    return selectedForeignClientValues.some(v => {
                        const val = v.toLowerCase();
                        return cat && (cat === val || cat.includes(val) || val.includes(cat));
                    });
                };

                const matchesSelf = matchesForeignCategory(node);
                if (!matchesSelf && node.level > 0 && node.level < 3) {
                    const hasChildMatch = allNodesForeign.some(child => {
                        let isChild = false;
                        let p = child.parent;
                        while(p) {
                            if (p === node.id) { isChild = true; break; }
                            const pNode = allNodesForeign.find(x => x.id === p);
                            p = pNode ? pNode.parent : null;
                        }
                        return isChild && matchesForeignCategory(child);
                    });
                    if (!hasChildMatch) return false;
                } else if (!matchesSelf && node.level >= 3) {
                    return false;
                }
            }

            // Inst Entity Filter
            if (qInst !== 'all') {
                const targetInst = (qInst === 'inst' ? '機構法人' : '一般');
                if (node.labels[1] && node.labels[1] !== targetInst && node.level === 2) {
                    return false;
                }
            }

            // Preserve empty structural categories at level 1 & 2
            if (node.level <= 2 && isStructuralEmpty(node)) {
                return true;
            }

            // Parent Account / Code Multiselect Filter
            if (totalParentAccCount > 0 && selectedParentAccValues.length < totalParentAccCount) {
                const matchesParentAcc = (n) => {
                    const pName = (n.labels[4] || '').toLowerCase();
                    const pCode = (n.labels[5] || '').toLowerCase();
                    return selectedParentAccValues.some(v => {
                        const val = v.toLowerCase();
                        return (pName && (pName.includes(val) || val.includes(pName))) ||
                               (pCode && (pCode.includes(val) || val.includes(pCode)));
                    });
                };

                const matchesSelf = matchesParentAcc(node);
                if (!matchesSelf) {
                    const hasChildMatch = allNodesForeign.some(child => {
                        let isChild = false;
                        let p = child.parent;
                        while(p) {
                            if (p === node.id) { isChild = true; break; }
                            const pNode = allNodesForeign.find(x => x.id === p);
                            p = pNode ? pNode.parent : null;
                        }
                        return isChild && matchesParentAcc(child);
                    });
                    if (!hasChildMatch) return false;
                }
            }

            // Account / ID Search Filter
            if (rawAccId) {
                const clean = rawAccId.toLowerCase();
                const matchesAccId = (n) => {
                    const acc = (n.labels[7] || '').toLowerCase();
                    const idVal = (n.labels[9] || '').toLowerCase();
                    return (acc && acc.includes(clean)) || (idVal && idVal.includes(clean)) ||
                           (acc && clean.includes(acc)) || (idVal && clean.includes(idVal));
                };

                const matchesSelf = matchesAccId(node);
                if (!matchesSelf) {
                    const hasChildMatch = allNodesForeign.some(child => {
                        let isChild = false;
                        let p = child.parent;
                        while(p) {
                            if (p === node.id) { isChild = true; break; }
                            const pNode = allNodesForeign.find(x => x.id === p);
                            p = pNode ? pNode.parent : null;
                        }
                        return isChild && matchesAccId(child);
                    });
                    if (!hasChildMatch) return false;
                }
            }

            // Sales Rep / Emp ID Search Filter
            if (qSalesRaw) {
                const clean = qSalesRaw.toLowerCase();
                const matchesSales = (n) => {
                    const sales = (n.labels[10] || '').toLowerCase();
                    return sales && (sales.includes(clean) || clean.includes(sales));
                };

                const matchesSelf = matchesSales(node);
                if (!matchesSelf) {
                    const hasChildMatch = allNodesForeign.some(child => {
                        let isChild = false;
                        let p = child.parent;
                        while(p) {
                            if (p === node.id) { isChild = true; break; }
                            const pNode = allNodesForeign.find(x => x.id === p);
                            p = pNode ? pNode.parent : null;
                        }
                        return isChild && matchesSales(child);
                    });
                    if (!hasChildMatch) return false;
                }
            }

            return true;
        });

        let totalNode = filteredNodes.find(n => n.id === 'org-foreign-total');
        let sortedNodes = [];
        if (totalNode) {
            sortedNodes.push(totalNode);
            sortedNodes = sortedNodes.concat(getSortedSubtreeForeign('org-foreign-total', filteredNodes));
        }

        const isRowVisible = (node) => {
            if (node.level === 0 || node.level === 1 || node.level === 2) return true;
            let p = node.parent;
            while (p) {
                if (!expandedRowsForeign[p]) return false;
                const pNode = allNodesForeign.find(n => n.id === p);
                p = pNode ? pNode.parent : null;
            }
            return true;
        };

        const visibleNodes = sortedNodes.filter(isRowVisible);
        // Filter out level 5 nodes from main Foreign table (Level 4 總歸戶/代號 is lowest level in main table)
        const mainTableVisibleNodes = visibleNodes.filter(node => node.level <= 4);

        let limit = 'all';
        const limitSelect = document.getElementById('select-row-limit-foreign');
        if (limitSelect) limit = limitSelect.value;
        let displayedNodes = mainTableVisibleNodes;
        if (limit !== 'all') {
            const numLimit = parseInt(limit, 10);
            displayedNodes = mainTableVisibleNodes.slice(0, numLimit);
        }

        let span2025 = expandedColsForeign['2025'] ? 12 : 1;
        let span2026 = 13 + (expandedColsForeign['2026-08'] ? 5 : 0);

        let headerRow1 = `
            <tr>
                <th rowspan="2" class="col-sticky-1">關係企業<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Affiliate</span></th>
                <th rowspan="2" class="col-sticky-2">機構法人<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Inst Entity</span></th>
                <th rowspan="2" class="col-sticky-3">客群類別<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Group Category</span></th>
                <th rowspan="2" class="col-sticky-4">外資客群<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Foreign Category</span></th>
                <th rowspan="2" class="col-sticky-5">總歸戶<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">(Party Name)</span></th>
                <th rowspan="2" class="col-sticky-6">總歸戶代號<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">(Party Code)</span></th>
                
                <th colspan="${span2025}" class="col-group-header">2025 <button class="col-expand-btn-foreign expand-btn" data-col="2025">${expandedColsForeign['2025'] ? '-' : '+'}</button></th>
                <th colspan="${span2026}" class="col-group-header">2026 <button class="col-expand-btn-foreign expand-btn" data-col="2026">${expandedColsForeign['2026'] ? '-' : '+'}</button></th>
                
                <th rowspan="2" class="sortable-header-foreign" data-sort="today" style="background:#EBF5FB; color:#1B4F72;">當日交易量 ↕</th>
            </tr>
        `;

        let headerRow2 = '<tr>';
        if (expandedColsForeign['2025']) {
            for (let m = 1; m <= 12; m++) {
                headerRow2 += `<th class="sortable-header-foreign" data-sort="2025_${m-1}" style="font-size:11px;">${m}月 ↕</th>`;
            }
        } else {
            headerRow2 += `<th class="sortable-header-foreign" data-sort="2025_total" style="font-size:11px; font-weight: 600;">YTD ↕</th>`;
        }

        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_01" style="font-size:11px;">1月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_02" style="font-size:11px;">2月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_03" style="font-size:11px;">3月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_04" style="font-size:11px;">4月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_05" style="font-size:11px;">5月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_06" style="font-size:11px;">6月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_07" style="font-size:11px;">7月 ↕ +</th>`;
        
        if (expandedColsForeign['2026-08']) {
            headerRow2 += `<th class="col-group-header" style="font-size:11px; background:#1A5276;">8月 <button class="col-expand-btn-foreign expand-btn" data-col="2026-08">-</button></th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第1週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第2週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第3週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第4週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第5週</th>`;
        } else {
            headerRow2 += `<th class="col-group-header" style="font-size:11px;">8月 <button class="col-expand-btn-foreign expand-btn" data-col="2026-08">+</button></th>`;
        }

        headerRow2 += `<th class="sortable-header-foreign" data-sort="mtd" style="font-size:11px; background:#D0E8FF; color:#1E4670;">MTD ↕</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="ann" style="font-size:11px;">月化 ↕</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="mom" style="font-size:11px;">MoM ↕</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="ytd" style="font-size:11px; font-weight:600;">YTD ↕</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="yoy" style="font-size:11px;">YoY ↕</th>`;
        headerRow2 += '</tr>';

        let tbodyRows = '';
        displayedNodes.forEach(node => {
            const metrics = getRowCalculatedMetricsForeign(node);
            let labelsHTML = '';
            for (let l = 0; l < 6; l++) {
                let cellVal = node.labels[l] || '';
                let colClass = `col-sticky-${l + 1}`;
                
                if (l === 0 && node.level === 0) {
                    labelsHTML += `<td class="${colClass} text-left"><strong>${cellVal}</strong></td>`;
                } else if (l === 0 && node.level === 1) {
                    let sign = expandedRowsForeign[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left"><button class="row-expand-btn-foreign row-expand-btn" data-row="${node.id}">${sign}</button> ${cellVal}</td>`;
                } else if (l === 2 && node.level === 2) {
                    let hasChildren = allNodesForeign.some(n => n.parent === node.id && n.level <= 4);
                    let sign = expandedRowsForeign[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left indent-1">${hasChildren ? `<button class="row-expand-btn-foreign row-expand-btn" data-row="${node.id}">${sign}</button>` : ''} ${cellVal}</td>`;
                } else if (l === 3 && node.level === 3) {
                    let hasChildren = allNodesForeign.some(n => n.parent === node.id && n.level <= 4);
                    let sign = expandedRowsForeign[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left indent-2">${hasChildren ? `<button class="row-expand-btn-foreign row-expand-btn" data-row="${node.id}">${sign}</button>` : ''} ${cellVal}</td>`;
                } else if (l === 4 && node.level === 4) {
                    if (cellVal) {
                        labelsHTML += `<td class="${colClass} text-left indent-3"><a href="javascript:void(0)" class="parent-account-link btn-open-foreign-detail" data-parent-id="${node.id}" data-parent-name="${cellVal}">${cellVal} 🔗</a></td>`;
                    } else {
                        labelsHTML += `<td class="${colClass} text-left indent-3"></td>`;
                    }
                } else if (l === 5 && node.level === 4) {
                    if (cellVal) {
                        const parentName = node.labels[4] || cellVal;
                        labelsHTML += `<td class="${colClass} text-left"><a href="javascript:void(0)" class="parent-account-link btn-open-foreign-detail" data-parent-id="${node.id}" data-parent-name="${parentName}">${cellVal} 🔗</a></td>`;
                    } else {
                        labelsHTML += `<td class="${colClass} text-left"></td>`;
                    }
                } else {
                    labelsHTML += `<td class="${colClass} text-left">${cellVal}</td>`;
                }
            }

            let valCells = '';
            if (expandedColsForeign['2025']) {
                metrics.values['2025_months'].forEach(mVal => {
                    valCells += `<td>${Math.round(mVal).toLocaleString()}</td>`;
                });
            } else {
                valCells += `<td style="font-weight: 600;">${Math.round(metrics.values['2025_total']).toLocaleString()}</td>`;
            }

            valCells += `<td>${Math.round(metrics.values['2026_01']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_02']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_03']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_04']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_05']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_06']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_07']).toLocaleString()}</td>`;

            if (expandedColsForeign['2026-08']) {
                valCells += `<td>${Math.round(metrics.values['2026_08_W1']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W2']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W3']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W4']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W5']).toLocaleString()}</td>`;
            }

            valCells += `<td style="font-weight: 700; background:#F2F8FD;">${Math.round(metrics.marMTD).toLocaleString()}</td>`;
            valCells += `<td style="font-weight: 600; color: var(--color-personal);">${Math.round(metrics.annualized).toLocaleString()}</td>`;
            valCells += `<td style="color: ${metrics.mom >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.mom.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight: 600;">${Math.round(metrics.ytd).toLocaleString()}</td>`;
            valCells += `<td style="color: ${metrics.yoy >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.yoy.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight: 700; background:#EBF5FB;">${Math.round(metrics.today).toLocaleString()}</td>`;

            let rowStyle = node.level === 0 ? ' style="background: #EAF2F8; font-weight: bold;"' : '';

            tbodyRows += `
                <tr class="row-level-${node.level}"${rowStyle}>
                    ${labelsHTML}
                    ${valCells}
                </tr>
            `;
        });

        container.innerHTML = `
            <thead>
                ${headerRow1}
                ${headerRow2}
            </thead>
            <tbody>
                ${tbodyRows}
            </tbody>
        `;

        attachForeignTableListeners();
    };

    const closeRowChildrenForeign = (parentId) => {
        allNodesForeign.forEach(n => {
            if (n.parent === parentId) {
                expandedRowsForeign[n.id] = false;
                closeRowChildrenForeign(n.id);
            }
        });
    };

    const applyStickyWidthsForeign = () => {
        let currentLeft = 0;
        for (let i = 0; i < 11; i++) {
            const colIndex = i + 1;
            const width = stickyWidthsForeign[i];
            const cells = document.querySelectorAll(`#onion-table-foreign .col-sticky-${colIndex}, [id^="panel-foreign-detail"] .col-sticky-${colIndex}`);
            cells.forEach(cell => {
                cell.style.setProperty('width', `${width}px`, 'important');
                cell.style.setProperty('min-width', `${width}px`, 'important');
                cell.style.setProperty('max-width', `${width}px`, 'important');
                cell.style.setProperty('left', `${currentLeft}px`, 'important');
            });
            currentLeft += width;
        }
    };

    const initResizableColumnsForeign = () => {
        const containers = document.querySelectorAll('#onion-table-foreign, [id^="panel-foreign-detail"] .onion-table');
        containers.forEach(container => {
            if (!container) return;

            for (let i = 1; i <= 11; i++) {
                const th = container.querySelector(`thead th.col-sticky-${i}`);
                if (th && !th.querySelector('.resizer')) {
                    const resizer = document.createElement('div');
                    resizer.className = 'resizer';
                    th.appendChild(resizer);
                    
                    resizer.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        const startX = e.pageX;
                        const startWidth = stickyWidthsForeign[i - 1];
                        
                        const onMouseMove = (moveEvent) => {
                            const delta = moveEvent.pageX - startX;
                            stickyWidthsForeign[i - 1] = Math.max(40, startWidth + delta);
                            applyStickyWidthsForeign();
                        };
                        
                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };
                        
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    });
                }
            }
        });
        applyStickyWidthsForeign();
    };

    const attachForeignTableListeners = () => {
        document.querySelectorAll('.row-expand-btn-foreign').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rowId = btn.getAttribute('data-row');
                const isExpanding = btn.textContent.trim() === '+';
                if (isExpanding) {
                    expandedRowsForeign[rowId] = true;
                } else {
                    expandedRowsForeign[rowId] = false;
                    closeRowChildrenForeign(rowId);
                }
                renderForeignTable();
            });
        });

        document.querySelectorAll('.col-expand-btn-foreign').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const colKey = btn.getAttribute('data-col');
                if (colKey === '2025') {
                    expandedColsForeign['2025'] = !expandedColsForeign['2025'];
                } else if (colKey === '2026' || colKey === '2026-08') {
                    expandedColsForeign['2026-08'] = !expandedColsForeign['2026-08'];
                }
                renderForeignTable();
                renderAllForeignParentAccountTabs();
            });
        });

        document.querySelectorAll('.sortable-header-foreign').forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.getAttribute('data-sort');
                if (sortColForeign === sortBy) {
                    sortAscForeign = !sortAscForeign;
                } else {
                    sortColForeign = sortBy;
                    sortAscForeign = false;
                }
                renderForeignTable();
            });
        });

        document.querySelectorAll('.btn-open-foreign-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const parentId = btn.getAttribute('data-parent-id');
                const parentName = btn.getAttribute('data-parent-name');
                openForeignAccountTab(parentId, parentName);
            });
        });

        initResizableColumnsForeign();
    };

    const renderForeignAccountTabContent = (parentId, parentName) => {
        const panel = document.getElementById(`panel-foreign-detail-${parentId}`);
        if (!panel) return;

        const parentNode = allNodesForeign.find(n => n.id === parentId);
        const leafNodes = allNodesForeign.filter(n => n.parent === parentId && n.level === 5);

        const aff = parentNode ? parentNode.labels[0] || '關係企業' : '關係企業';
        const inst = parentNode ? parentNode.labels[1] || '機構法人' : '機構法人';
        const grp = parentNode ? parentNode.labels[2] || '外資' : '外資';
        const fcat = parentNode ? parentNode.labels[3] || 'Co-Cover' : 'Co-Cover';
        const partyCode = parentNode ? parentNode.labels[5] || '' : '';

        let span2025 = expandedColsForeign['2025'] ? 12 : 1;
        let span2026 = 13 + (expandedColsForeign['2026-08'] ? 5 : 0);

        let headerRow1 = `
            <tr>
                <th rowspan="2" class="col-sticky-1">關係企業<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Affiliate</span></th>
                <th rowspan="2" class="col-sticky-2">機構法人<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Inst Entity</span></th>
                <th rowspan="2" class="col-sticky-3">客群類別<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Group Category</span></th>
                <th rowspan="2" class="col-sticky-4">外資客群<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Foreign Category</span></th>
                <th rowspan="2" class="col-sticky-5">總歸戶<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">(Party Name)</span></th>
                <th rowspan="2" class="col-sticky-6">總歸戶代號<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">(Party Code)</span></th>
                <th rowspan="2" class="col-sticky-7">客戶全銜<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Client Name</span></th>
                <th rowspan="2" class="col-sticky-8">帳號<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Account No</span></th>
                <th rowspan="2" class="col-sticky-9">子帳<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Sub Acc</span></th>
                <th rowspan="2" class="col-sticky-10">ID<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">ID</span></th>
                <th rowspan="2" class="col-sticky-11">營業員<br><span style="font-size:11px; font-weight:normal; opacity:0.8;">Sales Rep</span></th>
                
                <th colspan="${span2025}" class="col-group-header">2025 <button class="col-expand-btn-foreign expand-btn" data-col="2025">${expandedColsForeign['2025'] ? '-' : '+'}</button></th>
                <th colspan="${span2026}" class="col-group-header">2026 <button class="col-expand-btn-foreign expand-btn" data-col="2026">${expandedColsForeign['2026'] ? '-' : '+'}</button></th>
                
                <th rowspan="2" class="sortable-header-foreign" data-sort="today" style="background:#EBF5FB; color:#1B4F72;">當日交易量 ↕</th>
            </tr>
        `;

        let headerRow2 = '<tr>';
        if (expandedColsForeign['2025']) {
            for (let m = 1; m <= 12; m++) {
                headerRow2 += `<th class="sortable-header-foreign" data-sort="2025_${m-1}" style="font-size:11px;">${m}月 ↕</th>`;
            }
        } else {
            headerRow2 += `<th class="sortable-header-foreign" data-sort="2025_total" style="font-size:11px; font-weight:600;">YTD ↕</th>`;
        }

        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_01" style="font-size:11px;">1月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_02" style="font-size:11px;">2月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_03" style="font-size:11px;">3月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_04" style="font-size:11px;">4月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_05" style="font-size:11px;">5月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_06" style="font-size:11px;">6月 ↕ +</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="2026_07" style="font-size:11px;">7月 ↕ +</th>`;

        if (expandedColsForeign['2026-08']) {
            headerRow2 += `<th class="col-group-header" style="font-size:11px; background:#1A5276;">8月 <button class="col-expand-btn-foreign expand-btn" data-col="2026-08">-</button></th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第1週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第2週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第3週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第4週</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">第5週</th>`;
        } else {
            headerRow2 += `<th class="col-group-header" style="font-size:11px;">8月 <button class="col-expand-btn-foreign expand-btn" data-col="2026-08">+</button></th>`;
        }

        headerRow2 += `<th class="sortable-header-foreign" data-sort="mtd" style="font-size:11px; background:#D0E8FF; color:#1E4670;">MTD ↕</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="ann" style="font-size:11px;">月化 ↕</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="mom" style="font-size:11px;">MoM ↕</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="ytd" style="font-size:11px; font-weight:600;">YTD ↕</th>`;
        headerRow2 += `<th class="sortable-header-foreign" data-sort="yoy" style="font-size:11px;">YoY ↕</th>`;
        headerRow2 += '</tr>';

        let tbodyRows = '';
        leafNodes.forEach(node => {
            const metrics = getRowCalculatedMetricsForeign(node);
            let labelsHTML = '';
            for (let l = 0; l < 11; l++) {
                let cellVal = node.labels[l] || '';
                let colClass = `col-sticky-${l + 1}`;
                labelsHTML += `<td class="${colClass} text-left">${cellVal}</td>`;
            }

            let valCells = '';
            if (expandedColsForeign['2025']) {
                metrics.values['2025_months'].forEach(mVal => { valCells += `<td>${Math.round(mVal).toLocaleString()}</td>`; });
            } else {
                valCells += `<td style="font-weight:600;">${Math.round(metrics.values['2025_total']).toLocaleString()}</td>`;
            }

            valCells += `<td>${Math.round(metrics.values['2026_01']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_02']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_03']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_04']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_05']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_06']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_07']).toLocaleString()}</td>`;

            if (expandedColsForeign['2026-08']) {
                valCells += `<td>${Math.round(metrics.values['2026_08_W1']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W2']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W3']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W4']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_08_W5']).toLocaleString()}</td>`;
            }

            valCells += `<td style="font-weight:700; background:#F2F8FD;">${Math.round(metrics.marMTD).toLocaleString()}</td>`;
            valCells += `<td style="font-weight:600; color:var(--color-personal);">${Math.round(metrics.annualized).toLocaleString()}</td>`;
            valCells += `<td style="color:${metrics.mom >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.mom.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight:600;">${Math.round(metrics.ytd).toLocaleString()}</td>`;
            valCells += `<td style="color:${metrics.yoy >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.yoy.toFixed(1)}%</td>`;
            valCells += `<td style="font-weight:700; background:#EBF5FB;">${Math.round(metrics.today).toLocaleString()}</td>`;

            tbodyRows += `<tr>${labelsHTML}${valCells}</tr>`;
        });

        panel.innerHTML = `
            <div class="report-filter-panel" style="padding:16px 20px; background:#F8FAFC; border-radius:8px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="margin:0 0 4px 0; font-size:16px; color:var(--fubon-dark);">外法基礎報表 ＞ 外資總歸戶客戶明細分頁：${parentName} ${partyCode ? `(${partyCode})` : ''}</h3>
                    <span style="font-size:13px; color:#64748B;">所屬關係企業：${aff} ｜ 機構法人：${inst} ｜ 外資客群：${fcat} ｜ 包含明細戶數：${leafNodes.length} 戶</span>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-secondary btn-back-main-foreign" style="padding:6px 16px; font-size:13px;">← 返回外法主表 Back</button>
                    <button class="btn-export" style="padding:6px 16px; font-size:13px;">↑ 匯出本專頁 Export</button>
                </div>
            </div>
            <div class="table-wrapper" style="overflow-x:auto;">
                <table class="onion-table" id="onion-table-foreign-detail-${parentId}">
                    <thead>${headerRow1}${headerRow2}</thead>
                    <tbody>${tbodyRows}</tbody>
                </table>
            </div>
        `;

        applyStickyWidthsForeign();
        initResizableColumnsForeign();

        const backBtn = panel.querySelector('.btn-back-main-foreign');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const mainForTab = document.querySelector('[data-target="panel-foreign-basic"]');
                if (mainForTab) mainForTab.click();
            });
        }

        panel.querySelectorAll('.col-expand-btn-foreign').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const colKey = btn.getAttribute('data-col');
                if (colKey === '2025') {
                    expandedColsForeign['2025'] = !expandedColsForeign['2025'];
                } else if (colKey === '2026' || colKey === '2026-08') {
                    expandedColsForeign['2026-08'] = !expandedColsForeign['2026-08'];
                }
                renderForeignTable();
                renderAllForeignParentAccountTabs();
            });
        });
    };

    const renderAllForeignParentAccountTabs = () => {
        document.querySelectorAll('.dynamic-tab-foreign').forEach(tab => {
            const parentId = tab.id.replace('tab-btn-detail-foreign-', '');
            const parentNode = allNodesForeign.find(n => n.id === parentId);
            const parentName = parentNode ? parentNode.name || parentNode.labels[4] : '';
            if (parentId && parentName) {
                renderForeignAccountTabContent(parentId, parentName);
            }
        });
    };

    const openForeignAccountTab = (parentId, parentName) => {
        const tabsContainer = document.querySelector('.report-tabs');
        if (!tabsContainer) return;

        const existingTab = document.getElementById(`tab-btn-detail-foreign-${parentId}`);
        if (existingTab) {
            existingTab.click();
            return;
        }

        const parentNode = allNodesForeign.find(n => n.id === parentId);
        const leafNodes = allNodesForeign.filter(n => n.parent === parentId && n.level === 5);

        // 1. Create Tab Button
        const newTabBtn = document.createElement('button');
        newTabBtn.className = 'report-tab-btn dynamic-tab dynamic-tab-foreign active';
        newTabBtn.id = `tab-btn-detail-foreign-${parentId}`;
        newTabBtn.setAttribute('data-target', `panel-foreign-detail-${parentId}`);
        newTabBtn.setAttribute('data-badge', '外法明細分頁');
        newTabBtn.style.cssText = 'line-height: 1.2; padding: 10px 16px; display:inline-flex; align-items:center; gap:6px;';
        newTabBtn.innerHTML = `
            <span>${parentName} 明細<br><span style="font-size: 11px; font-weight: normal; color: #666;">${leafNodes.length}戶合約</span></span>
            <span class="close-tab-btn" data-parent-id="${parentId}" style="font-size:16px; margin-left:4px; font-weight:bold; cursor:pointer;">&times;</span>
        `;

        // 2. Create Panel
        const newPanel = document.createElement('div');
        newPanel.className = 'report-content-panel dynamic-panel active';
        newPanel.id = `panel-foreign-detail-${parentId}`;

        // Deactivate current tabs & panels
        document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.report-content-panel').forEach(p => p.classList.remove('active'));

        tabsContainer.appendChild(newTabBtn);
        const parentContainer = document.querySelector('.reports-container');
        parentContainer.appendChild(newPanel);

        // Render content
        renderForeignAccountTabContent(parentId, parentName);

        // Update Page Header
        const pageTitle = document.getElementById('report-page-title');
        const pageBadge = document.getElementById('report-page-badge');
        if (pageTitle) pageTitle.innerHTML = `報表專區 - ${parentName} (外法總歸戶明細分頁)<br><span style="font-size:14px; font-weight:normal; color:#666;">Foreign Basic Report - ${parentName} Detail Sub-Tab</span>`;
        if (pageBadge) pageBadge.textContent = '外法明細分頁';

        // Bind events for the new tab button & close button
        newTabBtn.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-tab-btn')) return;
            document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.report-content-panel').forEach(p => p.classList.remove('active'));
            newTabBtn.classList.add('active');
            newPanel.classList.add('active');
            if (pageTitle) pageTitle.innerHTML = `報表專區 - ${parentName} (外法總歸戶明細分頁)<br><span style="font-size:14px; font-weight:normal; color:#666;">Foreign Basic Report - ${parentName} Detail Sub-Tab</span>`;
            if (pageBadge) pageBadge.textContent = '外法明細分頁';
        });

        const closeBtn = newTabBtn.querySelector('.close-tab-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                newTabBtn.remove();
                newPanel.remove();
                const mainForTab = document.querySelector('[data-target="panel-foreign-basic"]');
                if (mainForTab) mainForTab.click();
            });
        }
    };

    // ----------------------------------------------------
    // Custom Multi-Select Binding: Group Category (Foreign Report)
    // ----------------------------------------------------
    const groupForeignTrigger = document.getElementById('group-foreign-trigger');
    const groupForeignDropdown = document.getElementById('group-foreign-dropdown');
    const groupForeignLabel = document.getElementById('group-foreign-label');
    const groupForeignSearch = document.getElementById('group-foreign-search');
    const btnSelectAllGroupsForeign = document.getElementById('btn-select-all-groups-foreign');
    const btnClearAllGroupsForeign = document.getElementById('btn-clear-all-groups-foreign');

    const updateGroupForeignLabelText = () => {
        const cbs = document.querySelectorAll('#group-foreign-options input[type="checkbox"]');
        if (!cbs.length || !groupForeignLabel) return;
        const checkedList = Array.from(cbs).filter(cb => cb.checked);
        const total = cbs.length;
        if (checkedList.length === 0) {
            groupForeignLabel.textContent = '未選取客群';
            groupForeignLabel.style.color = '#94A3B8';
        } else if (checkedList.length === total) {
            groupForeignLabel.textContent = `全選 (${total}項客群)`;
            groupForeignLabel.style.color = 'var(--text-main)';
        } else if (checkedList.length <= 2) {
            groupForeignLabel.textContent = checkedList.map(cb => cb.parentElement.textContent.trim()).join(', ');
            groupForeignLabel.style.color = 'var(--text-main)';
        } else {
            const firstTwo = checkedList.slice(0, 2).map(cb => cb.parentElement.textContent.trim()).join(', ');
            groupForeignLabel.textContent = `${firstTwo} (+${checkedList.length - 2}項)`;
            groupForeignLabel.style.color = 'var(--text-main)';
        }
    };

    if (groupForeignTrigger && groupForeignDropdown) {
        groupForeignTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = groupForeignDropdown.classList.contains('show');
            if (isOpen) {
                groupForeignDropdown.classList.remove('show');
                groupForeignTrigger.classList.remove('active');
            } else {
                document.querySelectorAll('.multiselect-dropdown').forEach(d => d.classList.remove('show'));
                document.querySelectorAll('.multiselect-trigger').forEach(t => t.classList.remove('active'));
                groupForeignDropdown.classList.add('show');
                groupForeignTrigger.classList.add('active');
                if (groupForeignSearch) groupForeignSearch.focus();
            }
        });
        document.addEventListener('click', (e) => {
            if (!groupForeignDropdown.contains(e.target) && !groupForeignTrigger.contains(e.target)) {
                groupForeignDropdown.classList.remove('show');
                groupForeignTrigger.classList.remove('active');
            }
        });
        groupForeignDropdown.addEventListener('click', (e) => { e.stopPropagation(); });
        if (groupForeignSearch) {
            groupForeignSearch.addEventListener('input', () => {
                const q = groupForeignSearch.value.trim().toLowerCase();
                document.querySelectorAll('#group-foreign-options .multiselect-option-item').forEach(item => {
                    item.style.display = item.textContent.trim().toLowerCase().includes(q) ? 'flex' : 'none';
                });
            });
        }
        if (btnSelectAllGroupsForeign) {
            btnSelectAllGroupsForeign.addEventListener('click', () => {
                document.querySelectorAll('#group-foreign-options input[type="checkbox"]').forEach(cb => cb.checked = true);
                updateGroupForeignLabelText();
                renderForeignTable();
            });
        }
        if (btnClearAllGroupsForeign) {
            btnClearAllGroupsForeign.addEventListener('click', () => {
                document.querySelectorAll('#group-foreign-options input[type="checkbox"]').forEach(cb => cb.checked = false);
                updateGroupForeignLabelText();
                renderForeignTable();
            });
        }
        document.querySelectorAll('#group-foreign-options input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                updateGroupForeignLabelText();
                renderForeignTable();
            });
        });
        updateGroupForeignLabelText();
    }

    // ----------------------------------------------------
    // Custom Multi-Select Binding: Foreign Category (外資客群)
    // ----------------------------------------------------
    const foreignClientTrigger = document.getElementById('foreign-client-trigger');
    const foreignClientDropdown = document.getElementById('foreign-client-dropdown');
    const foreignClientLabel = document.getElementById('foreign-client-label');
    const foreignClientSearch = document.getElementById('foreign-client-search');
    const btnSelectAllForeignClient = document.getElementById('btn-select-all-foreign-client');
    const btnClearAllForeignClient = document.getElementById('btn-clear-all-foreign-client');

    const updateForeignClientLabelText = () => {
        const cbs = document.querySelectorAll('#foreign-client-options input[type="checkbox"]');
        if (!cbs.length || !foreignClientLabel) return;
        const checkedList = Array.from(cbs).filter(cb => cb.checked);
        const total = cbs.length;
        if (checkedList.length === 0) {
            foreignClientLabel.textContent = '未選取外資客群';
            foreignClientLabel.style.color = '#94A3B8';
        } else if (checkedList.length === total) {
            foreignClientLabel.textContent = `全選 (${total}項外資客群)`;
            foreignClientLabel.style.color = 'var(--text-main)';
        } else if (checkedList.length <= 2) {
            foreignClientLabel.textContent = checkedList.map(cb => cb.parentElement.textContent.trim()).join(', ');
            foreignClientLabel.style.color = 'var(--text-main)';
        } else {
            const firstTwo = checkedList.slice(0, 2).map(cb => cb.parentElement.textContent.trim()).join(', ');
            foreignClientLabel.textContent = `${firstTwo} (+${checkedList.length - 2}項)`;
            foreignClientLabel.style.color = 'var(--text-main)';
        }
    };

    if (foreignClientTrigger && foreignClientDropdown) {
        foreignClientTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = foreignClientDropdown.classList.contains('show');
            if (isOpen) {
                foreignClientDropdown.classList.remove('show');
                foreignClientTrigger.classList.remove('active');
            } else {
                document.querySelectorAll('.multiselect-dropdown').forEach(d => d.classList.remove('show'));
                document.querySelectorAll('.multiselect-trigger').forEach(t => t.classList.remove('active'));
                foreignClientDropdown.classList.add('show');
                foreignClientTrigger.classList.add('active');
                if (foreignClientSearch) foreignClientSearch.focus();
            }
        });
        document.addEventListener('click', (e) => {
            if (!foreignClientDropdown.contains(e.target) && !foreignClientTrigger.contains(e.target)) {
                foreignClientDropdown.classList.remove('show');
                foreignClientTrigger.classList.remove('active');
            }
        });
        foreignClientDropdown.addEventListener('click', (e) => { e.stopPropagation(); });
        if (foreignClientSearch) {
            foreignClientSearch.addEventListener('input', () => {
                const q = foreignClientSearch.value.trim().toLowerCase();
                document.querySelectorAll('#foreign-client-options .multiselect-option-item').forEach(item => {
                    item.style.display = item.textContent.trim().toLowerCase().includes(q) ? 'flex' : 'none';
                });
            });
        }
        if (btnSelectAllForeignClient) {
            btnSelectAllForeignClient.addEventListener('click', () => {
                document.querySelectorAll('#foreign-client-options input[type="checkbox"]').forEach(cb => cb.checked = true);
                updateForeignClientLabelText();
                renderForeignTable();
            });
        }
        if (btnClearAllForeignClient) {
            btnClearAllForeignClient.addEventListener('click', () => {
                document.querySelectorAll('#foreign-client-options input[type="checkbox"]').forEach(cb => cb.checked = false);
                updateForeignClientLabelText();
                renderForeignTable();
            });
        }
        document.querySelectorAll('#foreign-client-options input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                updateForeignClientLabelText();
                renderForeignTable();
            });
        });
        updateForeignClientLabelText();
    }

    // ----------------------------------------------------
    // Custom Multi-Select Binding: Parent Account (Foreign Report)
    // ----------------------------------------------------
    const parentAccForeignTrigger = document.getElementById('parent-acc-foreign-trigger');
    const parentAccForeignDropdown = document.getElementById('parent-acc-foreign-dropdown');
    const parentAccForeignLabel = document.getElementById('parent-acc-foreign-label');
    const parentAccForeignSearch = document.getElementById('parent-acc-foreign-search');
    const btnSelectAllParentAccForeign = document.getElementById('btn-select-all-parent-acc-foreign');
    const btnClearAllParentAccForeign = document.getElementById('btn-clear-all-parent-acc-foreign');

    const updateParentAccForeignLabelText = () => {
        const cbs = document.querySelectorAll('#parent-acc-foreign-options input[type="checkbox"]');
        if (!cbs.length || !parentAccForeignLabel) return;
        const checkedList = Array.from(cbs).filter(cb => cb.checked);
        const total = cbs.length;
        if (checkedList.length === 0) {
            parentAccForeignLabel.textContent = '未選取總歸戶';
            parentAccForeignLabel.style.color = '#94A3B8';
        } else if (checkedList.length === total) {
            parentAccForeignLabel.textContent = `全選 (${total}個總歸戶)`;
            parentAccForeignLabel.style.color = 'var(--text-main)';
        } else if (checkedList.length <= 2) {
            parentAccForeignLabel.textContent = checkedList.map(cb => cb.parentElement.textContent.trim()).join(', ');
            parentAccForeignLabel.style.color = 'var(--text-main)';
        } else {
            const firstTwo = checkedList.slice(0, 2).map(cb => cb.parentElement.textContent.trim()).join(', ');
            parentAccForeignLabel.textContent = `${firstTwo} (+${checkedList.length - 2}個)`;
            parentAccForeignLabel.style.color = 'var(--text-main)';
        }
    };

    if (parentAccForeignTrigger && parentAccForeignDropdown) {
        parentAccForeignTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = parentAccForeignDropdown.classList.contains('show');
            if (isOpen) {
                parentAccForeignDropdown.classList.remove('show');
                parentAccForeignTrigger.classList.remove('active');
            } else {
                document.querySelectorAll('.multiselect-dropdown').forEach(d => d.classList.remove('show'));
                document.querySelectorAll('.multiselect-trigger').forEach(t => t.classList.remove('active'));
                parentAccForeignDropdown.classList.add('show');
                parentAccForeignTrigger.classList.add('active');
                if (parentAccForeignSearch) parentAccForeignSearch.focus();
            }
        });
        document.addEventListener('click', (e) => {
            if (!parentAccForeignDropdown.contains(e.target) && !parentAccForeignTrigger.contains(e.target)) {
                parentAccForeignDropdown.classList.remove('show');
                parentAccForeignTrigger.classList.remove('active');
            }
        });
        parentAccForeignDropdown.addEventListener('click', (e) => { e.stopPropagation(); });
        if (parentAccForeignSearch) {
            parentAccForeignSearch.addEventListener('input', () => {
                const q = parentAccForeignSearch.value.trim().toLowerCase();
                document.querySelectorAll('#parent-acc-foreign-options .multiselect-option-item').forEach(item => {
                    item.style.display = item.textContent.trim().toLowerCase().includes(q) ? 'flex' : 'none';
                });
            });
        }
        if (btnSelectAllParentAccForeign) {
            btnSelectAllParentAccForeign.addEventListener('click', () => {
                document.querySelectorAll('#parent-acc-foreign-options input[type="checkbox"]').forEach(cb => cb.checked = true);
                updateParentAccForeignLabelText();
                renderForeignTable();
            });
        }
        if (btnClearAllParentAccForeign) {
            btnClearAllParentAccForeign.addEventListener('click', () => {
                document.querySelectorAll('#parent-acc-foreign-options input[type="checkbox"]').forEach(cb => cb.checked = false);
                updateParentAccForeignLabelText();
                renderForeignTable();
            });
        }
        document.querySelectorAll('#parent-acc-foreign-options input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                updateParentAccForeignLabelText();
                renderForeignTable();
            });
        });
        updateParentAccForeignLabelText();
    }

    const btnQueryForeign = document.getElementById('btn-query-foreign');
    const btnResetForeign = document.getElementById('btn-reset-foreign');
    const kpiSelectForeign = document.getElementById('filter-kpi-foreign');
    const prodSelectForeign = document.getElementById('filter-product-foreign');
    const instSelectForeign = document.getElementById('filter-inst-foreign');

    const sDateFor = document.getElementById('filter-start-date-foreign');
    const eDateFor = document.getElementById('filter-end-date-foreign');
    const accFor = document.getElementById('filter-account-id-foreign');
    const salesFor = document.getElementById('filter-sales-foreign');

    [kpiSelectForeign, prodSelectForeign, instSelectForeign, sDateFor, eDateFor, accFor, salesFor].forEach(sel => {
        if (sel) {
            sel.addEventListener('change', () => {
                if (eDateFor && eDateFor.value) {
                    const latestLabel = document.getElementById('report-latest-date-foreign');
                    if (latestLabel) latestLabel.textContent = `交易資料最新日期：${eDateFor.value.replace(/-/g, '/')}`;
                }
                renderForeignTable();
            });
            if (sel.tagName === 'INPUT' && sel.type === 'text') {
                sel.addEventListener('input', () => renderForeignTable());
            }
        }
    });

    if (btnQueryForeign) {
        btnQueryForeign.addEventListener('click', () => renderForeignTable());
    }

    if (btnResetForeign) {
        btnResetForeign.addEventListener('click', () => {
            if (kpiSelectForeign) kpiSelectForeign.value = 'volume';
            if (prodSelectForeign) prodSelectForeign.value = 'tw_stock';
            if (instSelectForeign) instSelectForeign.value = 'all';

            const sDate = document.getElementById('filter-start-date-foreign');
            if (sDate) sDate.value = '2025-01-01';
            const eDate = document.getElementById('filter-end-date-foreign');
            if (eDate) eDate.value = '2026-08-18';

            document.querySelectorAll('#group-foreign-options input[type="checkbox"]').forEach(cb => cb.checked = true);
            updateGroupForeignLabelText();
            document.querySelectorAll('#foreign-client-options input[type="checkbox"]').forEach(cb => cb.checked = true);
            updateForeignClientLabelText();
            document.querySelectorAll('#parent-acc-foreign-options input[type="checkbox"]').forEach(cb => cb.checked = true);
            updateParentAccForeignLabelText();

            const accId = document.getElementById('filter-account-id-foreign');
            if (accId) accId.value = '';
            const sales = document.getElementById('filter-sales-foreign');
            if (sales) sales.value = '';

            renderForeignTable();
        });
    }

    // Initial render for Foreign Basic Table
    renderForeignTable();

    // ----------------------------------------------------
    // Commission Split Report Mock Dataset & Logic
    // ----------------------------------------------------
    const rawLeafDataCommission = [
        { id: 'comm-ann-rel-site-fubon', parent: 'comm-ann-rel-site', level: 4, labels: ['', '', '', '富邦投信'], name: '富邦投信', sales: 'Ann Liao', affiliate: 'related', grp1: 'site', values: { '2025': [60, 55, 65, 58, 70, 75, 68, 60, 72, 80, 75, 88], '2026': { '01': [90], '02': [95], '03': [100], '04': [105], '05': [110], '06': { W1: 22, W2: 25, W3: 20, W4: 24, W5: 6 } } } },
        { id: 'comm-ann-rel-pc-fubon-life', parent: 'comm-ann-rel-pc', level: 4, labels: ['', '', '', '富邦人壽'], name: '富邦人壽', sales: 'Ann Liao', affiliate: 'related', grp1: 'pc_life', values: { '2025': [80, 75, 85, 78, 90, 95, 88, 80, 92, 100, 95, 110], '2026': { '01': [115], '02': [120], '03': [125], '04': [130], '05': [140], '06': { W1: 30, W2: 32, W3: 28, W4: 31, W5: 9 } } } },
        { id: 'comm-ann-rel-pc-fubon-prop', parent: 'comm-ann-rel-pc', level: 4, labels: ['', '', '', '富邦產險'], name: '富邦產險', sales: 'Ann Liao', affiliate: 'related', grp1: 'pc_life', values: { '2025': [40, 35, 45, 38, 50, 55, 48, 40, 52, 60, 55, 70], '2026': { '01': [75], '02': [80], '03': [82], '04': [88], '05': [90], '06': { W1: 20, W2: 22, W3: 19, W4: 21, W5: 6 } } } },
        { id: 'comm-charlie-gen-inv-ctbc', parent: 'comm-charlie-gen-inv', level: 4, labels: ['', '', '', '中國信託投信'], name: '中國信託投信', sales: 'Charlie Zhao', affiliate: 'general', grp1: 'invest', values: { '2025': [100, 95, 105, 98, 110, 115, 108, 100, 112, 120, 115, 130], '2026': { '01': [135], '02': [140], '03': [145], '04': [150], '05': [160], '06': { W1: 40, W2: 42, W3: 38, W4: 41, W5: 12 } } } },
        { id: 'comm-charlie-gen-inv-yuanta', parent: 'comm-charlie-gen-inv', level: 4, labels: ['', '', '', '元大投信'], name: '元大投信', sales: 'Charlie Zhao', affiliate: 'general', grp1: 'invest', values: { '2025': [120, 115, 130, 118, 140, 150, 138, 120, 142, 160, 150, 175], '2026': { '01': [180], '02': [190], '03': [200], '04': [210], '05': [220], '06': { W1: 55, W2: 58, W3: 52, W4: 56, W5: 19 } } } }
    ];

    const structuralNodesCommission = [
        { id: 'comm-ann-rel-site', parent: 'comm-ann-rel', level: 3, labels: ['', '', '投信', ''], name: '投信', sales: 'Ann Liao', affiliate: 'related', grp1: 'site' },
        { id: 'comm-ann-rel-pc', parent: 'comm-ann-rel', level: 3, labels: ['', '', '產壽險', ''], name: '產壽險', sales: 'Ann Liao', affiliate: 'related', grp1: 'pc_life' },
        { id: 'comm-ann-rel', parent: 'comm-ann', level: 2, labels: ['', '關係', '', ''], name: '關係', sales: 'Ann Liao', affiliate: 'related' },
        { id: 'comm-ann', parent: 'total-comm', level: 1, labels: ['Ann Liao', '', '', ''], name: 'Ann Liao' },

        { id: 'comm-charlie-gen-inv', parent: 'comm-charlie-gen', level: 3, labels: ['', '', '投資公司', ''], name: '投資公司', sales: 'Charlie Zhao', affiliate: 'general', grp1: 'invest' },
        { id: 'comm-charlie-gen', parent: 'comm-charlie', level: 2, labels: ['', '一般', '', ''], name: '一般', sales: 'Charlie Zhao', affiliate: 'general' },
        { id: 'comm-charlie', parent: 'total-comm', level: 1, labels: ['Charlie Zhao', '', '', ''], name: 'Charlie Zhao' },

        { id: 'total-comm', parent: null, level: 0, labels: ['總計', '', '', ''], name: '總計' }
    ];

    let allNodesCommission = [...rawLeafDataCommission, ...structuralNodesCommission];

    const createEmptyValuesCommission = () => ({
        '2025': Array(12).fill(0),
        '2026': {
            '01': [0],
            '02': [0],
            '03': [0],
            '04': [0],
            '05': [0],
            '06': { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 }
        }
    });

    const aggregateValuesCommission = () => {
        structuralNodesCommission.forEach(node => {
            node.values = createEmptyValuesCommission();
        });

        for (let lvl = 4; lvl >= 0; lvl--) {
            allNodesCommission.forEach(node => {
                if (node.level === lvl && node.parent) {
                    const parentNode = allNodesCommission.find(n => n.id === node.parent);
                    if (parentNode) {
                        for (let m = 0; m < 12; m++) {
                            parentNode.values['2025'][m] += node.values['2025'][m] || 0;
                        }
                        parentNode.values['2026']['01'][0] += node.values['2026']['01'][0] || 0;
                        parentNode.values['2026']['02'][0] += node.values['2026']['02'][0] || 0;
                        parentNode.values['2026']['03'][0] += node.values['2026']['03'][0] || 0;
                        parentNode.values['2026']['04'][0] += node.values['2026']['04'][0] || 0;
                        parentNode.values['2026']['05'][0] += node.values['2026']['05'][0] || 0;

                        const pW = parentNode.values['2026']['06'];
                        const cW = node.values['2026']['06'];
                        if (cW) {
                            pW.W1 += cW.W1 || 0;
                            pW.W2 += cW.W2 || 0;
                            pW.W3 += cW.W3 || 0;
                            pW.W4 += cW.W4 || 0;
                            pW.W5 += cW.W5 || 0;
                        }
                    }
                }
            });
        }
    };

    aggregateValuesCommission();

    let expandedColsCommission = {
        '2025': false,
        '2026': false,
        '2026-06': true
    };

    let expandedRowsCommission = {
        'total-comm': true,
        'comm-ann': true,
        'comm-charlie': true,
        'comm-ann-rel': true,
        'comm-charlie-gen': true
    };

    let sortColCommission = null;
    let sortAscCommission = true;
    let stickyWidthsCommission = [100, 120, 100, 140];

    const getRowCalculatedMetricsCommission = (node) => {
        const v = node.values;
        const junMTD = (v['2026']['06'].W1 || 0) + (v['2026']['06'].W2 || 0) + (v['2026']['06'].W3 || 0) + (v['2026']['06'].W4 || 0) + (v['2026']['06'].W5 || 0);
        const annualized = (junMTD / 5) * 5;
        const mayTotal = v['2026']['05'][0];
        const mom = mayTotal > 0 ? ((junMTD - mayTotal) / mayTotal) * 100 : 0;
        const ytd = v['2026']['01'][0] + v['2026']['02'][0] + v['2026']['03'][0] + v['2026']['04'][0] + v['2026']['05'][0] + junMTD;
        const jun2025Total = v['2025'][5];
        const jun2025MTD = jun2025Total * 0.95;
        const yoy = jun2025MTD > 0 ? ((junMTD - jun2025MTD) / jun2025MTD) * 100 : 0;

        return {
            today: (v['2026']['06'].W5 || 0) / 5,
            avgDaily: junMTD / 25,
            txCount: Math.round(junMTD * 0.1),
            annualized,
            marMTD: junMTD,
            mom,
            ytd,
            yoy,
            values: {
                '2025_total': v['2025'].reduce((a, b) => a + b, 0),
                '2025_months': v['2025'].map(x => x),
                '2026_01': v['2026']['01'][0],
                '2026_02': v['2026']['02'][0],
                '2026_03': v['2026']['03'][0],
                '2026_04': v['2026']['04'][0],
                '2026_05': v['2026']['05'][0],
                '2026_06_W1': v['2026']['06'].W1,
                '2026_06_W2': v['2026']['06'].W2,
                '2026_06_W3': v['2026']['06'].W3,
                '2026_06_W4': v['2026']['06'].W4,
                '2026_06_W5': v['2026']['06'].W5
            }
        };
    };

    const renderCommissionTable = () => {
        const container = document.getElementById('onion-table-commission');
        if (!container) return;

        // Filtering
        let filteredNodes = allNodesCommission.filter(node => {
            if (node.level === 4) {
                const querySales = document.getElementById('filter-sales-commission').value.trim().toLowerCase();
                const queryAccount = document.getElementById('filter-account-commission').value.trim().toLowerCase();
                const grp = document.getElementById('filter-group-commission').value;

                if (querySales && !node.sales.toLowerCase().includes(querySales)) return false;
                if (queryAccount && !node.name.toLowerCase().includes(queryAccount)) return false;
                if (grp !== 'all' && node.grp1 !== grp) return false;
            }
            return true;
        });

        // Rebuild structure
        let visibleNodes = [];
        const addNode = (node) => {
            visibleNodes.push(node);
            const isRowExpanded = expandedRowsCommission[node.id];
            if (isRowExpanded) {
                const children = filteredNodes.filter(n => n.parent === node.id);
                children.forEach(addNode);
            }
        };

        const root = filteredNodes.find(n => n.id === 'total-comm');
        if (root) addNode(root);

        // Column widths and spans
        let span2025 = expandedColsCommission['2025'] ? 12 : 1;
        let span2026 = 5 + (expandedColsCommission['2026-06'] ? 6 : 1);

        let headerRow1 = `
            <tr>
                <th rowspan="2" class="col-sticky-1">營業員<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Sales Rep</span></th>
                <th rowspan="2" class="col-sticky-2">關係企業/機構法人<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Affiliate / Inst</span></th>
                <th rowspan="2" class="col-sticky-3">客群<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Group</span></th>
                <th rowspan="2" class="col-sticky-4">總歸戶<br><span style="font-size:11px; font-weight:normal; opacity: 0.8;">Parent Account</span></th>
                
                <th colspan="${span2025}" class="col-group-header">2025 <button class="col-expand-btn-commission expand-btn" data-col="2025">${expandedColsCommission['2025'] ? '-' : '+'}</button></th>
                <th colspan="${span2026}" class="col-group-header">2026 <button class="col-expand-btn-commission expand-btn" data-col="2026">${expandedColsCommission['2026'] ? '-' : '+'}</button></th>
                
                <th rowspan="2" class="sortable-header-commission" data-sort="today">當日 ↕</th>
                <th rowspan="2" class="sortable-header-commission" data-sort="avgDaily">日均量 ↕</th>
                <th rowspan="2" class="sortable-header-commission" data-sort="txCount">筆數 ↕</th>
                <th rowspan="2" class="sortable-header-commission" data-sort="ann">月化 ↕</th>
                <th rowspan="2" class="sortable-header-commission" data-sort="mtd">當月MTD ↕</th>
                <th rowspan="2" class="sortable-header-commission" data-sort="mom">MOM ↕</th>
                <th rowspan="2" class="sortable-header-commission" data-sort="ytd">當年YTD ↕</th>
                <th rowspan="2" class="sortable-header-commission" data-sort="yoy">YOY ↕</th>
            </tr>
        `;

        let headerRow2 = '<tr>';
        if (expandedColsCommission['2025']) {
            for (let m = 1; m <= 12; m++) {
                headerRow2 += `<th class="sortable-header-commission" data-sort="2025_${m-1}" style="font-size:11px;">${m}月 ↕</th>`;
            }
        } else {
            headerRow2 += `<th class="sortable-header-commission" data-sort="2025_total" style="font-size:11px; font-weight: 600;">YTD 加總 ↕</th>`;
        }

        headerRow2 += `<th class="sortable-header-commission" data-sort="2026_01" style="font-size:11px;">1月 ↕</th>`;
        headerRow2 += `<th class="sortable-header-commission" data-sort="2026_02" style="font-size:11px;">2月 ↕</th>`;
        headerRow2 += `<th class="sortable-header-commission" data-sort="2026_03" style="font-size:11px;">3月 ↕</th>`;
        headerRow2 += `<th class="sortable-header-commission" data-sort="2026_04" style="font-size:11px;">4月 ↕</th>`;
        headerRow2 += `<th class="sortable-header-commission" data-sort="2026_05" style="font-size:11px;">5月 ↕</th>`;
        if (expandedColsCommission['2026-06']) {
            headerRow2 += `<th style="font-size:11px; color:#888;">6月 W1</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">6月 W2</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">6月 W3</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">6月 W4</th>`;
            headerRow2 += `<th style="font-size:11px; color:#888;">6月 W5</th>`;
            headerRow2 += `<th class="sortable-header-commission" data-sort="mtd" style="font-size:11px; background:#D0E8FF; color:#1E4670;">6月 MTD ↕</th>`;
        } else {
            headerRow2 += `<th class="col-group-header" style="font-size:11px;">6月 <button class="col-expand-btn-commission expand-btn" data-col="2026-06">+</button></th>`;
        }
        headerRow2 += '</tr>';

        let tbodyRows = '';
        let limit = 'all';
        const limitSelect = document.getElementById('select-row-limit-commission');
        if (limitSelect) limit = limitSelect.value;
        let displayedNodes = visibleNodes;
        if (limit !== 'all') {
            const numLimit = parseInt(limit, 10);
            displayedNodes = visibleNodes.slice(0, numLimit);
        }

        displayedNodes.forEach(node => {
            const metrics = getRowCalculatedMetricsCommission(node);
            let labelsHTML = '';
            for (let l = 0; l < 4; l++) {
                let cellVal = node.labels[l] || '';
                let colClass = `col-sticky-${l + 1}`;
                
                if (l === 0 && node.level === 0) {
                    labelsHTML += `<td class="${colClass} text-left"><strong>${cellVal}</strong></td>`;
                } else if (l === 0 && node.level === 1) {
                    let sign = expandedRowsCommission[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left"><button class="row-expand-btn-commission row-expand-btn" data-row="${node.id}">${sign}</button> ${cellVal}</td>`;
                } else if (l === 1 && node.level === 2) {
                    let sign = expandedRowsCommission[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left indent-1"><button class="row-expand-btn-commission row-expand-btn" data-row="${node.id}">${sign}</button> ${cellVal}</td>`;
                } else if (l === 2 && node.level === 3) {
                    let sign = expandedRowsCommission[node.id] ? '-' : '+';
                    labelsHTML += `<td class="${colClass} text-left indent-2"><button class="row-expand-btn-commission row-expand-btn" data-row="${node.id}">${sign}</button> ${cellVal}</td>`;
                } else if (l === 3 && node.level === 4) {
                    labelsHTML += `<td class="${colClass} text-left indent-3">${cellVal}</td>`;
                } else {
                    labelsHTML += `<td class="${colClass} text-left">${cellVal}</td>`;
                }
            }

            let valCells = '';
            if (expandedColsCommission['2025']) {
                metrics.values['2025_months'].forEach(mVal => {
                    valCells += `<td>${Math.round(mVal).toLocaleString()}</td>`;
                });
            } else {
                valCells += `<td style="font-weight: 600;">${Math.round(metrics.values['2025_total']).toLocaleString()}</td>`;
            }

            valCells += `<td>${Math.round(metrics.values['2026_01']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_02']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_03']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_04']).toLocaleString()}</td>`;
            valCells += `<td>${Math.round(metrics.values['2026_05']).toLocaleString()}</td>`;

            if (expandedColsCommission['2026-06']) {
                valCells += `<td>${Math.round(metrics.values['2026_06_W1']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_06_W2']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_06_W3']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_06_W4']).toLocaleString()}</td>`;
                valCells += `<td>${Math.round(metrics.values['2026_06_W5']).toLocaleString()}</td>`;
                valCells += `<td style="font-weight: 700; background:#F2F8FD;">${Math.round(metrics.marMTD).toLocaleString()}</td>`;
            } else {
                valCells += `<td style="font-weight: 600;">${Math.round(metrics.marMTD).toLocaleString()}</td>`;
            }

            let rowStyle = node.level === 0 ? ' style="background: #EAF2F8; font-weight: bold;"' : '';

            tbodyRows += `
                <tr class="row-level-${node.level}"${rowStyle}>
                    ${labelsHTML}
                    ${valCells}
                    <td>${Math.round(metrics.today).toLocaleString()}</td>
                    <td>${Math.round(metrics.avgDaily).toLocaleString()}</td>
                    <td>${metrics.txCount}</td>
                    <td style="font-weight: 600; color: var(--color-personal);">${Math.round(metrics.annualized).toLocaleString()}</td>
                    <td style="font-weight: 700; background:#F2F8FD;">${Math.round(metrics.marMTD).toLocaleString()}</td>
                    <td style="color: ${metrics.mom >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.mom.toFixed(1)}%</td>
                    <td style="font-weight: 600;">${Math.round(metrics.ytd).toLocaleString()}</td>
                    <td style="color: ${metrics.yoy >= 0 ? '#2E7D32' : '#C0392B'};">${metrics.yoy.toFixed(1)}%</td>
                </tr>
            `;
        });

        container.innerHTML = `
            <thead>
                ${headerRow1}
                ${headerRow2}
            </thead>
            <tbody>
                ${tbodyRows}
            </tbody>
        `;

        attachCommissionTableListeners();
    };

    const closeRowChildrenCommission = (parentId) => {
        allNodesCommission.forEach(n => {
            if (n.parent === parentId) {
                expandedRowsCommission[n.id] = false;
                closeRowChildrenCommission(n.id);
            }
        });
    };

    const applyStickyWidthsCommission = () => {
        let currentLeft = 0;
        for (let i = 0; i < 4; i++) {
            const colIndex = i + 1;
            const width = stickyWidthsCommission[i];
            const cells = document.querySelectorAll(`#onion-table-commission .col-sticky-${colIndex}`);
            cells.forEach(cell => {
                cell.style.setProperty('width', `${width}px`, 'important');
                cell.style.setProperty('min-width', `${width}px`, 'important');
                cell.style.setProperty('max-width', `${width}px`, 'important');
                cell.style.setProperty('left', `${currentLeft}px`, 'important');
            });
            currentLeft += width;
        }
    };

    const initResizableColumnsCommission = () => {
        const container = document.getElementById('onion-table-commission');
        if (!container) return;

        for (let i = 1; i <= 4; i++) {
            const th = container.querySelector(`thead th.col-sticky-${i}`);
            if (th) {
                if (!th.querySelector('.resizer')) {
                    const resizer = document.createElement('div');
                    resizer.className = 'resizer';
                    th.appendChild(resizer);
                    
                    resizer.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        const startX = e.pageX;
                        const startWidth = stickyWidthsCommission[i - 1];
                        
                        const onMouseMove = (moveEvent) => {
                            const delta = moveEvent.pageX - startX;
                            stickyWidthsCommission[i - 1] = Math.max(50, startWidth + delta);
                            applyStickyWidthsCommission();
                        };
                        
                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };
                        
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    });
                }
            }
        }
        applyStickyWidthsCommission();
    };

    const attachCommissionTableListeners = () => {
        document.querySelectorAll('.row-expand-btn-commission').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rowId = btn.getAttribute('data-row');
                const isExpanding = btn.textContent.trim() === '+';
                if (isExpanding) {
                    expandedRowsCommission[rowId] = true;
                } else {
                    expandedRowsCommission[rowId] = false;
                    closeRowChildrenCommission(rowId);
                }
                renderCommissionTable();
            });
        });

        document.querySelectorAll('.col-expand-btn-commission').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const colKey = btn.getAttribute('data-col');
                if (colKey === '2025') {
                    expandedColsCommission['2025'] = !expandedColsCommission['2025'];
                } else if (colKey === '2026') {
                    expandedColsCommission['2026-06'] = !expandedColsCommission['2026-06'];
                } else if (colKey === '2026-06') {
                    expandedColsCommission['2026-06'] = true;
                }
                renderCommissionTable();
            });
        });

        initResizableColumnsCommission();
    };

    const rowLimitCommission = document.getElementById('select-row-limit-commission');
    if (rowLimitCommission) {
        rowLimitCommission.addEventListener('change', () => {
            renderCommissionTable();
        });
    }

    const resetBtnCommission = document.getElementById('btn-reset-commission');
    const queryBtnCommission = document.getElementById('btn-query-commission');

    if (queryBtnCommission) {
        queryBtnCommission.addEventListener('click', () => {
            renderCommissionTable();
        });
    }

    if (resetBtnCommission) {
        resetBtnCommission.addEventListener('click', () => {
            document.getElementById('filter-product-commission').value = 'foreign_stock';
            document.getElementById('filter-sales-commission').value = '';
            document.getElementById('filter-group-commission').value = 'all';
            document.getElementById('filter-account-commission').value = '';
            renderCommissionTable();
        });
    }

    // Render initially
    renderDomesticTable();
    renderForeignTable();
    renderCommissionTable();
});
