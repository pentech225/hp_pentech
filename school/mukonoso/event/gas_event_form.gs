/**
 * 武庫っ子ゲームプログラミング大会 - 申し込みフォーム GAS
 *
 * 【セットアップ手順】
 * 1. Google スプレッドシートを新規作成
 * 2. 下の SPREADSHEET_ID にそのIDを貼り付ける
 * 3. スプレッドシートに2つのシートを作成（名前は以下のとおり）
 *    - "申込一覧"  ← 自動作成されます
 *    - "枠管理"   ← 自動作成されます（initSheets() を1回実行してください）
 * 4. このスクリプトをデプロイ → ウェブアプリ → アクセス：全員
 *
 * 【申込一覧シートの列構成】
 * 申込日時 | 時間帯 | お子さんのお名前 | 学年 | 電話番号 | メールアドレス | ご質問
 * ※ 子ども1人につき1行。2人申し込みなら2行追加。
 */

const SPREADSHEET_ID = '1RJAoO36Cdvrcm8MmO2rG4tMj_5b1hSTIVXTGhBfWXRs';
const SHEET_REGISTRATIONS = '申込一覧';
const SHEET_SLOTS = '枠管理';

// ---- シート初期化（最初に1回だけ手動実行） ----
function initSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 申込一覧シート（1人1行・学年を独立列）
  let regSheet = ss.getSheetByName(SHEET_REGISTRATIONS);
  if (!regSheet) regSheet = ss.insertSheet(SHEET_REGISTRATIONS);
  if (regSheet.getLastRow() === 0) {
    regSheet.appendRow(['申込日時', '時間帯', 'お子さんのお名前', '学年', '電話番号', 'メールアドレス', 'ご質問']);
    regSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }

  // 枠管理シート
  let slotSheet = ss.getSheetByName(SHEET_SLOTS);
  if (!slotSheet) slotSheet = ss.insertSheet(SHEET_SLOTS);
  if (slotSheet.getLastRow() === 0) {
    slotSheet.appendRow(['時間帯', '定員', '申込数']);
    slotSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    const slots = [
      ['1部：10:00〜10:30', 10, 0],
      ['2部：11:00〜11:30', 10, 0],
      ['3部：13:00〜13:30', 10, 0],
      ['4部：14:00〜14:30', 10, 0],
      ['5部：15:00〜15:30', 10, 0],
    ];
    slotSheet.getRange(2, 1, slots.length, 3).setValues(slots);
  }

  Logger.log('シート初期化完了');
}

// ---- GET: 枠管理データを返す ----
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_SLOTS);
    const rows = sheet.getDataRange().getValues();

    const result = {};
    for (let i = 1; i < rows.length; i++) {
      result[rows[i][0]] = {
        capacity:   rows[i][1],
        registered: rows[i][2],
      };
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, slots: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- POST: 申し込み記録 + 枠数+1 + メール送信 ----
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // 参加者リストを構築（children 配列優先、なければ旧フォーマットからフォールバック）
    const children = (data.children && data.children.length > 0)
      ? data.children
      : buildChildrenFromLegacy(data);
    const participantCount = children.length;

    // メール用の全員名（例: "やまだ たろう（小学3年生）、やまだ はなこ（小学1年生）"）
    const childrenDetail = children
      .map(c => c.grade ? `${c.name}（${c.grade}）` : c.name)
      .join('、');

    // 申込一覧に追記（子ども1人につき1行）
    const regSheet = ss.getSheetByName(SHEET_REGISTRATIONS);
    const timestamp = new Date();
    children.forEach(child => {
      regSheet.appendRow([
        timestamp,
        data.time_slot || '',
        child.name  || '',
        child.grade || '',
        data.phone  || '',
        data.email  || '',
        data.message || '',
      ]);
    });

    // 枠管理シートの申込数を参加人数分だけ加算
    const slotSheet = ss.getSheetByName(SHEET_SLOTS);
    const rows = slotSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0].toString().trim() === (data.time_slot || '').toString().trim()) {
        slotSheet.getRange(i + 1, 3).setValue(rows[i][2] + participantCount);
        break;
      }
    }

    // 運営へのメール通知
    sendNotificationEmail(data, childrenDetail, participantCount);

    // 申込者へのメール（メアドがある場合）
    if (data.email && data.email !== '未入力') {
      sendConfirmationEmail(data, childrenDetail);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 旧フォーマット（child_name + extra_names）から children 配列を生成するフォールバック
function buildChildrenFromLegacy(data) {
  const first = { name: data.child_name || '', grade: '' };
  const extras = (data.extra_names || '')
    .split('、')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(name => ({ name, grade: '' }));
  return [first, ...extras].filter(c => c.name !== '');
}

// ---- 運営メール ----
function sendNotificationEmail(data, childrenDetail, participantCount) {
  const to = 'iteen.mukonosou@gmail.com';
  const subject = '【申し込み】ゲームプログラミング大会';
  const body = `新しい申し込みがありました。

時間帯：${data.time_slot}
お子さんのお名前：${childrenDetail}（${participantCount}名）
電話番号：${data.phone}
メールアドレス：${data.email || '未入力'}
ご質問：${data.message || 'なし'}

申込日時：${new Date().toLocaleString('ja-JP')}

---
iTeen 武庫之荘校 自動送信`;

  MailApp.sendEmail({ to, subject, body });
}

// ---- 申込者への確認メール ----
function sendConfirmationEmail(data, childrenDetail) {
  const subject = '【iTeen 武庫之荘校】ゲームプログラミング大会 参加申し込みのご確認';
  const body = `${data.child_name} 様

この度は「武庫っ子あつまれ！ゲームプログラミング大会」へのお申し込みありがとうございます。

【申し込み内容】
時間帯：${data.time_slot}
お子さんのお名前：${childrenDetail}
電話番号：${data.phone}
${data.message ? `ご質問：${data.message}\n` : ''}
【イベント情報】
開催日時：2026年5月3日(日) ${data.time_slot}
会場：尼崎市立武庫西生涯学習プラザ 2F 小会議室
住所：〒661-0041 兵庫県尼崎市武庫の里１丁目１３−２９

当日お会いできるのを楽しみにしております！
お問い合わせ：070-2327-8083（担当：彦阪 吉海）

---
iTeen 子どものためのICT教育普及促進委員会`;

  MailApp.sendEmail({ to: data.email, subject, body });
}
