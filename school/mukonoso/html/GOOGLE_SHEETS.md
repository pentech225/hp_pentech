# Google Sheets 総合ガイド

このファイルは以下の内容を統合したものです：
- GOOGLE_SHEETS_SETUP.md
- GOOGLE_SHEETS_VERIFICATION.md
- GOOGLE_SHEETS_PERMISSION_SETUP.md
- GOOGLE_SHEETS_ACCESS_PERMISSION.md
- GOOGLE_SHEETS_PROPERTIES_SERVICE_SETUP.md
- GOOGLE_SHEETS_HISTORY_SETUP.md
- GOOGLE_SHEETS_WRITE_PROCESS.md
- GOOGLE_DRIVE_PERMISSION_ISSUE.md

---

## Google Sheetsへの履歴保存設定ガイド

メール送信履歴をGoogle Sheetsに自動保存することで、ブラウザのデータをクリアしても履歴が残るようになります。

### 設定手順

#### ステップ1: スプレッドシートを作成（オプション）

Google Apps Scriptが自動的にスプレッドシートを作成しますが、手動で作成することもできます。

1. [Google Sheets](https://sheets.google.com)にアクセス
2. 新しいスプレッドシートを作成
3. スプレッドシート名を「iTeen 武庫之荘校 - メール送信履歴」に変更（任意）
4. スプレッドシートのURLからIDを取得
   - 例: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - `SPREADSHEET_ID`の部分がIDです

#### ステップ2: Google Apps Scriptのコードを更新

1. [Google Apps Script](https://script.google.com)にアクセス
2. 既存のプロジェクトを開く（または新規作成）
3. `google-apps-script-code.js`の内容をコピー＆ペースト
4. **重要**: `SPREADSHEET_ID`を設定
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ここにスプレッドシートIDを設定
   ```
   手動でスプレッドシートを作成した場合は、そのIDを設定してください。
   自動作成を希望する場合は、`'YOUR_SPREADSHEET_ID'`のままにしておくと、初回実行時に自動的にスプレッドシートが作成されます。

#### ステップ3: Google Apps Scriptをデプロイ

1. 「デプロイ」→「新しいデプロイ」をクリック
2. 種類の選択で「ウェブアプリ」を選択
3. 設定:
   - **説明**: 「メール送信と履歴保存」
   - **次のユーザーとして実行**: 「自分」
   - **アクセスできるユーザー**: 「全員」
4. 「デプロイ」をクリック
5. 表示されたURLをコピー
6. `config.js`の`GOOGLE_APPS_SCRIPT_URL`に設定

#### ステップ4: 動作確認

1. 予約フォームまたはお問い合わせフォームから送信
2. Google Sheetsを開いて、履歴が保存されているか確認
3. 管理者ページ（`html/admin/email-history.html`）で履歴が表示されるか確認

### データ形式

Google Sheetsには以下の列でデータが保存されます：

| 列名 | 説明 |
|------|------|
| タイムスタンプ | 送信日時（ISO形式） |
| 種類 | 「無料体験予約」または「お問い合わせ」 |
| お名前 | お子様のお名前（予約のみ） |
| 電話番号 | 電話番号 |
| メールアドレス | メールアドレス |
| 学校区別 | 学校区別（予約のみ） |
| 学年 | 学年（予約のみ） |
| 日付 | 予約希望日（予約のみ） |
| 時間 | 予約希望時間（予約のみ） |
| メッセージ | ご質問・ご要望またはお問い合わせ内容 |
| 件名 | メール件名 |

---

## Google Sheetsへのデータ保存確認方法

### 確認方法1: Google Apps Scriptの実行ログを確認

1. [Google Apps Script](https://script.google.com/)にアクセス
2. プロジェクト「iTeen予約フォーム」を開く
3. 左側のメニューから「実行数」をクリック
4. 最新の実行ログを確認

**成功時のログ例：**
```
✅ 管理者へのメール送信成功
✅ 自動応答メール送信成功: example@email.com
Google Sheetsに履歴を保存しました
```

**エラー時のログ例：**
```
❌ Google Sheetsへの保存エラー: [エラー内容]
```

### 確認方法2: Google Sheetsで直接確認

1. [Google Sheets](https://sheets.google.com)にアクセス
2. 「最近使用したファイル」から「iTeen 武庫之荘校 - メール送信履歴」を探す
3. 最新の予約データが保存されているか確認：
   - タイムスタンプが最新の日時になっているか
   - 「種類」列に「無料体験予約」と表示されているか
   - お名前、電話番号、メールアドレスなどの情報が正しく保存されているか

### 確認方法3: SPREADSHEET_IDの確認

1. Google Apps Scriptのエディタを開く
2. `saveToGoogleSheets`関数を確認（488行目付近）
3. `SPREADSHEET_ID`の設定状況を確認：
   - `'YOUR_SPREADSHEET_ID'`のまま → 初回実行時に自動的にスプレッドシートが作成されます
   - スプレッドシートIDが設定されている → そのIDのスプレッドシートに保存されます

### 確認方法4: テスト実行で確認

1. 関数選択ドロップダウンから「`testReservationForm`」を選択
2. 「実行」ボタンをクリック
3. 実行ログに以下のメッセージが表示されれば成功：
   ```
   ✅ 管理者へのメール送信成功
   Google Sheetsに履歴を保存しました
   ```

---

## Google Sheetsの権限設定手順

Google Sheetsのスコープが表示されていても、実際に権限が付与されていない場合があります。

### テスト関数を実行して権限を確認（推奨）

1. Google Apps Scriptのエディタを開く
2. 関数選択ドロップダウンから「`testGoogleSheetsPermission`」を選択
3. 「実行」ボタンをクリック
4. 「承認が必要です」という警告が表示されたら、「承認」をクリック
5. Googleアカウントを選択
6. 「詳細」→「iTee予約管理（安全ではないページ）に移動」をクリック
7. 「許可」をクリックしてGoogle Sheetsの権限を付与
8. 「表示」→「ログ」を開いて確認：
   ```
   ✅ Google Sheetsの権限が正しく付与されています！
   🔑 テスト用スプレッドシートID: XXXX...
   📄 テスト用スプレッドシートURL: https://docs.google.com/spreadsheets/d/XXXX.../edit
   ```

### よくあるエラーと解決方法

#### エラー1: 「Google Sheetsの権限が付与されていません」
- テスト関数実行時の承認画面で「許可」をクリック
- 再度テスト関数を実行

#### エラー2: 「スプレッドシートが見つかりません」
- 「プロジェクトの設定」（歯車アイコン）→「スクリプト プロパティ」を開く
- `GOOGLE_SHEETS_SPREADSHEET_ID`の値を確認
- スプレッドシートが存在するか確認

### 権限の再承認が必要な場合

1. コードに`SpreadsheetApp`を追加した場合
2. Googleアカウントの設定から権限を削除した場合
3. プロジェクトを再デプロイした場合

### OAuthスコープ確認チェックリスト

- [ ] OAuthスコープにGoogle Sheetsが表示されている（`https://www.googleapis.com/auth/spreadsheets`）
- [ ] テスト関数`testGoogleSheetsPermission`を実行
- [ ] 権限の承認が完了している
- [ ] テスト用スプレッドシートが作成される
- [ ] ログに「✅ Google Sheetsの権限が正しく付与されています！」が表示される

---

## Google Sheetsへのアクセス権限について

### 基本的な考え方

基本的には、Google Sheets側でアクセス権限を調整する必要はありません。ただし、既存のスプレッドシートを使用する場合（2回目以降）は、Google Apps Scriptを実行しているアカウントがそのスプレッドシートにアクセスできる必要があります。

### アクセス権限の確認が必要なケース

#### ケース1: 初回実行時（新規作成）

`SpreadsheetApp.create()`で新規作成する場合、作成したアカウント（iteen.mukonosou@gmail.com）が所有者になるため、アクセス権限の問題は発生しません。

#### ケース2: 既存のスプレッドシートを使用する場合（2回目以降）

Google Apps Scriptを実行しているアカウント（iteen.mukonosou@gmail.com）が、そのスプレッドシートにアクセスできる必要があります。

### アクセス権限エラーが発生する原因

1. **既存のスプレッドシートが別のアカウントで作成された**
2. **スプレッドシートが削除された**
3. **スプレッドシートの共有設定が変更された**

### 現在のコードの動作

アクセス権限エラーが発生した場合、コードは自動的に新しいスプレッドシートを作成します：

```javascript
} catch (openError) {
  // エラーの場合は新規作成
  spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
  properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
}
```

### 特定の既存スプレッドシートを使用したい場合

1. [Google Sheets](https://sheets.google.com)にアクセス
2. 使用したいスプレッドシートを開く
3. 右上の「共有」ボタンをクリック
4. 「ユーザーやグループを追加」に`iteen.mukonosou@gmail.com`を入力
5. 権限を「編集者」に設定して「送信」をクリック
6. Google Apps Scriptのエディタで「プロジェクトの設定」（歯車）をクリック
7. 「スクリプト プロパティ」セクションで`GOOGLE_SHEETS_SPREADSHEET_ID`を設定

---

## スプレッドシートIDの一元管理方法（PropertiesService使用）

### 問題点

現在、スプレッドシートIDが`config.js`と`google-apps-script-code.js`の2箇所で管理されており、二重管理になっています。Google Apps Scriptはサーバーサイドで実行されるため、クライアント側の`config.js`を直接読み込むことができません。

### 解決策：PropertiesServiceを使用

Google Apps Scriptの`PropertiesService`を使用することで、スプレッドシートIDをGoogle Apps Scriptの管理画面から直接設定でき、コードを変更する必要がなくなります。

### 設定手順

1. [Google Apps Script](https://script.google.com/)にアクセス
2. プロジェクト「iTeen予約フォーム」を開く
3. 左側のメニューから「プロジェクトの設定」（歯車アイコン）をクリック
4. 「スクリプト プロパティ」セクションまでスクロール
5. 「スクリプト プロパティを追加」をクリック
6. 以下のプロパティを追加：
   - **プロパティ**: `GOOGLE_SHEETS_SPREADSHEET_ID`
   - **値**: `1q4BfhBe_hd2U-qE_O6j0cUPVI6wPvgsNg0qFZCyl5Yc`（config.jsの値と同じ）
7. 「保存」をクリック

### メリット

1. **一元管理**: `config.js`の値とGoogle Apps Scriptのスクリプトプロパティを同期させるだけでOK
2. **コード変更不要**: スプレッドシートIDを変更する際、コードを編集する必要がない
3. **セキュリティ**: スクリプトプロパティは暗号化されて保存される
4. **簡単な更新**: Google Apps Scriptの管理画面から直接更新可能

### 注意事項

- `config.js`の値を変更した場合、Google Apps Scriptのスクリプトプロパティも同じ値に更新してください
- スクリプトプロパティの値を変更した場合、`config.js`も同じ値に更新してください

---

## Google Sheetsへの送信履歴自動保存設定

### 関数の追加

既存の`google-apps-script-code.js`に以下の関数を追加してください：

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

---

## Google Sheetsへの書き込み処理の詳細

### 処理の全体フロー

```
予約フォーム送信
  ↓
reserve.html: sendEmailWithGoogleAppsScript()
  ↓
Google Apps Script: doPost()
  ↓
Google Apps Script: handleReservationForm()
  ↓
Google Apps Script: saveToGoogleSheets('reservation', data)
  ↓
Google Sheetsにデータを書き込み
```

### saveToGoogleSheets関数の処理ステップ

#### ステップ1: スプレッドシートIDの取得

```javascript
const properties = PropertiesService.getScriptProperties();
let spreadsheetId = properties.getProperty('GOOGLE_SHEETS_SPREADSHEET_ID');
```

#### ステップ2: スプレッドシートの取得または作成

**初回実行時（IDが保存されていない）:**
```javascript
if (!spreadsheetId) {
  spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
  spreadsheetId = spreadsheet.getId();
  properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
}
```

**2回目以降（IDが保存されている）:**
```javascript
} else {
  spreadsheet = SpreadsheetApp.openById(spreadsheetId);
}
```

**エラー時（スプレッドシートを開けない場合）:**
```javascript
} catch (openError) {
  // 新規作成にフォールバック
  spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
  properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheet.getId());
}
```

#### ステップ3: シートの取得または作成

```javascript
const sheetName = 'EmailHistory';
let sheet = spreadsheet.getSheetByName(sheetName);
if (!sheet) {
  sheet = spreadsheet.insertSheet(sheetName);
  // ヘッダー行を追加（太字・グレー背景）
}
```

#### ステップ4: データの追加

**予約データの場合:**
```javascript
const rowData = [
  data.timestamp,        // タイムスタンプ
  '無料体験予約',        // 種類
  data.child_name || '', // お名前
  data.phone || '',      // 電話番号
  data.email || '',      // メールアドレス
  data.school_type || '', // 学校区別
  data.grade || '',      // 学年
  data.date || '',       // 日付
  data.time || '',       // 時間
  data.message || '',    // メッセージ
  data.subject || ''     // 件名
];
sheet.appendRow(rowData);
```

### スプレッドシートの構造

| 列 | ヘッダー | 予約データ | お問い合わせデータ |
|---|---|---|---|
| A | タイムスタンプ | ISO形式の日時 | ISO形式の日時 |
| B | 種類 | 「無料体験予約」 | 「お問い合わせ」 |
| C | お名前 | お子様のお名前 | （空） |
| D | 電話番号 | 電話番号 | 電話番号 |
| E | メールアドレス | メールアドレス | メールアドレス |
| F | 学校区別 | 学校区別 | （空） |
| G | 学年 | 学年 | （空） |
| H | 日付 | 予約希望日 | （空） |
| I | 時間 | 予約希望時間 | （空） |
| J | メッセージ | ご質問・ご要望 | お問い合わせ内容 |
| K | 件名 | メール件名 | メール件名 |

---

## Google Drive APIの権限問題

`saveToGoogleSheets`関数がGoogle Apps Scriptから直接実行する分には動作するが、本番のホームページから実行されると動作しない場合の対処法です。

### 問題の原因

`saveToGoogleSheets`関数は以下の処理で`DriveApp`を使用しています：

1. **フォルダの取得/作成**: `getOrCreateFolder('pentech_info/manage_reserve')`
   - `DriveApp.getRootFolder()`でルートフォルダを取得
   - `DriveApp.getFoldersByName()`でフォルダを検索
   - `DriveApp.createFolder()`でフォルダを作成

2. **スプレッドシートの移動**: 作成したスプレッドシートを指定フォルダに移動

**`DriveApp`は`SpreadsheetApp`とは別の権限が必要です。**

### 解決方法

#### ステップ1: Google Drive APIの権限を確認

1. Google Apps Scriptのエディタを開く
2. 関数選択ドロップダウンから「`testGoogleDrivePermission`」を選択
3. 「実行」ボタンをクリック
4. 「承認が必要です」という警告が表示されたら、「承認」をクリック
5. 権限を付与
6. ログで以下が表示されることを確認：
   ```
   ✅ Google Drive APIの権限が正しく付与されています！
   🔑 ルートフォルダID: XXXX...
   ✅ フォルダの取得/作成も成功しました！
   ```

#### ステップ2: OAuthスコープを確認

「プロジェクトの設定」→「OAuthスコープ」で以下が表示されているか確認：
- `https://www.googleapis.com/auth/drive`（Google Drive API）
- `https://www.googleapis.com/auth/spreadsheets`（Google Sheets API）

#### ステップ3: 再デプロイ

権限を承認した後、再デプロイが必要な場合があります。

### エラーの種類と解決方法

#### エラー1: 「Google Drive APIの権限が不足しています」
- `testGoogleDrivePermission`関数を実行して権限を承認

#### エラー2: 「フォルダの取得/作成に失敗しました」
- ログでフォルダパスを確認
- `pentech_info/manage_reserve`が正しいか確認

#### エラー3: 「スプレッドシートの作成に失敗しました」
- `testGoogleSheetsPermission`関数を実行して権限を承認
- Google Driveの容量を確認

### 確認チェックリスト

- [ ] `testGoogleDrivePermission`関数を実行して権限を確認
- [ ] OAuthスコープに`https://www.googleapis.com/auth/drive`が表示されている
- [ ] OAuthスコープに`https://www.googleapis.com/auth/spreadsheets`が表示されている
- [ ] 本番環境で予約フォームを送信
- [ ] 実行ログで`📊 saveToGoogleSheets関数が呼び出されました`が表示される
- [ ] Google Driveで`pentech_info/manage_reserve`フォルダを確認
- [ ] スプレッドシートが作成されている

---

## Google Sheetsのトラブルシューティング

### 履歴が保存されない

1. Google Apps Scriptのログを確認（「実行」→「ログを表示」）
2. `SPREADSHEET_ID`が正しく設定されているか確認
3. Google Apps Scriptの権限が正しく設定されているか確認

### 履歴が取得できない

1. 管理者ページでブラウザのコンソールを確認
2. `config.js`の`GOOGLE_APPS_SCRIPT_URL`が正しく設定されているか確認
3. Google Apps Scriptの`doGet`関数が正しく実装されているか確認

### スプレッドシートが見つからない

1. Google Apps Scriptの実行ログで、作成されたスプレッドシートIDを確認
2. そのIDを`google-apps-script-code.js`の`SPREADSHEET_ID`に設定

### 注意事項

- **初回実行時**: `SPREADSHEET_ID`が`'YOUR_SPREADSHEET_ID'`のままの場合、自動的にスプレッドシートが作成されます。コンソールログに表示されるスプレッドシートIDを`google-apps-script-code.js`に設定してください。
- **権限**: Google Apps Scriptの実行には、Google Sheetsへのアクセス権限が必要です。初回実行時に権限の承認を求められます。
- **データ保持**: Google Sheetsに保存されたデータは、Googleアカウントが削除されない限り永続的に保持されます。
- **プライバシー**: スプレッドシートには個人情報が含まれます。適切なアクセス制御を行ってください。
