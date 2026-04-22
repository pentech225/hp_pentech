/**
 * iTeen 武庫之荘校 - 共通設定ファイル
 * 
 * このファイルには、contact.htmlとreserve.htmlで共通に使用する設定値を定義します。
 * 設定値を変更する場合は、このファイルのみを編集してください。
 */

// Google Apps ScriptのWebアプリURL
const CONFIG = {
    // Google Apps ScriptのWebアプリURL（体験会・お問い合わせフォーム用）
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyGWLE6Z574DGYk6BQqaksJ_UdSyJndAh7Fkf7AlzG_8vNku6BEKpTDCIRNz_2FwYqP/exec',

    // イベント申し込みフォーム専用GAS URL（↓デプロイ後に貼り付ける）
    EVENT_GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby60qiEn0to3gqumebdJF4yS7XQL5dWhLSaaQZpuucKkCt1pE9MZ-RlmpDGwZ7nxMNl/exec',
    
    // 連絡先情報
    PHONE: '06-6438-8277',
    EMAIL: 'iteen.mukonosou@gmail.com',
    FAX: '06-6438-8278',
    
    // LINE URL
    LINE_URL: 'https://page.line.me/555qxcak?oat_content=url&openQrModal=true',
    
    // パスワード保護設定
    // PASSWORD_PROTECTION_ENABLED: true に設定すると、サイト全体がパスワード保護されます
    // PASSWORD_PROTECTION_ENABLED: false に設定すると、パスワード保護が無効になります
    PASSWORD_PROTECTION_ENABLED: false,
    
    // パスワード（PASSWORD_PROTECTION_ENABLEDがtrueの場合に使用）
    PASSWORD: '123',
    
    // 管理者用パスワード（メール送信履歴ページなどで使用）
    ADMIN_PASSWORD: 'admin123'
};

