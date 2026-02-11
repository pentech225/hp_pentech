# Google Sheetsへの送信履歴自動保存設定

## 概要

メール送信履歴をGoogle Sheetsに自動保存することで、ブラウザのデータをクリアしても履歴が残るようになります。

## 設定手順

### 1. Google Sheetsスプレッドシートを作成

1. [Google Sheets](https://sheets.google.com/)にアクセス
2. 新しいスプレッドシートを作成
3. スプレッドシート名を「iTeen メール送信履歴」などに変更
4. スプレッドシートのIDをコピー（URLの `/d/` と `/edit` の間の文字列）

### 2. Google Apps Scriptを更新

既存の `google-apps-script-code.js` に以下の関数を追加してください：

```javascript
// スプレッドシートID（作成したスプレッドシートのIDに置き換える）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// 送信履歴をGoogle Sheetsに保存
function saveHistoryToSheet(type, data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet;
    
    // シート名を決定
    const sheetName = type === 'reservation' ? '無料体験予約' : 'お問い合わせ';
    
    // シートが存在しない場合は作成
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        // ヘッダー行を追加
        if (type === 'reservation') {
          sheet.appendRow(['日時', 'お子様のお名前', '電話番号', 'メールアドレス', '学校区別', '学年', '予約希望日時', 'ご質問・ご要望']);
        } else {
          sheet.appendRow(['日時', 'メールアドレス', '電話番号', 'お問い合わせ内容']);
        }
      }
    } catch (e) {
      sheet = spreadsheet.insertSheet(sheetName);
      // ヘッダー行を追加
      if (type === 'reservation') {
        sheet.appendRow(['日時', 'お子様のお名前', '電話番号', 'メールアドレス', '学校区別', '学年', '予約希望日時', 'ご質問・ご要望']);
      } else {
        sheet.appendRow(['日時', 'メールアドレス', '電話番号', 'お問い合わせ内容']);
      }
    }
    
    // データを追加
    const now = new Date();
    if (type === 'reservation') {
      sheet.appendRow([
        now,
        data.child_name || '未入力',
        data.phone || '未入力',
        data.email || '未入力',
        data.school_type || '未入力',
        data.grade || '未入力',
        `${data.date || ''} ${data.time || ''}`,
        data.message || 'なし'
      ]);
    } else {
      sheet.appendRow([
        now,
        data.email || '未入力',
        data.phone || '未入力',
        data.message || '未入力'
      ]);
    }
    
    console.log('Google Sheetsに履歴を保存しました');
    return true;
  } catch (error) {
    console.error('Google Sheetsへの保存エラー:', error);
    return false;
  }
}
```

### 3. メール送信関数を更新

`handleContactForm` と `handleReservationForm` 関数内で、メール送信後に `saveHistoryToSheet` を呼び出してください：

```javascript
// メール送信後
saveHistoryToSheet('contact', {
  email: email,
  phone: phone,
  message: message
});
```

```javascript
// メール送信後
saveHistoryToSheet('reservation', {
  child_name: childName,
  phone: phone,
  email: email,
  school_type: schoolType,
  grade: grade,
  date: dateDisplay,
  time: timeDisplay,
  message: message
});
```

### 4. 権限の設定

1. Google Apps Scriptエディタで「実行」→「権限を確認」をクリック
2. スプレッドシートへのアクセス権限を承認

## 注意事項

- スプレッドシートIDは `config.js` に保存するか、Google Apps Script内で直接設定してください
- スプレッドシートは定期的にバックアップを取ることをお勧めします
- 大量のデータが蓄積される場合は、定期的に古いデータを削除してください

