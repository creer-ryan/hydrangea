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
        { id: 's-aug-1', topic: '【研究員會議】台積電法說會前個股聚焦與產業評估', topicCompany: '富邦投顧', date: '2026/08/17', time: '10:00~11:30', serviceType: '研究員會議', speaker: 'Sherman Shang', attendees: '15人', notes: '研討 AI 晶片需求與 3nm 產能利用率', linkUrl: 'marketing.html#service?action=new-service' },
        { id: 's-aug-2', topic: '【研究員會議】聯發科 Dimensity 旗艦晶片策略評估', topicCompany: '富邦投顧', date: '2026/08/24', time: '14:00~15:30', serviceType: '研究員會議', speaker: 'Titan Wang', attendees: '20人', notes: '客戶投資簡報與手機庫存回溫分析', linkUrl: 'marketing.html#service?action=new-service' },
        { id: 's-aug-3', topic: '台股下半年 AI 供應鏈趨勢論壇 (法說會)', topicCompany: '富邦投顧', date: '2026/08/28', time: '14:00~16:00', serviceType: '法說會', speaker: '張研究員', attendees: '45人', notes: '實體論壇與線上直播', linkUrl: 'marketing.html#service' },
        { id: 's-sep-1', topic: '【研究員會議】伺服器與散熱產業 Q3 季報趨勢研討', topicCompany: '富邦投顧', date: '2026/09/04', time: '11:00~12:00', serviceType: '研究員會議', speaker: 'Jason Lin', attendees: '25人', notes: '水冷散熱與液冷伺服器供應鏈排程', linkUrl: 'marketing.html#analyst' },
        { id: 's-sep-2', topic: '【研究員會議】電動車與車用半導體大廠專題簡報', topicCompany: '富邦投顧', date: '2026/09/14', time: '15:00~16:30', serviceType: '研究員會議', speaker: 'Sherman Shang', attendees: '18人', notes: '鴻海與車用 Tier 1 供應商研討', linkUrl: 'marketing.html#service?action=new-service' },
        { id: 's-sep-3', topic: '2026 Q3 全球半導體展望法說會 (法說會)', topicCompany: '富邦投顧', date: '2026/09/18', time: '10:00~11:30', serviceType: '法說會', speaker: '陳資深分析師', attendees: '60人', notes: '法人客戶專屬說明會', linkUrl: 'marketing.html#service' },
        { id: 's-sep-4', topic: '【研究員會議】美股科技巨頭財報 Preview 與總體經濟', topicCompany: '富邦投顧', date: '2026/09/21', time: '09:30~11:00', serviceType: '研究員會議', speaker: 'Titan Wang', attendees: '30人', notes: '聯準會利率決策與科技股估值', linkUrl: 'marketing.html#analyst' }
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

    // Get Pinned Services
    const getPinnedServices = () => {
        let list = JSON.parse(localStorage.getItem('crm_pinned_services'));
        if (!list || !Array.isArray(list) || !list.some(item => item.id === 's-aug-1')) {
            localStorage.setItem('crm_pinned_services', JSON.stringify(defaultPinnedServices));
            return defaultPinnedServices;
        }
        return list;
    };

    // Get Pinned Events
    const getPinnedEvents = () => {
        let list = JSON.parse(localStorage.getItem('crm_pinned_events'));
        if (!list || !Array.isArray(list) || !list.some(item => item.id === 'e-aug-1')) {
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

    // Toggle Dropdown for Calendar Tab
    if (tabCalendarBtn) {
        tabCalendarBtn.addEventListener('click', (e) => {
            tabDropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tab-with-dropdown')) {
            tabDropdown.classList.remove('show');
        }
    });

    // Handle tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(!btn.classList.contains('active')) {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');

                if(targetId === 'tab-customer') {
                    tabDropdown.classList.remove('show');
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
        
        // Show/Hide Shortcut Buttons
        if (type === 'personal') {
            addScheduleBtn.style.display = 'inline-block';
            addServiceShortcutBtn.style.display = 'none';
            
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
            addScheduleBtn.style.display = 'none';
            addServiceShortcutBtn.style.display = 'inline-block';
            
            headers = ['名稱 (主題)', '時間', '類型', '講師/研究員', '人數', '連結說明 / 操作'];
            let services = getPinnedServicesForDate(date);
            if (services.length === 0) {
                services = getPinnedServicesFuture(date);
            }
            
            const buildMarketingLink = (item, targetHash = '#service') => {
                if (!item) return `marketing.html?action=new-service${targetHash}`;
                const topic = encodeURIComponent(item.topic || item.title || '');
                const date = item.date ? item.date.replace(/\//g, '-') : '';
                const time = item.time ? item.time.split('~')[0] : '';
                const analyst = encodeURIComponent(item.speaker || item.analyst || '');
                const notes = encodeURIComponent(item.notes || '');
                return `marketing.html?action=new-service&topic=${topic}&date=${date}&time=${time}&analyst=${analyst}&notes=${notes}${targetHash}`;
            };

            if (services.length > 0) {
                services.forEach(item => {
                    const targetLink = buildMarketingLink(item, '#service');
                    const importPayload = JSON.stringify({
                        topic: item.topic || item.topicCompany || '',
                        date: item.date ? item.date.replace(/\//g, '-') : '',
                        time: item.time ? item.time.split('~')[0] : '',
                        analyst: item.speaker || item.analyst || '',
                        notes: item.notes || ''
                    });
                    const encodedPayload = encodeURIComponent(importPayload);

                    rowsHtml += `
                        <tr>
                            <td><a href="${targetLink}" data-import="${encodedPayload}" class="link trigger-home-import" style="font-weight:600;" title="帶入此場次資料並建置紀錄">${item.topic || item.topicCompany || '未命名服務'}</a></td>
                            <td>${item.date} ${item.time || ''}</td>
                            <td><span class="group-badge" style="background:#FEF3C7; color:#B45309; font-weight:600;">${item.serviceType || item.type || '服務'}</span></td>
                            <td><strong>${item.speaker || item.analyst || '研究員'}</strong></td>
                            <td>${item.attendees || '-'}</td>
                            <td>
                                <span>${item.notes || ''}</span>
                                <a href="${targetLink}" data-import="${encodedPayload}" class="btn btn-secondary trigger-home-import" style="font-size:11px; padding:3px 10px; margin-left:6px; background:#0093C1; color:#FFFFFF; border:none; border-radius:4px; text-decoration:none; display:inline-block; font-weight:600;" title="點擊新增至服務紀錄表單">➕ 新增至服務紀錄</a>
                            </td>
                        </tr>
                    `;
                });
            }
        } else if (type === 'activity') {
            addScheduleBtn.style.display = 'none';
            addServiceShortcutBtn.style.display = 'none';
            
            headers = ['名稱 (活動)', '時間', '類型', '講師/研究員', '人數', '連結說明 / 操作'];
            let events = getPinnedEventsForDate(date);
            if (events.length === 0) {
                events = getPinnedEventsFuture(date);
            }
            
            if (events.length > 0) {
                events.forEach(item => {
                    const targetLink = item.linkUrl || 'marketing.html#activity';
                    rowsHtml += `
                        <tr>
                            <td><a href="${targetLink}" class="link" style="font-weight:600;">${item.topic || item.title || '未命名活動'}</a></td>
                            <td>${item.date} ${item.time || ''}</td>
                            <td><span class="group-badge" style="background:#DCFCE7; color:#15803D; font-weight:600;">${item.serviceType || item.type || '活動'}</span></td>
                            <td><strong>${item.speaker || item.analyst || '展業部'}</strong></td>
                            <td>${item.attendees || '-'}</td>
                            <td>
                                <span>${item.notes || ''}</span>
                                <a href="${targetLink}" class="btn btn-secondary" style="font-size:11px; padding:2px 8px; margin-left:6px; background:#DCFCE7; color:#15803D; border-color:#BBF7D0; text-decoration:none; display:inline-block;">🔗 轉至活動頁面</a>
                            </td>
                        </tr>
                    `;
                });
            }
        }

        // Update Title
        const typeLabels = { 'personal': '個人 Personal', 'service': '服務 Service', 'activity': '活動 Event' };
        calendarTitle.innerHTML = `行事曆 <span style="font-size:12px; font-weight:normal; color:#666;">Calendar</span> - ${typeLabels[type]} / 日期 <span style="font-size:12px; font-weight:normal; color:#666;">Date</span> : ${date}`;

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

    // Handle Calendar Tab dropdown sub-item selection
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
            tabDropdown.classList.remove('show');

            renderCalendarView(currentType, currentDate);
        });
    });

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
    });

    // ----------------------------------------
    // Initial Setup Execution
    // ----------------------------------------
    generateCalendar(viewYear, viewMonth);
    renderCalendarView(currentType, currentDate);
});

