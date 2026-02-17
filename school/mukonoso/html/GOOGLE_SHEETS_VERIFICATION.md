# Google Sheetsへのデータ保存確認方法

無料体験予約のデータがGoogle Sheetsに正しく保存されているか確認する手順です。

## 確認方法1: Google Apps Scriptの実行ログを確認

### ステップ1: 実行ログを開く

1. [Google Apps Script](https://script.google.com/)にアクセス
2. プロジェクト「iTeen予約フォーム」を開く
3. 左側のメニューから「**実行数**」をクリック
4. 最新の実行ログを確認

### ステップ2: ログメッセージを確認

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

### ステップ3: スプレッドシートIDの確認

初回実行時にスプレッドシートが自動作成された場合、ログに以下のようなメッセージが表示されます：

```
新規スプレッドシートを作成しました: [スプレッドシートID]
スプレッドシートURL: https://docs.google.com/spreadsheets/d/[スプレッドシートID]/edit
⚠️ このスプレッドシートIDをgoogle-apps-script-code.jsのSPREADSHEET_IDに設定してください: [スプレッドシートID]
```

このスプレッドシートIDをコピーして、`google-apps-script-code.js`の494行目に設定してください。

---

## 確認方法2: Google Sheetsで直接確認

### ステップ1: Google Sheetsを開く

1. [Google Sheets](https://sheets.google.com)にアクセス
2. 左側のメニューから「最近使用したファイル」を確認
3. 「iTeen 武庫之荘校 - メール送信履歴」というスプレッドシートを探す

### ステップ2: データを確認

スプレッドシートを開いて、以下の列が表示されているか確認：

| タイムスタンプ | 種類 | お名前 | 電話番号 | メールアドレス | 学校区別 | 学年 | 日付 | 時間 | メッセージ | 件名 |
|--------------|------|--------|---------|--------------|---------|------|------|------|-----------|------|

### ステップ3: 最新のデータを確認

最新の予約データが保存されているか確認：
- タイムスタンプが最新の日時になっているか
- 「種類」列に「無料体験予約」と表示されているか
- お名前、電話番号、メールアドレスなどの情報が正しく保存されているか

---

## 確認方法3: スプレッドシートIDが設定されているか確認

### ステップ1: Google Apps Scriptのコードを確認

1. [Google Apps Script](https://script.google.com/)にアクセス
2. プロジェクト「iTeen予約フォーム」を開く
3. エディタで`saveToGoogleSheets`関数を確認（488行目付近）

### ステップ2: SPREADSHEET_IDを確認

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ← これが設定されているか確認
```

**問題がある場合：**
- `'YOUR_SPREADSHEET_ID'`のまま → 初回実行時に自動的にスプレッドシートが作成されます
- スプレッドシートIDが設定されている → そのIDのスプレッドシートに保存されます

### ステップ3: スプレッドシートIDを設定（必要な場合）

1. Google Sheetsでスプレッドシートを開く
2. URLからIDを取得：
   - 例: `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit`
   - `1a2b3c4d5e6f7g8h9i0j`の部分がスプレッドシートID
3. Google Apps Scriptのコードを更新：
   ```javascript
   const SPREADSHEET_ID = '1a2b3c4d5e6f7g8h9i0j'; // 実際のIDに置き換え
   ```
4. 「保存」ボタンをクリック
5. 「デプロイ」→「管理デプロイ」→「新しいバージョンを保存」をクリック

---

## 確認方法4: テスト実行で確認

### ステップ1: テスト関数を実行

1. Google Apps Scriptのエディタで、関数選択ドロップダウンから「`testReservationForm`」を選択
2. 「実行」ボタン（▶️）をクリック
3. 実行ログを確認

### ステップ2: 結果を確認

実行ログに以下のメッセージが表示されれば成功：
```
✅ 管理者へのメール送信成功
Google Sheetsに履歴を保存しました
```

### ステップ3: Google Sheetsで確認

Google Sheetsを開いて、テストデータが保存されているか確認してください。

---

## よくある問題と解決方法

### 問題1: 「Google Sheetsへの保存エラー」が表示される

**原因：**
- Google Sheetsへのアクセス権限がない
- スプレッドシートIDが間違っている
- スプレッドシートが削除された

**解決方法：**
1. Google Apps Scriptの実行ログでエラー詳細を確認
2. スプレッドシートIDが正しいか確認
3. Google Apps ScriptにGoogle Sheetsへのアクセス権限があるか確認

### 問題2: スプレッドシートが見つからない

**原因：**
- スプレッドシートが自動作成されたが、IDが設定されていない
- スプレッドシートが別のアカウントで作成された

**解決方法：**
1. Google Apps Scriptの実行ログで、作成されたスプレッドシートIDを確認
2. そのIDを`google-apps-script-code.js`の`SPREADSHEET_ID`に設定
3. Google SheetsでそのIDのスプレッドシートを開いて確認

### 問題3: データが保存されない

**原因：**
- `saveToGoogleSheets`関数が呼び出されていない
- エラーが発生しているが、処理が続行されている

**解決方法：**
1. Google Apps Scriptの実行ログで、`saveToGoogleSheets`が呼び出されているか確認
2. エラーメッセージを確認
3. `handleReservationForm`関数の436-454行目で、`saveToGoogleSheets`が呼び出されているか確認

---

## データ保存の流れ

1. **予約フォームから送信** → `reserve.html`の`submitReservation`関数
2. **Google Apps Scriptに送信** → `sendEmailWithGoogleAppsScript`関数
3. **Google Apps Scriptで処理** → `doPost`関数 → `handleReservationForm`関数
4. **Google Sheetsに保存** → `saveToGoogleSheets`関数（436-454行目）

各ステップでエラーが発生していないか、実行ログで確認してください。

