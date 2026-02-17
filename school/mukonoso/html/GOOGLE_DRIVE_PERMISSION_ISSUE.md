# Google Drive APIの権限問題

`saveToGoogleSheets`関数がGoogle Apps Scriptから直接実行する分には動作するが、本番のホームページから実行されると動作しない場合の対処法を説明します。

---

## 🔍 問題の原因

### 原因1: Google Drive APIの権限が不足している

`saveToGoogleSheets`関数は、以下の処理で`DriveApp`を使用しています：

1. **フォルダの取得/作成**: `getOrCreateFolder('pentech_info/manage_reserve')`
   - `DriveApp.getRootFolder()`でルートフォルダを取得
   - `DriveApp.getFoldersByName()`でフォルダを検索
   - `DriveApp.createFolder()`でフォルダを作成

2. **スプレッドシートの移動**: 作成したスプレッドシートを指定フォルダに移動
   - `DriveApp.getFileById()`でファイルを取得
   - `DriveApp.removeFile()`で現在の親フォルダから削除
   - `DriveApp.addFile()`で指定フォルダに追加

**`DriveApp`は`SpreadsheetApp`とは別の権限が必要です。**

### 原因2: 権限が承認されていない

Google Apps Scriptから直接実行する場合：
- 実行時に「承認が必要です」という警告が表示される
- 権限を承認すると、そのセッション中は動作する

本番のホームページから実行する場合：
- デプロイされたWebアプリとして実行される
- 初回実行時に権限を承認する必要がある
- 権限が承認されていない場合、エラーが発生する

---

## ✅ 解決方法

### ステップ1: Google Drive APIの権限を確認

1. **Google Apps Scriptのエディタを開く**
   - https://script.google.com/ にアクセス
   - プロジェクト「iTee予約管理」を開く

2. **テスト関数を選択**
   - エディタ上部の関数選択ドロップダウンから「`testGoogleDrivePermission`」を選択

3. **実行ボタンをクリック**
   - 上部の「実行」ボタン（▶️）をクリック

4. **権限の承認**
   - 「承認が必要です」という警告が表示されたら、「承認」をクリック
   - Googleアカウントを選択
   - 「詳細」→「iTee予約管理（安全ではないページ）に移動」をクリック
   - 「許可」をクリックしてGoogle Drive APIの権限を付与

5. **結果を確認**
   - 「表示」→「ログ」を開く
   - 以下のようなログが表示されれば成功：
     ```
     ✅ Google Drive APIの権限が正しく付与されています！
     🔑 ルートフォルダID: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
     ✅ フォルダの取得/作成も成功しました！
     🔑 テストフォルダID: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
     ```

### ステップ2: OAuthスコープを確認

1. **プロジェクトの設定を開く**
   - 左側のメニューから「プロジェクトの設定」（⚙️アイコン）をクリック

2. **OAuthスコープを確認**
   - 「OAuthスコープ」セクションを確認
   - 以下のスコープが表示されているか確認：
     - `https://www.googleapis.com/auth/drive`（Google Drive API）
     - `https://www.googleapis.com/auth/spreadsheets`（Google Sheets API）

3. **スコープが表示されていない場合**
   - テスト関数`testGoogleDrivePermission`を実行
   - 権限を承認すると、自動的にスコープが追加されます

### ステップ3: 再デプロイ

権限を承認した後、再デプロイが必要な場合があります：

1. **デプロイを確認**
   - 「デプロイ」→「管理デプロイ」を開く
   - 最新のバージョンがデプロイされているか確認

2. **再デプロイ（必要に応じて）**
   - 歯車アイコン（⚙️）をクリック
   - 「新しいバージョン」を選択
   - 「デプロイ」をクリック

### ステップ4: 本番環境でテスト

1. **予約フォームを送信**
   - 本番のホームページから予約フォームを送信

2. **実行ログを確認**
   - Google Apps Scriptの「実行数」画面で最新の実行をクリック
   - ログを確認：
     - `📊 saveToGoogleSheets関数が呼び出されました`が表示されているか
     - `📁 フォルダを取得または作成します: pentech_info/manage_reserve`が表示されているか
     - エラーメッセージが表示されていないか

