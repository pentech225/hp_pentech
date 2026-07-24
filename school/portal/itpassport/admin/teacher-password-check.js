/**
 * ITパスポートコース 先生用ページの共通パスワード保護スクリプト
 *
 * 使用方法：
 * 1. ../../config.js を先に読み込む
 * 2. このスクリプトを読み込む
 * 3. HTMLの<head>セクションに配置する
 */

(function () {
    'use strict';

    if (typeof CONFIG === 'undefined') {
        console.error('CONFIGが読み込まれていません。config.jsを先に読み込んでください。');
        return;
    }

    const TEACHER_PASSWORD = CONFIG.TEACHER_PASSWORD || '';
    const AUTH_KEY = 'pentech_itpassport_teacher_authenticated';
    const isAuthenticated = sessionStorage.getItem(AUTH_KEY) === 'true';

    if (isAuthenticated) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'teacher-password-protection-style';
    style.textContent = `
        html { visibility: hidden !important; }
        body { visibility: hidden !important; }
        #teacher-password-modal { visibility: visible !important; }
    `;
    document.head.appendChild(style);

    function showPasswordModal() {
        const existingModal = document.getElementById('teacher-password-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'teacher-password-modal';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: rgba(0, 0, 0, 0.8) !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Arial, sans-serif !important;
            visibility: visible !important;
        `;

        modal.innerHTML = `
            <div style="
                background-color: white;
                border-radius: 15px;
                padding: 40px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                text-align: center;
            ">
                <h2 style="color:#333; margin-top:0; margin-bottom:20px; font-size:1.5rem;">🔒 先生用ページ</h2>
                <p style="color:#666; margin-bottom:25px; font-size:0.95rem;">このページにアクセスするには先生用パスワードが必要です。</p>
                <input
                    type="password"
                    id="teacher-password-input"
                    placeholder="先生用パスワードを入力してください"
                    style="width:100%; padding:12px; border:2px solid #E0E0E0; border-radius:8px; font-size:1rem; margin-bottom:15px; box-sizing:border-box;"
                    autofocus
                >
                <div id="teacher-password-error" style="color:#F44336; font-size:0.85rem; margin-bottom:15px; display:none;">パスワードが正しくありません。</div>
                <button
                    id="teacher-password-submit"
                    style="width:100%; padding:12px; background-color:#4A90E2; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:bold; cursor:pointer;"
                >ログイン</button>
            </div>
        `;

        if (document.body) {
            document.body.appendChild(modal);
        } else {
            document.documentElement.appendChild(modal);
        }

        const passwordInput = document.getElementById('teacher-password-input');
        const passwordSubmit = document.getElementById('teacher-password-submit');
        const passwordError = document.getElementById('teacher-password-error');

        passwordInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') checkPassword();
        });
        passwordSubmit.addEventListener('click', checkPassword);

        function checkPassword() {
            const inputPassword = passwordInput.value.trim();

            if (inputPassword === TEACHER_PASSWORD) {
                sessionStorage.setItem(AUTH_KEY, 'true');
                const protectionStyle = document.getElementById('teacher-password-protection-style');
                if (protectionStyle) protectionStyle.remove();
                modal.remove();
                window.location.reload();
            } else {
                passwordError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
                passwordInput.style.borderColor = '#F44336';
                passwordInput.style.backgroundColor = '#ffebee';
                setTimeout(function () {
                    passwordError.style.display = 'none';
                    passwordInput.style.borderColor = '#E0E0E0';
                    passwordInput.style.backgroundColor = 'white';
                }, 2000);
            }
        }

        passwordInput.focus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showPasswordModal);
    } else {
        showPasswordModal();
    }
})();
