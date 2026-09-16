document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------
    // Tab & Dropdown Logic
    // ----------------------------------------
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const tabCalendarBtn = document.querySelector('[data-target="tab-calendar"]');
    const tabDropdown = document.querySelector('.tab-dropdown');
    const dropdownItems = document.querySelectorAll('.tab-dropdown li');
    
    // Elements for Dynamic Calendar Table
    const calendarTitle = document.getElementById('calendar-list-title');
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    const addServiceShortcutBtn = document.getElementById('add-service-shortcut-btn');
    const calendarTable = document.getElementById('calendar-table');
    
    // Helper to get real-time system today date
    const getSystemTodayDate = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return {
            year: yyyy,
            month: now.getMonth(),
            dateStr: `${yyyy}/${mm}/${dd}`
        };
    };

    // Global calendar state initialized with real system today date
    const sysTodayInfo = getSystemTodayDate();
    let currentDate = sysTodayInfo.dateStr;
    let currentType = 'personal';
    let viewYear = sysTodayInfo.year;
    let viewMonth = sysTodayInfo.month;

    // ----------------------------------------
    // LocalStorage Data Access Helper Functions & Mock Data (8月、9月假資料)
    // ----------------------------------------
    
    // Format date normalizer (converts 2026/03/10 to 2026/3/10 for comparison)
    const normalizeDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length !== 3) return dateStr;
        return `${parts[0]}/${parseInt(parts[1])}/${parseInt(parts[2])}`;
    };

    // Default Mock Data for Aug & Sep 2026 (訪客 / 法說會 / 內部會議)
    const defaultPersonalSchedules = [
        { id: 'p-aug-1', title: '台積電 Q3 季度訪談與業務對接 (訪客)', date: '2026/08/14', start: '10:00', end: '11:30', notes: '信義總部 15F 會議室 A' },
        { id: 'p-aug-2', title: '聯發科法人高層來訪談判 (訪客)', date: '2026/08/18', start: '14:00', end: '15:30', notes: 'VIP 貴賓室接待' },
        { id: 'p-aug-3', title: 'CRM 系統代理與權限跨部會討論 (內部會議)', date: '2026/08/21', start: '09:30', end: '10:30', notes: '線上 Teams 會議' },
        { id: 'p-aug-4', title: '國泰金控合約簽署與週會 (內部會議)', date: '2026/08/25', start: '11:00', end: '12:00', notes: '法務與營業主管共同參與' },
        { id: 'p-aug-dual-1', title: '聯發科高層來訪簡報與交流 (訪客)', date: '2026/08/24', start: '09:30', end: '11:00', notes: 'VIP 簡報室 A (同日有研究員會議)' },
        { id: 'p-aug-dual-2', title: '產學合作與實習生培訓週會 (內部會議)', date: '2026/08/28', start: '10:00', end: '11:30', notes: '線上 Teams 會議 (同日有法說會)' },
        { id: 'p-sep-1', title: '富邦投信 9月資產配置協調會 (內部會議)', date: '2026/09/02', start: '09:00', end: '10:30', notes: '大會堂簡報' },
        { id: 'p-sep-2', title: '外資機構 BlackRock 拜訪交流 (訪客)', date: '2026/09/08', start: '15:00', end: '16:30', notes: '簡報產能與庫存數據' },
        { id: 'p-sep-3', title: '鴻海科技日會前討論 (內部會議)', date: '2026/09/15', start: '13:30', end: '15:00', notes: '策略合作規劃' },
        { id: 'p-sep-4', title: '日月光半導體季度檢討會 (訪客)', date: '2026/09/22', start: '10:30', end: '12:00', notes: '廠區參訪與會議' },
        { id: 'p-sep-dual-1', title: '鴻海 S 樓層產線維護討論 (內部會議)', date: '2026/09/14', start: '11:00', end: '12:00', notes: '研發團隊會議室 (同日有研究員會議)' },
        { id: 'p-sep-dual-2', title: '摩根大通 (J.P. Morgan) 訪客接洽 (訪客)', date: '2026/09/21', start: '14:00', end: '15:30', notes: '接待大廳與會客室 (同日有研究員會議)' }
    ];

    const defaultPinnedServices = [
        // 來自服務管理明細之已釘選示範服務紀錄 (media_1788844357166.png)
        { id: 'service-2025-1', topic: 'TSMC 2Q earnings', topicCompany: 'FMR', date: '2025/08/10', time: '10:05', serviceType: 'One off client meeting', speaker: 'Sherman Shang', attendees: '1x1', notes: '台積電第二季法說會與獲利分析', linkUrl: 'marketing.html?serviceId=service-2025-1&from=home#service-detail' },
        { id: 'service-2025-2', topic: 'MTK ASICs potential', topicCompany: 'Oasis', date: '2025/08/11', time: '11:00', serviceType: 'Bespoke client request', speaker: 'Sherman Shang', attendees: '1x1', notes: '聯發科特殊應用晶片潛力探討', linkUrl: 'marketing.html?serviceId=service-2025-2&from=home#service-detail' },
        { id: 'service-2025-3', topic: 'TSMC GM question', topicCompany: 'AP Asset', date: '2025/08/11', time: '9:00', serviceType: 'One off client meeting', speaker: 'Sherman Shang', attendees: '1x1', notes: '毛利率與資本支出展望', linkUrl: 'marketing.html?serviceId=service-2025-3&from=home#service-detail' },
        { id: 'service-101', topic: 'TSMC 1Q Preview', topicCompany: 'FMR', date: '2026/01/08', time: '10:00', serviceType: 'One off client meeting', speaker: 'Sherman Shang', attendees: '1x1', notes: '第一季財報先行預覽', linkUrl: 'marketing.html?serviceId=service-101&from=home#service-detail' },
        { id: 'service-102', topic: 'Financial Sector Earnings', topicCompany: 'Oasis', date: '2026/01/15', time: '11:30', serviceType: 'Bespoke client request', speaker: 'Titan Wang', attendees: '1x1', notes: '金控族群獲利與股利政策', linkUrl: 'marketing.html?serviceId=service-102&from=home#service-detail' },
        { id: 's-aug-1', topic: '【研究員會議】台積電法說會前個股聚焦與產業評估', topicCompany: '富邦投顧', date: '2026/08/17', time: '10:00~11:30', serviceType: 'One off client meeting', speaker: 'Sherman Shang', attendees: '15人', notes: '研討 AI 晶片需求與 3nm 產能利用率', linkUrl: 'marketing.html?serviceId=s-aug-1&from=home#service-detail' },
        { id: 's-aug-2', topic: '【研究員會議】聯發科 Dimensity 旗艦晶片策略評估', topicCompany: '富邦投顧', date: '2026/08/24', time: '14:00~15:30', serviceType: 'One off client meeting', speaker: 'Titan Wang', attendees: '20人', notes: '客戶投資簡報與手機庫存回溫分析', linkUrl: 'marketing.html?serviceId=s-aug-2&from=home#service-detail' },
        { id: 's-aug-3', topic: '台股下半年 AI 供應鏈趨勢論壇 (法說會)', topicCompany: '富邦投顧', date: '2026/08/28', time: '14:00~16:00', serviceType: 'One off client meeting', speaker: '張研究員', attendees: '45人', notes: '實體論壇與線上直播', linkUrl: 'marketing.html?serviceId=s-aug-3&from=home#service-detail' },
        { id: 's-sep-2-1', topic: '【研究員會議】電動車與車用半導體大廠專題簡報', topicCompany: '富邦投顧', date: '2026/09/14', time: '15:00', serviceType: 'One off client meeting', speaker: 'Sherman Shang', attendees: '18人', notes: '鴻海與車用 Tier 1 供應商研討', linkUrl: 'marketing.html?serviceId=s-sep-2-1&from=home#service-detail' },
        { id: 's-sep-2-2', topic: '【研究員會議】電動車與車用半導體大廠專題簡報', topicCompany: '富邦投顧', date: '2026/09/14', time: '15:00', serviceType: 'Model request', speaker: 'Sherman Shang', attendees: '-', notes: '', linkUrl: 'marketing.html?serviceId=s-sep-2-2&from=home#service-detail' },
        { id: 's-sep-3-1', topic: '2026 Q3 全球半導體展望法說會 (法說會)', topicCompany: '富邦投顧', date: '2026/09/18', time: '10:00', serviceType: 'One off client meeting', speaker: 'Sherman Shang', attendees: '60人', notes: '法人客戶專屬說明會', linkUrl: 'marketing.html?serviceId=s-sep-3-1&from=home#service-detail' },
        { id: 's-sep-3-2', topic: '2026 Q3 全球半導體展望法說會 (法說會)', topicCompany: '富邦投顧', date: '2026/09/18', time: '10:00', serviceType: 'Model request', speaker: 'Sherman Shang', attendees: '-', notes: '', linkUrl: 'marketing.html?serviceId=s-sep-3-2&from=home#service-detail' },
        { id: 's-sep-4-1', topic: '【研究員會議】美股科技巨頭財報 Preview 與總體經濟', topicCompany: '富邦投顧', date: '2026/09/21', time: '09:30', serviceType: 'One off client meeting', speaker: 'Titan Wang', attendees: '30人', notes: '聯準會利率決策與科技股估值', linkUrl: 'marketing.html?serviceId=s-sep-4-1&from=home#service-detail' }
    ];

    const defaultPinnedServiceIds = [
        'service-2025-1', 'service-2025-2', 'service-2025-3', 'service-101', 'service-102',
        's-sep-2-1', 's-sep-2-2', 's-sep-3-1', 's-sep-3-2', 's-sep-4-1', 's-aug-1', 's-aug-2', 's-aug-3'
    ];

        const defaultPinnedEvents = [
        { id: 'e-aug-1', topic: '富邦尊榮法人客戶高爾夫球聚會 (活動)', topicCompany: '富邦金控', date: '2026/08/19', time: '08:00~13:00', serviceType: '活動', speaker: '展業二組', attendees: '20人', notes: '美麗華高爾夫球場' },
        { id: 'e-sep-1', topic: '秋季法人投資論壇與晚宴 (法說會/活動)', topicCompany: '富邦金控', date: '2026/09/25', time: '17:30~21:00', serviceType: '活動', speaker: '展業部', attendees: '80人', notes: '萬豪酒店 3F 宴會廳' }
    ];

    // Get Personal Schedules
    const getPersonalSchedules = () => {
        let list = JSON.parse(localStorage.getItem('crm_personal_schedules'));
        if (!list || !Array.isArray(list) || !list.some(item => item.id === 'p-aug-dual-1')) {
            localStorage.setItem('crm_personal_schedules', JSON.stringify(defaultPersonalSchedules));
            return defaultPersonalSchedules;
        }
        return list;
    };

    // Get Pinned Service IDs (首頁僅顯示有被釘選加入個人行事曆之服務)
    const getPinnedServiceIds = () => {
        let ids = JSON.parse(localStorage.getItem('crm_pinned_services_ids') || 'null');
        if (ids === null || !Array.isArray(ids)) {
            ids = [...defaultPinnedServiceIds];
            localStorage.setItem('crm_pinned_services_ids', JSON.stringify(ids));
        } else {
            // 清理舊有的測試 pending ID
            const filteredIds = ids.filter(cid => !cid.startsWith('cal-pending-'));
            const corePinned = [
                'service-2025-1', 'service-2025-2', 'service-2025-3', 'service-101', 'service-102'
            ];
            let changed = (filteredIds.length !== ids.length);
            ids = filteredIds;
            corePinned.forEach(cid => {
                if (!ids.includes(cid)) {
                    ids.push(cid);
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem('crm_pinned_services_ids', JSON.stringify(ids));
            }
        }
        return ids;
    };

    // Get Pinned Event IDs
    const getPinnedEventIds = () => {
        let ids = JSON.parse(localStorage.getItem('crm_pinned_events_ids') || 'null');
        if (ids === null || !Array.isArray(ids)) {
            ids = ['e-aug-1'];
            localStorage.setItem('crm_pinned_events_ids', JSON.stringify(ids));
        }
        return ids;
    };

    // Get All Available Services Pool (含預設資料庫、明細釘選快取與自訂建立紀錄)
    const getAllAvailableServices = () => {
        const list = [...defaultPinnedServices];

        // 1. 合併自 marketing.html 同步之所有釘選服務物件 (含預設與自訂)
        const pinnedFromStorage = JSON.parse(localStorage.getItem('crm_pinned_services') || '[]');
        if (Array.isArray(pinnedFromStorage)) {
            pinnedFromStorage.forEach(s => {
                if (s && s.id) {
                    const existingIdx = list.findIndex(x => x.id === s.id);
                    const itemData = {
                        id: s.id,
                        serviceName: s.serviceName || '',
                        topic: s.serviceName || s.topic || s.title || s.topicCompany || '服務紀錄',
                        topicCompany: s.firm || '富邦投顧',
                        date: s.date ? s.date.replace(/-/g, '/') : '2026/09/08',
                        time: s.time || '10:00',
                        serviceType: s.type || s.serviceType || 'One off client meeting',
                        speaker: s.analyst || s.speaker || '研究員',
                        attendees: s.format || s.attendees || '-',
                        interest: s.interest || '',
                        notes: s.notes || '',
                        linkUrl: `marketing.html?serviceId=${encodeURIComponent(s.id)}&from=home#service-detail`
                    };
                    if (existingIdx > -1) {
                        list[existingIdx] = itemData;
                    } else {
                        list.push(itemData);
                    }
                }
            });
        }

        // 2. 合併使用者於服務管理新增之自訂服務紀錄 (crm_custom_services)
        const customServices = JSON.parse(localStorage.getItem('crm_custom_services') || '[]');
        if (Array.isArray(customServices)) {
            customServices.forEach(cs => {
                if (cs && cs.id) {
                    const existingIdx = list.findIndex(x => x.id === cs.id);
                    const itemData = {
                        id: cs.id,
                        serviceName: cs.serviceName || '',
                        topic: cs.serviceName || cs.topic || cs.title || '自訂服務',
                        topicCompany: cs.firm || '富邦投顧',
                        date: cs.date ? cs.date.replace(/-/g, '/') : '2026/09/08',
                        time: cs.time || '10:00',
                        serviceType: cs.type || cs.serviceType || 'One off client meeting',
                        speaker: cs.analyst || cs.speaker || '研究員',
                        attendees: cs.format || cs.attendees || '-',
                        interest: cs.interest || '',
                        notes: cs.notes || '',
                        linkUrl: `marketing.html?serviceId=${encodeURIComponent(cs.id)}&from=home#service-detail`
                    };
                    if (existingIdx > -1) {
                        list[existingIdx] = itemData;
                    } else {
                        list.push(itemData);
                    }
                }
            });
        }
        return list;
    };

    // Get Pinned Services (關鍵：僅回傳有在 crm_pinned_services_ids 釘選清單中的服務，並保證完全對應)
    const getPinnedServices = () => {
        const pinnedIds = getPinnedServiceIds();
        const allServices = getAllAvailableServices();
        const directPinned = JSON.parse(localStorage.getItem('crm_pinned_services') || '[]');
        const directPinnedIds = Array.isArray(directPinned) ? directPinned.map(x => x.id).filter(Boolean) : [];
        const combinedIds = Array.from(new Set([...pinnedIds, ...directPinnedIds]));
        return allServices.filter(item => combinedIds.includes(item.id));
    };

    // Get Pinned Events
    const getPinnedEvents = () => {
        let list = JSON.parse(localStorage.getItem('crm_pinned_events') || 'null');
        if (!list || !Array.isArray(list) || list.length === 0) {
            localStorage.setItem('crm_pinned_events', JSON.stringify(defaultPinnedEvents));
            return defaultPinnedEvents;
        }
        return list;
    };

    // Helper to compare dates (dateStr >= targetStr)
    const isDateGe = (dateStr, targetStr) => {
        const d = new Date(dateStr.replace(/\//g, '-'));
        const t = new Date(targetStr.replace(/\//g, '-'));
        d.setHours(0,0,0,0);
        t.setHours(0,0,0,0);
        return d >= t;
    };

    // Helper to sort items by date ascending
    const sortByDate = (arr) => {
        return arr.sort((a, b) => {
            const dA = new Date(a.date.replace(/\//g, '-'));
            const dB = new Date(b.date.replace(/\//g, '-'));
            return dA - dB;
        });
    };

    const getPersonalSchedulesForDate = (date) => {
        const normTarget = normalizeDate(date);
        return getPersonalSchedules().filter(item => normalizeDate(item.date) === normTarget);
    };

    const getPersonalSchedulesFuture = (date) => {
        const list = getPersonalSchedules();
        const filtered = list.filter(item => isDateGe(item.date, date));
        return sortByDate(filtered);
    };

    const getPinnedServicesForDate = (date) => {
        const normTarget = normalizeDate(date);
        return getPinnedServices().filter(item => normalizeDate(item.date) === normTarget);
    };

    const getPinnedServicesFuture = (date) => {
        const list = getPinnedServices();
        const filtered = list.filter(item => isDateGe(item.date, date));
        return sortByDate(filtered);
    };

    const getPinnedEventsForDate = (date) => {
        const normTarget = normalizeDate(date);
        return getPinnedEvents().filter(item => normalizeDate(item.date) === normTarget);
    };

    const getPinnedEventsFuture = (date) => {
        const list = getPinnedEvents();
        const filtered = list.filter(item => isDateGe(item.date, date));
        return sortByDate(filtered);
    };

    // Toggle Dropdown for Calendar Tab (legacy guard)
    if (tabCalendarBtn && tabDropdown) {
        tabCalendarBtn.addEventListener('click', (e) => {
            tabDropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (tabDropdown && !e.target.closest('.tab-with-dropdown')) {
            tabDropdown.classList.remove('show');
        }
    });

    // Handle tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-target');
            if(!btn.classList.contains('active')) {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(targetId).classList.add('active');

                if(targetId === 'tab-customer' && tabDropdown) {
                    tabDropdown.classList.remove('show');
                }
                if(targetId === 'tab-calendar') {
                    renderCalendarView(currentType, currentDate);
                }
            }
        });
    });

    // ----------------------------------------
    // Dynamic Calendar Grid Generator
    // ----------------------------------------
    const generateCalendar = (year, month) => {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;
        
        // Keep only day headers
        const headers = Array.from(grid.querySelectorAll('.day-header'));
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();

        // Month name mapping
        const monthNamesEng = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        document.getElementById('calendar-month-year').innerHTML = `${year}年 ${month + 1}月 <small style="font-weight:normal; color:#666; font-size:14px;">${monthNamesEng[month]}</small>`;

        // Render leading empty cells
        for (let i = 0; i < firstDayIndex; i++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell empty';
            grid.appendChild(cell);
        }

        // Render calendar days
        for (let day = 1; day <= lastDay; day++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            
            const formattedDay = day < 10 ? '0' + day : day;
            const formattedMonth = (month + 1) < 10 ? '0' + (month + 1) : (month + 1);
            const cellDate = `${year}/${formattedMonth}/${formattedDay}`;
            cell.setAttribute('data-date', cellDate);
            
            const textSpan = document.createElement('span');
            textSpan.textContent = day;
            cell.appendChild(textSpan);

            // Highlight real system today
            const realTodayStr = getSystemTodayDate().dateStr;
            if (normalizeDate(cellDate) === normalizeDate(realTodayStr)) {
                cell.classList.add('today-cell');
            }
            
            // Highlight selected day
            if (normalizeDate(cellDate) === normalizeDate(currentDate)) {
                cell.classList.add('selected-day');
            }

            // Create Event dots container
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'day-events-dots';
            
            const hasPersonal = getPersonalSchedulesForDate(cellDate).length > 0;
            const hasService = getPinnedServicesForDate(cellDate).length > 0;
            const hasEvent = getPinnedEventsForDate(cellDate).length > 0;

            if (hasPersonal) {
                const dot = document.createElement('span');
                dot.className = 'cell-dot blue';
                dotsContainer.appendChild(dot);
            }
            if (hasService) {
                const dot = document.createElement('span');
                dot.className = 'cell-dot yellow';
                dotsContainer.appendChild(dot);
            }
            if (hasEvent) {
                const dot = document.createElement('span');
                dot.className = 'cell-dot green';
                dotsContainer.appendChild(dot);
            }

            cell.appendChild(dotsContainer);

            // Click day cell action
            cell.addEventListener('click', () => {
                grid.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected-day'));
                cell.classList.add('selected-day');
                currentDate = cellDate;
                
                // Smart Priority check for active tab based on dots on selected date:
                // Priority: Personal (blue) > Service (yellow) > Activity (green)
                const personalCount = getPersonalSchedulesForDate(cellDate).length;
                const serviceCount = getPinnedServicesForDate(cellDate).length;
                const eventCount = getPinnedEventsForDate(cellDate).length;

                if (personalCount > 0) {
                    currentType = 'personal';
                } else if (serviceCount > 0) {
                    currentType = 'service';
                } else if (eventCount > 0) {
                    currentType = 'activity';
                }
                
                // Keep tab active as Calendar
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tabCalendarBtn.classList.add('active');
                document.getElementById('tab-calendar').classList.add('active');

                renderCalendarView(currentType, currentDate);
            });

            grid.appendChild(cell);
        }
    };

    // Month Navigation Listeners
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        viewMonth--;
        if (viewMonth < 0) {
            viewMonth = 11;
            viewYear--;
        }
        generateCalendar(viewYear, viewMonth);
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        viewMonth++;
        if (viewMonth > 11) {
            viewMonth = 0;
            viewYear++;
        }
        generateCalendar(viewYear, viewMonth);
    });

    document.getElementById('today-btn').addEventListener('click', () => {
        const todayInfo = getSystemTodayDate();
        viewYear = todayInfo.year;
        viewMonth = todayInfo.month;
        currentDate = todayInfo.dateStr;
        generateCalendar(viewYear, viewMonth);
        renderCalendarView(currentType, currentDate);
    });

    // ----------------------------------------
    // Render Right Panel Event List
    // ----------------------------------------
    const renderCalendarView = (type, date) => {
        let headers = [];
        let rowsHtml = '';
        let displayedServices = [];

        // Update Segmented Pill Nav State & Counts
        document.querySelectorAll('.cal-pill-btn').forEach(btn => {
            const pType = btn.getAttribute('data-type');
            if (pType === type) {
                btn.classList.add('active');
                btn.style.background = 'white';
                btn.style.color = '#0284C7';
                btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = '#64748B';
                btn.style.boxShadow = 'none';
            }
        });
        const sBadge = document.getElementById('home-service-badge');
        if (sBadge) {
            const allPinned = getPinnedServices();
            sBadge.textContent = allPinned.length;
        }
        
        // Show/Hide Shortcut Buttons
        if (type === 'personal') {
            if (addScheduleBtn) addScheduleBtn.style.display = 'inline-flex';
            if (addServiceShortcutBtn) addServiceShortcutBtn.style.display = 'none';
            
            headers = ['標題', '時間', '備註', '操作'];
            let schedules = getPersonalSchedulesForDate(date);
            if (schedules.length === 0) {
                schedules = getPersonalSchedulesFuture(date);
            }
            
            if (schedules.length > 0) {
                schedules.forEach(item => {
                    rowsHtml += `
                        <tr>
                            <td><a href="#" class="link trigger-personal-edit" data-id="${item.id}">${item.title}</a></td>
                            <td>${item.date} ${item.start || ''}~${item.end || ''}</td>
                            <td>${item.notes || ''}</td>
                            <td>
                                <button class="btn btn-text trigger-personal-edit" data-id="${item.id}" style="color:var(--primary-color); padding:0 4px; font-size:13px;">修改</button> | 
                                <button class="btn btn-text trigger-personal-delete" data-id="${item.id}" style="color:#C0392B; padding:0 4px; font-size:13px;">刪除</button>
                            </td>
                        </tr>
                    `;
                });
            }
        } else if (type === 'service') {
            if (addScheduleBtn) addScheduleBtn.style.display = 'none';
            if (addServiceShortcutBtn) addServiceShortcutBtn.style.display = 'inline-flex';
            
            headers = ['追蹤', '服務名稱 (Key值)', '法人戶', '時間', '類型', '講師/研究員', '人數', '備註'];
            
            // 首頁「服務 Service」列表：
            // 若當日有專屬會議則精準呈現；若當日無行程（如預設首頁檢視），直接顯示所有已釘選之服務紀錄（新至舊排序），
            // 確保使用者在服務管理明細中所釘選之項目（包含2025/2026之投顧會議）100% 完整出現在首頁列表中！
            const exactDateServices = getPinnedServicesForDate(date);
            let services = [];
            if (exactDateServices.length > 0) {
                services = exactDateServices;
            } else {
                services = [...getPinnedServices()].sort((a, b) => {
                    const dA = new Date(a.date.replace(/\//g, '-'));
                    const dB = new Date(b.date.replace(/\//g, '-'));
                    return dB - dA;
                });
            }
            displayedServices = services;

            if (services.length > 0) {
                services.forEach(item => {
                    const targetLink = item.linkUrl || `marketing.html?serviceId=${encodeURIComponent(item.id)}&from=home#service-detail`;
                    const firmName = item.firm || (item.topicCompany !== '富邦投顧' ? item.topicCompany : '') || '—';
                    let shortDate = '';
                    if (item.date) {
                        const parts = item.date.replace(/-/g, '/').split('/');
                        if (parts.length === 3) shortDate = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                    }
                    const rawTopic = item.topic || '';
                    const defaultSvcName = (firmName !== '—' && shortDate) ? `${firmName} ${shortDate} ${item.interest || rawTopic || '會議'}` : (rawTopic || '服務紀錄');
                    const svcName = item.serviceName || defaultSvcName;
                    const topicText = rawTopic;
                    const noteText = item.notes || '';

                    rowsHtml += `
                        <tr class="service-calendar-row" data-url="${targetLink}" style="cursor: pointer;">
                            <td style="text-align: center; width: 60px;">
                                <button class="home-pin-toggle" data-id="${item.id}" style="background:none; border:none; font-size:18px; cursor:pointer; color:#f1c40f; padding:0;" title="已加入追蹤（點擊可取消追蹤）">★</button>
                            </td>
                            <td>
                                <a href="${targetLink}" class="link" style="font-weight:700; color:#0284C7; font-size:13px;" title="前往檢視此筆服務紀錄詳情頁面">${svcName}</a>
                                ${topicText && topicText !== svcName ? `<div style="font-size:11px; color:#64748B; margin-top:2px;">${topicText}</div>` : ''}
                            </td>
                            <td><span style="font-weight:600; color:#0F172A; background:#F1F5F9; padding:2px 8px; border-radius:4px; font-size:12px;">${firmName}</span></td>
                            <td>${item.date} ${item.time || ''}</td>
                            <td><span class="group-badge" style="background:#FEF3C7; color:#B45309; font-weight:600; padding:3px 8px; border-radius:4px; font-size:12px;">${item.serviceType || item.type || '服務'}</span></td>
                            <td><strong>${item.speaker || item.analyst || '研究員'}</strong></td>
                            <td>${item.attendees || item.format || '-'}</td>
                            <td><span style="font-size:13px; color:#374151;">${noteText}</span></td>
                        </tr>
                    `;
                });
            }
        } else if (type === 'activity') {
            if (addScheduleBtn) addScheduleBtn.style.display = 'none';
            if (addServiceShortcutBtn) addServiceShortcutBtn.style.display = 'none';
            
            headers = ['追蹤', '名稱 (活動)', '時間', '類型', '講師/研究員', '人數', '備註'];
            let events = getPinnedEventsForDate(date);
            if (events.length === 0) {
                events = getPinnedEventsFuture(date);
            }
            
            if (events.length > 0) {
                const pinnedEventIds = getPinnedEventIds();
                events.forEach(item => {
                    const targetLink = item.linkUrl || 'marketing.html#activity';
                    const isPinned = pinnedEventIds.includes(item.id);
                    const starColor = isPinned ? '#f1c40f' : '#94A3B8';
                    const starIcon = isPinned ? '★' : '☆';
                    const pinTitle = isPinned ? '已加入追蹤 (點擊可取消追蹤)' : '未追蹤 (點擊可加入追蹤)';

                    rowsHtml += `
                        <tr>
                            <td style="text-align: center; width: 60px;"><button class="home-pin-toggle" data-id="${item.id}" data-type="event" style="background:none; border:none; font-size:18px; cursor:pointer; color:${starColor};" title="${pinTitle}">${starIcon}</button></td>
                            <td><a href="${targetLink}" class="link" style="font-weight:600; color:#0369A1;">${item.topic || item.title || '未命名活動'}</a></td>
                            <td>${item.date} ${item.time || ''}</td>
                            <td><span class="group-badge" style="background:#DCFCE7; color:#15803D; font-weight:600; padding:3px 8px; border-radius:4px; font-size:12px;">${item.serviceType || item.type || '活動'}</span></td>
                            <td><strong>${item.speaker || item.analyst || '展業部'}</strong></td>
                            <td>${item.attendees || '-'}</td>
                            <td>
                                <span style="font-size:12px; color:#374151;">${item.notes || ''}</span>
                            </td>
                        </tr>
                    `;
                });
            }
        }

        // Update Title
        const typeLabels = { 'personal': '個人 Personal', 'service': '服務 Service', 'activity': '活動 Event' };
        let dateSubtitle = `日期 <span style="font-size:12px; font-weight:normal; color:#666;">Date</span> : ${date}`;
        if (type === 'service') {
            const exactCount = getPinnedServicesForDate(date).length;
            if (exactCount > 0) {
                dateSubtitle += ` <span style="color:#0284C7; font-size:12px; font-weight:normal;">(當日排定會議)</span>`;
            } else if (displayedServices.length > 0) {
                dateSubtitle += ` <span style="color:#0284C7; font-size:12px; font-weight:normal;">(已釘選服務紀錄，共 ${displayedServices.length} 筆)</span>`;
            }
        }
        calendarTitle.innerHTML = `行事曆 <span style="font-size:12px; font-weight:normal; color:#666;">Calendar</span> - ${typeLabels[type]} / ${dateSubtitle}`;

        // Toggle red note for service calendar (僅顯示有被加入個人行事曆的服務)
        const serviceNoteEl = document.getElementById('calendar-service-note');
        if (serviceNoteEl) {
            serviceNoteEl.style.display = (type === 'service') ? 'block' : 'none';
        }

        // Render Headers
        const thead = calendarTable.querySelector('thead tr');
        thead.innerHTML = '';
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            thead.appendChild(th);
        });

        // Render Rows
        const tbody = calendarTable.querySelector('tbody');
        if (rowsHtml === '') {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${headers.length}" class="empty-state">
                        此日期目前無任何釘選的${type === 'service' ? '服務紀錄' : type === 'activity' ? '活動' : '個人行程'}
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = rowsHtml;
            
            // Bind edit/delete listener clicks for personal schedules
            if (type === 'personal') {
                tbody.querySelectorAll('.trigger-personal-edit').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const id = btn.getAttribute('data-id');
                        const personalList = getPersonalSchedules();
                        const record = personalList.find(r => r.id === id);
                        if (record) {
                            document.getElementById('modal-title').value = record.title;
                            document.getElementById('modal-date').value = record.date;
                            document.getElementById('modal-start').value = record.start || '';
                            document.getElementById('modal-end').value = record.end || '';
                            document.getElementById('modal-notes').value = record.notes || '';
                            
                            saveBtn.setAttribute('data-mode', 'edit');
                            saveBtn.setAttribute('data-id', id);
                            openModal();
                        }
                    });
                });
                
                tbody.querySelectorAll('.trigger-personal-delete').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = btn.getAttribute('data-id');
                        if (confirm('確定要刪除此行程嗎？')) {
                            let personalList = getPersonalSchedules();
                            personalList = personalList.filter(r => r.id !== id);
                            localStorage.setItem('crm_personal_schedules', JSON.stringify(personalList));
                            
                            generateCalendar(viewYear, viewMonth);
                            renderCalendarView(currentType, currentDate);
                        }
                    });
                });
            }
        }
    };

    // Handle Calendar Segmented Pill Navigation
    document.querySelectorAll('.cal-pill-btn').forEach(pill => {
        pill.addEventListener('click', (e) => {
            e.preventDefault();
            const val = pill.getAttribute('data-type');
            if (val) {
                currentType = val;
                renderCalendarView(currentType, currentDate);
            }
        });
    });

    // Handle Calendar Tab dropdown sub-item selection (legacy support)
    if (dropdownItems && dropdownItems.length > 0) {
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = item.getAttribute('data-value');
                currentType = value;
                
                // Switch tabs visually
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tabCalendarBtn.classList.add('active');
                document.getElementById('tab-calendar').classList.add('active');
                if (tabDropdown) tabDropdown.classList.remove('show');

                renderCalendarView(currentType, currentDate);
            });
        });
    }

    // ----------------------------------------
    // Personal Schedule Modal Input Logic
    // ----------------------------------------
    const modal = document.getElementById('schedule-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    
    const openModal = () => {
        modal.classList.add('show');
    };

    const closeModal = () => {
        modal.classList.remove('show');
    };

    // Add Schedule Button click
    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', () => {
            // Reset for new entry
            document.getElementById('modal-title').value = "";
            document.getElementById('modal-date').value = currentDate;
            document.getElementById('modal-start').value = "10:00";
            document.getElementById('modal-end').value = "11:00";
            document.getElementById('modal-notes').value = "";
            
            saveBtn.setAttribute('data-mode', 'new');
            saveBtn.removeAttribute('data-id');
            openModal();
        });
    }

    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', () => {
        const title = document.getElementById('modal-title').value;
        const date = document.getElementById('modal-date').value;
        const start = document.getElementById('modal-start').value;
        const end = document.getElementById('modal-end').value;
        const notes = document.getElementById('modal-notes').value;
        
        if (!title) {
            alert('請輸入行程標題！');
            return;
        }

        const mode = saveBtn.getAttribute('data-mode');
        let personalList = getPersonalSchedules();
        
        if (mode === 'new') {
            const newItem = {
                id: `p-custom-${Date.now()}`,
                title,
                date,
                start,
                end,
                notes
            };
            personalList.push(newItem);
        } else {
            const id = saveBtn.getAttribute('data-id');
            const index = personalList.findIndex(r => r.id === id);
            if (index > -1) {
                personalList[index] = { id, title, date, start, end, notes };
            }
        }
        
        localStorage.setItem('crm_personal_schedules', JSON.stringify(personalList));
        alert('✅ 行程儲存成功！');
        
        closeModal();
        generateCalendar(viewYear, viewMonth);
        renderCalendarView(currentType, currentDate);
    });

    // ----------------------------------------
    // Outlook Synchronization Logic (OAuth 2.0 Flow)
    // ----------------------------------------
    const btnOutlookSync = document.getElementById('btn-outlook-sync');
    const outlookSyncStatus = document.getElementById('outlook-sync-status');
    const outlookOauthModal = document.getElementById('outlook-oauth-modal');
    const btnOauthAccept = document.getElementById('btn-oauth-accept');
    const btnOauthCancel = document.getElementById('btn-oauth-cancel');
    const outlookInfoIcon = document.getElementById('outlook-info-icon');
    const outlookSyncRulesBanner = document.getElementById('outlook-sync-rules-banner');

    if (outlookInfoIcon && outlookSyncRulesBanner) {
        outlookInfoIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = outlookSyncRulesBanner.style.display === 'none';
            outlookSyncRulesBanner.style.display = isHidden ? 'block' : 'none';
        });
    }

    const updateOutlookSyncUI = () => {
        const isSynced = localStorage.getItem('crm_outlook_synced') === 'true';
        if (outlookSyncStatus) {
            if (isSynced) {
                outlookSyncStatus.textContent = '已啟用';
                btnOutlookSync.style.backgroundColor = '#ECFDF5';
                btnOutlookSync.style.borderColor = '#10B981';
                btnOutlookSync.style.color = '#047857';
            } else {
                outlookSyncStatus.textContent = '未啟用';
                btnOutlookSync.style.backgroundColor = '#FFFFFF';
                btnOutlookSync.style.borderColor = '#D1D5DB';
                btnOutlookSync.style.color = '#374151';
            }
        }
    };

    if (btnOutlookSync) {
        btnOutlookSync.addEventListener('click', () => {
            const isSynced = localStorage.getItem('crm_outlook_synced') === 'true';
            if (isSynced) {
                if (confirm('是否要解除 Outlook 行事曆綁定？解除後將停止同步會議紀錄。')) {
                    localStorage.removeItem('crm_outlook_synced');
                    // Remove Outlook synced mock schedules if any
                    let personalList = getPersonalSchedules();
                    personalList = personalList.filter(s => s.id !== 'p-outlook-1');
                    localStorage.setItem('crm_personal_schedules', JSON.stringify(personalList));
                    
                    alert('已解除 Outlook 行事曆連動！');
                    updateOutlookSyncUI();
                    generateCalendar(viewYear, viewMonth);
                    renderCalendarView(currentType, currentDate);
                }
            } else {
                outlookOauthModal.classList.add('show');
            }
        });
    }

    if (btnOauthCancel) {
        btnOauthCancel.addEventListener('click', () => {
            outlookOauthModal.classList.remove('show');
        });
    }

    if (btnOauthAccept) {
        btnOauthAccept.addEventListener('click', () => {
            localStorage.setItem('crm_outlook_synced', 'true');
            outlookOauthModal.classList.remove('show');
            
            // Inject a mock schedule from Outlook
            let personalList = getPersonalSchedules();
            if (!personalList.some(s => s.id === 'p-outlook-1')) {
                personalList.push({
                    id: 'p-outlook-1',
                    title: 'Outlook同步: 金控經委會報告',
                    date: '2026/06/30',
                    start: '14:30',
                    end: '16:00',
                    notes: '從微軟 Outlook 會議同步導入'
                });
                localStorage.setItem('crm_personal_schedules', JSON.stringify(personalList));
            }
            
            alert('✅ Outlook 帳號授權成功！系統已取得 Access Token，順利完成雙向同步。');
            updateOutlookSyncUI();
            generateCalendar(viewYear, viewMonth);
            renderCalendarView(currentType, currentDate);
        });
    }

    updateOutlookSyncUI();

    // Handle Storage changes from other pages (like marketing.html) to instantly refresh
    window.addEventListener('storage', (e) => {
        if (e.key === 'crm_pinned_services' || e.key === 'crm_pinned_events') {
            generateCalendar(viewYear, viewMonth);
            renderCalendarView(currentType, currentDate);
        }
    });

    // Focus/refresh when returning to home tab
    window.addEventListener('focus', () => {
        generateCalendar(viewYear, viewMonth);
        renderCalendarView(currentType, currentDate);
    });

    // ----------------------------------------
    // Customer Table Search & Filter Logic
    // ----------------------------------------
    const custSearchInput = document.getElementById('customer-search-input');
    const custCorpSelect = document.getElementById('filter-corporate-select');
    const custGroup1Select = document.getElementById('filter-group1-select');
    const custGroup2Select = document.getElementById('filter-group2-select');
    const custProdSelect = document.getElementById('filter-product-select');
    const custAffSelect = document.getElementById('filter-affiliates-select');
    const btnCustSearch = document.getElementById('btn-customer-search');
    const btnCustReset = document.getElementById('btn-customer-reset');
    const custTable = document.getElementById('customer-main-table');

    function filterCustomerTable() {
        if (!custTable) return;
        const query = (custSearchInput?.value || '').trim().toLowerCase();
        const corpVal = custCorpSelect?.value || 'ALL';
        const g1Val = custGroup1Select?.value || 'ALL';
        const g2Val = custGroup2Select?.value || 'ALL';
        const prodVal = custProdSelect?.value || 'ALL';
        const affVal = custAffSelect?.value || 'ALL';

        const rows = custTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const matchesQuery = !query || text.includes(query);
            const matchesCorp = corpVal === 'ALL' || text.includes(corpVal.toLowerCase());
            const matchesG1 = g1Val === 'ALL' || text.includes(g1Val.toLowerCase());
            const matchesG2 = g2Val === 'ALL' || text.includes(g2Val.toLowerCase());
            const matchesProd = prodVal === 'ALL' || text.includes(prodVal.toLowerCase());
            const matchesAff = affVal === 'ALL' || text.includes(affVal.toLowerCase());

            if (matchesQuery && matchesCorp && matchesG1 && matchesG2 && matchesProd && matchesAff) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    const updateCustomerDataHeader = () => {
        const todayInfo = getSystemTodayDate();
        const dateLabel = document.getElementById('data-date-label');
        const timeLabel = document.getElementById('query-time-label');
        if (dateLabel) dateLabel.textContent = todayInfo.dateStr;
        
        if (timeLabel) {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            timeLabel.textContent = `${hh}:${mm}:${ss}`;
        }
    };

    updateCustomerDataHeader();

    const btnRefreshCust = document.getElementById('btn-refresh-customer-data');
    if (btnRefreshCust) {
        btnRefreshCust.addEventListener('click', () => {
            const icon = btnRefreshCust.querySelector('.refresh-icon');
            if (icon) icon.style.transform = 'rotate(360deg)';
            setTimeout(() => { if (icon) icon.style.transform = 'none'; }, 400);

            updateCustomerDataHeader();
            filterCustomerTable();
        });
    }

    custSearchInput?.addEventListener('input', filterCustomerTable);
    custCorpSelect?.addEventListener('change', filterCustomerTable);
    custGroup1Select?.addEventListener('change', filterCustomerTable);
    custGroup2Select?.addEventListener('change', filterCustomerTable);
    custProdSelect?.addEventListener('change', filterCustomerTable);
    custAffSelect?.addEventListener('change', filterCustomerTable);
    btnCustSearch?.addEventListener('click', filterCustomerTable);

    btnCustReset?.addEventListener('click', () => {
        if (custSearchInput) custSearchInput.value = '';
        if (custCorpSelect) custCorpSelect.value = 'ALL';
        if (custGroup1Select) custGroup1Select.value = 'ALL';
        if (custGroup2Select) custGroup2Select.value = 'ALL';
        if (custProdSelect) custProdSelect.value = 'ALL';
        if (custAffSelect) custAffSelect.value = 'ALL';
        filterCustomerTable();
    });

    document.addEventListener('click', (e) => {
        const importBtn = e.target.closest('.trigger-home-import');
        if (importBtn) {
            const rawData = importBtn.getAttribute('data-import');
            if (rawData) {
                try {
                    const itemData = JSON.parse(decodeURIComponent(rawData));
                    sessionStorage.setItem('crm_import_meeting', JSON.stringify(itemData));
                } catch (err) {
                    console.error("Failed to store crm_import_meeting", err);
                }
            }
        }

        // Entire row click for service calendar items
        const serviceRow = e.target.closest('.service-calendar-row');
        if (serviceRow && !e.target.closest('.home-pin-toggle') && !e.target.closest('a') && !e.target.closest('button')) {
            const url = serviceRow.getAttribute('data-url');
            if (url) {
                window.location.href = url;
            }
        }
    });

    // ----------------------------------------
    // Homepage Pin Toggle & Toast Notification
    // ----------------------------------------
    const showHomeToast = (message) => {
        let toast = document.getElementById('home-toast-notice');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'home-toast-notice';
            toast.style.cssText = 'position:fixed; bottom:24px; right:24px; background:#1E293B; color:white; padding:12px 20px; border-radius:8px; font-size:14px; font-weight:500; box-shadow:0 4px 12px rgba(0,0,0,0.18); z-index:9999; transition:all 0.3s ease; display:flex; align-items:center; gap:8px;';
            document.body.appendChild(toast);
        }
        toast.innerHTML = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        toast.style.display = 'flex';
        if (window._homeToastTimeout) clearTimeout(window._homeToastTimeout);
        window._homeToastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => { toast.style.display = 'none'; }, 300);
        }, 2500);
    };

    const syncHomePinButtons = () => {
        const pinnedIds = getPinnedServiceIds();
        document.querySelectorAll('.home-pin-toggle').forEach(btn => {
            const id = btn.getAttribute('data-id');
            const isPinned = pinnedIds.includes(id);
            if (isPinned) {
                btn.textContent = '★';
                btn.style.color = '#f1c40f';
                btn.title = '已加入追蹤 (點擊可取消追蹤)';
            } else {
                btn.textContent = '☆';
                btn.style.color = '#94A3B8';
                btn.title = '未追蹤 (點擊可加入追蹤)';
            }
        });
    };

    // Delegated click handler for Pin toggles on the homepage
    // 依使用者需求：首頁僅顯示在明細中有被釘選加入首頁個人行事曆的列表，取消釘選就會立即從首頁移除
    document.addEventListener('click', (e) => {
        const pinBtn = e.target.closest('.home-pin-toggle');
        if (!pinBtn) return;
        e.preventDefault();
        e.stopPropagation();

        const id = pinBtn.getAttribute('data-id');
        if (!id) return;

        let pinnedIds = getPinnedServiceIds();
        // 取消釘選：自釘選列表中移除該服務 ID
        pinnedIds = pinnedIds.filter(x => x !== id);
        localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedIds));

        // 同步更新快取之完整物件清單
        let pinnedDetails = JSON.parse(localStorage.getItem('crm_pinned_services') || '[]');
        if (Array.isArray(pinnedDetails)) {
            pinnedDetails = pinnedDetails.filter(x => x && x.id !== id);
            localStorage.setItem('crm_pinned_services', JSON.stringify(pinnedDetails));
        }

        // 立即重新生成月曆格點（更新點點）與表格清單（取消釘選項目立即自首頁移除）
        generateCalendar(viewYear, viewMonth);
        renderCalendarView(currentType, currentDate);

        showHomeToast('❌ 已取消釘選，該項目已從首頁行事曆移除（仍保留於服務管理明細中）');
    });

    // ----------------------------------------
    // Initial Setup Execution
    // ----------------------------------------
    // 若剛從服務管理新增紀錄返回首頁，自動跳轉至該紀錄之月份與日期
    const latestServiceDate = localStorage.getItem('crm_latest_service_date');
    if (latestServiceDate) {
        const parts = latestServiceDate.split('/');
        if (parts.length === 3) {
            viewYear = parseInt(parts[0], 10);
            viewMonth = parseInt(parts[1], 10) - 1;
            currentDate = latestServiceDate;
            currentType = 'service';

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tabCalendarBtn.classList.add('active');
            document.getElementById('tab-calendar').classList.add('active');
        }
        localStorage.removeItem('crm_latest_service_date');
    }

    generateCalendar(viewYear, viewMonth);
    renderCalendarView(currentType, currentDate);
    syncHomePinButtons();
});

