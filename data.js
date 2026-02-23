// ===== DATA MANAGEMENT MODULE =====

const DEFAULT_PROJECT_TYPES = [
    { id: 'งานก่อสร้างเส้นทางคมนาคม', label: 'งานก่อสร้างเส้นทางคมนาคม', color: '#f59e0b' },
    { id: 'งานจัดหาน้ำกินน้ำใช้', label: 'งานจัดหาน้ำกินน้ำใช้', color: '#3b82f6' },
    { id: 'งานพัฒนาและช่วยเหลือประชาชน', label: 'งานพัฒนาและช่วยเหลือประชาชน', color: '#8b5cf6' },
    { id: 'งานเกษตรผสมผสาน', label: 'งานเกษตรผสมผสาน', color: '#10b981' }
];

const DEFAULT_SUB_ITEMS = {
    'งานก่อสร้างเส้นทางคมนาคม': [
        'ถนนลาดยาง', 'ถนนคอนกรีต', 'ถนนลูกรัง', 'สะพาน', 'ท่อระบายน้ำ',
        'ซ่อมแซมถนน', 'ปรับปรุงเส้นทาง'
    ],
    'งานจัดหาน้ำกินน้ำใช้': [
        'ระบบประปาหมู่บ้าน', 'ขุดเจาะบ่อน้ำบาดาล', 'ขุดสระน้ำ', 'ฝายกั้นน้ำ',
        'ระบบกรองน้ำ', 'ซ่อมแซมระบบประปา', 'วางท่อส่งน้ำ'
    ],
    'งานพัฒนาและช่วยเหลือประชาชน': [
        'โครงการฝึกอาชีพ', 'ก่อสร้างศาลาประชาคม', 'ปรับปรุงอาคาร', 'สนามกีฬา',
        'ศูนย์เรียนรู้ชุมชน', 'โครงการช่วยเหลือผู้ประสบภัย'
    ],
    'งานเกษตรผสมผสาน': [
        'ส่งเสริมการปลูกพืชผสมผสาน', 'โครงการเลี้ยงปลา', 'โครงการเลี้ยงสัตว์',
        'เกษตรทฤษฎีใหม่', 'ธนาคารอาหารชุมชน', 'แปลงสาธิตเกษตร'
    ]
};

// Dynamic PROJECT_TYPES - loaded from localStorage or defaults
let PROJECT_TYPES = (() => {
    const stored = localStorage.getItem('pb_project_types');
    return stored ? JSON.parse(stored) : [...DEFAULT_PROJECT_TYPES];
})();

const BUDGET_TYPES = [
    'งบหลัก',
    'งบเสริม',
    'งบ กกล.ป้องกันชายแดน',
    'งบ รร.ตชด.'
];

const DEFAULT_REGIONAL_OFFICES = [
    'สำนักงานภาค 1',
    'สำนักงานภาค 2',
    'สำนักงานภาค 3',
    'สำนักงานภาค 4',
    'สำนักงานภาค 5',
    'นพศ.นทพ.'
];

const DEFAULT_UNITS = {
    'สำนักงานภาค 1': ['กองพัน ทพ.11', 'กองพัน ทพ.12', 'กองพัน ทพ.13'],
    'สำนักงานภาค 2': ['กองพัน ทพ.21', 'กองพัน ทพ.22', 'กองพัน ทพ.23'],
    'สำนักงานภาค 3': ['กองพัน ทพ.31', 'กองพัน ทพ.32', 'กองพัน ทพ.33'],
    'สำนักงานภาค 4': ['กองพัน ทพ.41', 'กองพัน ทพ.42', 'กองพัน ทพ.43'],
    'สำนักงานภาค 5': ['กองพัน ทพ.51', 'กองพัน ทพ.52', 'กองพัน ทพ.53'],
    'นพศ.นทพ.': ['ฝกร.นพศ.', 'ฝบก.นพศ.']
};

