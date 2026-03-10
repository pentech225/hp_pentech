# 通知設定 総合ガイド

このファイルは以下の内容を統合したものです：
- LINE_MESSAGING_API_SETUP.md
- LINE_NOTIFY_MIGRATION.md
- LINE_NOTIFY_SETUP.md
- NOTIFICATION_OPTIONS.md
- EMAIL_HISTORY_TEST.md
- EMAIL_TROUBLESHOOTING.md

---

## 通知方法の概要と比較

予約情報がGoogle Sheetsに追加された際に通知を受け取る方法の候補です。

### 比較表

| 方法 | 難易度 | コスト | リアルタイム性 | 設定の簡単さ |
|------|--------|--------|----------------|--------------|
| **メール通知** | 非常に簡単 | 無料 | 低 | 非常に簡単 |
| **LINE通知（Messaging API）** | 簡単 | 無料（月500通まで） | 高 | やや複雑 |
| **Slack通知** | 簡単 | 無料 | 高 | 簡単 |
| **Google Chat** | 簡単 | 無料* | 高 | 簡単 |
| **Discord通知** | 簡単 | 無料 | 高 | 簡単 |
| **SMS通知** | 中程度 | 有料 | 高 | 複雑 |

*Google Workspaceアカウントが必要

### 推奨順位

1. **メール通知**: 実装が最も簡単で、確実に届く（既に実装済み）
2. **LINE通知**: 日本で広く使われており、リアルタイム性が高い
3. **Slack通知**: チームで共有したい場合に最適

---

## メール通知の実装

### 実装方法

```javascript
// saveToGoogleSheets関数の成功後に追加
GmailApp.sendEmail(
  'iteen.mukonosou@gmail.com',
  '【新規予約】無料体験予約のお申し込み',
  `新しい予約が追加されました。

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
予約希望日時: ${dateDisplay} ${timeDisplay}
${message ? `ご質問・ご要望:\n${message}` : ''}

Google Sheetsで確認: [スプレッドシートURL]`
);
```

### メリット

- 実装済み（追加設定不要）
- 無料
- 確実に届く
- 履歴が残る

### デメリット

- リアルタイム性が低い（メールチェックが必要）

---

## LINE Notify 設定手順（サービス終了済み）

**重要: LINE Notifyは2025年3月31日にサービス終了しました。**

現在はLINE Messaging APIへの移行が必要です。既存のLINE Notifyトークンを持っている場合の参考として残します。

### トークンの取得（サービス終了前の手順）

