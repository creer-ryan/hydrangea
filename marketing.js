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

        // Helper: Compare names by English A-Z and Chinese stroke order
    const compareNames = (nameA, nameB) => {
        const sA = String(nameA || '').trim();
        const sB = String(nameB || '').trim();
        if (!sA && !sB) return 0;
        if (!sA) return 1;
        if (!sB) return -1;
        const isZhA = /^[\u4e00-\u9fa5]/.test(sA);
        const isZhB = /^[\u4e00-\u9fa5]/.test(sB);
        if (isZhA && isZhB) {
            return sA.localeCompare(sB, 'zh-Hant-TW', { collation: 'stroke' });
        } else if (!isZhA && !isZhB) {
            return sA.localeCompare(sB, 'en', { sensitivity: 'base', numeric: true });
        } else {
            return isZhA ? 1 : -1;
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
    
    // ==========================================
    // Dynamic Dropdown Options Configurations
    // ==========================================
    const DEFAULT_INTERACTION_TYPES = [
        'Model request',
        'Bespoke client request',
        'One off client meeting',
        'Incoming call'
    ];

    const DEFAULT_INTERACTION_METHODS = [
        'In Person',
        'Virtual',
        'email',
        'N/A'
    ];

    // 依據使用者設計圖 media_1788844119667.png 新增主題預設選項
    const DEFAULT_TOPIC_OPTIONS = [
        'Energy Equipment & Services',
        'Oil, Gas & Consumable Fuels',
        'Materials',
        'TSM earnings'
    ];

    const getInteractionTypes = () => {
        return safeJsonParse('crm_interaction_types', DEFAULT_INTERACTION_TYPES);
    };

    const getInteractionMethods = () => {
        return safeJsonParse('crm_interaction_methods', DEFAULT_INTERACTION_METHODS);
    };

    const getTopicOptions = () => {
        return safeJsonParse('crm_topic_options', DEFAULT_TOPIC_OPTIONS);
    };

    const populateTopicDropdowns = () => {
        const topics = getTopicOptions();

        // 1. #datalist-topics (for record-topic input)
        const datalist = document.getElementById('datalist-topics');
        if (datalist) {
            datalist.innerHTML = '';
            topics.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                datalist.appendChild(opt);
            });
        }

        // 2. #filter-topic (for filter panel)
        const filterTopicSelect = document.getElementById('filter-topic');
        if (filterTopicSelect) {
            const curVal = filterTopicSelect.value || '全部';
            filterTopicSelect.innerHTML = '<option value="全部">全部</option>';
            topics.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                filterTopicSelect.appendChild(opt);
            });
            if (curVal === '全部' || topics.includes(curVal)) {
                filterTopicSelect.value = curVal;
            } else {
                filterTopicSelect.value = '全部';
            }
        }
    };

    const saveInteractionTypes = (types) => {
        localStorage.setItem('crm_interaction_types', JSON.stringify(types));
        populateInteractionDropdowns();
    };

    const saveInteractionMethods = (methods) => {
        localStorage.setItem('crm_interaction_methods', JSON.stringify(methods));
        populateInteractionDropdowns();
    };

    const saveTopicOptions = (topics) => {
        localStorage.setItem('crm_topic_options', JSON.stringify(topics));
        populateTopicDropdowns();
    };

    // Default mock services database matching the table in marketing.html
    const DEFAULT_SERVICES = [
        // --- 2025/08 Image 2 Mock Data ---
        { id: 'service-2025-1', date: '2025/08/10', coverage: 'Jefferies/Fubon', analyst: 'Sherman Shang', sales: 'Charlie Zhao', salesTrader: 'Jason Chang', firm: 'FMR', client: 'Elizabeth Li', type: 'One off client meeting (video)', method: 'Incoming call', duration: '15', format: '1x1', time: '10:05', email: 'Elizabeth.li@FMR.com', topic: 'TSMC 2Q earnings', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-2025-2', date: '2025/08/11', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Ann Liao', salesTrader: 'Terry', firm: 'FMR', client: 'Jonas Wong', type: 'Bespoke client request', method: 'Email ideas', duration: '15', format: '1x1', time: '11:00', email: '', topic: 'MTK ASICs potential', interest: '2454 TT', analystEmail: '' },
        { id: 'service-2025-oasis', date: '2025/08/11', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Ann Liao', salesTrader: 'Terry', firm: 'Oasis', client: 'Jonas Wong', type: 'Bespoke client request', method: 'email', duration: '15', format: '1x1', time: '11:00', email: 'Jonas.wong@oasis.com', topic: 'MTK ASICs potential', interest: '2454 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-2025-3', date: '2025/08/11', coverage: 'Daishin/Fubon', analyst: 'Sherman Shang', sales: 'Ken Lee', salesTrader: 'David Lin', firm: 'AP Asset', client: 'Chole Kim', type: 'One off client meeting', method: 'Virtual', duration: '30', format: '1x1', time: '9:00', email: 'Chloe.kim@apasset.com', topic: 'TSMC GM question', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com' },
        // --- 2026/01 (1月) ---
        { id: 'service-101', date: '2026/01/08', coverage: 'Jefferies/Fubon', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: 'FMR', client: 'Elizabeth Li', type: 'One off client meeting', method: 'Virtual', duration: '45', format: '1x1', time: '10:00', email: 'Elizabeth.li@FMR.com', topic: 'TSMC 1Q Preview', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-102', date: '2026/01/15', coverage: 'Fubon Only', analyst: 'Titan Wang', sales: 'Ann Liao', firm: 'Oasis', client: 'Jonas Wong', type: 'Bespoke client request', method: 'email', duration: '30', format: '1x1', time: '11:30', email: 'Jonas.wong@oasis.com', topic: 'Financial Sector Earnings', interest: '2881 TT', analystEmail: 'titan.wang@fubon.com' },
        { id: 'service-103', date: '2026/01/22', coverage: 'Daishin/Fubon', analyst: 'Rita Wu', sales: 'Ken Lee', firm: 'AP Asset', client: 'Chole Kim', type: 'One off client meeting', method: 'In Person', duration: '60', format: 'GROUP', time: '14:00', email: 'Chloe.kim@apasset.com', topic: 'Shipping Rate Update', interest: '2603 TT', analystEmail: 'rita.wu@fubon.com' },

        // --- 2026/02 (2月) ---
        { id: 'service-201', date: '2026/02/05', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: 'FSR', client: 'David Chen', type: 'Incoming call', method: 'Virtual', duration: '30', format: '1x1', time: '10:30', email: 'david.chen@fsr.com', topic: 'CoWoS Capacity Analysis', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-202', date: '2026/02/12', coverage: 'Jefferies/Fubon', analyst: 'Titan Wang', sales: 'Ann Liao', firm: 'Jefferies', client: 'Sarah Jenkins', type: 'One off client meeting', method: 'Virtual', duration: '45', format: '1x1', time: '15:00', email: 'sjenkins@jefferies.com', topic: 'AI Server ODM Supply', interest: '2317 TT', analystEmail: 'titan.wang@fubon.com' },
        { id: 'service-203', date: '2026/02/20', coverage: 'Jefferies/Fubon', analyst: 'Rita Wu', sales: 'Ken Lee', firm: 'Fidelity', client: 'Michael Smith', type: 'Bespoke client request', method: 'email', duration: '30', format: '1x1', time: '16:00', email: 'msmith@fidelity.com', topic: 'High Dividend ETF Trends', interest: '0056 TT', analystEmail: 'rita.wu@fubon.com' },

        // --- 2026/03 (3月) ---
        { id: 'service-301', date: '2026/03/04', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: 'Cathay', client: '林志明', type: 'Model request', method: 'email', duration: '60', format: '1x1', time: '09:30', email: 'lin@cathay.com.tw', topic: 'AI GPU Model Request', interest: '6669 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-302', date: '2026/03/10', coverage: 'Fubon Only', analyst: 'Titan Wang', sales: 'Charlie Zhao', firm: 'BlackRock', client: 'Jennifer Wu', type: 'Incoming call', method: 'Virtual', duration: '45', format: '1x1', time: '14:00', email: 'jwu@blackrock.com', topic: 'IC Design Outlook', interest: '2454 TT', analystEmail: 'titan.wang@fubon.com' },
        { id: 'service-303', date: '2026/03/18', coverage: 'Jefferies/Fubon', analyst: 'Rita Wu', sales: 'Ann Liao', firm: 'Vanguard', client: 'Robert Taylor', type: 'One off client meeting', method: 'In Person', duration: '30', format: '1x1', time: '11:00', email: 'rtaylor@vanguard.com', topic: 'Freight Index Strategy', interest: '2609 TT', analystEmail: 'rita.wu@fubon.com' },

        // --- 2026/04 (4月) ---
        { id: 'service-401', date: '2026/04/08', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Ken Lee', firm: 'Capital', client: 'Amanda Brown', type: 'One off client meeting', method: 'Virtual', duration: '45', format: '1x1', time: '10:00', email: 'abrown@capital.com', topic: 'TSMC 1Q Earnings Call Review', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-402', date: '2026/04/16', coverage: 'Fubon Only', analyst: 'Titan Wang', sales: 'Ann Liao', firm: 'Yuanta', client: '陳美玲', type: 'Incoming call', method: 'Virtual', duration: '30', format: '1x1', time: '15:30', email: 'chen@yuanta.com.tw', topic: 'Bank Net Interest Margin', interest: '2882 TT', analystEmail: 'titan.wang@fubon.com' },
        // --- 2025/08 (Blueprint Image 2 control record) ---
        { id: 'service-blueprint-elizabeth-1', date: '2025/08/10', coverage: 'Jefferies/Fubon', analyst: 'Sherman Shang', sales: 'Charlie Zhao', salesTrader: 'Jason Chang', firm: 'FMR', client: 'Elizabeth Li', type: 'One off client meeting (video)', method: 'Incoming call', duration: '15', format: '1x1', time: '10:05', email: 'Elizabeth.li@FMR.com', topic: 'TSMC 2Q earnings', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com', notes: '' },

        // --- 2026/05 (5月) ---
        { id: 'service-501', date: '2026/05/06', coverage: 'Jefferies/Fubon', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: 'FMR', client: 'Elizabeth Li', type: 'Bespoke client request', method: 'email', duration: '30', format: '1x1', time: '11:00', email: 'Elizabeth.li@FMR.com', topic: 'Semiconductor Equipment', interest: '3131 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-502', date: '2026/05/14', coverage: 'Fubon Only', analyst: 'Titan Wang', sales: 'Ann Liao', firm: 'Oasis', client: 'Jonas Wong', type: 'One off client meeting', method: 'Virtual', duration: '60', format: '1x1', time: '14:30', email: 'Jonas.wong@oasis.com', topic: 'AI Server Cooling Solutions', interest: '3017 TT', analystEmail: 'titan.wang@fubon.com' },
        { id: 'service-503', date: '2026/05/21', coverage: 'Daishin/Fubon', analyst: 'Rita Wu', sales: 'Ken Lee', firm: 'AP Asset', client: 'Chole Kim', type: 'One off client meeting', method: 'In Person', duration: '45', format: '1x1', time: '10:00', email: 'Chloe.kim@apasset.com', topic: 'Marine Logistics Outlook', interest: '2603 TT', analystEmail: 'rita.wu@fubon.com' },

        // --- 2026/06 (6月) ---
        { id: 'service-601', date: '2026/06/05', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: 'FSR', client: 'David Chen', type: 'One off client meeting', method: 'In Person', duration: '45', format: 'GROUP', time: '10:00', email: 'david.chen@fsr.com', topic: 'Computex 2026 AI Highlights', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-602', date: '2026/06/12', coverage: 'Jefferies/Fubon', analyst: 'Titan Wang', sales: 'Ann Liao', firm: 'Jefferies', client: 'Sarah Jenkins', type: 'One off client meeting', method: 'Virtual', duration: '30', format: '1x1', time: '15:00', email: 'sjenkins@jefferies.com', topic: 'Memory Chip Price Cycles', interest: '2408 TT', analystEmail: 'titan.wang@fubon.com' },
        { id: 'service-603', date: '2026/06/25', coverage: 'Jefferies/Fubon', analyst: 'Rita Wu', sales: 'Ken Lee', firm: 'Fidelity', client: 'Michael Smith', type: 'Bespoke client request', method: 'email', duration: '50', format: '1x1', time: '16:30', email: 'msmith@fidelity.com', topic: 'Container Freight Rate Surges', interest: '2609 TT', analystEmail: 'rita.wu@fubon.com' },

        // --- 2026/07 (7月) ---
        { id: 'service-701', date: '2026/07/08', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: 'BlackRock', client: 'Jennifer Wu', type: 'One off client meeting', method: 'Virtual', duration: '60', format: '1x1', time: '10:30', email: 'jwu@blackrock.com', topic: 'TSMC 2Q Earnings & Capex Update', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-702', date: '2026/07/15', coverage: 'Jefferies/Fubon', analyst: 'Titan Wang', sales: 'Ann Liao', firm: 'Vanguard', client: 'Robert Taylor', type: 'One off client meeting', method: 'In Person', duration: '30', format: '1x1', time: '14:00', email: 'rtaylor@vanguard.com', topic: 'Financial Sector Q2 Dividends', interest: '2881 TT', analystEmail: 'titan.wang@fubon.com' },
        { id: 'service-703', date: '2026/07/23', coverage: 'Fubon Only', analyst: 'Rita Wu', sales: 'Ken Lee', firm: 'Capital', client: 'Amanda Brown', type: 'Model request', method: 'email', duration: '45', format: '1x1', time: '11:00', email: 'abrown@capital.com', topic: 'Subsea Cable & Telecommunication', interest: '2412 TT', analystEmail: 'rita.wu@fubon.com' },

        // --- 2026/08 (8月) ---
        { id: 'service-1', date: '2026/08/04', coverage: 'Jefferies/Fubon', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: 'FMR', client: 'Elizabeth Li', type: 'One off client meeting', method: 'Virtual', duration: '45', format: '1x1', time: '10:05', email: 'Elizabeth.li@FMR.com', topic: 'Advanced Packaging CoWoS-L', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 'service-2', date: '2026/08/11', coverage: 'Fubon Only', analyst: 'Titan Wang', sales: 'Ann Liao', firm: 'Oasis', client: 'Jonas Wong', type: 'Bespoke client request', method: 'email', duration: '30', format: '1x1', time: '11:00', email: 'Jonas.wong@oasis.com', topic: 'MediaTek Mobile SoC', interest: '2454 TT', analystEmail: 'titan.wang@fubon.com' },
        { id: 'service-3', date: '2026/08/18', coverage: 'Daishin/Fubon', analyst: 'Rita Wu', sales: 'Ken Lee', firm: 'AP Asset', client: 'Chole Kim', type: 'One off client meeting', method: 'In Person', duration: '60', format: 'GROUP', time: '09:00', email: 'Chloe.kim@apasset.com', topic: 'Global Shipping Spot Rates', interest: '2603 TT', analystEmail: 'rita.wu@fubon.com' },
        { id: 'service-804', date: '2026/08/25', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: 'FSR', client: 'David Chen', type: 'Incoming call', method: 'N/A', duration: '40', format: '1x1', time: '15:30', email: 'david.chen@fsr.com', topic: 'AI Server Rack Design', interest: '2317 TT', analystEmail: 'Sherman.shang@fubon.com' },
        { id: 's-aug-1', date: '2026/08/17', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Charlie Zhao', firm: '富邦投顧', client: '研究團隊', type: 'One off client meeting', method: 'In Person', duration: '90', format: '15人', time: '10:00~11:30', email: '', topic: '【研究員會議】台積電法說會前個股聚焦與產業評估', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com', notes: '研討 AI 晶片需求與 3nm 產能利用率' },
        { id: 's-aug-2', date: '2026/08/24', coverage: 'Fubon Only', analyst: 'Titan Wang', sales: 'Ann Liao', firm: '富邦投顧', client: '研究團隊', type: 'One off client meeting', method: 'Virtual', duration: '90', format: '20人', time: '14:00~15:30', email: '', topic: '【研究員會議】聯發科 Dimensity 旗艦晶片策略評估', interest: '2454 TT', analystEmail: 'titan.wang@fubon.com', notes: '客戶投資簡報與手機庫存回溫分析' },
        { id: 's-aug-3', date: '2026/08/28', coverage: 'Fubon Only', analyst: '張研究員', sales: 'Ken Lee', firm: '富邦投顧', client: '全體法人客戶', type: 'One off client meeting', method: 'Hybrid', duration: '120', format: '45人', time: '14:00~16:00', email: '', topic: '台股下半年 AI 供應鏈趨勢論壇 (法說會)', interest: 'AI 族群', analystEmail: 'zhang@fubon.com', notes: '實體論壇與線上直播' },

        // --- 2026/09 (9月 - 當月) ---
        { id: 's-sep-2-1', date: '2026/09/14', coverage: 'Jefferies/Fubon', analyst: 'Sherman Shang', sales: 'Charlie Zhao', salesTrader: 'Jason Chang', firm: 'FMR', client: 'Elizabeth Li', type: 'One off client meeting', method: 'In Person', duration: '90', format: '18人', time: '15:00', email: 'Elizabeth.li@FMR.com', topic: '【研究員會議】電動車與車用半導體大廠專題簡報', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com', notes: '鴻海與車用 Tier 1 供應商研討' },
        { id: 's-sep-2-2', date: '2026/09/14', coverage: 'Jefferies/Fubon', analyst: 'Sherman Shang', sales: 'Charlie Zhao', salesTrader: 'Jason Chang', firm: 'FMR', client: 'Elizabeth Li', type: 'Model request', method: 'email', duration: '45', format: '1x1', time: '15:00', email: 'Elizabeth.li@FMR.com', topic: '【研究員會議】電動車與車用半導體大廠專題簡報', interest: '2330 TT', analystEmail: 'Sherman.shang@fubon.com', notes: '' },
        { id: 's-sep-3-1', date: '2026/09/18', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Ann Liao', salesTrader: 'Terry', firm: 'Oasis', client: 'Jonas Wong', type: 'One off client meeting', method: 'Virtual', duration: '90', format: '60人', time: '10:00', email: 'Jonas.wong@oasis.com', topic: '2026 Q3 全球半導體展望法說會 (法說會)', interest: '2454 TT', analystEmail: 'Sherman.shang@fubon.com', notes: '法人客戶專屬說明會' },
        { id: 's-sep-3-2', date: '2026/09/18', coverage: 'Fubon Only', analyst: 'Sherman Shang', sales: 'Ann Liao', salesTrader: 'Terry', firm: 'Oasis', client: 'Jonas Wong', type: 'Model request', method: 'email', duration: '45', format: '1x1', time: '10:00', email: 'Jonas.wong@oasis.com', topic: '2026 Q3 全球半導體展望法說會 (法說會)', interest: '2454 TT', analystEmail: 'Sherman.shang@fubon.com', notes: '' },
        { id: 's-sep-4-1', date: '2026/09/21', coverage: 'Daishin/Fubon', analyst: 'Titan Wang', sales: 'Ken Lee', salesTrader: 'David Lin', firm: 'AP Asset', client: 'Chloe Kim', type: 'One off client meeting', method: 'Virtual', duration: '90', format: '30人', time: '09:30', email: 'Chloe.kim@apasset.com', topic: '【研究員會議】美股科技巨頭財報 Preview 與總體經濟', interest: '2317 TT', analystEmail: 'titan.wang@fubon.com', notes: '聯準會利率決策與科技股估值' }
    ];

    // 服務名稱 (Key值) 計算與取得輔助函數：
    // 若有自訂 serviceName 則直接採用；否則依規則自動生成預設名稱: Firm M/D Ticker/Topic (Ticker優先)
    const getServiceName = (record) => {
        if (!record) return '';
        if (record.serviceName && record.serviceName.trim()) {
            return record.serviceName.trim();
        }
        const firm = (record.firm || '').split(/[,;、]/)[0]?.trim() || 'FMR';
        let dateFormatted = '';
        if (record.date) {
            const cleanDate = record.date.replace(/\//g, '-');
            const parts = cleanDate.split('-');
            if (parts.length === 3) {
                dateFormatted = `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
            } else {
                dateFormatted = record.date;
            }
        }
        const target = (record.interest || '').trim() || (record.topic || '').trim() || '服務紀錄';
        return `${firm} ${dateFormatted} ${target}`.trim();
    };

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

    // Global Firms Database
    const DEFAULT_FIRMS = [
        { id: 'firm-1', org: '外法', name: 'FMR', coverage: 'Jefferies/Fubon', note1: 'HK, ATL, LDN', note2: 'Long Only', note3: 'Tier 1' },
        { id: 'firm-2', org: '外法', name: 'Oasis', coverage: 'Fubon Only', note1: 'HK', note2: 'Long Only', note3: 'Tier 2' },
        { id: 'firm-3', org: '外法', name: 'AP Asset', coverage: 'Daishin/Fubon', note1: 'SEOUL', note2: 'Long Only', note3: 'Tier 2' },
        { id: 'firm-4', org: '外法', name: 'BlackRock', coverage: 'Jefferies/Fubon', note1: 'NY, HK', note2: 'Long Only', note3: 'Tier 1' },
        { id: 'firm-5', org: '外法', name: 'Capital', coverage: 'Jefferies/Fubon', note1: 'LA, SG', note2: 'Long Only', note3: 'Tier 1' },
        { id: 'firm-6', org: '壽險', name: 'Cathay', coverage: 'Fubon Only', note1: 'TW', note2: 'Life/Long Only', note3: 'Tier 1' },
        { id: 'firm-7', org: '外法', name: 'CITI', coverage: 'Fubon Only', note1: 'HK', note2: 'Broker/Asset', note3: 'Tier 2' },
        { id: 'firm-8', org: '主權', name: 'GIC', coverage: 'Fubon Only', note1: 'SG', note2: 'Sovereign', note3: 'Tier 1' },
        { id: 'firm-9', org: '外法', name: 'HSBC', coverage: 'Fubon Only', note1: 'HK, LDN', note2: 'Broker/Asset', note3: 'Tier 2' },
        { id: 'firm-10', org: '外法', name: 'FSR', coverage: 'Jefferies/Fubon', note1: 'LDN', note2: 'Long Only', note3: 'Tier 2' }
    ];
    let customFirms = safeJsonParse('crm_custom_firms', []);
    const getAllFirms = () => [...DEFAULT_FIRMS, ...customFirms];

    // Global Clients Database
    const DEFAULT_CLIENTS = [
        { id: 'client-1', name: 'Elizabeth Li', firm: 'FMR', title: 'EM generalist', email: 'elizabeth.li@FMR.com', phone: '968-888-888', region: 'HK', sales: 'Charlie Zhao', trader: 'Jason Chang', baseCount: 20, baseDuration: 160 },
        { id: 'client-2', name: 'Brian Chang', firm: 'HSBC', title: 'Manager', email: 'aaa@fubon.com', phone: '123-xxx-xxx', region: 'HK', sales: 'Kevin', trader: 'Terry', baseCount: 10, baseDuration: 100 },
        { id: 'client-3', name: 'Rita Tsai', firm: 'CITI', title: 'Manager', email: 'zzz@fubon.com', phone: '123-xxx-xxx', region: 'HK', sales: 'Jack', trader: 'Jason', baseCount: 20, baseDuration: 95 },
        { id: 'client-4', name: 'Jonas Wong', firm: 'Oasis', title: 'Manager', email: 'Jonas.wong@oasis.com', phone: '968-888-888', region: 'HK', sales: 'Ann Liao', trader: 'Terry', baseCount: 3, baseDuration: 30 },
        { id: 'client-5', name: 'Chloe Kim', firm: 'AP Asset', title: 'Manager', email: 'Chloe.kim@apasset.com', phone: '123-xxx-xxx', region: 'SEOUL', sales: 'Ken Lee', trader: 'David Lin', baseCount: 3, baseDuration: 45 }
    ];
    let customClients = safeJsonParse('crm_custom_clients', []);
    const getAllClients = () => [...DEFAULT_CLIENTS, ...customClients];

    // Load custom services (clearing any legacy mock database ID conflicts)
    let rawCustomServices = safeJsonParse('crm_custom_services', []);
    let customServices = rawCustomServices.filter(s => s && s.id && s.id !== 'service-1' && s.id !== 'service-2' && s.id !== 'service-3');
    if (rawCustomServices.length !== customServices.length) {
        localStorage.setItem('crm_custom_services', JSON.stringify(customServices));
    }
    // Load pinned service IDs (首頁僅顯示有被釘選加入個人行事曆之服務)
    const defaultPinnedIds = ['service-2025-1', 'service-2025-2', 'service-2025-3', 'service-101', 'service-102', 's-sep-2-1', 's-sep-2-2', 's-sep-3-1', 's-sep-3-2', 's-sep-4-1', 's-aug-1', 's-aug-2', 's-aug-3'];
    let pinnedServiceIds = safeJsonParse('crm_pinned_services_ids', null);
    if (pinnedServiceIds === null || !Array.isArray(pinnedServiceIds)) {
        pinnedServiceIds = [...defaultPinnedIds];
        localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedServiceIds));
    } else {
        // 確保截圖指定之釘選項目必定在列表中
        const corePinned = ['service-2025-1', 'service-2025-2', 'service-2025-3', 'service-101', 'service-102'];
        let changed = false;
        corePinned.forEach(cid => {
            if (!pinnedServiceIds.includes(cid)) {
                pinnedServiceIds.push(cid);
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedServiceIds));
        }
    }

    // Helper to get all services (mock + custom)
    const getAllServices = () => {
        return [...DEFAULT_SERVICES, ...customServices].filter(s => s && s.id);
    };

    // Save pinned services complete details to localStorage for the homepage calendar to consume easily
    const syncPinnedServicesDetailsToHome = () => {
        const allServices = getAllServices();
        const pinnedDetails = allServices.filter(s => pinnedServiceIds.includes(s.id)).map(s => ({
            ...s,
            serviceName: s.serviceName || (typeof getServiceName === 'function' ? getServiceName(s) : (s.topic || ''))
        }));
        localStorage.setItem('crm_pinned_services', JSON.stringify(pinnedDetails));
        
        // Also update local storage ids list
        localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedServiceIds));
    };

    // Always sync pinned services details on load to guarantee consistency with updated dates
    syncPinnedServicesDetailsToHome();

    // Render Follow-up / Pin stars in the UI
    const updatePinStarsUI = () => {
        document.querySelectorAll('.service-pin-btn').forEach(btn => {
            const id = btn.getAttribute('data-id');
            if (pinnedServiceIds.includes(id)) {
                btn.textContent = '★';
                btn.style.color = '#f1c40f';
                btn.title = '已加入追蹤 (點擊取消追蹤)';
            } else {
                btn.textContent = '☆';
                btn.style.color = '#94A3B8';
                btn.title = '未追蹤 (點擊加入追蹤)';
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
                        if (nextActiveBtn.getAttribute('data-target') === 'panel-records-list') {
                            const btnModeDetails = document.getElementById('btn-mode-details');
                            if (btnModeDetails) btnModeDetails.click();
                        }
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
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.style.display = 'block';
            }

            // User requirement: Default to Details view (明細) when clicking 服務紀錄管理 tab
            if (targetId === 'panel-records-list') {
                const btnModeSummary = document.getElementById('btn-mode-summary');
                const btnModeDetails = document.getElementById('btn-mode-details');
                const summaryDashboardPanel = document.getElementById('summary-dashboard-panel');
                const detailsListPanel = document.getElementById('details-list-panel');

                if (btnModeSummary && btnModeDetails && summaryDashboardPanel && detailsListPanel) {
                    btnModeDetails.classList.add('active');
                    btnModeDetails.style.background = '#5C8ED6';
                    btnModeDetails.style.color = 'white';

                    btnModeSummary.classList.remove('active');
                    btnModeSummary.style.background = 'white';
                    btnModeSummary.style.color = '#374151';

                    detailsListPanel.style.display = 'block';
                    summaryDashboardPanel.style.display = 'none';
                    if (typeof refreshServiceRecordsTable === 'function') refreshServiceRecordsTable();
                }
            }

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

    // Helper to update form header title in real-time based on topic or interest (ticker/topic rule)
    const updateFormHeaderTitle = () => {
        const serviceNameInput = document.getElementById('record-service-name');
        const topicInput = document.getElementById('record-topic');
        const serviceName = serviceNameInput ? serviceNameInput.value.trim() : '';
        const topic = topicInput ? topicInput.value.trim() : '';
        const interest = document.getElementById('record-interest') ? document.getElementById('record-interest').value.trim() : '';
        const firm = document.getElementById('record-firm') ? document.getElementById('record-firm').value : '';
        const rawDate = document.getElementById('record-date') ? document.getElementById('record-date').value : '';
        const shortDate = rawDate ? rawDate.substring(5).replace('-', '/') : '';
        const formTitle = document.querySelector('#panel-record-form .form-title-group h3');
        if (!formTitle) return;

        if (serviceName) {
            formTitle.textContent = serviceName;
        } else if (topic) {
            formTitle.textContent = topic;
        } else if (interest) {
            formTitle.textContent = `${firm || 'FSR'} ${shortDate || '8/10'} ${interest}`;
        } else if (firm || shortDate) {
            formTitle.textContent = `${firm || 'FSR'} ${shortDate || ''}`;
        } else {
            formTitle.textContent = '新增服務紀錄 New Service Record';
        }
    };

    // Bind input listeners for dynamic title preview
    ['record-service-name', 'record-topic', 'record-interest', 'record-firm', 'record-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateFormHeaderTitle);
            el.addEventListener('change', updateFormHeaderTitle);
        }
    });

    // ====================================================
    // Multi-Select Analyst Component
    // ====================================================
    const setupMultiSelectAnalyst = (prefix) => {
        const box = document.getElementById(`${prefix}-analyst-box`);
        const dropdown = document.getElementById(`${prefix}-analyst-dropdown`);
        const hiddenInput = document.getElementById(`${prefix}-analyst`);
        const emailInput = document.getElementById(`${prefix}-analyst-email`);
        const emailList = document.getElementById(`${prefix}-analyst-email-list`);

        if (!box || !dropdown || !hiddenInput || !emailInput) return null;

        const allAnalysts = getAllAnalysts();

        // Build options HTML
        let optionsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9;">
                <span style="font-size: 11px; font-weight: 700; color: #64748b;">選取主談研究員 (可複選)</span>
                <span class="btn-clear-all" style="font-size: 11px; color: #ef4444; cursor: pointer; font-weight: 600;">清除全部</span>
            </div>
            <div class="analyst-checkbox-list" style="display: flex; flex-direction: column; gap: 3px;">
        `;
        allAnalysts.forEach(a => {
            optionsHTML += `
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: background 0.15s; margin: 0;" onmouseover="this.style.background='#F0F9FF'" onmouseout="this.style.background='transparent'">
                    <span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1E293B;">
                        <input type="checkbox" class="analyst-check-item" value="${a.enName}" data-full-name="${a.enName} ${a.zhName ? '('+a.zhName+')' : ''}" data-email="${a.email}" style="cursor: pointer; accent-color: #0284C7; width: 15px; height: 15px;">
                        <strong>${a.enName}</strong> <span style="color: #64748B; font-size: 12px;">(${a.zhName || ''})</span>
                    </span>
                    <span style="font-size: 11px; color: #0284C7; background: #E0F2FE; padding: 1px 6px; border-radius: 4px; font-family: monospace;">${a.email}</span>
                </label>
            `;
        });
        optionsHTML += `</div>`;
        dropdown.innerHTML = optionsHTML;
        dropdown.onclick = (e) => e.stopPropagation();

        // Toggle dropdown on box click
        box.onclick = (e) => {
            if (e.target.closest('.remove-analyst-btn')) return;
            const isVisible = dropdown.style.display === 'block';
            document.querySelectorAll('[id$="-analyst-dropdown"]').forEach(d => d.style.display = 'none');
            dropdown.style.display = isVisible ? 'none' : 'block';
            e.stopPropagation();
        };

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!box.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        const syncSelectionToUI = (selectedItems) => {
            // Update checkboxes
            dropdown.querySelectorAll('.analyst-check-item').forEach(cb => {
                const cbVal = cb.value.toLowerCase();
                const cbFull = cb.getAttribute('data-full-name').toLowerCase();
                cb.checked = selectedItems.some(item => {
                    const iVal = item.name.toLowerCase();
                    return iVal === cbVal || cbFull.includes(iVal) || iVal.includes(cbVal);
                });
            });

            // Update display chips in box
            box.innerHTML = '';
            if (selectedItems.length === 0) {
                box.innerHTML = `<span style="color: #94a3b8; font-size: 13px;">點擊選取研究員 (可多選)...</span>`;
            } else {
                selectedItems.forEach(item => {
                    const chip = document.createElement('span');
                    chip.style.cssText = 'background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; user-select: none;';
                    chip.innerHTML = `<span>🔬 ${item.name}</span><b class="remove-analyst-btn" data-name="${item.name}" style="cursor: pointer; font-size: 14px; line-height: 1; color: #0284C7;">×</b>`;
                    chip.querySelector('.remove-analyst-btn').onclick = (e) => {
                        e.stopPropagation();
                        removeAnalyst(item.name);
                    };
                    box.appendChild(chip);
                });
            }

            // Update hidden input with comma-separated names
            hiddenInput.value = selectedItems.map(i => i.name).join(', ');

            // Update email input with semicolon-separated emails
            emailInput.value = selectedItems.map(i => i.email).filter(Boolean).join('; ');

            // Render email tags preview
            if (emailList) {
                emailList.innerHTML = selectedItems.map(i => `
                    <div style="font-size: 11px; color: #475569; display: flex; align-items: center; justify-content: space-between; background: #F8FAFC; padding: 2px 8px; border-radius: 4px; border: 1px solid #E2E8F0;">
                        <span><strong style="color: #0369A1;">${i.name}</strong></span>
                        <span style="color: #0284C7; font-family: monospace;">${i.email || '未設定'}</span>
                    </div>
                `).join('');
            }
        };

        const getSelectedItemsFromCheckboxes = () => {
            const selected = [];
            dropdown.querySelectorAll('.analyst-check-item:checked').forEach(cb => {
                selected.push({
                    name: cb.value,
                    fullName: cb.getAttribute('data-full-name'),
                    email: cb.getAttribute('data-email')
                });
            });
            return selected;
        };

        const removeAnalyst = (name) => {
            dropdown.querySelectorAll('.analyst-check-item').forEach(cb => {
                if (cb.value.toLowerCase() === name.toLowerCase() || cb.getAttribute('data-full-name').includes(name)) {
                    cb.checked = false;
                }
            });
            syncSelectionToUI(getSelectedItemsFromCheckboxes());
        };

        // Bind checkbox change
        dropdown.querySelectorAll('.analyst-check-item').forEach(cb => {
            cb.addEventListener('change', () => {
                syncSelectionToUI(getSelectedItemsFromCheckboxes());
            });
        });

        // Clear all button
        const clearBtn = dropdown.querySelector('.btn-clear-all');
        if (clearBtn) {
            clearBtn.onclick = (e) => {
                e.stopPropagation();
                dropdown.querySelectorAll('.analyst-check-item').forEach(cb => cb.checked = false);
                syncSelectionToUI([]);
            };
        }

        // Programmatic setter
        const setAnalysts = (rawNames, rawEmails = '') => {
            if (!rawNames) {
                syncSelectionToUI([]);
                return;
            }
            const names = String(rawNames).split(/[,;、]/).map(s => s.trim()).filter(Boolean);
            const emails = String(rawEmails).split(/[,;]/).map(s => s.trim()).filter(Boolean);

            const items = names.map((name, idx) => {
                const matched = allAnalysts.find(a => 
                    name.toLowerCase().includes(a.enName.toLowerCase()) || 
                    (a.zhName && name.includes(a.zhName))
                );
                const assignedEmail = (emails[idx]) || (matched ? matched.email : 'Sherman.shang@fubon.com');
                const displayName = matched ? matched.enName : name;
                return {
                    name: displayName,
                    email: assignedEmail
                };
            });

            syncSelectionToUI(items);
        };

        return { setAnalysts };
    };

    // ====================================================
    // Multi-Select Firm Component (法人戶多選)
    // ====================================================
    const setupMultiSelectFirm = (prefix) => {
        const box = document.getElementById(`${prefix}-firm-box`);
        const dropdown = document.getElementById(`${prefix}-firm-dropdown`);
        const hiddenInput = document.getElementById(`${prefix}-firm`);
        if (!box || !dropdown || !hiddenInput) return null;

        const allFirms = getAllFirms();

        let optionsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9;">
                <span style="font-size: 11px; font-weight: 700; color: #64748b;">選取法人戶 (可複選)</span>
                <span class="btn-clear-all" style="font-size: 11px; color: #ef4444; cursor: pointer; font-weight: 600;">清除全部</span>
            </div>
            <div class="firm-checkbox-list" style="display: flex; flex-direction: column; gap: 3px;">
        `;
        allFirms.forEach(f => {
            optionsHTML += `
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: background 0.15s; margin: 0;" onmouseover="this.style.background='#F0F9FF'" onmouseout="this.style.background='transparent'">
                    <span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1E293B;">
                        <input type="checkbox" class="firm-check-item" value="${f.name}" data-name="${f.name}" style="cursor: pointer; accent-color: #0284C7; width: 15px; height: 15px;">
                        <strong>${f.name}</strong> <span style="color: #64748B; font-size: 12px;">(${f.org || '外法'})</span>
                    </span>
                    <span style="font-size: 11px; color: #64748B; background: #F1F5F9; padding: 1px 6px; border-radius: 4px;">${f.coverage || ''}</span>
                </label>
            `;
        });
        optionsHTML += `</div>`;
        dropdown.innerHTML = optionsHTML;
        dropdown.onclick = (e) => e.stopPropagation();

        box.onclick = (e) => {
            if (e.target.closest('.remove-firm-btn')) return;
            const isVisible = dropdown.style.display === 'block';
            document.querySelectorAll('[id$="-firm-dropdown"], [id$="-analyst-dropdown"], [id$="-client-dropdown"]').forEach(d => d.style.display = 'none');
            dropdown.style.display = isVisible ? 'none' : 'block';
            e.stopPropagation();
        };

        document.addEventListener('click', (e) => {
            if (!box.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        const syncSelectionToUI = (selectedNames) => {
            dropdown.querySelectorAll('.firm-check-item').forEach(cb => {
                const val = cb.value.toLowerCase();
                cb.checked = selectedNames.some(n => n.toLowerCase() === val);
            });

            box.innerHTML = '';
            if (selectedNames.length === 0) {
                box.innerHTML = `<span style="color: #94a3b8; font-size: 13px;">點擊選取法人戶 (可多選)...</span>`;
            } else {
                selectedNames.forEach(name => {
                    const chip = document.createElement('span');
                    chip.className = 'chip';
                    chip.style.cssText = 'background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; user-select: none;';
                    chip.innerHTML = `<span>🏢 ${name}</span><b class="remove-firm-btn" data-name="${name}" style="cursor: pointer; font-size: 14px; line-height: 1; color: #1D4ED8;">×</b>`;
                    chip.querySelector('.remove-firm-btn').onclick = (e) => {
                        e.stopPropagation();
                        removeFirm(name);
                    };
                    box.appendChild(chip);
                });
            }

            hiddenInput.value = selectedNames.join(', ');
        };

        const getSelectedFromCheckboxes = () => {
            const selected = [];
            dropdown.querySelectorAll('.firm-check-item:checked').forEach(cb => {
                selected.push(cb.value);
            });
            return selected;
        };

        const removeFirm = (name) => {
            dropdown.querySelectorAll('.firm-check-item').forEach(cb => {
                if (cb.value.toLowerCase() === name.toLowerCase()) {
                    cb.checked = false;
                }
            });
            syncSelectionToUI(getSelectedFromCheckboxes());
        };

        dropdown.querySelectorAll('.firm-check-item').forEach(cb => {
            cb.addEventListener('change', () => {
                syncSelectionToUI(getSelectedFromCheckboxes());
            });
        });

        const clearBtn = dropdown.querySelector('.btn-clear-all');
        if (clearBtn) {
            clearBtn.onclick = (e) => {
                e.stopPropagation();
                dropdown.querySelectorAll('.firm-check-item').forEach(cb => cb.checked = false);
                syncSelectionToUI([]);
            };
        }

        const setFirms = (rawNames) => {
            if (!rawNames) {
                syncSelectionToUI([]);
                return;
            }
            const names = String(rawNames).split(/[,;、]/).map(s => s.trim()).filter(Boolean);
            syncSelectionToUI(names);
        };

        return { setFirms };
    };

    // ====================================================
    // Multi-Select Client Component (客戶多選)
    // ====================================================
    const setupMultiSelectClient = (prefix) => {
        const box = document.getElementById(`${prefix}-client-box`);
        const dropdown = document.getElementById(`${prefix}-client-dropdown`);
        const hiddenInput = document.getElementById(`${prefix}-client`);
        if (!box || !dropdown || !hiddenInput) return null;

        const allClients = getAllClients();

        let optionsHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9;">
                <span style="font-size: 11px; font-weight: 700; color: #64748b;">選取客戶 (可複選)</span>
                <span class="btn-clear-all" style="font-size: 11px; color: #ef4444; cursor: pointer; font-weight: 600;">清除全部</span>
            </div>
            <div style="padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9;">
                <input type="text" class="client-dropdown-filter" placeholder="搜尋客戶姓名或法人..." style="width: 100%; padding: 4px 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
            </div>
            <div class="client-checkbox-list" style="display: flex; flex-direction: column; gap: 3px; max-height: 160px; overflow-y: auto;">
        `;
        allClients.forEach(c => {
            optionsHTML += `
                <label class="client-item-label" data-search="${(c.name + ' ' + (c.firm || '')).toLowerCase()}" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: background 0.15s; margin: 0;" onmouseover="this.style.background='#F0F9FF'" onmouseout="this.style.background='transparent'">
                    <span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1E293B;">
                        <input type="checkbox" class="client-check-item" value="${c.name}" data-name="${c.name}" data-email="${c.email || ''}" style="cursor: pointer; accent-color: #0284C7; width: 15px; height: 15px;">
                        <strong>${c.name}</strong> <span style="color: #64748B; font-size: 12px;">(${c.firm || ''})</span>
                    </span>
                    <span style="font-size: 11px; color: #0284C7; background: #E0F2FE; padding: 1px 6px; border-radius: 4px;">${c.email || ''}</span>
                </label>
            `;
        });
        optionsHTML += `</div>`;
        dropdown.innerHTML = optionsHTML;
        dropdown.onclick = (e) => e.stopPropagation();

        const filterInput = dropdown.querySelector('.client-dropdown-filter');
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                const val = e.target.value.trim().toLowerCase();
                dropdown.querySelectorAll('.client-item-label').forEach(lbl => {
                    const searchData = lbl.getAttribute('data-search') || '';
                    lbl.style.display = searchData.includes(val) ? 'flex' : 'none';
                });
            });
        }

        box.onclick = (e) => {
            if (e.target.closest('.remove-client-btn')) return;
            const isVisible = dropdown.style.display === 'block';
            document.querySelectorAll('[id$="-firm-dropdown"], [id$="-analyst-dropdown"], [id$="-client-dropdown"]').forEach(d => d.style.display = 'none');
            dropdown.style.display = isVisible ? 'none' : 'block';
            if (!isVisible && filterInput) {
                setTimeout(() => filterInput.focus(), 50);
            }
            e.stopPropagation();
        };

        document.addEventListener('click', (e) => {
            if (!box.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        const syncSelectionToUI = (selectedNames) => {
            dropdown.querySelectorAll('.client-check-item').forEach(cb => {
                const val = cb.value.toLowerCase();
                cb.checked = selectedNames.some(n => n.toLowerCase() === val);
            });

            box.innerHTML = '';
            if (selectedNames.length === 0) {
                box.innerHTML = `<span style="color: #94a3b8; font-size: 13px;">點擊選取客戶 (可多選)...</span>`;
            } else {
                selectedNames.forEach(name => {
                    const chip = document.createElement('span');
                    chip.className = 'chip';
                    chip.style.cssText = 'background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; user-select: none;';
                    chip.innerHTML = `<span>👤 ${name}</span><b class="remove-client-btn" data-name="${name}" style="cursor: pointer; font-size: 14px; line-height: 1; color: #15803D;">×</b>`;
                    chip.querySelector('.remove-client-btn').onclick = (e) => {
                        e.stopPropagation();
                        removeClient(name);
                    };
                    box.appendChild(chip);
                });
            }

            hiddenInput.value = selectedNames.join(', ');
        };

        const getSelectedFromCheckboxes = () => {
            const selected = [];
            dropdown.querySelectorAll('.client-check-item:checked').forEach(cb => {
                selected.push(cb.value);
            });
            return selected;
        };

        const removeClient = (name) => {
            dropdown.querySelectorAll('.client-check-item').forEach(cb => {
                if (cb.value.toLowerCase() === name.toLowerCase()) {
                    cb.checked = false;
                }
            });
            syncSelectionToUI(getSelectedFromCheckboxes());
        };

        dropdown.querySelectorAll('.client-check-item').forEach(cb => {
            cb.addEventListener('change', () => {
                const items = getSelectedFromCheckboxes();
                syncSelectionToUI(items);
                // If email input is empty, fill with selected client email
                const emailTarget = document.getElementById(`${prefix}-email`);
                if (emailTarget && !emailTarget.value) {
                    const firstCb = dropdown.querySelector('.client-check-item:checked');
                    if (firstCb) {
                        const email = firstCb.getAttribute('data-email');
                        if (email) emailTarget.value = email;
                    }
                }
            });
        });

        const clearBtn = dropdown.querySelector('.btn-clear-all');
        if (clearBtn) {
            clearBtn.onclick = (e) => {
                e.stopPropagation();
                dropdown.querySelectorAll('.client-check-item').forEach(cb => cb.checked = false);
                syncSelectionToUI([]);
            };
        }

        const setClients = (rawNames) => {
            if (!rawNames) {
                syncSelectionToUI([]);
                return;
            }
            const names = String(rawNames).split(/[,;、]/).map(s => s.trim()).filter(Boolean);
            syncSelectionToUI(names);
        };

        return { setClients };
    };

    let meditAnalystSelector = setupMultiSelectAnalyst('medit');
    let recordAnalystSelector = setupMultiSelectAnalyst('record');
    let recordFirmSelector = setupMultiSelectFirm('record');
    let meditFirmSelector = setupMultiSelectFirm('medit');
    let recordClientSelector = setupMultiSelectClient('record');
    let meditClientSelector = setupMultiSelectClient('medit');

    const showFormView = (isEdit = false, recordId = null, forceManual = false) => {
        hideAllPanels();
        const targetForm = document.getElementById('panel-record-form');
        if (targetForm) {
            targetForm.classList.add('active');
            targetForm.style.display = 'block';
        }
        
        const formTitle = targetForm ? targetForm.querySelector('.form-title-group h3') : null;
        const saveBtn = document.getElementById('btn-save-record');

        let importNotice = document.getElementById('import-from-home-notice');
        if (!importNotice && targetForm) {
            importNotice = document.createElement('div');
            importNotice.id = 'import-from-home-notice';
            importNotice.style.cssText = 'padding:10px 14px; border-radius:6px; margin-bottom:16px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px;';
            targetForm.insertBefore(importNotice, targetForm.querySelector('.record-form-wrapper'));
        }

        if (isEdit && recordId) {
            // --- EDIT MODE ---
            const allServices = getAllServices();
            const service = allServices.find(s => s.id === recordId);
            if (service) {
                const sName = service.serviceName || getServiceName(service);
                if (formTitle) formTitle.textContent = sName || service.topic || '編輯服務紀錄 Edit Service Record';
                if (importNotice) {
                    importNotice.style.display = 'flex';
                    importNotice.style.background = '#FEF3C7';
                    importNotice.style.color = '#B45309';
                    importNotice.style.border = '1px solid #FDE68A';
                    importNotice.innerHTML = `📝 <strong>編輯紀錄模式：</strong> 正在修改服務紀錄 ID: ${recordId}`;
                }

                document.getElementById('record-date').value = service.date ? service.date.replace(/\//g, '-') : '';
                document.getElementById('record-time').value = service.time || '10:05';
                document.getElementById('record-duration').value = service.duration || '30';
                document.getElementById('record-analyst-email').value = service.analystEmail || 'Sherman.shang@fubon.com';
                document.getElementById('record-client').value = service.client || 'Elizabeth Li';
                document.getElementById('record-interest').value = service.interest || '';
                document.getElementById('record-topic').value = service.topic || '';
                const sNameInput = document.getElementById('record-service-name');
                if (sNameInput) sNameInput.value = sName;
                document.getElementById('record-email').value = service.email || '';
                document.getElementById('notes-textarea').value = service.notes || '';
                
                document.getElementById('record-type').value = service.type || (getInteractionTypes()[0] || 'One off client meeting');
                document.getElementById('record-method').value = service.method || (getInteractionMethods()[0] || 'In Person');
                if(service.sales) document.getElementById('record-sales').value = service.sales;
                if(service.salesTrader) document.getElementById('record-sales-trader').value = service.salesTrader;

                if (!recordFirmSelector) recordFirmSelector = setupMultiSelectFirm('record');
                if (recordFirmSelector) recordFirmSelector.setFirms(service.firm || '');

                if (!recordClientSelector) recordClientSelector = setupMultiSelectClient('record');
                if (recordClientSelector) recordClientSelector.setClients(service.client || '');

                if (!recordAnalystSelector) {
                    recordAnalystSelector = setupMultiSelectAnalyst('record');
                }
                if (recordAnalystSelector) {
                    recordAnalystSelector.setAnalysts(service.analyst || '', service.analystEmail || '');
                } else {
                    document.getElementById('record-analyst').value = service.analyst || '';
                    document.getElementById('record-analyst-email').value = service.analystEmail || '';
                }

                saveBtn.setAttribute('data-mode', 'edit');
                saveBtn.setAttribute('data-edit-id', recordId);
                updateFormHeaderTitle();

                const followUpCheck = document.getElementById('record-followup');
                if (followUpCheck) {
                    followUpCheck.checked = pinnedServiceIds.includes(recordId);
                }
            }
        } else {
            // --- NEW RECORD MODE: Check Path A (Homepage Import) vs Path B (Direct Menu Click) ---
            const getImportData = () => {
                if (forceManual) return null; // User explicitly clicked menu/subtab

                let data = null;
                const stored = sessionStorage.getItem('crm_import_meeting');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (parsed && (parsed.topic || parsed.date || parsed.title)) {
                            data = parsed;
                        }
                    } catch (e) {
                        console.warn("Failed to parse crm_import_meeting", e);
                    }
                }

                const qParams = parseAllQueryParams();
                if (!data && (qParams.action === 'new-service' || window.location.hash.includes('new-service') || qParams.topic || qParams.date)) {
                    data = {
                        topic: qParams.topic || '',
                        date: qParams.date ? qParams.date.replace(/\//g, '-') : '',
                        time: qParams.time || '',
                        analyst: qParams.analyst || '',
                        serviceType: qParams.type || qParams.serviceType || '',
                        format: qParams.format || '',
                        interest: qParams.interest || '',
                        notes: qParams.notes || ''
                    };
                }

                if (data && (data.topic || data.date || data.title)) {
                    return {
                        topic: data.topic || data.title || '',
                        date: data.date ? data.date.replace(/\//g, '-') : '2026-09-14',
                        time: data.time || '15:00',
                        analyst: data.analyst || data.speaker || 'Sherman Shang',
                        serviceType: data.serviceType || data.type || '',
                        format: data.format || data.attendees || '1x1',
                        interest: data.interest || (data.topic && data.topic.includes('電動車') ? '2330 TT' : (data.topic && data.topic.includes('半導體') ? '2454 TT' : '2330 TT')),
                        duration: data.duration || (data.serviceType && data.serviceType.toLowerCase().includes('model') ? '45' : '90'),
                        notes: data.notes || '',
                        firm: data.firm || 'FMR',
                        client: data.client || 'Elizabeth Li',
                        email: data.email || 'Elizabeth.li@FMR.com',
                        sales: data.sales || 'Charlie Zhao',
                        salesTrader: data.salesTrader || 'Jason Chang'
                    };
                }

                return null;
            };

            const importData = getImportData();

            if (importData) {
                // === PATH A: IMPORTED FROM HOMEPAGE CALENDAR ===
                if (importNotice) {
                    importNotice.style.display = 'flex';
                    importNotice.style.background = '#E0F2FE';
                    importNotice.style.color = '#0369A1';
                    importNotice.style.border = '1px solid #BAE6FD';
                    importNotice.innerHTML = `✨ <strong>已成功對接並匯入首頁會議資料：</strong> 主題「${importData.topic || '無主題'}」/ 日期 ${importData.date || ''}。所有欄位已自動填入，確認無誤後請點擊下方「儲存紀錄」。`;
                }

                document.getElementById('record-topic').value = importData.topic || '';
                const sNameInputImport = document.getElementById('record-service-name');
                if (sNameInputImport) sNameInputImport.value = importData.serviceName || '';
                document.getElementById('record-date').value = importData.date || '2026-09-14';
                document.getElementById('record-time').value = importData.time || '15:00';
                document.getElementById('record-duration').value = importData.duration || '90';
                document.getElementById('record-format').value = importData.format || '1x1';
                document.getElementById('notes-textarea').value = importData.notes || '';
                document.getElementById('record-interest').value = importData.interest || '2330 TT';
                document.getElementById('record-email').value = importData.email || 'Elizabeth.li@FMR.com';
                
                if (!recordAnalystSelector) {
                    recordAnalystSelector = setupMultiSelectAnalyst('record');
                }
                if (recordAnalystSelector) {
                    recordAnalystSelector.setAnalysts(importData.analyst || 'Sherman Shang', '');
                } else {
                    document.getElementById('record-analyst').value = importData.analyst || 'Sherman Shang';
                    document.getElementById('record-analyst-email').value = 'Sherman.shang@fubon.com';
                }

                // Map Interaction Type
                const rawType = (importData.serviceType || importData.type || '').toLowerCase();
                let matchedType = 'One off client meeting';
                if (rawType.includes('model')) {
                    matchedType = 'Model request';
                } else if (rawType.includes('bespoke')) {
                    matchedType = 'Bespoke client request';
                } else if (rawType.includes('incoming') || rawType.includes('call')) {
                    matchedType = 'Incoming call';
                }
                document.getElementById('record-type').value = matchedType;

                // Map Method
                if (matchedType === 'Model request' || rawType.includes('email')) {
                    document.getElementById('record-method').value = 'email';
                } else if (rawType.includes('virtual') || rawType.includes('video')) {
                    document.getElementById('record-method').value = 'Virtual';
                } else {
                    document.getElementById('record-method').value = 'In Person';
                }

                if (!recordFirmSelector) recordFirmSelector = setupMultiSelectFirm('record');
                if (recordFirmSelector) recordFirmSelector.setFirms(importData.firm || 'FMR');

                if (!recordClientSelector) recordClientSelector = setupMultiSelectClient('record');
                if (recordClientSelector) recordClientSelector.setClients(importData.client || 'Elizabeth Li');

                document.getElementById('record-sales').value = importData.sales || 'Charlie Zhao';
                document.getElementById('record-sales-trader').value = importData.salesTrader || 'Jason Chang';
                
                updateFormHeaderTitle();
            } else {
                // === PATH B: DIRECT CLICK MENU (+ 新增服務紀錄) - MANUAL ENTRY MODE ===
                sessionStorage.removeItem('crm_import_meeting'); // Clear old import state

                if (importNotice) {
                    importNotice.style.display = 'flex';
                    importNotice.style.background = '#ECFDF5';
                    importNotice.style.color = '#047857';
                    importNotice.style.border = '1px solid #A7F3D0';
                    importNotice.innerHTML = `✍️ <strong>手動新增模式：</strong> 請自行填寫以下服務紀錄欄位資訊（主題與個股可擇一填寫）。`;
                }

                // Clean empty fields for manual user key in
                document.getElementById('record-topic').value = '';
                const sNameInputManual = document.getElementById('record-service-name');
                if (sNameInputManual) sNameInputManual.value = '';
                document.getElementById('record-interest').value = '';
                document.getElementById('record-date').value = '2026-09-08';
                document.getElementById('record-time').value = '10:00';
                document.getElementById('record-duration').value = '30';
                document.getElementById('record-format').value = '1x1';
                document.getElementById('record-type').value = 'One off client meeting';
                document.getElementById('record-method').value = 'In Person';
                if (!recordFirmSelector) recordFirmSelector = setupMultiSelectFirm('record');
                if (recordFirmSelector) recordFirmSelector.setFirms('FMR');

                if (!recordClientSelector) recordClientSelector = setupMultiSelectClient('record');
                if (recordClientSelector) recordClientSelector.setClients('Elizabeth Li');

                document.getElementById('record-sales').value = 'Charlie Zhao';
                document.getElementById('record-sales-trader').value = 'Jason Chang';
                if (!recordAnalystSelector) {
                    recordAnalystSelector = setupMultiSelectAnalyst('record');
                }
                if (recordAnalystSelector) {
                    recordAnalystSelector.setAnalysts('Sherman Shang', 'Sherman.shang@fubon.com');
                } else {
                    document.getElementById('record-analyst').value = 'Sherman Shang';
                    document.getElementById('record-analyst-email').value = 'Sherman.shang@fubon.com';
                }
                document.getElementById('record-email').value = '';
                document.getElementById('notes-textarea').value = '';
            }

            saveBtn.setAttribute('data-mode', 'new');
            saveBtn.removeAttribute('data-edit-id');
            updateFormHeaderTitle();
            if (typeof updateDynamicServiceName === 'function') updateDynamicServiceName();

            const followUpCheck = document.getElementById('record-followup');
            if (followUpCheck) {
                followUpCheck.checked = true;
            }
        }
    };

    const openNewServiceWithPreset = (preset = {}) => {
        try {
            window.history.replaceState(null, '', '#new-service');
        } catch (e) {}

        if (typeof applyHashTab === 'function') {
            applyHashTab('#new-service');
        }
        showFormView(false, null, true);

        if (preset.analyst) {
            if (!recordAnalystSelector) recordAnalystSelector = setupMultiSelectAnalyst('record');
            if (recordAnalystSelector) {
                recordAnalystSelector.setAnalysts(preset.analyst, preset.analystEmail || '');
            } else {
                const aEl = document.getElementById('record-analyst');
                if (aEl) aEl.value = preset.analyst;
                const aeEl = document.getElementById('record-analyst-email');
                if (aeEl) aeEl.value = preset.analystEmail || '';
            }
        }
        if (preset.firm) {
            if (!recordFirmSelector) recordFirmSelector = setupMultiSelectFirm('record');
            if (recordFirmSelector) {
                recordFirmSelector.setFirms(preset.firm);
            } else {
                const fEl = document.getElementById('record-firm');
                if (fEl) fEl.value = preset.firm;
            }
        }
        if (preset.client) {
            if (!recordClientSelector) recordClientSelector = setupMultiSelectClient('record');
            if (recordClientSelector) {
                recordClientSelector.setClients(preset.client);
            } else {
                const cEl = document.getElementById('record-client');
                if (cEl) cEl.value = preset.client;
            }
        }
        if (preset.email) {
            const emEl = document.getElementById('record-email');
            if (emEl) emEl.value = preset.email;
        }

        const importNotice = document.getElementById('import-from-home-notice');
        if (importNotice) {
            importNotice.style.display = 'flex';
            importNotice.style.background = '#E0F2FE';
            importNotice.style.color = '#0369A1';
            importNotice.style.border = '1px solid #BAE6FD';
            const label = preset.analyst ? `研究員「${preset.analyst}」` : (preset.firm ? `法人戶「${preset.firm}」` : (preset.client ? `客戶「${preset.client}」` : ''));
            importNotice.innerHTML = `✨ <strong>已為您預先帶入${label}：</strong> 請依需求填寫會議主題、日期及時間後，點擊「儲存紀錄」即可完成建立。`;
        }

        updateFormHeaderTitle();
        if (typeof updateDynamicServiceName === 'function') updateDynamicServiceName();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const showListView = (preferDetails = false) => {
        hideAllPanels();
        const targetList = document.getElementById('panel-records-list');
        if (targetList) {
            targetList.classList.add('active');
            targetList.style.display = 'block';

            const btnSummary = document.getElementById('btn-mode-summary');
            const btnDetails = document.getElementById('btn-mode-details');
            const summaryPanel = document.getElementById('summary-dashboard-panel');
            const detailsPanel = document.getElementById('details-list-panel');

            if (preferDetails) {
                if (btnSummary) {
                    btnSummary.classList.remove('active');
                    btnSummary.style.background = 'white';
                    btnSummary.style.color = '#374151';
                }
                if (btnDetails) {
                    btnDetails.classList.add('active');
                    btnDetails.style.background = '#5C8ED6';
                    btnDetails.style.color = 'white';
                }
                if (summaryPanel) {
                    summaryPanel.style.display = 'none';
                    summaryPanel.classList.remove('active');
                }
                if (detailsPanel) {
                    detailsPanel.style.display = 'flex';
                    detailsPanel.classList.add('active');
                }
            } else {
                if (btnSummary) {
                    btnSummary.classList.add('active');
                    btnSummary.style.background = '#5C8ED6';
                    btnSummary.style.color = 'white';
                }
                if (btnDetails) {
                    btnDetails.classList.remove('active');
                    btnDetails.style.background = 'white';
                    btnDetails.style.color = '#374151';
                }
                if (summaryPanel) {
                    summaryPanel.style.display = 'flex';
                    summaryPanel.classList.add('active');
                }
                if (detailsPanel) {
                    detailsPanel.style.display = 'none';
                    detailsPanel.classList.remove('active');
                }
            }
        }
    };

    if(btnNewRecord) btnNewRecord.addEventListener('click', () => {
        sessionStorage.removeItem('crm_import_meeting');
        showFormView(false, null, true); // forceManual = true
    });
    const tabNewServiceBtn = document.getElementById('tab-new-service-btn');
    if(tabNewServiceBtn) tabNewServiceBtn.addEventListener('click', () => {
        sessionStorage.removeItem('crm_import_meeting');
        showFormView(false, null, true); // forceManual = true
    });
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
        const serviceName = getServiceName(service);
        const drawerSNameEl = document.getElementById('drawer-detail-service-name');
        if (drawerSNameEl) drawerSNameEl.textContent = serviceName;
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
        document.getElementById('drawer-detail-duration').textContent = service.duration ? `${service.duration} 分鐘` : '';
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

    const viewPageDrawerBtn = document.getElementById('drawer-btn-view-page');
    if (viewPageDrawerBtn) {
        viewPageDrawerBtn.addEventListener('click', () => {
            if (activeDrawerRecordId) {
                const recId = activeDrawerRecordId;
                closeServiceDrawer();
                if (typeof showIndividualServiceRecordPage === 'function') {
                    showIndividualServiceRecordPage(recId);
                }
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
            const client = (typeof getAllClients === 'function' ? getAllClients() : DEFAULT_CLIENTS).find(c => c.name === name) || DEFAULT_CLIENTS.find(c => c.name === name);
            if (client) {
                showIndividualClientPage(client.id);
            } else {
                hideAllPanels();
                const clientPanel = document.getElementById('panel-detail-client');
                if (clientPanel) {
                    clientPanel.classList.add('active');
                    if (typeof renderClientDetailView === 'function') {
                        renderClientDetailView(name);
                    }
                }
            }
        }



        // Topic/Form Link -> Open Single Service Record Page
        if (target.classList.contains('trigger-form')) {
            e.preventDefault();
            e.stopPropagation();
            const row = target.closest('tr');
            const recordId = row ? row.getAttribute('data-id') : null;
            if (recordId && typeof showIndividualServiceRecordPage === 'function') {
                showIndividualServiceRecordPage(recordId);
            } else {
                openServiceDrawer(recordId);
            }
        }

        // Back to Client Overview
        if (target.classList.contains('trigger-client-overview') || target.classList.contains('back-to-list-btn') || target.closest('.back-to-list-btn')) {
            e.preventDefault();
            const clientTab = document.querySelector('[data-target="panel-clients"]');
            if (clientTab) clientTab.click();
        }

        // Back to Researcher Overview
        if (target.classList.contains('trigger-researcher-overview') || target.classList.contains('back-to-researcher-list-btn') || target.closest('.back-to-researcher-list-btn')) {
            e.preventDefault();
            const resTab = document.querySelector('[data-target="panel-researchers"]');
            if (resTab) resTab.click();
        }



        // Back to Service Records Overview
        if (target.classList.contains('trigger-service-overview') || target.classList.contains('back-to-service-list-btn') || target.closest('.back-to-service-list-btn')) {
            e.preventDefault();
            const serviceTab = document.querySelector('[data-target="panel-services"]');
            if (serviceTab) serviceTab.click();
        }
    });

    document.querySelectorAll('.back-to-list-btn').forEach(btn => {
        btn.addEventListener('click', showListView);
    });

    // Populate Interaction Tables for Drill-down panels by cloning the main table
    const mainTable = document.querySelector('#panel-records-list .data-table');
    if(mainTable) {
        const wrappers = ['#researcher-interaction-table'];
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
    // Researcher Modal Logic (Dialog style) & Detail Drill-down
    // ----------------------------------------------------
    const researcherModal = document.getElementById('modal-manage-researcher');
    const btnAddResearcher = document.getElementById('btn-add-researcher');
    const btnCancelResearcher = document.getElementById('btn-cancel-researcher');
    const btnSaveResearcher = document.getElementById('btn-save-researcher');
    const btnCloseResearcherModal = document.getElementById('btn-close-researcher-modal');

    const openAnalystEditModal = (analystId = null) => {
        if (!researcherModal) return;
        
        const zhNameInput = document.getElementById('analyst-zh-name');
        const enNameInput = document.getElementById('analyst-en-name');
        const phoneInput = document.getElementById('analyst-phone');
        const emailInput = document.getElementById('analyst-email');
        const sectorInput = document.getElementById('analyst-sector');
        const coverageInput = document.getElementById('analyst-coverage');
        
        if (analystId) {
            // Edit mode
            const analyst = getAllAnalysts().find(a => a.id === analystId);
            if (analyst) {
                if (zhNameInput) zhNameInput.value = analyst.zhName || '';
                if (enNameInput) enNameInput.value = analyst.enName || '';
                if (phoneInput) phoneInput.value = analyst.phone || '';
                if (emailInput) emailInput.value = analyst.email || '';
                if (sectorInput) sectorInput.value = analyst.sector || '';
                if (coverageInput) coverageInput.value = analyst.coverage || '';
                if (btnSaveResearcher) {
                    btnSaveResearcher.setAttribute('data-mode', 'edit');
                    btnSaveResearcher.setAttribute('data-id', analystId);
                }
            }
        } else {
            // Add mode
            if (zhNameInput) zhNameInput.value = '';
            if (enNameInput) enNameInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (emailInput) emailInput.value = '';
            if (sectorInput) sectorInput.value = '';
            if (coverageInput) coverageInput.value = '';
            if (btnSaveResearcher) {
                btnSaveResearcher.setAttribute('data-mode', 'add');
                btnSaveResearcher.removeAttribute('data-id');
            }
        }
        
        researcherModal.classList.add('show');
    };

    const closeResearcherModal = () => {
        if (researcherModal) researcherModal.classList.remove('show');
    };

    if (btnAddResearcher) btnAddResearcher.addEventListener('click', () => openAnalystEditModal(null));
    const btnAddResearcherTop = document.getElementById('btn-add-researcher-top');
    if (btnAddResearcherTop) btnAddResearcherTop.addEventListener('click', () => openAnalystEditModal(null));
    if (btnCancelResearcher) btnCancelResearcher.addEventListener('click', closeResearcherModal);
    if (btnCloseResearcherModal) btnCloseResearcherModal.addEventListener('click', closeResearcherModal);
    if (researcherModal) {
        researcherModal.addEventListener('click', (e) => {
            if (e.target === researcherModal) closeResearcherModal();
        });
    }

    if (btnSaveResearcher) btnSaveResearcher.addEventListener('click', () => {
        const mode = btnSaveResearcher.getAttribute('data-mode');
        const zhName = document.getElementById('analyst-zh-name')?.value.trim() || '';
        const enName = document.getElementById('analyst-en-name')?.value.trim() || '';
        const phone = document.getElementById('analyst-phone')?.value.trim() || '';
        const email = document.getElementById('analyst-email')?.value.trim() || '';
        const sector = document.getElementById('analyst-sector')?.value.trim() || '';
        const coverage = document.getElementById('analyst-coverage')?.value.trim() || 'General';

        if (!zhName && !enName) {
            alert('請至少填寫中文或英文姓名');
            return;
        }

        if (mode === 'edit') {
            const analystId = btnSaveResearcher.getAttribute('data-id');
            const index = customAnalysts.findIndex(a => a.id === analystId);
            if (index > -1) {
                customAnalysts[index] = { id: analystId, zhName, enName, phone, email, sector, coverage };
            } else {
                const defaultIdx = DEFAULT_ANALYSTS.findIndex(a => a.id === analystId);
                if (defaultIdx > -1) {
                    DEFAULT_ANALYSTS[defaultIdx] = { id: analystId, zhName, enName, phone, email, sector, coverage };
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
                coverage
            };
            customAnalysts.unshift(newAnalyst);
            alert('✅ 新增研究員成功！已加入研究員列表頂端。');
        }

        localStorage.setItem('crm_custom_analysts', JSON.stringify(customAnalysts));
        closeResearcherModal();
        refreshAnalystTable();
    });

    
    const analystSearchInputEl = document.getElementById('analyst-search-input');
    if (analystSearchInputEl) {
        analystSearchInputEl.addEventListener('input', () => {
            refreshAnalystTable();
        });
    }

    const refreshAnalystTable = () => {
        const tableBody = document.getElementById('analyst-table-body');
        if (!tableBody) return;
        
        const filterStartInput = document.getElementById('analyst-filter-start');
        const filterEndInput = document.getElementById('analyst-filter-end');

        // Initialize default date range: past 1 month from latest record date
        if (filterStartInput && filterEndInput && (!filterStartInput.value || !filterEndInput.value)) {
            const allServices = getAllServices();
            let latestDate = new Date('2026-06-30');
            if (allServices.length > 0) {
                const timestamps = allServices.map(s => {
                    const d = s.date ? new Date(s.date.replace(/\//g, '-')).getTime() : 0;
                    return isNaN(d) ? 0 : d;
                }).filter(t => t > 0);
                if (timestamps.length > 0) {
                    latestDate = new Date(Math.max(...timestamps));
                }
            }
            const pastMonthDate = new Date(latestDate);
            pastMonthDate.setDate(pastMonthDate.getDate() - 30);
            
            filterEndInput.value = latestDate.toISOString().split('T')[0];
            filterStartInput.value = pastMonthDate.toISOString().split('T')[0];
        }
        
        const filterStartVal = filterStartInput ? filterStartInput.value : '';
        const filterEndVal = filterEndInput ? filterEndInput.value : '';
        
        const startDate = filterStartVal ? new Date(filterStartVal) : new Date('2000-01-01');
        const endDate = filterEndVal ? new Date(filterEndVal + 'T23:59:59') : new Date('2099-12-31');
        
        const services = getAllServices().filter(s => {
            const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
            return sDate >= startDate && sDate <= endDate;
        });
        
        const analystSearchInput = document.getElementById('analyst-search-input');
        const analystSearchVal = analystSearchInput ? analystSearchInput.value.trim().toLowerCase() : '';

        const analysts = getAllAnalysts()
            .filter(a => {
                if (!analystSearchVal) return true;
                const zh = (a.zhName || '').toLowerCase();
                const en = (a.enName || '').toLowerCase();
                const sec = (a.sector || '').toLowerCase();
                return zh.includes(analystSearchVal) || en.includes(analystSearchVal) || sec.includes(analystSearchVal);
            })
            .sort((a, b) => {
                const aInCustom = customAnalysts.some(c => c.id === a.id);
                const bInCustom = customAnalysts.some(c => c.id === b.id);
                if (aInCustom && !bInCustom) return -1;
                if (!aInCustom && bInCustom) return 1;
                return compareNames(a.zhName || a.enName, b.zhName || b.enName);
            });

        let totalCount = 0;
        let totalMinutesAll = 0;
        let rowsHTML = '';
        
        const analystStats = analysts.map(analyst => {
            const matchingServices = services.filter(s => {
                const sName = (s.analyst || '').toLowerCase();
                const en = (analyst.enName || '').toLowerCase();
                const zh = (analyst.zhName || '').toLowerCase();
                return (en && sName.includes(en)) || (zh && sName.includes(zh));
            });
            
            const count = matchingServices.length;
            const minutes = matchingServices.reduce((sum, s) => sum + (parseFloat(s.duration || 0)), 0);
            const totalMin = Math.round(minutes);
            
            totalCount += count;
            totalMinutesAll += minutes;
            
            return {
                ...analyst,
                count,
                duration: `${totalMin} min`
            };
        });
        
        const totalOverallMinutes = Math.round(totalMinutesAll);
        
        rowsHTML += `
        <tr style="background-color: var(--bg-hover); font-weight: bold;">
            <td>總計</td>
            <td></td><td></td><td></td><td></td>
            <td>${totalCount}</td>
            <td>${totalOverallMinutes} min</td>
            <td></td>
        </tr>`;
        
        analystStats.forEach(a => {
            const isCustom = customAnalysts.some(x => x.id === a.id);
            rowsHTML += `
            <tr data-id="${a.id}" style="${isCustom ? 'background-color: #f0fdf4;' : ''}">
                <td><span class="text-link trigger-researcher-detail" style="font-weight: 600; cursor: pointer; color: #1976D2;">${a.zhName}</span>${isCustom ? ' <span style="background:#DCFCE7; color:#166534; font-size:11px; font-weight:700; padding:1px 6px; border-radius:10px; border:1px solid #BBF7D0; margin-left:4px;">新建立</span>' : ''}</td>
                <td>${a.enName}</td>
                <td>${a.phone}</td>
                <td>${a.email || ''}</td>
                <td>${a.sector || ''}</td>
                <td>${a.count}</td>
                <td>${a.duration}</td>
                <td style="text-align: center;"><button class="edit-researcher-btn" data-id="${a.id}" style="background:transparent; border:none; cursor:pointer; font-size: 16px;" title="編輯">📝</button></td>
            </tr>`;
        });
        
        tableBody.innerHTML = rowsHTML;
        
        // Bind 📝 edit button on rows
        tableBody.querySelectorAll('.edit-researcher-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const analystId = btn.getAttribute('data-id');
                if (analystId) openAnalystEditModal(analystId);
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
            `🔬 研究員: ${analyst.zhName}`, 
            `Analyst: ${analyst.enName}`, 
            'panel-detail-researcher',
            (panel) => {
                // Breadcrumb & Back button
                const bName = panel.querySelector('#researcher-breadcrumb-name');
                if (bName) bName.textContent = `🔬 單一研究員專頁 (${analyst.zhName} ${analyst.enName})`;
                const backBtn = panel.querySelector('.back-to-researcher-list-btn') || panel.querySelector('.back-to-list-btn');
                if (backBtn) {
                    backBtn.onclick = (e) => {
                        e.preventDefault();
                        const tab = document.querySelector('[data-target="panel-researchers"]');
                        if (tab) tab.click();
                    };
                }
                const bOverview = panel.querySelector('.trigger-researcher-overview');
                if (bOverview) {
                    bOverview.onclick = (e) => {
                        e.preventDefault();
                        const tab = document.querySelector('[data-target="panel-researchers"]');
                        if (tab) tab.click();
                    };
                }

                // Populate card
                const nameEl = panel.querySelector('h2');
                if (nameEl) nameEl.textContent = `${analyst.zhName} (${analyst.enName})`;
                const cardDetails = panel.querySelector('.profile-header-card');
                if (cardDetails) {
                    cardDetails.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <div style="display:flex; align-items:center; gap:12px; margin-bottom: 16px;">
                                    <h2 style="font-size: 28px; margin: 0; color: var(--text-main);">${analyst.zhName} ${analyst.enName}</h2>
                                    <span class="role-badge analyst-badge" style="background: #E0F2FE; color: #0284c7; border: 1px solid #BAE6FD; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">🔬 研究員 Analyst</span>
                                </div>
                                <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 24px; font-size: 14px;">
                                    <div style="color: var(--text-muted);">email</div><div><span class="text-link">${analyst.email || '未設定'}</span></div>
                                    <div style="color: var(--text-muted);">Coverage</div><div>${analyst.coverage || 'General'}</div>
                                    <div style="color: var(--text-muted);">連絡電話 tel</div><div>${analyst.phone || '未設定'}</div>
                                    <div style="color: var(--text-muted);">負責產業</div><div>${analyst.sector || '未設定'}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                                <button type="button" class="btn btn-secondary btn-edit-analyst-dyn" data-analyst-id="${analyst.id}" style="font-size: 13px; padding: 7px 14px; background-color: white; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; color: #334155; display: inline-flex; align-items: center; gap: 4px;">✏️ 編輯資料</button>
                                <button type="button" class="btn btn-primary btn-add-service-shortcut-analyst" data-analyst-name="${analyst.zhName} ${analyst.enName}" data-analyst-email="${analyst.email || ''}" style="font-size: 13px; padding: 7px 14px; background-color: #0284c7; border: 1px solid #0284c7; border-radius: 4px; color: #fff; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">➕ 新增此研究員之服務紀錄</button>
                                <button class="btn btn-primary btn-reserve-researcher-dyn" data-analyst-id="${analyst.id}" style="font-size: 13px; padding: 7px 20px; background-color: #4A90E2; border-color: #4A90E2; display: flex; align-items: center; gap: 8px;">預約</button>
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
                    
                    const parentStart = document.getElementById('analyst-filter-start')?.value;
                    const parentEnd = document.getElementById('analyst-filter-end')?.value;
                    if (detailStart && parentStart) detailStart.value = parentStart;
                    if (detailEnd && parentEnd) detailEnd.value = parentEnd;

                    const renderLocalList = () => {
                        const startVal = detailStart ? detailStart.value : '';
                        const endVal = detailEnd ? detailEnd.value : '';
                        const startDate = startVal ? new Date(startVal) : new Date('2000-01-01');
                        const endDate = endVal ? new Date(endVal + 'T23:59:59') : new Date('2099-12-31');

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
                                    <th style="line-height: 1.2;">日期<br><span style="font-size:11px; font-weight:normal; color:#666;">Date</span></th>
                                    <th style="line-height: 1.2;">營業員<br><span style="font-size:11px; font-weight:normal; color:#666;">Sales</span></th>
                                    <th style="line-height: 1.2;">法人戶<br><span style="font-size:11px; font-weight:normal; color:#666;">Firm</span></th>
                                    <th style="line-height: 1.2;">客戶<br><span style="font-size:11px; font-weight:normal; color:#666;">Client</span></th>
                                    <th style="line-height: 1.2;">互動類型<br><span style="font-size:11px; font-weight:normal; color:#666;">Interaction</span></th>
                                    <th style="line-height: 1.2;">互動方法<br><span style="font-size:11px; font-weight:normal; color:#666;">method</span></th>
                                    <th style="line-height: 1.2;">時數<br><span style="font-size:11px; font-weight:normal; color:#666;">Duration (min)</span></th>
                                    <th style="line-height: 1.2;">人數<br><span style="font-size:11px; font-weight:normal; color:#666;">format</span></th>
                                    <th style="line-height: 1.2;">時間<br><span style="font-size:11px; font-weight:normal; color:#666;">Time(起)</span></th>
                                    <th style="line-height: 1.2;">Contact<br><span style="font-size:11px; font-weight:normal; color:#666;">(email)</span></th>
                                    <th style="line-height: 1.2;">主題<br><span style="font-size:11px; font-weight:normal; color:#666;">Topic/company</span></th>
                                    <th style="line-height: 1.2;">個股<br><span style="font-size:11px; font-weight:normal; color:#666;">Interest</span></th>
                                </tr>
                            </thead>
                            <tbody>`;
                        if (matchingServices.length === 0) {
                            tableHTML += `<tr><td colspan="12" style="text-align:center; color:#94a3b8; padding:24px;">無此時間區段之服務紀錄</td></tr>`;
                        } else {
                            matchingServices.forEach(s => {
                                tableHTML += `<tr>
                                    <td>${s.date}</td>
                                    <td>${s.sales || ''}</td>
                                    <td><span class="text-link trigger-firm" style="color: #1976D2; cursor: pointer; text-decoration: underline;">${s.firm || ''}</span></td>
                                    <td><span class="text-link trigger-client" style="color: #1976D2; cursor: pointer; text-decoration: underline;">${s.client || ''}</span></td>
                                    <td>${s.type || ''}</td>
                                    <td>${s.method || ''}</td>
                                    <td>${s.duration ? `${s.duration} min` : ''}</td>
                                    <td>${s.format || ''}</td>
                                    <td>${s.time || ''}</td>
                                    <td>${s.email ? `<span class="text-link" style="color: #1976D2;">${s.email}</span>` : ''}</td>
                                    <td><span class="text-link trigger-form" style="color: #1976D2; cursor: pointer;">${s.topic || ''}</span></td>
                                    <td>${s.interest || ''}</td>
                                </tr>`;
                            });
                        }
                        tableHTML += `</tbody></table>`;
                        interactionTable.innerHTML = tableHTML;
                    };
                    renderLocalList();
                    if (detailStart) detailStart.onchange = renderLocalList;
                    if (detailEnd) detailEnd.onchange = renderLocalList;
                }

                // Original back-to-list-btn handled above
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

    const getAnalystEmail = (analystName) => {
        if (!analystName) return 'Sherman.shang@fubon.com';
        const names = String(analystName).split(/[,;、]/).map(s => s.trim()).filter(Boolean);
        if (names.length <= 1) {
            const a = getAllAnalysts().find(x => analystName.toLowerCase().includes(x.enName.toLowerCase()) || (x.zhName && analystName.includes(x.zhName)));
            return a && a.email ? a.email : 'Sherman.shang@fubon.com';
        }
        return names.map(n => {
            const a = getAllAnalysts().find(x => n.toLowerCase().includes(x.enName.toLowerCase()) || (x.zhName && n.includes(x.zhName)));
            return a && a.email ? a.email : '';
        }).filter(Boolean).join('; ');
    };

    const DEFAULT_SALES = [
        { id: 'sales-1', zhName: '趙查理', enName: 'Charlie Zhao', phone: '852-1111-1111', email: 'charlie.zhao@fubon.com', group: '外資組', trader: 'Jason Chang' },
        { id: 'sales-2', zhName: '廖安安', enName: 'Ann Liao', phone: '852-2222-2222', email: 'ann.liao@fubon.com', group: '外資組', trader: 'Terry' },
        { id: 'sales-3', zhName: '李健', enName: 'Ken Lee', phone: '852-3333-3333', email: 'ken.lee@fubon.com', group: '外資組', trader: 'David Lin' }
    ];


    const refreshFirmTable = () => {
        const tableBody = document.getElementById('firm-table-body');
        if (!tableBody) return;

        const filterStartInput = document.getElementById('firm-filter-start');
        const filterEndInput = document.getElementById('firm-filter-end');
        const filterStartVal = filterStartInput ? filterStartInput.value : '';
        const filterEndVal = filterEndInput ? filterEndInput.value : '';
        const startDate = filterStartVal ? new Date(filterStartVal) : new Date('2000-01-01');
        const endDate = filterEndVal ? new Date(filterEndVal + 'T23:59:59') : new Date('2099-12-31');

        const searchInput = document.getElementById('firm-search-input');
        const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';

        const services = getAllServices().filter(s => {
            const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
            return sDate >= startDate && sDate <= endDate;
        });

        const allFirms = (typeof getAllFirms === 'function' ? getAllFirms() : DEFAULT_FIRMS)
            .filter(f => {
                if (!searchVal) return true;
                const name = (f.name || '').toLowerCase();
                const org = (f.org || '').toLowerCase();
                const cov = (f.coverage || '').toLowerCase();
                return name.includes(searchVal) || org.includes(searchVal) || cov.includes(searchVal);
            })
            .sort((a, b) => {
                const aInCustom = customFirms.some(c => c.id === a.id);
                const bInCustom = customFirms.some(c => c.id === b.id);
                if (aInCustom && !bInCustom) return -1;
                if (!aInCustom && bInCustom) return 1;
                return compareNames(a.name, b.name);
            });

        let totalCount = 0;
        let totalMinutes = 0;
        let rowsHTML = '';

        const firmStats = allFirms.map(firm => {
            const matchingServices = services.filter(s => (s.firm || '').split(/[,;、]/).map(x => x.trim().toLowerCase()).includes(firm.name.toLowerCase()));
            const count = matchingServices.length;
            const minutes = matchingServices.reduce((sum, s) => sum + parseFloat(s.duration || 0), 0);
            const formattedMinutes = Math.round(minutes);

            totalCount += count;
            totalMinutes += minutes;

            return { ...firm, count, hours: `${formattedMinutes} min` };
        });

        rowsHTML += `
        <tr style="background-color: var(--bg-hover); font-weight: bold;">
            <td>總計</td>
            <td></td><td></td><td></td><td></td><td></td>
            <td>${totalCount}</td>
            <td>${Math.round(totalMinutes)} min</td>
        </tr>`;

        if (firmStats.length === 0) {
            rowsHTML += `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 24px;">查無符合條件的法人戶資料</td></tr>`;
        } else {
            firmStats.forEach(f => {
                rowsHTML += `
                <tr data-id="${f.id}">
                    <td>${f.org || '外法'}</td>
                    <td><span class="text-link trigger-firm-detail-page" style="font-weight: 600; cursor: pointer; color: #0284c7; text-decoration: underline;">${f.name}</span></td>
                    <td>${f.coverage || ''}</td>
                    <td>${f.note1 || ''}</td>
                    <td>${f.note2 || ''}</td>
                    <td>${f.note3 || ''}</td>
                    <td>${f.count}</td>
                    <td>${f.hours}</td>
                </tr>`;
            });
        }

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

    // Bind keyword search event for firms
    const firmSearchInputEl = document.getElementById('firm-search-input');
    if (firmSearchInputEl) {
        firmSearchInputEl.addEventListener('input', () => {
            refreshFirmTable();
        });
    }

    // ----------------------------------------------------
    // Firm Modal Logic (Add & Edit)
    // ----------------------------------------------------
    const firmModal = document.getElementById('modal-manage-firm');
    const btnSaveFirm = document.getElementById('btn-save-firm');
    const btnCancelFirm = document.getElementById('btn-cancel-firm');
    const btnCloseFirmModal = document.getElementById('btn-close-firm-modal');
    const btnAddFirmTop = document.getElementById('btn-add-firm-top');
    const btnAddFirmPage = document.getElementById('btn-add-firm-page');

    const openFirmModal = (firmId = null) => {
        if (!firmModal) return;
        const titleEl = document.getElementById('firm-modal-title');
        const nameInput = document.getElementById('firm-modal-name');
        const orgInput = document.getElementById('firm-modal-org');
        const covInput = document.getElementById('firm-modal-coverage');
        const note1Input = document.getElementById('firm-modal-note1');
        const note2Input = document.getElementById('firm-modal-note2');
        const note3Input = document.getElementById('firm-modal-note3');

        if (firmId) {
            const allFirms = typeof getAllFirms === 'function' ? getAllFirms() : DEFAULT_FIRMS;
            const firm = allFirms.find(f => f.id === firmId || f.name === firmId);
            if (firm) {
                if (titleEl) titleEl.textContent = '法人戶資訊編輯';
                if (nameInput) nameInput.value = firm.name || '';
                if (orgInput) orgInput.value = firm.org || '外法';
                if (covInput) covInput.value = firm.coverage || '';
                if (note1Input) note1Input.value = firm.note1 || '';
                if (note2Input) note2Input.value = firm.note2 || '';
                if (note3Input) note3Input.value = firm.note3 || '';
                if (btnSaveFirm) {
                    btnSaveFirm.setAttribute('data-mode', 'edit');
                    btnSaveFirm.setAttribute('data-id', firm.id);
                }
            }
        } else {
            if (titleEl) titleEl.textContent = '新增法人戶';
            if (nameInput) nameInput.value = '';
            if (orgInput) orgInput.value = '外法';
            if (covInput) covInput.value = '';
            if (note1Input) note1Input.value = '';
            if (note2Input) note2Input.value = '';
            if (note3Input) note3Input.value = '';
            if (btnSaveFirm) {
                btnSaveFirm.setAttribute('data-mode', 'new');
                btnSaveFirm.removeAttribute('data-id');
            }
        }

        firmModal.style.display = 'flex';
        firmModal.classList.add('show');
        setTimeout(() => nameInput?.focus(), 100);
    };

    const closeFirmModal = () => {
        if (firmModal) {
            firmModal.classList.remove('show');
            firmModal.style.display = 'none';
        }
    };

    if (btnCloseFirmModal) btnCloseFirmModal.addEventListener('click', closeFirmModal);
    if (btnCancelFirm) btnCancelFirm.addEventListener('click', closeFirmModal);
    if (btnAddFirmTop) btnAddFirmTop.addEventListener('click', () => openFirmModal(null));
    if (btnAddFirmPage) btnAddFirmPage.addEventListener('click', () => openFirmModal(null));
    if (firmModal) {
        firmModal.addEventListener('click', (e) => {
            if (e.target === firmModal) closeFirmModal();
        });
    }

    if (btnSaveFirm) {
        btnSaveFirm.addEventListener('click', () => {
            const mode = btnSaveFirm.getAttribute('data-mode') || 'new';
            const name = document.getElementById('firm-modal-name')?.value.trim() || '';
            const org = document.getElementById('firm-modal-org')?.value || '外法';
            const coverage = document.getElementById('firm-modal-coverage')?.value.trim() || '';
            const note1 = document.getElementById('firm-modal-note1')?.value.trim() || '';
            const note2 = document.getElementById('firm-modal-note2')?.value.trim() || '';
            const note3 = document.getElementById('firm-modal-note3')?.value.trim() || '';

            if (!name) {
                alert('請填寫法人戶名稱！');
                return;
            }

            if (mode === 'edit') {
                const firmId = btnSaveFirm.getAttribute('data-id');
                const customIdx = customFirms.findIndex(f => f.id === firmId);
                if (customIdx > -1) {
                    customFirms[customIdx] = { ...customFirms[customIdx], name, org, coverage, note1, note2, note3 };
                } else {
                    const defIdx = DEFAULT_FIRMS.findIndex(f => f.id === firmId);
                    if (defIdx > -1) {
                        DEFAULT_FIRMS[defIdx] = { ...DEFAULT_FIRMS[defIdx], name, org, coverage, note1, note2, note3 };
                    } else {
                        customFirms.push({ id: firmId, name, org, coverage, note1, note2, note3 });
                    }
                }
                alert('✅ 法人戶資訊已成功更新！');
            } else {
                const newFirm = {
                    id: 'firm-custom-' + Date.now(),
                    name, org, coverage, note1, note2, note3
                };
                customFirms.unshift(newFirm);
                alert('✅ 新增法人戶成功！已加入法人戶列表頂端。');
            }

            localStorage.setItem('crm_custom_firms', JSON.stringify(customFirms));
            closeFirmModal();
            refreshFirmTable();

            // Refresh firm page selector if present
            const selector = document.getElementById('firm-page-selector');
            if (selector) {
                const existing = Array.from(selector.options).map(o => o.value);
                if (!existing.includes(name)) {
                    const opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = `${name} (${org})`;
                    selector.appendChild(opt);
                }
            }
        });
    }

    // ----------------------------------------------------
    // Client Modal Logic (Edit and Add)
    // ----------------------------------------------------
    const clientModal = document.getElementById('client-modal');
    const btnSaveClient = document.getElementById('btn-save-client');
    const btnCancelClient = document.getElementById('btn-cancel-client');
    const btnCloseClientModal = document.getElementById('btn-close-client-modal');
    const btnAddClientPage = document.getElementById('btn-add-client-page');
    const btnAddClientTop = document.getElementById('btn-add-client-top');

    const openClientModal = (clientId = null) => {
        if (!clientModal) return;
        const titleEl = document.getElementById('client-modal-title-text');
        const nameInput = document.getElementById('client-modal-name');
        const firmInput = document.getElementById('client-modal-firm');
        const phoneInput = document.getElementById('client-modal-phone');
        const emailInput = document.getElementById('client-modal-email');
        const regionInput = document.getElementById('client-modal-region');
        const titleInput = document.getElementById('client-modal-title');
        const salesInput = document.getElementById('client-modal-sales');
        const traderInput = document.getElementById('client-modal-trader');

        if (clientId) {
            const client = (typeof getAllClients === 'function' ? getAllClients() : DEFAULT_CLIENTS).find(c => c.id === clientId || c.name === clientId) || DEFAULT_CLIENTS.find(c => c.id === clientId || c.name === clientId) || DEFAULT_CLIENTS[0];
            if (client) {
                if (titleEl) titleEl.textContent = '客戶資訊編輯';
                if (nameInput) nameInput.value = client.name || '';
                if (firmInput) firmInput.value = client.firm || '';
                if (phoneInput) phoneInput.value = client.phone || '968-888-888';
                if (emailInput) emailInput.value = client.email || 'ccc@fubon.com';
                if (regionInput) regionInput.value = client.region || 'HK';
                if (titleInput) titleInput.value = client.title || 'EM generalist';
                if (salesInput) salesInput.value = client.sales || 'Charlie Zhao';
                if (traderInput) traderInput.value = client.trader || 'Jason Chang';
                if (btnSaveClient) {
                    btnSaveClient.setAttribute('data-mode', 'edit');
                    btnSaveClient.setAttribute('data-id', client.id);
                }
            }
        } else {
            if (titleEl) titleEl.textContent = '新增客戶';
            if (nameInput) nameInput.value = '';
            if (firmInput) firmInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (emailInput) emailInput.value = '';
            if (regionInput) regionInput.value = '';
            if (titleInput) titleInput.value = '';
            if (salesInput) salesInput.value = 'Charlie Zhao';
            if (traderInput) traderInput.value = 'Jason Chang';
            if (btnSaveClient) {
                btnSaveClient.setAttribute('data-mode', 'new');
                btnSaveClient.removeAttribute('data-id');
            }
        }
        clientModal.style.display = 'flex';
        clientModal.style.zIndex = '99999';
        clientModal.classList.add('show');
    };

    const closeClientModal = () => {
        if (clientModal) {
            clientModal.classList.remove('show');
            clientModal.style.display = 'none';
        }
    };

    if (btnCloseClientModal) btnCloseClientModal.addEventListener('click', closeClientModal);
    if (btnCancelClient) btnCancelClient.addEventListener('click', closeClientModal);
    if (btnAddClientPage) btnAddClientPage.addEventListener('click', () => openClientModal(null));
    if (btnAddClientTop) btnAddClientTop.addEventListener('click', () => openClientModal(null));
    if (clientModal) {
        clientModal.addEventListener('click', (e) => {
            if (e.target === clientModal) closeClientModal();
        });
    }

    // Global event delegation for all Researcher, Firm, Client Edit & New Service shortcut buttons
    document.body.addEventListener('click', (e) => {
        // 1. Client Edit
        const editClientBtn = e.target.closest('.btn-edit-client-dyn') || e.target.closest('.edit-client-btn');
        if (editClientBtn) {
            e.preventDefault();
            e.stopPropagation();
            const clientId = editClientBtn.getAttribute('data-id') || 'client-1';
            openClientModal(clientId);
            return;
        }

        // 2. Analyst Edit
        const editAnalystBtn = e.target.closest('.btn-edit-analyst-dyn') || e.target.closest('.edit-analyst-btn');
        if (editAnalystBtn) {
            e.preventDefault();
            e.stopPropagation();
            const analystId = editAnalystBtn.getAttribute('data-analyst-id') || editAnalystBtn.getAttribute('data-id');
            openAnalystEditModal(analystId);
            return;
        }

        // 3. Firm Edit
        const editFirmBtn = e.target.closest('.btn-edit-firm-dyn') || e.target.closest('.edit-firm-btn');
        if (editFirmBtn) {
            e.preventDefault();
            e.stopPropagation();
            const firmId = editFirmBtn.getAttribute('data-firm-id') || editFirmBtn.getAttribute('data-id') || document.getElementById('firm-detail-name')?.textContent?.trim() || 'FMR';
            openFirmModal(firmId);
            return;
        }

        // 4. Shortcut: New service record for Analyst
        const shortcutAnalystBtn = e.target.closest('.btn-add-service-shortcut-analyst');
        if (shortcutAnalystBtn) {
            e.preventDefault();
            e.stopPropagation();
            const name = shortcutAnalystBtn.getAttribute('data-analyst-name') || document.getElementById('researcher-detail-name')?.textContent?.trim() || 'Sherman Shang';
            const email = shortcutAnalystBtn.getAttribute('data-analyst-email') || '';
            openNewServiceWithPreset({ analyst: name, analystEmail: email });
            return;
        }

        // 5. Shortcut: New service record for Firm
        const shortcutFirmBtn = e.target.closest('.btn-add-service-shortcut-firm');
        if (shortcutFirmBtn) {
            e.preventDefault();
            e.stopPropagation();
            const name = shortcutFirmBtn.getAttribute('data-firm-name') || document.getElementById('firm-detail-name')?.textContent?.trim() || document.getElementById('firm-page-selector')?.value || 'FMR';
            openNewServiceWithPreset({ firm: name });
            return;
        }

        // 6. Shortcut: New service record for Client
        const shortcutClientBtn = e.target.closest('.btn-add-service-shortcut-client');
        if (shortcutClientBtn) {
            e.preventDefault();
            e.stopPropagation();
            const name = shortcutClientBtn.getAttribute('data-client-name') || document.getElementById('client-detail-name')?.textContent?.trim() || 'Elizabeth Li';
            const email = shortcutClientBtn.getAttribute('data-client-email') || document.getElementById('client-field-email')?.textContent?.trim() || '';
            const firm = shortcutClientBtn.getAttribute('data-client-firm') || document.getElementById('client-field-firm')?.textContent?.trim() || '';
            openNewServiceWithPreset({ client: name, email: email, firm: firm });
            return;
        }
    });

    if (btnSaveClient) {
        btnSaveClient.addEventListener('click', () => {
            const mode = btnSaveClient.getAttribute('data-mode') || 'new';
            const name = document.getElementById('client-modal-name')?.value.trim() || '';
            const firm = document.getElementById('client-modal-firm')?.value.trim() || '';
            const phone = document.getElementById('client-modal-phone')?.value.trim() || '';
            const email = document.getElementById('client-modal-email')?.value.trim() || '';
            const region = document.getElementById('client-modal-region')?.value.trim() || '';
            const title = document.getElementById('client-modal-title')?.value.trim() || '';
            const sales = document.getElementById('client-modal-sales')?.value.trim() || 'Charlie Zhao';
            const trader = document.getElementById('client-modal-trader')?.value.trim() || 'Jason Chang';

            if (!name) {
                alert('請填寫客戶姓名！');
                return;
            }

            if (mode === 'edit') {
                const clientId = btnSaveClient.getAttribute('data-id');
                const customIdx = customClients.findIndex(c => c.id === clientId);
                if (customIdx > -1) {
                    customClients[customIdx] = {
                        ...customClients[customIdx],
                        name, firm, phone, email, region, title, sales, trader
                    };
                } else {
                    const defIdx = DEFAULT_CLIENTS.findIndex(c => c.id === clientId);
                    if (defIdx > -1) {
                        DEFAULT_CLIENTS[defIdx] = {
                            ...DEFAULT_CLIENTS[defIdx],
                            name, firm, phone, email, region, title, sales, trader
                        };
                    } else {
                        customClients.push({
                            id: clientId,
                            name, firm, phone, email, region, title,
                            sales, trader,
                            baseCount: 0, baseDuration: 0
                        });
                    }
                }
                alert('✅ 客戶資訊已成功更新！');
            } else {
                const newClient = {
                    id: 'client-custom-' + Date.now(),
                    name, firm, phone, email, region, title,
                    sales, trader,
                    baseCount: 0, baseDuration: 0
                };
                customClients.unshift(newClient);
                alert('✅ 新增客戶成功！已加入客戶列表頂端。');
            }

            localStorage.setItem('crm_custom_clients', JSON.stringify(customClients));
            closeClientModal();
            refreshClientTable();

            // Refresh open single client detail views
            if (typeof renderClientDetailView === 'function') {
                renderClientDetailView(name);
                document.querySelectorAll('[id^="dynamic-panel-client-"]').forEach(dynPanel => {
                    renderClientDetailView(name, dynPanel);
                });
            }
        });
    }

    const renderFirmDetailView = (firmName = 'FMR') => {
        const allFirms = typeof getAllFirms === 'function' ? getAllFirms() : DEFAULT_FIRMS;
        const firm = allFirms.find(f => f.name === firmName || f.id === firmName) || DEFAULT_FIRMS.find(f => f.name === firmName || f.id === firmName) || allFirms[0];
        const panel = document.getElementById('panel-detail-firm');
        if (!panel) return;

        // Update selector value
        const selector = panel.querySelector('#firm-page-selector');
        if (selector && selector.value !== firm.name) {
            selector.value = firm.name;
        }

        const nameEl = panel.querySelector('#firm-detail-name');
        if (nameEl) nameEl.textContent = firm.name;

        const btnEditFirm = panel.querySelector('.btn-edit-firm-dyn');
        if (btnEditFirm) {
            btnEditFirm.setAttribute('data-firm-id', firm.id || firm.name);
            btnEditFirm.setAttribute('data-firm-name', firm.name);
        }
        const btnAddServiceFirm = panel.querySelector('.btn-add-service-shortcut-firm');
        if (btnAddServiceFirm) {
            btnAddServiceFirm.setAttribute('data-firm-name', firm.name);
        }

        const orgEl = panel.querySelector('#firm-field-org');
        if (orgEl) orgEl.textContent = firm.org;

        const covEl = panel.querySelector('#firm-field-coverage');
        if (covEl) covEl.innerHTML = `<span class="tag" style="background:#F1F5F9; border:1px solid #CBD5E1; padding:2px 8px; border-radius:4px;">${firm.coverage}</span>`;

        const repEl = panel.querySelector('#firm-field-sales-rep');
        if (repEl) repEl.innerHTML = `<span class="tag" style="background:#F1F5F9; border:1px solid #CBD5E1; padding:2px 8px; border-radius:4px;">王O興</span>`; // 業務營業員：王O興

        const n1El = panel.querySelector('#firm-field-note1');
        if (n1El) {
            const tags = firm.note1.split(',').map(t => `<span class="tag" style="background:#F1F5F9; border:1px solid #CBD5E1; padding:2px 8px; border-radius:4px;">${t.trim()}</span>`).join(' ');
            n1El.innerHTML = tags;
        }

        const n2El = panel.querySelector('#firm-field-note2');
        if (n2El) n2El.innerHTML = `<span class="tag" style="background:#F1F5F9; border:1px solid #CBD5E1; padding:2px 8px; border-radius:4px;">${firm.note2}</span>`;

        const n3El = panel.querySelector('#firm-field-note3');
        if (n3El) n3El.innerHTML = `<span class="tag" style="border:1px dashed #94A3B8; background:#F8FAFC; padding:2px 8px; border-radius:4px;">${firm.note3}</span>`;

        // Render dynamic table list of 14 columns interaction records
        const interactionTable = panel.querySelector('#firm-interaction-table');
        const detailStart = panel.querySelector('#firm-detail-filter-start');
        const detailEnd = panel.querySelector('#firm-detail-filter-end');

        if (interactionTable) {
            const renderLocalList = () => {
                const sVal = detailStart ? detailStart.value : '';
                const eVal = detailEnd ? detailEnd.value : '';
                const startDate = sVal ? new Date(sVal) : new Date('2000-01-01');
                const endDate = eVal ? new Date(eVal + 'T23:59:59') : new Date('2099-12-31');

                const allServices = getAllServices();
                const matchingServices = allServices.filter(s => {
                    const sFirms = (s.firm || '').split(/[,;、]/).map(x => x.trim().toLowerCase());
                    const tFirm = firm.name.toLowerCase();
                    const isSameFirm = sFirms.includes(tFirm) || (tFirm === 'fmr' && sFirms.includes('frm'));
                    if (!isSameFirm) return false;
                    const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
                    return sDate >= startDate && sDate <= endDate;
                });

                let tableHTML = `<table class="data-table" style="min-width: 100%;">
                    <thead>
                        <tr style="background:#5C8ED6; color:white;">
                            <th style="line-height: 1.2;">日期<br><span style="font-size:11px; font-weight:normal;">Date</span></th>
                            <th style="line-height: 1.2;">研究員<br><span style="font-size:11px; font-weight:normal;">Analyst</span></th>
                            <th style="line-height: 1.2;">營業員<br><span style="font-size:11px; font-weight:normal;">Sales</span></th>
                            <th style="line-height: 1.2;">法人戶<br><span style="font-size:11px; font-weight:normal;">Firm</span></th>
                            <th style="line-height: 1.2;">客戶<br><span style="font-size:11px; font-weight:normal;">Client</span></th>
                            <th style="line-height: 1.2;">互動類型<br><span style="font-size:11px; font-weight:normal;">Interaction</span></th>
                            <th style="line-height: 1.2;">互動方法<br><span style="font-size:11px; font-weight:normal;">method</span></th>
                            <th style="line-height: 1.2;">時數<br><span style="font-size:11px; font-weight:normal;">Duration (min)</span></th>
                            <th style="line-height: 1.2;">人數<br><span style="font-size:11px; font-weight:normal;">format</span></th>
                            <th style="line-height: 1.2;">時間<br><span style="font-size:11px; font-weight:normal;">Time</span></th>
                            <th style="line-height: 1.2;">Contact<br><span style="font-size:11px; font-weight:normal;">(email)</span></th>
                            <th style="line-height: 1.2;">主題<br><span style="font-size:11px; font-weight:normal;">Topic/company</span></th>
                            <th style="line-height: 1.2;">個股<br><span style="font-size:11px; font-weight:normal;">Interest</span></th>
                            <th style="line-height: 1.2;">研究員 email<br><span style="font-size:11px; font-weight:normal;">Analyst Email</span></th>
                        </tr>
                    </thead>
                    <tbody>`;
                if (matchingServices.length === 0) {
                    tableHTML += `<tr><td colspan="14" style="text-align:center; color:#94a3b8; padding:20px;">無服務紀錄</td></tr>`;
                } else {
                    matchingServices.forEach(s => {
                        const aEmail = s.analystEmail !== undefined && s.analystEmail !== '' ? s.analystEmail : (s.analyst ? getAnalystEmail(s.analyst) : '');
                        tableHTML += `<tr>
                            <td>${s.date}</td>
                            <td>${(s.analyst || '').split(/[,;、]/).map(x => x.trim()).filter(Boolean).map(name => `<span class="text-link trigger-researcher" style="color: #1976D2; cursor: pointer; text-decoration: underline; margin-right: 6px;">${name}</span>`).join('') || '—'}</td>
                            <td>${s.sales || ''}</td>
                            <td><span class="text-link trigger-firm" style="color: #1976D2; cursor: pointer; text-decoration: underline;">${s.firm}</span></td>
                            <td><span class="text-link trigger-client" style="color: #1976D2; cursor: pointer; text-decoration: underline;">${s.client}</span></td>
                            <td>${s.type || ''}</td>
                            <td>${s.method || ''}</td>
                            <td>${s.duration ? `${s.duration} min` : ''}</td>
                            <td>${s.format || ''}</td>
                            <td>${s.time || ''}</td>
                            <td>${s.email ? `<span class="text-link" style="color: #1976D2; text-decoration: underline;">${s.email}</span>` : ''}</td>
                            <td><span class="text-link trigger-form" style="color: #1976D2; cursor: pointer; text-decoration: underline;">${s.topic || ''}</span></td>
                            <td>${s.interest || ''}</td>
                            <td>${aEmail ? `<span class="text-link" style="color: #1976D2;">${aEmail}</span>` : ''}</td>
                        </tr>`;
                    });
                }
                tableHTML += `</tbody></table>`;
                interactionTable.innerHTML = tableHTML;
            };
            renderLocalList();
            if (detailStart) detailStart.onchange = renderLocalList;
            if (detailEnd) detailEnd.onchange = renderLocalList;
        }
    };

    const showIndividualFirmPage = (firmId) => {
        const allFirms = typeof getAllFirms === 'function' ? getAllFirms() : DEFAULT_FIRMS;
        const firm = allFirms.find(f => f.id === firmId || f.name === firmId) || allFirms[0];
        if (!firm) return;

        openInNewTab(
            `firm-${firm.id}`, 
            `🏢 法人: ${firm.name}`, 
            `Firm Detail`, 
            'panel-detail-firm',
            (panel) => {
                const bName = panel.querySelector('#firm-breadcrumb-name');
                if (bName) bName.textContent = `🏢 單一法人戶專頁 (${firm.name})`;
                const backBtn = panel.querySelector('.back-to-firm-list-btn');
                if (backBtn) {
                    backBtn.style.display = 'inline-flex';
                    backBtn.onclick = (e) => {
                        e.preventDefault();
                        const firmTab = document.querySelector('[data-target="panel-firms"]');
                        if (firmTab) firmTab.click();
                    };
                }
                const bOverview = panel.querySelector('.trigger-firm-overview');
                if (bOverview) {
                    bOverview.onclick = (e) => {
                        e.preventDefault();
                        const firmTab = document.querySelector('[data-target="panel-firms"]');
                        if (firmTab) firmTab.click();
                    };
                }
                renderFirmDetailView(firm.name, panel);
            }
        );
    };

    const firmPageSelector = document.getElementById('firm-page-selector');
    if (firmPageSelector) {
        firmPageSelector.addEventListener('change', (e) => {
            renderFirmDetailView(e.target.value);
        });
    }

    
    const clientSearchInputEl = document.getElementById('client-search-input');
    if (clientSearchInputEl) {
        clientSearchInputEl.addEventListener('input', () => {
            refreshClientTable();
        });
    }

    const refreshClientTable = () => {
        const tableBody = document.getElementById('client-table-body');
        if (!tableBody) return;

        const filterStartInput = document.getElementById('client-filter-start');
        const filterEndInput = document.getElementById('client-filter-end');
        const filterStartVal = filterStartInput ? filterStartInput.value : '';
        const filterEndVal = filterEndInput ? filterEndInput.value : '';
        const startDate = filterStartVal ? new Date(filterStartVal) : new Date('2000-01-01');
        const endDate = filterEndVal ? new Date(filterEndVal + 'T23:59:59') : new Date('2099-12-31');

        const services = getAllServices().filter(s => {
            const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
            return sDate >= startDate && sDate <= endDate;
        });

        const clientSearchInput = document.getElementById('client-search-input');
        const clientSearchVal = clientSearchInput ? clientSearchInput.value.trim().toLowerCase() : '';

        const allClients = getAllClients()
            .filter(c => {
                if (!clientSearchVal) return true;
                const name = (c.name || '').toLowerCase();
                const firm = (c.firm || '').toLowerCase();
                const title = (c.title || '').toLowerCase();
                return name.includes(clientSearchVal) || firm.includes(clientSearchVal) || title.includes(clientSearchVal);
            })
            .sort((a, b) => {
                const aInCustom = customClients.some(c => c.id === a.id);
                const bInCustom = customClients.some(c => c.id === b.id);
                if (aInCustom && !bInCustom) return -1;
                if (!aInCustom && bInCustom) return 1;
                return compareNames(a.name, b.name);
            });

        let totalCount = 0;
        let totalMinutes = 0;
        let rowsHTML = '';

        const clientStats = allClients.map(client => {
            const matchingServices = services.filter(s => (s.client || '').split(/[,;、]/).map(x => x.trim().toLowerCase()).includes(client.name.toLowerCase()));
            const count = (client.baseCount || 0) + matchingServices.length;
            const minutes = (client.baseDuration || 0) + matchingServices.reduce((sum, s) => sum + parseFloat(s.duration || 0), 0);
            const formattedMinutes = Math.round(minutes);

            totalCount += count;
            totalMinutes += minutes;

            return { ...client, count, hours: `${formattedMinutes} min` };
        });

        rowsHTML += `
        <tr style="background-color: var(--bg-hover); font-weight: bold;">
            <td>總計</td>
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            <td>${totalCount}</td>
            <td>${Math.round(totalMinutes)} min</td>
            <td></td>
        </tr>`;

        clientStats.forEach(c => {
            const isCustom = customClients.some(x => x.id === c.id);
            rowsHTML += `
            <tr data-id="${c.id}" style="${isCustom ? 'background-color: #f0fdf4;' : ''}">
                <td><span class="text-link trigger-client-detail-page" style="font-weight: 600; cursor: pointer; color: #1976D2;">${c.name}</span>${isCustom ? ' <span style="background:#DCFCE7; color:#166534; font-size:11px; font-weight:700; padding:1px 6px; border-radius:10px; border:1px solid #BBF7D0; margin-left:4px;">新建立</span>' : ''}</td>
                <td><span class="text-link trigger-firm" style="cursor: pointer; color: #1976D2;">${c.firm || ''}</span></td>
                <td>${c.title || ''}</td>
                <td><span class="text-link" style="color: #1976D2;">${c.email || ''}</span></td>
                <td>${c.phone || ''}</td>
                <td>${c.region || ''}</td>
                <td>${c.sales || ''}</td>
                <td>${c.trader || 'Jason Chang'}</td>
                <td>${c.count}</td>
                <td>${c.hours}</td>
                <td style="text-align: center;"><button class="edit-client-btn" data-id="${c.id}" style="background:transparent; border:none; cursor:pointer; font-size: 16px;" title="編輯">📝</button></td>
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

        // Bind 📝 edit buttons
        tableBody.querySelectorAll('.edit-client-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                openClientModal(id);
            });
        });
    };

    const renderClientDetailView = (clientParam = 'Elizabeth Li', targetPanel = null) => {
        const allClients = typeof getAllClients === 'function' ? getAllClients() : DEFAULT_CLIENTS;
        const client = allClients.find(c => c.name === clientParam || c.id === clientParam) 
            || DEFAULT_CLIENTS.find(c => c.name === clientParam || c.id === clientParam) 
            || DEFAULT_CLIENTS[0];
        
        const panel = targetPanel || document.getElementById('panel-detail-client');
        if (!panel) return;

        // Set name & data-id on edit button
        const nameEl = panel.querySelector('#client-detail-name') || panel.querySelector('h2');
        if (nameEl) nameEl.textContent = client.name;

        const editBtn = panel.querySelector('.btn-edit-client-dyn');
        if (editBtn) {
            editBtn.setAttribute('data-id', client.id);
        }

        const btnAddServiceClient = panel.querySelector('.btn-add-service-shortcut-client');
        if (btnAddServiceClient) {
            btnAddServiceClient.setAttribute('data-client-name', client.name);
            btnAddServiceClient.setAttribute('data-client-email', client.email || '');
            btnAddServiceClient.setAttribute('data-client-firm', client.firm || '');
        }

        const firmEl = panel.querySelector('#client-field-firm');
        if (firmEl) firmEl.textContent = client.firm || '';

        const emailEl = panel.querySelector('#client-field-email');
        if (emailEl) {
            emailEl.textContent = client.email || '';
        }

        const titleEl = panel.querySelector('#client-field-title');
        if (titleEl) titleEl.textContent = client.title || '';

        const phoneEl = panel.querySelector('#client-field-phone');
        if (phoneEl) phoneEl.textContent = client.phone || '968-888-888';

        const regionEl = panel.querySelector('#client-field-region');
        if (regionEl) regionEl.textContent = client.region || 'HK';

        const salesEl = panel.querySelector('#client-field-sales');
        if (salesEl) salesEl.textContent = client.sales || 'Charlie Zhao';

        const traderEl = panel.querySelector('#client-field-trader');
        if (traderEl) traderEl.textContent = client.trader || 'Jason Chang';

        // Update breadcrumb and back-to-list button
        const bName = panel.querySelector('#client-breadcrumb-name');
        if (bName) bName.textContent = `👤 單一客戶專頁 (${client.name})`;

        const backBtn = panel.querySelector('.back-to-list-btn');
        if (backBtn) {
            backBtn.style.display = 'inline-flex';
            backBtn.onclick = (e) => {
                e.preventDefault();
                const clientTab = document.querySelector('[data-target="panel-clients"]');
                if (clientTab) clientTab.click();
            };
        }
        const bOverview = panel.querySelector('.trigger-client-overview');
        if (bOverview) {
            bOverview.onclick = (e) => {
                e.preventDefault();
                const clientTab = document.querySelector('[data-target="panel-clients"]');
                if (clientTab) clientTab.click();
            };
        }

        // Render dynamic table list of 14 columns interaction records
        const interactionTable = panel.querySelector('#client-interaction-table') || panel.querySelector('.data-table-wrapper') || panel.querySelector('[id^="dyn-client-interaction-table"]');
        const detailStart = panel.querySelector('#client-detail-filter-start');
        const detailEnd = panel.querySelector('#client-detail-filter-end');

        if (interactionTable) {
            const renderLocalList = () => {
                const sVal = detailStart ? detailStart.value : '';
                const eVal = detailEnd ? detailEnd.value : '';
                const startDate = sVal ? new Date(sVal) : new Date('2000-01-01');
                const endDate = eVal ? new Date(eVal + 'T23:59:59') : new Date('2099-12-31');

                const allServices = typeof getAllServices === 'function' ? getAllServices() : DEFAULT_SERVICES;
                const matchingServices = allServices.filter(s => {
                    const sClients = (s.client || '').split(/[,;、]/).map(x => x.trim().toLowerCase());
                    if (!sClients.includes(client.name.toLowerCase())) return false;
                    const sDate = new Date(s.date ? s.date.replace(/\//g, '-') : '2026-06-30');
                    return sDate >= startDate && sDate <= endDate;
                });

                let tableHTML = `<table class="data-table" style="min-width: 100%;">
                    <thead>
                        <tr style="background:#5C8ED6; color:white;">
                            <th style="line-height: 1.2;">日期<br><span style="font-size:11px; font-weight:normal;">Date</span></th>
                            <th style="line-height: 1.2;">研究員<br><span style="font-size:11px; font-weight:normal;">Analyst</span></th>
                            <th style="line-height: 1.2;">營業員<br><span style="font-size:11px; font-weight:normal;">Sales</span></th>
                            <th style="line-height: 1.2;">法人戶<br><span style="font-size:11px; font-weight:normal;">Firm</span></th>
                            <th style="line-height: 1.2;">客戶<br><span style="font-size:11px; font-weight:normal;">Client</span></th>
                            <th style="line-height: 1.2;">互動類型<br><span style="font-size:11px; font-weight:normal;">Interaction</span></th>
                            <th style="line-height: 1.2;">互動方法<br><span style="font-size:11px; font-weight:normal;">method</span></th>
                            <th style="line-height: 1.2;">時數<br><span style="font-size:11px; font-weight:normal;">Duration (min)</span></th>
                            <th style="line-height: 1.2;">人數<br><span style="font-size:11px; font-weight:normal;">format</span></th>
                            <th style="line-height: 1.2;">時間<br><span style="font-size:11px; font-weight:normal;">Time</span></th>
                            <th style="line-height: 1.2;">Contact<br><span style="font-size:11px; font-weight:normal;">(email)</span></th>
                            <th style="line-height: 1.2;">主題<br><span style="font-size:11px; font-weight:normal;">Topic/company</span></th>
                            <th style="line-height: 1.2;">個股<br><span style="font-size:11px; font-weight:normal;">Interest</span></th>
                            <th style="line-height: 1.2;">研究員 email<br><span style="font-size:11px; font-weight:normal;">Analyst Email</span></th>
                        </tr>
                    </thead>
                    <tbody>`;
                if (matchingServices.length === 0) {
                    tableHTML += `<tr><td colspan="14" style="text-align:center; color:#94a3b8; padding:20px;">無服務紀錄</td></tr>`;
                } else {
                    matchingServices.forEach(s => {
                        const aEmail = typeof getAnalystEmail === 'function' ? getAnalystEmail(s.analyst) : (s.analystEmail || 'Sherman.shang@fubon.com');
                        tableHTML += `<tr>
                            <td>${s.date}</td>
                            <td>${(s.analyst || '').split(/[,;、]/).map(x => x.trim()).filter(Boolean).map(name => `<span class="text-link trigger-researcher" style="color: #1976D2; cursor: pointer; text-decoration: underline; margin-right: 6px;">${name}</span>`).join('') || '—'}</td>
                            <td>${s.sales || ''}</td>
                            <td><span class="text-link trigger-firm" style="color: #1976D2; cursor: pointer; text-decoration: underline;">${s.firm}</span></td>
                            <td><span class="text-link trigger-client" style="color: #1976D2; cursor: pointer; text-decoration: underline;">${s.client}</span></td>
                            <td>${s.type || ''}</td>
                            <td>${s.method || ''}</td>
                            <td>${s.duration ? `${s.duration} min` : ''}</td>
                            <td>${s.format || ''}</td>
                            <td>${s.time || ''}</td>
                            <td><span class="text-link" style="color: #1976D2;">${s.email || ''}</span></td>
                            <td><span class="text-link trigger-form" style="color: #1976D2; cursor: pointer;">${s.topic || ''}</span></td>
                            <td>${s.interest || ''}</td>
                            <td><span class="text-link" style="color: #1976D2;">${aEmail}</span></td>
                        </tr>`;
                    });
                }
                tableHTML += `</tbody></table>`;
                interactionTable.innerHTML = tableHTML;
            };
            renderLocalList();
            if (detailStart) detailStart.onchange = renderLocalList;
            if (detailEnd) detailEnd.onchange = renderLocalList;
        }
    };

    const showIndividualClientPage = (clientId) => {
        const client = (typeof getAllClients === 'function' ? getAllClients() : DEFAULT_CLIENTS).find(c => c.id === clientId || c.name === clientId) || DEFAULT_CLIENTS.find(c => c.id === clientId || c.name === clientId) || DEFAULT_CLIENTS[0];
        if (!client) return;

        openInNewTab(
            `client-${client.id}`, 
            `👤 客戶: ${client.name}`, 
            `Client Detail`, 
            'panel-detail-client',
            (panel) => {
                renderClientDetailView(client.name, panel);
                const backBtn = panel.querySelector('.back-to-list-btn');
                if (backBtn) {
                    backBtn.style.display = 'inline-flex';
                    backBtn.onclick = (e) => {
                        e.preventDefault();
                        const clientTab = document.querySelector('[data-target="panel-clients"]');
                        if (clientTab) clientTab.click();
                    };
                }
            }
        );
    };

    // ====================================================
    // Single Service Record Page & Interview Notes System
    // ====================================================

    const DEFAULT_INTERVIEW_NOTES = [
        {
            id: 'inote-1',
            serviceId: 'service-2025-1',
            serviceTopic: 'TSMC 2Q earnings',
            date: '2025-08-10',
            contact: 'Elizabeth Li (FMR)',
            title: 'EM generalist / 資深投資經理',
            author: 'Sherman Shang (王一)',
            views: '偏多看待 2330 TT。預期 3nm 稼動率滿載，CoWoS 擴產順利',
            summary: '深入討論 TSMC 3nm 稼動率回升狀況與資本支出預測。客戶特別關切 2026 年資本支出是否會上修至 350 億美元以上，以及毛利率維持在 53% 以上之可持續性。客戶肯定富邦研究部在先進封裝供應鏈的領先分析。',
            actionItems: '1. 週五前提供台積電先進封裝供應鏈毛利分析敏感度模型。\n2. 協助預約下季度法說會一對一會面時段。',
            hasAudio: true,
            audioDuration: '02:10'
        },
        {
            id: 'inote-mtk-1',
            serviceId: 'service-2025-2',
            serviceTopic: 'MTK ASICs potential',
            date: '2025-08-11',
            contact: 'Jonas Wong (Oasis)',
            title: 'Tech PM / 投資經理',
            author: 'Sherman Shang (王一)',
            views: '看好聯發科 ASIC 客製化晶片開案與天璣 9400 旗艦晶片挹注',
            summary: '【🎤 語音即時轉譯速記】深入探討聯發科於雲端 CSP ASIC 晶片之潛在開案進程。客戶詢問 3nm 專案是否由台積電全數代工，並評估對 2026 年營收獲利之具體貢獻度。研討過程客戶提出若美系客戶擴大自研晶片，聯發科在 SerDes IP 與先進封裝整合能力具備關鍵競爭優勢。',
            actionItems: '1. 安排下週二與聯發科供應鏈主管電話諮詢。\n2. 提供 ASIC 與旗艦手機 SoC 營收佔比敏感度分析表。',
            hasAudio: true,
            audioDuration: '01:45'
        },
        {
            id: 'inote-2',
            serviceId: 'service-2025-1',
            serviceTopic: 'TSMC 2Q earnings',
            date: '2025-08-12',
            contact: 'Elizabeth Li (FMR)',
            title: 'EM generalist / 資深投資經理',
            author: 'Charlie Zhao (營業員)',
            views: '客戶表達對相關設備概念股（弘塑、萬潤）之交易興趣',
            summary: '會後追蹤客戶下單意願與研究反饋。客戶對王一研究員的觀點非常滿意，已提高相關個股關注權重，並詢問海外 ADR 與現股溢價套利空間。',
            actionItems: '洽詢業務交易員 Jason Chang 提供交易流動性報告與委託建議。',
            hasAudio: false
        },
        {
            id: 'inote-3',
            serviceId: 'rec-2',
            serviceTopic: 'AI Server Supply Chain',
            date: '2025-08-15',
            contact: 'Jonas Wong (Oasis)',
            title: 'Tech Analyst / 科技產業分析師',
            author: 'Sherman Shang (王一)',
            views: '看好 GB200 伺服器散熱與水冷模組出貨量',
            summary: '與 Oasis 科技分析師討論美系 CSP 資本支出趨勢與水冷散熱模組滲透率。客戶重點評估奇鋐與雙鴻之市佔變化。',
            actionItems: '寄送散熱零組件規格比較表及供應鏈訪查紀要。',
            hasAudio: true,
            audioDuration: '00:55'
        }
    ];

    const getAllInterviewNotes = () => {
        try {
            const stored = localStorage.getItem('crm_interview_notes');
            if (stored) {
                const list = JSON.parse(stored);
                if (Array.isArray(list) && list.length > 0) {
                    // 確保包含 MTK ASICs potential 示範語音紀錄
                    if (!list.some(n => n.id === 'inote-mtk-1' || n.serviceTopic === 'MTK ASICs potential')) {
                        const mtkNote = DEFAULT_INTERVIEW_NOTES.find(n => n.id === 'inote-mtk-1');
                        if (mtkNote) {
                            list.push(mtkNote);
                            localStorage.setItem('crm_interview_notes', JSON.stringify(list));
                        }
                    }
                    return list;
                }
            }
        } catch (e) {
            console.error('Error loading interview notes', e);
        }
        localStorage.setItem('crm_interview_notes', JSON.stringify(DEFAULT_INTERVIEW_NOTES));
        return DEFAULT_INTERVIEW_NOTES;
    };

    const getInterviewNotesForService = (serviceId, serviceTopic = '') => {
        const allNotes = getAllInterviewNotes();
        return allNotes.filter(n => {
            if (n.serviceId && serviceId && String(n.serviceId) === String(serviceId)) return true;
            if (n.serviceTopic && serviceTopic && n.serviceTopic.trim().toLowerCase() === serviceTopic.trim().toLowerCase()) return true;
            return false;
        });
    };

    const saveInterviewNote = (noteData) => {
        const allNotes = getAllInterviewNotes();
        const existingIdx = allNotes.findIndex(n => n.id === noteData.id);
        if (existingIdx > -1) {
            allNotes[existingIdx] = { ...allNotes[existingIdx], ...noteData };
        } else {
            const newNote = {
                id: noteData.id || ('inote-' + Date.now()),
                ...noteData
            };
            allNotes.unshift(newNote);
        }
        localStorage.setItem('crm_interview_notes', JSON.stringify(allNotes));
        return allNotes;
    };

    const deleteInterviewNote = (noteId) => {
        let allNotes = getAllInterviewNotes();
        allNotes = allNotes.filter(n => n.id !== noteId);
        localStorage.setItem('crm_interview_notes', JSON.stringify(allNotes));
        return allNotes;
    };

    // ----------------------------------------------------
    // Audio Memo Playback Controller (語音音訊模擬試聽)
    // ----------------------------------------------------
    let currentPlayingChip = null;
    let playingTimerInterval = null;
    let audioCtx = null;

    const formatDurationSec = (sec) => {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const stopAudioMemo = (chip = null) => {
        if (playingTimerInterval) {
            clearInterval(playingTimerInterval);
            playingTimerInterval = null;
        }
        const target = chip || currentPlayingChip;
        if (target) {
            target.classList.remove('playing');
            const iconEl = target.querySelector('.audio-play-icon');
            const labelEl = target.querySelector('.audio-play-label');
            const totalDuration = target.getAttribute('data-duration') || '01:30';
            if (iconEl) iconEl.textContent = '▶️';
            if (labelEl) labelEl.textContent = `語音速記檔 (${totalDuration})`;
        }
        currentPlayingChip = null;
    };

    const togglePlayAudioMemo = (chip) => {
        if (currentPlayingChip && currentPlayingChip !== chip) {
            stopAudioMemo(currentPlayingChip);
        }

        if (chip.classList.contains('playing')) {
            stopAudioMemo(chip);
            return;
        }

        chip.classList.add('playing');
        const iconEl = chip.querySelector('.audio-play-icon');
        const labelEl = chip.querySelector('.audio-play-label');
        const totalDuration = chip.getAttribute('data-duration') || '01:30';
        if (iconEl) iconEl.textContent = '⏸️';

        let elapsed = 0;
        if (labelEl) labelEl.textContent = `播放中 (00:00 / ${totalDuration})`;

        // Web Audio API tone feedback
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
        } catch(err) {}

        currentPlayingChip = chip;
        playingTimerInterval = setInterval(() => {
            elapsed++;
            const elapsedStr = formatDurationSec(elapsed);
            if (labelEl) labelEl.textContent = `播放中 (${elapsedStr} / ${totalDuration})`;
            if (elapsed >= 10) {
                stopAudioMemo(chip);
            }
        }, 1000);
    };

    // ----------------------------------------------------
    // Speech Recognition & Voice Dictation Manager (語音功能)
    // ----------------------------------------------------
    let activeRecognition = null;
    let voiceTimerInterval = null;
    let voiceSeconds = 0;
    let currentVoiceTarget = null; // 'inote' or 'srec'

    const stopVoiceDictation = () => {
        if (activeRecognition) {
            try { activeRecognition.stop(); } catch(e) {}
            activeRecognition = null;
        }
        if (voiceTimerInterval) {
            clearInterval(voiceTimerInterval);
            voiceTimerInterval = null;
        }
        ['inote', 'srec'].forEach(target => {
            const btn = document.getElementById(target === 'inote' ? 'btn-inote-voice' : 'btn-srec-voice');
            const btnText = document.getElementById(target === 'inote' ? 'inote-voice-btn-text' : 'srec-voice-btn-text');
            const statusEl = document.getElementById(target === 'inote' ? 'inote-voice-status' : 'srec-voice-status');
            if (btn) btn.classList.remove('recording');
            if (btnText) btnText.textContent = '語音輸入';
            if (statusEl) statusEl.style.display = 'none';
        });
        currentVoiceTarget = null;
    };

    const startVoiceDictation = (target = 'inote') => {
        if (activeRecognition) {
            stopVoiceDictation();
            return;
        }

        currentVoiceTarget = target;
        const textarea = document.getElementById(target === 'inote' ? 'inote-summary' : 'medit-notes');
        const btn = document.getElementById(target === 'inote' ? 'btn-inote-voice' : 'btn-srec-voice');
        const btnText = document.getElementById(target === 'inote' ? 'inote-voice-btn-text' : 'srec-voice-btn-text');
        const statusEl = document.getElementById(target === 'inote' ? 'inote-voice-status' : 'srec-voice-status');
        const timerEl = document.getElementById('inote-voice-timer');
        const statusTextEl = document.getElementById(target === 'inote' ? 'inote-voice-status-text' : 'srec-voice-status-text');

        if (btn) btn.classList.add('recording');
        if (btnText) btnText.textContent = '錄音辨識中...';
        if (statusEl) statusEl.style.display = 'flex';
        if (statusTextEl) statusTextEl.textContent = '🔴 正在進行語音辨識... 請對麥克風說話';

        voiceSeconds = 0;
        if (timerEl) timerEl.textContent = '00:00';
        voiceTimerInterval = setInterval(() => {
            voiceSeconds++;
            if (timerEl) timerEl.textContent = formatDurationSec(voiceSeconds);
        }, 1000);

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            try {
                const recognition = new SpeechRec();
                recognition.lang = 'zh-TW';
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event) => {
                    let interimTranscript = '';
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (textarea) {
                        const currentVal = textarea.value;
                        if (finalTranscript) {
                            textarea.value = (currentVal ? currentVal + ' ' : '') + finalTranscript;
                        }
                    }
                    if (statusTextEl && (interimTranscript || finalTranscript)) {
                        statusTextEl.textContent = `🎙️ 正在辨識: "${interimTranscript || finalTranscript}"`;
                    }
                };

                recognition.onerror = (event) => {
                    console.warn('SpeechRecognition error:', event.error);
                    if (statusTextEl) {
                        statusTextEl.textContent = `⚠️ 麥克風就緒，正在等待語音輸入（亦可點擊「範例語音」帶入）`;
                    }
                };

                recognition.onend = () => {
                    if (activeRecognition === recognition) {
                        stopVoiceDictation();
                    }
                };

                recognition.start();
                activeRecognition = recognition;
            } catch(err) {
                console.error('Failed to start SpeechRecognition:', err);
                simulateVoiceFallback(textarea, statusTextEl);
            }
        } else {
            simulateVoiceFallback(textarea, statusTextEl);
        }
    };

    const simulateVoiceFallback = (textarea, statusTextEl) => {
        if (statusTextEl) {
            statusTextEl.textContent = '🎙️ 語音輸入模擬運作中...（逐字稿實時轉譯）';
        }
        const sampleText = '【語音逐字稿】深入探討晶片先進製程需求與供應鏈動能，客戶詢問 3nm 稼動率與次世代散熱時程，後續將由研究員提供最新評估報告。';
        let idx = 0;
        const typeInterval = setInterval(() => {
            if (!activeRecognition && !voiceTimerInterval) {
                clearInterval(typeInterval);
                return;
            }
            if (idx < sampleText.length) {
                if (textarea) textarea.value += sampleText[idx];
                idx++;
            } else {
                clearInterval(typeInterval);
                if (statusTextEl) statusTextEl.textContent = '✅ 語音辨識轉譯完成！';
            }
        }, 50);
    };

    const renderInterviewNotesTable = (service, panel) => {
        const container = panel.querySelector('.interview-notes-table-container');
        const badge = panel.querySelector('.interview-count-badge');
        const addBtn = panel.querySelector('.btn-add-interview-note');
        const voiceQuickBtn = panel.querySelector('.btn-voice-quick-note');

        if (!container) return;

        const notes = getInterviewNotesForService(service.id, service.topic);
        if (badge) {
            badge.textContent = `${notes.length} 筆紀錄`;
        }

        if (addBtn) {
            addBtn.setAttribute('data-service-id', service.id);
            addBtn.onclick = (e) => {
                e.preventDefault();
                openInterviewModal(service.id, null, service);
            };
        }

        if (voiceQuickBtn) {
            voiceQuickBtn.setAttribute('data-service-id', service.id);
            voiceQuickBtn.onclick = (e) => {
                e.preventDefault();
                openInterviewModal(service.id, null, service);
                setTimeout(() => startVoiceDictation('inote'), 250);
            };
        }

        if (notes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 36px 20px; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e1; color: #64748b;">
                    <div style="font-size: 28px; margin-bottom: 8px;">📝</div>
                    <div style="font-weight: 600; font-size: 15px; color: #334155;">目前尚無關聯的訪談紀錄</div>
                    <p style="font-size: 13px; margin: 6px 0 16px;">您可以點選上方「➕ 新增訪談紀錄」建立此會議的訪談紀要，或使用語音速記功能即時錄音轉文字。</p>
                    <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-secondary btn-inote-empty-voice" data-service-id="${service.id}" style="padding: 6px 18px; font-size: 13px; background: #f0fdf4; color: #166534; border: 1px solid #86efac; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">🎤 語音速記新增第一筆</button>
                        <button type="button" class="btn btn-primary btn-inote-empty-add" data-service-id="${service.id}" style="padding: 6px 18px; font-size: 13px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer;">➕ 立即新增第一筆訪談紀錄</button>
                    </div>
                </div>
            `;
            const emptyVoiceBtn = container.querySelector('.btn-inote-empty-voice');
            if (emptyVoiceBtn) {
                emptyVoiceBtn.onclick = () => {
                    openInterviewModal(service.id, null, service);
                    setTimeout(() => startVoiceDictation('inote'), 250);
                };
            }
            const emptyAddBtn = container.querySelector('.btn-inote-empty-add');
            if (emptyAddBtn) {
                emptyAddBtn.onclick = () => openInterviewModal(service.id, null, service);
            }
            return;
        }

        let html = `
            <table class="data-table" style="min-width: 100%;">
                <thead>
                    <tr>
                        <th style="width: 110px;">訪談日期<br><small>Date</small></th>
                        <th style="width: 140px;">受訪對象<br><small>Contact</small></th>
                        <th style="width: 130px;">職稱<br><small>Title</small></th>
                        <th style="min-width: 250px;">訪談重點摘要<br><small>Key Summary</small></th>
                        <th style="width: 170px;">個股/產業觀點<br><small>Views</small></th>
                        <th style="min-width: 200px;">後續追蹤事項<br><small>Action Items</small></th>
                        <th style="width: 120px;">紀錄人員<br><small>Author</small></th>
                    </tr>
                </thead>
                <tbody>
        `;

        notes.forEach(note => {
            const audioBadge = note.hasAudio ? `
                <div style="margin-top: 6px;">
                    <span class="voice-audio-chip" data-note-id="${note.id}" data-duration="${note.audioDuration || '01:25'}" title="點擊試聽訪談語音速記錄音">
                        <span class="audio-play-icon">▶️</span>
                        <span class="audio-play-label">語音速記檔 (${note.audioDuration || '01:25'})</span>
                    </span>
                </div>
            ` : '';

            html += `
                <tr data-note-id="${note.id}">
                    <td style="font-weight: 600; color: #0284c7;">${note.date || ''}</td>
                    <td><strong style="color: #1e293b;">${note.contact || ''}</strong></td>
                    <td style="color: #64748b; font-size: 13px;">${note.title || ''}</td>
                    <td style="line-height: 1.5; color: #1e293b; font-size: 13px;">
                        ${(note.summary || '').replace(/\n/g, '<br>')}
                        ${audioBadge}
                    </td>
                    <td><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block;">${note.views || '—'}</span></td>
                    <td style="color: #475569; font-size: 13px; line-height: 1.4;">${(note.actionItems || '—').replace(/\n/g, '<br>')}</td>
                    <td style="color: #64748b; font-size: 13px;">${note.author || ''}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        // Bind Audio Play Chips
        container.querySelectorAll('.voice-audio-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePlayAudioMemo(chip);
            });
        });
    };

    const renderServiceRecordDetailView = (recordId, targetPanel = null) => {
        const allServices = getAllServices();
        let service = allServices.find(s => s.id === recordId || String(s.id) === String(recordId));
        if (!service) {
            service = allServices.find(s => s.topic === recordId) || allServices[0];
        }
        if (!service) return;

        const panel = targetPanel || document.getElementById('panel-detail-service-record');
        if (!panel) return;

        panel.setAttribute('data-service-id', service.id);

        // Populate fields
        const serviceName = getServiceName(service);
        const bTopic = panel.querySelector('#srec-breadcrumb-topic');
        if (bTopic) bTopic.textContent = `📄 服務紀錄 (${serviceName})`;

        const cServiceName = panel.querySelector('#srec-card-service-name');
        if (cServiceName) cServiceName.textContent = serviceName;

        const cTopic = panel.querySelector('#srec-card-topic');
        if (cTopic) cTopic.textContent = service.topic || '未命名主題';

        // Follow-up status setup in Detail Panel
        const isFollowed = pinnedServiceIds.includes(service.id);
        const followBadge = panel.querySelector('#srec-badge-followup');
        const detailFollowupCheck = panel.querySelector('#srec-detail-followup');
        const detailFollowupBtn = panel.querySelector('#btn-detail-followup-toggle');

        const updateDetailFollowupUI = (pinned) => {
            if (followBadge) followBadge.style.display = pinned ? 'inline-block' : 'none';
            if (detailFollowupCheck) detailFollowupCheck.checked = pinned;
            if (detailFollowupBtn) {
                if (pinned) {
                    detailFollowupBtn.innerHTML = '★ 📌 已追蹤 <span style="font-size:11px; font-weight:normal; opacity:0.85;">(點擊取消)</span>';
                    detailFollowupBtn.style.background = '#FEF3C7';
                    detailFollowupBtn.style.border = '1px solid #F59E0B';
                    detailFollowupBtn.style.color = '#B45309';
                    detailFollowupBtn.title = '此服務紀錄已釘選至首頁行事曆，點擊可取消追蹤';
                } else {
                    detailFollowupBtn.innerHTML = '☆ 📌 加入追蹤 <span style="font-size:11px; font-weight:normal; opacity:0.85;">(同步首頁)</span>';
                    detailFollowupBtn.style.background = '#FFFFFF';
                    detailFollowupBtn.style.border = '1.5px solid #0284C7';
                    detailFollowupBtn.style.color = '#0284C7';
                    detailFollowupBtn.title = '點擊將此服務紀錄加入追蹤並同步至首頁個人行事曆';
                }
            }
        };

        updateDetailFollowupUI(isFollowed);

        const toggleFollowup = (shouldPin) => {
            const idx = pinnedServiceIds.indexOf(service.id);
            if (shouldPin && idx === -1) {
                pinnedServiceIds.push(service.id);
            } else if (!shouldPin && idx > -1) {
                pinnedServiceIds.splice(idx, 1);
            }
            syncPinnedServicesDetailsToHome();
            updatePinStarsUI();
            updateDetailFollowupUI(pinnedServiceIds.includes(service.id));
        };

        if (detailFollowupCheck) {
            detailFollowupCheck.onchange = (e) => {
                toggleFollowup(e.target.checked);
            };
        }

        if (detailFollowupBtn) {
            detailFollowupBtn.onclick = (e) => {
                e.preventDefault();
                const currentPinned = pinnedServiceIds.includes(service.id);
                toggleFollowup(!currentPinned);
            };
        }

        const setField = (selector, val) => {
            const el = panel.querySelector(selector);
            if (el) el.textContent = val || '';
        };

        setField('#srec-field-service-name', serviceName);
        setField('#srec-field-topic', service.topic || '—');
        setField('#srec-field-date', service.date);
        setField('#srec-field-time', service.time);
        setField('#srec-field-coverage', service.coverage || '—');
        // Render multi-analyst as clickable badges/links
        const analystContainer = panel.querySelector('#srec-field-analyst');
        if (analystContainer) {
            const rawAnalyst = service.analyst || '';
            const analystsList = rawAnalyst.split(/[,;、]/).map(s => s.trim()).filter(Boolean);
            if (analystsList.length > 0) {
                analystContainer.innerHTML = analystsList.map(name => {
                    return `<span class="text-link trigger-researcher" style="color: #1976D2; cursor: pointer; font-weight: 600; text-decoration: underline; margin-right: 8px;">${name}</span>`;
                }).join('');
            } else {
                analystContainer.textContent = '未指定';
            }
        }
        setField('#srec-field-analyst-email', service.analystEmail || (service.analyst ? getAnalystEmail(service.analyst) : ''));
        setField('#srec-field-firm', service.firm);
        setField('#srec-field-client', service.client);
        setField('#srec-field-client-email', service.email);
        setField('#srec-field-type', service.type);
        setField('#srec-field-method', service.method);
        setField('#srec-field-duration', service.duration ? `${service.duration} 分鐘` : '—');
        setField('#srec-field-format', service.format);
        setField('#srec-field-interest', service.interest);
        setField('#srec-field-sales', service.sales);
        setField('#srec-field-trader', service.trader || 'Jason Chang');
        setField('#srec-field-notes', service.notes || '無特殊備註');

        // Bind Edit Service Record Button
        const editBtn = panel.querySelector('.btn-edit-srec-record');
        if (editBtn) {
            editBtn.setAttribute('data-service-id', service.id);
            editBtn.onclick = (e) => {
                e.preventDefault();
                openServiceRecordEditModal(service.id);
            };
        }

        // Bind Back to List Buttons & Breadcrumbs
        const homeCrumb = panel.querySelector('.breadcrumb span:first-child');
        if (homeCrumb) {
            homeCrumb.innerHTML = '<a href="index.html" style="color: #0284c7; text-decoration: underline; font-weight: 600; cursor: pointer;">🏠 首頁</a>';
        }

        const queryParams = parseAllQueryParams();
        const isFromHome = (queryParams.from === 'home') || 
                           (document.referrer && document.referrer.includes('index.html')) || 
                           (window.location.search && window.location.search.includes('serviceId='));

        const backBtn = panel.querySelector('.back-to-service-list-btn');
        if (backBtn) {
            if (isFromHome) {
                backBtn.innerHTML = '← 返回首頁 (Home)';
                backBtn.style.backgroundColor = '#0093C1';
                backBtn.style.borderColor = '#0093C1';
                backBtn.style.color = '#FFFFFF';
                backBtn.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = 'index.html';
                };
            } else {
                backBtn.innerHTML = '← 返回服務紀錄列表';
                backBtn.style.backgroundColor = 'white';
                backBtn.style.borderColor = '#cbd5e1';
                backBtn.style.color = '#475569';
                backBtn.onclick = (e) => {
                    e.preventDefault();
                    const serviceTab = document.querySelector('[data-target="panel-records-list"]');
                    if (serviceTab) serviceTab.click();
                    const btnModeDetails = document.getElementById('btn-mode-details');
                    if (btnModeDetails) btnModeDetails.click();
                };
            }
        }
        const bOverview = panel.querySelector('.trigger-service-overview');
        if (bOverview) {
            bOverview.onclick = (e) => {
                e.preventDefault();
                const serviceTab = document.querySelector('[data-target="panel-records-list"]');
                if (serviceTab) serviceTab.click();
                const btnModeDetails = document.getElementById('btn-mode-details');
                if (btnModeDetails) btnModeDetails.click();
            };
        }

        // Add a secondary button for viewing all services when arriving from home
        let secondaryOverviewBtn = panel.querySelector('.btn-view-all-services-secondary');
        if (isFromHome && !secondaryOverviewBtn && backBtn && backBtn.parentNode) {
            secondaryOverviewBtn = document.createElement('button');
            secondaryOverviewBtn.className = 'btn btn-secondary btn-view-all-services-secondary';
            secondaryOverviewBtn.innerHTML = '📄 服務紀錄總覽';
            secondaryOverviewBtn.style.cssText = 'padding: 5px 14px; font-size: 13px; background: white; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; color: #475569; margin-left: 8px;';
            secondaryOverviewBtn.onclick = (e) => {
                e.preventDefault();
                const serviceTab = document.querySelector('[data-target="panel-records-list"]');
                if (serviceTab) serviceTab.click();
                const btnModeDetails = document.getElementById('btn-mode-details');
                if (btnModeDetails) btnModeDetails.click();
            };
            backBtn.parentNode.appendChild(secondaryOverviewBtn);
        }

        // Render Interview Notes Table
        renderInterviewNotesTable(service, panel);
    };

    const showIndividualServiceRecordPage = (recordId) => {
        const allServices = getAllServices();
        let service = null;
        if (recordId) {
            service = allServices.find(s => s.id === recordId || String(s.id) === String(recordId));
            if (!service) {
                const norm = String(recordId).trim().toLowerCase();
                service = allServices.find(s => s.topic && s.topic.trim().toLowerCase() === norm);
            }
        }
        if (!service) {
            const queryParams = parseAllQueryParams();
            const topicParam = queryParams.serviceTopic || queryParams.topic;
            if (topicParam) {
                const normTopic = topicParam.trim().toLowerCase();
                service = allServices.find(s => s.topic && s.topic.trim().toLowerCase() === normTopic);
            }
        }
        if (!service) {
            service = allServices[0];
        }
        if (!service) return;

        openInNewTab(
            `service-${service.id}`,
            `📄 服務: ${service.topic || '紀錄'}`,
            `Service Record`,
            'panel-detail-service-record',
            (panel) => {
                renderServiceRecordDetailView(service.id, panel);
            }
        );
    };

    // Modal logic for Interview Notes
    const interviewModal = document.getElementById('interview-note-modal');
    const closeInterviewModalBtn = document.getElementById('btn-close-interview-modal');
    const cancelInterviewModalBtn = document.getElementById('btn-cancel-interview-modal');
    const interviewForm = document.getElementById('interview-note-form');

    const openInterviewModal = (serviceId, noteId = null, serviceObj = null) => {
        if (!interviewModal) return;
        const allServices = getAllServices();
        const service = serviceObj || allServices.find(s => s.id === serviceId) || allServices[0];

        document.getElementById('interview-service-id').value = service ? service.id : serviceId;

        const titleEl = document.getElementById('interview-modal-title');
        const noteIdInput = document.getElementById('interview-note-id');

        titleEl.textContent = '➕ 新增訪談紀錄 Add Interview Note (永久存檔憑證)';
        noteIdInput.value = '';
        document.getElementById('inote-date').value = service ? (service.date ? service.date.replace(/\//g, '-') : new Date().toISOString().split('T')[0]) : '';
        document.getElementById('inote-author').value = service ? `${service.analyst || 'Sherman Shang'} (主談)` : 'Sherman Shang (主談)';
        document.getElementById('inote-contact').value = service ? `${service.client || ''} (${service.firm || ''})` : '';
        document.getElementById('inote-title').value = '資深經理 / PM';
        document.getElementById('inote-views').value = service && service.interest ? `研討 ${service.interest} 產業趨勢與營運動能` : '';
        document.getElementById('inote-summary').value = '';
        document.getElementById('inote-action-items').value = '';
        const hasAudioCheck = document.getElementById('inote-has-audio');
        if (hasAudioCheck) hasAudioCheck.checked = true;

        const inoteFollowup = document.getElementById('inote-followup');
        if (inoteFollowup && service) {
            inoteFollowup.checked = pinnedServiceIds.includes(service.id);
        }

        interviewModal.style.display = 'flex';
        interviewModal.classList.add('show');

        // Focus summary for immediate typing
        setTimeout(() => {
            const summaryInput = document.getElementById('inote-summary');
            if (summaryInput && !btnInoteVoice?.classList.contains('recording')) {
                summaryInput.focus();
            }
        }, 150);
    };

    const closeInterviewModal = () => {
        stopVoiceDictation();
        if (interviewModal) {
            interviewModal.classList.remove('show');
            interviewModal.style.display = 'none';
        }
    };

    if (closeInterviewModalBtn) closeInterviewModalBtn.onclick = closeInterviewModal;
    if (cancelInterviewModalBtn) cancelInterviewModalBtn.onclick = closeInterviewModal;

    if (interviewModal) {
        interviewModal.addEventListener('click', (e) => {
            if (e.target === interviewModal) closeInterviewModal();
        });
    }

    // Interview Voice Buttons
    const btnInoteVoice = document.getElementById('btn-inote-voice');
    const btnStopInoteVoice = document.getElementById('btn-stop-inote-voice');
    const btnInoteSampleVoice = document.getElementById('btn-inote-sample-voice');

    if (btnInoteVoice) {
        btnInoteVoice.onclick = () => {
            if (btnInoteVoice.classList.contains('recording')) {
                stopVoiceDictation();
            } else {
                startVoiceDictation('inote');
            }
        };
    }
    if (btnStopInoteVoice) {
        btnStopInoteVoice.onclick = stopVoiceDictation;
    }
    if (btnInoteSampleVoice) {
        btnInoteSampleVoice.onclick = () => {
            const textarea = document.getElementById('inote-summary');
            if (textarea) {
                const sample = '【🎤 語音即時轉譯速記】深入研討美系雲端大廠客製化 ASIC 晶片開案進展。客戶詢問 3nm 專案是否由台積電全數代工，並評估對 2026 年營收獲利之具體貢獻度。研討過程客戶提出若美系客戶擴大自研晶片，聯發科在 SerDes IP 與先進封裝整合能力具備關鍵競爭優勢。';
                textarea.value = sample;
                textarea.focus();
                const hasAudioCheck = document.getElementById('inote-has-audio');
                if (hasAudioCheck) hasAudioCheck.checked = true;
            }
        };
    }

    if (interviewForm) {
        interviewForm.onsubmit = (e) => {
            e.preventDefault();
            const serviceId = document.getElementById('interview-service-id').value;
            const noteId = document.getElementById('interview-note-id').value;
            const allServices = getAllServices();
            const service = allServices.find(s => s.id === serviceId);

            const hasAudioChecked = document.getElementById('inote-has-audio')?.checked || false;
            const noteData = {
                id: noteId || ('inote-' + Date.now()),
                serviceId: serviceId,
                serviceTopic: service ? service.topic : '',
                date: document.getElementById('inote-date').value,
                author: document.getElementById('inote-author').value,
                contact: document.getElementById('inote-contact').value,
                title: document.getElementById('inote-title').value,
                views: document.getElementById('inote-views').value,
                summary: document.getElementById('inote-summary').value,
                actionItems: document.getElementById('inote-action-items').value,
                hasAudio: hasAudioChecked,
                audioDuration: hasAudioChecked ? (voiceSeconds > 0 ? formatDurationSec(voiceSeconds) : '01:45') : null
            };

            saveInterviewNote(noteData);

            // Handle follow-up checkbox from interview note modal
            const followCheck = document.getElementById('inote-followup');
            if (followCheck && serviceId) {
                const shouldPin = followCheck.checked;
                const idx = pinnedServiceIds.indexOf(serviceId);
                if (shouldPin && idx === -1) {
                    pinnedServiceIds.push(serviceId);
                    syncPinnedServicesDetailsToHome();
                    updatePinStarsUI();
                } else if (!shouldPin && idx > -1) {
                    pinnedServiceIds.splice(idx, 1);
                    syncPinnedServicesDetailsToHome();
                    updatePinStarsUI();
                }
            }

            closeInterviewModal();

            // Refresh current active panel
            const currentActivePanel = document.querySelector('.marketing-content-panel.active');
            if (currentActivePanel && (currentActivePanel.id === 'panel-detail-service-record' || currentActivePanel.id.startsWith('dynamic-panel-service-'))) {
                renderServiceRecordDetailView(serviceId, currentActivePanel);
            } else {
                const basePanel = document.getElementById('panel-detail-service-record');
                if (basePanel) renderServiceRecordDetailView(serviceId, basePanel);
            }
        };
    }

    // Modal logic for Service Record Edit
    const srecEditModal = document.getElementById('service-record-edit-modal');
    const closeSrecModalBtn = document.getElementById('btn-close-srec-modal');
    const cancelSrecModalBtn = document.getElementById('btn-cancel-srec-modal');
    const srecEditForm = document.getElementById('service-record-edit-form');
    const btnSrecVoice = document.getElementById('btn-srec-voice');
    const btnStopSrecVoice = document.getElementById('btn-stop-srec-voice');

    if (btnSrecVoice) {
        btnSrecVoice.onclick = () => {
            if (btnSrecVoice.classList.contains('recording')) {
                stopVoiceDictation();
            } else {
                startVoiceDictation('srec');
            }
        };
    }
    if (btnStopSrecVoice) {
        btnStopSrecVoice.onclick = stopVoiceDictation;
    }

    const openServiceRecordEditModal = (recordId) => {
        if (!srecEditModal) return;
        const allServices = getAllServices();
        const service = allServices.find(s => s.id === recordId) || allServices[0];
        if (!service) return;

        const setDropdownValue = (elementId, value) => {
            const el = document.getElementById(elementId);
            if (!el || !el.options) return;
            if (!value) {
                if (el.options.length > 0) el.selectedIndex = 0;
                return;
            }
            const cleanVal = String(value).trim();
            let matched = false;
            for (let i = 0; i < el.options.length; i++) {
                const opt = el.options[i];
                if (opt.value === cleanVal || opt.textContent.trim().startsWith(cleanVal) || cleanVal.startsWith(opt.value)) {
                    el.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
            if (!matched && cleanVal) {
                const newOpt = document.createElement('option');
                newOpt.value = cleanVal;
                newOpt.textContent = cleanVal;
                el.appendChild(newOpt);
                el.value = cleanVal;
            }
        };

        document.getElementById('medit-record-id').value = service.id;
        const meditSName = document.getElementById('medit-service-name');
        if (meditSName) meditSName.value = service.serviceName || getServiceName(service);
        setDropdownValue('medit-topic', service.topic || '');
        document.getElementById('medit-date').value = service.date ? service.date.replace(/\//g, '-') : '';
        document.getElementById('medit-time').value = service.time || '';
        document.getElementById('medit-duration').value = service.duration || '';

        // Multi-select Firm population
        if (!meditFirmSelector) meditFirmSelector = setupMultiSelectFirm('medit');
        if (meditFirmSelector) meditFirmSelector.setFirms(service.firm || '');

        // Multi-select Client population
        if (!meditClientSelector) meditClientSelector = setupMultiSelectClient('medit');
        if (meditClientSelector) meditClientSelector.setClients(service.client || '');

        // Multi-select Analyst population
        if (!meditAnalystSelector) {
            meditAnalystSelector = setupMultiSelectAnalyst('medit');
        }
        if (meditAnalystSelector) {
            meditAnalystSelector.setAnalysts(service.analyst || '', service.analystEmail || '');
        } else {
            document.getElementById('medit-analyst').value = service.analyst || '';
            document.getElementById('medit-analyst-email').value = service.analystEmail || '';
        }

        document.getElementById('medit-interest').value = service.interest || '';
        setDropdownValue('medit-type', service.type || '');
        setDropdownValue('medit-method', service.method || 'In Person');
        document.getElementById('medit-format').value = service.format || '';
        document.getElementById('medit-notes').value = service.notes || '';

        const followUpCheck = document.getElementById('medit-followup');
        if (followUpCheck) {
            followUpCheck.checked = pinnedServiceIds.includes(service.id);
        }

        srecEditModal.style.display = 'flex';
        srecEditModal.classList.add('show');
    };

    const meditAnalystSelect = document.getElementById('medit-analyst');
    if (meditAnalystSelect) {
        meditAnalystSelect.addEventListener('change', () => {
            const selectedOpt = meditAnalystSelect.options[meditAnalystSelect.selectedIndex];
            const email = selectedOpt ? selectedOpt.getAttribute('data-email') : '';
            if (email) {
                const emailInput = document.getElementById('medit-analyst-email');
                if (emailInput) emailInput.value = email;
            }
        });
    }

    const closeServiceRecordEditModal = () => {
        stopVoiceDictation();
        if (srecEditModal) {
            srecEditModal.classList.remove('show');
            srecEditModal.style.display = 'none';
        }
    };

    if (closeSrecModalBtn) closeSrecModalBtn.onclick = closeServiceRecordEditModal;
    if (cancelSrecModalBtn) cancelSrecModalBtn.onclick = closeServiceRecordEditModal;

    if (srecEditModal) {
        srecEditModal.addEventListener('click', (e) => {
            if (e.target === srecEditModal) closeServiceRecordEditModal();
        });
    }

    window.openServiceRecordEditModal = openServiceRecordEditModal;
    window.closeServiceRecordEditModal = closeServiceRecordEditModal;
    window.openServiceDrawer = openServiceDrawer;
    window.closeServiceDrawer = closeServiceDrawer;
    window.showFormView = showFormView;

    if (srecEditForm) {
        srecEditForm.onsubmit = (e) => {
            e.preventDefault();
            const recordId = document.getElementById('medit-record-id').value;
            const updatedTopic = document.getElementById('medit-topic').value;
            const updatedDate = document.getElementById('medit-date').value.replace(/-/g, '/');

            // Find and update in customServices or DEFAULT_SERVICES
            let target = customServices.find(s => s.id === recordId);
            if (!target) {
                target = DEFAULT_SERVICES.find(s => s.id === recordId);
                if (target) {
                    customServices.push({ ...target });
                    target = customServices[customServices.length - 1];
                }
            }

            if (target) {
                const meditSName = document.getElementById('medit-service-name');
                if (meditSName && meditSName.value.trim()) {
                    target.serviceName = meditSName.value.trim();
                }
                target.topic = updatedTopic;
                target.date = updatedDate;
                target.time = document.getElementById('medit-time').value;
                target.duration = document.getElementById('medit-duration').value;
                target.analyst = document.getElementById('medit-analyst').value;
                target.analystEmail = document.getElementById('medit-analyst-email').value;
                target.firm = document.getElementById('medit-firm').value;
                target.client = document.getElementById('medit-client').value;
                target.interest = document.getElementById('medit-interest').value;
                target.type = document.getElementById('medit-type').value;
                target.method = document.getElementById('medit-method') ? document.getElementById('medit-method').value : (target.method || 'In Person');
                target.format = document.getElementById('medit-format').value;
                target.notes = document.getElementById('medit-notes').value;

                localStorage.setItem('crm_custom_services', JSON.stringify(customServices));
            }

            // Sync Follow-up / Pin tracking state
            const followUpCheck = document.getElementById('medit-followup');
            if (followUpCheck) {
                const isFollowUp = followUpCheck.checked;
                if (isFollowUp && !pinnedServiceIds.includes(recordId)) {
                    pinnedServiceIds.push(recordId);
                } else if (!isFollowUp && pinnedServiceIds.includes(recordId)) {
                    pinnedServiceIds = pinnedServiceIds.filter(id => id !== recordId);
                }
                localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedServiceIds));
            }

            syncPinnedServicesDetailsToHome();
            updatePinStarsUI();

            closeServiceRecordEditModal();

            // Refresh current panel
            const currentActivePanel = document.querySelector('.marketing-content-panel.active');
            if (currentActivePanel && (currentActivePanel.id === 'panel-detail-service-record' || currentActivePanel.id.startsWith('dynamic-panel-service-'))) {
                renderServiceRecordDetailView(recordId, currentActivePanel);
            }
            if (typeof refreshLocalSummaryTable === 'function') refreshLocalSummaryTable();
        };
    }

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



    const recordAnalystSelect = document.getElementById('record-analyst');
    if (recordAnalystSelect && recordAnalystSelect.tagName === 'SELECT') {
        recordAnalystSelect.addEventListener('change', (e) => {
            if (e.target.options && e.target.selectedIndex >= 0) {
                const selectedOpt = e.target.options[e.target.selectedIndex];
                const email = selectedOpt ? selectedOpt.getAttribute('data-email') : '';
                const emailInput = document.getElementById('record-analyst-email');
                if (emailInput && email) emailInput.value = email;
            }
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

    // Trigger Initial Firm & Client Table Render
    refreshFirmTable();
    refreshClientTable();

    // ----------------------------------------------------
    // Trigger Initial Analyst Table Rendering
    // ----------------------------------------------------
    refreshDashboards();


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
            let mappedAnalystName = selectedAnalystVal;
            if (mappedAnalystName === '王一') mappedAnalystName = 'Sherman Shang';
            else if (mappedAnalystName === '王二') mappedAnalystName = 'Titan Wang';
            else if (mappedAnalystName === '王三') mappedAnalystName = 'Rita Wu';

            const serviceNameInput = document.getElementById('record-service-name');
            const topicInput = document.getElementById('record-topic');
            const userSpecifiedServiceName = serviceNameInput ? serviceNameInput.value.trim() : '';
            const userSpecifiedTopic = topicInput ? topicInput.value.trim() : '';
            const interestVal = document.getElementById('record-interest') ? document.getElementById('record-interest').value.trim() : '';

            // Validation: Service Name, Topic or Interest must have at least one filled!
            if (!userSpecifiedServiceName && !userSpecifiedTopic && !interestVal) {
                alert('⚠️ 請至少填寫「服務名稱」、「主題」或「個股 Interest」其中一項！');
                if (serviceNameInput) serviceNameInput.focus();
                else if (topicInput) topicInput.focus();
                return;
            }

            const rawFirmVal = document.getElementById('record-firm') ? document.getElementById('record-firm').value.replace(' (選單)', '').trim() : 'FMR';
            const shortDate = formattedDate ? formattedDate.substring(5).replace('-', '/') : '8/10';
            
            // 服務名稱做為 key 值：若使用者有輸入則以輸入為準，未輸入則依預設規則組合
            const finalServiceName = userSpecifiedServiceName || `${rawFirmVal} ${shortDate} ${interestVal || userSpecifiedTopic || '服務紀錄'}`.trim();
            const finalTopic = userSpecifiedTopic || (interestVal ? `${rawFirmVal} ${shortDate} ${interestVal}` : finalServiceName);

            const record = {
                id: mode === 'new' ? `service-custom-${Date.now()}` : editId,
                serviceName: finalServiceName,
                date: formattedDate,
                type: document.getElementById('record-type').value,
                email: document.getElementById('record-email').value,
                time: document.getElementById('record-time').value,
                method: document.getElementById('record-method').value,
                topic: finalTopic,
                sales: document.getElementById('record-sales').value,
                salesTrader: document.getElementById('record-sales-trader').value,
                duration: document.getElementById('record-duration').value,
                analystEmail: document.getElementById('record-analyst-email').value,
                firm: document.getElementById('record-firm').value,
                format: document.getElementById('record-format').value,
                client: document.getElementById('record-client').value,
                timeEnd: document.getElementById('record-time-end').value,
                interest: document.getElementById('record-interest').value,
                notes: document.getElementById('notes-textarea') ? document.getElementById('notes-textarea').value : '',
                analyst: mappedAnalystName,
                coverage: 'Fubon'
            };

            const followUpCheck = document.getElementById('record-followup');
            const isFollowUp = followUpCheck ? followUpCheck.checked : true;

            if (mode === 'new') {
                // Add to custom services at the beginning of the list
                customServices.unshift(record);
                localStorage.setItem('crm_custom_services', JSON.stringify(customServices));
                
                // Sync Follow-up / Pin tracking state based on checkbox
                if (isFollowUp) {
                    if (!pinnedServiceIds.includes(record.id)) {
                        pinnedServiceIds.unshift(record.id);
                    }
                } else {
                    pinnedServiceIds = pinnedServiceIds.filter(id => id !== record.id);
                }
                localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedServiceIds));
                syncPinnedServicesDetailsToHome();
                updatePinStarsUI();

                // 標記最新新增之服務紀錄日期與 ID，供首頁自動跳轉與聚焦
                localStorage.setItem('crm_latest_service_date', formattedDate);
                localStorage.setItem('crm_latest_service_id', record.id);
                
                // Clear imported meeting from sessionStorage
                sessionStorage.removeItem('crm_import_meeting');
                
                // Re-render table dynamically to show the new record in details list
                if (typeof refreshServiceRecordsTable === 'function') refreshServiceRecordsTable();

                const successMsg = isFollowUp 
                    ? '✅ 服務紀錄已成功儲存！已加入服務管理明細並同步標記為追蹤（同步至首頁個人行事曆）。' 
                    : '✅ 服務紀錄已成功儲存！已加入服務管理明細。';
                alert(successMsg);
                
                // Seamlessly show the Details table view with the new record right at the top
                showListView(true);
                return;
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

                // Sync Follow-up / Pin tracking state based on checkbox
                if (isFollowUp) {
                    if (!pinnedServiceIds.includes(editId)) {
                        pinnedServiceIds.unshift(editId);
                    }
                } else {
                    pinnedServiceIds = pinnedServiceIds.filter(id => id !== editId);
                }
                localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedServiceIds));
                syncPinnedServicesDetailsToHome();
                updatePinStarsUI();

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
            refreshFirmTable();
            refreshClientTable();
            if (typeof refreshServiceRecordsTable === 'function') refreshServiceRecordsTable();
            
            showListView();
        });
    }

    // ----------------------------------------------------
    // Service Notification Email Modal Logic (新增會通發送欄位 - 依據圖二 Outlook 規格)
    // ----------------------------------------------------
    const btnSendNotification = document.getElementById('btn-send-notification');
    const serviceEmailModal = document.getElementById('service-email-modal');
    const btnCloseServiceEmail = document.getElementById('btn-close-service-email');
    const btnSendServiceEmailAction = document.getElementById('btn-send-service-email-action');
    const btnSaveCloseServiceEmail = document.getElementById('btn-save-close-service-email');

    if (btnSendNotification && serviceEmailModal) {
        btnSendNotification.addEventListener('click', () => {
            const firmEl = document.getElementById('record-firm');
            const clientEl = document.getElementById('record-client');
            const emailEl = document.getElementById('record-email');
            const analystEl = document.getElementById('record-analyst');
            const dateEl = document.getElementById('record-date');
            const timeEl = document.getElementById('record-time');
            const endTimeEl = document.getElementById('record-time-end');
            const salesEl = document.getElementById('record-sales');
            const traderEl = document.getElementById('record-sales-trader');

            const firm = firmEl ? firmEl.value : 'FMR';
            const client = clientEl ? clientEl.value : 'Elizabeth Li';
            const email = emailEl ? emailEl.value : '';
            const selectedAnalystVal = analystEl ? analystEl.value : 'Sherman Shang';
            let analyst = selectedAnalystVal || 'Sherman Shang';
            if (analyst === '王一') analyst = 'Sherman Shang';
            else if (analyst === '王二') analyst = 'Titan Wang';
            else if (analyst === '王三') analyst = 'Rita Wu';
            const time = timeEl ? timeEl.value : '14:00';
            const endTime = endTimeEl ? endTimeEl.value : '14:30';
            const rawDate = dateEl ? dateEl.value : '2026-04-04';
            const sales = salesEl ? salesEl.value : 'Charlie Zhao';
            const trader = traderEl ? traderEl.value : 'Jason Chang';

            // Clean firm and client names
            const cleanFirm = firm.replace(/\s*\(.*?\)\s*/g, '').trim();
            const cleanClient = client.replace(/\s*\(.*?\)\s*/g, '').trim();
            const clientFirstName = cleanClient.split(' ')[0] || cleanClient;

            // Check if Group is selected
            const isGroup = (firm && firm.toLowerCase().includes('group')) || (client && client.toLowerCase().includes('group'));

            const emailToEl = document.getElementById('service-email-to');
            const emailCcEl = document.getElementById('service-email-cc');
            const emailSubjectEl = document.getElementById('service-email-subject');
            const emailBodyEl = document.getElementById('service-email-body');

            if (isGroup) {
                // 收件人/副本：若前面選擇group則這邊自行填寫
                if (emailToEl) {
                    emailToEl.value = '';
                    emailToEl.placeholder = '請自行填寫收件人 email (Group群組)';
                }
                if (emailCcEl) {
                    emailCcEl.value = '';
                    emailCcEl.placeholder = '請自行填寫副本 email (Group群組)';
                }
            } else {
                // 預設為法人戶與客戶 email
                if (emailToEl) {
                    emailToEl.value = email || `${clientFirstName.toLowerCase()}@${cleanFirm.toLowerCase()}.com`;
                    emailToEl.placeholder = '收件人 email...';
                }
                // 預設為該法人戶的營業員與交易員 email
                const cleanSales = sales.replace(/\s*\(.*?\)\s*/g, '').trim();
                const cleanTrader = trader.replace(/\s*\(.*?\)\s*/g, '').trim();
                const salesEmail = cleanSales ? cleanSales.replace(/\s+/g, '.').toLowerCase() + '@fubon.com' : '';
                const traderEmail = cleanTrader ? cleanTrader.replace(/\s+/g, '.').toLowerCase() + '@fubon.com' : '';
                const analystEmailsVal = document.getElementById('record-analyst-email') ? document.getElementById('record-analyst-email').value : '';
                const ccEmails = [analystEmailsVal, salesEmail, traderEmail].filter(Boolean).join('; ');
                if (emailCcEl) {
                    emailCcEl.value = ccEmails;
                    emailCcEl.placeholder = '營業員與交易員 email...';
                }
            }

            // Date parsing & formatting
            let dateObj = new Date();
            if (rawDate) {
                const parts = rawDate.split('-');
                if (parts.length === 3) {
                    dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                }
            }
            const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
            const y = dateObj.getFullYear();
            const m = dateObj.getMonth() + 1;
            const d = dateObj.getDate();
            const weekdayStr = weekdays[dateObj.getDay()];
            const chineseDateWithWeekday = `${y}/${m}/${d} (${weekdayStr})`;

            // Populate Outlook scheduling bar dates
            const meetingStartDateEl = document.getElementById('service-meeting-start-date');
            const meetingEndDateEl = document.getElementById('service-meeting-end-date');
            if (meetingStartDateEl) meetingStartDateEl.value = chineseDateWithWeekday;
            if (meetingEndDateEl) meetingEndDateEl.value = chineseDateWithWeekday;

            // Time formatting helper
            function formatTimeDisplay(tStr) {
                if (!tStr) return { en: '10:05 AM', zh: '上午 10:05', raw: '10:05' };
                const [hStr, mStr] = tStr.split(':');
                const h = parseInt(hStr, 10);
                const min = mStr || '00';
                const ampm = h >= 12 ? 'PM' : 'AM';
                const zhPrefix = h >= 12 ? '下午' : '上午';
                const displayH = h > 12 ? (h - 12) : (h === 0 ? 12 : h);
                const padH = displayH < 10 ? '0' + displayH : '' + displayH;
                return {
                    en: `${tStr} ${ampm}`,
                    zh: `${zhPrefix} ${padH}:${min}`,
                    raw: tStr
                };
            }

            const startTimeInfo = formatTimeDisplay(time);
            const endTimeInfo = formatTimeDisplay(endTime);

            // Populate start/end time select dropdowns
            const startSelect = document.getElementById('service-meeting-start-time');
            if (startSelect) {
                startSelect.innerHTML = `
                    <option value="${startTimeInfo.raw}" selected>${startTimeInfo.zh}</option>
                    <option value="10:05">上午 10:05</option>
                    <option value="10:30">上午 10:30</option>
                    <option value="14:00">下午 02:00</option>
                    <option value="14:30">下午 02:30</option>
                    <option value="15:00">下午 03:00</option>
                `;
            }
            const endSelect = document.getElementById('service-meeting-end-time');
            if (endSelect) {
                endSelect.innerHTML = `
                    <option value="${endTimeInfo.raw}" selected>${endTimeInfo.zh}</option>
                    <option value="10:30">上午 10:30</option>
                    <option value="11:00">上午 11:00</option>
                    <option value="14:30">下午 02:30</option>
                    <option value="15:00">下午 03:00</option>
                    <option value="15:30">下午 03:30</option>
                `;
            }

            // English Date formatting (e.g. April 4th, August 10th)
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            function getOrdinalSuffix(num) {
                const s = ["th", "st", "nd", "rd"];
                const val = num % 100;
                return s[(val - 20) % 10] || s[val] || s[0];
            }
            const englishDateStr = `${months[dateObj.getMonth()]} ${d}${getOrdinalSuffix(d)}`;

            // 會通標題自動帶入: (法人戶)/Fubon: Meeting with (研究員名稱), 會議時間, 會議日期
            if (emailSubjectEl) {
                emailSubjectEl.value = `${cleanFirm}/ Fubon: Meeting with ${analyst}, ${startTimeInfo.en}, ${englishDateStr}`;
            }

            // 模板自動帶入內容 (Dear elizabeth, Sherman Shang, 14:00 PM, April 4th)
            const greetingName = isGroup ? 'All' : clientFirstName;
            const bodyHTML = `Dear ${greetingName},<br><br>
We confirm your meeting with <strong>${analyst}</strong>, ${startTimeInfo.en}, ${englishDateStr}.<br><br>
Thank you.<br><br>
BR,<br>
Maggie`;

            if (emailBodyEl) {
                emailBodyEl.innerHTML = bodyHTML;
            }

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

    if (btnSaveCloseServiceEmail) {
        btnSaveCloseServiceEmail.addEventListener('click', () => {
            alert('✅ 服務會通草稿已儲存並關閉！');
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
        '#service':        'panel-records-list',
        '#new-service':    'panel-record-form',
        '#service-detail': 'panel-detail-service-record',
        '#analyst':        'panel-researchers',
        '#firm':           'panel-firms',
        '#client':         'panel-clients',
        '#activity':       'panel-event-calendar',
    };

    const applyHashTab = (overrideHash = null) => {
        let hash = (typeof overrideHash === 'string') ? overrideHash : window.location.hash;
        if (!hash || hash === '#' || hash === '') {
            hash = '#service';
        }
        let cleanHash = hash;
        if (cleanHash.includes('?')) {
            cleanHash = cleanHash.split('?')[0];
        }

        const queryParams = parseAllQueryParams();

        // Direct navigation to individual service record page (e.g. from homepage calendar)
        const serviceIdParam = queryParams.serviceId || queryParams.serviceRecordId;
        const isServiceDetailPage = (!overrideHash || overrideHash === '#service-detail') && 
                                    ((cleanHash === '#service-detail') || (Boolean(serviceIdParam) && cleanHash !== '#activity' && cleanHash !== '#new-service'));

        if (isServiceDetailPage) {
            if (btnServiceGroup) {
                btnServiceGroup.classList.add('active');
                if (btnEventGroup) btnEventGroup.classList.remove('active');
                if (subtabsService) subtabsService.style.display = 'flex';
                if (subtabsEvent) subtabsEvent.style.display = 'none';
            }
            if (typeof showIndividualServiceRecordPage === 'function') {
                showIndividualServiceRecordPage(serviceIdParam);
                return;
            }
        }

        // isNewServiceAction: when user arrives via #new-service, ?action=new-service, or has imported meeting stored
        const isNewServiceAction = (cleanHash === '#new-service') || 
                                   (queryParams.action === 'new-service') ||
                                   (window.location.href.includes('action=new-service')) ||
                                   (cleanHash !== '#service' && !!sessionStorage.getItem('crm_import_meeting'));

        // If clicking or visiting #service explicitly from the menu/navbar (without action=new-service), cancel/clear any imported meeting state
        if (cleanHash === '#service' && !isNewServiceAction) {
            sessionStorage.removeItem('crm_import_meeting');
            if (window.history && window.history.replaceState && window.location.search) {
                window.history.replaceState(null, '', window.location.pathname + '#service');
            }
        }

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

        let targetId = hashTabMap[cleanHash] || 'panel-records-list';
        if (isNewServiceAction) {
            targetId = 'panel-record-form';
        }
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
            const isFromHome = (cleanHash === '#new-service') || (queryParams.action === 'new-service') || window.location.href.includes('action=new-service') || !!sessionStorage.getItem('crm_import_meeting');
            showFormView(false, null, !isFromHome);
            if (isFromHome) {
                if (btnBackToList) {
                    btnBackToList.innerHTML = '← 返回首頁 (Home)';
                    btnBackToList.style.backgroundColor = '#0093C1';
                    btnBackToList.style.color = '#FFFFFF';
                }
                if (btnGoToMarketingList) {
                    btnGoToMarketingList.style.display = 'inline-flex';
                }
            } else {
                if (btnBackToList) {
                    btnBackToList.innerHTML = '← 返回列表';
                    btnBackToList.style.backgroundColor = '';
                    btnBackToList.style.color = '';
                }
                if (btnGoToMarketingList) {
                    btnGoToMarketingList.style.display = 'none';
                }
            }
        } else {
            hideAllPanels();
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.style.display = 'block';
            }
            if (btnBackToList) {
                btnBackToList.innerHTML = '← 返回列表';
                btnBackToList.style.backgroundColor = '';
                btnBackToList.style.color = '';
            }
            if (btnGoToMarketingList) {
                btnGoToMarketingList.style.display = 'none';
            }

            // User requirement: When navigating to 服務管理 (#service / panel-records-list), default directly to 明細 (Details) view
            if (targetId === 'panel-records-list') {
                const btnModeSummary = document.getElementById('btn-mode-summary');
                const btnModeDetails = document.getElementById('btn-mode-details');
                const summaryDashboardPanel = document.getElementById('summary-dashboard-panel');
                const detailsListPanel = document.getElementById('details-list-panel');

                if (btnModeSummary && btnModeDetails && summaryDashboardPanel && detailsListPanel) {
                    btnModeDetails.classList.add('active');
                    btnModeDetails.style.background = '#5C8ED6';
                    btnModeDetails.style.color = 'white';

                    btnModeSummary.classList.remove('active');
                    btnModeSummary.style.background = 'white';
                    btnModeSummary.style.color = '#374151';

                    detailsListPanel.style.display = 'block';
                    summaryDashboardPanel.style.display = 'none';

                    if (typeof refreshServiceRecordsTable === 'function') {
                        refreshServiceRecordsTable();
                    }
                }
            }

            // When navigating to 法人戶專頁 (#firm / panel-firms), refresh firm list table
            if (targetId === 'panel-firms') {
                if (typeof refreshFirmTable === 'function') {
                    refreshFirmTable();
                }
            }

            if (targetId === 'panel-researchers') {
                if (typeof refreshAnalystTable === 'function') {
                    refreshAnalystTable();
                }
            }

            if (targetId === 'panel-clients') {
                if (typeof refreshClientTable === 'function') {
                    refreshClientTable();
                }
            }

            // User requirement: When navigating to 單一客戶專頁 (panel-detail-client), render complete blueprint view (圖二)
            if (targetId === 'panel-detail-client') {
                renderClientDetailView('Elizabeth Li');
            }
        }
    };

    // ----------------------------------------------------
    // Mode Switch: Summary Dashboard vs Detail List (Option 2)
    // ----------------------------------------------------
    
    // --- Dynamic Mode Toggle for Individual Dashboards ---
    const roles = ['client', 'analyst'];
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
                <title>${item.name}: ${item.value} 分鐘 (${percent.toFixed(1)}%)</title>
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
                <span style="font-weight:600; color:#475569; margin-left:6px; flex-shrink:0;">${item.value} min (${Math.round(percent)}%)</span>
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
                <title>${cat} ${barLabel}: ${barVal} 分鐘</title>
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

    // ----------------------------------------------------
    // Shared Filter Logic for Top Filter Bar
    // ----------------------------------------------------
    function getFilteredServices() {
        const allServices = getAllServices();

        const startDateVal = document.getElementById('filter-date-start') ? document.getElementById('filter-date-start').value : '';
        const endDateVal = document.getElementById('filter-date-end') ? document.getElementById('filter-date-end').value : '';
        const coverageVal = document.getElementById('filter-coverage') ? document.getElementById('filter-coverage').value : '全部';
        const analystVal = document.getElementById('filter-analyst') ? document.getElementById('filter-analyst').value.trim().toLowerCase() : '全部';
        const firmVal = document.getElementById('filter-firm') ? document.getElementById('filter-firm').value.trim().toLowerCase() : '全部';
        const typeVal = document.getElementById('filter-type') ? document.getElementById('filter-type').value : '全部';
        const methodVal = document.getElementById('filter-method') ? document.getElementById('filter-method').value : '全部';
        const topicVal = document.getElementById('filter-topic') ? document.getElementById('filter-topic').value : '全部';
        const interestVal = document.getElementById('filter-interest') ? document.getElementById('filter-interest').value.trim().toLowerCase() : '';

        const startDate = startDateVal ? new Date(startDateVal) : null;
        const endDate = endDateVal ? new Date(endDateVal + 'T23:59:59') : null;

        return allServices.filter(s => {
            if (s.date) {
                const sDateStr = s.date.replace(/\//g, '-');
                const sDate = new Date(sDateStr);
                if (startDate && !isNaN(startDate.getTime()) && sDate < startDate) return false;
                if (endDate && !isNaN(endDate.getTime()) && sDate > endDate) return false;
            }
            if (coverageVal !== '全部') {
                if (coverageVal === 'Fubon Only') {
                    if (s.coverage !== 'Fubon' && s.coverage !== 'Fubon Only') return false;
                } else {
                    if (s.coverage !== coverageVal) return false;
                }
            }
            if (analystVal && analystVal !== '全部') {
                const zh = s.analyst ? s.analyst.toLowerCase() : '';
                if (!zh.includes(analystVal)) return false;
            }
            if (firmVal && firmVal !== '全部') {
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
            if (topicVal !== '全部') {
                const topicStr = s.topic ? s.topic.trim().toLowerCase() : '';
                const filterTopicStr = topicVal.trim().toLowerCase();
                if (!topicStr.includes(filterTopicStr) && !filterTopicStr.includes(topicStr)) return false;
            }
            if (interestVal) {
                const interestStr = s.interest ? s.interest.toLowerCase() : '';
                if (!interestStr.includes(interestVal)) return false;
            }
            return true;
        });
    }

    function bindQuickDatePresets() {
        document.querySelectorAll('.btn-quick-date').forEach(btn => {
            btn.addEventListener('click', () => {
                const range = btn.getAttribute('data-range');
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth(); // 0-11

                let startDate = '';
                let endDate = '';

                const formatDate = (d) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                };

                if (range === 'this-month') {
                    const start = new Date(year, month, 1);
                    const end = new Date(year, month + 1, 0);
                    startDate = formatDate(start);
                    endDate = formatDate(end);
                } else if (range === 'last-month') {
                    const start = new Date(year, month - 1, 1);
                    const end = new Date(year, month, 0);
                    startDate = formatDate(start);
                    endDate = formatDate(end);
                } else if (range === 'this-quarter') {
                    const qMonth = Math.floor(month / 3) * 3;
                    const start = new Date(year, qMonth, 1);
                    const end = new Date(year, qMonth + 3, 0);
                    startDate = formatDate(start);
                    endDate = formatDate(end);
                } else if (range === 'this-year') {
                    const start = new Date(year - 1, month, today.getDate());
                    const end = today;
                    startDate = formatDate(start);
                    endDate = formatDate(end);
                }

                const startInput = document.getElementById('filter-date-start');
                const endInput = document.getElementById('filter-date-end');
                if (startInput) startInput.value = startDate;
                if (endInput) endInput.value = endDate;

                document.querySelectorAll('.btn-quick-date').forEach(b => {
                    b.style.background = '#f1f5f9';
                    b.style.color = '#475569';
                    b.style.borderColor = '#cbd5e1';
                });
                btn.style.background = '#5C8ED6';
                btn.style.color = 'white';
                btn.style.borderColor = '#5C8ED6';

                refreshServiceRecordsTable();
                refreshDashboards();
            });
        });
    };

    bindQuickDatePresets();

    function refreshDashboards() {
        const services = getFilteredServices();
        
        // -------------------------
        // 1. CLIENT DASHBOARD DATA
        // -------------------------
        // Group by Firm / Client
        const clientHours = {};
        services.forEach(s => {
            const firm = s.firm || '其他';
            const min = parseFloat(s.duration || 0);
            clientHours[firm] = (clientHours[firm] || 0) + min;
        });
        
        const namedClients = Object.keys(clientHours).filter(k => k !== '其他').map(k => ({
            name: k,
            value: Math.round(clientHours[k])
        })).sort((a, b) => b.value - a.value);

        const existingOtherVal = Math.round(clientHours['其他'] || 0);

        // Rule: Show Top 10, summarize rest into '其他' (Others) at the end
        let clientHoursData;
        if (namedClients.length > 9) {
            const top9 = namedClients.slice(0, 9);
            const restSum = namedClients.slice(9).reduce((sum, item) => sum + item.value, 0) + existingOtherVal;
            clientHoursData = [...top9, { name: '其他', value: Math.round(restSum) }];
        } else if (existingOtherVal > 0) {
            clientHoursData = [...namedClients, { name: '其他', value: existingOtherVal }];
        } else {
            clientHoursData = namedClients;
        }

        drawDonutChart('client-pie-chart-wrapper', clientHoursData);

        // Bar Line Chart values matching clients
        const clientNames = clientHoursData.map(d => d.name);
        const clientBarVals = clientHoursData.map(d => d.value);
        // Mock Trade Volumes matching clients (Top 10 rule)
        const mockVols = { 
            'FMR': 6846840, 
            'Oasis': 5924100, 
            'AP Asset': 4232160, 
            'FSR': 3473940, 
            'Jefferies': 2850000, 
            'Fidelity': 2410000, 
            'BlackRock': 1950000, 
            'Vanguard': 1520000, 
            'Capital': 1180000, 
            'Cathay': 950000, 
            'Yuanta': 720000, 
            'Allianz': 480000,
            '其他': 320000 
        };
        const clientLineVals = clientNames.map(name => mockVols[name] || 500000);

        drawBarChart('client-bar-chart-wrapper', clientNames, clientBarVals, clientLineVals, '服務時數 (min)', '交易量 (USD)');

        // ROI Ranking Table calculation (Top 10 rule: 服務效益 = Volume / Hours)
        const clientTableBody = document.querySelector('#client-roi-table tbody');
        if (clientTableBody) {
            clientTableBody.innerHTML = '';
            let allRois = clientNames.map((name, idx) => {
                const hours = (clientBarVals[idx] || 60) / 60;
                const vol = clientLineVals[idx];
                const roi = Math.round(vol / (hours * 10));
                return { name, roi };
            });

            // 確保「其他」永遠排在最後一列 (Last Row)
            const namedRois = allRois.filter(item => item.name !== '其他').sort((a, b) => b.roi - a.roi);
            const otherItem = allRois.find(item => item.name === '其他');

            let finalRoiData;
            if (namedRois.length > 9) {
                const top9 = namedRois.slice(0, 9);
                const restRois = namedRois.slice(9);
                let otherSum = restRois.reduce((sum, item) => sum + item.roi, 0);
                let otherCount = restRois.length;
                if (otherItem) {
                    otherSum += otherItem.roi;
                    otherCount += 1;
                }
                const otherAvg = otherCount > 0 ? Math.round(otherSum / otherCount) : 0;
                finalRoiData = [...top9, { name: '其他', roi: otherAvg }];
            } else if (otherItem) {
                finalRoiData = [...namedRois, otherItem];
            } else {
                finalRoiData = namedRois;
            }

            finalRoiData.forEach(item => {
                clientTableBody.innerHTML += `
                <tr>
                    <td style="padding:6px; font-weight:600; text-align:center;">${item.name}</td>
                    <td style="padding:6px; text-align:right; font-weight:700; color:#0369A1;">${item.roi.toLocaleString()}</td>
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
            const min = parseFloat(s.duration || 0);
            salesHours[rep] = (salesHours[rep] || 0) + min;
            if (!salesClients[rep]) salesClients[rep] = new Set();
            if (s.firm) salesClients[rep].add(s.firm);
        });

        const namedSales = Object.keys(salesHours).filter(k => k !== '未分派' && k !== '其他').map(k => ({
            name: k,
            value: Math.round(salesHours[k])
        })).sort((a, b) => b.value - a.value);

        const unassignedSalesVal = Math.round((salesHours['未分派'] || 0) + (salesHours['其他'] || 0));
        const salesHoursData = unassignedSalesVal > 0 ? [...namedSales, { name: '未分派', value: unassignedSalesVal }] : namedSales;

        drawDonutChart('sales-pie-chart-wrapper', salesHoursData);

        const repNames = salesHoursData.map(d => d.name);
        const repBarVals = salesHoursData.map(d => d.value);
        const repClientCounts = repNames.map(name => salesClients[name] ? salesClients[name].size : 0);

        drawBarChart('sales-bar-chart-wrapper', repNames, repBarVals, repClientCounts, '累計時數 (min)', '服務客戶數');

        // Broker ranking table
        const salesTableBody = document.querySelector('#sales-ranking-table tbody');
        if (salesTableBody) {
            salesTableBody.innerHTML = '';
            repNames.forEach((name, idx) => {
                const hoursVal = repBarVals[idx] / 60;
                const score = Math.round((hoursVal * 40) + (repClientCounts[idx] * 20));
                salesTableBody.innerHTML += `
                <tr>
                    <td style="padding:6px; font-weight:600; text-align:center;">${name}</td>
                    <td style="padding:6px; text-align:right; font-weight:700; color:#0284C7;">${score} 分</td>
                </tr>`;
            });
        }

        // -------------------------
        // 2. ANALYST DASHBOARD DATA (圖一對齊: 服務時數占比圓餅圖 + 能量排行)
        // -------------------------
        const analystHours = {};
        services.forEach(s => {
            const raw = s.analyst || '未分派';
            const names = raw.split(/[,;、]/).map(x => x.trim()).filter(Boolean);
            const min = parseFloat(s.duration || 0);
            if (names.length === 0) {
                analystHours['未分派'] = (analystHours['未分派'] || 0) + min;
            } else {
                names.forEach(name => {
                    analystHours[name] = (analystHours[name] || 0) + min;
                });
            }
        });

        const namedAnalysts = Object.keys(analystHours).filter(k => k !== '未分派' && k !== '其他').map(k => ({
            name: k,
            value: Math.round(analystHours[k])
        })).sort((a, b) => b.value - a.value);

        const unassignedVal = Math.round((analystHours['未分派'] || 0) + (analystHours['其他'] || 0));
        const analystHoursData = unassignedVal > 0 ? [...namedAnalysts, { name: '未分派', value: unassignedVal }] : namedAnalysts;

        // Render Donut Chart for Analyst Service Hours Share (服務時數占比)
        drawDonutChart('analyst-pie-chart-wrapper', analystHoursData);

        // Render Ranking Table
        const analystTableBody = document.querySelector('#analyst-ranking-table tbody');
        if (analystTableBody) {
            analystTableBody.innerHTML = '';
            analystHoursData.forEach(item => {
                analystTableBody.innerHTML += `
                <tr>
                    <td style="padding:6px; font-weight:600; text-align:center;">${item.name}</td>
                    <td style="padding:6px; text-align:right; font-weight:700; color:#7C3AED;">${item.value} min</td>
                </tr>`;
            });
        }
    }

    // ----------------------------------------------------
    
    // ==========================================
    // Filter Analyst & Firm Dropdowns Population
    // ==========================================
    const populateFilterAnalystAndFirmDropdowns = () => {
        // 1. #filter-analyst
        const filterAnalystSelect = document.getElementById('filter-analyst');
        if (filterAnalystSelect) {
            const curVal = filterAnalystSelect.value || '全部';
            const services = getAllServices();
            const analystsFromServices = services.flatMap(s => (s.analyst || '').split(/[,;、]/).map(x => x.trim()).filter(Boolean));
            const analystsFromDB = (typeof getAllAnalysts === 'function' ? getAllAnalysts() : []).flatMap(a => [a.enName, a.zhName]).filter(Boolean);
            const standardAnalysts = ['Sherman Shang', 'Titan Wang', 'Rita Wu', '張研究員'];
            const allAnalystNames = Array.from(new Set([...standardAnalysts, ...analystsFromServices, ...analystsFromDB]))
                .filter(name => name && name !== '未分派')
                .sort((a, b) => a.localeCompare(b, 'zh-Hant'));

            filterAnalystSelect.innerHTML = '<option value="全部">全部</option>';
            allAnalystNames.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                filterAnalystSelect.appendChild(opt);
            });

            if (curVal === '全部' || allAnalystNames.includes(curVal)) {
                filterAnalystSelect.value = curVal;
            } else {
                filterAnalystSelect.value = '全部';
            }
        }

        // 2. #filter-firm
        const filterFirmSelect = document.getElementById('filter-firm');
        if (filterFirmSelect) {
            const curVal = filterFirmSelect.value || '全部';
            const services = getAllServices();
            const firmsFromServices = services.flatMap(s => (s.firm || '').split(/[,;、]/).map(x => x.trim()).filter(Boolean));
            const firmsFromDB = (typeof getAllFirms === 'function' ? getAllFirms() : []).map(f => f.name).filter(Boolean);
            const standardFirms = ['FMR', 'Oasis', 'AP Asset', 'BlackRock', 'Capital', 'Cathay', 'CITI', 'GIC', 'HSBC', 'FSR', 'Jefferies', 'Fidelity', 'Vanguard', 'Yuanta', 'Allianz'];
            const allFirmNames = Array.from(new Set([...standardFirms, ...firmsFromServices, ...firmsFromDB]))
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b, 'zh-Hant'));

            filterFirmSelect.innerHTML = '<option value="全部">全部</option>';
            allFirmNames.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                filterFirmSelect.appendChild(opt);
            });

            if (curVal === '全部' || allFirmNames.includes(curVal)) {
                filterFirmSelect.value = curVal;
            } else {
                filterFirmSelect.value = '全部';
            }
        }

        // Bind auto change filtering
        ['filter-coverage', 'filter-analyst', 'filter-firm', 'filter-type', 'filter-method', 'filter-topic'].forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.hasAttribute('data-filter-bound')) {
                el.setAttribute('data-filter-bound', 'true');
                el.addEventListener('change', () => {
                    refreshServiceRecordsTable();
                    refreshDashboards();
                });
            }
        });
    };

    // ==========================================
    // Interaction Options Dropdown & Manager Logic
    // ==========================================
    const populateInteractionDropdowns = () => {
        const types = getInteractionTypes();
        const methods = getInteractionMethods();

        // 1. #filter-type
        const filterTypeSelect = document.getElementById('filter-type');
        if (filterTypeSelect) {
            const curVal = filterTypeSelect.value || '全部';
            filterTypeSelect.innerHTML = '<option value="全部">全部</option>';
            types.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                filterTypeSelect.appendChild(opt);
            });
            if (curVal === '全部' || types.includes(curVal)) {
                filterTypeSelect.value = curVal;
            } else {
                filterTypeSelect.value = '全部';
            }
        }

        // 2. #filter-method
        const filterMethodSelect = document.getElementById('filter-method');
        if (filterMethodSelect) {
            const curVal = filterMethodSelect.value || '全部';
            filterMethodSelect.innerHTML = '<option value="全部">全部</option>';
            methods.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                filterMethodSelect.appendChild(opt);
            });
            if (curVal === '全部' || methods.includes(curVal)) {
                filterMethodSelect.value = curVal;
            } else {
                filterMethodSelect.value = '全部';
            }
        }

        // 3. #record-type
        const recordTypeSelect = document.getElementById('record-type');
        if (recordTypeSelect) {
            const curVal = recordTypeSelect.value;
            recordTypeSelect.innerHTML = '';
            types.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                recordTypeSelect.appendChild(opt);
            });
            if (curVal && types.includes(curVal)) {
                recordTypeSelect.value = curVal;
            } else if (types.length > 0) {
                recordTypeSelect.value = types[0];
            }
        }

        // 4. #record-method
        const recordMethodSelect = document.getElementById('record-method');
        if (recordMethodSelect) {
            const curVal = recordMethodSelect.value;
            recordMethodSelect.innerHTML = '';
            methods.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                recordMethodSelect.appendChild(opt);
            });
            if (curVal && methods.includes(curVal)) {
                recordMethodSelect.value = curVal;
            } else if (methods.length > 0) {
                recordMethodSelect.value = methods[0];
            }
        }

        // 5. #medit-type
        const meditTypeSelect = document.getElementById('medit-type');
        if (meditTypeSelect) {
            const curVal = meditTypeSelect.value;
            meditTypeSelect.innerHTML = '';
            types.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                meditTypeSelect.appendChild(opt);
            });
            if (curVal && types.includes(curVal)) {
                meditTypeSelect.value = curVal;
            } else if (types.length > 0) {
                meditTypeSelect.value = types[0];
            }
        }

        // 6. #medit-method
        const meditMethodSelect = document.getElementById('medit-method');
        if (meditMethodSelect) {
            const curVal = meditMethodSelect.value;
            meditMethodSelect.innerHTML = '';
            methods.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                meditMethodSelect.appendChild(opt);
            });
            if (curVal && methods.includes(curVal)) {
                meditMethodSelect.value = curVal;
            } else if (methods.length > 0) {
                meditMethodSelect.value = methods[0];
            }
        }
    };

    const initInteractionOptionsManager = () => {
        const modal = document.getElementById('modal-manage-interaction-options');
        if (!modal) return;

        let tempTypes = [];
        let tempMethods = [];
        let tempTopics = [];

        const listTypesContainer = document.getElementById('list-types-container');
        const listMethodsContainer = document.getElementById('list-methods-container');
        const listTopicsContainer = document.getElementById('list-topics-container');

        const inputNewType = document.getElementById('input-new-type');
        const inputNewMethod = document.getElementById('input-new-method');
        const inputNewTopic = document.getElementById('input-new-topic');

        const btnAddTypePlus = document.getElementById('btn-add-type-plus');
        const btnAddMethodPlus = document.getElementById('btn-add-method-plus');
        const btnAddTopicPlus = document.getElementById('btn-add-topic-plus');

        const btnConfirm = document.getElementById('btn-confirm-manage-options');
        const btnCancel = document.getElementById('btn-cancel-manage-options');

        const renderCategoryList = (container, list, categoryKey) => {
            if (!container) return;
            container.innerHTML = '';
            list.forEach((item, index) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '12px';
                row.style.fontSize = '15px';
                row.style.color = '#1E293B';
                row.style.padding = '3px 0';

                row.innerHTML = `
                    <span class="btn-del-opt" data-cat="${categoryKey}" data-index="${index}" style="cursor: pointer; font-size: 14px; font-weight: bold; color: #1E293B; width: 14px; text-align: center; user-select: none;" title="點擊刪除此項目">x</span>
                    <span>${item}</span>
                `;

                const delBtn = row.querySelector('.btn-del-opt');
                if (delBtn) {
                    delBtn.addEventListener('click', () => {
                        if (list.length <= 1) {
                            alert('選單中至少須保留一個選項！');
                            return;
                        }
                        if (confirm(`確定要刪除「${item}」選項嗎？`)) {
                            list.splice(index, 1);
                            renderAll();
                        }
                    });
                }
                container.appendChild(row);
            });
        };

        const renderAll = () => {
            renderCategoryList(listTypesContainer, tempTypes, 'type');
            renderCategoryList(listMethodsContainer, tempMethods, 'method');
            renderCategoryList(listTopicsContainer, tempTopics, 'topic');
        };

        const addFromInput = (inputEl, targetList) => {
            if (!inputEl) return;
            const val = inputEl.value.trim();
            if (!val) return;
            if (targetList.some(x => x.toLowerCase() === val.toLowerCase())) {
                alert(`「${val}」選項已存在！`);
                inputEl.focus();
                return;
            }
            targetList.push(val);
            inputEl.value = '';
            renderAll();
            inputEl.focus();
        };

        if (btnAddTypePlus && inputNewType) {
            btnAddTypePlus.onclick = () => addFromInput(inputNewType, tempTypes);
            inputNewType.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addFromInput(inputNewType, tempTypes);
                }
            };
        }

        if (btnAddMethodPlus && inputNewMethod) {
            btnAddMethodPlus.onclick = () => addFromInput(inputNewMethod, tempMethods);
            inputNewMethod.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addFromInput(inputNewMethod, tempMethods);
                }
            };
        }

        if (btnAddTopicPlus && inputNewTopic) {
            btnAddTopicPlus.onclick = () => addFromInput(inputNewTopic, tempTopics);
            inputNewTopic.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addFromInput(inputNewTopic, tempTopics);
                }
            };
        }

        const openModal = (targetTab) => {
            tempTypes = [...getInteractionTypes()];
            tempMethods = [...getInteractionMethods()];
            tempTopics = [...getTopicOptions()];
            renderAll();
            modal.style.display = 'flex';
            modal.classList.add('show');
            if (targetTab === 'topic' && inputNewTopic) {
                setTimeout(() => inputNewTopic.focus(), 100);
            } else if (targetTab === 'method' && inputNewMethod) {
                setTimeout(() => inputNewMethod.focus(), 100);
            } else if (inputNewType) {
                setTimeout(() => inputNewType.focus(), 100);
            }
        };

        const closeModal = () => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        };

        if (btnConfirm) {
            btnConfirm.onclick = () => {
                saveInteractionTypes(tempTypes);
                saveInteractionMethods(tempMethods);
                saveTopicOptions(tempTopics);
                closeModal();
                alert('✅ 服務管理選單項目已成功更新並儲存！');
            };
        }

        if (btnCancel) {
            btnCancel.onclick = closeModal;
        }

        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        // 綁定所有開啟按鈕
        const btnOpenModal = document.getElementById('btn-open-options-modal');
        if (btnOpenModal) {
            btnOpenModal.onclick = () => openModal('type');
        }

        document.querySelectorAll('.btn-trigger-options-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tab = btn.getAttribute('data-tab') || 'type';
                openModal(tab);
            });
        });
    };

    // ----------------------------------------------------
    // 動態服務名稱運算 (依據截圖: ticker or topic, ticker優先)
    // ----------------------------------------------------
    const updateDynamicServiceName = () => {
        const serviceNameInput = document.getElementById('record-service-name');
        const topicEl = document.getElementById('record-topic');
        const interestEl = document.getElementById('record-interest');
        const firmEl = document.getElementById('record-firm');
        const dateEl = document.getElementById('record-date');

        const topicVal = topicEl ? topicEl.value.trim() : '';
        const interestVal = interestEl ? interestEl.value.trim() : '';
        const firmVal = firmEl ? firmEl.value.replace(' (選單)', '').trim() : 'FMR';
        const dateVal = dateEl ? dateEl.value : '';

        let dateFormatted = '8/10';
        if (dateVal) {
            const parts = dateVal.split('-');
            if (parts.length === 3) {
                dateFormatted = `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
            }
        }

        const autoDefault = `${firmVal || 'FMR'} ${dateFormatted} ${interestVal || '2330 TT'}`;

        const sampleAutoName = document.getElementById('sample-auto-name');
        if (sampleAutoName) {
            sampleAutoName.textContent = autoDefault;
        }

        if (serviceNameInput) {
            serviceNameInput.placeholder = '';
        }
    };

    // 頂部「服務名稱」(使用者自己key in) 與 表單「主題」(Topic) 各自獨立
    const serviceNameInput = document.getElementById('record-service-name');
    const topicInput = document.getElementById('record-topic');
    if (serviceNameInput) {
        serviceNameInput.addEventListener('input', () => {
            updateFormHeaderTitle();
        });
        serviceNameInput.addEventListener('change', () => {
            updateFormHeaderTitle();
        });
    }
    if (topicInput) {
        topicInput.addEventListener('input', () => {
            updateDynamicServiceName();
            updateFormHeaderTitle();
        });
        topicInput.addEventListener('change', () => {
            updateDynamicServiceName();
            updateFormHeaderTitle();
        });
    }

    // 綁定動態服務名稱計算監聽器
    ['record-service-name', 'record-topic', 'record-interest', 'record-firm', 'record-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateDynamicServiceName);
            el.addEventListener('change', updateDynamicServiceName);
        }
    });

    // ----------------------------------------------------
    // 服務管理表單欄位排序系統 (預設依日期由近至遠)
    // ----------------------------------------------------
    let currentServiceSort = {
        key: 'date',
        direction: 'desc' // 預設由近至遠 (降冪)
    };

    const sortServiceRecords = (list, key, direction) => {
        if (!key || !Array.isArray(list)) return list;
        return [...list].sort((a, b) => {
            if (key === 'date') {
                const dateA = (a.date || '').replace(/\//g, '-');
                const dateB = (b.date || '').replace(/\//g, '-');
                const timeA = (a.time || '00:00').padStart(5, '0');
                const timeB = (b.time || '00:00').padStart(5, '0');
                const dtA = `${dateA} ${timeA}`;
                const dtB = `${dateB} ${timeB}`;
                const cmp = dtA.localeCompare(dtB);
                return direction === 'asc' ? cmp : -cmp;
            }
            if (key === 'followUp') {
                const pinA = pinnedServiceIds.includes(a.id) ? 1 : 0;
                const pinB = pinnedServiceIds.includes(b.id) ? 1 : 0;
                return direction === 'asc' ? pinA - pinB : pinB - pinA;
            }
            if (key === 'duration') {
                const numA = parseFloat(a.duration) || 0;
                const numB = parseFloat(b.duration) || 0;
                return direction === 'asc' ? numA - numB : numB - numA;
            }
            let valA = '';
            let valB = '';
            if (key === 'serviceName') {
                valA = a.serviceName || (typeof getServiceName === 'function' ? getServiceName(a) : (a.topic || ''));
                valB = b.serviceName || (typeof getServiceName === 'function' ? getServiceName(b) : (b.topic || ''));
            } else if (key === 'analystEmail') {
                valA = a.analystEmail || (a.analyst && typeof getAnalystEmail === 'function' ? getAnalystEmail(a.analyst) : '');
                valB = b.analystEmail || (b.analyst && typeof getAnalystEmail === 'function' ? getAnalystEmail(b.analyst) : '');
            } else if (key === 'salesTrader') {
                valA = a.salesTrader || (a.sales === 'Charlie Zhao' ? 'Jason Chang' : (a.sales === 'Ann Liao' ? 'Terry' : 'David Lin'));
                valB = b.salesTrader || (b.sales === 'Charlie Zhao' ? 'Jason Chang' : (b.sales === 'Ann Liao' ? 'Terry' : 'David Lin'));
            } else {
                valA = a[key] || '';
                valB = b[key] || '';
            }
            valA = String(valA).trim();
            valB = String(valB).trim();
            const cmp = valA.localeCompare(valB, 'zh-Hant', { numeric: true, sensitivity: 'base' });
            return direction === 'asc' ? cmp : -cmp;
        });
    };

    const updateSortHeaderUI = () => {
        document.querySelectorAll('#service-records-table thead th[data-sort-key]').forEach(th => {
            const key = th.getAttribute('data-sort-key');
            const icon = th.querySelector('.sort-icon');
            if (key === currentServiceSort.key) {
                th.classList.add('sort-active');
                if (icon) {
                    icon.textContent = currentServiceSort.direction === 'asc' ? '▲' : '▼';
                    icon.style.color = '#0284c7';
                    icon.style.fontWeight = 'bold';
                }
            } else {
                th.classList.remove('sort-active');
                if (icon) {
                    icon.textContent = '⇅';
                    icon.style.color = '#94A3B8';
                    icon.style.fontWeight = 'normal';
                }
            }
        });
    };

    const bindTableSortEvents = () => {
        document.querySelectorAll('#service-records-table thead th[data-sort-key]').forEach(th => {
            th.addEventListener('click', () => {
                const key = th.getAttribute('data-sort-key');
                if (currentServiceSort.key === key) {
                    // 同一欄位：切換升冪 / 降冪
                    currentServiceSort.direction = currentServiceSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    // 切換新欄位：日期預設由近至遠 (desc)，其餘欄位預設升冪 (asc)
                    currentServiceSort.key = key;
                    currentServiceSort.direction = (key === 'date') ? 'desc' : 'asc';
                }
                updateSortHeaderUI();
                refreshServiceRecordsTable();
            });
        });
    };

    // ----------------------------------------------------
    const refreshServiceRecordsTable = () => {
        const tbody = document.querySelector('#service-records-table tbody');
        if (!tbody) return;

        let filtered = getFilteredServices();

        // 依目前設定的欄位與順序進行排序（預設依日期由近至遠）
        if (currentServiceSort && currentServiceSort.key) {
            filtered = sortServiceRecords(filtered, currentServiceSort.key, currentServiceSort.direction);
        }

        tbody.innerHTML = '';
        filtered.forEach(record => {
            const tr = document.createElement('tr');
            tr.className = 'record-row';
            tr.setAttribute('data-id', record.id);
            
            // Determine trader
            const trader = record.salesTrader || (record.sales === 'Charlie Zhao' ? 'Jason Chang' : (record.sales === 'Ann Liao' ? 'Terry' : 'David Lin'));
            const createDateVal = record.createDate || record.date;

            const isPinned = pinnedServiceIds.includes(record.id);
            const svcName = record.serviceName || (typeof getServiceName === 'function' ? getServiceName(record) : (record.topic || '服務紀錄'));
            tr.innerHTML = `
                <td style="text-align: center;"><button class="service-pin-btn" data-id="${record.id}" style="background:none; border:none; font-size:18px; cursor:pointer; color:${isPinned ? '#f1c40f' : '#94A3B8'};">${isPinned ? '★' : '☆'}</button></td>
                <td>${record.date}</td>
                <td><span class="text-link trigger-form" style="font-weight: 700; color: #0284c7; cursor: pointer;" title="點擊編輯此筆服務">${svcName}</span></td>
                <td><span class="text-link trigger-form" style="color: #334155; cursor: pointer;">${record.topic || '—'}</span></td>
                <td><span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 600;">${record.interest || '—'}</span></td>
                <td>${(record.firm || '').split(/[,;、]/).map(s => s.trim()).filter(Boolean).map(f => `<span class="text-link trigger-firm" style="color: #0284c7; font-weight: 600; cursor: pointer; text-decoration: underline; margin-right: 4px;">${f}</span>`).join('') || '—'}</td>
                <td>${(record.client || '').split(/[,;、]/).map(s => s.trim()).filter(Boolean).map(c => `<span class="text-link trigger-client" style="color: #0284c7; font-weight: 600; cursor: pointer; text-decoration: underline; margin-right: 4px;">${c}</span>`).join('') || '—'}</td>
                <td>${(record.analyst || '').split(/[,;、]/).map(s => s.trim()).filter(Boolean).map(name => `<span class="text-link trigger-researcher" style="color: #0284c7; font-weight: 600; cursor: pointer; text-decoration: underline; margin-right: 4px;">${name}</span>`).join('') || '—'}</td>
                <td>${record.sales || ''}</td>
                <td>${trader}</td>
                <td>${record.coverage || ''}</td>
                <td>${record.type || ''}</td>
                <td>${record.method || ''}</td>
                <td>${record.duration ? `${record.duration} min` : ''}</td>
                <td>${record.format || ''}</td>
                <td>${record.time || ''}</td>
                <td><span class="text-link">${record.email || ''}</span></td>
                <td>${(record.analystEmail || (record.analyst ? getAnalystEmail(record.analyst) : '')).split(/[,;]/).map(s => s.trim()).filter(Boolean).map(em => `<span class="text-link trigger-researcher" style="font-family: monospace; font-size: 11px; margin-right: 4px;">${em}</span>`).join(' ') || '—'}</td>
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
        btnSearchRecords.addEventListener('click', () => {
            refreshServiceRecordsTable();
            refreshDashboards();
        });
    }
    if (btnResetFilters) {
        btnResetFilters.addEventListener('click', () => {
            if (document.getElementById('filter-date-start')) document.getElementById('filter-date-start').value = '';
            if (document.getElementById('filter-date-end')) document.getElementById('filter-date-end').value = '';
            if (document.getElementById('filter-coverage')) document.getElementById('filter-coverage').value = '全部';
            if (document.getElementById('filter-analyst')) document.getElementById('filter-analyst').value = '全部';
            if (document.getElementById('filter-firm')) document.getElementById('filter-firm').value = '全部';
            if (document.getElementById('filter-type')) document.getElementById('filter-type').value = '全部';
            if (document.getElementById('filter-method')) document.getElementById('filter-method').value = '全部';
            if (document.getElementById('filter-topic')) document.getElementById('filter-topic').value = '全部';
            if (document.getElementById('filter-interest')) document.getElementById('filter-interest').value = '';

            document.querySelectorAll('.btn-quick-date').forEach(b => {
                b.style.background = '#f1f5f9';
                b.style.color = '#475569';
                b.style.borderColor = '#cbd5e1';
            });

            currentServiceSort = { key: 'date', direction: 'desc' };
            updateSortHeaderUI();
            refreshServiceRecordsTable();
            refreshDashboards();
        });
    }

    // Reset filters on initial load to prevent browser cache/autofill corruption
    if (document.getElementById('filter-date-start')) document.getElementById('filter-date-start').value = '';
    if (document.getElementById('filter-date-end')) document.getElementById('filter-date-end').value = '';
    if (document.getElementById('filter-coverage')) document.getElementById('filter-coverage').value = '全部';
    if (document.getElementById('filter-analyst')) document.getElementById('filter-analyst').value = '全部';
    if (document.getElementById('filter-firm')) document.getElementById('filter-firm').value = '全部';
    if (document.getElementById('filter-type')) document.getElementById('filter-type').value = '全部';
    if (document.getElementById('filter-method')) document.getElementById('filter-method').value = '全部';
    if (document.getElementById('filter-topic')) document.getElementById('filter-topic').value = '全部';
    if (document.getElementById('filter-interest')) document.getElementById('filter-interest').value = '';

    // Trigger dashboard and table render on load
    try {
        refreshDashboards();
    } catch (e) {
        console.warn("Non-fatal: Failed to refresh dashboards on load:", e);
    }

    try {
        bindTableSortEvents();
        updateSortHeaderUI();
        refreshServiceRecordsTable();
    } catch (e) {
        console.error("Fatal: Failed to refresh service records table on load:", e);
    }

    try {
        renderFirmDetailView('FMR');
    } catch (e) {
        console.warn("Non-fatal: Failed to pre-render firm detail view on load:", e);
    }

    try {
        renderClientDetailView('Elizabeth Li');
    } catch (e) {
        console.warn("Non-fatal: Failed to pre-render client detail view on load:", e);
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

    // Initialize dynamic interaction options and manager modal
    populateFilterAnalystAndFirmDropdowns();
    populateInteractionDropdowns();
    populateTopicDropdowns();
    updateDynamicServiceName();
    initInteractionOptionsManager();

    // Initial load for pending bookings
    refreshPendingBookingsUI();

    // Apply on initial load
    applyHashTab();

    // Handle in-page hash navigation
    window.addEventListener('hashchange', () => applyHashTab());

    // Delegated click handlers for Service Record Detail Page buttons
    document.addEventListener('click', (e) => {
        // Edit Service Record Button
        const editSrecBtn = e.target.closest('.btn-edit-srec-record');
        if (editSrecBtn) {
            e.preventDefault();
            e.stopPropagation();
            const serviceId = editSrecBtn.getAttribute('data-service-id') || 
                              editSrecBtn.closest('[data-service-id]')?.getAttribute('data-service-id') ||
                              activeDrawerRecordId;
            openServiceRecordEditModal(serviceId);
            return;
        }

        // Add Interview Note Button or Empty Add Button
        const addInoteBtn = e.target.closest('.btn-add-interview-note') || e.target.closest('.btn-inote-empty-add');
        if (addInoteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const serviceId = addInoteBtn.getAttribute('data-service-id') || 
                              addInoteBtn.closest('[data-service-id]')?.getAttribute('data-service-id') ||
                              activeDrawerRecordId;
            openInterviewModal(serviceId);
            return;
        }

        // Voice Quick Note Button or Empty Voice Button
        const voiceQuickBtn = e.target.closest('.btn-voice-quick-note') || e.target.closest('.btn-inote-empty-voice');
        if (voiceQuickBtn) {
            e.preventDefault();
            e.stopPropagation();
            const serviceId = voiceQuickBtn.getAttribute('data-service-id') || 
                              voiceQuickBtn.closest('[data-service-id]')?.getAttribute('data-service-id') ||
                              activeDrawerRecordId;
            openInterviewModal(serviceId);
            setTimeout(() => startVoiceDictation('inote'), 250);
            return;
        }
    });

    // Global navigation handler for navbar and internal links on marketing.html
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        
        const isCurrentMarketing = window.location.pathname.includes('marketing.html') || window.location.pathname.endsWith('/');
        if (!isCurrentMarketing) return;

        // Check if this link points to marketing.html or an internal anchor hash
        if (href === 'marketing.html' || href.startsWith('marketing.html#') || href.startsWith('#')) {
            let targetHash = '#service';
            if (href.includes('#')) {
                targetHash = '#' + href.split('#')[1];
            }

            e.preventDefault();

            if (targetHash === '#service') {
                sessionStorage.removeItem('crm_import_meeting');
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname + '#service');
                } else {
                    window.location.hash = '#service';
                }
                applyHashTab('#service');
            } else if (targetHash === '#new-service') {
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname + '#new-service');
                } else {
                    window.location.hash = '#new-service';
                }
                applyHashTab('#new-service');
            } else {
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname + targetHash);
                } else {
                    window.location.hash = targetHash;
                }
                applyHashTab(targetHash);
            }

            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });


    } catch (e) {
        console.error('CRITICAL INIT ERROR:', e);
    }
});



    // ====================================================
    // Universal Excel (CSV with UTF-8 BOM) Import & Export Engine
    // ====================================================

    const EXCEL_SCHEMAS = {
        service: {
            title: '服務管理明細',
            filename: '服務管理明細',
            headers: [
                { key: 'followUp', label: '追蹤' },
                { key: 'date', label: '日期' },
                { key: 'serviceName', label: '服務名稱' },
                { key: 'topic', label: '主題' },
                { key: 'interest', label: '個股' },
                { key: 'firm', label: '法人戶' },
                { key: 'client', label: '主要客戶' },
                { key: 'analyst', label: '主談研究員' },
                { key: 'sales', label: '營業員' },
                { key: 'salesTrader', label: '業務交易員' },
                { key: 'coverage', label: '客群' },
                { key: 'type', label: '互動類型' },
                { key: 'method', label: '互動方法' },
                { key: 'duration', label: '時數(分)' },
                { key: 'format', label: '形式' },
                { key: 'time', label: '時間' },
                { key: 'email', label: '客戶Email' },
                { key: 'analystEmail', label: '研究員Email' },
                { key: 'notes', label: '備註說明' }
            ],
            getData: () => {
                let list = typeof getFilteredServices === 'function' ? getFilteredServices() : getAllServices();
                if (typeof sortServiceRecords === 'function' && currentServiceSort && currentServiceSort.key) {
                    list = sortServiceRecords(list, currentServiceSort.key, currentServiceSort.direction);
                }
                return list.map(item => ({
                    ...item,
                    serviceName: item.serviceName || (typeof getServiceName === 'function' ? getServiceName(item) : (item.topic || ''))
                }));
            },
            sample: {
                followUp: '是',
                date: '2026/09/15',
                serviceName: 'FMR 9/15 2330 TT',
                topic: 'TSMC 3Q Preview',
                interest: '2330 TT',
                firm: 'FMR',
                client: 'Elizabeth Li',
                analyst: 'Sherman Shang',
                sales: 'Charlie Zhao',
                salesTrader: 'Jason Chang',
                coverage: 'Fubon',
                type: 'One off client meeting',
                method: 'In Person',
                duration: '60',
                format: '1x1',
                time: '14:00',
                email: 'elizabeth.li@fmr.com',
                analystEmail: 'Sherman.shang@fubon.com',
                notes: '重點討論 2nm 擴產進度'
            },
            saveImported: (rows) => {
                rows.forEach(r => {
                    const id = `service-custom-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                    const dateVal = r['日期'] || r['date'] || '2026/09/09';
                    const topicVal = r['主題'] || r['topic'] || '新增會議服務';
                    const interestVal = r['個股'] || r['interest'] || '';
                    const firmVal = r['法人戶'] || r['firm'] || 'FMR';
                    const rawSvcName = r['服務名稱'] || r['serviceName'] || '';
                    const svcName = rawSvcName || (typeof getServiceName === 'function' ? getServiceName({ firm: firmVal, date: dateVal, interest: interestVal, topic: topicVal }) : topicVal);
                    const newService = {
                        id,
                        serviceName: svcName,
                        date: dateVal,
                        topic: topicVal,
                        interest: interestVal,
                        firm: firmVal,
                        client: r['主要客戶'] || r['客戶'] || r['client'] || 'Elizabeth Li',
                        analyst: r['主談研究員'] || r['研究員'] || r['analyst'] || 'Sherman Shang',
                        sales: r['營業員'] || r['sales'] || 'Charlie Zhao',
                        salesTrader: r['業務交易員'] || r['交易員'] || r['salesTrader'] || 'Jason Chang',
                        coverage: r['客群'] || r['coverage'] || 'Fubon',
                        type: r['互動類型'] || r['type'] || 'One off client meeting',
                        method: r['互動方法'] || r['method'] || 'In Person',
                        duration: r['時數(分)'] || r['時數'] || r['時長(分)'] || r['時長'] || r['duration'] || '30',
                        format: r['形式'] || r['format'] || '1x1',
                        time: r['時間'] || r['time'] || '10:00',
                        email: r['客戶Email'] || r['email'] || '',
                        analystEmail: r['研究員Email'] || r['analystEmail'] || (typeof getAnalystEmail === 'function' ? getAnalystEmail(r['主談研究員'] || r['analyst']) : ''),
                        notes: r['備註說明'] || r['notes'] || ''
                    };
                    customServices.unshift(newService);
                    if ((r['追蹤'] || r['followUp'] || '').includes('是') || (r['追蹤'] || '').includes('★') || (r['追蹤'] || '').toLowerCase() === 'true') {
                        if (!pinnedServiceIds.includes(id)) pinnedServiceIds.push(id);
                    }
                });
                localStorage.setItem('crm_custom_services', JSON.stringify(customServices));
                localStorage.setItem('crm_pinned_services_ids', JSON.stringify(pinnedServiceIds));
                if (typeof refreshServiceRecordsTable === 'function') refreshServiceRecordsTable();
                if (typeof refreshDashboards === 'function') refreshDashboards();
            }
        },
        firm: {
            title: '法人戶列表',
            filename: '法人戶列表',
            headers: [
                { key: 'org', label: '組織' },
                { key: 'name', label: '總歸戶/法人戶' },
                { key: 'coverage', label: '客群' },
                { key: 'note1', label: '註記1' },
                { key: 'note2', label: '註記2' },
                { key: 'note3', label: '註記3' },
                { key: 'count', label: '服務會議次數' },
                { key: 'hours', label: '總時數' }
            ],
            getData: () => typeof getAllFirms === 'function' ? getAllFirms() : DEFAULT_FIRMS,
            sample: {
                org: '外法',
                name: 'Morgan Stanley Asset',
                coverage: 'Jefferies/Fubon',
                note1: 'HK, NY',
                note2: 'Long Only',
                note3: 'Tier 1',
                count: '5',
                hours: '4.5'
            },
            saveImported: (rows) => {
                rows.forEach(r => {
                    const name = r['總歸戶/法人戶'] || r['法人戶'] || r['name'];
                    if (!name) return;
                    const id = `firm-custom-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                    const newFirm = {
                        id,
                        org: r['組織'] || r['org'] || '外法',
                        name: name.trim(),
                        coverage: r['客群'] || r['coverage'] || 'Fubon Only',
                        note1: r['註記1'] || r['note1'] || '',
                        note2: r['註記2'] || r['note2'] || 'Long Only',
                        note3: r['註記3'] || r['note3'] || 'Tier 2'
                    };
                    customFirms.push(newFirm);
                });
                localStorage.setItem('crm_custom_firms', JSON.stringify(customFirms));
                if (typeof refreshFirmTable === 'function') refreshFirmTable();
            }
        },
        analyst: {
            title: '研究員列表',
            filename: '研究員列表',
            headers: [
                { key: 'zhName', label: '中文姓名' },
                { key: 'enName', label: '英文姓名' },
                { key: 'phone', label: '連絡電話' },
                { key: 'email', label: 'E-mail' },
                { key: 'sector', label: '負責產業' },
                { key: 'coverage', label: '客群Coverage' }
            ],
            getData: () => typeof getAllAnalysts === 'function' ? getAllAnalysts() : DEFAULT_ANALYSTS,
            sample: {
                zhName: '陳研究員',
                enName: 'Alex Chen',
                phone: '02-8789-8888 ext 9033',
                email: 'alex.chen@fubon.com',
                sector: '綠能與儲能',
                coverage: 'ESG'
            },
            saveImported: (rows) => {
                rows.forEach(r => {
                    const enName = r['英文姓名'] || r['enName'] || r['Name (EN)'];
                    const zhName = r['中文姓名'] || r['zhName'] || r['Name (ZH)'];
                    if (!enName && !zhName) return;
                    const id = `analyst-custom-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                    const newAnalyst = {
                        id,
                        zhName: zhName || enName,
                        enName: enName || zhName,
                        phone: r['連絡電話'] || r['phone'] || '02-8789-8888',
                        email: r['E-mail'] || r['email'] || `${(enName||zhName).toLowerCase().replace(/\s+/g, '.')}@fubon.com`,
                        sector: r['負責產業'] || r['sector'] || '產業一般',
                        coverage: r['客群Coverage'] || r['coverage'] || 'General'
                    };
                    customAnalysts.push(newAnalyst);
                });
                localStorage.setItem('crm_custom_analysts', JSON.stringify(customAnalysts));
                if (typeof refreshAnalystTable === 'function') refreshAnalystTable();
            }
        },
        client: {
            title: '客戶專頁名單',
            filename: '客戶專頁名單',
            headers: [
                { key: 'name', label: '客戶姓名' },
                { key: 'firm', label: '法人戶' },
                { key: 'title', label: '職稱' },
                { key: 'email', label: 'E-mail' },
                { key: 'phone', label: '連絡電話' },
                { key: 'region', label: '地區' },
                { key: 'sales', label: '營業員' },
                { key: 'trader', label: '業務交易員' }
            ],
            getData: () => typeof getAllClients === 'function' ? getAllClients() : DEFAULT_CLIENTS,
            sample: {
                name: 'Michael Scott',
                firm: 'FMR',
                title: 'Senior Portfolio Manager',
                email: 'michael.scott@fmr.com',
                phone: '852-9999-9999',
                region: 'HK',
                sales: 'Charlie Zhao',
                trader: 'Jason Chang'
            },
            saveImported: (rows) => {
                rows.forEach(r => {
                    const name = r['客戶姓名'] || r['name'] || r['Client Name'];
                    if (!name) return;
                    const id = `client-custom-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                    const newClient = {
                        id,
                        name: name.trim(),
                        firm: r['法人戶'] || r['firm'] || 'FMR',
                        title: r['職稱'] || r['title'] || 'Manager',
                        email: r['E-mail'] || r['email'] || '',
                        phone: r['連絡電話'] || r['phone'] || '',
                        region: r['地區'] || r['region'] || 'HK',
                        sales: r['營業員'] || r['sales'] || 'Charlie Zhao',
                        trader: r['業務交易員'] || r['trader'] || 'Jason Chang',
                        baseCount: 0,
                        baseDuration: 0
                    };
                    customClients.push(newClient);
                });
                localStorage.setItem('crm_custom_clients', JSON.stringify(customClients));
                if (typeof refreshClientTable === 'function') refreshClientTable();
            }
        }
    };

    // CSV format escape helper
    const escapeCsvValue = (val) => {
        if (val === null || val === undefined) return '""';
        let str = String(val);
        if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
            str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    // CSV Export trigger
    const exportDataToExcel = (type) => {
        const schema = EXCEL_SCHEMAS[type];
        if (!schema) return;

        const data = schema.getData();
        const headers = schema.headers.map(h => escapeCsvValue(h.label)).join(',');
        
        const rows = data.map(item => {
            return schema.headers.map(h => {
                let val = item[h.key];
                if (h.key === 'followUp') {
                    val = (pinnedServiceIds && pinnedServiceIds.includes(item.id)) ? '是' : '否';
                }
                return escapeCsvValue(val);
            }).join(',');
        });

        // Add UTF-8 BOM (﻿) to ensure Microsoft Excel in Windows displays Chinese perfectly without garbled text
        const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        const fileName = `${schema.filename}_${dateStr}.csv`;

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // CSV Template Download
    const downloadExcelTemplate = (type) => {
        const schema = EXCEL_SCHEMAS[type];
        if (!schema) return;

        const headers = schema.headers.map(h => escapeCsvValue(h.label)).join(',');
        const sampleRow = schema.headers.map(h => escapeCsvValue(schema.sample[h.key] || '')).join(',');
        
        const csvContent = '\uFEFF' + [headers, sampleRow].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const fileName = `${schema.filename}_標準匯入範本.csv`;

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Simple robust CSV parser
    const parseCsvText = (text) => {
        const lines = [];
        let currentRow = [];
        let currentCell = '';
        let insideQuotes = false;

        // Strip UTF-8 BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    currentCell += '"';
                    i++; // skip escaped quote
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                currentRow.push(currentCell.trim());
                currentCell = '';
            } else if ((char === '\r' || char === '\n') && !insideQuotes) {
                if (char === '\r' && nextChar === '\n') i++;
                currentRow.push(currentCell.trim());
                if (currentRow.some(c => c !== '')) {
                    lines.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            if (currentRow.some(c => c !== '')) {
                lines.push(currentRow);
            }
        }

        if (lines.length < 2) return [];

        const headers = lines[0].map(h => h.replace(/^[\ufeff"']+|[\ufeff"']+$/g, '').trim());
        const dataRows = [];
        for (let r = 1; r < lines.length; r++) {
            const rowValues = lines[r];
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = rowValues[idx] || '';
            });
            dataRows.push(obj);
        }
        return dataRows;
    };

    // Manage Excel Import Modal UI
    let currentImportType = 'service';
    let currentParsedData = [];

    const excelImportModal = document.getElementById('excel-import-modal');
    const importTargetLabel = document.getElementById('import-target-label');
    const importModalTitle = document.getElementById('import-modal-title');
    const btnDownloadTemplate = document.getElementById('btn-download-import-template');
    const excelDropzone = document.getElementById('excel-dropzone');
    const excelFileInput = document.getElementById('excel-file-input');
    const dropzoneText = document.getElementById('dropzone-text');
    const importPreviewSection = document.getElementById('import-preview-section');
    const importPreviewCount = document.getElementById('import-preview-count');
    const importPreviewTable = document.getElementById('import-preview-table');
    const btnConfirmImport = document.getElementById('btn-confirm-excel-import');
    const btnCancelImport = document.getElementById('btn-cancel-excel-import');
    const btnCloseImportModal = document.getElementById('btn-close-import-modal');

    const openExcelImportModal = (type) => {
        currentImportType = type;
        currentParsedData = [];
        const schema = EXCEL_SCHEMAS[type] || EXCEL_SCHEMAS.service;

        if (importTargetLabel) importTargetLabel.textContent = schema.title;
        if (importModalTitle) importModalTitle.textContent = `匯入 ${schema.title}`;
        if (dropzoneText) dropzoneText.textContent = `點擊選取或拖曳 ${schema.title} Excel (CSV) 檔案至此處上傳`;
        if (importPreviewSection) importPreviewSection.style.display = 'none';
        if (excelFileInput) excelFileInput.value = '';
        if (btnConfirmImport) {
            btnConfirmImport.disabled = true;
            btnConfirmImport.style.background = '#94A3B8';
            btnConfirmImport.style.cursor = 'not-allowed';
        }

        if (excelImportModal) {
            excelImportModal.style.display = 'flex';
            excelImportModal.classList.add('show');
        }
    };

    const closeExcelImportModal = () => {
        if (excelImportModal) {
            excelImportModal.classList.remove('show');
            excelImportModal.style.display = 'none';
        }
    };

    if (btnCloseImportModal) btnCloseImportModal.onclick = closeExcelImportModal;
    if (btnCancelImport) btnCancelImport.onclick = closeExcelImportModal;
    if (btnDownloadTemplate) {
        btnDownloadTemplate.onclick = () => {
            downloadExcelTemplate(currentImportType);
        };
    }

    if (excelDropzone && excelFileInput) {
        excelDropzone.onclick = () => excelFileInput.click();
        
        excelDropzone.ondragover = (e) => {
            e.preventDefault();
            excelDropzone.style.borderColor = '#0284C7';
            excelDropzone.style.background = '#EFF6FF';
        };
        excelDropzone.ondragleave = () => {
            excelDropzone.style.borderColor = '#94A3B8';
            excelDropzone.style.background = '#F8FAFC';
        };
        excelDropzone.ondrop = (e) => {
            e.preventDefault();
            excelDropzone.style.borderColor = '#94A3B8';
            excelDropzone.style.background = '#F8FAFC';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileChosen(e.dataTransfer.files[0]);
            }
        };

        excelFileInput.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFileChosen(e.target.files[0]);
            }
        };
    }

    const handleFileChosen = (file) => {
        if (!file) return;
        if (dropzoneText) dropzoneText.innerHTML = `📄 <strong>已選取檔案：</strong> ${file.name} (${Math.round(file.size/1024*10)/10} KB)`;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target.result;
                const rows = parseCsvText(text);
                if (rows.length === 0) {
                    alert('⚠️ 未能讀取到有效資料行，請確認檔案格式是否符合 CSV 規範。');
                    return;
                }
                currentParsedData = rows;
                renderImportPreview(rows);
            } catch (err) {
                console.error("CSV Parse Error", err);
                alert('⚠️ 解析 CSV 檔案失敗：' + err.message);
            }
        };
        reader.readAsText(file, 'utf-8');
    };

    const renderImportPreview = (rows) => {
        if (!importPreviewSection || !importPreviewTable) return;
        importPreviewSection.style.display = 'block';
        if (importPreviewCount) importPreviewCount.textContent = rows.length;

        const thead = importPreviewTable.querySelector('thead');
        const tbody = importPreviewTable.querySelector('tbody');
        const keys = Object.keys(rows[0] || {});

        thead.innerHTML = `<tr>${keys.map(k => `<th style="padding:4px 8px; background:#F1F5F9;">${k}</th>`).join('')}</tr>`;
        tbody.innerHTML = rows.slice(0, 5).map(r => {
            return `<tr>${keys.map(k => `<td style="padding:4px 8px; white-space:nowrap; max-width:150px; overflow:hidden; text-overflow:ellipsis;">${r[k]}</td>`).join('')}</tr>`;
        }).join('');

        if (btnConfirmImport) {
            btnConfirmImport.disabled = false;
            btnConfirmImport.style.background = '#0284C7';
            btnConfirmImport.style.cursor = 'pointer';
        }
    };

    if (btnConfirmImport) {
        btnConfirmImport.onclick = () => {
            if (!currentParsedData || currentParsedData.length === 0) return;
            const schema = EXCEL_SCHEMAS[currentImportType];
            if (!schema) return;

            schema.saveImported(currentParsedData);
            closeExcelImportModal();
            alert(`✅ 成功匯入 ${currentParsedData.length} 筆資料至「${schema.title}」！`);
        };
    }

    // Bind all Export & Import buttons across the four pages
    document.querySelectorAll('.btn-export-excel').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const type = btn.getAttribute('data-type');
            exportDataToExcel(type);
        };
    });

    document.querySelectorAll('.btn-import-excel').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const type = btn.getAttribute('data-type');
            openExcelImportModal(type);
        };
    });
