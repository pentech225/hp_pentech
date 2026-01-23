# Google Apps Script設定手順

## 概要
Google Apps Scriptを使用して、予約フォームから自動的にメールを送信し、Googleカレンダーに予約を追加するための設定手順です。

## 1. Google Apps Scriptプロジェクトの作成

1. [Google Apps Script](https://script.google.com/)にアクセス
2. Googleアカウントでログイン（`iteen.mukonosou@gmail.com`のアカウントを使用）
3. 「新しいプロジェクト」をクリック
4. プロジェクト名を「iTeen予約フォーム」などに変更

## 2. スクリプトコードの追加

以下のコードをコピーして、Google Apps Scriptのエディタに貼り付けます：

```javascript
function doPost(e) {
  try {
    // リクエストデータを取得
    const data = JSON.parse(e.postData.contents);
    
    // メール送信
    const to = data.to || 'iteen.mukonosou@gmail.com';
    const subject = data.subject || '無料体験予約のお申し込み';
    const body = `
無料体験予約のお申し込みがありました。

予約希望日時: ${data.date} ${data.time}

予約確定のため、お客様にご連絡をお願いします。

---
このメールは予約フォームから自動送信されました。
iTeen 武庫之荘校
`;
    
    // Gmailでメールを送信
    GmailApp.sendEmail(to, subject, body);
    
    // 成功レスポンス（no-corsモードのため、実際には返されない）
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'メールを送信しました'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // エラーレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエストにも対応（テスト用）
function doGet(e) {
  return ContentService.createTextOutput('iTeen予約フォーム API は正常に動作しています。');
}
```

## 3. スクリプトの保存とデプロイ

1. コードを貼り付けたら、上部の「保存」ボタン（💾）をクリック
2. プロジェクト名を入力して保存
3. 上部の「デプロイ」→「新しいデプロイ」をクリック
4. 歯車アイコン（⚙️）をクリックして「種類の選択」
5. 「ウェブアプリ」を選択
6. 以下の設定を行う：
   - **説明**: `iTeen予約フォームメール送信`（任意）
   - **次のユーザーとして実行**: `自分`
   - **アクセスできるユーザー**: `全員`（重要！）
7. 「デプロイ」をクリック
8. **WebアプリのURL**をコピー（後で使用します）
9. 「承認が必要です」という警告が表示されたら、「承認」をクリック
10. Googleアカウントを選択
11. 「詳細」→「iTeen予約フォーム（安全ではないページ）に移動」をクリック
12. 「許可」をクリックして権限を付与

## 4. reserve.htmlの設定

`reserve.html`ファイルを開き、以下の値を実際の値に置き換えてください：

### Google Apps Script URLの設定

```javascript
// 819行目付近
const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // ← ここにWebアプリのURLを貼り付け
```

**例**:
```javascript
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

## 5. カレンダーへのアクセス権限の設定

Googleカレンダーにイベントを追加するため、以下の権限が必要です：

1. Google Apps Scriptのエディタで「実行」→「doPost」を選択（初回実行時）
2. 「承認が必要です」という警告が表示されたら、「承認」をクリック
3. Googleアカウントを選択
4. 「詳細」→「iTeen予約フォーム（安全ではないページ）に移動」をクリック
5. 「許可」をクリックして権限を付与
   - **Gmail送信**の権限
   - **Googleカレンダーへのアクセス**の権限

## 6. 動作確認

1. ブラウザで`reserve.html`を開く
2. 日付と時間を選択
3. 「予約を確定する」ボタンをクリック
4. `iteen.mukonosou@gmail.com`にメールが届くことを確認
5. Googleカレンダーに予約イベントが追加されていることを確認

## トラブルシューティング

### メールが送信されない場合

1. **Google Apps Scriptのログを確認**
   - Google Apps Scriptのエディタで「実行」→「doPost」を選択
   - 「表示」→「ログ」でエラーメッセージを確認

2. **権限の確認**
   - 「デプロイ」→「管理デプロイ」で、アクセス権限が「全員」になっているか確認
   - 再デプロイが必要な場合は、新しいバージョンを作成

3. **ブラウザのコンソールを確認**
   - F12キーを押して開発者ツールを開く
   - 「Console」タブでエラーメッセージを確認

4. **フォールバック機能**
   - Google Apps Scriptが設定されていない場合、自動的に`mailto:`リンクが使用されます
   - これは正常な動作です

### カレンダーに予約が追加されない場合

1. **カレンダーIDの確認**
   - `google-apps-script-code.js`の`CALENDAR_ID`が正しいか確認
   - Googleカレンダーの設定からカレンダーIDを再取得

2. **カレンダーへのアクセス権限**
   - Google Apps Scriptがカレンダーにアクセスできる権限があるか確認
   - 初回実行時に権限を付与する必要があります

3. **カレンダーの共有設定**
   - Googleカレンダーの設定で、スクリプトを実行するアカウントにカレンダーの編集権限があるか確認

### よくあるエラー

- **"Access denied"**: アクセス権限が「全員」に設定されていません
- **"Script function not found"**: 関数名が正しくありません（`doPost`であることを確認）
- **"CORS error"**: これは正常です。`no-cors`モードを使用しているため、レスポンスは取得できませんが、メールは送信されます

### セキュリティについて

- WebアプリのURLは公開されても問題ありませんが、スパム対策として、必要に応じて認証を追加できます
- 本番環境では、リファラー（送信元）のチェックや、レート制限を追加することを推奨します

## 高度な設定（オプション）

### リファラーチェックを追加

スパム対策として、特定のドメインからのリクエストのみを受け付けるようにできます：

```javascript
function doPost(e) {
  try {
    // リファラーをチェック（オプション）
    // const referer = e.parameter.referer;
    // if (referer && !referer.includes('yourdomain.com')) {
    //   throw new Error('Invalid referer');
    // }
    
    // ... 既存のコード ...
  } catch (error) {
    // ... エラーハンドリング ...
  }
}
```

### メールテンプレートの改善

HTMLメールを送信する場合：

```javascript
const htmlBody = `
<html>
  <body>
    <h2>無料体験予約のお申し込み</h2>
    <p>予約希望日時: <strong>${data.date} ${data.time}</strong></p>
    <p>予約確定のため、お客様にご連絡をお願いします。</p>
  </body>
</html>
`;

GmailApp.sendEmail(to, subject, '', {
  htmlBody: htmlBody
});
```

## 参考リンク

- [Google Apps Script公式ドキュメント](https://developers.google.com/apps-script)
- [GmailAppリファレンス](https://developers.google.com/apps-script/reference/gmail/gmail-app)

