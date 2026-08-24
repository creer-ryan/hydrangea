document.addEventListener('DOMContentLoaded', () => {
    console.log("CRM UI Version Loaded: 20260630_1643");
    try {

    // ----------------------------------------------------
    // LocalStorage Data Management
    // ----------------------------------------------------
    const safeJsonParse = (key, fallback = []) => {
        try {
            const val = localStorage.getItem(key);
            if (!val) return fallback;
            return JSON.parse(val);
        } catch (e) {
            console.warn(`Failed to parse localStorage key "${key}":`, e);
            return fallback;
        }
    };

    const parseAllQueryParams = () => {
        let qParams = {};
        const safeDecode = (s) => {
            if (!s) return '';
            try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return s; }
        };

        const parseStr = (str) => {
            if (!str) return;
            if (str.startsWith('?') || str.startsWith('#')) str = str.substring(1);
            if (str.includes('?')) str = str.split('?')[1];
            str.split('&').forEach(p => {
                const pair = p.split('=');
                if (pair[0]) qParams[pair[0]] = safeDecode(pair[1] || '');
            });
        };

        if (window.location.search) parseStr(window.location.search);
        if (window.location.hash) parseStr(window.location.hash);
        return qParams;
    };
    
    // Default mock services database matching the table in marketing.html
    const DEFAULT_SERVICES = [
        {
            id: 'service-1',
            date: '2025/08/10',
            coverage: 'Jefferies/Fubon',
            analyst: 'Sherman Shang',
            sales: 'Charlie Zhao',
            firm: 'FMR',
            client: 'Elizabeth Li',
            type: 'One off client meeting (video)',
            method: 'Incoming call',
            duration: '15',
            format: '1x1',
            time: '10:05',
            email: 'Elizabeth.li@FMR.com',
            topic: 'TSMC 2Q earnings',
            interest: '2330 TT',
            analystEmail: 'Sherman.shang@fubon.com'
        },
        {
            id: 'service-2',
            date: '2025/08/11',
            coverage: 'Fubon',
            analyst: 'Sherman Shang',
            sales: 'Ann Liao',
            firm: 'Oasis',
            client: 'Jonas Wong',
            type: 'Bespoke client request',
            method: 'Email ideas',
            duration: '15',
            format: '1x1',
            time: '11:00',
            email: '',
            topic: 'MTK ASICs potential',
            interest: '2454 TT',
            analystEmail: ''
        },
        {
            id: 'service-3',
            date: '2025/08/11',
            coverage: 'Daishin/Fubon',
            analyst: 'Sherman Shang',
            sales: 'Ken Lee',
            firm: 'AP Asset',
            client: 'Chole Kim',
            type: 'One off client meeting (video)',
            method: 'Incoming call',
            duration: '30',
            format: '1x1',
            time: '9:00',
            email: '',
            topic: 'TSMC GM question',
            interest: '2330 TT',
            analystEmail: ''
        }
    ];

    // Analysts Database Management
    const DEFAULT_ANALYSTS = [
        { id: 'analyst-1', zhName: '王一', enName: 'Sherman', phone: '02-8789-8888 ext 1234', email: 'Sherman.shang@fubon.com', sector: '半導體', coverage: 'SEMI' },
        { id: 'analyst-2', zhName: '王二', enName: 'Titan', phone: '02-8789-8888 ext 5678', email: 'titan.wang@fubon.com', sector: '金融', coverage: 'FINANCE' },
        { id: 'analyst-3', zhName: '王三', enName: 'Rita', phone: '02-8789-8888 ext 9012', email: 'rita.wu@fubon.com', sector: '航運', coverage: 'SHIPPING' }
    ];

    let customAnalysts = safeJsonParse('crm_custom_analysts', []);
    
    const getAllAnalysts = () => {
        return [...DEFAULT_ANALYSTS, ...customAnalysts];
    };

    // Load custom services (clearing any legacy mock database ID conflicts)
    let rawCustomServices = safeJsonParse('crm_custom_services', []);
    let customServices = rawCustomServices.filter(s => s && s.id && s.id !== 'service-1' && s.id !== 'service-2' && s.id !== 'service-3');
    if (rawCustomServices.length !== customServices.length) {
        localStorage.setItem('crm_custom_services', JSON.stringify(customServices));
    }
    // Load pinned service IDs (by default, pin service-1)
    if (!localStorage.getItem('crm_pinned_services_ids')) {
        localStorage.setItem('crm_pinned_services_ids', JSON.stringify(['service-1']));
    }
    let pinnedServiceIds = safeJsonParse('crm_pinned_services_ids', ['service-1']);

    // Helper to get all services (mock + custom)
    const getAllServices = () => {
        return [...DEFAULT_SERVICES, ...customServices].filter(s => s && s.id);
    };

    // Save pinned services complete details to localStorage for the homepage calendar to consume easily
    const syncPinnedServicesDetailsToHome = () => {
        const allServices = getAllServices();
        const pinnedDetails = allServices.filter(s => pinnedServiceIds.includes(s.id));
        localStorage.setItem('crm_pinned_services', JSON.stringify(pinnedDetails));
        
        // Also update local storage ids list
        localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedServiceIds));
    };

    // Always sync pinned services details on load to guarantee consistency with updated dates
    syncPinnedServicesDetailsToHome();

    // Render Pin stars in the UI
    const updatePinStarsUI = () => {
        document.querySelectorAll('.service-pin-btn').forEach(btn => {
            const id = btn.getAttribute('data-id');
            if (pinnedServiceIds.includes(id)) {
                btn.textContent = '★';
                btn.style.color = '#f1c40f';
            } else {
                btn.textContent = '☆';
                btn.style.color = '#94A3B8';
            }
        });
    };

    // ----------------------------------------------------
    // Tab Logic (Refactored for dynamic tabs)
    // ----------------------------------------------------
    const mainTabsContainer = document.getElementById('main-marketing-tabs');
    const dynamicPanelsContainer = document.getElementById('dynamic-panels-container');
    const pageTitle = document.getElementById('marketing-page-title');

    // Helper to deactivate all tabs and panels (both static and dynamic)
    const deactivateAllTabsAndPanels = () => {
        document.querySelectorAll('.marketing-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.marketing-content-panel').forEach(p => p.classList.remove('active'));
    };

    // Level-1 (Service / Event) Tab Selector Hook
    const btnServiceGroup = document.getElementById('btn-group-service');
    const btnEventGroup = document.getElementById('btn-group-event');
    const subtabsService = document.getElementById('subtabs-service-group');
    const subtabsEvent = document.getElementById('subtabs-event-group');

    if (btnServiceGroup && btnEventGroup) {
        btnServiceGroup.addEventListener('click', () => {
            btnServiceGroup.classList.add('active');
            btnEventGroup.classList.remove('active');
            subtabsService.style.display = 'flex';
            subtabsEvent.style.display = 'none';

            // Auto-click the first subtab in Service
            const firstSub = subtabsService.querySelector('.marketing-tab-btn');
            if (firstSub) firstSub.click();
        });

        btnEventGroup.addEventListener('click', () => {
            btnEventGroup.classList.add('active');
            btnServiceGroup.classList.remove('active');
            subtabsService.style.display = 'none';
            subtabsEvent.style.display = 'flex';

            // Auto-click the first subtab in Event
            const firstSub = subtabsEvent.querySelector('.marketing-tab-btn');
            if (firstSub) firstSub.click();
        });
    }

    // Generic tab click handler (delegated to both level-2 containers)
    const bindTabDelegate = (container) => {
        if (!container) return;
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.marketing-tab-btn');
            if (!btn) return;

            // If close button was clicked
            if (e.target.classList.contains('tab-close-btn')) {
                e.stopPropagation();
                const targetId = btn.getAttribute('data-target');
                const panel = document.getElementById(targetId);
                
                // If closing active tab, switch back to previous or default
                if (btn.classList.contains('active')) {
                    const nextActiveBtn = btn.previousElementSibling || container.querySelector('.marketing-tab-btn');
                    if (nextActiveBtn) {
                        nextActiveBtn.click();
                    }
                }
                
                btn.remove();
                if (panel) panel.remove();
                return;
            }

            deactivateAllTabsAndPanels();
            btn.classList.add('active');
            
            // Dynamic styling sync to override inline styles
            container.querySelectorAll('.marketing-tab-btn').forEach(b => {
                if (b === btn) {
                    b.style.background = 'white';
                    b.style.borderColor = '#94a3b8';
                    b.style.color = '#334155';
                    b.style.fontWeight = '600';
                } else {
                    b.style.background = '#f8fafc';
                    b.style.borderColor = '#cbd5e1';
                    b.style.color = '#475569';
                    b.style.fontWeight = '500';
                }
            });

            const targetId = btn.getAttribute('data-target');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');

            if (pageTitle) {
                const labelText = btn.innerText.replace('✕', '').split('\n')[0].trim();
                pageTitle.textContent = `行銷展業 - ${labelText}`;
            }
        });
    };

    bindTabDelegate(subtabsService);
    bindTabDelegate(subtabsEvent);

    // Function to dynamically open a detail page in a new Tab
    const openInNewTab = (tabId, tabNameZh, tabNameEn, templatePanelId, setupCallback) => {
        const uniqueTabId = `tab-btn-${tabId}`;
        const uniquePanelId = `dynamic-panel-${tabId}`;
        
        let tabBtn = document.getElementById(uniqueTabId);
        let panel = document.getElementById(uniquePanelId);
        
        if (!tabBtn) {
            // Create tab button with a close "✕" button
            tabBtn = document.createElement('button');
            tabBtn.id = uniqueTabId;
            tabBtn.className = 'marketing-tab-btn';
            tabBtn.setAttribute('data-target', uniquePanelId);
            tabBtn.style.position = 'relative';
            tabBtn.style.paddingRight = '38px'; // Make space for close button
            tabBtn.style.lineHeight = '1.2';
            tabBtn.style.paddingTop = '10px';
            tabBtn.style.paddingBottom = '10px';
            tabBtn.style.paddingLeft = '16px';
            tabBtn.style.borderRadius = '4px';
            tabBtn.style.border = '1px solid #cbd5e1';
            tabBtn.style.background = '#f8fafc';
            tabBtn.style.fontWeight = '500';
            tabBtn.style.color = '#475569';
            tabBtn.style.cursor = 'pointer';
            tabBtn.style.transition = 'all 0.2s';
            tabBtn.innerHTML = `${tabNameZh}<br><span style="font-size: 11px; font-weight: normal; color: #666;">${tabNameEn}</span><span class="tab-close-btn" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); font-weight:bold; color:#ef4444; font-size:12px; cursor:pointer; padding:2px 5px; border-radius:50%; transition: background 0.2s;">✕</span>`;
            
            // Add hover style for close button
            tabBtn.querySelector('.tab-close-btn').onmouseover = function() { this.style.background = '#fee2e2'; };
            tabBtn.querySelector('.tab-close-btn').onmouseout = function() { this.style.background = 'transparent'; };

            // Append to the service subtabs group instead of legacy hidden tab list
            if (subtabsService) {
                subtabsService.appendChild(tabBtn);
            }

            // Clone the template panel content
            const templatePanel = document.getElementById(templatePanelId);
            if (templatePanel) {
                panel = templatePanel.cloneNode(true);
                panel.id = uniquePanelId;
                // Ensure hidden initially
                panel.classList.remove('active');
                dynamicPanelsContainer.appendChild(panel);
            }
        }

        // Call customization helper to fill in data
        if (setupCallback && panel) {
            setupCallback(panel);
        }

        // Focus / Click newly created tab
        tabBtn.click();
        
        // Explicitly set panel as active display state in CSS since button click delegation is async
        if (panel) {
            panel.classList.add('active');
        }
    };

    // ----------------------------------------------------
    // Master-Detail Navigation (Records List <-> Form)
    // ----------------------------------------------------
    const panelList = document.getElementById('panel-records-list');
    const panelForm = document.getElementById('panel-record-form');
    
    const btnNewRecord = document.getElementById('btn-new-record');
    const btnBackToList = document.getElementById('btn-back-to-list');
    const btnGoToMarketingList = document.getElementById('btn-go-to-marketing-list');
    
    const hideAllPanels = () => {
        document.querySelectorAll('.marketing-content-panel').forEach(p => {
            p.classList.remove('active');
            p.style.display = '';
        });
    };

    const showFormView = (isEdit = false, recordId = null) => {
        hideAllPanels();
        const targetForm = document.getElementById('panel-record-form');
        if (targetForm) {
            targetForm.classList.add('active');
            targetForm.style.display = '';
        }
        
        const formTitle = targetForm ? targetForm.querySelector('.form-title-group h3') : null;
        const saveBtn = document.getElementById('btn-save-record');
        
        if (isEdit && recordId) {
            const allServices = getAllServices();
            const service = allServices.find(s => s.id === recordId);
            if (service) {
                if (formTitle) formTitle.textContent = service.topic || '編輯服務紀錄';
                // Populate inputs
                document.getElementById('record-date').value = service.date ? service.date.replace(/\//g, '-') : '';
                document.getElementById('record-time').value = service.time || '10:05';
                document.getElementById('record-duration').value = service.duration || '30';
                document.getElementById('record-analyst-email').value = service.analystEmail || 'Sherman.shang@fubon.com';
                document.getElementById('record-client').value = service.client || 'Elizabeth Li';
                document.getElementById('record-interest').value = service.interest || '2330 TT';
                document.getElementById('notes-textarea').value = service.notes || '';
                
                // Select elements
                document.getElementById('record-type').value = service.type || '';
                document.getElementById('record-method').value = service.method || '';
                if(service.sales) document.getElementById('record-sales').value = service.sales;
                if(service.salesTrader) document.getElementById('record-sales-trader').value = service.salesTrader;
                if(service.firm) document.getElementById('record-firm').value = service.firm;

                const aVal = service.analyst === 'Sherman Shang' || service.analyst === 'Sherman' || service.analyst === '王一' ? '王一' : (service.analyst === 'Titan' || service.analyst === 'Titan Wang' || service.analyst === '王二' ? '王二' : '王三');
                document.getElementById('record-analyst').value = aVal;

                saveBtn.setAttribute('data-mode', 'edit');
                saveBtn.setAttribute('data-edit-id', recordId);
            }
        } else {
            const getImportData = () => {
                const stored = sessionStorage.getItem('crm_import_meeting');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        return parsed;
                    } catch (e) {
                        console.warn("Failed to parse crm_import_meeting", e);
                    }
                }

                const qParams = parseAllQueryParams();

                return {
                    topic: qParams.topic || '',
                    date: qParams.date ? qParams.date.replace(/\//g, '-') : '',
                    time: qParams.time || '',
                    analyst: qParams.analyst || '',
                    notes: qParams.notes || ''
                };
            };

            const importData = getImportData();
            if (formTitle) formTitle.textContent = importData.topic ? `匯入首頁會議紀錄：${importData.topic}` : '新增服務紀錄 New Service Record';
            
            document.getElementById('record-topic').value = importData.topic || 'TSM earnings';
            document.getElementById('record-date').value = importData.date ? importData.date.replace(/\//g, '-') : '2026-06-30';
            document.getElementById('record-time').value = importData.time || '10:00';
            document.getElementById('record-duration').value = '30';
            document.getElementById('notes-textarea').value = importData.notes || '';
            
            if (importData.analyst) {
                const aName = importData.analyst;
                const aVal = aName.includes('Sherman') || aName.includes('王一') ? '王一' : (aName.includes('Titan') || aName.includes('王二') ? '王二' : '王三');
                document.getElementById('record-analyst').value = aVal;
                const emailMap = { '王一': 'Sherman.shang@fubon.com', '王二': 'Titan.wang@fubon.com', '王三': 'Jason.lin@fubon.com' };
                if (document.getElementById('record-analyst-email')) {
                    document.getElementById('record-analyst-email').value = emailMap[aVal] || 'Sherman.shang@fubon.com';
                }
            } else {
                document.getElementById('record-analyst-email').value = 'Sherman.shang@fubon.com';
                document.getElementById('record-analyst').value = '王一';
            }

            document.getElementById('record-client').value = 'Elizabeth Li';
            document.getElementById('record-interest').value = '2330 TT';
            document.getElementById('record-sales').value = 'Charlie Zhao';
            document.getElementById('record-sales-trader').value = 'Jason Chang';
            
            saveBtn.setAttribute('data-mode', 'new');
            saveBtn.removeAttribute('data-edit-id');

            let importNotice = document.getElementById('import-from-home-notice');
            if (!importNotice && targetForm) {
                importNotice = document.createElement('div');
                importNotice.id = 'import-from-home-notice';
                importNotice.style.cssText = 'background:#E0F2FE; color:#0369A1; padding:10px 14px; border-radius:6px; border:1px solid #BAE6FD; margin-bottom:16px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px;';
                targetForm.insertBefore(importNotice, targetForm.querySelector('.record-form-wrapper'));
            }

            if (importNotice) {
                if (importData.topic || importData.date) {
                    importNotice.style.display = 'flex';
                    importNotice.innerHTML = `✨ <strong>已自動對接與帶入首頁會議資料：</strong> 主題「${importData.topic || '無主題'}」/ 日期 ${importData.date || ''}。請補齊參與客戶/法人戶與人員資料後儲存。`;
                } else {
                    importNotice.style.display = 'none';
                }
            }
        }
    };

    const showListView = () => {
        hideAllPanels();
        const targetList = document.getElementById('panel-records-list');
        if (targetList) {
            targetList.classList.add('active');
            targetList.style.display = '';
        }
    };

    if(btnNewRecord) btnNewRecord.addEventListener('click', () => showFormView(false));
    if(btnBackToList) {
        btnBackToList.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : window.location.search);
            if (urlParams.get('action') === 'new-service' || (document.referrer && document.referrer.includes('index.html'))) {
                window.location.href = 'index.html';
            } else {
                showListView();
            }
        });
    }
    if (btnGoToMarketingList) {
        btnGoToMarketingList.addEventListener('click', () => {
            showListView();
        });
    }
    
    let activeDrawerRecordId = null;
    const detailDrawer = document.getElementById('service-detail-drawer');
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    const editDrawerBtn = document.getElementById('drawer-btn-edit');

    const openServiceDrawer = (recordId) => {
        const allServices = getAllServices();
        const service = allServices.find(s => s.id === recordId);
        if (!service || !detailDrawer) return;

        activeDrawerRecordId = recordId;

        // Populate drawer contents
        document.getElementById('drawer-detail-topic').textContent = service.topic || '無主題';
        document.getElementById('drawer-detail-date').textContent = service.date || '';
        document.getElementById('drawer-detail-time').textContent = service.time || '';
        document.getElementById('drawer-detail-coverage').textContent = service.coverage || '';
        document.getElementById('drawer-detail-firm').textContent = service.firm || '';
        document.getElementById('drawer-detail-client').textContent = service.client || '';
        document.getElementById('drawer-detail-email').textContent = service.email || '';
        document.getElementById('drawer-detail-sales').textContent = service.sales || '';
        document.getElementById('drawer-detail-analyst').textContent = service.analyst || '';
        document.getElementById('drawer-detail-analyst-email').textContent = service.analystEmail || '';
        document.getElementById('drawer-detail-interest').textContent = service.interest || '';
        document.getElementById('drawer-detail-type').textContent = service.type || '';
        document.getElementById('drawer-detail-method').textContent = service.method || '';
        document.getElementById('drawer-detail-duration').textContent = service.duration || '';
        document.getElementById('drawer-detail-format').textContent = service.format || '';

        detailDrawer.classList.add('open');
    };

    const closeServiceDrawer = () => {
        if (detailDrawer) detailDrawer.classList.remove('open');
        activeDrawerRecordId = null;
    };

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeServiceDrawer);
    }

    if (editDrawerBtn) {
        editDrawerBtn.addEventListener('click', () => {
            if (activeDrawerRecordId) {
                const editId = activeDrawerRecordId;
                closeServiceDrawer();
                showFormView(true, editId);
            }
        });
    }

    // Bind click listener for table rows to show Drawer panel (Option 2)
    const bindRowClickEvents = () => {
        document.querySelectorAll('.record-row').forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('click', (e) => {
                // Only trigger drawer if they don't click on an explicit link or the pin button
                if(!e.target.classList.contains('text-link') && !e.target.classList.contains('service-pin-btn')) {
                    const recordId = row.getAttribute('data-id');
                    openServiceDrawer(recordId);
                }
            });
        });
    };
    
    bindRowClickEvents();

    // Handle service pinning clicks
    const bindPinClickEvents = () => {
        document.querySelectorAll('.service-pin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop row click
                const id = btn.getAttribute('data-id');
                const index = pinnedServiceIds.indexOf(id);
                if (index > -1) {
                    pinnedServiceIds.splice(index, 1);
                } else {
                    pinnedServiceIds.push(id);
                }
                syncPinnedServicesDetailsToHome();
                updatePinStarsUI();
            });
        });
    };
    
    bindPinClickEvents();
    updatePinStarsUI();

    // Use event delegation for dynamic and cloned table links
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        if (!target) return;

        // Researcher Link
        if (target.classList.contains('trigger-researcher')) {
            e.preventDefault();
            e.stopPropagation();
            const text = target.textContent.trim();
            const analyst = getAllAnalysts().find(a => text.includes(a.zhName) || text.includes(a.enName));
            if (analyst) {
                showIndividualAnalystPage(analyst.id);
            } else {
                hideAllPanels();
                document.getElementById('panel-detail-researcher').classList.add('active');
            }
        }

        // Firm Link
        if (target.classList.contains('trigger-firm')) {
            e.preventDefault();
            e.stopPropagation();
            const name = target.textContent.trim();
            const firm = DEFAULT_FIRMS.find(f => f.name === name);
            if (firm) {
                showIndividualFirmPage(firm.id);
            } else {
                hideAllPanels();
                document.getElementById('panel-detail-firm').classList.add('active');
            }
        }

        // Client Link
        if (target.classList.contains('trigger-client')) {
            e.preventDefault();
            e.stopPropagation();
            const name = target.textContent.trim();
            const client = DEFAULT_CLIENTS.find(c => c.name === name);
            if (client) {
                showIndividualClientPage(client.id);
            } else {
                hideAllPanels();
                document.getElementById('panel-detail-client').classList.add('active');
            }
        }

        // Sales Link
        if (target.classList.contains('trigger-sales')) {
            e.preventDefault();
            e.stopPropagation();
            const name = target.textContent.trim();
            const sales = DEFAULT_SALES.find(s => name.includes(s.zhName) || name.includes(s.enName));
            if (sales) {
                showIndividualSalesPage(sales.id);
            } else {
                hideAllPanels();
                document.getElementById('panel-detail-sales').classList.add('active');
            }
        }

        // Topic/Form Link
        if (target.classList.contains('trigger-form')) {
            e.preventDefault();
            e.stopPropagation();
            const row = target.closest('tr');
            const recordId = row ? row.getAttribute('data-id') : null;
            openServiceDrawer(recordId);
        }
    });

    document.querySelectorAll('.back-to-list-btn').forEach(btn => {
        btn.addEventListener('click', showListView);
    });

    // Populate Interaction Tables for Drill-down panels by cloning the main table
    const mainTable = document.querySelector('#panel-records-list .data-table');
    if(mainTable) {
        const wrappers = ['#researcher-interaction-table', '#firm-interaction-table', '#client-interaction-table'];
        wrappers.forEach(id => {
            const wrapper = document.querySelector(id);
            if(wrapper) wrapper.appendChild(mainTable.cloneNode(true));
        });
    }



    // ----------------------------------------------------
    // Event System Logic
    // ----------------------------------------------------
    const triggerEventDetails = document.querySelectorAll('.trigger-event-detail');
    const panelEventDetail = document.getElementById('panel-event-detail');
    const panelEventCalendar = document.getElementById('panel-event-calendar');
    const btnBackCalendar = document.getElementById('btn-back-calendar');

    triggerEventDetails.forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideAllPanels();
        if(panelEventDetail) panelEventDetail.classList.add('active');
    }));

    if(btnBackCalendar) {
        btnBackCalendar.addEventListener('click', () => {
            hideAllPanels();
            if(panelEventCalendar) panelEventCalendar.classList.add('active');
        });
    }



    // Event Notification Email Modal
    const btnSendEventEmailWrapper = document.getElementById('btn-send-event-email');
    const eventEmailModal = document.getElementById('event-email-modal');
    const btnCloseEventEmail = document.getElementById('btn-close-event-email');
    const btnSendEventEmailAction = document.getElementById('btn-send-event-email-action');

    if(btnSendEventEmailWrapper) {
        btnSendEventEmailWrapper.addEventListener('click', () => {
            if(eventEmailModal) eventEmailModal.classList.add('show');
        });
    }
    const closeEventEmailModal = () => {
        if(eventEmailModal) eventEmailModal.classList.remove('show');
    };
    if(btnCloseEventEmail) btnCloseEventEmail.addEventListener('click', closeEventEmailModal);
    if(btnSendEventEmailAction) btnSendEventEmailAction.addEventListener('click', () => {
        alert('活動通知預約信已成功發送！');
        closeEventEmailModal();
    });

    // ----------------------------------------------------
    // Researcher Drawer Logic (Slide-out style) & Detail Drill-down
    // ----------------------------------------------------
    const researcherDrawer = document.getElementById('analyst-profile-drawer');
    const btnAddResearcher = document.getElementById('btn-add-researcher');
    const btnCancelResearcher = document.getElementById('btn-cancel-researcher');
    const btnSaveResearcher = document.getElementById('btn-save-researcher');
    const btnCloseAnalystDrawer = document.getElementById('btn-close-analyst-drawer');

    const openAnalystEditDrawer = (analystId = null) => {
        if (!researcherDrawer) return;
        
        const zhNameInput = document.getElementById('analyst-zh-name');
        const enNameInput = document.getElementById('analyst-en-name');
        const phoneInput = document.getElementById('analyst-phone');
        const emailInput = document.getElementById('analyst-email');
        const sectorInput = document.getElementById('analyst-sector');
        
        if (analystId) {
            // Edit mode
            const analyst = getAllAnalysts().find(a => a.id === analystId);
            if (analyst) {
                zhNameInput.value = analyst.zhName || '';
                enNameInput.value = analyst.enName || '';
                phoneInput.value = analyst.phone || '';
                emailInput.value = analyst.email || '';
                sectorInput.value = analyst.sector || '';
                btnSaveResearcher.setAttribute('data-mode', 'edit');
                btnSaveResearcher.setAttribute('data-id', analystId);
            }
        } else {
            // Add mode
            zhNameInput.value = '';
            enNameInput.value = '';
            phoneInput.value = '';
            emailInput.value = '';
            sectorInput.value = '';
            btnSaveResearcher.setAttribute('data-mode', 'add');
            btnSaveResearcher.removeAttribute('data-id');
        }
        
        researcherDrawer.classList.add('open');
    };

    const closeResearcherDrawer = () => {
        if(researcherDrawer) researcherDrawer.classList.remove('open');
    };

    if(btnAddResearcher) btnAddResearcher.addEventListener('click', () => openAnalystEditDrawer(null));
    if(btnCancelResearcher) btnCancelResearcher.addEventListener('click', closeResearcherDrawer);
    if(btnCloseAnalystDrawer) btnCloseAnalystDrawer.addEventListener('click', closeResearcherDrawer);

    if(btnSaveResearcher) btnSaveResearcher.addEventListener('click', () => {
        const mode = btnSaveResearcher.getAttribute('data-mode');
        const zhName = document.getElementById('analyst-zh-name').value;
        const enName = document.getElementById('analyst-en-name').value;
        const phone = document.getElementById('analyst-phone').value;
        const email = document.getElementById('analyst-email').value;
        const sector = document.getElementById('analyst-sector').value;

        if (mode === 'edit') {
            const analystId = btnSaveResearcher.getAttribute('data-id');
            const index = customAnalysts.findIndex(a => a.id === analystId);
            if (index > -1) {
                customAnalysts[index] = { id: analystId, zhName, enName, phone, email, sector, coverage: 'General' };
            } else {
                const defaultIdx = DEFAULT_ANALYSTS.findIndex(a => a.id === analystId);
                if (defaultIdx > -1) {
                    DEFAULT_ANALYSTS[defaultIdx] = { id: analystId, zhName, enName, phone, email, sector, coverage: DEFAULT_ANALYSTS[defaultIdx].coverage || 'General' };
                }
            }
            alert('✅ 研究員資料已更新！');
        } else {
            const newAnalyst = {
                id: 'analyst-' + Date.now(),
                zhName,
                enName,
                phone,
                email,
                sector,
                coverage: 'General'
            };
            customAnalysts.push(newAnalyst);
            alert('✅ 新增研究員成功！');
        }

        localStorage.setItem('crm_custom_analysts', JSON.stringify(customAnalysts));
        closeResearcherDrawer();
        refreshAnalystTable();
    });

    const refreshAnalystTable = () => {
        const tableBody = document.getElementById('analyst-table-body');
        if (!tableBody) return;
        
        const filterStartVal = document.getElementById('analyst-filter-start').value;
        const filterEndVal = document.getElementById('analyst-filter-end').value;
        
        const startDate = new Date(filterStartVal);
        const endDate = new Date(filterEndVal);
        
        const services = getAllServices().filter(s => {
            const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
            return sDate >= startDate && sDate <= endDate;
        });
        
        const analysts = getAllAnalysts();
        let totalCount = 0;
        let totalHours = 0;
        let rowsHTML = '';
        
        const analystStats = analysts.map(analyst => {
            const matchingServices = services.filter(s => {
                const sName = s.analyst ? s.analyst.toLowerCase() : '';
                return sName.includes(analyst.enName.toLowerCase()) || sName.includes(analyst.zhName.toLowerCase());
            });
            
            const count = matchingServices.length;
            const hours = matchingServices.reduce((sum, s) => sum + (parseFloat(s.duration || 0) / 60), 0);
            const formattedHours = Math.round(hours * 10) / 10;
            
            totalCount += count;
            totalHours += hours;
            
            return {
                ...analyst,
                count,
                hours: formattedHours
            };
        });
        
        rowsHTML += `
        <tr style="background-color: var(--bg-hover); font-weight: bold;">
            <td>總計</td>
            <td></td><td></td><td></td><td></td>
            <td>${totalCount}</td>
            <td>${Math.round(totalHours * 10) / 10}</td>
            <td></td>
        </tr>`;
        
        analystStats.forEach(a => {
            rowsHTML += `
            <tr data-id="${a.id}">
                <td><span class="text-link trigger-researcher-detail" style="font-weight: 600; cursor: pointer;">${a.zhName}</span></td>
                <td>${a.enName}</td>
                <td>${a.phone}</td>
                <td>${a.email || ''}</td>
                <td>${a.sector || ''}</td>
                <td>${a.count}</td>
                <td>${a.hours}</td>
                <td style="text-align: center;"><button class="edit-researcher-btn" data-id="${a.id}" style="background:transparent; border:none; cursor:pointer;" title="編輯">📝</button></td>
            </tr>`;
        });
        
        tableBody.innerHTML = rowsHTML;
        
        // Bind Edit action to the entire row (except total row and trigger-researcher-detail links)
        tableBody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', (e) => {
                // If clicking drill-down link or total row, skip drawer editing
                if (e.target.classList.contains('trigger-researcher-detail') || e.target.closest('.trigger-researcher-detail')) {
                    return;
                }
                const analystId = row.getAttribute('data-id');
                if (analystId) {
                    openAnalystEditDrawer(analystId);
                }
            });
        });

        // Bind drill-down detail links
        tableBody.querySelectorAll('.trigger-researcher-detail').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = link.closest('tr');
                const id = row.getAttribute('data-id');
                showIndividualAnalystPage(id);
            });
        });
    };

    const showIndividualAnalystPage = (analystId) => {
        const analyst = getAllAnalysts().find(a => a.id === analystId);
        if (!analyst) return;

        openInNewTab(
            `analyst-${analyst.id}`, 
            `明細: ${analyst.zhName}`, 
            `Detail: ${analyst.enName}`, 
            'panel-detail-researcher',
            (panel) => {
                // Populate card
                panel.querySelector('h2').textContent = `${analyst.zhName} (${analyst.enName})`;
                const cardDetails = panel.querySelector('.profile-header-card');
                if (cardDetails) {
                    cardDetails.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <h2 style="font-size: 28px; margin-bottom: 16px; color: var(--text-main);">${analyst.zhName} ${analyst.enName}</h2>
                                <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 24px; font-size: 14px;">
                                    <div style="color: var(--text-muted);">email</div><div><span class="text-link">${analyst.email || '未設定'}</span></div>
                                    <div style="color: var(--text-muted);">Coverage</div><div>${analyst.coverage || 'General'}</div>
                                    <div style="color: var(--text-muted);">連絡電話 tel</div><div>${analyst.phone || '未設定'}</div>
                                    <div style="color: var(--text-muted);">負責產業</div><div>${analyst.sector || '未設定'}</div>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-primary btn-reserve-researcher-dyn" data-analyst-id="${analyst.id}" style="font-size: 16px; padding: 12px 32px; background-color: #4A90E2; border-color: #4A90E2; display: flex; align-items: center; gap: 8px;">預約</button>
                            </div>
                        </div>
                    `;
                }

                // Reservation Button Action on dynamic panel
                const btnReserve = panel.querySelector('.btn-reserve-researcher-dyn');
                const reserveModal = document.getElementById('reserve-analyst-modal');
                if (btnReserve && reserveModal) {
                    // Sync pending status
                    const bookings = safeJsonParse('crm_pending_bookings', []);
                    const bookingId = 'booking-' + analyst.id;
                    if (bookings.some(x => x.id === bookingId)) {
                        btnReserve.setAttribute('data-status', 'pending');
                        btnReserve.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background:#fff; border-radius:50%; animation: pulse 1s infinite alternate;"></span> ⏳ 預約處理中 Pending...`;
                        btnReserve.style.backgroundColor = '#F59E0B';
                        btnReserve.style.borderColor = '#D97706';
                    }

                    btnReserve.addEventListener('click', () => {
                        let currentBookings = safeJsonParse('crm_pending_bookings', []);
                        if (btnReserve.getAttribute('data-status') === 'pending') {
                            btnReserve.setAttribute('data-status', 'idle');
                            btnReserve.innerHTML = '預約';
                            btnReserve.style.backgroundColor = '#4A90E2';
                            btnReserve.style.borderColor = '#4A90E2';
                            currentBookings = currentBookings.filter(x => x.id !== bookingId);
                            localStorage.setItem('crm_pending_bookings', JSON.stringify(currentBookings));
                            alert('已取消該研究員之會面預約排程需求。');
                            refreshPendingBookingsUI();
                        } else {
                            document.getElementById('reserve-analyst-name').value = `${analyst.zhName} (${analyst.enName})`;
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            document.getElementById('reserve-date').value = tomorrow.toISOString().substring(0, 10);
                            
                            // Re-bind submit to act on the specific dynamic reserve button
                            const reserveForm = document.getElementById('reserve-analyst-form');
                            reserveForm.onsubmit = (e) => {
                                e.preventDefault();
                                const selectedClient = document.getElementById('reserve-client-select').value;
                                const selectedDate = document.getElementById('reserve-date').value;
                                const startTime = document.getElementById('reserve-start-time').value;
                                const endTime = document.getElementById('reserve-end-time').value;
                                
                                let freshBookings = safeJsonParse('crm_pending_bookings', []);
                                btnReserve.setAttribute('data-status', 'pending');
                                btnReserve.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background:#fff; border-radius:50%; animation: pulse 1s infinite alternate;"></span> ⏳ 預約處理中 Pending...`;
                                btnReserve.style.backgroundColor = '#F59E0B';
                                btnReserve.style.borderColor = '#D97706';

                                const newBooking = {
                                    id: bookingId,
                                    analystName: `${analyst.zhName} (${analyst.enName})`,
                                    client: selectedClient,
                                    status: '審核中 / 待排程',
                                    createdTime: `${selectedDate} ${startTime}~${endTime}`
                                };

                                if (!freshBookings.some(x => x.id === bookingId)) freshBookings.push(newBooking);
                                localStorage.setItem('crm_pending_bookings', JSON.stringify(freshBookings));
                                reserveModal.classList.remove('show');
                                alert(`✅ 預約成功！時間：${selectedDate} ${startTime}~${endTime}`);
                                refreshPendingBookingsUI();
                            };
                            const btnCancelReserve = document.getElementById('btn-cancel-reserve');
                            if (btnCancelReserve) {
                                btnCancelReserve.onclick = () => {
                                    reserveModal.classList.remove('show');
                                };
                            }
                            reserveModal.classList.add('show');
                        }
                    });
                }

                // Render dynamic table list
                const interactionTable = panel.querySelector('#researcher-interaction-table');
                if (interactionTable) {
                    interactionTable.id = `dyn-researcher-interaction-table-${analyst.id}`;
                    
                    const detailStart = panel.querySelector('#analyst-detail-filter-start');
                    const detailEnd = panel.querySelector('#analyst-detail-filter-end');
                    
                    const renderLocalList = () => {
                        const startVal = detailStart.value;
                        const endVal = detailEnd.value;
                        const startDate = new Date(startVal);
                        const endDate = new Date(endVal);

                        const allServices = getAllServices();
                        const matchingServices = allServices.filter(s => {
                            const sName = s.analyst ? s.analyst.toLowerCase() : '';
                            const isMatch = sName.includes(analyst.enName.toLowerCase()) || sName.includes(analyst.zhName.toLowerCase());
                            if (!isMatch) return false;
                            const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
                            return sDate >= startDate && sDate <= endDate;
                        });

                        let tableHTML = `<table class="data-table" style="min-width: 100%;">
                            <thead>
                                <tr>
                                    <th>日期 Date</th><th>研究員 Analyst</th><th>營業員 Sales</th><th>法人戶 Firm</th><th>客戶 Client</th>
                                    <th>互動類型 Interaction</th><th>互動方法 method</th><th>時長 (min)</th>
                                    <th>人數 format</th><th>時間 Time</th><th>Contact</th><th>主題 Topic</th><th>個股 Interest</th>
                                </tr>
                            </thead>
                            <tbody>`;
                        if (matchingServices.length === 0) {
                            tableHTML += `<tr><td colspan="13" style="text-align:center; color:#94a3b8; padding:20px;">無服務紀錄</td></tr>`;
                        } else {
                            matchingServices.forEach(s => {
                                tableHTML += `<tr>
                                    <td>${s.date}</td><td><span class="text-link trigger-researcher">${s.analyst || analyst.zhName}</span></td><td>${s.sales}</td><td><span class="text-link trigger-firm">${s.firm}</span></td><td><span class="text-link trigger-client">${s.client}</span></td>
                                    <td>${s.type}</td><td>${s.method}</td><td>${s.duration}</td><td>${s.format}</td>
                                    <td>${s.time}</td><td>${s.email}</td><td><span class="text-link trigger-form">${s.topic}</span></td><td>${s.interest}</td>
                                </tr>`;
                            });
                        }
                        tableHTML += `</tbody></table>`;
                        interactionTable.innerHTML = tableHTML;
                    };
                    renderLocalList();
                    detailStart.onchange = renderLocalList;
                    detailEnd.onchange = renderLocalList;
                }

                // Hide original back-to-list-btn since they can just close the tab
                const backBtn = panel.querySelector('.back-to-list-btn');
                if (backBtn) backBtn.style.display = 'none';
            }
        );
    };

    // Bind Firm and Client Date Filters
    const filterStartInput = document.getElementById('analyst-filter-start');
    const filterEndInput = document.getElementById('analyst-filter-end');
    if (filterStartInput && filterEndInput) {
        filterStartInput.addEventListener('change', refreshAnalystTable);
        filterEndInput.addEventListener('change', refreshAnalystTable);
    }

    // Trigger initial analyst table rendering
    refreshAnalystTable();

    // ----------------------------------------------------
    // Firm Page & Client Page Dynamic Data & Rendering
    // ----------------------------------------------------
    const DEFAULT_FIRMS = [
        { id: 'firm-1', org: '外法', name: 'FMR', coverage: 'Jefferies/Fubon', note1: 'HK, ATL, LDN', note2: 'Long Only', note3: 'Tier 1' },
        { id: 'firm-2', org: '外法', name: 'Oasis', coverage: 'Fubon Only', note1: 'HK', note2: 'Long Only', note3: 'Tier 2' },
        { id: 'firm-3', org: '外法', name: 'AP Asset', coverage: 'Daishin/Fubon', note1: 'SEOUL', note2: 'Long Only', note3: 'Tier 2' }
    ];

    const DEFAULT_CLIENTS = [
        { id: 'client-1', name: 'Elizabeth Li', firm: 'FMR', title: 'EM generalist', email: 'Elizabeth.Li@FMR.com', phone: '85212345678', region: 'HK', sales: 'Charlie Zhao', trader: 'Jason Chang' },
        { id: 'client-2', name: 'Jonas Wong', firm: 'Oasis', title: 'Manager', email: 'Jonas.wong@oasis.com', phone: '968-888-888', region: 'HK', sales: 'Ann Liao', trader: 'Terry' },
        { id: 'client-3', name: 'Chloe Kim', firm: 'AP Asset', title: 'Manager', email: 'Chloe.kim@apasset.com', phone: '123-xxx-xxx', region: 'SEOUL', sales: 'Ken Lee', trader: 'David Lin' }
    ];

    const DEFAULT_SALES = [
        { id: 'sales-1', zhName: '趙查理', enName: 'Charlie Zhao', phone: '852-1111-1111', email: 'charlie.zhao@fubon.com', group: '外資組', trader: 'Jason Chang' },
        { id: 'sales-2', zhName: '廖安安', enName: 'Ann Liao', phone: '852-2222-2222', email: 'ann.liao@fubon.com', group: '外資組', trader: 'Terry' },
        { id: 'sales-3', zhName: '李健', enName: 'Ken Lee', phone: '852-3333-3333', email: 'ken.lee@fubon.com', group: '外資組', trader: 'David Lin' }
    ];

    const refreshSalesTable = () => {
        const tableBody = document.getElementById('sales-table-body');
        if (!tableBody) return;

        const filterStartVal = document.getElementById('sales-filter-start').value;
        const filterEndVal = document.getElementById('sales-filter-end').value;
        const startDate = new Date(filterStartVal);
        const endDate = new Date(filterEndVal);

        const allServices = getAllServices();

        tableBody.innerHTML = '';

        DEFAULT_SALES.forEach(rep => {
            const repServices = allServices.filter(s => {
                if (s.sales !== rep.enName) return false;
                const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
                return sDate >= startDate && sDate <= endDate;
            });

            const meetingCount = repServices.length;
            const totalHours = repServices.reduce((sum, s) => {
                const duration = parseFloat(s.duration) || 0;
                return sum + (duration / 60);
            }, 0);

            const row = document.createElement('tr');
            row.setAttribute('data-id', rep.id);
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <td><span class="text-link trigger-sales-detail-page">${rep.zhName}</span></td>
                <td>${rep.enName}</td>
                <td>${rep.phone}</td>
                <td><span class="text-link">${rep.email}</span></td>
                <td><span class="tag">${rep.group}</span></td>
                <td>${meetingCount}</td>
                <td>${Math.round(totalHours * 10) / 10} h</td>
            `;

            row.addEventListener('click', (e) => {
                showIndividualSalesPage(rep.id);
            });

            tableBody.appendChild(row);
        });
    };

    const showIndividualSalesPage = (salesId) => {
        const rep = DEFAULT_SALES.find(s => s.id === salesId);
        if (!rep) return;

        openInNewTab(
            `sales-${rep.id}`,
            `明細: ${rep.zhName}`,
            `Detail: ${rep.enName}`,
            'panel-detail-sales',
            (panel) => {
                const profileCard = panel.querySelector('.profile-header-card');
                if (profileCard) {
                    profileCard.innerHTML = `
                        <div style="display:flex; align-items:center; gap: 24px; margin-bottom: 16px; background-color: #E2F0D9; padding: 8px 16px; width: fit-content;">
                            <h2 style="font-size: 20px; color: var(--text-main); margin: 0;">${rep.zhName} (${rep.enName})</h2>
                        </div>
                        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 24px; font-size: 14px; max-width: 400px;">
                            <div style="color: var(--text-muted);">組別 Group</div><div>${rep.group}</div>
                            <div style="color: var(--text-muted);">email</div><div><span class="text-link">${rep.email}</span></div>
                            <div style="color: var(--text-muted);">連絡電話 tel</div><div>${rep.phone}</div>
                            <div style="color: var(--text-muted);">業務交易員 Trader</div><div>${rep.trader}</div>
                        </div>
                    `;
                }

                const detailStart = panel.querySelector('#sales-detail-filter-start');
                const detailEnd = panel.querySelector('#sales-detail-filter-end');
                const interactionTable = panel.querySelector('#sales-interaction-table');

                if (detailStart && detailEnd && interactionTable) {
                    interactionTable.id = `dyn-sales-interaction-table-${rep.id}`;
                    
                    const renderLocalList = () => {
                        const sVal = detailStart.value;
                        const eVal = detailEnd.value;
                        const startDate = new Date(sVal);
                        const endDate = new Date(eVal);

                        const allServices = getAllServices();
                        const matchingServices = allServices.filter(s => {
                            if (s.sales !== rep.enName) return false;
                            const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
                            return sDate >= startDate && sDate <= endDate;
                        });

                        let tableHTML = `<table class="data-table" style="min-width: 100%;">
                            <thead>
                                <tr>
                                    <th>日期 Date</th><th>研究員 Analyst</th><th>法人戶 Firm</th><th>客戶 Client</th>
                                    <th>互動類型 Interaction</th><th>互動方法 method</th><th>時長 (min)</th>
                                    <th>人數 format</th><th>時間 Time</th><th>Contact</th><th>主題 Topic</th><th>個股 Interest</th>
                                </tr>
                            </thead>
                            <tbody>`;
                        if (matchingServices.length === 0) {
                            tableHTML += `<tr><td colspan="12" style="text-align:center; color:#94a3b8; padding:20px;">無服務紀錄</td></tr>`;
                        } else {
                            matchingServices.forEach(s => {
                                tableHTML += `<tr>
                                    <td>${s.date}</td><td><span class="text-link trigger-researcher">${s.analyst}</span></td><td><span class="text-link trigger-firm">${s.firm}</span></td><td><span class="text-link trigger-client">${s.client}</span></td>
                                    <td>${s.type}</td><td>${s.method}</td><td>${s.duration}</td><td>${s.format}</td>
                                    <td>${s.time}</td><td>${s.email}</td><td><span class="text-link trigger-form">${s.topic}</span></td><td>${s.interest}</td>
                                </tr>`;
                            });
                        }
                        tableHTML += `</tbody></table>`;
                        interactionTable.innerHTML = tableHTML;
                    };
                    renderLocalList();
                    detailStart.onchange = renderLocalList;
                    detailEnd.onchange = renderLocalList;
                }
            }
        );
    };

    const refreshFirmTable = () => {
        const tableBody = document.getElementById('firm-table-body');
        if (!tableBody) return;

        const filterStartVal = document.getElementById('firm-filter-start').value;
        const filterEndVal = document.getElementById('firm-filter-end').value;
        const startDate = new Date(filterStartVal);
        const endDate = new Date(filterEndVal);

        const services = getAllServices().filter(s => {
            const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
            return sDate >= startDate && sDate <= endDate;
        });

        let totalCount = 0;
        let totalHours = 0;
        let rowsHTML = '';

        const firmStats = DEFAULT_FIRMS.map(firm => {
            const matchingServices = services.filter(s => s.firm === firm.name);
            const count = matchingServices.length;
            const hours = matchingServices.reduce((sum, s) => sum + (parseFloat(s.duration || 0) / 60), 0);
            const formattedHours = Math.round(hours * 10) / 10;

            totalCount += count;
            totalHours += hours;

            return { ...firm, count, hours: formattedHours };
        });

        rowsHTML += `
        <tr style="background-color: var(--bg-hover); font-weight: bold;">
            <td>總計</td>
            <td></td><td></td><td></td><td></td><td></td>
            <td>${totalCount}</td>
            <td>${Math.round(totalHours * 10) / 10}</td>
        </tr>`;

        firmStats.forEach(f => {
            rowsHTML += `
            <tr data-id="${f.id}">
                <td>${f.org}</td>
                <td><span class="text-link trigger-firm-detail-page" style="font-weight: 600; cursor: pointer;">${f.name}</span></td>
                <td>${f.coverage}</td>
                <td>${f.note1}</td>
                <td>${f.note2}</td>
                <td>${f.note3}</td>
                <td>${f.count}</td>
                <td>${f.hours}</td>
            </tr>`;
        });

        tableBody.innerHTML = rowsHTML;

        // Bind drill-down detail links
        tableBody.querySelectorAll('.trigger-firm-detail-page').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = link.closest('tr');
                const id = row.getAttribute('data-id');
                showIndividualFirmPage(id);
            });
        });
    };

    const showIndividualFirmPage = (firmId) => {
        const firm = DEFAULT_FIRMS.find(f => f.id === firmId);
        if (!firm) return;

        openInNewTab(
            `firm-${firm.id}`, 
            `明細: ${firm.name}`, 
            `Detail: ${firm.name}`, 
            'panel-detail-firm',
            (panel) => {
                panel.querySelector('h2').textContent = firm.name;
                const profileCard = panel.querySelector('.profile-header-card');
                if (profileCard) {
                    profileCard.innerHTML = `
                        <h2 style="font-size: 24px; margin-bottom: 16px; color: var(--text-main);">${firm.name}</h2>
                        <div style="display: flex; gap: 64px;">
                            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 14px;">
                                <div style="color: var(--text-muted);">組織：</div><div>${firm.org}</div>
                                <div style="color: var(--text-muted);">業務：</div><div><span class="tag">王O明</span> <span class="tag">陳O潔</span></div>
                                <div style="color: var(--text-muted);">客群：</div><div><span class="tag">${firm.coverage}</span></div>
                                <div style="color: var(--text-muted);">關係企業：</div><div></div>
                                <div style="color: var(--text-muted);">機構法人：</div><div></div>
                            </div>
                            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 14px;">
                                <div style="color: var(--text-muted);">註記1：</div><div><span class="tag">${firm.note1}</span></div>
                                <div style="color: var(--text-muted);">註記2：</div><div><span class="tag">${firm.note2}</span></div>
                                <div style="color: var(--text-muted);">註記3：</div><div><span class="tag" style="border-style:dashed;">${firm.note3}</span></div>
                                <div style="color: var(--text-muted);">說明：</div><div></div>
                            </div>
                        </div>
                    `;
                }

                // Render dynamic table list of interaction records
                const interactionTable = panel.querySelector('#firm-interaction-table');
                if (interactionTable) {
                    interactionTable.id = `dyn-firm-interaction-table-${firm.id}`;
                    const allServices = getAllServices();
                    const matchingServices = allServices.filter(s => s.firm === firm.name);

                    let tableHTML = `<table class="data-table" style="min-width: 100%;">
                        <thead>
                            <tr>
                                <th>日期 Date</th><th>研究員 Analyst</th><th>營業員 Sales</th><th>客戶 Client</th>
                                <th>互動類型 Interaction</th><th>互動方法 method</th><th>時長 (min)</th>
                                <th>人數 format</th><th>時間 Time</th><th>Contact</th><th>主題 Topic</th><th>個股 Interest</th>
                            </tr>
                        </thead>
                        <tbody>`;
                    if (matchingServices.length === 0) {
                        tableHTML += `<tr><td colspan="12" style="text-align:center; color:#94a3b8; padding:20px;">無服務紀錄</td></tr>`;
                    } else {
                        matchingServices.forEach(s => {
                            tableHTML += `<tr>
                                <td>${s.date}</td><td><span class="text-link trigger-researcher">${s.analyst}</span></td><td><span class="text-link trigger-sales">${s.sales}</span></td><td><span class="text-link trigger-client">${s.client}</span></td>
                                <td>${s.type}</td><td>${s.method}</td><td>${s.duration}</td><td>${s.format}</td>
                                <td>${s.time}</td><td>${s.email}</td><td><span class="text-link trigger-form">${s.topic}</span></td><td>${s.interest}</td>
                            </tr>`;
                        });
                    }
                    tableHTML += `</tbody></table>`;
                    interactionTable.innerHTML = tableHTML;
                }

                const backBtn = panel.querySelector('.back-to-list-btn');
                if (backBtn) backBtn.style.display = 'none';
            }
        );
    };

    const refreshClientTable = () => {
        const tableBody = document.getElementById('client-table-body');
        if (!tableBody) return;

        const filterStartVal = document.getElementById('client-filter-start').value;
        const filterEndVal = document.getElementById('client-filter-end').value;
        const startDate = new Date(filterStartVal);
        const endDate = new Date(filterEndVal);

        const services = getAllServices().filter(s => {
            const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
            return sDate >= startDate && sDate <= endDate;
        });

        let totalCount = 0;
        let totalHours = 0;
        let rowsHTML = '';

        const clientStats = DEFAULT_CLIENTS.map(client => {
            const matchingServices = services.filter(s => s.client === client.name);
            const count = matchingServices.length;
            const hours = matchingServices.reduce((sum, s) => sum + (parseFloat(s.duration || 0) / 60), 0);
            const formattedHours = Math.round(hours * 10) / 10;

            totalCount += count;
            totalHours += hours;

            return { ...client, count, hours: formattedHours };
        });

        rowsHTML += `
        <tr style="background-color: var(--bg-hover); font-weight: bold;">
            <td>總計</td>
            <td></td><td></td><td></td><td></td><td></td><td></td>
            <td>${totalCount}</td>
            <td>${Math.round(totalHours * 10) / 10} h</td>
        </tr>`;

        clientStats.forEach(c => {
            rowsHTML += `
            <tr data-id="${c.id}">
                <td><span class="text-link trigger-client-detail-page" style="font-weight: 600; cursor: pointer;">${c.name}</span></td>
                <td>${c.firm}</td>
                <td>${c.title}</td>
                <td>${c.region}</td>
                <td>${c.sales}</td>
                <td>${c.phone}</td>
                <td><span class="text-link">${c.email}</span></td>
                <td>${c.count}</td>
                <td>${c.hours} h</td>
            </tr>`;
        });

        tableBody.innerHTML = rowsHTML;

        // Bind drill-down detail links
        tableBody.querySelectorAll('.trigger-client-detail-page').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = link.closest('tr');
                const id = row.getAttribute('data-id');
                showIndividualClientPage(id);
            });
        });
    };

    const showIndividualClientPage = (clientId) => {
        const client = DEFAULT_CLIENTS.find(c => c.id === clientId);
        if (!client) return;

        openInNewTab(
            `client-${client.id}`, 
            `明細: ${client.name}`, 
            `Detail: ${client.name}`, 
            'panel-detail-client',
            (panel) => {
                panel.querySelector('h2').textContent = client.name;
                const profileCard = panel.querySelector('.profile-header-card');
                if (profileCard) {
                    profileCard.innerHTML = `
                        <div style="display:flex; align-items:center; gap: 24px; margin-bottom: 16px; background-color: #DDEBF7; padding: 8px 16px; width: fit-content;">
                            <h2 style="font-size: 20px; color: var(--text-main); margin: 0;">${client.name}</h2>
                            <button class="btn btn-primary btn-edit-client-dyn" style="padding: 6px 16px; font-size: 13px;">編輯</button>
                        </div>
                        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 24px; font-size: 14px; max-width: 400px;">
                            <div style="color: var(--text-muted);">法人戶 Firm</div><div>${client.firm}</div>
                            <div style="color: var(--text-muted);">email</div><div><span class="text-link">${client.email}</span></div>
                            <div style="color: var(--text-muted);">職稱 title</div><div>${client.title}</div>
                            <div style="color: var(--text-muted);">連絡電話 tel</div><div>${client.phone}</div>
                            <div style="color: var(--text-muted);">地區 Location</div><div>${client.region}</div>
                            <div style="color: var(--text-muted);">營業員</div><div>${client.sales}</div>
                        </div>
                    `;
                    const btnEdit = panel.querySelector('.btn-edit-client-dyn');
                    if (btnEdit) btnEdit.addEventListener('click', openClientModal);
                }

                // Render dynamic table list of interaction records
                const interactionTable = panel.querySelector('#client-interaction-table');
                if (interactionTable) {
                    interactionTable.id = `dyn-client-interaction-table-${client.id}`;
                    const allServices = getAllServices();
                    const matchingServices = allServices.filter(s => s.client === client.name);

                    let tableHTML = `<table class="data-table" style="min-width: 100%;">
                        <thead>
                            <tr>
                                <th>日期 Date</th><th>研究員 Analyst</th><th>營業員 Sales</th><th>法人戶 Firm</th>
                                <th>互動類型 Interaction</th><th>互動方法 method</th><th>時長 (min)</th>
                                <th>人數 format</th><th>時間 Time</th><th>Contact</th><th>主題 Topic</th><th>個股 Interest</th>
                            </tr>
                        </thead>
                        <tbody>`;
                    if (matchingServices.length === 0) {
                        tableHTML += `<tr><td colspan="12" style="text-align:center; color:#94a3b8; padding:20px;">無服務紀錄</td></tr>`;
                    } else {
                        matchingServices.forEach(s => {
                            tableHTML += `<tr>
                                <td>${s.date}</td><td><span class="text-link trigger-researcher">${s.analyst}</span></td><td><span class="text-link trigger-sales">${s.sales}</span></td><td><span class="text-link trigger-firm">${s.firm}</span></td>
                                <td>${s.type}</td><td>${s.method}</td><td>${s.duration}</td><td>${s.format}</td>
                                <td>${s.time}</td><td>${s.email}</td><td><span class="text-link trigger-form">${s.topic}</span></td><td>${s.interest}</td>
                            </tr>`;
                        });
                    }
                    tableHTML += `</tbody></table>`;
                    interactionTable.innerHTML = tableHTML;
                }

                const backBtn = panel.querySelector('.back-to-list-btn');
                if (backBtn) backBtn.style.display = 'none';
            }
        );
    };

    // Bind Firm and Client Date Filters
    const firmStartInput = document.getElementById('firm-filter-start');
    const firmEndInput = document.getElementById('firm-filter-end');
    if (firmStartInput && firmEndInput) {
        firmStartInput.addEventListener('change', refreshFirmTable);
        firmEndInput.addEventListener('change', refreshFirmTable);
    }

    const clientStartInput = document.getElementById('client-filter-start');
    const clientEndInput = document.getElementById('client-filter-end');
    if (clientStartInput && clientEndInput) {
        clientStartInput.addEventListener('change', refreshClientTable);
        clientEndInput.addEventListener('change', refreshClientTable);
    }

    const salesStartInput = document.getElementById('sales-filter-start');
    const salesEndInput = document.getElementById('sales-filter-end');
    if (salesStartInput && salesEndInput) {
        salesStartInput.addEventListener('change', refreshSalesTable);
        salesEndInput.addEventListener('change', refreshSalesTable);
    }

    const recordAnalystSelect = document.getElementById('record-analyst');
    if (recordAnalystSelect) {
        recordAnalystSelect.addEventListener('change', (e) => {
            const selectedOpt = e.target.options[e.target.selectedIndex];
            const email = selectedOpt.getAttribute('data-email');
            const emailInput = document.getElementById('record-analyst-email');
            if (emailInput) emailInput.value = email;
        });
    }

    const recordSalesSelect = document.getElementById('record-sales');
    const recordSalesTraderSelect = document.getElementById('record-sales-trader');
    if (recordSalesSelect && recordSalesTraderSelect) {
        recordSalesSelect.addEventListener('change', () => {
            const val = recordSalesSelect.value;
            if (val === 'Charlie Zhao') recordSalesTraderSelect.value = 'Jason Chang';
            else if (val === 'Ann Liao') recordSalesTraderSelect.value = 'Terry';
            else if (val === 'Ken Lee') recordSalesTraderSelect.value = 'David Lin';
        });
    }

    const recordClientSelect = document.getElementById('record-client');
    if (recordClientSelect) {
        recordClientSelect.addEventListener('change', () => {
            const clientName = recordClientSelect.value;
            const client = DEFAULT_CLIENTS.find(c => c.name === clientName);
            if (client) {
                if (document.getElementById('record-firm')) document.getElementById('record-firm').value = client.firm;
                if (document.getElementById('record-sales')) {
                    document.getElementById('record-sales').value = client.sales;
                    recordSalesSelect.dispatchEvent(new Event('change'));
                }
                if (document.getElementById('record-email')) document.getElementById('record-email').value = client.email;
            }
        });
    }

    // Trigger Initial Firm, Client & Sales Table Render
    refreshFirmTable();
    refreshClientTable();
    refreshSalesTable();

    // ----------------------------------------------------
    // Trigger Initial Analyst Table Rendering
    // ----------------------------------------------------
    refreshDashboards();

    // ----------------------------------------------------
    // Client Modal Logic
    // ----------------------------------------------------
    const clientModal = document.getElementById('client-modal');
    const btnEditClient = document.getElementById('btn-edit-client');
    const btnSaveClient = document.getElementById('btn-save-client');
    const btnCancelClient = document.getElementById('btn-cancel-client');

    const openClientModal = () => {
        if(clientModal) clientModal.classList.add('show');
    };
    const closeClientModal = () => {
        if(clientModal) clientModal.classList.remove('show');
    };

    if(btnEditClient) btnEditClient.addEventListener('click', openClientModal);
    if(btnCancelClient) btnCancelClient.addEventListener('click', closeClientModal);
    if(btnSaveClient) btnSaveClient.addEventListener('click', () => {
        alert('客戶資訊已儲存！');
        closeClientModal();
    });

    // ----------------------------------------------------
    // Save Service Record Logic
    // ----------------------------------------------------
    const btnSaveRecord = document.getElementById('btn-save-record');
    if (btnSaveRecord) {
        btnSaveRecord.addEventListener('click', () => {
            const mode = btnSaveRecord.getAttribute('data-mode') || 'new';
            const editId = btnSaveRecord.getAttribute('data-edit-id');
            
            const rawDate = document.getElementById('record-date').value;
            const formattedDate = rawDate ? rawDate.replace(/-/g, '/') : '2026/06/30';
            
            const selectedAnalystVal = document.getElementById('record-analyst').value;
            const mappedAnalystName = selectedAnalystVal === '王一' ? 'Sherman Shang' : (selectedAnalystVal === '王二' ? 'Titan Wang' : 'Rita Wu');

            const record = {
                id: mode === 'new' ? `service-custom-${Date.now()}` : editId,
                date: formattedDate,
                type: document.getElementById('record-type').value,
                email: document.getElementById('record-email').value,
                time: document.getElementById('record-time').value,
                method: document.getElementById('record-method').value,
                topic: document.getElementById('record-topic').value,
                sales: document.getElementById('record-sales').value,
                salesTrader: document.getElementById('record-sales-trader').value,
                duration: document.getElementById('record-duration').value,
                analystEmail: document.getElementById('record-analyst-email').value,
                firm: document.getElementById('record-firm').value,
                format: document.getElementById('record-format').value,
                client: document.getElementById('record-client').value,
                timeEnd: document.getElementById('record-time-end').value,
                interest: document.getElementById('record-interest').value,
                analyst: mappedAnalystName,
                coverage: 'Fubon'
            };

            if (mode === 'new') {
                // Add to custom services
                customServices.unshift(record);
                localStorage.setItem('crm_custom_services', JSON.stringify(customServices));
                
                // Auto pin new records so they immediately sync to home
                pinnedServiceIds.push(record.id);
                syncPinnedServicesDetailsToHome();
                
                // Re-render table dynamically to show the new record with the new layout
                if (typeof refreshServiceRecordsTable === 'function') refreshServiceRecordsTable();

                alert('✅ 服務紀錄已新增，並已自動同步至首頁行事曆！');
                const urlParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : window.location.search);
                if (urlParams.get('action') === 'new-service' || (document.referrer && document.referrer.includes('index.html'))) {
                    window.location.href = 'index.html';
                    return;
                }
            } else {
                // Edit existing
                const customIndex = customServices.findIndex(s => s.id === editId);
                if (customIndex > -1) {
                    customServices[customIndex] = record;
                    localStorage.setItem('crm_custom_services', JSON.stringify(customServices));
                } else {
                    // It was a default service, add it edited to custom services
                    customServices.push(record);
                    localStorage.setItem('crm_custom_services', JSON.stringify(customServices));
                }
                syncPinnedServicesDetailsToHome();
                alert('✅ 服務紀錄已修改！');
                
                const urlParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : window.location.search);
                if (urlParams.get('action') === 'new-service' || (document.referrer && document.referrer.includes('index.html'))) {
                    window.location.href = 'index.html';
                    return;
                }
                window.location.reload(); // Quick refresh to update the UI table
            }
            
            // Re-bind events to new elements
            bindRowClickEvents();
            bindPinClickEvents();
            updatePinStarsUI();
            
            // Refresh all dashboards and lists dynamically
            refreshDashboards();
            refreshAnalystTable();
            refreshSalesTable();
            refreshFirmTable();
            refreshClientTable();
            if (typeof refreshServiceRecordsTable === 'function') refreshServiceRecordsTable();
            
            showListView();
        });
    }

    // ----------------------------------------------------
    // Service Notification Email Modal Logic (新增會通發送欄位)
    // ----------------------------------------------------
    const btnSendNotification = document.getElementById('btn-send-notification');
    const serviceEmailModal = document.getElementById('service-email-modal');
    const btnCloseServiceEmail = document.getElementById('btn-close-service-email');
    const btnSendServiceEmailAction = document.getElementById('btn-send-service-email-action');

    if (btnSendNotification && serviceEmailModal) {
        btnSendNotification.addEventListener('click', () => {
            const firm = document.getElementById('record-firm').value;
            const client = document.getElementById('record-client').value;
            const email = document.getElementById('record-email').value;
            const selectedAnalystVal = document.getElementById('record-analyst').value;
            const analyst = selectedAnalystVal === '王一' ? 'Sherman Shang' : (selectedAnalystVal === '王二' ? 'Titan Wang' : 'Rita Wu');
            const time = document.getElementById('record-time').value;
            const rawDate = document.getElementById('record-date').value;
            const formattedDate = rawDate ? rawDate.replace(/-/g, '/') : '2026/06/30';
            const sales = document.getElementById('record-sales').value;
            const trader = document.getElementById('record-sales-trader').value;

            // Generate Cc emails based on sales rep and sales trader names
            const salesEmail = sales ? sales.replace(/\s+/g, '.').toLowerCase() + '@fubon.com' : '';
            const traderEmail = trader ? trader.replace(/\s+/g, '.').toLowerCase() + '@fubon.com' : '';
            const ccEmails = [salesEmail, traderEmail].filter(Boolean).join('; ');

            // Pre-populate To/Cc/Subject
            document.getElementById('service-email-to').value = email || `${client.replace(/\s+/g, '.').toLowerCase()}@FMR.com`;
            document.getElementById('service-email-cc').value = ccEmails;
            document.getElementById('service-email-subject').value = `${firm}/ Fubon: Meeting with ${analyst}, ${time}, ${formattedDate}`;

            // Pre-populate Body template
            const bodyHTML = `Dear ${client},<br><br>
We confirm your meeting with <strong>${analyst}</strong>, ${time}, ${formattedDate}.<br><br>
Thank you.<br><br>
BR,<br>
Maggie`;

            document.getElementById('service-email-body').innerHTML = bodyHTML;

            // Show Modal
            serviceEmailModal.classList.add('show');
        });
    }

    if (btnCloseServiceEmail) {
        btnCloseServiceEmail.addEventListener('click', () => {
            serviceEmailModal.classList.remove('show');
        });
    }

    if (btnSendServiceEmailAction) {
        btnSendServiceEmailAction.addEventListener('click', () => {
            alert('✅ 服務會通通知已成功發送給客戶與營業員 (Outlook)！');
            serviceEmailModal.classList.remove('show');
        });
    }

    // ----------------------------------------------------
    // Event Pinning Logic
    // ----------------------------------------------------
    const btnPinEvent = document.getElementById('btn-pin-event');
    const btnRegisterEvent = document.getElementById('btn-register-event');
    
    // Load pinned events
    let pinnedEvents = JSON.parse(localStorage.getItem('crm_pinned_events')) || [];
    // Auto-migrate old March date events to June 30
    let eventMigrated = false;
    pinnedEvents.forEach(e => {
        if (e.id === 'event-unh' && e.date === '2026/03/03') {
            e.date = '2026/06/30';
            eventMigrated = true;
        }
    });
    if (eventMigrated) {
        localStorage.setItem('crm_pinned_events', JSON.stringify(pinnedEvents));
    }

    const getUNHMockEvent = () => {
        return {
            id: 'event-unh',
            title: 'UnitedHealth Group (UNH, US)',
            date: '2026/06/30',
            time: '11:00',
            type: 'IR實體會議',
            analyst: 'UNH IR Team',
            attendees: '10/20',
            notes: '2026複委託活動(3月)'
        };
    };

    const updateEventPinUI = () => {
        if (!btnPinEvent) return;
        const isPinned = pinnedEvents.some(e => e.id === 'event-unh');
        if (isPinned) {
            btnPinEvent.textContent = '📌 已釘選至首頁';
            btnPinEvent.style.background = '#f39c12';
            btnPinEvent.style.borderColor = '#d35400';
            btnPinEvent.style.color = '#fff';
        } else {
            btnPinEvent.textContent = '📌 釘選至首頁';
            btnPinEvent.style.background = '#f1c40f';
            btnPinEvent.style.borderColor = '#f1c40f';
            btnPinEvent.style.color = '#333';
        }
    };

    if (btnPinEvent) {
        btnPinEvent.addEventListener('click', () => {
            const mockEvent = getUNHMockEvent();
            const index = pinnedEvents.findIndex(e => e.id === mockEvent.id);
            if (index > -1) {
                pinnedEvents.splice(index, 1);
                alert('❌ 已取消釘選活動！');
            } else {
                pinnedEvents.push(mockEvent);
                alert('📌 已成功釘選活動至首頁行事曆！');
            }
            localStorage.setItem('crm_pinned_events', JSON.stringify(pinnedEvents));
            updateEventPinUI();
        });
    }

    if (btnRegisterEvent) {
        btnRegisterEvent.addEventListener('click', () => {
            // Registering also auto-pins
            const mockEvent = getUNHMockEvent();
            const index = pinnedEvents.findIndex(e => e.id === mockEvent.id);
            if (index === -1) {
                pinnedEvents.push(mockEvent);
                localStorage.setItem('crm_pinned_events', JSON.stringify(pinnedEvents));
            }
            alert('✅ 報名成功！已將此活動加入您的首頁行事曆中。');
            updateEventPinUI();
        });
    }

    updateEventPinUI();

    // ----------------------------------------------------
    // URL Hash/Query Routing for direct navigation
    // ----------------------------------------------------
    const hashTabMap = {
        '#service':  'panel-records-list',
        '#analyst':  'panel-researchers',
        '#sales':    'panel-sales',
        '#firm':     'panel-firms',
        '#client':   'panel-clients',
        '#activity': 'panel-event-calendar',
    };

    const applyHashTab = () => {
        const hash = window.location.hash;
        let cleanHash = hash;
        if (hash.includes('?')) {
            cleanHash = hash.split('?')[0];
        }

        const queryParams = parseAllQueryParams();
        const isNewServiceAction = queryParams.action === 'new-service' || window.location.href.includes('action=new-service') || !!sessionStorage.getItem('crm_import_meeting');

        // Level-1 alignment
        if (cleanHash === '#activity') {
            if (btnEventGroup) {
                btnEventGroup.classList.add('active');
                btnServiceGroup.classList.remove('active');
                subtabsService.style.display = 'none';
                subtabsEvent.style.display = 'flex';
            }
        } else {
            if (btnServiceGroup) {
                btnServiceGroup.classList.add('active');
                btnEventGroup.classList.remove('active');
                subtabsService.style.display = 'flex';
                subtabsEvent.style.display = 'none';
            }
        }

        const targetId = hashTabMap[cleanHash] || 'panel-records-list';
        const activeSubtabsGroup = (cleanHash === '#activity') ? subtabsEvent : subtabsService;
        const matchingBtn = document.querySelector(`[data-target="${targetId}"]`);

        // Highlight matching subtab button
        if (activeSubtabsGroup) {
            activeSubtabsGroup.querySelectorAll('.marketing-tab-btn').forEach(b => {
                const bTarget = b.getAttribute('data-target');
                const isSelected = (bTarget === targetId) || (!matchingBtn && bTarget === 'panel-records-list' && cleanHash !== '#activity');
                
                if (isSelected) {
                    b.classList.add('active');
                    b.style.background = '#5C8ED6';
                    b.style.borderColor = '#5C8ED6';
                    b.style.color = 'white';
                    b.style.fontWeight = '600';
                } else {
                    b.classList.remove('active');
                    b.style.background = '#f8fafc';
                    b.style.borderColor = '#cbd5e1';
                    b.style.color = '#475569';
                    b.style.fontWeight = '500';
                }
            });
        }

        if (matchingBtn && pageTitle) {
            const cleanLabel = matchingBtn.innerText.split('\n')[0].trim();
            pageTitle.textContent = `行銷展業 - ${cleanLabel}`;
        }

        // Trigger action
        if (isNewServiceAction) {
            showFormView(false);
            if (btnBackToList) {
                btnBackToList.innerHTML = '← 返回首頁 (Home)';
                btnBackToList.style.backgroundColor = '#0093C1';
                btnBackToList.style.color = '#FFFFFF';
            }
            if (btnGoToMarketingList) {
                btnGoToMarketingList.style.display = 'inline-flex';
            }
        } else {
            hideAllPanels();
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.style.display = '';
            }
            if (btnBackToList) {
                btnBackToList.innerHTML = '← 返回列表';
                btnBackToList.style.backgroundColor = '';
                btnBackToList.style.color = '';
            }
            if (btnGoToMarketingList) {
                btnGoToMarketingList.style.display = 'none';
            }
        }
    };

    // ----------------------------------------------------
    // Mode Switch: Summary Dashboard vs Detail List (Option 2)
    // ----------------------------------------------------
    
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
    // --- Mode Toggle for Service Records (Summary Dashboard vs Details List) ---
    const btnModeSummary = document.getElementById('btn-mode-summary');
    const btnModeDetails = document.getElementById('btn-mode-details');
    const summaryDashboardPanel = document.getElementById('summary-dashboard-panel');
    const detailsListPanel = document.getElementById('details-list-panel');

    if (btnModeSummary && btnModeDetails && summaryDashboardPanel && detailsListPanel) {
        btnModeSummary.addEventListener('click', () => {
            btnModeSummary.classList.add('active');
            btnModeSummary.style.background = '#5C8ED6';
            btnModeSummary.style.color = 'white';

            btnModeDetails.classList.remove('active');
            btnModeDetails.style.background = 'white';
            btnModeDetails.style.color = '#374151';

            summaryDashboardPanel.style.display = 'flex';
            detailsListPanel.style.display = 'none';
            
            if(typeof refreshDashboards === 'function') refreshDashboards();
        });

        btnModeDetails.addEventListener('click', () => {
            btnModeDetails.classList.add('active');
            btnModeDetails.style.background = '#5C8ED6';
            btnModeDetails.style.color = 'white';

            btnModeSummary.classList.remove('active');
            btnModeSummary.style.background = 'white';
            btnModeSummary.style.color = '#374151';

            detailsListPanel.style.display = 'block';
            summaryDashboardPanel.style.display = 'none';
            refreshServiceRecordsTable();
        });
    }


    // Sub-tab Navigation inside Summary Dashboard
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subDashboardPanels = document.querySelectorAll('.sub-dashboard-panel');

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all sub-tabs
            subTabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = '#F3F4F6';
                b.style.color = '#374151';
            });
            
            // Hide all sub-panels via display:none
            subDashboardPanels.forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none';
            });

            // Activate current sub-tab
            btn.classList.add('active');
            btn.style.background = '#E3F2FD';
            btn.style.color = '#0D47A1';
            
            // Show target panel with correct display:grid style
            const targetSub = btn.getAttribute('data-sub');
            const targetPanel = document.getElementById(`sub-panel-${targetSub}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.style.setProperty('display', 'grid', 'important');
            }
            refreshDashboards();
        });
    });

    // ----------------------------------------------------
    // Dynamic Chart SVGs & Table Renderings
    // ----------------------------------------------------
    function drawDonutChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let accumulatedPercent = 0;
        
        let svgContent = `<svg width="150" height="150" viewBox="0 0 42 42" style="transform: rotate(-90deg);">
            <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>
            <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="4"></circle>`;
            
        const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
        
        data.forEach((item, index) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            if (percent <= 0) return;
            const strokeDasharray = `${percent} ${100 - percent}`;
            const strokeDashoffset = 100 - accumulatedPercent;
            const color = colors[index % colors.length];
            
            svgContent += `
            <circle cx="21" cy="21" r="15.91549430918954" 
                    fill="transparent" stroke="${color}" stroke-width="4.5" 
                    stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"
                    style="transition: stroke-width 0.2s; cursor: pointer;">
                <title>${item.name}: ${item.value}小時 (${percent.toFixed(1)}%)</title>
            </circle>`;
            
            accumulatedPercent += percent;
        });
        
        svgContent += `</svg>`;
        
        // Add legend alongside
        let legendContent = `<div style="display:flex; flex-direction:column; gap:6px; font-size:11px; width:100%; max-width:140px; margin-left:10px;">`;
        data.forEach((item, index) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            const color = colors[index % colors.length];
            legendContent += `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div style="display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    <span style="width:8px; height:8px; border-radius:50%; background:${color}; display:inline-block; flex-shrink:0;"></span>
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
                </div>
                <span style="font-weight:600; color:#475569; margin-left:6px; flex-shrink:0;">${item.value}h (${Math.round(percent)}%)</span>
            </div>`;
        });
        legendContent += `</div>`;
        
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'space-around';
        container.innerHTML = svgContent + legendContent;
    }

    function drawBarChart(containerId, categories, barData, lineData, barLabel, lineLabel) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Measure real width of container
        const rect = container.getBoundingClientRect();
        const svgWidth = rect.width > 50 ? rect.width : 280;
        const svgHeight = 260;
        const paddingLeft = 42;
        const paddingRight = lineData ? 42 : 16;
        const paddingTop = 24;
        const paddingBottom = 40;
        
        const chartWidth = svgWidth - paddingLeft - paddingRight;
        const chartHeight = svgHeight - paddingTop - paddingBottom;
        
        const maxBar = Math.max(...barData, 5);
        const maxLine = lineData ? Math.max(...lineData, 100000) : 0;
        
        let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
        
        // Y-Axis grid lines
        for (let i = 0; i <= 4; i++) {
            const y = paddingTop + (chartHeight * (4 - i)) / 4;
            const barVal = Math.round((maxBar * i) / 4);
            svgContent += `
            <line x1="${paddingLeft}" y1="${y}" x2="${svgWidth - paddingRight}" y2="${y}" stroke="#f1f5f9" stroke-width="1" />
            <text x="${paddingLeft - 8}" y="${y + 4}" font-size="9" fill="#94a3b8" text-anchor="end">${barVal}h</text>`;
            
            if (lineData) {
                const lineVal = Math.round((maxLine * i) / 4);
                let lineValFormatted = lineVal >= 1000000 ? (lineVal / 1000000).toFixed(1) + 'M' : (lineVal / 1000).toFixed(0) + 'K';
                svgContent += `
                <text x="${svgWidth - paddingRight + 8}" y="${y + 4}" font-size="9" fill="#94a3b8" text-anchor="start">${lineValFormatted}</text>`;
            }
        }
        
        const barGroupWidth = (chartWidth / categories.length);
        const barWidth = barGroupWidth * 0.45;
        
        // Draw Bars
        const linePoints = [];
        categories.forEach((cat, index) => {
            const x = paddingLeft + (index * barGroupWidth) + (barGroupWidth - barWidth) / 2;
            const barVal = barData[index];
            const barH = (barVal / maxBar) * chartHeight;
            const y = paddingTop + chartHeight - barH;
            
            svgContent += `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="#3b82f6" rx="3">
                <title>${cat} ${barLabel}: ${barVal} 小時</title>
            </rect>
            <text x="${x + barWidth/2}" y="${svgHeight - 24}" font-size="10" fill="#64748B" text-anchor="middle">${cat}</text>`;
            
            if (lineData) {
                const lineVal = lineData[index];
                const lineY = paddingTop + chartHeight - (lineVal / maxLine) * chartHeight;
                linePoints.push(`${x + barWidth/2},${lineY}`);
                
                // Dot
                svgContent += `
                <circle cx="${x + barWidth/2}" cy="${lineY}" r="4" fill="#ef4444" stroke="#fff" stroke-width="1">
                    <title>${cat} ${lineLabel}: ${lineVal.toLocaleString()}</title>
                </circle>`;
            }
        });
        
        // Draw Line
        if (lineData && linePoints.length > 0) {
            svgContent += `
            <polyline points="${linePoints.join(' ')}" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
        }
        
        // Legends
        svgContent += `
        <g transform="translate(${paddingLeft}, ${svgHeight - 12})">
            <rect x="0" y="0" width="10" height="6" fill="#3b82f6" rx="1" />
            <text x="14" y="7" font-size="9" fill="#64748b">${barLabel}</text>
        </g>`;
        
        if (lineData) {
            svgContent += `
            <g transform="translate(${paddingLeft + 120}, ${svgHeight - 12})">
                <line x1="0" y1="3" x2="16" y2="3" stroke="#ef4444" stroke-width="2" />
                <circle cx="8" cy="3" r="3" fill="#ef4444" />
                <text x="22" y="7" font-size="9" fill="#64748b">${lineLabel}</text>
            </g>`;
        }
        
        svgContent += `</svg>`;
        container.innerHTML = svgContent;
    }

    function refreshDashboards() {
        const services = getAllServices();
        
        // -------------------------
        // 1. CLIENT DASHBOARD DATA
        // -------------------------
        // Group by Firm
        const clientHours = {};
        services.forEach(s => {
            const firm = s.firm || '其他';
            const hr = parseFloat(s.duration || 0) / 60;
            clientHours[firm] = (clientHours[firm] || 0) + hr;
        });
        
        const clientHoursData = Object.keys(clientHours).map(k => ({
            name: k,
            value: Math.round(clientHours[k] * 10) / 10
        })).sort((a, b) => b.value - a.value);

        drawDonutChart('client-pie-chart-wrapper', clientHoursData);

        // Bar Line Chart values matching clients
        const clientNames = clientHoursData.map(d => d.name);
        const clientBarVals = clientHoursData.map(d => d.value);
        // Mock Trade Volumes matching the clients
        const mockVols = { 'FMR': 6200000, 'Oasis': 7800000, 'AP Asset': 1500000 };
        const clientLineVals = clientNames.map(name => mockVols[name] || 500000);

        drawBarChart('client-bar-chart-wrapper', clientNames, clientBarVals, clientLineVals, '服務時數 (h)', '交易量 (USD)');

        // ROI Ranking Table calculation
        const clientTableBody = document.querySelector('#client-roi-table tbody');
        if (clientTableBody) {
            clientTableBody.innerHTML = '';
            // Mock ROI: Volume / hours ratio rounded
            const roiData = clientNames.map((name, idx) => {
                const hours = clientBarVals[idx] || 1;
                const vol = clientLineVals[idx];
                const roi = Math.round(vol / (hours * 10));
                return { name, roi };
            }).sort((a,b) => b.roi - a.roi);

            roiData.forEach(item => {
                clientTableBody.innerHTML += `
                <tr>
                    <td style="padding:6px; font-weight:600; text-align:center;">${item.name}</td>
                    <td style="padding:6px; text-align:right; font-weight:700; color:#16A34A;">${item.roi.toLocaleString()}</td>
                </tr>`;
            });
        }

        // -------------------------
        // 2. SALES Rep DASHBOARD DATA
        // -------------------------
        const salesHours = {};
        const salesClients = {};
        services.forEach(s => {
            const rep = s.sales || '未分派';
            const hr = parseFloat(s.duration || 0) / 60;
            salesHours[rep] = (salesHours[rep] || 0) + hr;
            if (!salesClients[rep]) salesClients[rep] = new Set();
            if (s.firm) salesClients[rep].add(s.firm);
        });

        const salesHoursData = Object.keys(salesHours).map(k => ({
            name: k,
            value: Math.round(salesHours[k] * 10) / 10
        })).sort((a, b) => b.value - a.value);

        drawDonutChart('sales-pie-chart-wrapper', salesHoursData);

        const repNames = salesHoursData.map(d => d.name);
        const repBarVals = salesHoursData.map(d => d.value);
        const repClientCounts = repNames.map(name => salesClients[name] ? salesClients[name].size : 0);

        drawBarChart('sales-bar-chart-wrapper', repNames, repBarVals, repClientCounts, '累計時數 (h)', '服務客戶數');

        // Broker ranking table
        const salesTableBody = document.querySelector('#sales-ranking-table tbody');
        if (salesTableBody) {
            salesTableBody.innerHTML = '';
            repNames.forEach((name, idx) => {
                const score = Math.round((repBarVals[idx] * 40) + (repClientCounts[idx] * 20));
                salesTableBody.innerHTML += `
                <tr>
                    <td style="padding:6px; font-weight:600; text-align:center;">${name}</td>
                    <td style="padding:6px; text-align:right; font-weight:700; color:#0284C7;">${score} 分</td>
                </tr>`;
            });
        }

        // -------------------------
        // 3. ANALYST DASHBOARD DATA
        // -------------------------
        const analystHours = {};
        const analystMentions = {};
        services.forEach(s => {
            const name = s.analyst || '未分派';
            const hr = parseFloat(s.duration || 0) / 60;
            analystHours[name] = (analystHours[name] || 0) + hr;
            if (s.interest) {
                analystMentions[name] = (analystMentions[name] || 0) + 1;
            }
        });

        const analystHoursData = Object.keys(analystHours).map(k => ({
            name: k,
            value: Math.round(analystHours[k] * 10) / 10
        })).sort((a, b) => b.value - a.value);

        drawDonutChart('analyst-pie-chart-wrapper', analystHoursData);

        const analystNames = analystHoursData.map(d => d.name);
        const analystBarVals = analystNames.map(name => analystMentions[name] || 0);
        const analystLineVals = analystHoursData.map(d => d.value);

        drawBarChart('analyst-bar-chart-wrapper', analystNames, analystBarVals, analystLineVals, '個股推薦數', '服務時數 (h)');

        const analystTableBody = document.querySelector('#analyst-ranking-table tbody');
        if (analystTableBody) {
            analystTableBody.innerHTML = '';
            analystNames.forEach((name, idx) => {
                const count = services.filter(s => s.analyst === name).length;
                analystTableBody.innerHTML += `
                <tr>
                    <td style="padding:6px; font-weight:600; text-align:center;">${name}</td>
                    <td style="padding:6px; text-align:right; font-weight:700; color:#7C3AED;">${count} 次</td>
                </tr>`;
            });
        }
    }

    // ----------------------------------------------------
    // Service Records Table Rendering & Filtering
    // ----------------------------------------------------
    const refreshServiceRecordsTable = () => {
        const tbody = document.querySelector('#service-records-table tbody');
        if (!tbody) return;

        const allServices = getAllServices();

        const dateVal = document.getElementById('filter-date') ? document.getElementById('filter-date').value : '';
        const coverageVal = document.getElementById('filter-coverage') ? document.getElementById('filter-coverage').value : '全部';
        const analystVal = document.getElementById('filter-analyst') ? document.getElementById('filter-analyst').value.trim().toLowerCase() : '';
        const firmVal = document.getElementById('filter-firm') ? document.getElementById('filter-firm').value.trim().toLowerCase() : '';
        const typeVal = document.getElementById('filter-type') ? document.getElementById('filter-type').value : '全部';
        const methodVal = document.getElementById('filter-method') ? document.getElementById('filter-method').value : '全部';
        const interestVal = document.getElementById('filter-interest') ? document.getElementById('filter-interest').value.trim().toLowerCase() : '';

        const filtered = allServices.filter(s => {
            if (dateVal) {
                if (!s.date) return false;
                const sDateFormatted = s.date.replace(/\//g, '-');
                if (sDateFormatted !== dateVal) return false;
            }
            if (coverageVal !== '全部') {
                if (coverageVal === 'Fubon Only') {
                    if (s.coverage !== 'Fubon') return false;
                } else {
                    if (s.coverage !== coverageVal) return false;
                }
            }
            if (analystVal) {
                const zh = s.analyst ? s.analyst.toLowerCase() : '';
                if (!zh.includes(analystVal)) return false;
            }
            if (firmVal) {
                const f = s.firm ? s.firm.toLowerCase() : '';
                if (!f.includes(firmVal)) return false;
            }
            if (typeVal !== '全部') {
                const typeStr = s.type ? s.type.trim().toLowerCase() : '';
                const filterTypeStr = typeVal.trim().toLowerCase();
                if (!typeStr.includes(filterTypeStr) && !filterTypeStr.includes(typeStr)) return false;
            }
            if (methodVal !== '全部') {
                const methodStr = s.method ? s.method.trim().toLowerCase() : '';
                const filterMethodStr = methodVal.trim().toLowerCase();
                if (!methodStr.includes(filterMethodStr) && !filterMethodStr.includes(methodStr)) return false;
            }
            if (interestVal) {
                const interestStr = s.interest ? s.interest.toLowerCase() : '';
                if (!interestStr.includes(interestVal)) return false;
            }
            return true;
        });

        tbody.innerHTML = '';
        filtered.forEach(record => {
            const tr = document.createElement('tr');
            tr.className = 'record-row';
            tr.setAttribute('data-id', record.id);
            
            // Determine trader
            const trader = record.salesTrader || (record.sales === 'Charlie Zhao' ? 'Jason Chang' : (record.sales === 'Ann Liao' ? 'Terry' : 'David Lin'));

            tr.innerHTML = `
                <td style="text-align: center;"><button class="service-pin-btn" data-id="${record.id}" style="background:none; border:none; font-size:18px; cursor:pointer; color:#f1c40f;">★</button></td>
                <td>${record.date}</td>
                <td>${record.coverage}</td>
                <td><span class="text-link trigger-researcher">${record.analyst}</span></td>
                <td><span class="text-link trigger-sales">${record.sales}</span></td>
                <td>${trader}</td>
                <td><span class="text-link trigger-firm">${record.firm}</span></td>
                <td><span class="text-link trigger-client">${record.client}</span></td>
                <td>${record.type}</td>
                <td>${record.method}</td>
                <td>${record.duration}</td>
                <td>${record.format}</td>
                <td>${record.time}</td>
                <td><span class="text-link">${record.email}</span></td>
                <td><span class="text-link trigger-form">${record.topic}</span></td>
                <td>${record.interest}</td>
                <td>${record.analystEmail}</td>
            `;
            tbody.appendChild(tr);
        });

        bindRowClickEvents();
        bindPinClickEvents();
        updatePinStarsUI();
    };

    // Bind filters Search & Reset buttons
    const btnSearchRecords = document.getElementById('btn-search-records');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    if (btnSearchRecords) {
        btnSearchRecords.addEventListener('click', refreshServiceRecordsTable);
    }
    if (btnResetFilters) {
        btnResetFilters.addEventListener('click', () => {
            if (document.getElementById('filter-date')) document.getElementById('filter-date').value = '';
            if (document.getElementById('filter-coverage')) document.getElementById('filter-coverage').value = '全部';
            if (document.getElementById('filter-analyst')) document.getElementById('filter-analyst').value = '';
            if (document.getElementById('filter-firm')) document.getElementById('filter-firm').value = '';
            if (document.getElementById('filter-type')) document.getElementById('filter-type').value = '全部';
            if (document.getElementById('filter-method')) document.getElementById('filter-method').value = '全部';
            if (document.getElementById('filter-interest')) document.getElementById('filter-interest').value = '';
            refreshServiceRecordsTable();
        });
    }

    // Reset filters on initial load to prevent browser cache/autofill corruption
    if (document.getElementById('filter-date')) document.getElementById('filter-date').value = '';
    if (document.getElementById('filter-coverage')) document.getElementById('filter-coverage').value = '全部';
    if (document.getElementById('filter-analyst')) document.getElementById('filter-analyst').value = '';
    if (document.getElementById('filter-firm')) document.getElementById('filter-firm').value = '';
    if (document.getElementById('filter-type')) document.getElementById('filter-type').value = '全部';
    if (document.getElementById('filter-method')) document.getElementById('filter-method').value = '全部';
    if (document.getElementById('filter-interest')) document.getElementById('filter-interest').value = '';

    // Trigger dashboard and table render on load
    try {
        refreshDashboards();
    } catch (e) {
        console.warn("Non-fatal: Failed to refresh dashboards on load:", e);
    }

    try {
        refreshServiceRecordsTable();
    } catch (e) {
        console.error("Fatal: Failed to refresh service records table on load:", e);
    }

    // ----------------------------------------------------
    // Bind dynamic refresh to CRUD actions
    // ----------------------------------------------------
    // Wrap original render function or hook into save to auto-update
    const originalSaveRecord = document.getElementById('btn-save-record');
    if (originalSaveRecord) {
        originalSaveRecord.addEventListener('click', () => {
            // Small timeout to allow localStorage to update
            setTimeout(refreshDashboards, 200);
        });
    }

    // ----------------------------------------------------
    // Pending Bookings Management (會通/預約排程需求清單)
    // ----------------------------------------------------
    const refreshPendingBookingsUI = () => {
        const container = document.getElementById('event-pending-bookings-container');
        const list = document.getElementById('event-pending-bookings-list');
        if (!container || !list) return;

        const bookings = safeJsonParse('crm_pending_bookings', []);
        if (bookings.length === 0) {
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
            list.innerHTML = bookings.map(b => `
                <div style="background:white; border:1px solid #FDE68A; border-radius:6px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display:flex; flex-direction:column; gap:2px; text-align:left;">
                        <span style="font-weight:600; color:#1E293B; font-size:13px;">預約分析師/專家：${b.analystName}</span>
                        <span style="font-size:12px; color:#64748B;">需求客戶：${b.client} | 建立時間：${b.createdTime}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="background:#FEF3C7; color:#D97706; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:600;">${b.status}</span>
                        <button class="btn btn-secondary btn-cancel-booking-action" data-id="${b.id}" style="padding:4px 8px; font-size:11px; background:#F1F5F9; border-color:#CBD5E1; color:#475569; min-width:unset; cursor:pointer;">取消預約</button>
                    </div>
                </div>
            `).join('');

            // Bind cancel buttons
            list.querySelectorAll('.btn-cancel-booking-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    let currentBookings = safeJsonParse('crm_pending_bookings', []);
                    currentBookings = currentBookings.filter(x => x.id !== id);
                    localStorage.setItem('crm_pending_bookings', JSON.stringify(currentBookings));
                    refreshPendingBookingsUI();
                    
                    // Reset reserving button if details panel is showing this analyst
                    const detailBtn = document.getElementById('btn-reserve-researcher');
                    if (detailBtn && detailBtn.getAttribute('data-status') === 'pending') {
                        let bookingId = '';
                        const card = detailBtn.closest('.profile-header-card');
                        if (card) {
                            const h2 = card.querySelector('h2');
                            if (h2) {
                                bookingId = 'booking-' + h2.textContent;
                            }
                        }
                        // Simplified fallback check or reset anyway
                        detailBtn.setAttribute('data-status', 'idle');
                        detailBtn.innerHTML = '預約';
                        detailBtn.style.backgroundColor = '#4A90E2';
                        detailBtn.style.borderColor = '#4A90E2';
                    }
                });
            });
        }
    };

    // Initial load for pending bookings
    refreshPendingBookingsUI();

    // Apply on initial load
    applyHashTab();

    // Handle in-page hash navigation
    window.addEventListener('hashchange', applyHashTab);


    } catch (e) {
        console.error('CRITICAL INIT ERROR:', e);
        const banner = document.getElementById('js-error-banner');
        if (banner) {
            banner.style.display = 'block';
            banner.innerHTML = `&#128680; <b>JS Load Error:</b> ${e.message}<br><pre style="font-size:11px;text-align:left;white-space:pre-wrap;word-break:break-all;">${e.stack}</pre>`;
        }
    }
});

