/**
 * iTeen予約フォーム - Google Apps Script
 * 
 * このコードをGoogle Apps Scriptのエディタに貼り付けて使用してください。
 * 詳細な設定手順は、GOOGLE_APPS_SCRIPT_SETUP.mdを参照してください。
 */

// CORSヘッダーを設定するヘルパー関数
// 注意: Google Apps Scriptでは、setHeaders()はWebアプリとしてデプロイした場合のみ動作します
// また、プリフライトリクエスト（OPTIONS）にはdoOptions()関数で対応する必要があります
function setCorsHeaders(output) {
  if (!output) {
    output = ContentService.createTextOutput('');
  }
  // CORSヘッダーを設定
  // Google Apps Scriptでは、setHeaders()は実際には動作しない場合があります
  // そのため、no-corsモードを使用するか、またはHtmlServiceを使用する必要があります
  try {
    return output
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  } catch (e) {
    // setHeaders()が失敗した場合は、MIMEタイプのみ設定
    console.error('setHeaders() failed:', e);
    return output.setMimeType(ContentService.MimeType.JSON);
  }
}

// OPTIONSリクエスト（プリフライト）に対応
// ブラウザがCORSプリフライトリクエストを送信する場合に呼び出されます
function doOptions() {
  try {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
      });
  } catch (e) {
    console.error('doOptions() setHeaders() failed:', e);
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // ログ出力（Loggerとconsoleの両方を使用）
  Logger.log('=== doPost関数が呼び出されました ===');
  console.log('=== doPost関数が呼び出されました ===');
  
  try {
    // リクエストデータを取得
    if (!e || !e.postData || !e.postData.contents) {
      // エディタから直接実行された場合のエラーメッセージ
      const errorMsg = 'リクエストデータが正しくありません。\n\n' +
        'この関数は、Webアプリとしてデプロイしてから、HTTP POSTリクエストで呼び出す必要があります。\n' +
        'エディタから直接実行することはできません。\n\n' +
        'e: ' + JSON.stringify(e);
      Logger.log('❌ エラー: ' + errorMsg);
      console.error('❌ エラー: ' + errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = JSON.parse(e.postData.contents);
    Logger.log('📥 受信データ: ' + JSON.stringify(data));
    console.log('📥 受信データ:', data);
    
    // リクエストタイプを判定
    const requestType = data.type;
    
    if (requestType === 'save_article') {
      // 記事保存の処理
      Logger.log('📝 記事保存の処理を開始');
      console.log('📝 記事保存の処理を開始');
      return handleArticleSave(data.data);
    }
    
    if (requestType === 'publish_article') {
      // 記事投稿の処理
      Logger.log('📤 記事投稿の処理を開始');
      console.log('📤 記事投稿の処理を開始');
      return handleArticlePublish(data.data);
    }
    
    // 問い合わせフォームか予約フォームかを判定
    const isContactForm = data.message && !data.date_raw && !data.date;
    Logger.log('📋 フォームタイプ判定: ' + (isContactForm ? 'お問い合わせ' : '予約'));
    console.log('📋 フォームタイプ判定: ' + (isContactForm ? 'お問い合わせ' : '予約'));
    
    if (isContactForm) {
      // 問い合わせフォームの処理
      Logger.log('📧 問い合わせフォームの処理を開始');
      console.log('📧 問い合わせフォームの処理を開始');
      return handleContactForm(data);
    } else {
      // 予約フォームの処理
      Logger.log('📅 予約フォームの処理を開始');
      console.log('📅 予約フォームの処理を開始');
      return handleReservationForm(data);
    }
  } catch (error) {
    // エラーログを記録
    Logger.log('❌ doPostエラー: ' + error.toString());
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ doPostエラー:', error);
    console.error('❌ エラースタック:', error.stack);
    
    // エラーレスポンス
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      stack: error.stack
    })));
  }
}

// 問い合わせフォームの処理
function handleContactForm(data) {
  try {
    // データの検証
    const email = data.email ? data.email.trim() : '';
    const message = data.message ? data.message.trim() : '';
    
    if (!email) {
      throw new Error('メールアドレスが指定されていません。');
    }
    if (!message) {
      throw new Error('お問い合わせ内容が指定されていません。');
    }
    
    console.log('問い合わせフォーム受信データ:', {
      email: email,
      phone: data.phone,
      message: message,
      hasBody: !!data.body
    });
    
    const to = data.to || 'iteen.mukonosou@gmail.com';
    const subject = data.subject || 'お問い合わせ';
    const phone = data.phone ? data.phone.trim() : '未入力';
    
    // メール本文の作成（bodyフィールドが存在し、空でない場合はそれを使用）
    let body;
    if (data.body && data.body.trim() !== '') {
      body = data.body.trim();
      console.log('bodyフィールドを使用してメール送信');
    } else {
      // bodyフィールドがない場合は、個別フィールドから情報を組み立て
      body = `お問い合わせがありました。

メールアドレス: ${email}
電話番号: ${phone}
お問い合わせ内容:
${message}

---
このメールはお問い合わせフォームから自動送信されました。
iTeen 武庫之荘校`;
      console.log('個別フィールドからメール本文を組み立て');
    }
    
    console.log('送信するメール本文:', body);
    /*
    // 管理者へのメール送信
    try {
      GmailApp.sendEmail(to, subject, body);
      console.log('管理者へのメール送信成功');
    } catch (mailError) {
      console.error('管理者へのメール送信エラー:', mailError);
      throw new Error('メール送信エラー: ' + mailError.toString());
    }
    
    // 自動応答メールの送信
    if (data.replyTo && data.replySubject && data.replyBody) {
      try {
        GmailApp.sendEmail(data.replyTo, data.replySubject, data.replyBody);
        console.log('自動応答メール送信成功');
      } catch (replyError) {
        console.error('自動応答メール送信エラー:', replyError);
        // 自動応答メールのエラーは記録するが続行
      }
    }
    */
    // Google Sheetsに履歴を保存
    try {
      //saveToGoogleSheets('contact', {
      saveToGoogleSheets2('contact', {
        timestamp: new Date().toISOString(),
        email: email,
        phone: phone,
        message: message,
        subject: subject
      });
      console.log('Google Sheetsに履歴を保存しました');
    } catch (sheetError) {
      console.error('Google Sheetsへの保存エラー:', sheetError);
      // エラーは記録するが続行（メール送信は成功している）
    }
    
    // 成功レスポンス
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'お問い合わせを受け付けました。メールを送信しました。'
    })));
    
  } catch (error) {
    console.error('問い合わせフォーム処理エラー:', error);
    throw error;
  }
}

