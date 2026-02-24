// ===== EXCEL UTILITIES MODULE =====
// Uses SheetJS (xlsx) loaded via CDN in index.html

const ExcelUtils = {
    // Template column headers matching the new data model
    TEMPLATE_HEADERS: [
        'ประเภทงาน',
        'รายการย่อย',
        'มิติงาน',
        'หมู่',
        'บ้าน',
        'ตำบล',
        'อำเภอ',
        'จังหวัด',
        'ปริมาณงาน',
        'หน่วยนับ',
        'งบประมาณ (บาท)',
        'ประเภทงบประมาณ',
        'สำนักงานภาค',
        'หน่วย'
    ],

    TEMPLATE_EXAMPLE: [
        ['งานก่อสร้างเส้นทางคมนาคม', 'ถนนลาดยางสายตัวอย่าง', 'กว้าง 6 ม. ยาว 1,000 ม.', '3', 'บ้านดอน', 'ดอนแร่', 'เมือง', 'ราชบุรี', 1000, 'เมตร', 1500000, 'งบหลัก', 'สำนักงานภาค 1', 'กองพัน ทพ.11'],
        ['งานจัดหาน้ำกินน้ำใช้', 'ระบบประปาหมู่บ้าน', 'ขนาด 5 ลบ.ม./ชม.', '5', 'หนองแค', 'หนองแค', 'บ้านโป่ง', 'ราชบุรี', 1, 'ระบบ', 800000, 'งบเสริม', 'สำนักงานภาค 2', 'กองพัน ทพ.12'],
    ],

    exportTemplate(fiscalYear) {
        if (typeof XLSX === 'undefined') {
            alert('กำลังโหลด Excel library กรุณารอสักครู่แล้วลองใหม่');
            return;
        }
        const fy = fiscalYear || 2571;
        const wb = XLSX.utils.book_new();

        // Instructions sheet - dynamic from database
        const instructions = [
            [`คำแนะนำการกรอกข้อมูล — ปีงบประมาณ พ.ศ. ${fy}`],
            [''],
            ['ประเภทงาน ให้กรอกรหัสดังนี้:'],
        ];
        const currentTypes = typeof DB !== 'undefined' ? DB.getProjectTypes() : PROJECT_TYPES;
        currentTypes.forEach(t => {
            instructions.push([`  ${t.label}`]);
            const subs = typeof DB !== 'undefined' ? DB.getSubItemsForType(t.id) : [];
            if (subs.length > 0) {
                instructions.push([`    รายการย่อย: ${subs.join(', ')}`]);
            }
        });
        instructions.push(['']);
        instructions.push(['ประเภทงบประมาณ ให้กรอกหนึ่งในนี้:']);
        BUDGET_TYPES.forEach(b => instructions.push([`  ${b}`]));
        instructions.push(['']);
        instructions.push(['สำนักงานภาค ให้กรอกหนึ่งในนี้:']);
        REGIONAL_OFFICES.forEach(r => instructions.push([`  ${r}`]));
        instructions.push(['']);
        instructions.push([`หมายเหตุ: ปีงบประมาณ พ.ศ. ${fy} — กรอกข้อมูลในชีท "ข้อมูลโครงการ" เท่านั้น`]);
        const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
        wsInstr['!cols'] = [{ wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsInstr, 'คำแนะนำ');

        // Data sheet
        const data = [this.TEMPLATE_HEADERS, ...this.TEMPLATE_EXAMPLE];
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [
            { wch: 22 }, { wch: 40 }, { wch: 30 },
            { wch: 8 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
            { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 22 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลโครงการ');
        XLSX.writeFile(wb, `template_โครงการ_พศ${fy}.xlsx`);
    },

    importExcel(file, callback) {
        if (typeof XLSX === 'undefined') {
            alert('กำลังโหลด Excel library กรุณารอสักครู่แล้วลองใหม่');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });

                // Find the data sheet
                const sheetName = wb.SheetNames.find(n => n.includes('ข้อมูล')) || wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

                if (rows.length < 2) {
                    alert('ไม่พบข้อมูลในไฟล์ Excel');
                    return;
                }

                // Valid type codes
                const _legacyTypes = ['01', '02', '03', '04'];

                // Skip header row
                const projects = [];
                const warnings = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row[0] && !row[1]) continue; // skip empty rows

                    // Try to parse type label
                    let typeId = 'งานก่อสร้างเส้นทางคมนาคม'; // default
                    const typeInput = String(row[0] || '').trim();

                    if (typeof PROJECT_TYPES !== 'undefined') {
                        // fuzzy match label first
                        const found = PROJECT_TYPES.find(t => typeInput.includes(t.label) || t.label.includes(typeInput));
                        if (found) {
                            typeId = found.id;
                        } else {
                            // Check for legacy leading 2 digits or legacy IDs fallback just in case
                            const codeMatch = typeInput.match(/^(0[1-4])/);
                            if (codeMatch) {
                                const legacyMap = {
                                    '01': 'งานก่อสร้างเส้นทางคมนาคม',
                                    '02': 'งานจัดหาน้ำกินน้ำใช้',
                                    '03': 'งานพัฒนาและช่วยเหลือประชาชน',
                                    '04': 'งานเกษตรผสมผสาน'
                                };
                                typeId = legacyMap[codeMatch[1]] || typeId;
                            }
                        }
                    }

                    const subItem = String(row[1] || '').trim();
                    const regionalOffice = String(row[12] || '').trim();
                    const unitOrg = String(row[13] || '').trim();

                    // No validation against DB config per user request

                    projects.push({
                        type: typeId,
                        subItem: subItem,
                        dimension: String(row[2] || '-').trim(),
                        moo: String(row[3] || '').trim(),
                        village: String(row[4] || '').trim(),
                        tambon: String(row[5] || '').trim(),
                        amphoe: String(row[6] || '').trim(),
                        province: String(row[7] || '').trim(),
                        quantity: Number(row[8]) || 0,
                        unit: String(row[9] || '').trim(),
                        budget: Number(row[10]) || 0,
                        budgetType: String(row[11] || '').trim(),
                        regionalOffice: regionalOffice,
                        unitOrg: unitOrg,
                    });
                }

                if (projects.length === 0) {
                    alert('ไม่พบข้อมูลโครงการในไฟล์');
                    return;
                }

                // No validation warnings per user request

                callback(projects);
            } catch (err) {
                alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    },

    exportReport(projects, officeFilter, unitFilter, roundLabel) {
        if (typeof XLSX === 'undefined') {
            alert('กำลังโหลด Excel library กรุณารอสักครู่แล้วลองใหม่');
            return;
        }

        const wb = XLSX.utils.book_new();

        // 1. Summary sheet (Keep as is or slightly adjust)
        let title = 'รายงานสรุปโครงการทั้งหมด';
        if (officeFilter && unitFilter) title = `รายงานสรุปโครงการ - ${officeFilter} (${unitFilter})`;
        else if (officeFilter) title = `รายงานสรุปโครงการ - ${officeFilter}`;
        else if (unitFilter) title = `รายงานสรุปโครงการ - ${unitFilter}`;
        if (roundLabel) title += roundLabel;

        const summaryData = [
            [title],
            [`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`],
            [''],
            ['สรุปตามประเภทงาน'],
            ['ประเภทงาน', 'จำนวนโครงการ', 'งบประมาณรวม (บาท)'],
        ];

        PROJECT_TYPES.forEach(t => {
            const typeProjects = projects.filter(p => p.type === t.id);
            const typeBudget = typeProjects.reduce((s, p) => s + Number(p.budget || 0), 0);
            summaryData.push([`${t.id} - ${t.label}`, typeProjects.length, typeBudget]);
        });

        summaryData.push(['']);
        summaryData.push(['สรุปตามสถานะการพิจารณา']);
        summaryData.push(['สถานะ', 'จำนวนโครงการ', 'งบประมาณรวม (บาท)']);

        const statusLabels = {
            green: 'เขียว (ผ่านการพิจารณา)',
            adjust: 'ปรับประมาณการ',
            docs: 'ส่งเอกสารเพิ่มเติม',
            clarify: 'ชี้แจงโครงการใหม่',
            red: 'แดง (ไม่ผ่านการพิจารณา)',
            'pending': 'รอการพิจารณา',
            '': 'รอการพิจารณา'
        };

        const statusKeys = ['pending', 'green', 'adjust', 'docs', 'clarify', 'red'];
        statusKeys.forEach(key => {
            const sp = projects.filter(p => (p.reviewStatus || 'pending') === key);
            const sb = sp.reduce((s, p) => s + Number(p.budget || 0), 0);
            summaryData.push([statusLabels[key], sp.length, sb]);
        });

        summaryData.push(['']);
        summaryData.push(['งบประมาณรวมทั้งหมด', '', projects.reduce((s, p) => s + Number(p.budget || 0), 0)]);

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปภาพรวม');

        // 2. Detail sheet (Redesigned)
        const detailHeaders = [
            'รายการย่อย', 'มิติงาน',
            'หมู่', 'บ้าน', 'ตำบล', 'อำเภอ', 'จังหวัด',
            'ปริมาณ', 'หน่วยนับ', 'งบประมาณ (บาท)',
            'ประเภทงบประมาณ', 'ภาค', 'หน่วย',
            'สถานะ', 'ข้อคิดเห็นของคณะกรรมการ', 'ครั้งที่'
        ];

        const detailRows = projects.map(p => [
            p.subItem,
            p.dimension || '-',
            p.moo || '',
            p.village || '',
            p.tambon || '',
            p.amphoe || '',
            p.province || '',
            p.quantity || 0,
            p.unit || '',
            p.budget || 0,
            p.budgetType || '',
            p.regionalOffice || '',
            p.unitOrg || '',
            statusLabels[p.reviewStatus || 'pending'],
            p.comment || '',
            p.round || 1
        ]);

        const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);

        // Adjust column widths
        wsDetail['!cols'] = [
            { wch: 45 }, { wch: 30 },
            { wch: 8 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
            { wch: 12 }, { wch: 12 }, { wch: 20 },
            { wch: 25 }, { wch: 20 }, { wch: 22 },
            { wch: 30 }, { wch: 45 }, { wch: 10 }
        ];

        XLSX.utils.book_append_sheet(wb, wsDetail, 'รายละเอียดโครงการ');

        let filename = 'รายงานสรุปโครงการ';
        if (officeFilter) filename += `_${officeFilter}`;
        if (unitFilter) filename += `_${unitFilter}`;
        filename += `_${new Date().toISOString().split('T')[0]}.xlsx`;

        XLSX.writeFile(wb, filename);
    },

    exportDbTemplate() {
        if (typeof XLSX === 'undefined') {
            alert('กำลังโหลด Excel library กรุณารอสักครู่แล้วลองใหม่');
            return;
        }
        const wb = XLSX.utils.book_new();

        // Sheet 1: ประเภทโครงการ (Project Types)
        const types = typeof DB !== 'undefined' ? DB.getProjectTypes() : PROJECT_TYPES;
        const wsTypes = XLSX.utils.aoa_to_sheet([
            ['รหัส', 'ชื่อประเภทโครงการ', 'สีประจำประเภท'],
            ...types.map(t => [t.id, t.label, t.color])
        ]);
        wsTypes['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsTypes, 'ประเภทโครงการ');

        // Sheet 2: รายการย่อย (Sub-Items)
        const subs = typeof DB !== 'undefined' ? DB.getSubItems() : DEFAULT_SUB_ITEMS;
        const subData = [['รหัสประเภท', 'รายการย่อย']];
        Object.entries(subs).forEach(([typeId, items]) => {
            items.forEach(item => subData.push([typeId, item]));
        });
        const wsSubs = XLSX.utils.aoa_to_sheet(subData);
        wsSubs['!cols'] = [{ wch: 15 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, wsSubs, 'รายการย่อย');

        // Sheet 3: สำนักงานภาค (Regional Offices)
        const offices = typeof DB !== 'undefined' ? DB.getRegionalOffices() : REGIONAL_OFFICES;
        const wsOffices = XLSX.utils.aoa_to_sheet([
            ['ชื่อสำนักงานภาค'],
            ...offices.map(o => [o])
        ]);
        wsOffices['!cols'] = [{ wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsOffices, 'สำนักงานภาค');

        // Sheet 4: หน่วย (Units)
        const units = typeof DB !== 'undefined' ? DB.getUnits() : DEFAULT_UNITS;
        const unitData = [['ชื่อสำนักงานภาค', 'ชื่อหน่วย']];
        Object.entries(units).forEach(([office, unitList]) => {
            unitList.forEach(u => unitData.push([office, u]));
        });
        const wsUnits = XLSX.utils.aoa_to_sheet(unitData);
        wsUnits['!cols'] = [{ wch: 30 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsUnits, 'หน่วย');

        XLSX.writeFile(wb, `db_template_${new Date().toISOString().split('T')[0]}.xlsx`);
    },

    importDbExcel(file, callback) {
        if (typeof XLSX === 'undefined') {
            alert('กำลังโหลด Excel library กรุณารอสักครู่แล้วลองใหม่');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });

                const parsedData = {
                    types: [],
                    subs: {},
                    offices: [],
                    units: {}
                };

                // Parse Types
                const wsTypes = wb.Sheets['ประเภทโครงการ'];
                if (wsTypes) {
                    const rows = XLSX.utils.sheet_to_json(wsTypes, { header: 1 });
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (row[0] && row[1]) {
                            parsedData.types.push({
                                id: String(row[0]).trim(),
                                label: String(row[1]).trim(),
                                color: String(row[2] || '#6366f1').trim()
                            });
                        }
                    }
                }

                // Parse Subs
                const wsSubs = wb.Sheets['รายการย่อย'];
                if (wsSubs) {
                    const rows = XLSX.utils.sheet_to_json(wsSubs, { header: 1 });
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (row[0] && row[1]) {
                            const typeId = String(row[0]).trim();
                            if (!parsedData.subs[typeId]) parsedData.subs[typeId] = [];
                            parsedData.subs[typeId].push(String(row[1]).trim());
                        }
                    }
                }

                // Parse Offices
                const wsOffices = wb.Sheets['สำนักงานภาค'];
                if (wsOffices) {
                    const rows = XLSX.utils.sheet_to_json(wsOffices, { header: 1 });
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (row[0]) {
                            parsedData.offices.push(String(row[0]).trim());
                        }
                    }
                }

                // Parse Units
                const wsUnits = wb.Sheets['หน่วย'];
                if (wsUnits) {
                    const rows = XLSX.utils.sheet_to_json(wsUnits, { header: 1 });
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (row[0] && row[1]) {
                            const officeId = String(row[0]).trim();
                            if (!parsedData.units[officeId]) parsedData.units[officeId] = [];
                            parsedData.units[officeId].push(String(row[1]).trim());
                        }
                    }
                }

                callback(parsedData);
            } catch (err) {
                alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }
};