// Dynamic REGIONAL_OFFICES - loaded from localStorage or defaults
let REGIONAL_OFFICES = (() => {
    const stored = localStorage.getItem('pb_regional_offices');
    return stored ? JSON.parse(stored) : [...DEFAULT_REGIONAL_OFFICES];
})();

const DEFAULT_USERS = [
    {
        id: 'U001',
        username: 'admin.afdc',
        password: '1234567',
        role: 'admin', // admin | super user | user
        name: 'Administrator',
        responsibility: 'ทุกภาค', // or specific like 'สำนักงานภาค 1'
        createdAt: new Date().toISOString().split('T')[0]
    }
];

const REVIEW_STATUSES = [
    { id: 'pending', label: 'รอการพิจารณา', color: '#64748b', icon: '⏳' },
    { id: 'green', label: 'เขียว (ผ่านการพิจารณา)', color: '#10b981', icon: '🟢' },
    { id: 'adjust', label: 'ปรับประมาณการ', color: '#f59e0b', icon: '🟡' },
    { id: 'docs', label: 'ส่งเอกสารเพิ่มเติม', color: '#f59e0b', icon: '🟡' },
    { id: 'clarify', label: 'ชี้แจงโครงการใหม่', color: '#f59e0b', icon: '🟡' },
    { id: 'red', label: 'แดง (ไม่ผ่านการพิจารณา)', color: '#ef4444', icon: '🔴' }
];


