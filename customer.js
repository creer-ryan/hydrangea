document.addEventListener('DOMContentLoaded', () => {

    const panelList = document.getElementById('panel-customer-list');
    const panelDetail = document.getElementById('panel-customer-detail');

    const showDetailView = () => {
        panelList.style.display = 'none';
        panelDetail.style.display = 'block';
        // Hide/Show correct inner tab (default to '客戶檢視')
        document.querySelectorAll('.inner-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.inner-content-panel').forEach(p => p.classList.remove('active'));
        
        const defaultTab = document.querySelector('[data-target="inner-client-view"]');
        if(defaultTab) defaultTab.classList.add('active');
        const defaultPanel = document.getElementById('inner-client-view');
        if(defaultPanel) defaultPanel.classList.add('active');
    };

    const showListView = () => {
        panelDetail.style.display = 'none';
        panelList.style.display = 'block';
    };

    // Firm name links to Details
    document.querySelectorAll('.trigger-firm-detail').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open('customer.html#single-firm', '_blank');
        });
    });

    document.querySelectorAll('.btn-back-to-list').forEach(btn => {
        btn.addEventListener('click', showListView);
    });

    // Edit Firm Modal
    const editFirmBtns = document.querySelectorAll('.trigger-edit-firm');
    const modalEditFirm = document.getElementById('modal-edit-firm');
    const btnCancelFirm = document.getElementById('btn-cancel-firm');
    const btnSaveFirm = document.getElementById('btn-save-firm');

    const openEditFirmModal = (e) => {
        e.stopPropagation();
        if(modalEditFirm) modalEditFirm.classList.add('show');
    };

    const closeEditFirmModal = () => {
        if(modalEditFirm) modalEditFirm.classList.remove('show');
    };

    editFirmBtns.forEach(btn => btn.addEventListener('click', openEditFirmModal));
    if(btnCancelFirm) btnCancelFirm.addEventListener('click', closeEditFirmModal);
    if(btnSaveFirm) btnSaveFirm.addEventListener('click', () => {
        alert('法人戶註記均已成功儲存！');
        closeEditFirmModal();
    });

    // Top Level Tabs (Firm vs Client Mode)
    const tabFirmMode = document.getElementById('tab-firm-mode');
    const tabClientMode = document.getElementById('tab-client-mode');
    const wrapperFirm = document.getElementById('wrapper-firm-mode');
    const wrapperClient = document.getElementById('wrapper-client-mode');
    const pageTitle = document.getElementById('customer-page-title');

    const switchTopMode = (mode) => {
        if (mode === 'firm') {
            tabFirmMode.classList.add('active');
            tabClientMode.classList.remove('active');
            wrapperFirm.style.display = 'block';
            wrapperClient.style.display = 'none';
            if(pageTitle) pageTitle.textContent = '客戶綜合查詢 - 總歸戶/法人戶檢視';
            // Also reset to list view
            showListView();
        } else {
            tabClientMode.classList.add('active');
            tabFirmMode.classList.remove('active');
            wrapperClient.style.display = 'block';
            wrapperFirm.style.display = 'none';
            if(pageTitle) pageTitle.textContent = '客戶綜合查詢 - 單一客戶檢視';
            // Also reset to client list view
            showClientListView();
        }
    };

    if (tabFirmMode) tabFirmMode.addEventListener('click', () => switchTopMode('firm'));
    if (tabClientMode) tabClientMode.addEventListener('click', () => switchTopMode('client'));

    // Single Client Logic
    const panelClientList = document.getElementById('panel-single-client-list');
    const panelClientDetail = document.getElementById('panel-single-client-detail');

    const showClientDetailView = () => {
        panelClientList.style.display = 'none';
        panelClientDetail.style.display = 'block';
        
        // Default to Inner Acct view
        document.querySelectorAll('.inner-client-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.client-inner-panel').forEach(p => p.classList.remove('active'));
        
        const defaultTab = document.querySelector('[data-target="inner-client-acct-view"]');
        if(defaultTab) defaultTab.classList.add('active');
        const defaultPanel = document.getElementById('inner-client-acct-view');
        if(defaultPanel) defaultPanel.classList.add('active');
    };

    const showClientListView = () => {
        panelClientDetail.style.display = 'none';
        panelClientList.style.display = 'block';
    };

    document.querySelectorAll('.trigger-single-client-detail').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open('customer.html#single-client', '_blank');
        });
    });

    document.querySelectorAll('.btn-back-to-client-list').forEach(btn => {
        btn.addEventListener('click', showClientListView);
    });

    // Inner Tabs Logic (Both Firm and Client wrappers use inner-tab-btn so handle generically or independently)
    const innerTabBtns = document.querySelectorAll('.inner-tab-btn');

    innerTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find parent detail panel to isolate logic
            const detailPanel = e.target.closest('#panel-customer-detail, #panel-single-client-detail');
            if(!detailPanel) return;
            
            const localBtns = detailPanel.querySelectorAll('.inner-tab-btn');
            const localPanels = detailPanel.querySelectorAll('.inner-content-panel');
            
            localBtns.forEach(b => b.classList.remove('active'));
            localPanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetPanel = document.getElementById(targetId);
            if(targetPanel) targetPanel.classList.add('active');
        });
    });

    // Custom Group Management Logic
    const panelCustomGroupsList = document.getElementById('panel-custom-groups-list');
    const panelCustomGroupDetail = document.getElementById('panel-custom-group-detail');

    const btnManageGroups = document.getElementById('btn-manage-groups');
    if(btnManageGroups) {
        btnManageGroups.addEventListener('click', () => {
            panelClientList.style.display = 'none';
            panelCustomGroupsList.style.display = 'block';
        });
    }

    document.querySelectorAll('.btn-back-to-client-list').forEach(btn => {
        btn.addEventListener('click', () => {
            if(panelCustomGroupsList) panelCustomGroupsList.style.display = 'none';
            showClientListView();
        });
    });

    document.querySelectorAll('.trigger-custom-group-detail').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            panelCustomGroupsList.style.display = 'none';
            panelCustomGroupDetail.style.display = 'block';
        });
    });

    document.querySelectorAll('.btn-back-to-groups-list').forEach(btn => {
        btn.addEventListener('click', () => {
            panelCustomGroupDetail.style.display = 'none';
            panelCustomGroupsList.style.display = 'block';
        });
    });

    // Custom Group Modals
    const modalGroupManage = document.getElementById('modal-group-manage');
    const modalAddToGroup = document.getElementById('modal-add-to-group');
    const modalAddClientToGroup = document.getElementById('modal-add-client-to-group');

    const showModal = (modalNode) => { if(modalNode) modalNode.classList.add('show'); };
    const hideModal = (modalNode) => { if(modalNode) modalNode.classList.remove('show'); };

    // Group Create/Edit Modal
    document.querySelectorAll('.trigger-add-new-group, .trigger-edit-group').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showModal(modalGroupManage);
        });
    });
    const btnCancelGroupManage = document.getElementById('btn-cancel-group-manage');
    const btnSaveGroupManage = document.getElementById('btn-save-group-manage');
    if(btnCancelGroupManage) btnCancelGroupManage.addEventListener('click', () => hideModal(modalGroupManage));
    if(btnSaveGroupManage) btnSaveGroupManage.addEventListener('click', () => { alert('群組儲存成功！'); hideModal(modalGroupManage); });

    // Add To Group Modal (from Client List)
    document.querySelectorAll('.trigger-add-to-group, .trigger-add-to-group-global').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showModal(modalAddToGroup);
        });
    });
    const btnCancelAddToGroup = document.getElementById('btn-cancel-add-to-group');
    const btnSaveAddToGroup = document.getElementById('btn-save-add-to-group');
    if(btnCancelAddToGroup) btnCancelAddToGroup.addEventListener('click', () => hideModal(modalAddToGroup));
    if(btnSaveAddToGroup) btnSaveAddToGroup.addEventListener('click', () => { alert('加入群組成功！'); hideModal(modalAddToGroup); });

    // Add Client To Specific Group Modal (inside Group Detail)
    const btnAddClientToGroup = document.getElementById('btn-add-client-to-group');
    if(btnAddClientToGroup) btnAddClientToGroup.addEventListener('click', () => showModal(modalAddClientToGroup));
    const btnCancelClientToGroup = document.getElementById('btn-cancel-client-to-group');
    const btnSaveClientToGroup = document.getElementById('btn-save-client-to-group');
    if(btnCancelClientToGroup) btnCancelClientToGroup.addEventListener('click', () => hideModal(modalAddClientToGroup));
    if(btnSaveClientToGroup) btnSaveClientToGroup.addEventListener('click', () => { alert('新增客戶至群組成功！'); hideModal(modalAddClientToGroup); });

    // ========================================
    // Handle URL hash for direct tab navigation
    // e.g. customer.html#firm or customer.html#client
    // ========================================
    const applyHashTab = () => {
        const hash = window.location.hash;
        if (hash === '#client' || hash === '#single-client') {
            switchTopMode('client');
            if (hash === '#single-client') {
                showClientDetailView();
            }
        } else {
            // Default: firm mode (also covers #firm, #single-firm)
            switchTopMode('firm');
            if (hash === '#single-firm') {
                showDetailView();
            }
        }
    };

    // Apply on initial load
    applyHashTab();

    // Also handle if user navigates via hash change without reload
    window.addEventListener('hashchange', applyHashTab);

});
