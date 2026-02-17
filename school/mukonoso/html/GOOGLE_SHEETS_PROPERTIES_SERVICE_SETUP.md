# Google Sheets IDの一元管理方法（PropertiesService使用）

## 問題点

現在、スプレッドシートIDが`config.js`と`google-apps-script-code.js`の2箇所で管理されており、二重管理になっています。

これは、Google Apps Scriptがサーバーサイドで実行されるため、クライアント側の`config.js`を直接読み込むことができないためです。

## 解決策：PropertiesServiceを使用

Google Apps Scriptの`PropertiesService`を使用することで、スプレッドシートIDをGoogle Apps Scriptの管理画面から直接設定でき、コードを変更する必要がなくなります。

## 設定手順

### ステップ1: Google Apps Scriptでスクリプトプロパティを設定

1. [Google Apps Script](https://script.google.com/)にアクセス
2. プロジェクト「iTeen予約フォーム」を開く
3. 左側のメニューから「**プロジェクトの設定**」（⚙️アイコン）をクリック
4. 「スクリプト プロパティ」セクションまでスクロール
5. 「スクリプト プロパティを追加」をクリック
6. 以下のプロパティを追加：
   - **プロパティ**: `GOOGLE_SHEETS_SPREADSHEET_ID`
   - **値**: `1q4BfhBe_hd2U-qE_O6j0cUPVI6wPvgsNg0qFZCyl5Yc`（config.jsの値と同じ）
7. 「保存」をクリック

### ステップ2: コードを更新

`google-apps-script-code.js`の`saveToGoogleSheets`関数と`getEmailHistoryFromSheets`関数を、PropertiesServiceから値を取得するように変更します。

## メリット

1. **一元管理**: `config.js`の値とGoogle Apps Scriptのスクリプトプロパティを同期させるだけでOK
2. **コード変更不要**: スプレッドシートIDを変更する際、コードを編集する必要がない
3. **セキュリティ**: スクリプトプロパティは暗号化されて保存される
4. **簡単な更新**: Google Apps Scriptの管理画面から直接更新可能

## 注意事項

- `config.js`の値を変更した場合、Google Apps Scriptのスクリプトプロパティも同じ値に更新してください
- または、スクリプトプロパティの値を変更した場合、`config.js`も同じ値に更新してください