// Sample data
const SAMPLE_PROJECTS = [
    {
        id: 'P001', type: 'งานก่อสร้างเส้นทางคมนาคม', subItem: 'ถนนลาดยางสายบ้านดอน-บ้านนา',
        dimension: 'กว้าง 6 ม. ยาว 2,500 ม.',
        moo: '3', village: 'บ้านดอน', tambon: 'ดอนแร่', amphoe: 'เมือง', province: 'ราชบุรี',
        quantity: 2500, unit: 'เมตร', unitOrg: 'กองพัน ทพ.11',
        budget: 3500000, budgetType: 'งบหลัก', regionalOffice: 'สำนักงานภาค 1',
        reviewStatus: 'green', comment: '', createdAt: '2026-01-15'
    },
    {
        id: 'P002', type: 'งานจัดหาน้ำกินน้ำใช้', subItem: 'ระบบประปาหมู่บ้านหนองแค',
        dimension: 'ขนาด 10 ลบ.ม./ชม.',
        moo: '5', village: 'หนองแค', tambon: 'หนองแค', amphoe: 'บ้านโป่ง', province: 'ราชบุรี',
        quantity: 1, unit: 'ระบบ', unitOrg: 'กองพัน ทพ.12',
        budget: 1200000, budgetType: 'งบเสริม', regionalOffice: 'สำนักงานภาค 1',
        reviewStatus: 'adjust', comment: 'ขอให้ปรับลดงบประมาณค่าวัสดุ 10%', createdAt: '2026-01-16'
    },
    {
        id: 'P003', type: 'งานพัฒนาและช่วยเหลือประชาชน', subItem: 'โครงการฝึกอาชีพสตรี',
        dimension: '-',
        moo: '2', village: 'บ้านท่า', tambon: 'โพธาราม', amphoe: 'โพธาราม', province: 'ราชบุรี',
        quantity: 50, unit: 'คน', unitOrg: 'กองพัน ทพ.13',
        budget: 250000, budgetType: 'งบ รร.ตชด.', regionalOffice: 'สำนักงานภาค 2',
        reviewStatus: 'green', comment: '', createdAt: '2026-01-17'
    },
    {
        id: 'P004', type: 'งานเกษตรผสมผสาน', subItem: 'ส่งเสริมการปลูกพืชผสมผสาน',
        dimension: 'พื้นที่ 100 ไร่',
        moo: '7', village: 'บ้านเขาแดง', tambon: 'ปากท่อ', amphoe: 'ปากท่อ', province: 'ราชบุรี',
        quantity: 100, unit: 'ไร่', unitOrg: 'กองพัน ทพ.14',
        budget: 800000, budgetType: 'งบ กกล.ป้องกันชายแดน', regionalOffice: 'สำนักงานภาค 2',
        reviewStatus: 'docs', comment: 'ขอเอกสารแผนที่แปลงเกษตรเพิ่มเติม', createdAt: '2026-01-18'
    },
    {
        id: 'P005', type: 'งานก่อสร้างเส้นทางคมนาคม', subItem: 'ซ่อมแซมถนนคอนกรีตสายหลัก',
        dimension: 'กว้าง 4 ม. ยาว 800 ม.',
        moo: '1', village: 'บ้านจอม', tambon: 'จอมบึง', amphoe: 'จอมบึง', province: 'ราชบุรี',
        quantity: 800, unit: 'เมตร', unitOrg: 'กองพัน ทพ.15',
        budget: 960000, budgetType: 'งบหลัก', regionalOffice: 'สำนักงานภาค 3',
        reviewStatus: 'red', comment: 'งบประมาณสูงเกินความจำเป็น ขอให้ทบทวนใหม่', createdAt: '2026-01-19'
    },
    {
        id: 'P006', type: 'งานจัดหาน้ำกินน้ำใช้', subItem: 'ขุดเจาะบ่อน้ำบาดาล',
        dimension: 'ลึก 80 เมตร',
        moo: '4', village: 'บ้านสวน', tambon: 'สวนผึ้ง', amphoe: 'สวนผึ้ง', province: 'ราชบุรี',
        quantity: 3, unit: 'บ่อ', unitOrg: 'กองพัน ทพ.16',
        budget: 450000, budgetType: 'งบเสริม', regionalOffice: 'สำนักงานภาค 3',
        reviewStatus: '', comment: '', createdAt: '2026-01-20'
    },
    {
        id: 'P007', type: 'งานเกษตรผสมผสาน', subItem: 'โครงการเลี้ยงปลาในบ่อดิน',
        dimension: 'บ่อขนาด 1 ไร่',
        moo: '6', village: 'บ้านนา', tambon: 'เมือง', amphoe: 'เมือง', province: 'ราชบุรี',
        quantity: 5, unit: 'บ่อ', unitOrg: 'กองพัน ทพ.11',
        budget: 350000, budgetType: 'งบ รร.ตชด.', regionalOffice: 'สำนักงานภาค 4',
        reviewStatus: 'green', comment: '', createdAt: '2026-01-21'
    },
    {
        id: 'P008', type: 'งานพัฒนาและช่วยเหลือประชาชน', subItem: 'ก่อสร้างศาลาประชาคม',
        dimension: 'ขนาด 8x12 ม.',
        moo: '9', village: 'บ้านโป่ง', tambon: 'บ้านโป่ง', amphoe: 'บ้านโป่ง', province: 'ราชบุรี',
        quantity: 1, unit: 'หลัง', unitOrg: 'กองพัน ทพ.12',
        budget: 1800000, budgetType: 'งบ กกล.ป้องกันชายแดน', regionalOffice: 'สำนักงานภาค 4',
        reviewStatus: 'adjust', comment: 'ปรับแบบก่อสร้างให้ประหยัดงบ', createdAt: '2026-01-22'
    }
];

