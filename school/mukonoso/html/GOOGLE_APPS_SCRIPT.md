# Google Apps Script 総合ガイド

このファイルは以下の内容を統合したものです：
- GOOGLE_APPS_SCRIPT_SETUP.md
- GOOGLE_APPS_SCRIPT_EXPLANATION.md
- GOOGLE_APPS_SCRIPT_LOG_CHECK.md
- WEB_APP_LOGS_EXPLANATION.md
- CLOUD_LOGS_EXPLANATION.md
- CLOUD_LOGS_EXPLORER_ACCESS.md
- GCP_PROJECT_NUMBER_GUIDE.md
- DEPLOYMENT_VERIFICATION.md

---

## Google Apps Scriptとは

**Google Apps Script（GAS）**は、Googleが提供するクラウドベースのJavaScript実行環境です。

### 特徴

- **Googleのサーバー上で実行される**
  - あなたのPCではなく、Googleのサーバーでコードが実行されます
  - 24時間365日、常に動作可能です

- **Googleサービスと連携できる**
  - Gmail（メール送信）
  - Googleカレンダー（予定の追加）
  - Googleスプレッドシート（データの保存）
  - など、多くのGoogleサービスと連携できます

- **Webアプリとして公開できる**
  - HTTPリクエスト（GET/POST）を受け付けることができます
  - 外部のWebサイトから呼び出すことができます

---

## Google Apps Scriptプロジェクトの作成

