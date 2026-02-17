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
    
    // Google Sheetsに履歴を保存
    try {
      saveToGoogleSheets('contact', {
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
function handleReservationForm(data) {
  try {
    // 受信データをログに出力（デバッグ用）
    console.log('予約フォーム受信データ:', {
      date: data.date,
      date_raw: data.date_raw,
      time: data.time,
      child_name: data.child_name,
      phone: data.phone,
      email: data.email,
      school_type: data.school_type,
      grade: data.grade,
      message: data.message,
      hasBody: !!data.body,
      bodyLength: data.body ? data.body.length : 0,
      replyTo: data.replyTo,
      replySubject: data.replySubject,
      hasReplyBody: !!data.replyBody,
      replyBodyLength: data.replyBody ? data.replyBody.length : 0
    });
    
    // カレンダーID（Googleカレンダーの設定から取得）
    const CALENDAR_ID = '16f6013dd3e06376074237fd9cf818e7287bb388ed28757e477058f90c97be52@group.calendar.google.com';
    
    // 日付と時間をパース
    const dateStr = data.date_raw || data.date; // YYYY-MM-DD形式
    const timeStr = data.time; // HH:MM形式
    
    if (!dateStr || !timeStr) {
      throw new Error('日付または時間が指定されていません。date_raw: ' + dateStr + ', time: ' + timeStr);
    }
    
    console.log('日付:', dateStr, '時間:', timeStr);
    
    // 日時をDateオブジェクトに変換
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      throw new Error('日付または時間の形式が正しくありません。dateStr: ' + dateStr + ', timeStr: ' + timeStr);
    }
    
    const startTime = new Date(year, month - 1, day, hours, minutes);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 50); // 50分のレッスン
    
    console.log('開始時刻:', startTime, '終了時刻:', endTime);
    
    // Googleカレンダーにイベントを追加
    let calendar;
    try {
      calendar = CalendarApp.getCalendarById(CALENDAR_ID);
      if (!calendar) {
        throw new Error('カレンダーが見つかりません。カレンダーIDを確認してください: ' + CALENDAR_ID);
      }
      console.log('カレンダー取得成功:', calendar.getName());
    } catch (calError) {
      throw new Error('カレンダーへのアクセスエラー: ' + calError.toString());
    }
    
    const eventTitle = '無料体験予約';
    const eventDescription = `予約フォームから自動登録\n\n予約希望日時: ${data.date} ${data.time}`;
    
    let event;
    try {
      event = calendar.createEvent(
        eventTitle,
        startTime,
        endTime,
        {
          description: eventDescription,
          location: 'iTeen 武庫之荘校'
        }
      );
      console.log('イベント作成成功:', event.getId());
    } catch (eventError) {
      throw new Error('イベント作成エラー: ' + eventError.toString());
    }
    
    // メール送信
    const to = data.to || 'iteen.mukonosou@gmail.com';
    const subject = data.subject || '無料体験予約のお申し込み';
    
    // メール本文の作成
    // まず、個別フィールドから情報を組み立て（確実にすべての情報を含める）
    const childName = data.child_name ? data.child_name.trim() : '未入力';
    const phone = data.phone ? data.phone.trim() : '未入力';
    const email = data.email && data.email.trim() !== '' && data.email !== '未入力' ? data.email.trim() : '未入力';
    const schoolType = data.school_type ? data.school_type.trim() : '未入力';
    const grade = data.grade ? data.grade.trim() : '未入力';
    const message = data.message && data.message.trim() !== '' && data.message !== 'なし' ? data.message.trim() : '';
    const dateDisplay = data.date ? data.date.trim() : '';
    const timeDisplay = data.time ? data.time.trim() : '';
    
    // メール本文を組み立て（bodyフィールドがあっても、個別フィールドから組み立てたものを優先）
    let body = `無料体験予約のお申し込みがありました。

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
予約希望日時: ${dateDisplay} ${timeDisplay}${message ? `\n\nご質問・ご要望:\n${message}` : ''}

予約確定のため、お客様にご連絡をお願いします。

---
このメールは予約フォームから自動送信されました。
iTeen 武庫之荘校`;
    
    console.log('送信するメール本文:', body);
    console.log('メール本文の長さ:', body.length);
    
    // Gmailでメールを送信（管理者宛）
    try {
      GmailApp.sendEmail(to, subject, body);
      console.log('管理者へのメール送信成功');
    } catch (mailError) {
      console.error('管理者へのメール送信エラー:', mailError);
      // メール送信エラーでも、カレンダー追加は成功しているので、エラーは記録するが続行
    }
    
    // 自動応答メールの送信（メールアドレスが記載されている場合のみ）
    console.log('📧 自動応答メール送信チェック開始');
    console.log('受信データ:', {
      hasReplyTo: !!data.replyTo,
      replyTo: data.replyTo,
      replyToType: typeof data.replyTo,
      hasReplySubject: !!data.replySubject,
      replySubject: data.replySubject,
      hasReplyBody: !!data.replyBody,
      replyBodyLength: data.replyBody ? data.replyBody.length : 0,
      email: email,
      emailType: typeof email
    });
    
    // replyToが設定されているか確認
    let replyEmail = null;
    if (data.replyTo && data.replyTo !== null && data.replyTo !== undefined && data.replyTo !== '未入力') {
      const trimmedReplyTo = String(data.replyTo).trim();
      if (trimmedReplyTo !== '' && trimmedReplyTo.includes('@')) {
        replyEmail = trimmedReplyTo;
        console.log('✅ replyToからメールアドレスを取得:', replyEmail);
      }
    }
    
    // replyToが取得できなかった場合、emailフィールドから取得を試みる
    if (!replyEmail && email && email !== null && email !== undefined && email !== '未入力') {
      const trimmedEmail = String(email).trim();
      if (trimmedEmail !== '' && trimmedEmail.includes('@')) {
        replyEmail = trimmedEmail;
        console.log('✅ emailフィールドからメールアドレスを取得:', replyEmail);
      }
    }
    
    console.log('📧 確認メール送信先:', replyEmail);
    
    // replySubjectとreplyBodyを取得
    let replySubject = data.replySubject;
    let replyBody = data.replyBody;
    
    // replySubjectが設定されていない場合、デフォルトを使用
    if (!replySubject) {
      replySubject = '【iTeen 武庫之荘校】無料体験予約のご確認';
      console.log('⚠️ replySubjectが設定されていないため、デフォルトを使用');
    }
    
    // replyBodyが設定されていない場合、emailフィールドから作成
    if (!replyBody && replyEmail) {
      replyBody = `${childName} 様

この度は、iTeen 武庫之荘校の無料体験予約をお申し込みいただき、誠にありがとうございます。

以下の内容で予約を受け付けました。

【予約内容】
お子様のお名前: ${childName}
電話番号: ${phone}
学校区別: ${schoolType}
学年: ${grade}
予約希望日時: ${dateDisplay} ${timeDisplay}${message ? `\n\nご質問・ご要望:\n${message}` : ''}

【当日の流れ】
1. ご来校 - 教室にいらしてください（手ぶらでOK！）
2. 簡単なご説明 - 教室のご紹介と、お子様の興味をお聞きします
3. プログラミング体験 - 実際にプログラミングを楽しんでいただきます
4. ご質問・ご相談 - 気になることは何でもお聞きください

予約確定のため、担当者よりご連絡させていただきます。
お急ぎの場合は、お電話（06-6438-8277）でもお問い合わせいただけます。

お会いできるのを楽しみにしております！

---
iTeen 武庫之荘校
電話: 06-6438-8277
メール: iteen.mukonosou@gmail.com`;
      console.log('⚠️ replyBodyが設定されていないため、自動生成しました');
    }
    
    console.log('📧 メール送信準備完了:', {
      replyEmail: replyEmail,
      replySubject: replySubject,
      hasReplyBody: !!replyBody,
      replyBodyLength: replyBody ? replyBody.length : 0
    });
    
    // メール送信の実行
    if (replyEmail && replyEmail.includes('@') && replySubject && replyBody) {
      try {
        // メールアドレスの形式を簡易チェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(replyEmail)) {
          console.log('📧 メール送信を実行します:', {
            to: replyEmail,
            subject: replySubject,
            bodyLength: replyBody.length
          });
          
          // メール送信
          GmailApp.sendEmail(replyEmail, replySubject, replyBody);
          
          console.log('✅ 自動応答メール送信成功:', replyEmail);
        } else {
          console.log('⚠️ メールアドレスの形式が無効なため、自動応答メールを送信しません:', replyEmail);
        }
      } catch (replyError) {
        console.error('❌ 自動応答メール送信エラー:', replyError);
        console.error('エラー詳細:', {
          message: replyError.toString(),
          name: replyError.name,
          stack: replyError.stack,
          replyEmail: replyEmail,
          replySubject: replySubject,
          replyBodyLength: replyBody ? replyBody.length : 0
        });
        // 自動応答メールのエラーは記録するが続行（管理者へのメールとカレンダー追加は成功している）
      }
    } else {
      console.log('⚠️ 自動応答メールを送信しません:', {
        replyEmail: replyEmail,
        hasReplySubject: !!replySubject,
        hasReplyBody: !!replyBody,
        reason: !replyEmail ? 'メールアドレスが設定されていません' : 
                !replyEmail.includes('@') ? 'メールアドレスの形式が無効です（@が含まれていません）' :
                !replySubject ? '件名が設定されていません' :
                !replyBody ? '本文が設定されていません' : '不明'
      });
    }
    
    // Google Sheetsに履歴を保存
    Logger.log('📊 Google Sheetsへの保存を開始します...');
    console.log('📊 Google Sheetsへの保存を開始します...');
    try {
      const sheetData = {
        timestamp: new Date().toISOString(),
        child_name: childName,
        phone: phone,
        email: email,
        school_type: schoolType,
        grade: grade,
        date: dateDisplay,
        time: timeDisplay,
        message: message,
        subject: subject
      };
      Logger.log('📋 保存するデータ: ' + JSON.stringify(sheetData));
      console.log('📋 保存するデータ:', sheetData);
      const result = saveToGoogleSheets('reservation', sheetData);
      Logger.log('✅ Google Sheetsに履歴を保存しました。結果: ' + result);
      console.log('✅ Google Sheetsに履歴を保存しました。結果:', result);
    } catch (sheetError) {
      Logger.log('❌ Google Sheetsへの保存エラー: ' + sheetError.toString());
      Logger.log('❌ エラースタック: ' + sheetError.stack);
      console.error('❌ Google Sheetsへの保存エラー:', sheetError);
      console.error('❌ エラー詳細:', {
        message: sheetError.toString(),
        name: sheetError.name,
        stack: sheetError.stack
      });
      // エラーは記録するが続行（メール送信とカレンダー追加は成功している）
    }
    
    // 成功レスポンス
    const successResponse = {
      success: true,
      message: 'メールを送信し、カレンダーに予約を追加しました',
      eventId: event.getId(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
    
    console.log('✅ 予約フォーム処理成功:', successResponse);
    
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(successResponse)));
    
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

// Google Sheetsに履歴を保存する関数
function saveToGoogleSheets(type, data) {
  try {
    console.log('📊 saveToGoogleSheets関数が呼び出されました:', { type, data });
    
    // スクリプトプロパティからスプレッドシートIDを取得
    const properties = PropertiesService.getScriptProperties();
    let spreadsheetId = properties.getProperty('GOOGLE_SHEETS_SPREADSHEET_ID');
    
    let spreadsheet;
    
    // スプレッドシートIDが保存されていない場合（初回実行時）は新規作成
    if (!spreadsheetId) {
      console.log('📝 初回実行のため、新しいスプレッドシートを作成します...');
      spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
      spreadsheetId = spreadsheet.getId();
      const spreadsheetUrl = spreadsheet.getUrl();
      
      // スクリプトプロパティにスプレッドシートIDを保存
      properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
      
      console.log('✅ 新規スプレッドシートを作成しました');
      console.log('🔑 スプレッドシートID:', spreadsheetId);
      console.log('📄 スプレッドシートURL:', spreadsheetUrl);
      console.log('💾 スプレッドシートIDをスクリプトプロパティに保存しました');
      console.log('⚠️ このスプレッドシートURLを開いて確認してください:', spreadsheetUrl);
    } else {
      // 既存のスプレッドシートを開く
      try {
        console.log('📂 既存のスプレッドシートを開こうとしています...');
        console.log('🔑 スプレッドシートID:', spreadsheetId);
        spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        console.log('✅ 既存のスプレッドシートを開きました:', spreadsheet.getName());
        console.log('📄 スプレッドシートURL:', spreadsheet.getUrl());
      } catch (openError) {
        console.error('❌ スプレッドシートを開くエラー:', openError);
        console.error('❌ エラー詳細:', {
          message: openError.toString(),
          name: openError.name,
          stack: openError.stack
        });
        // エラーの場合は新規作成
        console.log('📝 エラーのため、新しいスプレッドシートを作成します...');
        spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
        spreadsheetId = spreadsheet.getId();
        const spreadsheetUrl = spreadsheet.getUrl();
        
        // スクリプトプロパティに新しいスプレッドシートIDを保存
        properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
        
        console.log('✅ エラーのため新規スプレッドシートを作成しました:', spreadsheetId);
        console.log('📄 スプレッドシートURL:', spreadsheetUrl);
        console.log('💾 新しいスプレッドシートIDをスクリプトプロパティに保存しました');
      }
    }
    
    // シート名
    const sheetName = 'EmailHistory';
    console.log('📑 シート名:', sheetName);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // シートが存在しない場合は作成
    if (!sheet) {
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
      console.log('✅ ヘッダー行を追加しました:', headerRow);
      // ヘッダー行を太字にする
      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E0E0E0');
      console.log('✅ ヘッダー行の書式を設定しました');
    } else {
      console.log('✅ 既存のシートを使用します');
    }
    
    // データを追加
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
      console.log('📋 追加するデータ（予約）:', rowData);
      sheet.appendRow(rowData);
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
      console.log('📋 追加するデータ（お問い合わせ）:', rowData);
      sheet.appendRow(rowData);
      console.log('✅ データを追加しました（お問い合わせ）');
    } else {
      console.warn('⚠️ 不明なタイプ:', type);
    }
    
    // データが正しく追加されたか確認
    const lastRow = sheet.getLastRow();
    console.log('📊 シートの最終行:', lastRow);
    if (lastRow > 0) {
      const lastRowData = sheet.getRange(lastRow, 1, 1, 11).getValues()[0];
      console.log('📋 最終行のデータ:', lastRowData);
    }
    
    console.log('✅ Google Sheetsに履歴を保存しました:', { type, timestamp: data.timestamp });
    return true;
  } catch (error) {
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