// ===== DATA ACCESS LAYER =====
const DB = {
    WEB_APP_URL: "https://script.google.com/macros/s/AKfycbx6jv8KELuU4hlDgaLJIlWRCcf2-HeL1jLEXwSnDUjAoiGnVG3IgSr2ouDAPaABXvAuhw/exec", // <-- ⚠️ นำ Web App URL ของคุณมาใส่ตรงนี้
    projectsCache: null,
    projectsMap: {}, // O(1) lookup map
    saveTimeout: null,

    async init() {
        if (this.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE" || !this.WEB_APP_URL) {
            console.warn("DB: ไม่ได้ตั้งค่า WEB_APP_URL, จะใช้งานด้วย localStorage แทน");
            return;
        }

        try {
            console.log("DB: กำลังโหลดข้อมูลจาก Google Sheets...");
            const response = await fetch(this.WEB_APP_URL);
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                this.projectsCache = data;
                localStorage.setItem('pb_projects', JSON.stringify(data)); // สำรองไว้ใน localStorage
                console.log(`DB: โหลดโครงการจาก Sheets ได้ ${data.length} รายการ`);
            } else if (data.length === 0) {
                // If the remote sheet is totally empty, we probably want to sync default samples
                console.log("DB: Google Sheets ว่างเปล่า, กำลังซิงค์ข้อมูลเริ่มต้นกลับไป...");
                const stored = localStorage.getItem('pb_projects');
                this.projectsCache = stored ? JSON.parse(stored) : [...SAMPLE_PROJECTS];
                this.syncToSheets(this.projectsCache);
            }
        } catch (error) {
            console.error("DB: เกิดข้อผิดพลาดในการโหลดข้อมูลจาก Google Sheets:", error);
        }
        this.rebuildMap();
    },

    getProjects() {
        if (!this.projectsCache) {
            const stored = localStorage.getItem('pb_projects');
            this.projectsCache = stored ? JSON.parse(stored) : [...SAMPLE_PROJECTS];
            this.rebuildMap();
        }
        return this.projectsCache;
    },
    rebuildMap() {
        this.projectsMap = {};
        this.projectsCache.forEach(p => {
            this.projectsMap[p.id] = p;
        });
    },
    saveProjects(projects, immediate = false) {
        this.projectsCache = projects;
        this.rebuildMap();

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        // Always save to localStorage as backup
        localStorage.setItem('pb_projects', JSON.stringify(this.projectsCache));

        if (this.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE" || !this.WEB_APP_URL) {
            return; // Not configured, stop here
        }

        if (immediate) {
            this.syncToSheets(this.projectsCache);
        } else {
            // Debounce save to prevent UI lag during rapid updates
            this.saveTimeout = setTimeout(() => {
                this.syncToSheets(this.projectsCache);
                this.saveTimeout = null;
            }, 1000);
        }
    },
    async syncToSheets(projects) {
        try {
            fetch(this.WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save_projects',
                    projects: projects
                }),
                headers: {
                    "Content-Type": "text/plain;charset=utf-8" // use plain string post over JSON to avoid CORS preflight
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log('DB: ซิงค์ข้อมูลไปยัง Google Sheets สำเร็จ');
                    } else {
                        console.error('DB: เว็บแอปรายงานข้อผิดพลาด:', data.error || data.message);
                    }
                })
                .catch(err => console.error('DB: ติดต่อเว็บแอปไม่สำเร็จ:', err));
        } catch (e) {
            console.error('DB: Error in syncToSheets:', e);
        }
    },
    addProject(project) {
        const projects = this.getProjects();
        project.id = 'P' + String(Date.now()).slice(-6);
        project.createdAt = new Date().toISOString().split('T')[0];
        project.reviewStatus = project.reviewStatus || 'pending';
        project.comment = project.comment || '';
        project.round = 1;
        project.history = [];
        projects.push(project);
        this.saveProjects(projects, true); // Immediate save for new items
        return project;
    },
    addProjects(newProjects) {
        const projects = this.getProjects();
        newProjects.forEach(p => {
            p.id = 'P' + String(Date.now() + Math.random() * 1000 | 0).slice(-6);
            p.createdAt = new Date().toISOString().split('T')[0];
            p.reviewStatus = p.reviewStatus || 'pending';
            p.comment = p.comment || '';
            p.round = 1;
            p.history = [];
            projects.push(p);
        });
        this.saveProjects(projects, true); // Immediate save for bulk import
    },
    updateReview(id, status, comment) {
        this.getProjects(); // Ensure loaded
        const project = this.projectsMap[id];
        if (project) {
            project.reviewStatus = status || 'pending';
            project.comment = comment;
            this.saveProjects(this.projectsCache);
        }
    },
    updateReviews(updates) {
        this.getProjects(); // Ensure loaded
        let changed = false;
        updates.forEach(upd => {
            const project = this.projectsMap[upd.id];
            if (project) {
                project.reviewStatus = upd.status || 'pending';
                project.comment = upd.comment;
                changed = true;
            }
        });
        if (changed) {
            this.saveProjects(this.projectsCache);
        }
    },
    reviseProject(id) {
        this.getProjects(); // Ensure loaded
        const p = this.projectsMap[id];
        if (p) {
            // Save current state to history
            const historyItem = {
                round: p.round || 1,
                reviewStatus: p.reviewStatus,
                comment: p.comment,
                budget: p.budget,
                quantity: p.quantity,
                unit: p.unit,
                subItem: p.subItem,
                type: p.type,
                dimension: p.dimension,
                province: p.province,
                amphoe: p.amphoe,
                tambon: p.tambon,
                revisedAt: new Date().toISOString()
            };
            if (!p.history) p.history = [];
            p.history.push(historyItem);

            // Update for new round
            p.round = (p.round || 1) + 1;
            p.reviewStatus = 'pending';
            p.comment = '';

            this.saveProjects(this.projectsCache, true); // Immediate save for revision
            return p;
        }
    },
    updateProject(id, updates) {
        this.getProjects(); // Ensure loaded
        const project = this.projectsMap[id];
        if (project) {
            Object.assign(project, updates);
            this.saveProjects(this.projectsCache, true); // Immediate save for edits
        }
    },
    deleteProject(id) {
        const projects = this.getProjects().filter(p => p.id !== id);
        this.saveProjects(projects, true); // Immediate save for deletion
    },
    getAgencies() {
        const projects = this.getProjects();
        const offices = [...new Set(projects.map(p => p.regionalOffice).filter(Boolean))];
        return offices.sort();
    },
    getStats(filterOffice = '', filterType = '') {
        const projects = this.getProjects();
        const stats = {
            total: 0,
            totalBudget: 0,
            byType: {},
            budgetByType: {},
            byStatus: {},
            byAgency: {}
        };

        // Initialize counters
        PROJECT_TYPES.forEach(t => { stats.byType[t.id] = 0; stats.budgetByType[t.id] = 0; });
        REVIEW_STATUSES.forEach(s => stats.byStatus[s.id] = 0);
        // Ensure pending is initialized if not in REVIEW_STATUSES (though we added it)
        if (!stats.byStatus['pending']) stats.byStatus['pending'] = 0;

        projects.forEach(p => {
            // Apply Filters
            if (filterOffice && p.regionalOffice !== filterOffice) return;
            if (filterType && p.type !== filterType) return;

            stats.total++;
            const budget = Number(p.budget || 0);
            stats.totalBudget += budget;

            // By Type
            if (stats.byType[p.type] !== undefined) {
                stats.byType[p.type]++;
                stats.budgetByType[p.type] += budget;
            }

            // By Status
            const status = p.reviewStatus || 'pending';
            if (stats.byStatus[status] !== undefined) stats.byStatus[status]++;
            else stats.byStatus['pending']++;

            // By Regional Office (Accumulate for table)
            const agency = p.regionalOffice || 'ไม่ระบุ';
            if (!stats.byAgency[agency]) {
                stats.byAgency[agency] = { total: 0, budget: 0, byType: {} };
                PROJECT_TYPES.forEach(t => stats.byAgency[agency].byType[t.id] = 0);
            }
            stats.byAgency[agency].total++;
            stats.byAgency[agency].budget += budget;
            if (stats.byAgency[agency].byType[p.type] !== undefined) {
                stats.byAgency[agency].byType[p.type]++;
            }
        });

        return stats;
    },

    // ===== PROJECT TYPES MANAGEMENT =====
    getProjectTypes() {
        const stored = localStorage.getItem('pb_project_types');
        PROJECT_TYPES = stored ? JSON.parse(stored) : [...DEFAULT_PROJECT_TYPES];
        return PROJECT_TYPES;
    },
    saveProjectTypes(types) {
        PROJECT_TYPES = types;
        localStorage.setItem('pb_project_types', JSON.stringify(types));
    },
    addProjectType(type) {
        const types = this.getProjectTypes();
        // Check duplicate id
        if (types.find(t => t.id === type.id)) return false;
        types.push(type);
        this.saveProjectTypes(types);
        // Initialize empty sub-items for this type
        const subs = this.getSubItems();
        if (!subs[type.id]) {
            subs[type.id] = [];
            this.saveSubItems(subs);
        }
        return true;
    },
    updateProjectType(id, updates) {
        const types = this.getProjectTypes();
        const idx = types.findIndex(t => t.id === id);
        if (idx === -1) return false;
        types[idx] = { ...types[idx], ...updates };
        this.saveProjectTypes(types);
        return true;
    },
    deleteProjectType(id) {
        const types = this.getProjectTypes().filter(t => t.id !== id);
        this.saveProjectTypes(types);
        // Also remove sub-items
        const subs = this.getSubItems();
        delete subs[id];
        this.saveSubItems(subs);
    },

    // ===== SUB-ITEMS MANAGEMENT =====
    getSubItems() {
        const stored = localStorage.getItem('pb_sub_items');
        return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULT_SUB_ITEMS));
    },
    saveSubItems(subs) {
        localStorage.setItem('pb_sub_items', JSON.stringify(subs));
    },
    getSubItemsForType(typeId) {
        const subs = this.getSubItems();
        return subs[typeId] || [];
    },
    addSubItem(typeId, name) {
        const subs = this.getSubItems();
        if (!subs[typeId]) subs[typeId] = [];
        if (subs[typeId].includes(name)) return false;
        subs[typeId].push(name);
        this.saveSubItems(subs);
        return true;
    },
    updateSubItem(typeId, oldName, newName) {
        const subs = this.getSubItems();
        if (!subs[typeId]) return false;
        const idx = subs[typeId].indexOf(oldName);
        if (idx === -1) return false;
        if (subs[typeId].includes(newName)) return false;
        subs[typeId][idx] = newName;
        this.saveSubItems(subs);
        return true;
    },
    deleteSubItem(typeId, name) {
        const subs = this.getSubItems();
        if (!subs[typeId]) return;
        subs[typeId] = subs[typeId].filter(s => s !== name);
        this.saveSubItems(subs);
    },
    isValidSubItem(typeId, name) {
        const subs = this.getSubItemsForType(typeId);
        if (subs.length === 0) return true; // If no sub-items defined, allow any
        return subs.some(s => name.includes(s) || s.includes(name));
    },

    // ===== REGIONAL OFFICES MANAGEMENT =====
    getRegionalOffices() {
        const stored = localStorage.getItem('pb_regional_offices');
        REGIONAL_OFFICES = stored ? JSON.parse(stored) : [...DEFAULT_REGIONAL_OFFICES];
        return REGIONAL_OFFICES;
    },
    saveRegionalOffices(offices) {
        localStorage.setItem('pb_regional_offices', JSON.stringify(offices));
        REGIONAL_OFFICES = offices;
    },
    addRegionalOffice(name) {
        const offices = this.getRegionalOffices();
        if (offices.includes(name)) return false;
        offices.push(name);
        this.saveRegionalOffices(offices);
        // Initialize empty units
        const units = this.getUnits();
        if (!units[name]) {
            units[name] = [];
            this.saveUnits(units);
        }
        return true;
    },
    updateRegionalOffice(oldName, newName) {
        const offices = this.getRegionalOffices();
        const idx = offices.indexOf(oldName);
        if (idx === -1) return false;
        if (offices.includes(newName)) return false;
        offices[idx] = newName;
        this.saveRegionalOffices(offices);
        // Move units to new name
        const units = this.getUnits();
        if (units[oldName]) {
            units[newName] = units[oldName];
            delete units[oldName];
            this.saveUnits(units);
        }
        return true;
    },
    deleteRegionalOffice(name) {
        const offices = this.getRegionalOffices().filter(o => o !== name);
        this.saveRegionalOffices(offices);
        // Also remove units
        const units = this.getUnits();
        delete units[name];
        this.saveUnits(units);
    },

    // ===== UNITS MANAGEMENT =====
    getUnits() {
        const stored = localStorage.getItem('pb_units');
        return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULT_UNITS));
    },
    saveUnits(units) {
        localStorage.setItem('pb_units', JSON.stringify(units));
    },
    getUnitsForOffice(officeName) {
        const units = this.getUnits();
        return units[officeName] || [];
    },
    addUnit(officeName, unitName) {
        const units = this.getUnits();
        if (!units[officeName]) units[officeName] = [];
        if (units[officeName].includes(unitName)) return false;
        units[officeName].push(unitName);
        this.saveUnits(units);
        return true;
    },
    updateUnit(officeName, oldName, newName) {
        const units = this.getUnits();
        if (!units[officeName]) return false;
        const idx = units[officeName].indexOf(oldName);
        if (idx === -1) return false;
        if (units[officeName].includes(newName)) return false;
        units[officeName][idx] = newName;
        this.saveUnits(units);
        return true;
    },
    deleteUnit(officeName, unitName) {
        const units = this.getUnits();
        if (!units[officeName]) return;
        units[officeName] = units[officeName].filter(u => u !== unitName);
        this.saveUnits(units);
    },

    // ===== USERS MANAGEMENT =====
    getUsers() {
        const stored = localStorage.getItem('pb_users');
        return stored ? JSON.parse(stored) : [...DEFAULT_USERS];
    },
    saveUsers(users) {
        localStorage.setItem('pb_users', JSON.stringify(users));
    },
    addUser(userData) {
        const users = this.getUsers();
        if (users.find(u => u.username === userData.username)) {
            return { success: false, message: 'ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว' };
        }
        const newUser = {
            id: 'U' + String(Date.now()).slice(-6),
            ...userData,
            createdAt: new Date().toISOString().split('T')[0]
        };
        users.push(newUser);
        this.saveUsers(users);
        return { success: true, user: newUser };
    },
    updateUser(id, updates) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) return { success: false, message: 'ไม่พบผู้ใช้งาน' };

        // Prevent changing username to one that already exists
        if (updates.username && updates.username !== users[idx].username) {
            if (users.find(u => u.id !== id && u.username === updates.username)) {
                return { success: false, message: 'ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว' };
            }
        }

        users[idx] = { ...users[idx], ...updates };
        this.saveUsers(users);
        return { success: true, user: users[idx] };
    },
    deleteUser(id) {
        const users = this.getUsers();
        if (id === 'U001') {
            return { success: false, message: 'ไม่สามารถลบผู้ดูแลระบบเริ่มต้นได้' };
        }
        const newUsers = users.filter(u => u.id !== id);
        this.saveUsers(newUsers);
        return { success: true };
    },
    authenticate(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        return user || null;
    }
};

// Initialize with sample data if empty
if (!localStorage.getItem('pb_projects')) {
    DB.saveProjects(SAMPLE_PROJECTS);
}
// Initialize project types if empty
if (!localStorage.getItem('pb_project_types')) {
    localStorage.setItem('pb_project_types', JSON.stringify(DEFAULT_PROJECT_TYPES));
}
// Initialize sub-items if empty
if (!localStorage.getItem('pb_sub_items')) {
    localStorage.setItem('pb_sub_items', JSON.stringify(DEFAULT_SUB_ITEMS));
}
// Initialize regional offices if empty
if (!localStorage.getItem('pb_regional_offices')) {
    localStorage.setItem('pb_regional_offices', JSON.stringify(DEFAULT_REGIONAL_OFFICES));
}
// Initialize units if empty
if (!localStorage.getItem('pb_units')) {
    localStorage.setItem('pb_units', JSON.stringify(DEFAULT_UNITS));
}
// Initialize users if empty
if (!localStorage.getItem('pb_users')) {
    localStorage.setItem('pb_users', JSON.stringify(DEFAULT_USERS));
}
