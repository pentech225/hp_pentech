/**
 * iTeen 武庫之荘校 - 共通設定ファイル
 * 
 * このファイルには、contact.htmlとreserve.htmlで共通に使用する設定値を定義します。
 * 設定値を変更する場合は、このファイルのみを編集してください。
 */

// Google Apps ScriptのWebアプリURL
const CONFIG = {
    // Google Apps ScriptのWebアプリURL
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzopuMxVo5JqONEXkHeSaAVldYVjNX0WGh9EtR0436gHGVbYM9LFK5S4SGjHM3AowHJ/exec',
    
    // 連絡先情報
    PHONE: '06-6438-8277',
    EMAIL: 'iteen.mukonosou@gmail.com',
    FAX: '06-6438-8278',
    
    // LINE URL
    LINE_URL: 'https://page.line.me/555qxcak?oat_content=url&openQrModal=true',
    
    // パスワード保護設定
    // PASSWORD_PROTECTION_ENABLED: true に設定すると、サイト全体がパスワード保護されます
    // PASSWORD_PROTECTION_ENABLED: false に設定すると、パスワード保護が無効になります
    PASSWORD_PROTECTION_ENABLED: true,
    
    // パスワード（PASSWORD_PROTECTION_ENABLEDがtrueの場合に使用）
    PASSWORD: '123'
};

