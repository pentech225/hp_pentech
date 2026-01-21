/**
 * iTeen予約フォーム - Google Apps Script
 * 
 * このコードをGoogle Apps Scriptのエディタに貼り付けて使用してください。
 * 詳細な設定手順は、GOOGLE_APPS_SCRIPT_SETUP.mdを参照してください。
 */

// CORSヘッダーを設定するヘルパー関数
function setCorsHeaders(output) {
  return output.setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// OPTIONSリクエスト（プリフライト）に対応
function doOptions() {
  return setCorsHeaders(ContentService.createTextOutput(''));
}

function doPost(e) {
  try {
    // リクエストデータを取得
    if (!e || !e.postData || !e.postData.contents) {
      // エディタから直接実行された場合のエラーメッセージ
      const errorMsg = 'リクエストデータが正しくありません。\n\n' +
        'この関数は、Webアプリとしてデプロイしてから、HTTP POSTリクエストで呼び出す必要があります。\n' +
        'エディタから直接実行することはできません。\n\n' +
        'e: ' + JSON.stringify(e);
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = JSON.parse(e.postData.contents);
    console.log('受信データ:', data);
    
    // 問い合わせフォームか予約フォームかを判定
    const isContactForm = data.message && !data.date_raw && !data.date;
    
    if (isContactForm) {
      // 問い合わせフォームの処理
      return handleContactForm(data);
    } else {
      // 予約フォームの処理
      return handleReservationForm(data);
    }
  } catch (error) {
    // エラーログを記録
    console.error('エラー:', error);
    
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
      bodyLength: data.body ? data.body.length : 0
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
    
    // Gmailでメールを送信
    try {
      GmailApp.sendEmail(to, subject, body);
      console.log('メール送信成功');
    } catch (mailError) {
      console.error('メール送信エラー:', mailError);
      // メール送信エラーでも、カレンダー追加は成功しているので、エラーは記録するが続行
    }
    
    // 成功レスポンス
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'メールを送信し、カレンダーに予約を追加しました',
      eventId: event.getId(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    })));
    
  } catch (error) {
    console.error('予約フォーム処理エラー:', error);
    throw error;
  }
}

// GETリクエストにも対応（テスト用）
function doGet(e) {
  return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'iTeen予約フォーム API は正常に動作しています。',
    note: 'このAPIはPOSTリクエストで予約データを受け取ります。'
  })));
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

