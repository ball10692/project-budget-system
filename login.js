// ---- Toast ----
function showToast(msg, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (localStorage.getItem('pb_currentUser')) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const userStr = document.getElementById('loginUsername').value;
        const passStr = document.getElementById('loginPassword').value;

        const user = DB.authenticate(userStr, passStr);
        if (user) {
            localStorage.setItem('pb_currentUser', JSON.stringify(user));
            window.location.href = 'index.html';
        } else {
            showToast('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', 'error');
        }
    });
});
