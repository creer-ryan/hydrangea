// permissions.js

function initPermissions() {

    // ----------------------------------------------------
    // Modal Display & Tab Switching Helpers
    // ----------------------------------------------------
    function showModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.add('show');
    }

    function hideModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.remove('show');
    }

    const tabRoleMode = document.getElementById('tab-role-mode');
    const tabUserMode = document.getElementById('tab-user-mode');
    const tabAgentMode = document.getElementById('tab-agent-mode');
    const panelRoles = document.getElementById('panel-roles');
    const panelUsers = document.getElementById('panel-users');
    const panelAgent = document.getElementById('panel-agent');
    const pageTitle = document.getElementById('permissions-page-title');

    function switchTab(mode) {
        if (tabRoleMode) tabRoleMode.style.display = 'inline-block';
        if (tabUserMode) tabUserMode.style.display = 'inline-block';
        if (tabAgentMode) tabAgentMode.style.display = 'inline-block';

        if (mode === 'roles') {
            if (tabRoleMode) tabRoleMode.classList.add('active');
            if (tabUserMode) tabUserMode.classList.remove('active');
            if (tabAgentMode) tabAgentMode.classList.remove('active');
            if (panelRoles) panelRoles.style.display = 'block';
            if (panelUsers) panelUsers.style.display = 'none';
            if (panelAgent) panelAgent.style.display = 'none';
            if (pageTitle) pageTitle.textContent = '權限與代理人管理 - 權限設定 - 角色管理';
        } else if (mode === 'users') {
            if (tabUserMode) tabUserMode.classList.add('active');
            if (tabRoleMode) tabRoleMode.classList.remove('active');
            if (tabAgentMode) tabAgentMode.classList.remove('active');
            if (panelUsers) panelUsers.style.display = 'block';
            if (panelRoles) panelRoles.style.display = 'none';
            if (panelAgent) panelAgent.style.display = 'none';
            if (pageTitle) pageTitle.textContent = '權限與代理人管理 - 權限設定 - 使用者管理';
        } else if (mode === 'agent') {
            if (tabAgentMode) tabAgentMode.classList.add('active');
            if (tabUserMode) tabUserMode.classList.remove('active');
            if (tabRoleMode) tabRoleMode.classList.remove('active');
            if (panelAgent) panelAgent.style.display = 'block';
            if (panelUsers) panelUsers.style.display = 'none';
            if (panelRoles) panelRoles.style.display = 'none';
            if (pageTitle) pageTitle.textContent = '權限與代理人管理 - 代理人設定';
        }
        
        const newHash = mode === 'roles' ? '#roles' : (mode === 'users' ? '#users' : '#agent');
        if (window.location.hash !== newHash) {
            history.replaceState(null, null, newHash);
        }
    }
    window.switchTab = switchTab;

    if (tabRoleMode) tabRoleMode.addEventListener('click', () => switchTab('roles'));
    if (tabUserMode) tabUserMode.addEventListener('click', () => switchTab('users'));
    if (tabAgentMode) tabAgentMode.addEventListener('click', () => switchTab('agent'));

    // ----------------------------------------------------
    // Panel 1: Role Table Filter, Multi-select Dropdown & Search Logic
    // ----------------------------------------------------
    const roleSearchInput = document.getElementById('role-search-input');
    const roleCategoryFilter = document.getElementById('role-category-filter');
    const roleStatusFilter = document.getElementById('role-status-filter');
    const roleTable = document.getElementById('role-table');

    const roleMultiselectDropdown = document.getElementById('role-multiselect-dropdown');
    const roleMultiselectBtn = document.getElementById('role-multiselect-btn');
    const roleMultiselectPanel = document.getElementById('role-multiselect-panel');
    const roleMultiselectLabel = document.getElementById('role-multiselect-label');
    const roleCbSelectAll = document.getElementById('role-cb-select-all');
    const roleMultiselectList = document.getElementById('role-multiselect-list');

    function filterRoleTable() {
        if (!roleTable) return;
        const query = (roleSearchInput?.value || '').trim().toLowerCase();
        const catVal = roleCategoryFilter?.value || 'ALL';
        const statusVal = roleStatusFilter?.value || 'ALL';

        const allCbs = roleMultiselectList?.querySelectorAll('.role-cb') || [];
        const selectedRoles = Array.from(roleMultiselectList?.querySelectorAll('.role-cb:checked') || []).map(cb => cb.value);
        const allSelected = selectedRoles.length === 0 || selectedRoles.length === allCbs.length;

        const rows = roleTable.querySelectorAll('tbody tr');
        let visibleCount = 0;
        let activeCount = 0;

        rows.forEach(row => {
            const roleName = row.querySelector('td strong')?.textContent.trim() || '';
            const text = row.innerText.toLowerCase();
            const cat = row.getAttribute('data-category') || '';
            const isActive = row.querySelector('.tag-active') !== null;

            const matchesQuery = !query || text.includes(query);
            const matchesRole = allSelected || selectedRoles.includes(roleName);
            const matchesCat = (catVal === 'ALL') || (cat === catVal);
            const matchesStatus = (statusVal === 'ALL') || 
                                  (statusVal === 'ACTIVE' && isActive) || 
                                  (statusVal === 'INACTIVE' && !isActive);

            if (matchesQuery && matchesRole && matchesCat && matchesStatus) {
                row.style.display = '';
                visibleCount++;
                if (isActive) activeCount++;
            } else {
                row.style.display = 'none';
            }
        });

        const statTotal = document.getElementById('stat-total-roles');
        const statActive = document.getElementById('stat-active-roles');
        if (statTotal) statTotal.textContent = visibleCount;
        if (statActive) statActive.textContent = activeCount;
    }

    function handleRoleCbChange() {
        if (!roleMultiselectList) return;
        const allCbs = roleMultiselectList.querySelectorAll('.role-cb');
        const checkedCbs = roleMultiselectList.querySelectorAll('.role-cb:checked');

        if (roleCbSelectAll) {
            roleCbSelectAll.checked = (allCbs.length > 0 && checkedCbs.length === allCbs.length);
        }

        if (roleMultiselectLabel) {
            if (checkedCbs.length === 0 || checkedCbs.length === allCbs.length) {
                roleMultiselectLabel.textContent = '🛡️ 選擇角色 (全部)';
            } else if (checkedCbs.length === 1) {
                roleMultiselectLabel.textContent = `🛡️ 角色: ${checkedCbs[0].value}`;
            } else {
                roleMultiselectLabel.textContent = `🛡️ 已選擇 ${checkedCbs.length} 個角色`;
            }
        }

        filterRoleTable();
    }

    function updateRoleDropdownOptions() {
        if (!roleTable || !roleMultiselectList) return;

        const currentRoles = [];
        roleTable.querySelectorAll('tbody tr').forEach(row => {
            const roleName = row.querySelector('td strong')?.textContent.trim();
            if (roleName && !currentRoles.includes(roleName)) {
                currentRoles.push(roleName);
            }
        });

        const previouslyChecked = new Set();
        roleMultiselectList.querySelectorAll('.role-cb').forEach(cb => {
            if (cb.checked) previouslyChecked.add(cb.value);
        });

        const isFirstRun = roleMultiselectList.children.length === 0;

        roleMultiselectList.innerHTML = '';
        currentRoles.forEach(roleName => {
            const label = document.createElement('label');
            label.className = 'multiselect-item';
            const isChecked = isFirstRun || previouslyChecked.has(roleName) || previouslyChecked.size === 0;
            
            label.innerHTML = `
                <input type="checkbox" class="role-cb" value="${roleName}" ${isChecked ? 'checked' : ''}>
                <span>${roleName}</span>
            `;
            roleMultiselectList.appendChild(label);
        });

        roleMultiselectList.querySelectorAll('.role-cb').forEach(cb => {
            cb.addEventListener('change', handleRoleCbChange);
        });

        handleRoleCbChange();
    }

    roleMultiselectBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        roleMultiselectPanel?.classList.toggle('show');
        roleMultiselectBtn?.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#role-multiselect-dropdown')) {
            roleMultiselectPanel?.classList.remove('show');
            roleMultiselectBtn?.classList.remove('active');
        }
    });

    roleCbSelectAll?.addEventListener('change', () => {
        const isChecked = roleCbSelectAll.checked;
        roleMultiselectList?.querySelectorAll('.role-cb').forEach(cb => {
            cb.checked = isChecked;
        });
        handleRoleCbChange();
    });

    roleSearchInput?.addEventListener('input', filterRoleTable);
    roleCategoryFilter?.addEventListener('change', filterRoleTable);
    roleStatusFilter?.addEventListener('change', filterRoleTable);

    document.getElementById('btn-export-roles')?.addEventListener('click', () => {
        alert('📊 成功產生並匯出「CRM 系統角色權限矩陣」Excel 檔！');
    });

    // ----------------------------------------------------
    // Role Category & Permission Matrix Linkage Store
    // ----------------------------------------------------
    const defaultModulePermissions = {
        'HOME': {
            '個人行事曆與行程管理': { read: true, edit: true, delete: true, export: false },
            '即時交易庫存彙整': { read: true, edit: false, delete: false, export: false },
        },
        'MARKETING': {
            '個人行事曆與行程管理': { read: true, edit: true, delete: false, export: false },
            '客戶訪談與服務紀錄': { read: true, edit: true, delete: false, export: true },
            '活動管理法說會論壇': { read: true, edit: true, delete: false, export: true },
            '投顧使用紀錄研究資源': { read: true, edit: false, delete: false, export: false },
        },
        'INQUIRY': {
            '即時交易庫存彙整': { read: true, edit: false, delete: false, export: false },
            '法人總帳戶綜合查詢': { read: true, edit: true, delete: false, export: true },
            '單一客戶標籤與群組': { read: true, edit: true, delete: false, export: false },
            '商品視角橫向透視': { read: true, edit: false, delete: false, export: true },
        },
        'REPORT': {
            '報表專區業績與市佔': { read: true, edit: false, delete: false, export: true },
            '營業員手續統計與分潤設定': { read: true, edit: true, delete: false, export: true },
            '客戶訪談與服務紀錄': { read: true, edit: false, delete: false, export: false },
        },
        'TOOLS': {
            '個人行事曆與行程管理': { read: true, edit: true, delete: true, export: true },
            '即時交易庫存彙整': { read: true, edit: true, delete: true, export: true },
            '客戶訪談與服務紀錄': { read: true, edit: true, delete: true, export: true },
            '活動管理法說會論壇': { read: true, edit: true, delete: true, export: true },
            '投顧使用紀錄研究資源': { read: true, edit: true, delete: true, export: true },
            '法人總帳戶綜合查詢': { read: true, edit: true, delete: true, export: true },
            '單一客戶標籤與群組': { read: true, edit: true, delete: true, export: true },
            '商品視角橫向透視': { read: true, edit: true, delete: true, export: true },
            '報表專區業績與市佔': { read: true, edit: true, delete: true, export: true },
            '營業員手續統計與分潤設定': { read: true, edit: true, delete: true, export: true },
            '組織權限管轄與功能管理': { read: true, edit: true, delete: true, export: true },
            '代理人設定與角色權限': { read: true, edit: true, delete: true, export: true }
        }
    };

    const templatePermissions = {
        'SALES': defaultModulePermissions['MARKETING'],
        'MANAGER': defaultModulePermissions['REPORT'],
        'TRADER': defaultModulePermissions['INQUIRY']
    };

    const rolePermissionsStore = {
        '系統管理員': defaultModulePermissions['TOOLS'],
        '主管': defaultModulePermissions['REPORT'],
        '營業員': defaultModulePermissions['MARKETING'],
        '交易員': defaultModulePermissions['INQUIRY'],
        '一般員工': defaultModulePermissions['HOME'],
        '專案實習角色': {}
    };

    function updatePermissionCounters() {
        const activeCountEl = document.getElementById('matrix-active-count');
        const exportCountEl = document.getElementById('matrix-export-count');

        const rows = document.querySelectorAll('#matrix-main-table tr.feature-row');
        let activeFuncs = 0;
        let activeExports = 0;

        rows.forEach(row => {
            const cbRead = row.querySelector('.cb-read');
            const cbExport = row.querySelector('.cb-export');
            if (cbRead && cbRead.checked) activeFuncs++;
            if (cbExport && cbExport.checked) activeExports++;
        });

        if (activeCountEl) activeCountEl.textContent = activeFuncs;
        if (exportCountEl) exportCountEl.textContent = activeExports;
    }

    function loadPermissionsToMatrix(roleName, roleCategory) {
        let perms = rolePermissionsStore[roleName];
        if (!perms) {
            perms = defaultModulePermissions[roleCategory] || defaultModulePermissions['HOME'];
            rolePermissionsStore[roleName] = JSON.parse(JSON.stringify(perms));
        }

        const rows = document.querySelectorAll('#matrix-main-table tr.feature-row');
        rows.forEach(row => {
            const featureName = row.getAttribute('data-feature-name');
            const featPerm = perms[featureName] || { read: false, edit: false, delete: false, export: false };

            const cbRead = row.querySelector('.cb-read');
            const cbEdit = row.querySelector('.cb-edit');
            const cbDelete = row.querySelector('.cb-delete');
            const cbExport = row.querySelector('.cb-export');
            const cbRowAll = row.querySelector('.cb-row-all');

            if (cbRead) cbRead.checked = !!featPerm.read;
            if (cbEdit) cbEdit.checked = !!featPerm.edit;
            if (cbDelete) cbDelete.checked = !!featPerm.delete;
            if (cbExport) cbExport.checked = !!featPerm.export;
            if (cbRowAll) cbRowAll.checked = featPerm.read && featPerm.edit && featPerm.delete && featPerm.export;
        });
    }

    function savePermissionsFromMatrix(roleName) {
        const newPerms = {};
        const rows = document.querySelectorAll('#matrix-main-table tr.feature-row');
        rows.forEach(row => {
            const featureName = row.getAttribute('data-feature-name');
            const cbRead = row.querySelector('.cb-read')?.checked || false;
            const cbEdit = row.querySelector('.cb-edit')?.checked || false;
            const cbDelete = row.querySelector('.cb-delete')?.checked || false;
            const cbExport = row.querySelector('.cb-export')?.checked || false;

            if (cbRead || cbEdit || cbDelete || cbExport) {
                newPerms[featureName] = { read: cbRead, edit: cbEdit, delete: cbDelete, export: cbExport };
            }
        });

        rolePermissionsStore[roleName] = newPerms;
        updateRoleRowSummaryPills(roleName);
    }

    function updateRoleRowSummaryPills(roleName) {
        const rows = roleTable?.querySelectorAll('tbody tr') || [];
        rows.forEach(row => {
            const nameEl = row.querySelector('td strong');
            if (nameEl && nameEl.textContent.trim() === roleName) {
                const pillsContainer = row.querySelector('.perm-summary-pills');
                if (!pillsContainer) return;

                const perms = rolePermissionsStore[roleName] || {};
                const featKeys = Object.keys(perms).filter(k => perms[k].read);

                pillsContainer.innerHTML = '';
                if (featKeys.length === 0) {
                    pillsContainer.innerHTML = '<span class="perm-pill" style="opacity:0.6;">(無權限)</span>';
                } else {
                    featKeys.slice(0, 3).forEach(feat => {
                        const pill = document.createElement('span');
                        pill.className = 'perm-pill';
                        pill.textContent = feat.length > 10 ? feat.substring(0, 9) + '...' : feat;
                        pillsContainer.appendChild(pill);
                    });
                }
            }
        });
    }

    // ----------------------------------------------------
    // Modal 1: Add / Edit Role Feature Checklist & Multi-select Module Linkage
    // ----------------------------------------------------
    function updateModalRoleFeatureCounter() {
        const activeCountEl = document.getElementById('modal-role-active-count');
        const rows = document.querySelectorAll('#modal-role-feature-table tr.modal-feature-row');
        let activeCount = 0;
        rows.forEach(row => {
            const cbRead = row.querySelector('.mcb-read');
            if (cbRead && cbRead.checked) activeCount++;
        });
        if (activeCountEl) activeCountEl.textContent = activeCount;
    }

    function loadPermissionsToRoleModalTable(perms) {
        const rows = document.querySelectorAll('#modal-role-feature-table tr.modal-feature-row');
        rows.forEach(row => {
            const featName = row.getAttribute('data-feature-name');
            const featPerm = perms[featName] || { read: false, edit: false, delete: false, export: false };

            const cbRead = row.querySelector('.mcb-read');
            const cbEdit = row.querySelector('.mcb-edit');
            const cbExport = row.querySelector('.mcb-export');

            if (cbRead) cbRead.checked = !!featPerm.read;
            if (cbEdit) cbEdit.checked = !!featPerm.edit;
            if (cbExport) cbExport.checked = !!featPerm.export;
        });

        // Sync module checkbox group state based on checked features
        const catCbs = document.querySelectorAll('.role-cat-cb');
        catCbs.forEach(cb => {
            const modKey = cb.value;
            const modRows = document.querySelectorAll(`#modal-role-feature-table tr.modal-feature-row[data-mod-group="${modKey}"]`);
            const hasChecked = Array.from(modRows).some(r => r.querySelector('.mcb-read')?.checked);
            cb.checked = hasChecked;
        });

        updateModalRoleFeatureCounter();
    }

    function getPermissionsFromRoleModalTable() {
        const perms = {};
        const rows = document.querySelectorAll('#modal-role-feature-table tr.modal-feature-row');
        rows.forEach(row => {
            const featName = row.getAttribute('data-feature-name');
            const cbRead = row.querySelector('.mcb-read')?.checked || false;
            const cbEdit = row.querySelector('.mcb-edit')?.checked || false;
            const cbExport = row.querySelector('.mcb-export')?.checked || false;

            if (cbRead || cbEdit || cbExport) {
                perms[featName] = { read: cbRead, edit: cbEdit, delete: false, export: cbExport };
            }
        });
        return perms;
    }

    // Toggle module checkboxes -> auto check/uncheck feature rows in Modal 1
    document.querySelectorAll('.role-cat-cb').forEach(catCb => {
        catCb.addEventListener('change', () => {
            const modKey = catCb.value;
            const isChecked = catCb.checked;
            const modRows = document.querySelectorAll(`#modal-role-feature-table tr.modal-feature-row[data-mod-group="${modKey}"]`);
            
            modRows.forEach(row => {
                const cbRead = row.querySelector('.mcb-read');
                const cbEdit = row.querySelector('.mcb-edit');
                const cbExport = row.querySelector('.mcb-export');

                if (cbRead) cbRead.checked = isChecked;
                if (cbEdit) cbEdit.checked = isChecked;
                if (!isChecked && cbExport) cbExport.checked = false;
            });
            updateModalRoleFeatureCounter();
        });
    });

    // Select All Modules Button
    document.getElementById('btn-role-cat-select-all')?.addEventListener('click', () => {
        const catCbs = document.querySelectorAll('.role-cat-cb');
        const allChecked = Array.from(catCbs).every(cb => cb.checked);
        catCbs.forEach(cb => {
            cb.checked = !allChecked;
            cb.dispatchEvent(new Event('change'));
        });
    });

    // Template Dropdown Listener in Modal 1
    document.getElementById('input-role-template')?.addEventListener('change', (e) => {
        const tplVal = e.target.value;
        if (tplVal && templatePermissions[tplVal]) {
            loadPermissionsToRoleModalTable(JSON.parse(JSON.stringify(templatePermissions[tplVal])));
        }
    });

    // Feature Row Checkbox Auto Linkage in Modal 1
    document.querySelectorAll('#modal-role-feature-table tr.modal-feature-row').forEach(row => {
        const cbRead = row.querySelector('.mcb-read');
        const cbEdit = row.querySelector('.mcb-edit');
        const cbExport = row.querySelector('.mcb-export');

        [cbEdit, cbExport].forEach(cb => {
            cb?.addEventListener('change', () => {
                if (cb.checked && cbRead) cbRead.checked = true;
                updateModalRoleFeatureCounter();
            });
        });

        cbRead?.addEventListener('change', () => {
            if (!cbRead.checked) {
                if (cbEdit) cbEdit.checked = false;
                if (cbExport) cbExport.checked = false;
            }
            updateModalRoleFeatureCounter();
        });
    });

    let currentEditingRow = null;

    function openRoleModal(tr = null) {
        currentEditingRow = tr;
        const modalTitle = document.getElementById('modal-role-title');
        const inputName = document.getElementById('input-role-name');
        const inputTpl = document.getElementById('input-role-template');
        const auditBox = document.getElementById('role-audit-info-box');
        const deactBox = document.getElementById('audit-deactivated-box');

        if (tr) {
            const roleName = tr.querySelector('td strong')?.textContent.trim() || '角色編輯';
            const lastUpdated = tr.querySelectorAll('td')[3]?.innerText.trim().replace('\n', ' ') || '2026/02/10 管理員 A';
            const isInactive = tr.querySelector('.tag-inactive') !== null;

            if (modalTitle) modalTitle.textContent = `編輯角色 - ${roleName}`;
            if (inputName) inputName.value = roleName;
            if (inputTpl) inputTpl.value = '';
            if (auditBox) auditBox.style.display = 'block';

            const elCreatedDate = document.getElementById('audit-created-date');
            if (elCreatedDate) elCreatedDate.textContent = '2025/06/15';
            const elCreatedBy = document.getElementById('audit-created-by');
            if (elCreatedBy) elCreatedBy.textContent = '系統建立 (System Init)';
            const elUpdatedDate = document.getElementById('audit-updated-date');
            if (elUpdatedDate) elUpdatedDate.textContent = lastUpdated.split(' ')[0] || '2026/02/10';
            const elUpdatedBy = document.getElementById('audit-updated-by');
            if (elUpdatedBy) elUpdatedBy.textContent = lastUpdated.split(' ')[1] || '管理員 A';

            if (deactBox) {
                if (isInactive) {
                    deactBox.style.display = 'block';
                    const elDeactInfo = document.getElementById('audit-deactivated-info');
                    if (elDeactInfo) elDeactInfo.textContent = '2025/10/01 由 管理員 A (EIP: admin.a) 停用';
                } else {
                    deactBox.style.display = 'none';
                }
            }

            const perms = rolePermissionsStore[roleName] || defaultModulePermissions['MARKETING'];
            loadPermissionsToRoleModalTable(perms);
        } else {
            if (modalTitle) modalTitle.textContent = '新增角色';
            if (inputName) inputName.value = '';
            if (inputTpl) inputTpl.value = '';
            if (auditBox) auditBox.style.display = 'none';

            // Default to MARKETING module checked for new role
            loadPermissionsToRoleModalTable(defaultModulePermissions['MARKETING']);
        }
        showModal('modal-role-manage');
    }

    // Modal 1 buttons
    document.getElementById('btn-close-role-x')?.addEventListener('click', () => hideModal('modal-role-manage'));
    document.getElementById('btn-cancel-role')?.addEventListener('click', () => hideModal('modal-role-manage'));
    document.getElementById('btn-save-role')?.addEventListener('click', () => {
        const name = document.getElementById('input-role-name')?.value.trim();
        const isActive = document.getElementById('input-role-active')?.checked ?? true;

        if (!name) {
            alert('請輸入角色名稱！');
            return;
        }

        // Collect checked main module category tags
        const checkedCats = Array.from(document.querySelectorAll('.role-cat-cb:checked')).map(cb => cb.value);
        const primaryCat = checkedCats[0] || 'TOOLS';

        const catMap = {
            'HOME': { class: 'cat-home', text: '【首頁】行程與搜尋' },
            'MARKETING': { class: 'cat-marketing', text: '【行銷展業】服務與活動' },
            'INQUIRY': { class: 'cat-inquiry', text: '【客戶綜合查詢】總帳戶' },
            'REPORT': { class: 'cat-report', text: '【報表專區】業績與分潤' },
            'TOOLS': { class: 'cat-tools', text: '【工具】權限代理' }
        };

        // Save detailed permissions from Modal 1 checklist
        const newPerms = getPermissionsFromRoleModalTable();
        rolePermissionsStore[name] = newPerms;

        // Build HTML for category badges
        const badgesHtml = checkedCats.length > 0 
            ? checkedCats.map(c => `<span class="category-badge ${catMap[c]?.class || 'cat-tools'}">${catMap[c]?.text || c}</span>`).join(' ')
            : `<span class="category-badge cat-tools">【自訂權限】</span>`;

        if (currentEditingRow) {
            const nameEl = currentEditingRow.querySelector('td strong');
            if (nameEl) nameEl.textContent = name;

            currentEditingRow.setAttribute('data-category', primaryCat);

            const badgeCell = currentEditingRow.querySelector('td .category-badge')?.parentElement;
            if (badgeCell) {
                badgeCell.innerHTML = `
                    ${badgesHtml}
                    <div class="perm-summary-pills"></div>
                `;
            }

            const statusTd = currentEditingRow.querySelectorAll('td')[4];
            if (statusTd) {
                statusTd.innerHTML = isActive 
                    ? '<span class="tag-active">● 啟用</span>' 
                    : '<span class="tag-inactive">● 停用</span>';
            }

            updateRoleRowSummaryPills(name);
            alert(`✅ 角色「${name}」資料與授權已成功更新！共指派 ${Object.keys(newPerms).length} 項子功能權限。`);
        } else {
            const tbody = roleTable?.querySelector('tbody');
            if (tbody) {
                const newTr = document.createElement('tr');
                const newId = `r_${Date.now()}`;
                newTr.setAttribute('data-role-id', newId);
                newTr.setAttribute('data-category', primaryCat);
                const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '/');

                newTr.innerHTML = `
                    <td><strong>${name}</strong></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            ${badgesHtml}
                            <div class="perm-summary-pills"></div>
                        </div>
                    </td>
                    <td style="text-align:center;"><span style="background:#F1F5F9; color:#334155; padding:2px 8px; border-radius:10px; font-weight:600; font-size:12px;">0 人</span></td>
                    <td style="text-align:center; font-size:12px; color:var(--text-muted);">${todayStr}<br>管理員 A</td>
                    <td style="text-align:center;">${isActive ? '<span class="tag-active">● 啟用</span>' : '<span class="tag-inactive">● 停用</span>'}</td>
                    <td style="text-align:center;">
                        <div style="display:flex; justify-content:center; gap: 6px;">
                            <button class="btn-action-manage trigger-permissions-manage" data-role-name="${name}" title="設定功能與敏感權限">🔑 權限設定</button>
                            <button class="icon-btn-secondary trigger-role-manage-dyn" title="編輯基本資料">📝</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(newTr);
                updateRoleRowSummaryPills(name);
            }
            alert(`✅ 角色「${name}」已成功新增！已為您完成多模組與細粒度授權設定，亦可點擊【🔑 權限設定】隨時調閱矩陣。`);
        }

        updateRoleDropdownOptions();
        hideModal('modal-role-manage');
    });

    // Modal 2 buttons
    document.getElementById('btn-close-perms-x')?.addEventListener('click', () => hideModal('modal-permissions-manage'));
    document.getElementById('btn-cancel-perms')?.addEventListener('click', () => hideModal('modal-permissions-manage'));

    document.getElementById('btn-save-perms')?.addEventListener('click', () => {
        const targetRoleBadge = document.getElementById('target-role-badge');
        const roleName = targetRoleBadge?.textContent || '角色';
        savePermissionsFromMatrix(roleName);
        alert(`🎉 角色「${roleName}」權限矩陣與細粒度授權已成功更新與儲存！`);
        hideModal('modal-permissions-manage');
    });

    // Matrix checkbox auto linkage
    document.querySelectorAll('#matrix-main-table tr.feature-row').forEach(row => {
        const cbRead = row.querySelector('.cb-read');
        const cbEdit = row.querySelector('.cb-edit');
        const cbDelete = row.querySelector('.cb-delete');
        const cbExport = row.querySelector('.cb-export');
        const cbRowAll = row.querySelector('.cb-row-all');

        cbRowAll?.addEventListener('change', () => {
            const checked = cbRowAll.checked;
            if (cbRead) cbRead.checked = checked;
            if (cbEdit) cbEdit.checked = checked;
            if (cbDelete) cbDelete.checked = checked;
            if (cbExport) cbExport.checked = checked;
            updatePermissionCounters();
        });

        [cbEdit, cbDelete, cbExport].forEach(cb => {
            cb?.addEventListener('change', () => {
                if (cb.checked && cbRead) {
                    cbRead.checked = true;
                }
                updatePermissionCounters();
            });
        });

        cbRead?.addEventListener('change', () => {
            if (!cbRead.checked) {
                if (cbEdit) cbEdit.checked = false;
                if (cbDelete) cbDelete.checked = false;
                if (cbExport) cbExport.checked = false;
                if (cbRowAll) cbRowAll.checked = false;
            }
            updatePermissionCounters();
        });
    });

    // ----------------------------------------------------
    // Modal 2: Tree-View Multi-select Dropdown & Filtering Logic
    // ----------------------------------------------------
    const matrixTreeDropdown = document.getElementById('matrix-tree-dropdown');
    const matrixTreeBtn = document.getElementById('matrix-tree-btn');
    const matrixTreePanel = document.getElementById('matrix-tree-panel');
    const matrixTreeLabel = document.getElementById('matrix-tree-label');
    const matrixTreeCbSelectAll = document.getElementById('matrix-tree-cb-select-all');
    const matrixTreeContainer = document.getElementById('matrix-tree-container');

    const matrixTreeStructure = [
        {
            id: 'mod-home',
            title: '🌐 【首頁】',
            children: [
                { id: 'f-1', name: '【首頁】個人行事曆與行程管理', featureName: '個人行事曆與行程管理' },
                { id: 'f-2', name: '【首頁】即時交易庫存彙整', featureName: '即時交易庫存彙整' }
            ]
        },
        {
            id: 'mod-marketing',
            title: '📢 【行銷展業】',
            children: [
                { id: 'f-3', name: '【行銷展業】服務管理 - 訪談與紀錄', featureName: '客戶訪談與服務紀錄' },
                { id: 'f-4', name: '【行銷展業】活動管理 - 名單發送通知', featureName: '活動管理法說會論壇' },
                { id: 'f-5', name: '【行銷展業】投顧使用紀錄 - 研究資源', featureName: '投顧使用紀錄研究資源' }
            ]
        },
        {
            id: 'mod-inquiry',
            title: '👥 【客戶綜合查詢】',
            children: [
                { id: 'f-6', name: '【客戶綜合查詢】法人總帳戶', featureName: '法人總帳戶綜合查詢' },
                { id: 'f-7', name: '【客戶綜合查詢】單一客戶及標籤群組', featureName: '單一客戶標籤與群組' },
                { id: 'f-8', name: '【客戶綜合查詢】商品視角橫向透視', featureName: '商品視角橫向透視' }
            ]
        },
        {
            id: 'mod-report',
            title: '📊 【報表專區】',
            children: [
                { id: 'f-9', name: '【報表專區】業績與市佔表現總覽', featureName: '報表專區業績與市佔' },
                { id: 'f-10', name: '【報表專區】營業員手續與分潤', featureName: '營業員手續統計與分潤設定' }
            ]
        },
        {
            id: 'mod-tools',
            title: '🛠️ 【工具】',
            children: [
                { id: 'f-11', name: '【工具】組織權限管轄與功能管理', featureName: '組織權限管轄與功能管理' },
                { id: 'f-12', name: '【工具】代理人設定與角色權限', featureName: '代理人設定與角色權限' }
            ]
        }
    ];

    function renderMatrixTree() {
        if (!matrixTreeContainer) return;
        matrixTreeContainer.innerHTML = '';

        matrixTreeStructure.forEach(mod => {
            const modWrapper = document.createElement('div');
            modWrapper.className = 'tree-node-wrapper';

            modWrapper.innerHTML = `
                <div class="tree-node-item level-0" data-mod-id="${mod.id}">
                    <span class="tree-toggle-arrow expanded">▶</span>
                    <input type="checkbox" class="tree-cb level-0-cb" checked>
                    <span class="tree-node-label">${mod.title}</span>
                </div>
                <div class="tree-children-container open">
                    ${mod.children.map(feat => `
                        <div class="tree-node-item level-1">
                            <span style="width:18px; display:inline-block;"></span>
                            <input type="checkbox" class="tree-cb leaf-cb" data-feature-name="${feat.featureName}" checked>
                            <span class="tree-node-label">${feat.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            matrixTreeContainer.appendChild(modWrapper);
        });

        matrixTreeContainer.querySelectorAll('.tree-toggle-arrow').forEach(arrow => {
            arrow.addEventListener('click', (e) => {
                e.stopPropagation();
                arrow.classList.toggle('expanded');
                const childContainer = arrow.closest('.tree-node-item').nextElementSibling;
                if (childContainer) {
                    childContainer.classList.toggle('open');
                }
            });
        });

        matrixTreeContainer.querySelectorAll('.level-0-cb').forEach(parentCb => {
            parentCb.addEventListener('change', () => {
                const isChecked = parentCb.checked;
                parentCb.indeterminate = false;
                const wrapper = parentCb.closest('.tree-node-wrapper');
                if (wrapper) {
                    wrapper.querySelectorAll('.tree-cb').forEach(cb => {
                        cb.checked = isChecked;
                        cb.indeterminate = false;
                    });
                }
                syncTreeParentStates();
                updateMatrixTreeFilter();
            });
        });

        matrixTreeContainer.querySelectorAll('.leaf-cb').forEach(leafCb => {
            leafCb.addEventListener('change', () => {
                syncTreeParentStates();
                updateMatrixTreeFilter();
            });
        });
    }

    function syncTreeParentStates() {
        if (!matrixTreeContainer) return;

        matrixTreeContainer.querySelectorAll('.level-0').forEach(modItem => {
            const modCb = modItem.querySelector('.level-0-cb');
            const childContainer = modItem.nextElementSibling;
            if (!modCb || !childContainer) return;

            const leafCbs = childContainer.querySelectorAll('.leaf-cb');
            const checkedLeafs = childContainer.querySelectorAll('.leaf-cb:checked');

            if (checkedLeafs.length === leafCbs.length && leafCbs.length > 0) {
                modCb.checked = true;
                modCb.indeterminate = false;
            } else if (checkedLeafs.length > 0) {
                modCb.checked = false;
                modCb.indeterminate = true;
            } else {
                modCb.checked = false;
                modCb.indeterminate = false;
            }
        });

        if (matrixTreeCbSelectAll) {
            const allLeafs = matrixTreeContainer.querySelectorAll('.leaf-cb');
            const checkedLeafs = matrixTreeContainer.querySelectorAll('.leaf-cb:checked');
            matrixTreeCbSelectAll.checked = (allLeafs.length > 0 && checkedLeafs.length === allLeafs.length);
            matrixTreeCbSelectAll.indeterminate = (checkedLeafs.length > 0 && checkedLeafs.length < allLeafs.length);
        }
    }

    function updateMatrixTreeFilter() {
        const checkedLeafs = matrixTreeContainer?.querySelectorAll('.leaf-cb:checked') || [];
        const totalLeafs = matrixTreeContainer?.querySelectorAll('.leaf-cb') || [];
        const selectedFeatures = new Set(Array.from(checkedLeafs).map(cb => cb.getAttribute('data-feature-name')));

        const query = (document.getElementById('matrix-search-input')?.value || '').trim().toLowerCase();

        const rows = document.querySelectorAll('#matrix-main-table tr.feature-row');
        rows.forEach(row => {
            const featureName = row.getAttribute('data-feature-name') || '';
            const text = row.innerText.toLowerCase();

            const matchesTree = (selectedFeatures.size === 0) || selectedFeatures.has(featureName);
            const matchesQuery = !query || text.includes(query);

            if (matchesTree && matchesQuery) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        if (matrixTreeLabel) {
            if (checkedLeafs.length === 0 || checkedLeafs.length === totalLeafs.length) {
                matrixTreeLabel.textContent = '🌲 選擇功能模組 (全部)';
            } else if (checkedLeafs.length === 1) {
                const singleName = checkedLeafs[0].closest('.tree-node-item')?.querySelector('.tree-node-label')?.textContent || '';
                matrixTreeLabel.textContent = `🌲 ${singleName.substring(0, 12)}...`;
            } else {
                matrixTreeLabel.textContent = `🌲 已選 ${checkedLeafs.length}/${totalLeafs.length} 個子功能`;
            }
        }
    }

    matrixTreeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        matrixTreePanel?.classList.toggle('show');
        matrixTreeBtn?.classList.toggle('active');
    });

    document.getElementById('btn-matrix-select-all')?.addEventListener('click', () => {
        document.querySelectorAll('#matrix-main-table input[type="checkbox"]').forEach(cb => cb.checked = true);
        updatePermissionCounters();
    });

    document.getElementById('btn-matrix-clear-all')?.addEventListener('click', () => {
        document.querySelectorAll('#matrix-main-table input[type="checkbox"]').forEach(cb => cb.checked = false);
        updatePermissionCounters();
    });

    document.getElementById('btn-matrix-reset-default')?.addEventListener('click', () => {
        document.querySelectorAll('#matrix-main-table tr.feature-row').forEach(row => {
            const cbRead = row.querySelector('.cb-read');
            const cbEdit = row.querySelector('.cb-edit');
            const cbDelete = row.querySelector('.cb-delete');
            const cbExport = row.querySelector('.cb-export');
            if (cbRead) cbRead.checked = true;
            if (cbEdit) cbEdit.checked = true;
            if (cbDelete) cbDelete.checked = false;
            if (cbExport) cbExport.checked = true;
        });
        updatePermissionCounters();
    });

    const matrixSearchInput = document.getElementById('matrix-search-input');
    matrixSearchInput?.addEventListener('input', updateMatrixTreeFilter);

    renderMatrixTree();

    // ----------------------------------------------------
    // User & Agent Filtering Handlers
    // ----------------------------------------------------
    const userSearchInput = document.getElementById('user-search-input');
    const userRoleFilter = document.getElementById('user-role-filter');
    const userScopeFilter = document.getElementById('user-scope-filter');
    const userStatusFilter = document.getElementById('user-status-filter');

    function filterUserTable() {
        const query = userSearchInput?.value.trim().toLowerCase() || '';
        const role = userRoleFilter?.value || 'ALL';
        const scope = userScopeFilter?.value || 'ALL';
        const status = userStatusFilter?.value || 'ALL';

        const rows = document.querySelectorAll('#user-table tbody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const isInactive = row.querySelector('.tag-inactive') !== null;
            
            let matchesQuery = !query || text.includes(query);
            let matchesStatus = (status === 'ALL') || 
                                (status === 'ACTIVE' && !isInactive) || 
                                (status === 'INACTIVE' && isInactive);
            let matchesRole = (role === 'ALL') || text.includes(role === 'SALES' ? '營業員' : role === 'MANAGER' ? '主管' : role === 'TRADER' ? '交易員' : '管理員');
            let matchesScope = (scope === 'ALL') || 
                               (scope === 'COMPANY' && text.includes('全公司')) ||
                               (scope === 'DOMESTIC' && text.includes('內法業務區')) ||
                               (scope === 'FOREIGN' && text.includes('外法業務區')) ||
                               (scope === 'PERSONAL' && text.includes('僅限本人'));

            if (matchesQuery && matchesStatus && matchesRole && matchesScope) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    userSearchInput?.addEventListener('input', filterUserTable);
    userRoleFilter?.addEventListener('change', filterUserTable);
    userScopeFilter?.addEventListener('change', filterUserTable);
    userStatusFilter?.addEventListener('change', filterUserTable);

    // ----------------------------------------------------
    // User Management Modal & Dynamic Save Logic
    // ----------------------------------------------------
    let currentEditingUserRow = null;

    function openUserModal(tr = null) {
        currentEditingUserRow = tr;
        const modalTitle = document.getElementById('modal-user-title');
        const inputName = document.getElementById('input-user-name');
        const inputEmpId = document.getElementById('input-user-empid');
        const inputEip = document.getElementById('input-user-eip');
        const inputEmail = document.getElementById('input-user-email');
        const inputDept = document.getElementById('input-user-dept');
        const inputTitle = document.getElementById('input-user-title');
        const inputScope = document.getElementById('input-user-scope');
        const inputActive = document.getElementById('input-user-active');

        if (tr) {
            const userName = tr.querySelector('td strong')?.textContent.trim() || '使用者編輯';
            const userEmpId = tr.querySelector('td span')?.textContent.trim().replace(/[()]/g, '') || 'A1234';
            const userEip = tr.querySelector('td div')?.textContent.trim().split('@')[0] || 'sang.chang';
            const deptText = tr.querySelectorAll('td')[1]?.querySelector('div:first-child')?.textContent.trim() || '內法業務一部';
            const titleText = tr.querySelectorAll('td')[1]?.querySelector('div:last-child')?.textContent.trim() || '資深營業員';
            const isInactive = tr.querySelector('.tag-inactive') !== null;

            if (modalTitle) modalTitle.textContent = `編輯使用者 - ${userName} (${userEmpId})`;
            if (inputName) inputName.value = userName;
            if (inputEmpId) inputEmpId.value = userEmpId;
            if (inputEip) inputEip.value = userEip;
            if (inputEmail) inputEmail.value = `${userEip}@fubon.com`;
            if (inputDept) inputDept.value = deptText;
            if (inputTitle) inputTitle.value = titleText;
            if (inputActive) inputActive.checked = !isInactive;
        } else {
            if (modalTitle) modalTitle.textContent = '新增使用者帳號';
            if (inputName) inputName.value = '';
            if (inputEmpId) inputEmpId.value = 'A' + Math.floor(1000 + Math.random() * 9000);
            if (inputEip) inputEip.value = '';
            if (inputEmail) inputEmail.value = '';
            if (inputDept) inputDept.value = '內法業務一部';
            if (inputTitle) inputTitle.value = '營業員';
            if (inputActive) inputActive.checked = true;
        }
        showModal('modal-user-manage');
    }

    document.getElementById('btn-close-user-x')?.addEventListener('click', () => hideModal('modal-user-manage'));
    document.getElementById('btn-cancel-user')?.addEventListener('click', () => hideModal('modal-user-manage'));
    document.getElementById('btn-save-user')?.addEventListener('click', () => {
        const name = document.getElementById('input-user-name')?.value.trim();
        const empId = document.getElementById('input-user-empid')?.value.trim() || 'A9999';
        const eip = document.getElementById('input-user-eip')?.value.trim() || 'user';
        const dept = document.getElementById('input-user-dept')?.value.trim() || '業務部';
        const title = document.getElementById('input-user-title')?.value.trim() || '營業員';
        const scopeVal = document.getElementById('input-user-scope')?.value || 'DOMESTIC';
        const isActive = document.getElementById('input-user-active')?.checked ?? true;

        if (!name) {
            alert('請輸入使用者姓名！');
            return;
        }

        const scopeMap = {
            'COMPANY': { class: 'cat-home', text: '🌐 全公司跨區' },
            'DOMESTIC': { class: 'cat-inquiry', text: '🏢 內法業務區' },
            'FOREIGN': { class: 'cat-report', text: '🏢 外法業務區' },
            'PERSONAL': { class: 'cat-tools', text: '👤 僅限本人客戶' }
        };
        const scopeInfo = scopeMap[scopeVal] || scopeMap['DOMESTIC'];

        const checkedRoles = Array.from(document.querySelectorAll('input[name="user-roles"]:checked')).map(cb => {
            const roleLabels = { 'SALES': '營業員', 'MANAGER': '主管', 'TRADER': '交易員', 'ANALYST': '投顧專員' };
            return roleLabels[cb.value] || '營業員';
        });

        const rolesHtml = checkedRoles.length > 0 
            ? checkedRoles.map(r => `<span class="perm-pill">${r}</span>`).join(' ')
            : `<span class="perm-pill" style="opacity:0.6;">(無角色)</span>`;

        if (currentEditingUserRow) {
            const nameCell = currentEditingUserRow.querySelectorAll('td')[0];
            if (nameCell) {
                nameCell.innerHTML = `
                    <strong>${name}</strong> <span style="font-size:12px; color:var(--text-muted);">(${empId})</span>
                    <div style="font-size:12px; color:#0369A1; font-family:monospace;">${eip}@fubon.com</div>
                `;
            }

            const deptCell = currentEditingUserRow.querySelectorAll('td')[1];
            if (deptCell) {
                deptCell.innerHTML = `
                    <div style="font-weight:600; font-size:13.5px;">${dept}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${title}</div>
                `;
            }

            const roleCell = currentEditingUserRow.querySelectorAll('td')[2];
            if (roleCell) roleCell.innerHTML = `<div class="perm-summary-pills">${rolesHtml}</div>`;

            const scopeCell = currentEditingUserRow.querySelectorAll('td')[3];
            if (scopeCell) scopeCell.innerHTML = `<span class="category-badge ${scopeInfo.class}">${scopeInfo.text}</span>`;

            const statusCell = currentEditingUserRow.querySelectorAll('td')[6];
            if (statusCell) {
                statusCell.innerHTML = isActive 
                    ? '<span class="tag-active">● 啟用</span>' 
                    : '<span class="tag-inactive">● 停用</span>';
            }

            alert(`✅ 使用者「${name} (${empId})」帳號資料與資料權限範圍已成功更新！`);
        } else {
            const tbody = document.querySelector('#user-table tbody');
            if (tbody) {
                const newTr = document.createElement('tr');
                const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '/');

                newTr.innerHTML = `
                    <td>
                        <strong>${name}</strong> <span style="font-size:12px; color:var(--text-muted);">(${empId})</span>
                        <div style="font-size:12px; color:#0369A1; font-family:monospace;">${eip}@fubon.com</div>
                    </td>
                    <td>
                        <div style="font-weight:600; font-size:13.5px;">${dept}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${title}</div>
                    </td>
                    <td>
                        <div class="perm-summary-pills">${rolesHtml}</div>
                    </td>
                    <td style="text-align:center;">
                        <span class="category-badge ${scopeInfo.class}">${scopeInfo.text}</span>
                    </td>
                    <td style="text-align:center;">
                        <span style="font-size:12.5px; color:#15803D; font-weight:600;">🟢 正常出勤</span>
                    </td>
                    <td style="text-align:center; font-size:12px; color:var(--text-muted);">${todayStr}<br>管理員 A</td>
                    <td style="text-align:center;">${isActive ? '<span class="tag-active">● 啟用</span>' : '<span class="tag-inactive">● 停用</span>'}</td>
                    <td style="text-align:center;">
                        <button class="icon-btn-secondary trigger-user-manage" title="編輯使用者資料與權限">📝</button>
                    </td>
                `;
                tbody.appendChild(newTr);
            }
            alert(`✅ 已成功新增使用者帳號「${name} (${empId})」！其多重角色與資料範圍已生效。`);
        }

        hideModal('modal-user-manage');
    });

    // ----------------------------------------------------
    // Agent Management Modal & Dynamic Save Logic
    // ----------------------------------------------------
    let currentEditingAgentRow = null;

    function openAgentModal(tr = null) {
        currentEditingAgentRow = tr;
        showModal('modal-agent-manage');
    }

    document.getElementById('btn-close-agent-x')?.addEventListener('click', () => hideModal('modal-agent-manage'));
    document.getElementById('btn-cancel-agent')?.addEventListener('click', () => hideModal('modal-agent-manage'));
    document.getElementById('btn-save-agent')?.addEventListener('click', () => {
        const delegatorSelect = document.getElementById('input-agent-delegator');
        const assigneeSelect = document.getElementById('input-agent-assignee');
        const delegatorText = delegatorSelect?.options[delegatorSelect.selectedIndex]?.text || '李美玲 (B5678)';
        const assigneeText = assigneeSelect?.options[assigneeSelect.selectedIndex]?.text || '王小明 (D3456)';
        const withData = document.getElementById('switch-agent-datascope')?.checked ?? true;
        const startVal = document.getElementById('input-agent-start')?.value.replace('T', ' ') || '2026/02/10 08:00';
        const endVal = document.getElementById('input-agent-end')?.value.replace('T', ' ') || '2026/02/20 18:00';

        const tbody = document.querySelector('#agent-table tbody');
        if (tbody) {
            const newTr = document.createElement('tr');
            newTr.innerHTML = `
                <td>
                    <strong>${delegatorText.split(' ')[0]}</strong> <span style="font-size:12px; color:var(--text-muted);">(${delegatorText.split(' ')[1] || ''})</span>
                    <div style="font-size:12px; color:var(--text-muted);">${delegatorText.split('/')[1] || '主管'}</div>
                </td>
                <td>
                    <strong>${assigneeText.split(' ')[0]}</strong> <span style="font-size:12px; color:var(--text-muted);">(${assigneeText.split(' ')[1] || ''})</span>
                    <div style="font-size:12px; color:#0369A1;">${assigneeText.split('/')[1] || '營業員'}</div>
                </td>
                <td>
                    <div class="perm-summary-pills">
                        <span class="perm-pill">全權角色代理</span>
                        ${withData ? '<span class="perm-pill">🌐 開放客戶資料</span>' : ''}
                    </div>
                </td>
                <td style="text-align:center;">
                    <span class="category-badge ${withData ? 'cat-home' : 'cat-tools'}">${withData ? '🌐 包含客戶資料' : '🔒 僅功能代理'}</span>
                </td>
                <td style="text-align:center; font-size:12px; color:var(--text-muted);">
                    ${startVal}<br>至 ${endVal}
                </td>
                <td style="text-align:center;">
                    <span style="font-size:12px; color:#C2410C; background:#FFEDD5; padding:2px 8px; border-radius:10px; font-weight:600; display:inline-block;">🟢 代理生效中</span>
                </td>
                <td style="text-align:center;">
                    <button class="btn btn-secondary trigger-agent-manage" style="padding:4px 10px; font-size:12px;">📝 編輯</button>
                </td>
            `;
            tbody.insertBefore(newTr, tbody.firstChild);
        }

        alert(`✅ 已成功新增「${delegatorText.split(' ')[0]}」至「${assigneeText.split(' ')[0]}」之代理人授權排程！系統 Log 將自動雙標記資安軌跡。`);
        hideModal('modal-agent-manage');
    });

    // ----------------------------------------------------
    // Dynamic Table Column Sorting (Sortable Headers)
    // ----------------------------------------------------
    document.querySelectorAll('.sortable-header').forEach(header => {
        let asc = true;
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const table = header.closest('table');
            if (!table) return;
            const tbody = table.querySelector('tbody');
            if (!tbody) return;

            const th = header.closest('th');
            const colIndex = Array.from(th.parentNode.children).indexOf(th);

            const rows = Array.from(tbody.querySelectorAll('tr'));
            rows.sort((a, b) => {
                const cellA = a.children[colIndex]?.innerText.trim() || '';
                const cellB = b.children[colIndex]?.innerText.trim() || '';
                return asc ? cellA.localeCompare(cellB, 'zh-TW', { numeric: true }) : cellB.localeCompare(cellA, 'zh-TW', { numeric: true });
            });

            asc = !asc;
            rows.forEach(r => tbody.appendChild(r));

            // Update arrow UI
            table.querySelectorAll('.sortable-header span').forEach(s => s.textContent = '↑↓');
            header.querySelector('span').textContent = asc ? '↑' : '↓';
        });
    });

    // ----------------------------------------------------
    // Unified Global Event Delegation for Dynamic Trigger Buttons
    // ----------------------------------------------------
    document.addEventListener('click', (e) => {
        // Top Level Tabs Delegation
        const tabBtn = e.target.closest('#tab-role-mode, #tab-user-mode, #tab-agent-mode');
        if (tabBtn) {
            e.preventDefault();
            if (tabBtn.id === 'tab-role-mode') switchTab('roles');
            else if (tabBtn.id === 'tab-user-mode') switchTab('users');
            else if (tabBtn.id === 'tab-agent-mode') switchTab('agent');
            return;
        }

        // Role Manage Trigger (+ 新增角色 / 📝)
        const roleBtn = e.target.closest('.trigger-role-manage, .trigger-role-manage-dyn');
        if (roleBtn) {
            e.preventDefault();
            const tr = roleBtn.closest('tr');
            openRoleModal(tr);
            return;
        }

        // Permission Matrix Trigger (🔑 權限設定)
        const permBtn = e.target.closest('.trigger-permissions-manage');
        if (permBtn) {
            e.preventDefault();
            const targetRoleBadge = document.getElementById('target-role-badge');
            const roleName = permBtn.getAttribute('data-role-name') || permBtn.closest('tr')?.querySelector('td strong')?.textContent.trim() || '主管';
            const tr = permBtn.closest('tr');
            const catVal = tr?.getAttribute('data-category') || 'TOOLS';

            if (targetRoleBadge) targetRoleBadge.textContent = roleName;
            
            const catMap = {
                'HOME': 'cat-home',
                'MARKETING': 'cat-marketing',
                'INQUIRY': 'cat-inquiry',
                'REPORT': 'cat-report',
                'TOOLS': 'cat-tools'
            };
            if (targetRoleBadge) targetRoleBadge.className = `category-badge ${catMap[catVal] || 'cat-tools'}`;

            loadPermissionsToMatrix(roleName, catVal);
            updatePermissionCounters();
            showModal('modal-permissions-manage');
            return;
        }

        // User Manage Trigger (+ 新增使用者 / 📝)
        const userBtn = e.target.closest('.trigger-user-manage');
        if (userBtn) {
            e.preventDefault();
            const tr = userBtn.closest('tr');
            const modalTitle = document.getElementById('modal-user-title');
            if (tr) {
                const userName = tr.querySelector('td strong')?.textContent.trim() || '張大明';
                const userEmpId = tr.querySelector('td span')?.textContent.trim().replace(/[()]/g, '') || 'A1234';
                if (modalTitle) modalTitle.textContent = `編輯使用者 - ${userName} (${userEmpId})`;
                const inputName = document.getElementById('input-user-name');
                if (inputName) inputName.value = userName;
                const inputEmp = document.getElementById('input-user-empid');
                if (inputEmp) inputEmp.value = userEmpId;
            } else {
                if (modalTitle) modalTitle.textContent = '新增使用者帳號';
                const inputName = document.getElementById('input-user-name');
                if (inputName) inputName.value = '';
                const inputEmp = document.getElementById('input-user-empid');
                if (inputEmp) inputEmp.value = '';
            }
            showModal('modal-user-manage');
            return;
        }

        // Agent Manage Trigger (+ 新增代理設定 / 📝)
        const agentBtn = e.target.closest('.trigger-agent-manage');
        if (agentBtn) {
            e.preventDefault();
            showModal('modal-agent-manage');
            return;
        }
    });

    // Initialize Dropdown Options
    updateRoleDropdownOptions();

    // ----------------------------------------------------
    // Hash Navigation Handler
    // ----------------------------------------------------
    function handleHashChange() {
        const hash = window.location.hash;
        if (!hash) return;
        if (hash === '#roles') {
            switchTab('roles');
            window.scrollTo(0, 0);
        } else if (hash === '#users') {
            switchTab('users');
            window.scrollTo(0, 0);
        } else if (hash === '#agent') {
            switchTab('agent');
            window.scrollTo(0, 0);
        }
    }
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPermissions);
} else {
    initPermissions();
}
