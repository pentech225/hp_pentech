/**
 * 教室ポータル - 共通ヘルパー（個人アカウント）
 *
 * config.js の後、auth-check.js より前に読み込んでください。
 * school/portal/ 配下の各ページ（index.html, itpassport/*）から利用します。
 */

const PORTAL_STUDENT_ID_KEY = 'pentech_portal_student_id';
const PORTAL_STUDENT_NAME_KEY = 'pentech_portal_student_name';

function getLoggedInStudent() {
    const studentId = sessionStorage.getItem(PORTAL_STUDENT_ID_KEY);
    if (!studentId) return null;
    return {
        studentId: studentId,
        displayName: sessionStorage.getItem(PORTAL_STUDENT_NAME_KEY) || studentId
    };
}

function setLoggedInStudent(studentId, displayName) {
    sessionStorage.setItem(PORTAL_STUDENT_ID_KEY, studentId);
    sessionStorage.setItem(PORTAL_STUDENT_NAME_KEY, displayName || studentId);
}

function logoutStudent() {
    sessionStorage.removeItem(PORTAL_STUDENT_ID_KEY);
    sessionStorage.removeItem(PORTAL_STUDENT_NAME_KEY);
    window.location.reload();
}

async function portalGetJson(action, params) {
    const url = new URL(CONFIG.PORTAL_GOOGLE_APPS_SCRIPT_URL);
    url.searchParams.set('action', action);
    Object.keys(params || {}).forEach(function (key) {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.set(key, params[key]);
        }
    });
    const response = await fetch(url.toString());
    return response.json();
}

// text/plain指定はCORSシンプルリクエストのため preflight 不要（既存ブログ機能と同じ手法）
async function portalPostJson(type, data) {
    const response = await fetch(CONFIG.PORTAL_GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: type, data: data })
    });
    return response.json();
}

function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
            const result = reader.result || '';
            resolve(result.substring(result.indexOf(',') + 1));
        };
        reader.onerror = function () {
            reject(new Error('ファイルの読み込みに失敗しました'));
        };
        reader.readAsDataURL(file);
    });
}

// 作品ファイルをGoogleDrive（教室ポータル用GAS経由）にアップロードする
async function portalUploadWork(file, title) {
    const student = getLoggedInStudent();
    if (!student) {
        return { success: false, error: 'ログインしていません' };
    }
    const base64 = await readFileAsBase64(file);
    return portalPostJson('uploadWork', {
        studentId: student.studentId,
        displayName: student.displayName,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: base64,
        title: title || ''
    });
}