// 予約フォームの処理
// 変更: 予約情報をGoogle Sheetsに保存するのみ。メール送信やカレンダー追加は行わない。
function handleReservationForm(data) {
  try {
    Logger.log('📝 予約フォームの処理を開始します（データ保存のみ）');
    console.log('📝 予約フォームの処理を開始します（データ保存のみ）');
    
    // 受信データをログに出力（デバッグ用）
    Logger.log('📥 受信データ: ' + JSON.stringify(data));
    console.log('予約フォーム受信データ:', {
      date: data.date,
      date_raw: data.date_raw,
      time: data.time,
      child_name: data.child_name,
      phone: data.phone,
      email: data.email,
      school_type: data.school_type,
      grade: data.grade,
      message: data.message
    });
    
    // データの準備
    const childName = data.child_name ? data.child_name.trim() : '未入力';
    const phone = data.phone ? data.phone.trim() : '未入力';
    const email = data.email && data.email.trim() !== '' && data.email !== '未入力' ? data.email.trim() : '未入力';
    const schoolType = data.school_type ? data.school_type.trim() : '未入力';
    const grade = data.grade ? data.grade.trim() : '未入力';
    const message = data.message && data.message.trim() !== '' && data.message !== 'なし' ? data.message.trim() : '';
    
    // 複数の予約希望日時を処理
    let dateTimeDisplay = '';
    if (data.date_times && Array.isArray(data.date_times) && data.date_times.length > 0) {
      // 複数の日時がある場合
      dateTimeDisplay = data.date_times.map((dt, index) => {
        const dateStr = dt.date ? dt.date.trim() : '';
        const timeStr = dt.time ? dt.time.trim() : '';
        return `${index + 1}. ${dateStr} ${timeStr}`;
      }).join('\n');
    } else {
      // 後方互換性のため、単一の日時もサポート
      const dateDisplay = data.date ? data.date.trim() : '';
      const timeDisplay = data.time ? data.time.trim() : '';
      dateTimeDisplay = dateDisplay && timeDisplay ? `${dateDisplay} ${timeDisplay}` : '';
    }
    
    // 後方互換性のため、単一の日時も保持
    const dateDisplay = data.date ? data.date.trim() : '';
    const timeDisplay = data.time ? data.time.trim() : '';
    
    // Google Sheetsに履歴を保存（最初に実行）
    Logger.log('📊 Google Sheetsへの保存を開始します...');
    console.log('📊 Google Sheetsへの保存を開始します...');
    
    try {
      // 複数の日時を文字列として保存（Google Sheets用）
      const dateTimeString = data.date_times && Array.isArray(data.date_times) && data.date_times.length > 0
        ? data.date_times.map((dt, index) => {
            const dateStr = dt.date ? dt.date.trim() : '';
            const timeStr = dt.time ? dt.time.trim() : '';
            return `${index + 1}. ${dateStr} ${timeStr}`;
          }).join(', ')
        : (dateDisplay && timeDisplay ? `${dateDisplay} ${timeDisplay}` : '');
      
      const sheetData = {
        timestamp: new Date().toISOString(),
        child_name: childName,
        phone: phone,
        email: email,
        school_type: schoolType,
        grade: grade,
        date: dateDisplay, // 後方互換性のため保持
        time: timeDisplay, // 後方互換性のため保持
        date_times: dateTimeString, // 複数の日時を文字列として保存
        message: message
      };
      
      Logger.log('📋 保存するデータ: ' + JSON.stringify(sheetData));
      console.log('📋 保存するデータ:', sheetData);
      
      Logger.log('📊 saveToGoogleSheets関数を呼び出します...');
      console.log('📊 saveToGoogleSheets関数を呼び出します...');
      
      const result = saveToGoogleSheets('reservation', sheetData);
      
      Logger.log('✅ Google Sheetsに履歴を保存しました。結果: ' + result);
      console.log('✅ Google Sheetsに履歴を保存しました。結果:', result);
      
      // メール通知を送信（保存成功後）
      try {
        Logger.log('📧 メール通知を送信します...');
        console.log('📧 メール通知を送信します...');
        
        const emailSubject = '【新規予約】無料体験予約のお申し込み';
        const dateTimeLabel = data.date_times && Array.isArray(data.date_times) && data.date_times.length > 1 
          ? `予約希望日時（${data.date_times.length}件）:` 
          : '予約希望日時:';
        const emailBody = `新しい予約が追加されました。

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
${dateTimeLabel}
${dateTimeDisplay}${message ? `\n\nご質問・ご要望:\n${message}` : ''}

---
このメールは予約フォームから自動送信されました。
iTeen 武庫之荘校`;
        
        GmailApp.sendEmail('iteen.mukonosou@gmail.com', emailSubject, emailBody);
        
        Logger.log('✅ メール通知を送信しました');
        console.log('✅ メール通知を送信しました');
      } catch (emailError) {
        Logger.log('⚠️ メール通知の送信に失敗しました: ' + emailError.toString());
        Logger.log('⚠️ エラーメッセージ: ' + emailError.message);
        console.warn('⚠️ メール通知の送信に失敗しました:', emailError);
        // メール通知のエラーは記録するが続行（データ保存は成功している）
      }
      
      // LINE通知を送信（保存成功後、LINE Notifyが利用可能な場合のみ）
      // 注意: LINE Notifyは2025年3月31日にサービス終了予定
      // 代替手段としてLINE Messaging APIまたはメール通知を推奨
      try {
        Logger.log('📱 LINE通知を送信します...');
        console.log('📱 LINE通知を送信します...');
        
        const lineDateTimeLabel = data.date_times && Array.isArray(data.date_times) && data.date_times.length > 1 
          ? `予約希望日時（${data.date_times.length}件）:` 
          : '予約希望日時:';
        const lineMessage = `🔔 新しい予約が追加されました

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
${lineDateTimeLabel}
${dateTimeDisplay}${message ? `\n\nご質問・ご要望:\n${message}` : ''}`;
        
        sendLineNotification(lineMessage);
        
        Logger.log('✅ LINE通知を送信しました');
        console.log('✅ LINE通知を送信しました');
      } catch (lineError) {
        Logger.log('⚠️ LINE通知の送信に失敗しました: ' + lineError.toString());
        Logger.log('⚠️ エラーメッセージ: ' + lineError.message);
        console.warn('⚠️ LINE通知の送信に失敗しました:', lineError);
        // LINE通知のエラーは記録するが続行（データ保存は成功している）
      }
      
      // 成功レスポンスを返す（メール送信やカレンダー追加は行わない）
      const successResponse = {
        success: true,
        message: '予約情報を保存しました',
        saved: true
      };
      
      Logger.log('✅ 予約フォーム処理成功（データ保存のみ）');
      console.log('✅ 予約フォーム処理成功（データ保存のみ）:', successResponse);
      
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(successResponse)));
      
    } catch (sheetError) {
      Logger.log('❌ Google Sheetsへの保存エラー: ' + sheetError.toString());
      Logger.log('❌ エラーメッセージ: ' + sheetError.message);
      Logger.log('❌ エラースタック: ' + sheetError.stack);
      console.error('❌ Google Sheetsへの保存エラー:', sheetError);
      console.error('❌ エラー詳細:', {
        message: sheetError.toString(),
        name: sheetError.name,
        stack: sheetError.stack
      });
      
      // エラーレスポンスを返す
      const errorResponse = {
        success: false,
        error: sheetError.toString(),
        message: '予約情報の保存中にエラーが発生しました: ' + sheetError.toString()
      };
      
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(errorResponse)));
    }
    
    // 注意: この関数は予約情報をGoogle Sheetsに保存するのみです。
    // メール送信やカレンダー追加の処理は削除されました。
    
  } catch (error) {
    console.error('❌ 予約フォーム処理エラー:', error);
    console.error('エラー詳細:', {
      message: error.toString(),
      stack: error.stack,
      name: error.name
    });
    
    // エラーレスポンスを返す（クライアント側でエラーを確認できるように）
    const errorResponse = {
      success: false,
      error: error.toString(),
      message: '予約フォームの処理中にエラーが発生しました: ' + error.toString()
    };
    
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(errorResponse)));
  }
}

// 指定されたフォルダを取得または作成するヘルパー関数
function getOrCreateFolder(folderPath) {
  try {
    Logger.log('📁 フォルダを取得または作成します: ' + folderPath);
    console.log('📁 フォルダを取得または作成します:', folderPath);
    
    // DriveAppの権限を確認
    try {
      Logger.log('📁 DriveApp.getRootFolder()を呼び出します...');
      console.log('📁 DriveApp.getRootFolder()を呼び出します...');
      var rootFolder = DriveApp.getRootFolder();
      Logger.log('✅ DriveApp.getRootFolder()成功');
      console.log('✅ DriveApp.getRootFolder()成功');
    } catch (driveError) {
      Logger.log('❌ DriveApp.getRootFolder()エラー: ' + driveError.toString());
      Logger.log('❌ エラーメッセージ: ' + driveError.message);
      console.error('❌ DriveApp.getRootFolder()エラー:', driveError);
      throw new Error('Google Drive APIの権限が不足しています。権限を付与してください: ' + driveError.toString());
    }
    
    const folders = folderPath.split('/');
    let currentFolder = rootFolder;
    
    for (let i = 0; i < folders.length; i++) {
      const folderName = folders[i].trim();
      if (!folderName) continue;
      
      Logger.log('📂 フォルダを検索: ' + folderName);
      console.log('📂 フォルダを検索:', folderName);
      
      const foldersIterator = currentFolder.getFoldersByName(folderName);
      
      if (foldersIterator.hasNext()) {
        // フォルダが存在する場合
        currentFolder = foldersIterator.next();
        Logger.log('✅ 既存のフォルダを使用: ' + folderName);
        console.log('✅ 既存のフォルダを使用:', folderName);
      } else {
        // フォルダが存在しない場合、作成
        Logger.log('📝 新しいフォルダを作成: ' + folderName);
        console.log('📝 新しいフォルダを作成:', folderName);
        currentFolder = currentFolder.createFolder(folderName);
        Logger.log('✅ フォルダを作成しました: ' + folderName);
        console.log('✅ フォルダを作成しました:', folderName);
      }
    }
    
    Logger.log('✅ フォルダパスを解決しました: ' + folderPath);
    Logger.log('📄 フォルダID: ' + currentFolder.getId());
    Logger.log('📄 フォルダURL: ' + currentFolder.getUrl());
    console.log('✅ フォルダパスを解決しました:', folderPath);
    console.log('📄 フォルダID:', currentFolder.getId());
    console.log('📄 フォルダURL:', currentFolder.getUrl());
    
    return currentFolder;
  } catch (error) {
    Logger.log('❌ フォルダ取得/作成エラー: ' + error.toString());
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ フォルダ取得/作成エラー:', error);
    throw new Error('フォルダの取得/作成に失敗しました: ' + error.toString());
  }
}