3. **スプレッドシートを確認**
   - Google Driveで`pentech_info/manage_reserve`フォルダを確認
   - 「iTeen 武庫之荘校 - メール送信履歴」というスプレッドシートが作成されているか確認

---

## ❌ エラーが発生する場合

### エラー1: 「Google Drive APIの権限が不足しています」

**原因:**
- `DriveApp`の権限が付与されていない

**解決方法:**
1. `testGoogleDrivePermission`関数を実行
2. 「承認が必要です」という警告が表示されたら、権限を承認
3. 再度本番環境でテスト

### エラー2: 「フォルダの取得/作成に失敗しました」

**原因:**
- フォルダパスが間違っている
- フォルダ名に使用できない文字が含まれている

**解決方法:**
1. ログでフォルダパスを確認
2. `pentech_info/manage_reserve`が正しいか確認
3. フォルダ名に特殊文字が含まれていないか確認

### エラー3: 「スプレッドシートの作成に失敗しました」

**原因:**
- `SpreadsheetApp`の権限が不足している
- Google Driveの容量が不足している

**解決方法:**
1. `testGoogleSheetsPermission`関数を実行
2. 権限を承認
3. Google Driveの容量を確認

---

## 📋 確認チェックリスト

`saveToGoogleSheets`関数が本番環境で動作するか確認するためのチェックリスト：

- [ ] `testGoogleDrivePermission`関数を実行して権限を確認
- [ ] OAuthスコープに`https://www.googleapis.com/auth/drive`が表示されている
- [ ] OAuthスコープに`https://www.googleapis.com/auth/spreadsheets`が表示されている
- [ ] 本番環境で予約フォームを送信
- [ ] 実行ログで`📊 saveToGoogleSheets関数が呼び出されました`が表示される
- [ ] 実行ログで`📁 フォルダを取得または作成します`が表示される
- [ ] 実行ログでエラーメッセージが表示されない
- [ ] Google Driveで`pentech_info/manage_reserve`フォルダを確認
- [ ] スプレッドシートが作成されている
- [ ] スプレッドシートにデータが書き込まれている

---

## 💡 よくある質問

### Q1: なぜGoogle Apps Scriptから直接実行する分には動作するのか？

**A:** Google Apps Scriptから直接実行する場合、実行時に「承認が必要です」という警告が表示され、その場で権限を承認できます。しかし、本番環境から実行する場合、デプロイされたWebアプリとして実行されるため、事前に権限を承認しておく必要があります。

### Q2: 権限を承認したのに、まだエラーが発生する

**A:** 以下の点を確認してください：

1. **正しいGoogleアカウントでログインしているか**
   - `iteen.mukonosou@gmail.com`でログインしているか確認

2. **デプロイが正しく行われているか**
   - 「デプロイ」→「管理デプロイ」で最新のバージョンがデプロイされているか確認

3. **実行ログを確認**
   - 「実行数」画面で最新の実行をクリック
   - エラーメッセージを確認

### Q3: スプレッドシートは作成されるが、指定フォルダに移動されない

**A:** `DriveApp`の権限が不足している可能性があります。`testGoogleDrivePermission`関数を実行して、権限を確認してください。

---

## 🔗 関連ドキュメント

- [Google Sheetsの権限設定手順](./GOOGLE_SHEETS_PERMISSION_SETUP.md)
- [Google Apps Scriptのログ確認方法](./GOOGLE_APPS_SCRIPT_LOG_CHECK.md)
- [スプレッドシートへの書き込み処理の詳細](./GOOGLE_SHEETS_WRITE_PROCESS.md)

---

## 📸 次のステップ

1. **`testGoogleDrivePermission`関数を実行**
   - Google Apps Scriptのエディタで`testGoogleDrivePermission`関数を選択
   - 「実行」ボタンをクリック
   - 権限を承認

2. **実行ログを確認**
   - 「表示」→「ログ」を開く
   - 「✅ Google Drive APIの権限が正しく付与されています！」が表示されるか確認

3. **本番環境でテスト**
   - 予約フォームを送信
   - 実行ログを確認
   - スプレッドシートが作成されているか確認

