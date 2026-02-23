/**
 * Google Apps Script - Project Budget Database (Multi-Sheet Version)
 * 
 * วิธีอัปเดตโค้ดใหม่:
 * 1. เปิดเว็บเบราว์เซอร์ เข้า Google Sheet ของคุณ
 * 2. ไปที่ ส่วนขยาย (Extensions) -> Apps Script
 * 3. ลบโค้ดเดิมทั้งหมด แล้วนำโค้ดใหม่นี้ไปวางทับ
 * 4. กด บันทึก
 * 5. กด การทำให้ใช้งานได้ (Deploy) -> จัดการการทำให้ใช้งานได้ (Manage deployments)
 * 6. กดที่ไอคอน รูปดินสอ (แก้ไข) ด้านบนขวา 
 * 7. เลือกเวอร์ชันเป็น "เวอร์ชันใหม่" (New version)
 * 8. กด การทำให้ใช้งานได้ (Deploy)
 */

// แมปปิ้งชื่อชีตในไฟล์ Google Sheets ของคุณ
const SHEETS = {
    projects: 'Projects',
    projectTypes: 'ProjectTypes',
    subItems: 'SubItems',
    regionalOffices: 'RegionalOffices',
    units: 'Units',
    users: 'Users'
};

// Handle POST request (Add, Update, Delete)
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        // Batch save all sheets
        if (data.action === 'save_all') {
            const results = {};
            for (const [key, sheetData] of Object.entries(data.payload)) {
                if (SHEETS[key]) {
                    results[key] = overwriteSheet(SHEETS[key], sheetData);
                }
            }
            return ContentService.createTextOutput(JSON.stringify({ success: true, results: results })).setMimeType(ContentService.MimeType.JSON);
        }

        // Save a specific sheet
        if (data.action === 'save_sheet') {
            const targetSheetName = SHEETS[data.sheetKey];
            if (!targetSheetName) {
                return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid sheet key' })).setMimeType(ContentService.MimeType.JSON);
            }
            const count = overwriteSheet(targetSheetName, data.payload);
            return ContentService.createTextOutput(JSON.stringify({ success: true, count: count, sheet: targetSheetName })).setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Handle GET request (Fetch all data)
function doGet(e) {
    try {
        const payload = {};

        // Fetch all sheets defined in configs
        for (const [key, sheetName] of Object.entries(SHEETS)) {
            payload[key] = readSheet(sheetName);
        }

        return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Helper: Ensure the sheet exists
function getOrCreateSheet(name) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
    }
    return sheet;
}

// Helper: Read a specific sheet and convert rows to objects
function readSheet(sheetName) {
    const sheet = getOrCreateSheet(sheetName);
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();

    if (data.length <= 1) {
        return []; // Empty or only headers
    }

    const headers = data[0];
    const items = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const p = {};
        let emptyRow = true;
        headers.forEach((h, index) => {
            let val = row[index];
            if (val !== "") emptyRow = false;

            if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                try { val = JSON.parse(val); } catch (e) { /* ignore */ }
            }
            p[h] = val;
        });
        if (!emptyRow) {
            items.push(p);
        }
    }
    return items;
}

// Helper: Overwrite sheet completely using the array of objects provided
function overwriteSheet(sheetName, itemArray) {
    const sheet = getOrCreateSheet(sheetName);
    sheet.clear();

    // Normalize dictionaries if itemArray is a plain array of strings,
    // we could just treat it differently, but data.js stores object lists like DEFAULT_USERS, or objects of arrays like DEFAULT_SUB_ITEMS.
    // Wait! DB.getSubItems() returns an Object (e.g. {'type1': ['a','b'], 'type2': ['c']})
    // Let's coerce everything into a format that fits in a table.

    // If no data, just return
    if (!itemArray || (Array.isArray(itemArray) && itemArray.length === 0) || Object.keys(itemArray).length === 0) {
        return 0;
    }

    // Handle case where itemArray is an Object (e.g. DEFAULT_SUB_ITEMS: { 'งานก่อสร้าง': ['ถนล'], ... })
    if (!Array.isArray(itemArray) && typeof itemArray === 'object') {
        // Convert to array of key-value objects
        const normalized = [];
        for (const [k, v] of Object.entries(itemArray)) {
            normalized.push({ _key: k, _value: v });
        }
        itemArray = normalized;
    }

    // Handle case where itemArray is array of strings (e.g. REGIONAL_OFFICES)
    if (Array.isArray(itemArray) && itemArray.length > 0 && typeof itemArray[0] !== 'object') {
        itemArray = itemArray.map(val => ({ _value: val }));
    }

    // At this point itemArray is guaranteed to be an Array of Objects.
    let headers = [];
    if (itemArray.length > 0) {
        headers = Object.keys(itemArray[0]);
    }

    if (headers.length === 0) return 0;

    sheet.appendRow(headers);

    const rows = itemArray.map(p => {
        return headers.map(h => {
            let val = p[h];
            if (typeof val === 'object') return JSON.stringify(val);
            return val === undefined ? '' : val;
        });
    });

    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    return rows.length;
}