// Google Sheetsに履歴を保存する関数 変更版
function saveToGoogleSheets2(type, data) {
  try {
    Logger.log('📊 saveToGoogleSheets関数が呼び出されました');
    Logger.log('📊 タイプ: ' + type);
    Logger.log('📊 データ: ' + JSON.stringify(data));
    console.log('📊 saveToGoogleSheets関数が呼び出されました:', { type, data });
    
    // スクリプトプロパティからスプレッドシートIDを取得
    const properties = PropertiesService.getScriptProperties();
    let spreadsheetId = properties.getProperty('GOOGLE_SHEETS_SPREADSHEET_ID');
    
    let spreadsheet;
    
    // スプレッドシートIDが保存されていない場合（初回実行時）は新規作成
    if (!spreadsheetId) {
      Logger.log('📝 初回実行のため、新しいスプレッドシートを作成します...');
      console.log('📝 初回実行のため、新しいスプレッドシートを作成します...');
      
      try {
        // フォルダを取得または作成
        const targetFolder = getOrCreateFolder('pentech_info/manage_reserve');
        
        // スプレッドシートを作成
        spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
        spreadsheetId = spreadsheet.getId();
        const spreadsheetFile = DriveApp.getFileById(spreadsheetId);
        
        // スプレッドシートを指定フォルダに移動
        const currentParents = spreadsheetFile.getParents();
        while (currentParents.hasNext()) {
          const parent = currentParents.next();
          parent.removeFile(spreadsheetFile);
        }
        targetFolder.addFile(spreadsheetFile);
        
        const spreadsheetUrl = spreadsheet.getUrl();
        
        // スクリプトプロパティにスプレッドシートIDを保存
        properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
        
        Logger.log('✅ 新規スプレッドシートを作成しました');
        Logger.log('🔑 スプレッドシートID: ' + spreadsheetId);
        Logger.log('📄 スプレッドシートURL: ' + spreadsheetUrl);
        Logger.log('📁 保存先フォルダ: pentech_info/manage_reserve');
        console.log('✅ 新規スプレッドシートを作成しました');
        console.log('🔑 スプレッドシートID:', spreadsheetId);
        console.log('📄 スプレッドシートURL:', spreadsheetUrl);
        console.log('📁 保存先フォルダ: pentech_info/manage_reserve');
        console.log('💾 スプレッドシートIDをスクリプトプロパティに保存しました');
        console.log('⚠️ このスプレッドシートURLを開いて確認してください:', spreadsheetUrl);
        
        // スクリプトプロパティにスプレッドシートIDを保存
        properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
        
        Logger.log('✅ 新規スプレッドシートを作成しました');
        Logger.log('🔑 スプレッドシートID: ' + spreadsheetId);
        Logger.log('📄 スプレッドシートURL: ' + spreadsheetUrl);
        console.log('✅ 新規スプレッドシートを作成しました');
        console.log('🔑 スプレッドシートID:', spreadsheetId);
        console.log('📄 スプレッドシートURL:', spreadsheetUrl);
        console.log('💾 スプレッドシートIDをスクリプトプロパティに保存しました');
        console.log('⚠️ このスプレッドシートURLを開いて確認してください:', spreadsheetUrl);
      } catch (createError) {
        Logger.log('❌ スプレッドシート作成エラー: ' + createError.toString());
        Logger.log('❌ エラースタック: ' + createError.stack);
        console.error('❌ スプレッドシート作成エラー:', createError);
        console.error('❌ エラー詳細:', {
          message: createError.toString(),
          name: createError.name,
          stack: createError.stack
        });
        throw new Error('スプレッドシートの作成に失敗しました: ' + createError.toString());
      }
    } else {
      // 既存のスプレッドシートを開く
      Logger.log('📂 既存のスプレッドシートを開こうとしています...');
      Logger.log('🔑 スプレッドシートID: ' + spreadsheetId);
      console.log('📂 既存のスプレッドシートを開こうとしています...');
      console.log('🔑 スプレッドシートID:', spreadsheetId);
      
      try {
        spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        Logger.log('✅ 既存のスプレッドシートを開きました: ' + spreadsheet.getName());
        Logger.log('📄 スプレッドシートURL: ' + spreadsheet.getUrl());
        console.log('✅ 既存のスプレッドシートを開きました:', spreadsheet.getName());
        console.log('📄 スプレッドシートURL:', spreadsheet.getUrl());
      } catch (openError) {
        Logger.log('❌ スプレッドシートを開くエラー: ' + openError.toString());
        Logger.log('❌ エラーメッセージ: ' + openError.message);
        Logger.log('❌ エラースタック: ' + openError.stack);
        console.error('❌ スプレッドシートを開くエラー:', openError);
        console.error('❌ エラー詳細:', {
          message: openError.toString(),
          name: openError.name,
          stack: openError.stack
        });
      }
    }
    
    // シート名
    const sheetName = 'EmailHistory';
    Logger.log('📑 シート名: ' + sheetName);
    console.log('📑 シート名:', sheetName);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // シートが存在しない場合は作成
    if (!sheet) {
      Logger.log('📝 シートが存在しないため、新規作成します');
      console.log('📝 シートが存在しないため、新規作成します');
      sheet = spreadsheet.insertSheet(sheetName);
      // ヘッダー行を追加
      const headerRow = [
        'タイムスタンプ',
        '種類',
        'お名前',
        '電話番号',
        'メールアドレス',
        '学校区別',
        '学年',
        '日付',
        '時間',
        'メッセージ',
        '件名'
      ];
      sheet.appendRow(headerRow);
      Logger.log('✅ ヘッダー行を追加しました: ' + JSON.stringify(headerRow));
      console.log('✅ ヘッダー行を追加しました:', headerRow);
      // ヘッダー行を太字にする
      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E0E0E0');
      Logger.log('✅ ヘッダー行の書式を設定しました');
      console.log('✅ ヘッダー行の書式を設定しました');
    } else {
      Logger.log('✅ 既存のシートを使用します');
      console.log('✅ 既存のシートを使用します');
    }
    
    // データを追加
    Logger.log('📝 データを追加します...');
    console.log('📝 データを追加します...');
    if (type === 'reservation') {
      const rowData = [
        data.timestamp,
        '無料体験予約',
        data.child_name || '',
        data.phone || '',
        data.email || '',
        data.school_type || '',
        data.grade || '',
        data.date || '',
        data.time || '',
        data.message || '',
        data.subject || ''
      ];
      Logger.log('📋 追加するデータ（予約）: ' + JSON.stringify(rowData));
      console.log('📋 追加するデータ（予約）:', rowData);
      sheet.appendRow(rowData);
      Logger.log('✅ データを追加しました（予約）');
      console.log('✅ データを追加しました（予約）');
    } else if (type === 'contact') {
      const rowData = [
        data.timestamp,
        'お問い合わせ',
        '',
        data.phone || '',
        data.email || '',
        '',
        '',
        '',
        '',
        data.message || '',
        data.subject || ''
      ];
      Logger.log('📋 追加するデータ（お問い合わせ）: ' + JSON.stringify(rowData));
      console.log('📋 追加するデータ（お問い合わせ）:', rowData);
      sheet.appendRow(rowData);
      Logger.log('✅ データを追加しました（お問い合わせ）');
      console.log('✅ データを追加しました（お問い合わせ）');
    } else {
      Logger.log('⚠️ 不明なタイプ: ' + type);
      console.warn('⚠️ 不明なタイプ:', type);
    }
    
    // データが正しく追加されたか確認
    const lastRow = sheet.getLastRow();
    Logger.log('📊 シートの最終行: ' + lastRow);
    console.log('📊 シートの最終行:', lastRow);
    if (lastRow > 0) {
      const lastRowData = sheet.getRange(lastRow, 1, 1, 11).getValues()[0];
      Logger.log('📋 最終行のデータ: ' + JSON.stringify(lastRowData));
      console.log('📋 最終行のデータ:', lastRowData);
    }
    
    Logger.log('✅ Google Sheetsに履歴を保存しました: タイプ=' + type + ', タイムスタンプ=' + data.timestamp);
    console.log('✅ Google Sheetsに履歴を保存しました:', { type, timestamp: data.timestamp });
    return true;
  } catch (error) {
    Logger.log('❌ Google Sheetsへの保存エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ Google Sheetsへの保存エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

// Google Sheetsに履歴を保存する関数
function saveToGoogleSheets(type, data) {
  try {
    Logger.log('📊 saveToGoogleSheets関数が呼び出されました');
    Logger.log('📊 タイプ: ' + type);
    Logger.log('📊 データ: ' + JSON.stringify(data));
    console.log('📊 saveToGoogleSheets関数が呼び出されました:', { type, data });
    
    // スクリプトプロパティからスプレッドシートIDを取得
    const properties = PropertiesService.getScriptProperties();
    let spreadsheetId = properties.getProperty('GOOGLE_SHEETS_SPREADSHEET_ID');
    
    let spreadsheet;
    
    // スプレッドシートIDが保存されていない場合（初回実行時）は新規作成
    if (!spreadsheetId) {
      Logger.log('📝 初回実行のため、新しいスプレッドシートを作成します...');
      console.log('📝 初回実行のため、新しいスプレッドシートを作成します...');
      
      try {
        // フォルダを取得または作成
        const targetFolder = getOrCreateFolder('pentech_info/manage_reserve');
        
        // スプレッドシートを作成
        spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
        spreadsheetId = spreadsheet.getId();
        const spreadsheetFile = DriveApp.getFileById(spreadsheetId);
        
        // スプレッドシートを指定フォルダに移動
        const currentParents = spreadsheetFile.getParents();
        while (currentParents.hasNext()) {
          const parent = currentParents.next();
          parent.removeFile(spreadsheetFile);
        }
        targetFolder.addFile(spreadsheetFile);
        
        const spreadsheetUrl = spreadsheet.getUrl();
        
        // スクリプトプロパティにスプレッドシートIDを保存
        properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
        
        Logger.log('✅ 新規スプレッドシートを作成しました');
        Logger.log('🔑 スプレッドシートID: ' + spreadsheetId);
        Logger.log('📄 スプレッドシートURL: ' + spreadsheetUrl);
        Logger.log('📁 保存先フォルダ: pentech_info/manage_reserve');
        console.log('✅ 新規スプレッドシートを作成しました');
        console.log('🔑 スプレッドシートID:', spreadsheetId);
        console.log('📄 スプレッドシートURL:', spreadsheetUrl);
        console.log('📁 保存先フォルダ: pentech_info/manage_reserve');
        console.log('💾 スプレッドシートIDをスクリプトプロパティに保存しました');
        console.log('⚠️ このスプレッドシートURLを開いて確認してください:', spreadsheetUrl);
        
        // スクリプトプロパティにスプレッドシートIDを保存
        properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
        
        Logger.log('✅ 新規スプレッドシートを作成しました');
        Logger.log('🔑 スプレッドシートID: ' + spreadsheetId);
        Logger.log('📄 スプレッドシートURL: ' + spreadsheetUrl);
        console.log('✅ 新規スプレッドシートを作成しました');
        console.log('🔑 スプレッドシートID:', spreadsheetId);
        console.log('📄 スプレッドシートURL:', spreadsheetUrl);
        console.log('💾 スプレッドシートIDをスクリプトプロパティに保存しました');
        console.log('⚠️ このスプレッドシートURLを開いて確認してください:', spreadsheetUrl);
      } catch (createError) {
        Logger.log('❌ スプレッドシート作成エラー: ' + createError.toString());
        Logger.log('❌ エラースタック: ' + createError.stack);
        console.error('❌ スプレッドシート作成エラー:', createError);
        console.error('❌ エラー詳細:', {
          message: createError.toString(),
          name: createError.name,
          stack: createError.stack
        });
        throw new Error('スプレッドシートの作成に失敗しました: ' + createError.toString());
      }
    } else {
      // 既存のスプレッドシートを開く
      Logger.log('📂 既存のスプレッドシートを開こうとしています...');
      Logger.log('🔑 スプレッドシートID: ' + spreadsheetId);
      console.log('📂 既存のスプレッドシートを開こうとしています...');
      console.log('🔑 スプレッドシートID:', spreadsheetId);
      
      try {
        spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        Logger.log('✅ 既存のスプレッドシートを開きました: ' + spreadsheet.getName());
        Logger.log('📄 スプレッドシートURL: ' + spreadsheet.getUrl());
        console.log('✅ 既存のスプレッドシートを開きました:', spreadsheet.getName());
        console.log('📄 スプレッドシートURL:', spreadsheet.getUrl());
      } catch (openError) {
        Logger.log('❌ スプレッドシートを開くエラー: ' + openError.toString());
        Logger.log('❌ エラーメッセージ: ' + openError.message);
        Logger.log('❌ エラースタック: ' + openError.stack);
        console.error('❌ スプレッドシートを開くエラー:', openError);
        console.error('❌ エラー詳細:', {
          message: openError.toString(),
          name: openError.name,
          stack: openError.stack
        });
        
        // アクセス権限エラーの場合の詳細メッセージ
        if (openError.toString().includes('アクセス') || openError.toString().includes('access') || openError.toString().includes('permission')) {
          Logger.log('⚠️ アクセス権限エラーの可能性があります');
          Logger.log('⚠️ スプレッドシートID: ' + spreadsheetId);
          Logger.log('⚠️ このスプレッドシートが存在するか、アクセス権限があるか確認してください');
          console.error('⚠️ アクセス権限エラーの可能性があります');
          console.error('⚠️ スプレッドシートID:', spreadsheetId);
          console.error('⚠️ このスプレッドシートが存在するか、アクセス権限があるか確認してください');
        }
        
        // エラーの場合は新規作成
        Logger.log('📝 エラーのため、新しいスプレッドシートを作成します...');
        console.log('📝 エラーのため、新しいスプレッドシートを作成します...');
        
        try {
          // フォルダを取得または作成
          const targetFolder = getOrCreateFolder('pentech_info/manage_reserve');
          
          // スプレッドシートを作成
          spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
          spreadsheetId = spreadsheet.getId();
          const spreadsheetFile = DriveApp.getFileById(spreadsheetId);
          
          // スプレッドシートを指定フォルダに移動
          const currentParents = spreadsheetFile.getParents();
          while (currentParents.hasNext()) {
            const parent = currentParents.next();
            parent.removeFile(spreadsheetFile);
          }
          targetFolder.addFile(spreadsheetFile);
          
          const spreadsheetUrl = spreadsheet.getUrl();
          
          // スクリプトプロパティに新しいスプレッドシートIDを保存
          properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
          
          Logger.log('✅ エラーのため新規スプレッドシートを作成しました: ' + spreadsheetId);
          Logger.log('📄 スプレッドシートURL: ' + spreadsheetUrl);
          Logger.log('📁 保存先フォルダ: pentech_info/manage_reserve');
          console.log('✅ エラーのため新規スプレッドシートを作成しました:', spreadsheetId);
          console.log('📄 スプレッドシートURL:', spreadsheetUrl);
          console.log('📁 保存先フォルダ: pentech_info/manage_reserve');
          console.log('💾 新しいスプレッドシートIDをスクリプトプロパティに保存しました');
        } catch (createError2) {
          Logger.log('❌ 新規作成も失敗しました: ' + createError2.toString());
          console.error('❌ 新規作成も失敗しました:', createError2);
          throw new Error('スプレッドシートの作成に失敗しました: ' + createError2.toString());
        }
      }
    }
    
    // シート名
    const sheetName = 'EmailHistory';
    Logger.log('📑 シート名: ' + sheetName);
    console.log('📑 シート名:', sheetName);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // シートが存在しない場合は作成
    if (!sheet) {
      Logger.log('📝 シートが存在しないため、新規作成します');
      console.log('📝 シートが存在しないため、新規作成します');
      sheet = spreadsheet.insertSheet(sheetName);
      // ヘッダー行を追加
      const headerRow = [
        'タイムスタンプ',
        '種類',
        'お名前',
        '電話番号',
        'メールアドレス',
        '学校区別',
        '学年',
        '日付',
        '時間',
        'メッセージ',
        '件名'
      ];
      sheet.appendRow(headerRow);
      Logger.log('✅ ヘッダー行を追加しました: ' + JSON.stringify(headerRow));
      console.log('✅ ヘッダー行を追加しました:', headerRow);
      // ヘッダー行を太字にする
      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E0E0E0');
      Logger.log('✅ ヘッダー行の書式を設定しました');
      console.log('✅ ヘッダー行の書式を設定しました');
    } else {
      Logger.log('✅ 既存のシートを使用します');
      console.log('✅ 既存のシートを使用します');
    }
    
    // データを追加
    Logger.log('📝 データを追加します...');
    console.log('📝 データを追加します...');
    if (type === 'reservation') {
      const rowData = [
        data.timestamp,
        '無料体験予約',
        data.child_name || '',
        data.phone || '',
        data.email || '',
        data.school_type || '',
        data.grade || '',
        data.date || '',
        data.time || '',
        data.message || '',
        data.subject || ''
      ];
      Logger.log('📋 追加するデータ（予約）: ' + JSON.stringify(rowData));
      console.log('📋 追加するデータ（予約）:', rowData);
      sheet.appendRow(rowData);
      Logger.log('✅ データを追加しました（予約）');
      console.log('✅ データを追加しました（予約）');
    } else if (type === 'contact') {
      const rowData = [
        data.timestamp,
        'お問い合わせ',
        '',
        data.phone || '',
        data.email || '',
        '',
        '',
        '',
        '',
        data.message || '',
        data.subject || ''
      ];
      Logger.log('📋 追加するデータ（お問い合わせ）: ' + JSON.stringify(rowData));
      console.log('📋 追加するデータ（お問い合わせ）:', rowData);
      sheet.appendRow(rowData);
      Logger.log('✅ データを追加しました（お問い合わせ）');
      console.log('✅ データを追加しました（お問い合わせ）');
    } else {
      Logger.log('⚠️ 不明なタイプ: ' + type);
      console.warn('⚠️ 不明なタイプ:', type);
    }
    
    // データが正しく追加されたか確認
    const lastRow = sheet.getLastRow();
    Logger.log('📊 シートの最終行: ' + lastRow);
    console.log('📊 シートの最終行:', lastRow);
    if (lastRow > 0) {
      const lastRowData = sheet.getRange(lastRow, 1, 1, 11).getValues()[0];
      Logger.log('📋 最終行のデータ: ' + JSON.stringify(lastRowData));
      console.log('📋 最終行のデータ:', lastRowData);
    }
    
    Logger.log('✅ Google Sheetsに履歴を保存しました: タイプ=' + type + ', タイムスタンプ=' + data.timestamp);
    console.log('✅ Google Sheetsに履歴を保存しました:', { type, timestamp: data.timestamp });
    return true;
  } catch (error) {
    Logger.log('❌ Google Sheetsへの保存エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ Google Sheetsへの保存エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

// Google Sheetsから履歴を取得する関数（GETリクエスト用）
function getEmailHistoryFromSheets() {
  try {
    // saveToGoogleSheetsと同じIDを使用
    const SPREADSHEET_ID_OR_URL = '1q4BfhBe_hd2U-qE_O6j0cUPVI6wPvgsNg0qFZCyl5Yc'; // ここにスプレッドシートIDを設定してください
    
    // URLからIDを抽出する関数
    function extractSpreadsheetId(idOrUrl) {
      if (!idOrUrl || idOrUrl === 'YOUR_SPREADSHEET_ID') {
        return null;
      }
      // URL形式の場合、IDを抽出
      const match = idOrUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return match[1];
      }
      // 既にID形式の場合、そのまま返す
      return idOrUrl;
    }
    
    const spreadsheetId = extractSpreadsheetId(SPREADSHEET_ID_OR_URL);
    
    if (!spreadsheetId) {
      return [];
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('EmailHistory');
    
    if (!sheet) {
      return [];
    }
    
    // データを取得（ヘッダー行を除く）
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return [];
    }
    
    // ヘッダー行を除いて、データをオブジェクトの配列に変換
    const history = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      history.push({
        timestamp: row[0],
        type: row[1] === '無料体験予約' ? 'reservation' : 'contact',
        data: {
          child_name: row[2] || '',
          phone: row[3] || '',
          email: row[4] || '',
          school_type: row[5] || '',
          grade: row[6] || '',
          date: row[7] || '',
          time: row[8] || '',
          message: row[9] || '',
          subject: row[10] || ''
        }
      });
    }
    
    // タイムスタンプでソート（新しい順）
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return history;
  } catch (error) {
    console.error('Google Sheetsからの履歴取得エラー:', error);
    return [];
  }
}

// GETリクエストにも対応（テスト用、履歴取得用）
function doGet(e) {
  try {
    // クエリパラメータでactionを確認
    const action = e.parameter.action;
    
    if (action === 'getHistory') {
      // 履歴を取得
      const history = getEmailHistoryFromSheets();
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
        success: true,
        history: history
      })));
    } else {
      // デフォルトのレスポンス
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'iTeen予約フォーム API は正常に動作しています。',
        note: 'このAPIはPOSTリクエストで予約データを受け取ります。',
        actions: {
          getHistory: '?action=getHistory で履歴を取得できます'
        }
      })));
    }
  } catch (error) {
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })));
  }
}

