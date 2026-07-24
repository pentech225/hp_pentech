/**
 * 教室ポータル - 共通設定ファイル
 *
 * このファイルには、school/portal/ 配下の各ページで使用する設定値を定義します。
 */

const CONFIG = {
    // 個人アカウント（登録・ログイン・進捗管理）のバックエンドURL
    // school/portal/portal-gas-code.js をGoogle Apps Scriptにデプロイして、
    // 発行されたウェブアプリURLをここに設定してください。
    PORTAL_GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyIIq7pYWuGQnZsXo6WrMR5yDNjIkcXkBlgLv8ZF80giSR8FzUcUdeyXrRZbmkyy0PUWg/exec',

    // ITパスポートコースの先生用管理画面（宿題の割り当て）のパスワード
    TEACHER_PASSWORD: 'teacher26'
};
