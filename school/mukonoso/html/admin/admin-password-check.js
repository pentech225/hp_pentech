/**
 * 管理者ページ用パスワード保護スクリプト
 */

(function() {
    'use strict';
    
    // CONFIGが読み込まれているか確認
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIGが読み込まれていません。config.jsを先に読み込んでください。');
        return;
    }
    
    // 管理者用パスワード（必要に応じてconfig.jsから取得可能）
    const ADMIN_PASSWORD = CONFIG.ADMIN_PASSWORD || CONFIG.PASSWORD || 'admin123';
    
    // セッションストレージで認証状態を確認
    const AUTH_KEY = 'iteen_mukonosou_admin_authenticated';
    const isAuthenticated = sessionStorage.getItem(AUTH_KEY) === 'true';
    
    // 既に認証されている場合は何もしない
    if (isAuthenticated) {
        return;
    }
    
    // ページ全体を非表示にするCSSを追加
    const style = document.createElement('style');
    style.id = 'admin-password-protection-style';
    style.textContent = `
        html {
            visibility: hidden !important;
        }
        body {
            visibility: hidden !important;
        }
        #admin-password-modal {
            visibility: visible !important;
        }
    `;
    document.head.appendChild(style);
    
    // パスワード入力モーダルを表示
    function showPasswordModal() {
        // 既存のモーダルがあれば削除
        const existingModal = document.getElementById('admin-password-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // モーダルのHTMLを作成
        const modal = document.createElement('div');
        modal.id = 'admin-password-modal';
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
                <h2 style="
                    color: #333;
                    margin-top: 0;
                    margin-bottom: 20px;
                    font-size: 1.5rem;
                ">🔒 管理者認証</h2>
                <p style="
                    color: #666;
                    margin-bottom: 25px;
                    font-size: 0.95rem;
                ">このページにアクセスするには管理者パスワードが必要です。</p>
                <input 
                    type="password" 
                    id="admin-password-input" 
                    placeholder="管理者パスワードを入力してください"
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #E0E0E0;
                        border-radius: 8px;
                        font-size: 1rem;
                        margin-bottom: 15px;
                        box-sizing: border-box;
                    "
                    autofocus
                >
                <div id="admin-password-error" style="
                    color: #F44336;
                    font-size: 0.85rem;
                    margin-bottom: 15px;
                    display: none;
                ">パスワードが正しくありません。</div>
                <button 
                    id="admin-password-submit" 
                    style="
                        width: 100%;
                        padding: 12px;
                        background-color: #4A90E2;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    "
                    onmouseover="this.style.backgroundColor='#357ABD'"
                    onmouseout="this.style.backgroundColor='#4A90E2'"
                >ログイン</button>
            </div>
        `;
        
        // bodyに追加
        if (document.body) {
            document.body.appendChild(modal);
        } else {
            document.documentElement.appendChild(modal);
        }
        
        // パスワード入力フィールドとボタンを取得
        const passwordInput = document.getElementById('admin-password-input');
        const passwordSubmit = document.getElementById('admin-password-submit');
        const passwordError = document.getElementById('admin-password-error');
        
        // Enterキーで送信
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
        
        // 送信ボタンのクリックイベント
        passwordSubmit.addEventListener('click', checkPassword);
        
        // パスワードチェック関数
        function checkPassword() {
            const inputPassword = passwordInput.value.trim();
            
            if (inputPassword === ADMIN_PASSWORD) {
                // パスワードが正しい場合
                sessionStorage.setItem(AUTH_KEY, 'true');
                
                // 保護用のCSSを削除
                const protectionStyle = document.getElementById('admin-password-protection-style');
                if (protectionStyle) {
                    protectionStyle.remove();
                }
                
                modal.remove();
                // ページをリロードして、認証状態を反映
                window.location.reload();
            } else {
                // パスワードが間違っている場合
                passwordError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
                // 入力フィールドを赤くする
                passwordInput.style.borderColor = '#F44336';
                passwordInput.style.backgroundColor = '#ffebee';
                
                // 2秒後に元に戻す
                setTimeout(function() {
                    passwordError.style.display = 'none';
                    passwordInput.style.borderColor = '#E0E0E0';
                    passwordInput.style.backgroundColor = 'white';
                }, 2000);
            }
        }
        
        // フォーカスをパスワード入力フィールドに設定
        passwordInput.focus();
    }
    
    // ページが読み込まれたらモーダルを表示
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showPasswordModal);
    } else {
        showPasswordModal();
    }
})();