// テスト用関数（エディタから直接実行可能）
// 予約フォームのテスト
function testReservationForm() {
  // テストデータを作成
  const testData = {
    to: 'iteen.mukonosou@gmail.com',
    subject: '無料体験予約のお申し込み（テスト）',
    date: '2026/1/20 (火)',
    time: '14:00',
    date_raw: '2026-01-20',
    body: 'テスト用の予約データです。'
  };
  
  // モックリクエストオブジェクトを作成
  const mockE = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  // doPost関数を呼び出し
  const result = doPost(mockE);
  console.log('予約フォームテスト結果:', result.getContent());
  return result;
}

// 問い合わせフォームのテスト
function testContactForm() {
  // テストデータを作成
  const testData = {
    to: 'iteen.mukonosou@gmail.com',
    subject: 'お問い合わせ',
    email: 'test@example.com',
    phone: '09012345678',
    message: 'これはテスト用のお問い合わせです。',
    body: `お問い合わせがありました。

メールアドレス: test@example.com
電話番号: 09012345678
お問い合わせ内容:
これはテスト用のお問い合わせです。

---
このメールはお問い合わせフォームから自動送信されました。
iTeen 武庫之荘校`,
    replyTo: 'test@example.com',
    replySubject: '【iTeen 武庫之荘校】お問い合わせありがとうございます',
    replyBody: `test@example.com 様

この度は、iTeen 武庫之荘校にお問い合わせいただき、誠にありがとうございます。

以下の内容でお問い合わせを受け付けました。

【お問い合わせ内容】
これはテスト用のお問い合わせです。

担当者より2営業日以内にご連絡させていただきます。
お急ぎの場合は、お電話（06-6438-8277）でもお問い合わせいただけます。

今後ともiTeen 武庫之荘校をよろしくお願いいたします。

---
iTeen 武庫之荘校
電話: 06-6438-8277
メール: iteen.mukonosou@gmail.com`
  };
  
  // モックリクエストオブジェクトを作成
  const mockE = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  // doPost関数を呼び出し
  const result = doPost(mockE);
  console.log('問い合わせフォームテスト結果:', result.getContent());
  return result;
}

