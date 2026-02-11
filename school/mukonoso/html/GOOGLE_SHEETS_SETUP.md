# Google Sheetsへの履歴保存設定ガイド

メール送信履歴をGoogle Sheetsに自動保存することで、ブラウザのデータをクリアしても履歴が残るようになります。

## 設定手順

### 1. Google Sheetsでスプレッドシートを作成（オプション）

Google Apps Scriptが自動的にスプレッドシートを作成しますが、手動で作成することもできます。

1. [Google Sheets](https://sheets.google.com)にアクセス
2. 新しいスプレッドシートを作成
3. スプレッドシート名を「iTeen 武庫之荘校 - メール送信履歴」に変更（任意）
4. スプレッドシートのURLからIDを取得
   - 例: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - `SPREADSHEET_ID`の部分がIDです

### 2. Google Apps Scriptのコードを更新

1. [Google Apps Script](https://script.google.com)にアクセス
2. 既存のプロジェクトを開く（または新規作成）
3. `google-apps-script-code.js`の内容をコピー＆ペースト
4. **重要**: `SPREADSHEET_ID`を設定
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ここにスプレッドシートIDを設定
   ```
   
   手動でスプレッドシートを作成した場合は、そのIDを設定してください。
   自動作成を希望する場合は、`'YOUR_SPREADSHEET_ID'`のままにしておくと、初回実行時に自動的にスプレッドシートが作成されます。

### 3. Google Apps Scriptをデプロイ

1. 「デプロイ」→「新しいデプロイ」をクリック
2. 種類の選択で「ウェブアプリ」を選択
3. 設定:
   - **説明**: 「メール送信と履歴保存」
   - **次のユーザーとして実行**: 「自分」
   - **アクセスできるユーザー**: 「全員」
4. 「デプロイ」をクリック
5. 表示されたURLをコピー
6. `config.js`の`GOOGLE_APPS_SCRIPT_URL`に設定

### 4. 動作確認

1. 予約フォームまたはお問い合わせフォームから送信
2. Google Sheetsを開いて、履歴が保存されているか確認
3. 管理者ページ（`html/admin/email-history.html`）で履歴が表示されるか確認

## データ形式

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

## 注意事項

- **初回実行時**: `SPREADSHEET_ID`が`'YOUR_SPREADSHEET_ID'`のままの場合、自動的にスプレッドシートが作成されます。コンソールログに表示されるスプレッドシートIDを`google-apps-script-code.js`に設定してください。
- **権限**: Google Apps Scriptの実行には、Google Sheetsへのアクセス権限が必要です。初回実行時に権限の承認を求められます。
- **データ保持**: Google Sheetsに保存されたデータは、Googleアカウントが削除されない限り永続的に保持されます。
- **プライバシー**: スプレッドシートには個人情報が含まれます。適切なアクセス制御を行ってください。

## トラブルシューティング

### 履歴が保存されない

1. Google Apps Scriptのログを確認（「実行」→「ログを表示」）
2. `SPREADSHEET_ID`が正しく設定されているか確認
3. Google Apps Scriptの権限が正しく設定されているか確認

### 履歴が取得できない

1. 管理者ページでブラウザのコンソールを確認
2. `config.js`の`GOOGLE_APPS_SCRIPT_URL`が正しく設定されているか確認
3. Google Apps Scriptの`doGet`関数が正しく実装されているか確認

