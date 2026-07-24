/**
 * 個人アカウント ログイン/新規登録スクリプト（教室ポータル専用）
 *
 * password-check.js の後継。生徒ごとの自己申告ID＋パスワードでログインし、
 * 未登録の場合は「はじめて」ボタンからその場で新規登録できる。
 *
 * 使用方法：
 * 1. config.js → portal-common.js → このスクリプトの順で読み込む
 * 2. HTMLの<head>セクションに配置する
 */

(function () {
    'use strict';

    if (typeof CONFIG === 'undefined') {
        console.error('CONFIGが読み込まれていません。config.jsを先に読み込んでください。');
        return;
    }

    if (typeof getLoggedInStudent !== 'function') {
        console.error('portal-common.jsが読み込まれていません。');
        return;
    }

    // すでにログイン済みなら何もしない
    if (getLoggedInStudent()) {
        return;
    }

    // ページ全体を非表示にするCSSを追加（モーダルは表示されるようにする）
    const style = document.createElement('style');
    style.id = 'auth-protection-style';
    style.textContent = `
        html { visibility: hidden !important; }
        body { visibility: hidden !important; }
        #auth-modal { visibility: visible !important; }
    `;
    document.head.appendChild(style);

    function showAuthModal() {
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
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
            overflow-y: auto !important;
            padding: 20px !important;
            box-sizing: border-box !important;
        `;

        modal.innerHTML = `
            <div style="
                background-color: white;
                border-radius: 15px;
                padding: 40px;
                max-width: 380px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                text-align: center;
            ">
                <h2 style="color:#333; margin-top:0; margin-bottom:8px; font-size:1.4rem;">🏫 教室ポータル</h2>
                <p style="color:#666; margin-bottom:20px; font-size:0.9rem; line-height:1.5;">
                    自分で決めたIDとパスワードでログインしてね。<br>
                    はじめての人は「はじめて」ボタンから登録してね。
                </p>
                <input
                    type="text"
                    id="auth-id-input"
                    placeholder="ID（自分で決める）"
                    autocomplete="username"
                    autofocus
                    style="width:100%; padding:12px; border:2px solid #E0E0E0; border-radius:8px; font-size:1rem; margin-bottom:10px; box-sizing:border-box;"
                >
                <input
                    type="password"
                    id="auth-password-input"
                    placeholder="パスワード"
                    autocomplete="current-password"
                    style="width:100%; padding:12px; border:2px solid #E0E0E0; border-radius:8px; font-size:1rem; margin-bottom:15px; box-sizing:border-box;"
                >
                <div id="auth-error" style="color:#F44336; font-size:0.85rem; margin-bottom:15px; display:none;"></div>
                <div style="display:flex; gap:10px;">
                    <button id="auth-login-btn" style="flex:1; padding:12px; background-color:#4A90E2; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:bold; cursor:pointer; transition: background-color 0.2s;">ログイン</button>
                    <button id="auth-register-btn" style="flex:1; padding:12px; background-color:#F5A623; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:bold; cursor:pointer; transition: background-color 0.2s;">はじめて</button>
                </div>
            </div>
        `;

        if (document.body) {
            document.body.appendChild(modal);
        } else {
            document.documentElement.appendChild(modal);
        }

        const idInput = document.getElementById('auth-id-input');
        const pwInput = document.getElementById('auth-password-input');
        const errorEl = document.getElementById('auth-error');
        const loginBtn = document.getElementById('auth-login-btn');
        const registerBtn = document.getElementById('auth-register-btn');

        function showError(message) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            pwInput.style.borderColor = '#F44336';
            pwInput.style.backgroundColor = '#ffebee';
            setTimeout(function () {
                errorEl.style.display = 'none';
                pwInput.style.borderColor = '#E0E0E0';
                pwInput.style.backgroundColor = 'white';
            }, 3000);
        }

        function setButtonsDisabled(disabled) {
            loginBtn.disabled = disabled;
            registerBtn.disabled = disabled;
            loginBtn.style.opacity = disabled ? '0.6' : '1';
            registerBtn.style.opacity = disabled ? '0.6' : '1';
        }

        function onSuccess(student) {
            setLoggedInStudent(student.studentId, student.displayName);
            const protectionStyle = document.getElementById('auth-protection-style');
            if (protectionStyle) protectionStyle.remove();
            modal.remove();
            window.location.reload();
        }

        async function handleLogin() {
            const studentId = idInput.value.trim();
            const password = pwInput.value.trim();
            if (!studentId || !password) {
                showError('IDとパスワードを入力してください');
                return;
            }
            setButtonsDisabled(true);
            try {
                const result = await portalPostJson('login', { studentId: studentId, password: password });
                if (result.success) {
                    onSuccess(result.student);
                } else {
                    showError(result.error || 'ログインできませんでした');
                }
            } catch (err) {
                showError('通信エラーが発生しました。しばらくしてからもう一度お試しください。');
            } finally {
                setButtonsDisabled(false);
            }
        }

        async function handleRegister() {
            const studentId = idInput.value.trim();
            const password = pwInput.value.trim();
            if (!studentId || !password) {
                showError('IDとパスワードを入力してください');
                return;
            }
            if (studentId.length < 2 || password.length < 2) {
                showError('IDとパスワードは2文字以上にしてください');
                return;
            }
            setButtonsDisabled(true);
            try {
                const result = await portalPostJson('register', { studentId: studentId, password: password });
                if (result.success) {
                    onSuccess(result.student);
                } else {
                    showError(result.error || '登録できませんでした');
                }
            } catch (err) {
                showError('通信エラーが発生しました。しばらくしてからもう一度お試しください。');
            } finally {
                setButtonsDisabled(false);
            }
        }

        loginBtn.addEventListener('click', handleLogin);
        registerBtn.addEventListener('click', handleRegister);
        pwInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') handleLogin();
        });

        idInput.focus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showAuthModal);
    } else {
        showAuthModal();
    }
})();