// Google Sheetsの権限を確認・承認するテスト関数
// この関数を実行すると、SpreadsheetAppの権限が正しく付与されているか確認できます
function testGoogleSheetsPermission() {
  try {
    Logger.log('📊 Google Sheetsの権限を確認します...');
    console.log('📊 Google Sheetsの権限を確認します...');
    
    // テスト用のスプレッドシートを作成してみる
    Logger.log('📝 テスト用のスプレッドシートを作成します...');
    console.log('📝 テスト用のスプレッドシートを作成します...');
    
    const testSpreadsheet = SpreadsheetApp.create('テスト - Google Sheets権限確認');
    const testSpreadsheetId = testSpreadsheet.getId();
    const testSpreadsheetUrl = testSpreadsheet.getUrl();
    
    Logger.log('✅ Google Sheetsの権限が正しく付与されています！');
    Logger.log('🔑 テスト用スプレッドシートID: ' + testSpreadsheetId);
    Logger.log('📄 テスト用スプレッドシートURL: ' + testSpreadsheetUrl);
    console.log('✅ Google Sheetsの権限が正しく付与されています！');
    console.log('🔑 テスト用スプレッドシートID:', testSpreadsheetId);
    console.log('📄 テスト用スプレッドシートURL:', testSpreadsheetUrl);
    
    // テスト用のシートにデータを書き込んでみる
    const testSheet = testSpreadsheet.getActiveSheet();
    testSheet.getRange(1, 1).setValue('テスト');
    testSheet.getRange(1, 2).setValue('成功');
    testSheet.getRange(2, 1).setValue('権限');
    testSheet.getRange(2, 2).setValue('正常');
    
    Logger.log('✅ データの書き込みも成功しました！');
    console.log('✅ データの書き込みも成功しました！');
    
    // テスト用のスプレッドシートを削除（オプション）
    // コメントアウトしているので、確認後に手動で削除してください
    // DriveApp.getFileById(testSpreadsheetId).setTrashed(true);
    
    Logger.log('📄 テスト用スプレッドシートURL: ' + testSpreadsheetUrl);
    Logger.log('⚠️ このURLを開いて、スプレッドシートが作成されているか確認してください');
    Logger.log('⚠️ 確認後、手動でスプレッドシートを削除してください');
    console.log('📄 テスト用スプレッドシートURL:', testSpreadsheetUrl);
    console.log('⚠️ このURLを開いて、スプレッドシートが作成されているか確認してください');
    console.log('⚠️ 確認後、手動でスプレッドシートを削除してください');
    
    return {
      success: true,
      message: 'Google Sheetsの権限が正しく付与されています',
      spreadsheetId: testSpreadsheetId,
      spreadsheetUrl: testSpreadsheetUrl
    };
  } catch (error) {
    Logger.log('❌ Google Sheetsの権限エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ Google Sheetsの権限エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    
    // 権限エラーの場合の詳細メッセージ
    if (error.toString().includes('アクセス') || error.toString().includes('access') || error.toString().includes('permission') || error.toString().includes('権限')) {
      Logger.log('⚠️ Google Sheetsの権限が付与されていません');
      Logger.log('⚠️ 以下の手順で権限を付与してください：');
      Logger.log('1. この関数を実行すると、「承認が必要です」という警告が表示されます');
      Logger.log('2. 「承認」をクリック');
      Logger.log('3. Googleアカウントを選択');
      Logger.log('4. 「詳細」→「（安全ではないページ）に移動」をクリック');
      Logger.log('5. 「許可」をクリックしてGoogle Sheetsの権限を付与');
      console.error('⚠️ Google Sheetsの権限が付与されていません');
      console.error('⚠️ 以下の手順で権限を付与してください：');
      console.error('1. この関数を実行すると、「承認が必要です」という警告が表示されます');
      console.error('2. 「承認」をクリック');
      console.error('3. Googleアカウントを選択');
      console.error('4. 「詳細」→「（安全ではないページ）に移動」をクリック');
      console.error('5. 「許可」をクリックしてGoogle Sheetsの権限を付与');
    }
    
    throw new Error('Google Sheetsの権限が付与されていません: ' + error.toString());
  }
}

// Google Drive APIの権限を確認・承認するテスト関数
// この関数を実行すると、DriveAppの権限が正しく付与されているか確認できます
function testGoogleDrivePermission() {
  try {
    Logger.log('📁 Google Drive APIの権限を確認します...');
    console.log('📁 Google Drive APIの権限を確認します...');
    
    // ルートフォルダを取得してみる
    Logger.log('📁 DriveApp.getRootFolder()を呼び出します...');
    console.log('📁 DriveApp.getRootFolder()を呼び出します...');
    
    const rootFolder = DriveApp.getRootFolder();
    const rootFolderId = rootFolder.getId();
    const rootFolderUrl = rootFolder.getUrl();
    
    Logger.log('✅ Google Drive APIの権限が正しく付与されています！');
    Logger.log('🔑 ルートフォルダID: ' + rootFolderId);
    Logger.log('📄 ルートフォルダURL: ' + rootFolderUrl);
    console.log('✅ Google Drive APIの権限が正しく付与されています！');
    console.log('🔑 ルートフォルダID:', rootFolderId);
    console.log('📄 ルートフォルダURL:', rootFolderUrl);
    
    // フォルダの取得/作成をテスト
    Logger.log('📁 フォルダの取得/作成をテストします...');
    console.log('📁 フォルダの取得/作成をテストします...');
    
    const testFolder = getOrCreateFolder('pentech_info/manage_reserve');
    const testFolderId = testFolder.getId();
    const testFolderUrl = testFolder.getUrl();
    
    Logger.log('✅ フォルダの取得/作成も成功しました！');
    Logger.log('🔑 テストフォルダID: ' + testFolderId);
    Logger.log('📄 テストフォルダURL: ' + testFolderUrl);
    console.log('✅ フォルダの取得/作成も成功しました！');
    console.log('🔑 テストフォルダID:', testFolderId);
    console.log('📄 テストフォルダURL:', testFolderUrl);
    
    return {
      success: true,
      message: 'Google Drive APIの権限が正しく付与されています',
      rootFolderId: rootFolderId,
      rootFolderUrl: rootFolderUrl,
      testFolderId: testFolderId,
      testFolderUrl: testFolderUrl
    };
  } catch (error) {
    Logger.log('❌ Google Drive APIの権限エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ Google Drive APIの権限エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    
    // 権限エラーの場合の詳細メッセージ
    if (error.toString().includes('Drive') || error.toString().includes('drive') || 
        error.toString().includes('アクセス') || error.toString().includes('access') || 
        error.toString().includes('permission') || error.toString().includes('権限')) {
      Logger.log('⚠️ Google Drive APIの権限が付与されていません');
      Logger.log('⚠️ 以下の手順で権限を付与してください：');
      Logger.log('1. この関数を実行すると、「承認が必要です」という警告が表示されます');
      Logger.log('2. 「承認」をクリック');
      Logger.log('3. Googleアカウントを選択');
      Logger.log('4. 「詳細」→「（安全ではないページ）に移動」をクリック');
      Logger.log('5. 「許可」をクリックしてGoogle Drive APIの権限を付与');
      console.error('⚠️ Google Drive APIの権限が付与されていません');
      console.error('⚠️ 以下の手順で権限を付与してください：');
      console.error('1. この関数を実行すると、「承認が必要です」という警告が表示されます');
      console.error('2. 「承認」をクリック');
      console.error('3. Googleアカウントを選択');
      console.error('4. 「詳細」→「（安全ではないページ）に移動」をクリック');
      console.error('5. 「許可」をクリックしてGoogle Drive APIの権限を付与');
    }
    
    throw new Error('Google Drive APIの権限が付与されていません: ' + error.toString());
  }
}

// LINE通知を送信する関数
function sendLineNotification(message) {
  try {
    Logger.log('📱 LINE通知を送信開始');
    console.log('📱 LINE通知を送信開始');
    
    // スクリプトプロパティからLINE Notifyトークンを取得
    const properties = PropertiesService.getScriptProperties();
    const lineNotifyToken = properties.getProperty('LINE_NOTIFY_TOKEN');
    
    if (!lineNotifyToken) {
      Logger.log('⚠️ LINE Notifyトークンが設定されていません');
      Logger.log('⚠️ スクリプトプロパティに「LINE_NOTIFY_TOKEN」を設定してください');
      console.warn('⚠️ LINE Notifyトークンが設定されていません');
      console.warn('⚠️ スクリプトプロパティに「LINE_NOTIFY_TOKEN」を設定してください');
      throw new Error('LINE Notifyトークンが設定されていません。スクリプトプロパティに「LINE_NOTIFY_TOKEN」を設定してください。');
    }
    
    // LINE Notify APIのエンドポイント
    const url = 'https://notify-api.line.me/api/notify';
    
    // リクエストオプション
    const options = {
      'method': 'post',
      'headers': {
        'Authorization': 'Bearer ' + lineNotifyToken,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      'payload': {
        'message': message
      }
    };
    
    Logger.log('📱 LINE Notify APIにリクエストを送信します...');
    console.log('📱 LINE Notify APIにリクエストを送信します...');
    
    // LINE Notify APIにリクエストを送信
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('📱 LINE Notify APIレスポンスコード: ' + responseCode);
    Logger.log('📱 LINE Notify APIレスポンス: ' + responseText);
    console.log('📱 LINE Notify APIレスポンスコード:', responseCode);
    console.log('📱 LINE Notify APIレスポンス:', responseText);
    
    if (responseCode === 200) {
      Logger.log('✅ LINE通知を送信しました');
      console.log('✅ LINE通知を送信しました');
      return true;
    } else {
      Logger.log('❌ LINE通知の送信に失敗しました。レスポンスコード: ' + responseCode);
      Logger.log('❌ レスポンス: ' + responseText);
      console.error('❌ LINE通知の送信に失敗しました。レスポンスコード:', responseCode);
      console.error('❌ レスポンス:', responseText);
      throw new Error('LINE通知の送信に失敗しました。レスポンスコード: ' + responseCode + ', レスポンス: ' + responseText);
    }
  } catch (error) {
    Logger.log('❌ LINE通知送信エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ LINE通知送信エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

// LINE Notifyトークンを設定する関数（初回設定用）
// 注意: LINE Notifyは2025年3月31日にサービス終了予定
// 代替手段としてLINE Messaging APIまたはメール通知を推奨
function setLineNotifyToken() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // ここにLINE Notifyトークンを設定してください
    // トークンは https://notify-bot.line.me/ で取得できます
    // 注意: LINE Notifyは2025年3月31日にサービス終了予定
    const token = 'YOUR_LINE_NOTIFY_TOKEN_HERE';
    
    if (token === 'YOUR_LINE_NOTIFY_TOKEN_HERE') {
      Logger.log('⚠️ トークンを設定してください');
      Logger.log('⚠️ setLineNotifyToken関数内の「YOUR_LINE_NOTIFY_TOKEN_HERE」を実際のトークンに置き換えてください');
      Logger.log('⚠️ 注意: LINE Notifyは2025年3月31日にサービス終了予定です');
      console.warn('⚠️ トークンを設定してください');
      console.warn('⚠️ setLineNotifyToken関数内の「YOUR_LINE_NOTIFY_TOKEN_HERE」を実際のトークンに置き換えてください');
      console.warn('⚠️ 注意: LINE Notifyは2025年3月31日にサービス終了予定です');
      return false;
    }
    
    properties.setProperty('LINE_NOTIFY_TOKEN', token);
    Logger.log('✅ LINE Notifyトークンを設定しました');
    Logger.log('⚠️ 注意: LINE Notifyは2025年3月31日にサービス終了予定です');
    console.log('✅ LINE Notifyトークンを設定しました');
    console.warn('⚠️ 注意: LINE Notifyは2025年3月31日にサービス終了予定です');
    return true;
  } catch (error) {
    Logger.log('❌ LINE Notifyトークンの設定に失敗しました: ' + error.toString());
    console.error('❌ LINE Notifyトークンの設定に失敗しました:', error);
    return false;
  }
}

// LINE Messaging APIで通知を送信する関数（LINE Notifyの代替手段）
// 注意: この関数を使用するには、LINE Developersコンソールでチャネルを作成し、
// チャネルアクセストークンとユーザーIDを設定する必要があります
// 詳細は LINE_MESSAGING_API_SETUP.md を参照してください
function sendLineMessagingAPI(message) {
  try {
    Logger.log('📱 LINE Messaging APIで通知を送信開始');
    console.log('📱 LINE Messaging APIで通知を送信開始');
    
    // スクリプトプロパティから認証情報を取得
    const properties = PropertiesService.getScriptProperties();
    const channelAccessToken = properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
    const userId = properties.getProperty('LINE_USER_ID');
    
    if (!channelAccessToken) {
      Logger.log('⚠️ LINE_CHANNEL_ACCESS_TOKENが設定されていません');
      Logger.log('⚠️ スクリプトプロパティに「LINE_CHANNEL_ACCESS_TOKEN」を設定してください');
      Logger.log('⚠️ 詳細は LINE_MESSAGING_API_SETUP.md を参照してください');
      console.warn('⚠️ LINE_CHANNEL_ACCESS_TOKENが設定されていません');
      console.warn('⚠️ スクリプトプロパティに「LINE_CHANNEL_ACCESS_TOKEN」を設定してください');
      console.warn('⚠️ 詳細は LINE_MESSAGING_API_SETUP.md を参照してください');
      throw new Error('LINE_CHANNEL_ACCESS_TOKENが設定されていません。スクリプトプロパティに「LINE_CHANNEL_ACCESS_TOKEN」を設定してください。');
    }
    
    if (!userId) {
      Logger.log('⚠️ LINE_USER_IDが設定されていません');
      Logger.log('⚠️ スクリプトプロパティに「LINE_USER_ID」を設定してください');
      Logger.log('⚠️ 詳細は LINE_MESSAGING_API_SETUP.md を参照してください');
      console.warn('⚠️ LINE_USER_IDが設定されていません');
      console.warn('⚠️ スクリプトプロパティに「LINE_USER_ID」を設定してください');
      console.warn('⚠️ 詳細は LINE_MESSAGING_API_SETUP.md を参照してください');
      throw new Error('LINE_USER_IDが設定されていません。スクリプトプロパティに「LINE_USER_ID」を設定してください。');
    }
    
    // LINE Messaging APIのエンドポイント
    const url = 'https://api.line.me/v2/bot/message/push';
    
    // リクエストボディ
    const payload = {
      'to': userId,
      'messages': [
        {
          'type': 'text',
          'text': message
        }
      ]
    };
    
    // リクエストオプション
    const options = {
      'method': 'post',
      'headers': {
        'Authorization': 'Bearer ' + channelAccessToken,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload)
    };
    
    Logger.log('📱 LINE Messaging APIにリクエストを送信します...');
    console.log('📱 LINE Messaging APIにリクエストを送信します...');
    
    // LINE Messaging APIにリクエストを送信
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('📱 LINE Messaging APIレスポンスコード: ' + responseCode);
    Logger.log('📱 LINE Messaging APIレスポンス: ' + responseText);
    console.log('📱 LINE Messaging APIレスポンスコード:', responseCode);
    console.log('📱 LINE Messaging APIレスポンス:', responseText);
    
    if (responseCode === 200) {
      Logger.log('✅ LINE Messaging APIで通知を送信しました');
      console.log('✅ LINE Messaging APIで通知を送信しました');
      return true;
    } else {
      Logger.log('❌ LINE Messaging APIの送信に失敗しました。レスポンスコード: ' + responseCode);
      Logger.log('❌ レスポンス: ' + responseText);
      console.error('❌ LINE Messaging APIの送信に失敗しました。レスポンスコード:', responseCode);
      console.error('❌ レスポンス:', responseText);
      throw new Error('LINE Messaging APIの送信に失敗しました。レスポンスコード: ' + responseCode + ', レスポンス: ' + responseText);
    }
  } catch (error) {
    Logger.log('❌ LINE Messaging API送信エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ LINE Messaging API送信エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

// LINE Messaging APIの認証情報を設定する関数（初回設定用）
// この関数を実行して、チャネルアクセストークンとユーザーIDを設定してください
// 詳細は LINE_MESSAGING_API_SETUP.md を参照してください
function setLineMessagingAPICredentials() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // ここにLINE Messaging APIの認証情報を設定してください
    // チャネルアクセストークンは LINE Developersコンソールで取得できます
    // ユーザーIDは友だち追加後に取得できます
    const channelAccessToken = 'YOUR_CHANNEL_ACCESS_TOKEN_HERE';
    const userId = 'YOUR_USER_ID_HERE';
    
    if (channelAccessToken === 'YOUR_CHANNEL_ACCESS_TOKEN_HERE' || 
        userId === 'YOUR_USER_ID_HERE') {
      Logger.log('⚠️ チャネルアクセストークンとユーザーIDを設定してください');
      Logger.log('⚠️ setLineMessagingAPICredentials関数内の値を実際の値に置き換えてください');
      Logger.log('⚠️ 詳細は LINE_MESSAGING_API_SETUP.md を参照してください');
      console.warn('⚠️ チャネルアクセストークンとユーザーIDを設定してください');
      console.warn('⚠️ setLineMessagingAPICredentials関数内の値を実際の値に置き換えてください');
      console.warn('⚠️ 詳細は LINE_MESSAGING_API_SETUP.md を参照してください');
      return false;
    }
    
    properties.setProperty('LINE_CHANNEL_ACCESS_TOKEN', channelAccessToken);
    properties.setProperty('LINE_USER_ID', userId);
    
    Logger.log('✅ LINE Messaging APIの認証情報を設定しました');
    console.log('✅ LINE Messaging APIの認証情報を設定しました');
    return true;
  } catch (error) {
    Logger.log('❌ LINE Messaging APIの認証情報の設定に失敗しました: ' + error.toString());
    console.error('❌ LINE Messaging APIの認証情報の設定に失敗しました:', error);
    return false;
  }
}

// 記事保存の処理
function handleArticleSave(articleData) {
  try {
    Logger.log('📝 記事保存処理を開始');
    console.log('📝 記事保存処理を開始');
    Logger.log('📝 記事データ: ' + JSON.stringify(articleData));
    console.log('📝 記事データ:', articleData);
    
    // データの検証
    if (!articleData.title || !articleData.date || !articleData.category || !articleData.html) {
      throw new Error('記事データが不完全です。タイトル、日付、カテゴリ、HTMLコンテンツが必要です。');
    }
    
    // ブログフォルダのパス
    const blogFolderPath = 'pentech_info/blog';
    
    // ブログフォルダを取得または作成
    Logger.log('📁 ブログフォルダを取得または作成: ' + blogFolderPath);
    console.log('📁 ブログフォルダを取得または作成:', blogFolderPath);
    const blogFolder = getOrCreateFolder(blogFolderPath);
    
    if (!blogFolder) {
      throw new Error('ブログフォルダの取得に失敗しました。');
    }
    
    // HTMLテンプレートを読み込んで記事HTMLを生成
    const articleHtml = generateArticleHTML(articleData);
    
    // ファイル名を生成
    const filename = articleData.filename || `article_${Date.now()}.html`;
    
    // ファイルを作成
    Logger.log('📄 ファイルを作成: ' + filename);
    console.log('📄 ファイルを作成:', filename);
    const file = blogFolder.createFile(filename, articleHtml, 'text/html');
    
    Logger.log('✅ 記事ファイルを作成しました: ' + file.getName());
    console.log('✅ 記事ファイルを作成しました:', file.getName());
    Logger.log('✅ ファイルID: ' + file.getId());
    console.log('✅ ファイルID:', file.getId());
    
    // ブログ一覧に追加（オプション）
    // 注意: ブログ一覧ファイルの編集は、Google Apps Scriptから直接は難しいため、
    // 手動で追加するか、別の方法を検討する必要があります
    
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '記事を保存しました',
      filename: filename,
      fileId: file.getId(),
      fileUrl: file.getUrl()
    })));
    
  } catch (error) {
    Logger.log('❌ 記事保存エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ 記事保存エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: error.message
    })));
  }
}

