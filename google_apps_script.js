/**
 * Google Apps Script - Project Budget Database
 * 
 * วิธีการนำไปใช้:
 * 1. สร้าง Google Sheet ใหม่
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมดแล้ววางโค้ดนี้ลงไป
 * 4. กดปุ่มบันทึก (ไอคอนรูปแผ่นดิสก์)
 * 5. กด "การทำให้ใช้งานได้" (Deploy) -> "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 6. เลือกประเภทการทำให้ใช้งานได้เป็น "เว็บแอป" (Web App)
 * 7. ตั้งค่า "ผู้มีสิทธิ์เข้าถึง" (Who has access) เป็น "ทุกคน" (Anyone)
 * 8. กด "ทำให้ใช้งานได้" (Deploy)
 * 9. (กดยืนยันสิทธิ์บัญชี Google ของคุณ หากมีแจ้งเตือน)
 * 10. คัดลอก "URL ของเว็บแอป" (Web App URL) แล้วส่งกลับมาให้ผมครับ
 */

const SHEET_NAME = 'Projects';

// Handle POST request (Add, Update, Delete)
function doPost(e) {
    try {
        const sheet = getOrCreateSheet(SHEET_NAME);
        const data = JSON.parse(e.postData.contents);

        // In this simple architecture, we replace the entire projects table 
        // to maintain exact synchronization with the frontend's JSON list.
        if (data.action === 'save_projects') {
            const projects = data.projects;
            sheet.clear();

            if (!projects || projects.length === 0) {
                return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
            }

            // Extract all possible keys/headers from the first project
            const headers = Object.keys(projects[0]);
            sheet.appendRow(headers);

            // Map data to rows based on headers
            const rows = projects.map(p => {
                return headers.map(h => {
                    let val = p[h];
                    if (typeof val === 'object') return JSON.stringify(val);
                    return val === undefined ? '' : val;
                });
            });

            // Write rows to sheet
            sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

            return ContentService.createTextOutput(JSON.stringify({ success: true, count: rows.length })).setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Handle GET request (Fetch data)
function doGet(e) {
    try {
        const sheet = getOrCreateSheet(SHEET_NAME);
        const dataRange = sheet.getDataRange();
        const data = dataRange.getValues();

        // Return empty array if sheet is empty or only has headers
        if (data.length <= 1) {
            return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
        }

        const headers = data[0];
        const projects = [];

        // Parse rows to JSON objects
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const p = {};
            let emptyRow = true;
            headers.forEach((h, index) => {
                let val = row[index];
                if (val !== "") emptyRow = false;

                // Try to parse array/objects if needed
                if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                    try { val = JSON.parse(val); } catch (e) { /* ignore */ }
                }
                p[h] = val;
            });
            if (!emptyRow) {
                projects.push(p);
            }
        }

        return ContentService.createTextOutput(JSON.stringify(projects)).setMimeType(ContentService.MimeType.JSON);
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