1. [LINE Notify](https://notify-bot.line.me/) にアクセス
2. LINEアカウントでログイン
3. 右上の「マイページ」をクリック
4. 「トークンを発行する」をクリック
5. トークン名を入力し、通知を送信するトークルームを選択
6. 「発行する」をクリック
7. 表示されたトークンをコピー（**このトークンは一度しか表示されません**）

### Google Apps ScriptへのLINE Notifyトークン設定

#### 方法1: スクリプトプロパティから設定（推奨）

1. Google Apps Scriptのエディタを開く
2. 「プロジェクトの設定」（歯車アイコン）をクリック
3. 「スクリプト プロパティ」セクションまでスクロール
4. 「スクリプト プロパティを追加」をクリック
5. **プロパティ**: `LINE_NOTIFY_TOKEN`、**値**: 取得したトークン
6. 「保存」をクリック

### 通知内容のカスタマイズ

```javascript
const lineMessage = `🔔 新しい予約が追加されました

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
予約希望日時: ${dateDisplay} ${timeDisplay}${message ? `\n\nご質問・ご要望:\n${message}` : ''}`;
```

### LINE Notify終了に伴うタイムライン

- **2025年3月31日まで**: LINE Notifyが利用可能
- **2025年3月31日以降**: LINE Notifyは利用不可（メール通知は継続して動作）

---

## LINE Messaging API 設定手順（推奨の代替手段）

LINE Notifyの公式代替手段として、LINE Messaging APIを使用する設定手順です。

### 前提条件

- LINEアカウントを持っていること
- LINE公式アカウントを作成できること（無料）
- Google Apps Scriptのエディタにアクセスできること

### ステップ1: LINE Developersコンソールでチャネルを作成

1. [LINE Developers](https://developers.line.biz/ja/) にアクセス
2. LINEアカウントでログイン
3. 「プロバイダーを作成」をクリック
4. プロバイダー名を入力（例：「iTeen予約通知」）して「作成」をクリック
5. 「チャネルを作成」をクリック
6. 「Messaging API」を選択
7. チャネル情報を入力：
   - **チャネル名**: 「iTeen予約通知」など
   - **大業種**: 「教育」など
8. 利用規約に同意して「作成」をクリック

### ステップ2: チャネルアクセストークンを取得

1. 作成したチャネルを選択
2. 「Messaging API」タブを開く
3. 「チャネルアクセストークン」セクションまでスクロール
4. 「発行」をクリック
5. 表示されたトークンをコピー（**このトークンは一度しか表示されません**）

### ステップ3: ユーザーIDを取得（通知先の設定）

LINE Messaging APIでは、通知を送信する先のユーザーIDが必要です。

**方法: 友だち追加してユーザーIDを取得**

1. チャネル設定の「Messaging API」タブを開く
2. 「QRコード」を表示してスキャン、友だち追加
3. 以下の関数でユーザーIDを取得：

```javascript
function getLineUserId() {
  const channelAccessToken = 'YOUR_CHANNEL_ACCESS_TOKEN';
  const url = 'https://api.line.me/v2/bot/followers/ids';

  const options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Bearer ' + channelAccessToken
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  Logger.log('ユーザーID: ' + data.userIds[0]);
  return data.userIds[0];
}
```

### ステップ4: Google Apps ScriptにトークンとユーザーIDを設定

#### 方法1: スクリプトプロパティから設定（推奨）

1. Google Apps Scriptのエディタを開く
2. 「プロジェクトの設定」（歯車アイコン）をクリック
3. 「スクリプト プロパティ」セクションまでスクロール
4. 以下のプロパティを追加：
   - **プロパティ**: `LINE_CHANNEL_ACCESS_TOKEN`、**値**: チャネルアクセストークン
   - **プロパティ**: `LINE_USER_ID`、**値**: ユーザーID

#### 方法2: 関数を使用して設定

```javascript
function setLineMessagingAPICredentials() {
  const properties = PropertiesService.getScriptProperties();

  const channelAccessToken = 'YOUR_CHANNEL_ACCESS_TOKEN_HERE';
  const userId = 'YOUR_USER_ID_HERE';

  properties.setProperty('LINE_CHANNEL_ACCESS_TOKEN', channelAccessToken);
  properties.setProperty('LINE_USER_ID', userId);

  Logger.log('✅ LINE Messaging APIの認証情報を設定しました');
  return true;
}
```

### ステップ5: LINE Messaging API送信関数を追加

```javascript
function sendLineMessagingAPI(message) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const channelAccessToken = properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
    const userId = properties.getProperty('LINE_USER_ID');

    if (!channelAccessToken) throw new Error('LINE_CHANNEL_ACCESS_TOKENが設定されていません');
    if (!userId) throw new Error('LINE_USER_IDが設定されていません');

    const url = 'https://api.line.me/v2/bot/message/push';

    const payload = {
      'to': userId,
      'messages': [
        {
          'type': 'text',
          'text': message
        }
      ]
    };

    const options = {
      'method': 'post',
      'headers': {
        'Authorization': 'Bearer ' + channelAccessToken,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log('✅ LINE Messaging APIで通知を送信しました');
      return true;
    } else {
      throw new Error('LINE Messaging APIの送信に失敗しました。レスポンスコード: ' + responseCode);
    }
  } catch (error) {
    Logger.log('❌ LINE Messaging API送信エラー: ' + error.toString());
    throw error;
  }
}
```

### ステップ6: handleReservationForm関数の更新

```javascript
// LINE Messaging APIで通知を送信（保存成功後）
try {
  const lineMessage = `🔔 新しい予約が追加されました

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
予約希望日時: ${dateDisplay} ${timeDisplay}${message ? `\n\nご質問・ご要望:\n${message}` : ''}`;

  sendLineMessagingAPI(lineMessage);
  Logger.log('✅ LINE通知を送信しました');
} catch (lineError) {
  Logger.log('⚠️ LINE通知の送信に失敗しました: ' + lineError.toString());
  // LINE通知のエラーは記録するが続行（データ保存は成功している）
}
```

### ステップ7: 動作確認

```javascript
function testLineMessagingAPI() {
  sendLineMessagingAPI('🧪 テスト通知です。\n\nLINE Messaging APIが正常に動作しています！');
}
```

### 料金について

LINE Messaging APIは、**月500通まで無料**です。超過分は1通あたり0.1円（税込）。

### セキュリティに関する注意

- **チャネルアクセストークンは機密情報です**
  - コードに直接書かない（`PropertiesService`を使用）
  - 他人に共有しない
  - 定期的に再発行することを推奨

---

## その他の通知方法

### Slack通知

```javascript
function sendSlackNotification(message) {
  const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL'; // PropertiesServiceに保存推奨

  const payload = {
    'text': message,
    'username': '予約通知Bot',
    'icon_emoji': ':bell:'
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };

  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
}
```

### Google Chat通知

```javascript
function sendGoogleChatNotification(message) {
  const GOOGLE_CHAT_WEBHOOK_URL = 'YOUR_GOOGLE_CHAT_WEBHOOK_URL';

  const payload = {
    'text': message
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };

  UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_URL, options);
}
```

### Discord通知

```javascript
function sendDiscordNotification(message) {
  const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL';

  const payload = {
    'content': message,
    'username': '予約通知Bot'
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };

  UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
}
```

### 複数方法の併用

複数の通知方法を組み合わせることも可能です。例えば：
- **メール通知** + **LINE通知** = 確実性とリアルタイム性の両立
- **メール通知** + **Slack通知** = 個人通知とチーム共有の両立

### 実装時の注意点

1. **トークンやURLの管理**: `PropertiesService`を使用して機密情報を保存（コードに直接書かない）
2. **エラーハンドリング**: 通知送信に失敗しても、データ保存は成功させる
3. **通知頻度の制限**: 短時間に大量の通知が来ないように制限を設ける（必要に応じて）
4. **通知内容の最適化**: 重要な情報だけを含める

---

## メール送信履歴（saveEmailHistory）の動作確認方法

### 確認方法1: ブラウザのコンソールでテスト関数を実行（推奨）

1. https://www.pentech.info/school/mukonoso/html/reserve.html を開く
2. `F12`キーを押して開発者ツールを開く
3. 「Console」タブを開く
4. 以下のコマンドを入力してEnterキーを押す：
   ```javascript
   testSaveEmailHistory()
   ```
5. コンソールに以下のようなログが表示されます：
   ```
   🧪 saveEmailHistory関数のテストを開始します...
   📝 テスト1: 予約フォームの履歴を保存
   📧 メール送信履歴を保存しました: {id: "...", timestamp: "...", type: "reservation", data: {...}}
   結果: ✅ 成功
   ```

### 確認方法2: 実際にフォームを送信して確認

1. 予約フォームにテストデータを入力
2. 「予約を確定する」ボタンをクリック
3. 開発者ツールで以下のログを確認：
   ```
   📧 メール送信履歴を保存しました: {id: "...", timestamp: "...", type: "reservation", data: {...}}
   ```
4. コンソールで履歴を確認：
   ```javascript
   getEmailHistory()
   ```

### 確認方法3: ローカルストレージを直接確認

1. 開発者ツールを開く
2. 「Application」タブを選択
3. 左側のメニューから「Local Storage」を展開
4. `email_history`キーをクリックして値を確認

### デバッグ用コマンド

ブラウザのコンソールで以下のコマンドを実行できます：

```javascript
// 履歴を取得
getEmailHistory()

// 履歴をクリア
clearEmailHistory()

// 履歴を保存（テスト用）
saveEmailHistory('reservation', {
    child_name: 'テスト',
    phone: '09012345678',
    email: 'test@example.com',
    school_type: '小学生',
    grade: '小学3年生',
    date: '2026/2/25 (水)',
    time: '8:10',
    message: 'テストメッセージ'
})

// ローカルストレージを直接確認
localStorage.getItem('email_history')

// ローカルストレージを直接削除
localStorage.removeItem('email_history')
```

### よくある問題と解決方法

#### 問題1: 「saveEmailHistory is not defined」エラー

**原因:** `email-history.js`が読み込まれていない

**解決方法:**
1. `reserve.html`の12行目に`<script src="email-history.js"></script>`があるか確認
2. `config.js`の後に読み込まれているか確認
3. ブラウザをリロード（`Ctrl+F5`で強制リロード）

#### 問題2: 履歴が保存されない

**原因:** ローカルストレージが無効になっている、またはプライベートモード

**解決方法:**
1. 通常モードでブラウザを開く
2. ブラウザの設定でローカルストレージが有効になっているか確認

---

## メールが届かない場合のトラブルシューティング

### ステップ1: Google Apps Scriptの実行ログを確認（最も重要）

1. https://script.google.com/ にアクセス
2. プロジェクト「iTee予約管理」を開く
3. 左側のメニューから「実行数」アイコンをクリック
4. 最新の`doPost`実行をクリック
5. ログを確認

**成功時のログ例:**
```
=== doPost関数が呼び出されました ===
📥 受信データ: {...}
📅 予約フォームの処理を開始
📧 メール送信準備完了
📧 送信先: iteen.mukonosou@gmail.com
✅ 管理者へのメール送信成功
```

**失敗時のログ例:**
```
❌ 管理者へのメール送信エラー: Exception: メール送信に失敗しました
```

### ステップ2: Gmailの受信トレイを確認

1. `iteen.mukonosou@gmail.com`でログイン
2. 受信トレイを確認
3. 迷惑メールフォルダも確認
4. 検索バーに「無料体験予約」と入力して検索

### ステップ3: Googleカレンダーを確認

メールが届かなくても、カレンダーにイベントが追加されていれば、リクエストはGoogle Apps Scriptに到達しています。

### よくある問題と解決方法

#### 問題1: ログに「❌ 管理者へのメール送信エラー」が表示される

**原因1: Gmail送信の権限が不足している**
```
Exception: このスクリプトには Gmail へのアクセス権限がありません。
```
- Google Apps Scriptのエディタで「実行」→「doPost」を選択
- 「承認が必要です」という警告が表示されたら「承認」をクリック
- Gmail送信の権限を付与

**原因2: Gmailの送信制限に達している**
```
Exception: 1日の送信上限に達しました。
```
- 時間をおいて再試行してください

**原因3: メールアドレスの形式が正しくない**
- `google-apps-script-code.js`の`to`変数を確認

#### 問題2: 成功ログが表示されるが、メールが届かない

**原因1: スパムフォルダに入っている**
- Gmailの「迷惑メール」フォルダを確認
- 「迷惑メールではない」をクリック

**原因2: メールフィルタで自動削除されている**
- Gmailの設定 → 「フィルタとブロック中のアドレス」タブを確認

#### 問題3: ログに「=== doPost関数が呼び出されました ===」が表示されない

**解決方法:**
1. デプロイURLを確認（「デプロイ」→「管理デプロイ」）
2. `reserve.html`の`GOOGLE_APPS_SCRIPT_URL`が正しいか確認
3. F12キーで開発者ツールを開き、「リクエストを送信しました (no-corsモード)」が表示されているか確認

### デバッグ用のテスト関数

```javascript
// テスト用関数（メール送信のみ）
function testEmailSending() {
  try {
    const to = 'iteen.mukonosou@gmail.com';
    const subject = 'テストメール送信';
    const body = 'これはテストメールです。\n\nGoogle Apps Scriptから送信されました。';

    Logger.log('📧 テストメール送信を開始します...');
    GmailApp.sendEmail(to, subject, body);
    Logger.log('✅ テストメール送信成功');
  } catch (error) {
    Logger.log('❌ テストメール送信エラー: ' + error.toString());
  }
}
```

### 確認チェックリスト

- [ ] Google Apps Scriptの実行ログを確認
- [ ] ログに「✅ 管理者へのメール送信成功」が表示されているか確認
- [ ] Gmailの受信トレイを確認
- [ ] Gmailの迷惑メールフォルダを確認
- [ ] Googleカレンダーにイベントが追加されているか確認
- [ ] Gmail送信の権限が付与されているか確認
- [ ] Gmailの送信制限に達していないか確認
- [ ] デプロイが正しく行われているか確認
- [ ] `GOOGLE_APPS_SCRIPT_URL`が正しいか確認

---

## 参考リンク

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [LINE Messaging API 料金](https://developers.line.biz/ja/docs/messaging-api/pricing/)
- [LINE Developers コンソール](https://developers.line.biz/console/)