// 記事投稿の処理
function handleArticlePublish(articleData) {
  try {
    Logger.log('📤 記事投稿処理を開始');
    console.log('📤 記事投稿処理を開始');
    Logger.log('📤 記事データ: ' + JSON.stringify(articleData));
    console.log('📤 記事データ:', articleData);
    
    // データの検証
    if (!articleData.title || !articleData.date || !articleData.category || !articleData.html) {
      throw new Error('記事データが不完全です。タイトル、日付、カテゴリ、HTMLコンテンツが必要です。');
    }
    
    // ブログフォルダのパス
    const blogFolderPath = 'pentech_info/blog';
    
    // ブログフォルダを取得または作成
    Logger.log('📁 ブログフォルダを取得または作成: ' + blogFolderPath);
    console.log('📁 ブログフォルダを取得または作成:', blogFolderPath);
    const blogFolder = getOrCreateFolder(blogFolderPath);
    
    if (!blogFolder) {
      throw new Error('ブログフォルダの取得に失敗しました。');
    }
    
    // HTMLテンプレートを読み込んで記事HTMLを生成
    const articleHtml = generateArticleHTML(articleData);
    
    // ファイル名を生成
    const filename = articleData.filename || `article_${Date.now()}.html`;
    
    // ファイルを作成
    Logger.log('📄 ファイルを作成: ' + filename);
    console.log('📄 ファイルを作成:', filename);
    const file = blogFolder.createFile(filename, articleHtml, 'text/html');
    
    Logger.log('✅ 記事ファイルを作成しました: ' + file.getName());
    console.log('✅ 記事ファイルを作成しました:', file.getName());
    Logger.log('✅ ファイルID: ' + file.getId());
    console.log('✅ ファイルID:', file.getId());
    
    // ブログ一覧に追加（投稿時はブログ一覧にも追加）
    try {
      Logger.log('📋 ブログ一覧に追加を試みます...');
      console.log('📋 ブログ一覧に追加を試みます...');
      // ブログ一覧ファイルのパス（実際のパスに合わせて調整が必要）
      const blogIndexPath = 'pentech_info/blog/index.html';
      const blogIndexFolder = getOrCreateFolder('pentech_info/blog');
      const blogIndexFiles = blogIndexFolder.getFilesByName('index.html');
      
      if (blogIndexFiles.hasNext()) {
        Logger.log('✅ ブログ一覧ファイルが見つかりました');
        console.log('✅ ブログ一覧ファイルが見つかりました');
        // ブログ一覧ファイルの編集は複雑なため、ここではログのみ
        // 実際の実装では、HTMLファイルを読み込んで編集する必要があります
      } else {
        Logger.log('⚠️ ブログ一覧ファイルが見つかりませんでした');
        console.warn('⚠️ ブログ一覧ファイルが見つかりませんでした');
      }
    } catch (indexError) {
      Logger.log('⚠️ ブログ一覧への追加でエラーが発生しましたが、続行します: ' + indexError.toString());
      console.warn('⚠️ ブログ一覧への追加でエラーが発生しましたが、続行します:', indexError);
      // エラーが発生しても記事の作成は成功しているので続行
    }
    
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '記事を投稿しました',
      filename: filename,
      fileId: file.getId(),
      fileUrl: file.getUrl()
    })));
    
  } catch (error) {
    Logger.log('❌ 記事投稿エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ 記事投稿エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: error.message
    })));
  }
}