1. [Google Apps Script](https://script.google.com/)にアクセス
2. Googleアカウントでログイン（`iteen.mukonosou@gmail.com`のアカウントを使用）
3. 「新しいプロジェクト」をクリック
4. プロジェクト名を「iTeen予約フォーム」などに変更

---

## スクリプトコードの追加

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

---

## デプロイとは何か

### デプロイの意味

**デプロイ（Deploy）**とは、**コードを実行可能な状態にして公開すること**です。

### 通常のコード実行との違い

#### エディタから直接実行（デプロイなし）の問題点

- あなたがGoogle Apps Scriptのエディタにログインしている時だけ実行できる
- 外部のWebサイト（reserve.html）からは呼び出せない
- URLが存在しない

#### Webアプリとしてデプロイ（デプロイあり）のメリット

- あなたがログインしていなくても動作する
- 外部のWebサイトから呼び出せる
- 専用のURLが生成される：`https://script.google.com/macros/s/XXXXX/exec`

### デプロイの設定項目

#### 「次のユーザーとして実行」

- **「自分」**: あなたのGoogleアカウントの権限で実行される
  - あなたのGmailからメールが送信される
  - あなたのGoogleカレンダーに予定が追加される

#### 「アクセスできるユーザー」（重要）

- **「自分」**: あなただけがアクセスできる → 外部のWebサイトからは呼び出せない
- **「全員」**: 誰でもアクセスできる → 外部のWebサイトから呼び出せる（**こちらを選択**）

---

## スクリプトの保存とデプロイ手順

1. コードを貼り付けたら、上部の「保存」ボタンをクリック
2. プロジェクト名を入力して保存
3. 上部の「デプロイ」→「新しいデプロイ」をクリック
4. 歯車アイコンをクリックして「種類の選択」
5. 「ウェブアプリ」を選択
6. 以下の設定を行う：
   - **説明**: `iTeen予約フォームメール送信`（任意）
   - **次のユーザーとして実行**: `自分`
   - **アクセスできるユーザー**: `全員`（重要）
7. 「デプロイ」をクリック
8. **WebアプリのURL**をコピー（後で使用します）
9. 「承認が必要です」という警告が表示されたら、「承認」をクリック
10. Googleアカウントを選択
11. 「詳細」→「iTeen予約フォーム（安全ではないページ）に移動」をクリック
12. 「許可」をクリックして権限を付与

---

## reserve.htmlの設定

`reserve.html`ファイルを開き、以下の値を実際の値に置き換えてください：

```javascript
// 819行目付近
const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // ← ここにWebアプリのURLを貼り付け
```

---

## メール送信の仕組み

### 全体の流れ

```
1. ユーザーが予約フォームに入力
   ↓
2. 「予約を確定する」ボタンをクリック
   ↓
3. reserve.htmlのJavaScriptが実行される
   ↓
4. fetch()でGoogle Apps ScriptのURLにPOSTリクエストを送信
   ↓
5. Google Apps ScriptのdoPost()関数が実行される
   ↓
6. GmailApp.sendEmail()でメールを送信
   ↓
7. 成功/失敗のレスポンスを返す
   ↓
8. reserve.htmlがレスポンスを受け取る
```

### フォーム送信（reserve.html）のコード例

```javascript
const emailData = {
    to: 'iteen.mukonosou@gmail.com',
    subject: '無料体験予約のお申し込み',
    child_name: '山田太郎',
    phone: '09012345678',
};

fetch('https://script.google.com/macros/s/XXXXX/exec', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData)
})
```

---

## Google Apps Scriptのログ確認方法

### `no-cors`モードの制限について

現在、`reserve.html`では`no-cors`モードでリクエストを送信しています：

```javascript
fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
  method: 'POST',
  mode: 'no-cors',  // ← これが原因
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(emailData)
})
```

**`no-cors`モードの制限:**
- リクエストはGoogle Apps Scriptに到達します
- レスポンスを取得できません
- クライアント側では成功/失敗が分かりません

そのため、Google Apps Script側のログを確認する必要があります。

### ログ確認手順

#### 方法1: 実行数画面で個別の実行をクリック（最も簡単・推奨）

1. https://script.google.com/ にアクセスし、`iteen.mukonosou@gmail.com`でログイン
2. プロジェクト「iTee予約管理」を開く
3. 左側のメニューから「実行数」アイコンをクリック
4. 実行履歴のテーブルから最新の`doPost`実行を探す
5. その行をクリックするとログパネルが表示されます

**この方法の利点:**
- 追加の設定が不要
- `Logger.log()`と`console.log()`の両方が表示される
- エラーメッセージも確認できる

#### 方法2: コードエディタ画面からログを確認（確実に表示される）

1. 左側のメニューから「コード」アイコン（</>）をクリック
2. メニューバーの「表示」をクリック
3. 「ログ」を選択（またはキーボードショートカット：`Ctrl+Enter`）
4. 画面下部にログパネルが表示されます

**この方法の利点:**
- 確実にログパネルが表示される
- 実行履歴をクリックしなくても、最新のログが表示される

### 確認すべきログの内容

#### `doPost`関数が呼び出されているか
```
=== doPost関数が呼び出されました ===
📥 受信データ: {...}
📋 フォームタイプ判定: 予約
📅 予約フォームの処理を開始
```

#### `saveToGoogleSheets`関数が呼び出されているか
```
📊 Google Sheetsへの保存を開始します...
📊 saveToGoogleSheets関数が呼び出されました
📊 タイプ: reservation
```

#### スプレッドシートが作成/開かれているか（初回実行の場合）
```
📝 初回実行のため、新しいスプレッドシートを作成します...
✅ 新規スプレッドシートを作成しました
🔑 スプレッドシートID: XXXX...
📄 スプレッドシートURL: https://docs.google.com/spreadsheets/d/XXXX.../edit
```

---

## ウェブアプリ実行時のログが表示されない場合

### ログの表示方法の違い

- **エディタから実行**: ログがすぐに表示される
- **ウェブアプリとして実行**: ログが表示されるまでに時間がかかる場合がある（数分〜数十分）

### 解決策

**実行数画面で個別の実行をクリックすることが最も確実な方法です。**

1. 左側のメニューから「実行数」アイコンをクリック
2. 最新の`doPost`実行（「種類」が「ウェブアプリ」のもの）を探す
3. その行をクリック
4. ログパネルで確認

---

## Cloud Loggingについて

Google Apps Scriptには2種類のログがあります：

### 1. `Logger.log()` - エディタ実行時のログ

- **表示場所**: 実行数画面の個別の実行をクリック
- **確認方法**: 実行履歴の行をクリックすると、画面下部または右側にログパネルが表示される

### 2. `console.log()` - Webアプリ実行時のログ（Cloud Logging）

- **表示場所**: Cloud Logging（別のサービス）
- **確認方法**: 「Cloud のログ」メニューから確認（有効化が必要な場合あり）

### Cloud Loggingは通常不要

通常のデバッグには、実行数画面でログを確認すれば十分です。Cloud Loggingは大規模な運用や詳細な分析が必要な場合に使用します。

### Cloud Logging APIの有効化（必要な場合のみ）

1. Google Apps Scriptのプロジェクト設定を開く
2. 「Google Cloud Platform（GCP）プロジェクト」セクションを確認
3. https://console.cloud.google.com/ にアクセス
4. 「APIとサービス」→「ライブラリ」をクリック
5. 「Cloud Logging API」を検索して「有効にする」をクリック

---

## ログエクスプローラーへのアクセス方法

Google Cloud Consoleでログエクスプローラーにアクセスする手順：

1. 左側のナビゲーションメニューをスクロールして「ロギング」セクションを探す
2. 「ロギング」をクリック
3. 「ログエクスプローラー」をクリック
4. 「リソースタイプ」で「Google Apps Script」を選択
5. 時間範囲を設定して「クエリを実行」をクリック

**直接URLでアクセスする場合:**
```
https://console.cloud.google.com/logs/query?project=YOUR_PROJECT_ID
```

---

## GCPプロジェクト番号の設定ガイド

### プロジェクト番号の特徴

- **自動生成**: Googleが自動的に割り当てる数字（例：`123456789012`）
- **一意性**: 各プロジェクトに固有の番号が割り当てられます
- **変更不可**: 一度割り当てられた番号は変更できません
- **手動設定不可**: ユーザーが自由に設定することはできません

### プロジェクトIDとの違い

- **プロジェクトID**: ユーザーが設定できる名前（例：`iteen-reservation-management`）
- **プロジェクト番号**: Googleが自動的に割り当てる数字

### 推奨設定

既存のプロジェクトがある場合は、そのまま使用することを推奨します。新しいプロジェクトを作成すると、認証の再設定やAPIの再有効化が必要になるためです。

### 新しいプロジェクトを作成する場合

1. Google Apps Scriptのプロジェクト設定を開く
2. 「プロジェクト番号を変更」をクリック
3. 「こちら」リンクからGoogle Cloud Consoleを開く
4. プロジェクト情報を入力：
   - **プロジェクト名**: `iTee予約管理` または `iteen-reservation-management`
   - **プロジェクトID**: 小文字・数字・ハイフンのみ使用可能（例：`iteen-reservation-management`）
5. 「作成」をクリック
6. 自動的に割り当てられたプロジェクト番号を入力して「プロジェクトを設定」をクリック

### 注意事項

プロジェクトを変更する場合：
1. 古いプロジェクトの認証が完全に取り消されます
2. Apps Scriptで管理するプロジェクトに戻せません
3. 新しいプロジェクトでAPIを再度有効化する必要があります

---

## デプロイ情報の紐づけ確認手順

実際にデプロイされているページとGoogle Apps Scriptのデプロイ情報が正しく紐づいているかを確認する手順です。

### ステップ1: 実際のページのURLを確認

1. https://www.pentech.info/school/mukonoso/html/reserve.html を開く
2. F12キーで開発者ツールを開く
3. 「Sources」タブで`reserve.html`を選択
4. `GOOGLE_APPS_SCRIPT_URL`を検索して実際に使用されているURLを確認

### ステップ2: Google Apps Script側のデプロイURLを確認

1. https://script.google.com/ を開く
2. 「iTeen 問い合わせ・予約フォーム」プロジェクトを選択
3. 「デプロイ」→「管理デプロイ」をクリック
4. WebアプリのURLと設定（「全員」アクセス）を確認

### ステップ3: URLの一致確認

- 両方のURLが一致しているか確認
- 一致していない場合は`reserve.html`のURLを更新して再デプロイ

### ステップ4: GETリクエストでテスト

ブラウザでデプロイURLに直接アクセスし、以下のJSONが表示されることを確認：
```json
{
  "success": true,
  "message": "iTeen予約フォーム API は正常に動作しています。"
}
```

### ステップ5: 実際の送信テスト

1. https://www.pentech.info/school/mukonoso/html/reserve.html を開く
2. テストデータを入力して送信
3. Google Apps Scriptのログを確認
4. メールとカレンダーへの反映を確認

---

## カレンダーへのアクセス権限の設定

1. Google Apps Scriptのエディタで「実行」→「doPost」を選択（初回実行時）
2. 「承認が必要です」という警告が表示されたら、「承認」をクリック
3. Googleアカウントを選択
4. 「詳細」→「iTeen予約フォーム（安全ではないページ）に移動」をクリック
5. 「許可」をクリックして権限を付与
   - **Gmail送信**の権限
   - **Googleカレンダーへのアクセス**の権限

---

## よくあるエラーと対処法

- **"Access denied"**: アクセス権限が「全員」に設定されていません
- **"Script function not found"**: 関数名が正しくありません（`doPost`であることを確認）
- **"CORS error"**: これは正常です。`no-cors`モードを使用しているため、レスポンスは取得できませんが、メールは送信されます
- **"リクエストデータが正しくありません"**: `doPost` は直接実行できません。テストには`testContactForm`や`testReservationForm`を使用してください

---

## コードを変更した場合の再デプロイ

コードを変更して保存しただけでは、デプロイされたWebアプリには反映されません。以下の手順で再デプロイが必要です：

1. コードを修正して保存
2. 「デプロイ」→「管理デプロイ」を開く
3. 歯車アイコンをクリック
4. 「新しいバージョン」を選択
5. 「デプロイ」をクリック
6. 必要に応じて`config.js`の`GOOGLE_APPS_SCRIPT_URL`を更新

---

## セキュリティについて

- WebアプリのURLは公開されても問題ありませんが、スパム対策として、必要に応じて認証を追加できます
- 本番環境では、リファラー（送信元）のチェックや、レート制限を追加することを推奨します

---

## 参考リンク

- [Google Apps Script公式ドキュメント](https://developers.google.com/apps-script)
- [GmailAppリファレンス](https://developers.google.com/apps-script/reference/gmail/gmail-app)
- [Google Calendar API ドキュメント](https://developers.google.com/calendar/api/v3/reference)
