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

    // ブログ記事管理専用GAS URL（blog-gas-code.js をデプロイ後に貼り付ける）
    BLOG_GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw5hzA5xBL6CdIT-28zMS_WVnge-JgAVQYpc3KZ_t2hX8JILttZ4YlVsKOqOWT-1XqlRw/exec',

    // イベント申し込みフォーム専用GAS URL（↓デプロイ後に貼り付ける）
    EVENT_GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby60qiEn0to3gqumebdJF4yS7XQL5dWhLSaaQZpuucKkCt1pE9MZ-RlmpDGwZ7nxMNl/exec',

    // スキル街道（生徒進捗管理）専用GAS URL（skill-trail-gas-code.js をデプロイ後に貼り付ける）
    // 未デプロイの間はプレースホルダのままでよい（skill-trail.htmlは生徒一覧取得に失敗しエラー表示になるだけ）
    SKILL_TRAIL_GOOGLE_APPS_SCRIPT_URL: 'YOUR_SKILL_TRAIL_GOOGLE_APPS_SCRIPT_URL',

    // 講師モードパスワードのクライアント側フォールバック値（表示ヒント用途のみ）
    // 注意: 実際の承認・差し戻し等の書き込み許可は必ずGAS側 Script Properties の
    // SKILL_TRAIL_STAFF_PASSWORD との照合で決まる。この値だけを書き換えても書き込みは通らない。
    // デプロイ手順書 SKILL_TRAIL_DEPLOY.md の指示に従い、Script Properties 側の値と揃えておくこと。
    SKILL_TRAIL_STAFF_PASSWORD_HINT: 'skilltrail-staff',

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
    
    // 管理者アカウント（ログインページで使用）
    ADMIN_ID: 'admin2026',
    ADMIN_PASSWORD: '202605',

    // Matomoアクセス解析設定
    // MATOMO_URL: Matomoをインストールしたサーバーのベースアドレス（末尾に / を含める）
    //   例: 'https://analytics.pentech.info/'
    // 空文字のままにしておくと解析コードは読み込まれません（Matomo未設置の状態）。
    MATOMO_URL: '',

    // MatomoでこのサイトのサイトIDとして発行された番号（管理画面「サイト」で確認）
    MATOMO_SITE_ID: '1'
};