// 記事HTMLを生成する関数
function generateArticleHTML(articleData) {
  // 記事テンプレートHTML
  const template = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.title} | iTeen 武庫之荘校</title>
    
    <!-- パスワード保護 -->
    <script src="../config.js"></script>
    <script src="../password-check.js"></script>
    
    <style>
        :root {
            --primary: #4A90E2;
            --accent: #F5A623;
            --text: #333333;
            --bg: #FAFAFA;
            --white: #FFFFFF;
        }
        html {
            scroll-behavior: smooth;
        }
        body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.8;
        }
        .container {
            padding: 0 20px;
            max-width: 900px;
            margin: 0 auto;
        }
        
        /* ヘッダー */
        header {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: var(--white);
            padding: 15px 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            width: 100%;
        }
        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        .header-brand {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .header-logo {
            max-height: 50px;
            width: auto;
        }
        .header-brand > a:first-child {
            text-decoration: none;
            display: inline-block;
            transition: opacity 0.2s;
        }
        .header-brand > a:first-child:hover {
            opacity: 0.8;
        }
        .header-school-name {
            font-size: 1.2rem;
            color: var(--text);
            font-weight: normal;
            white-space: nowrap;
        }
        .header-phone {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
            text-decoration: none;
            white-space: nowrap;
        }
        .header-phone:hover {
            text-decoration: underline;
        }
        .header-line-button {
            background-color: #06C755;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: bold;
            white-space: nowrap;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .header-line-button:hover {
            background-color: #05B04A;
            transform: translateY(-1px);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        .header-nav {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
            width: 100%;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }
        .header-nav a {
            color: var(--text);
            text-decoration: none;
            font-size: 0.95rem;
            font-weight: 500;
            padding: 5px 10px;
            border-radius: 5px;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .header-nav a:hover {
            color: var(--primary);
            background-color: #f0f8ff;
        }
        
        /* メインセクション */
        .blog-article-section {
            padding: 50px 0;
            background: linear-gradient(150deg, #e0f2ff 0%, var(--white) 100%);
        }
        .article-header {
            background: var(--white);
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            margin-bottom: 30px;
        }
        .article-meta {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .article-date {
            background: var(--primary);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
            white-space: nowrap;
        }
        .article-category {
            background: var(--accent);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
            white-space: nowrap;
        }
        .article-title {
            font-size: 2rem;
            color: var(--text);
            margin-bottom: 20px;
            font-weight: bold;
            line-height: 1.4;
        }
        .article-content {
            background: var(--white);
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            margin-bottom: 30px;
        }
        .article-content h2 {
            font-size: 1.8rem;
            color: var(--primary);
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid var(--accent);
        }
        .article-content h3 {
            font-size: 1.4rem;
            color: var(--text);
            margin-top: 25px;
            margin-bottom: 12px;
        }
        .article-content p {
            font-size: 1rem;
            color: var(--text);
            margin-bottom: 20px;
            line-height: 1.8;
        }
        .article-content ul,
        .article-content ol {
            margin: 20px 0;
            padding-left: 30px;
        }
        .article-content li {
            margin-bottom: 10px;
            line-height: 1.8;
        }
        .article-content img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        .article-content blockquote {
            padding-left: 20px;
            margin: 20px 0;
            color: #666;
            font-style: italic;
        }
        .article-navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-top: 40px;
            flex-wrap: wrap;
        }
        .nav-link {
            display: inline-block;
            padding: 12px 25px;
            background: var(--white);
            color: var(--primary);
            border: 2px solid var(--primary);
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.2s;
        }
        .nav-link:hover {
            background: var(--primary);
            color: white;
        }
        .back-to-list {
            text-align: center;
            margin-top: 30px;
        }
        
        footer {
            padding: 20px;
            text-align: center;
            background: #444;
            color: white;
            font-size: 0.8rem;
            margin-top: 40px;
        }
        footer a {
            color: white;
            text-decoration: none;
        }
        footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .header-top {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            .header-brand {
                width: 100%;
                justify-content: space-between;
            }
            .header-line-button {
                width: 100%;
                justify-content: center;
                font-size: 0.85rem;
                padding: 8px 16px;
            }
            .header-nav {
                gap: 10px;
            }
            .header-nav a {
                font-size: 0.85rem;
                padding: 5px 8px;
            }
            .article-header {
                padding: 25px 20px;
            }
            .article-title {
                font-size: 1.5rem;
            }
            .article-content {
                padding: 25px 20px;
            }
            .article-content h2 {
                font-size: 1.4rem;
            }
            .article-content h3 {
                font-size: 1.2rem;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-top">
            <div class="header-brand">
                <a href="../../index.html"><img src="../../images/iteen_logo.png" alt="iTeen ロゴ" class="header-logo"></a>
                <div class="header-school-name">武庫之荘校</div>
                <a href="tel:06-6438-8277" class="header-phone">☎06-6438-8277</a>
            </div>
            <a href="https://page.line.me/555qxcak?oat_content=url&openQrModal=true" target="_blank" rel="noopener noreferrer" class="header-line-button">
                💬 LINEで質問
            </a>
        </div>
        <nav class="header-nav">
            <a href="../../index.html">ホーム</a>
            <a href="../../index.html#news">ニュース</a>
            <a href="index.html">ブログ</a>
            <a href="../../index.html#courses">コース</a>
            <a href="../../index.html#teachers">講師</a>
            <a href="../values.html">大切にしていること</a>
            <a href="../../index.html#fee">料金</a>
            <a href="../../index.html#faq">よくある質問</a>
            <a href="../../index.html#access">アクセス</a>
            <a href="../contact.html">お問い合わせ</a>
            <a href="../reserve.html">無料体験予約</a>
        </nav>
    </header>

    <section class="blog-article-section">
        <div class="container">
            <!-- 記事ヘッダー -->
            <div class="article-header">
                <div class="article-meta">
                    <span class="article-date">${articleData.date}</span>
                    <span class="article-category">${articleData.category}</span>
                </div>
                <h1 class="article-title">${articleData.title}</h1>
            </div>

            <!-- 記事本文 -->
            <div class="article-content">
                ${articleData.html}
            </div>

            <!-- ナビゲーション -->
            <div class="article-navigation">
                <a href="index.html" class="nav-link">← ブログ一覧に戻る</a>
            </div>

            <div class="back-to-list">
                <a href="index.html" class="nav-link">ブログ一覧に戻る</a>
            </div>
        </div>
    </section>

    <footer>
        <p><a href="../../index.html#access">アクセス・営業時間はこちら</a></p>
        <p>&copy; 2025 iTeen 武庫之荘校</p>
    </footer>
</body>
</html>`;
  
  return template;
}

