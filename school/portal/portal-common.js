/**
 * 教室ポータル - 共通ヘルパー（個人アカウント）
 *
 * config.js の後、auth-check.js より前に読み込んでください。
 * school/portal/ 配下の各ページ（index.html, itpassport/*）から利用します。
 */

const PORTAL_STUDENT_ID_KEY = 'pentech_portal_student_id';
const PORTAL_STUDENT_NAME_KEY = 'pentech_portal_student_name';
// 2026-09-07追記: タイピングランド家庭用ブックマークレット生成のため、ログイン中のみ
// sessionStorageにパスワードを保持する（タブを閉じれば消える）。ブックマークレットURI自体に
// studentId+passwordを埋め込む方式はCEO確定事項（20260907_タイピングランドportal統合_PRD.md参照）。
const PORTAL_STUDENT_PASSWORD_KEY = 'pentech_portal_student_password';

function getLoggedInStudent() {
    const studentId = sessionStorage.getItem(PORTAL_STUDENT_ID_KEY);
    if (!studentId) return null;
    return {
        studentId: studentId,
        displayName: sessionStorage.getItem(PORTAL_STUDENT_NAME_KEY) || studentId,
        // ログイン処理を経ていないセッション（本機能追加前からのセッション等）ではnullになりうる
        password: sessionStorage.getItem(PORTAL_STUDENT_PASSWORD_KEY) || null
    };
}

function setLoggedInStudent(studentId, displayName, password) {
    sessionStorage.setItem(PORTAL_STUDENT_ID_KEY, studentId);
    sessionStorage.setItem(PORTAL_STUDENT_NAME_KEY, displayName || studentId);
    if (password) {
        sessionStorage.setItem(PORTAL_STUDENT_PASSWORD_KEY, password);
    }
}

function logoutStudent() {
    sessionStorage.removeItem(PORTAL_STUDENT_ID_KEY);
    sessionStorage.removeItem(PORTAL_STUDENT_NAME_KEY);
    sessionStorage.removeItem(PORTAL_STUDENT_PASSWORD_KEY);
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
