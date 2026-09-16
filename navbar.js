document.addEventListener('DOMContentLoaded', () => {
    // Identify which page we are on to add the 'active' class
    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf("/") + 1);

    // Create the navbar HTML
    const navbarHTML = `
    <nav class="navbar">
        <div class="logo-section" style="cursor:pointer;" onclick="window.location.href='index.html'">
            <img src="fubon-logo.png" class="fubon-logo" alt="Fubon Logo">
            <h2>法人客戶關係管理系統</h2>
        </div>
        <ul class="nav-links">
            <li>
                <a href="index.html" class="${pageName === 'index.html' || pageName === '' ? 'active' : ''}">
                    <div class="nav-text">
                        <span class="nav-tw">首頁</span>
                        <span class="nav-en">Home</span>
                    </div>
                </a>
            </li>
            <li class="has-dropdown">
                <a href="customer.html" class="${pageName === 'customer.html' ? 'active' : ''}">
                    <div class="nav-text">
                        <span class="nav-tw">客戶綜合查詢</span>
                        <span class="nav-en">Customer Inquiry</span>
                    </div>
                    <span class="dropdown-arrow">▼</span>
                </a>
                <ul class="nav-dropdown">
                    <li><a href="customer.html#firm">法人總歸戶 <small>Corporate Overview</small></a></li>
                    <li><a href="customer.html#client">單一客戶 <small>Individual Client</small></a></li>
                </ul>
            </li>
            <li class="has-dropdown">
                <a href="marketing.html" class="${pageName === 'marketing.html' ? 'active' : ''}">
                    <div class="nav-text">
                        <span class="nav-tw">行銷展業</span>
                        <span class="nav-en">Marketing & Sales</span>
                    </div>
                    <span class="dropdown-arrow">▼</span>
                </a>
                <ul class="nav-dropdown">
                    <li class="has-sub">
                        <a href="marketing.html#service">服務管理 <small>Service Management</small></a>
                        <ul class="nav-sub-dropdown">
                            <li><a href="marketing.html#service">1. 服務紀錄管理 <small>Service Records</small></a></li>
                            <li><a href="marketing.html#new-service">2. 新增服務紀錄 <small>Add Service Record</small></a></li>
                            <li><a href="marketing.html#analyst">3. 研究員專頁 <small>Analyst Page</small></a></li>
                            <li><a href="marketing.html#firm">4. 法人戶專頁 <small>Firm Page</small></a></li>
                            <li><a href="marketing.html#client">5. 客戶專頁 <small>Client Page</small></a></li>
                        </ul>
                    </li>
                    <li><a href="marketing.html#activity">活動管理 <small>Event Management</small></a></li>
                </ul>
            </li>
            <li class="has-dropdown">
                <a href="reports.html" class="${pageName === 'reports.html' ? 'active' : ''}">
                    <div class="nav-text">
                        <span class="nav-tw">報表專區</span>
                        <span class="nav-en">Report Zone</span>
                    </div>
                    <span class="dropdown-arrow">▼</span>
                </a>
                <ul class="nav-dropdown">
                    <li class="has-sub">
                        <a href="reports.html#domestic-basic">業績分析 <small>Performance Analysis</small></a>
                        <ul class="nav-sub-dropdown">
                            <li><a href="reports.html#domestic-basic">內法基礎報表 <small>Domestic Basic Report</small></a></li>
                            <li><a href="reports.html#foreign-basic">外法基礎報表 <small>Foreign Basic Report</small></a></li>
                            <li><a href="reports.html#perf-overview">客群業績總覽 <small>Group Performance Overview</small></a></li>
                            <li><a href="reports.html#perf-analysis">客群業績分析 <small>Group Performance Analysis</small></a></li>
                        </ul>
                    </li>
                    <li class="has-sub">
                        <a href="reports.html#commission">手收與分潤 <small>Commission &amp; Profit Share</small></a>
                        <ul class="nav-sub-dropdown">
                            <li><a href="reports.html#commission">營業員手收分潤 <small>Broker Commission</small></a></li>
                            <li><a href="reports.html#commission-settings">營業員分潤設定 <small>Commission Settings</small></a></li>
                        </ul>
                    </li>
                </ul>
            </li>
            <li class="has-dropdown">
                <a href="permissions.html" class="${pageName === 'permissions.html' ? 'active' : ''}">
                    <div class="nav-text">
                        <span class="nav-tw">工具</span>
                        <span class="nav-en">Tools</span>
                    </div>
                    <span class="dropdown-arrow">▼</span>
                </a>
                <ul class="nav-dropdown">
                    <li class="has-sub">
                        <a href="permissions.html#roles">權限設定 <small>Permission Settings</small></a>
                        <ul class="nav-sub-dropdown">
                            <li><a href="permissions.html#roles">角色管理 <small>Role Management</small></a></li>
                            <li><a href="permissions.html#users">使用者管理 <small>User Management</small></a></li>
                        </ul>
                    </li>
                    <li><a href="permissions.html#agent">代理人設定 <small>Agent Settings</small></a></li>
                </ul>
            </li>
        </ul>
    </nav>
    `;

    // Find target placeholder or prepend to body
    const placeholder = document.getElementById('navbar-placeholder');
    if (placeholder) {
        placeholder.innerHTML = navbarHTML;
    } else {
        const container = document.createElement('div');
        container.id = 'navbar-placeholder';
        container.innerHTML = navbarHTML;
        document.body.insertBefore(container, document.body.firstChild);
    }
});
