# Google Sheetsへの書き込み処理の詳細説明

## 処理の全体フロー

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

---

## 1. 呼び出し元（reserve.html）

### 場所: `reserve.html` の `handleReservationForm` 関数内

```javascript
// Google Sheetsに履歴を保存
Logger.log('📊 Google Sheetsへの保存を開始します...');
console.log('📊 Google Sheetsへの保存を開始します...');
try {
  const sheetData = {
    timestamp: new Date().toISOString(),
    child_name: childName,
    phone: phone,
    email: email,
    school_type: schoolType,
    grade: grade,
    date: dateDisplay,
    time: timeDisplay,
    message: message,
    subject: subject
  };
  Logger.log('📋 保存するデータ: ' + JSON.stringify(sheetData));
  console.log('📋 保存するデータ:', sheetData);
  const result = saveToGoogleSheets('reservation', sheetData);
  Logger.log('✅ Google Sheetsに履歴を保存しました。結果: ' + result);
  console.log('✅ Google Sheetsに履歴を保存しました。結果:', result);
} catch (sheetError) {
  Logger.log('❌ Google Sheetsへの保存エラー: ' + sheetError.toString());
  Logger.log('❌ エラースタック: ' + sheetError.stack);
  console.error('❌ Google Sheetsへの保存エラー:', sheetError);
  // エラーは記録するが続行（メール送信とカレンダー追加は成功している）
}
```

**処理内容:**
- 予約データを`sheetData`オブジェクトにまとめる
- `saveToGoogleSheets('reservation', sheetData)`を呼び出す
- エラーが発生しても処理は続行（メール送信とカレンダー追加は成功しているため）

---

## 2. メイン処理（saveToGoogleSheets関数）

### 場所: `google-apps-script-code.js` の `saveToGoogleSheets` 関数

### ステップ1: 関数の開始とログ出力

```javascript
function saveToGoogleSheets(type, data) {
  try {
    Logger.log('📊 saveToGoogleSheets関数が呼び出されました');
    Logger.log('📊 タイプ: ' + type);
    Logger.log('📊 データ: ' + JSON.stringify(data));
    console.log('📊 saveToGoogleSheets関数が呼び出されました:', { type, data });
```

**処理内容:**
- 関数が呼び出されたことをログに記録
- `type`: 'reservation'（予約）または 'contact'（お問い合わせ）
- `data`: 保存するデータオブジェクト

---

### ステップ2: スプレッドシートIDの取得

```javascript
    // スクリプトプロパティからスプレッドシートIDを取得
    const properties = PropertiesService.getScriptProperties();
    let spreadsheetId = properties.getProperty('GOOGLE_SHEETS_SPREADSHEET_ID');
```

**処理内容:**
- `PropertiesService.getScriptProperties()`でスクリプトプロパティを取得
- `GOOGLE_SHEETS_SPREADSHEET_ID`というキーでスプレッドシートIDを取得
- 初回実行時は`null`が返される

---

### ステップ3: スプレッドシートの取得または作成

#### ケースA: 初回実行時（スプレッドシートIDが保存されていない）

```javascript
    if (!spreadsheetId) {
      Logger.log('📝 初回実行のため、新しいスプレッドシートを作成します...');
      console.log('📝 初回実行のため、新しいスプレッドシートを作成します...');
      
      try {
        spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
        spreadsheetId = spreadsheet.getId();
        const spreadsheetUrl = spreadsheet.getUrl();
        
        // スクリプトプロパティにスプレッドシートIDを保存
        properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
        
        Logger.log('✅ 新規スプレッドシートを作成しました');
        Logger.log('🔑 スプレッドシートID: ' + spreadsheetId);
        Logger.log('📄 スプレッドシートURL: ' + spreadsheetUrl);
```

**処理内容:**
1. `SpreadsheetApp.create()`で新しいスプレッドシートを作成
2. スプレッドシート名: 「iTeen 武庫之荘校 - メール送信履歴」
3. スプレッドシートIDを取得
4. スクリプトプロパティにIDを保存（次回以降はこのIDを使用）

#### ケースB: 2回目以降（スプレッドシートIDが保存されている）

```javascript
    } else {
      // 既存のスプレッドシートを開く
      Logger.log('📂 既存のスプレッドシートを開こうとしています...');
      Logger.log('🔑 スプレッドシートID: ' + spreadsheetId);
      console.log('📂 既存のスプレッドシートを開こうとしています...');
      console.log('🔑 スプレッドシートID:', spreadsheetId);
      
      try {
        spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        Logger.log('✅ 既存のスプレッドシートを開きました: ' + spreadsheet.getName());
        Logger.log('📄 スプレッドシートURL: ' + spreadsheet.getUrl());
```

**処理内容:**
1. `SpreadsheetApp.openById()`で既存のスプレッドシートを開く
2. 成功した場合は、そのスプレッドシートを使用

#### ケースC: スプレッドシートを開けない場合（エラー時）

```javascript
      } catch (openError) {
        Logger.log('❌ スプレッドシートを開くエラー: ' + openError.toString());
        // ... エラーログ出力 ...
        
        // エラーの場合は新規作成
        Logger.log('📝 エラーのため、新しいスプレッドシートを作成します...');
        
        try {
          spreadsheet = SpreadsheetApp.create('iTeen 武庫之荘校 - メール送信履歴');
          spreadsheetId = spreadsheet.getId();
          const spreadsheetUrl = spreadsheet.getUrl();
          
          // スクリプトプロパティに新しいスプレッドシートIDを保存
          properties.setProperty('GOOGLE_SHEETS_SPREADSHEET_ID', spreadsheetId);
```

**処理内容:**
1. 既存のスプレッドシートを開けない場合（アクセス権限エラーなど）
2. 新しいスプレッドシートを作成
3. 新しいスプレッドシートIDをスクリプトプロパティに保存

---

### ステップ4: シート（ワークシート）の取得または作成

```javascript
    // シート名
    const sheetName = 'EmailHistory';
    Logger.log('📑 シート名: ' + sheetName);
    console.log('📑 シート名:', sheetName);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // シートが存在しない場合は作成
    if (!sheet) {
      Logger.log('📝 シートが存在しないため、新規作成します');
      console.log('📝 シートが存在しないため、新規作成します');
      sheet = spreadsheet.insertSheet(sheetName);
```

**処理内容:**
1. シート名「EmailHistory」を指定
2. `getSheetByName()`で既存のシートを検索
3. 存在しない場合は`insertSheet()`で新規作成

---

### ステップ5: ヘッダー行の追加（初回のみ）

```javascript
      // ヘッダー行を追加
      const headerRow = [
        'タイムスタンプ',
        '種類',
        'お名前',
        '電話番号',
        'メールアドレス',
        '学校区別',
        '学年',
        '日付',
        '時間',
        'メッセージ',
        '件名'
      ];
      sheet.appendRow(headerRow);
      Logger.log('✅ ヘッダー行を追加しました: ' + JSON.stringify(headerRow));
      
      // ヘッダー行を太字にする
      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E0E0E0');
      Logger.log('✅ ヘッダー行の書式を設定しました');
```

**処理内容:**
1. 11列のヘッダー行を定義
2. `appendRow()`で1行目にヘッダーを追加
3. ヘッダー行を太字に設定
4. ヘッダー行の背景色をグレー（#E0E0E0）に設定

---

### ステップ6: データの追加

#### 予約データ（type === 'reservation'）の場合

```javascript
    if (type === 'reservation') {
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
      Logger.log('📋 追加するデータ（予約）: ' + JSON.stringify(rowData));
      console.log('📋 追加するデータ（予約）:', rowData);
      sheet.appendRow(rowData);
      Logger.log('✅ データを追加しました（予約）');
      console.log('✅ データを追加しました（予約）');
    }
```

**処理内容:**
1. 11列のデータを配列として準備
2. `appendRow()`でシートの最後の行に追加
3. データが存在しない場合は空文字列（''）を使用

#### お問い合わせデータ（type === 'contact'）の場合

```javascript
    } else if (type === 'contact') {
      const rowData = [
        data.timestamp,        // タイムスタンプ
        'お問い合わせ',        // 種類
        '',                    // お名前（お問い合わせにはなし）
        data.phone || '',      // 電話番号
        data.email || '',      // メールアドレス
        '',                    // 学校区別（お問い合わせにはなし）
        '',                    // 学年（お問い合わせにはなし）
        '',                    // 日付（お問い合わせにはなし）
        '',                    // 時間（お問い合わせにはなし）
        data.message || '',    // メッセージ
        data.subject || ''     // 件名
      ];
      sheet.appendRow(rowData);
      Logger.log('✅ データを追加しました（お問い合わせ）');
    }
```

**処理内容:**
- 予約データと同様だが、予約固有の項目（お名前、学校区別、学年、日付、時間）は空文字列

---

### ステップ7: データ追加の確認

```javascript
    // データが正しく追加されたか確認
    const lastRow = sheet.getLastRow();
    Logger.log('📊 シートの最終行: ' + lastRow);
    console.log('📊 シートの最終行:', lastRow);
    if (lastRow > 0) {
      const lastRowData = sheet.getRange(lastRow, 1, 1, 11).getValues()[0];
      Logger.log('📋 最終行のデータ: ' + JSON.stringify(lastRowData));
      console.log('📋 最終行のデータ:', lastRowData);
    }
    
    Logger.log('✅ Google Sheetsに履歴を保存しました: タイプ=' + type + ', タイムスタンプ=' + data.timestamp);
    console.log('✅ Google Sheetsに履歴を保存しました:', { type, timestamp: data.timestamp });
    return true;
```

**処理内容:**
1. `getLastRow()`でシートの最終行番号を取得
2. 最終行のデータを取得してログに出力
3. 成功メッセージをログに出力
4. `true`を返して成功を通知

---

### ステップ8: エラーハンドリング

```javascript
  } catch (error) {
    Logger.log('❌ Google Sheetsへの保存エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ Google Sheetsへの保存エラー:', error);
    console.error('❌ エラー詳細:', {
      message: error.toString(),
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}
```

**処理内容:**
- エラーが発生した場合、詳細なエラーログを出力
- エラーを再スロー（呼び出し元で処理）

---

## 3. データの保存形式

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

## 4. 重要なポイント

### スプレッドシートIDの管理

- **初回実行時**: 新しいスプレッドシートを作成し、IDをスクリプトプロパティに保存
- **2回目以降**: スクリプトプロパティからIDを取得して既存のスプレッドシートを開く
- **エラー時**: 既存のスプレッドシートを開けない場合、新しいスプレッドシートを作成

### エラーハンドリング

- スプレッドシートの作成に失敗した場合: エラーをスロー
- 既存のスプレッドシートを開けない場合: 新しいスプレッドシートを作成
- データの追加に失敗した場合: エラーをスロー（呼び出し元で処理）

### ログ出力

- `Logger.log()`: Google Apps Scriptの実行ログに出力（「表示」→「ログ」で確認）
- `console.log()`: ブラウザのコンソールに出力（ただし、サーバー側なので表示されない）

---

## 5. 現在の状態

### 正常に動作している場合

1. 初回実行時: 新しいスプレッドシート「iTeen 武庫之荘校 - メール送信履歴」が作成される
2. 「EmailHistory」シートが作成される
3. ヘッダー行が追加される
4. データが追加される
5. 2回目以降: 同じスプレッドシートにデータが追加される

### 問題が発生している可能性がある場合

1. **スプレッドシートが作成されない**
   - `SpreadsheetApp.create()`が失敗している可能性
   - Google Apps Scriptの権限が不足している可能性

2. **データが追加されない**
   - `sheet.appendRow()`が失敗している可能性
   - シートが正しく取得できていない可能性

3. **アクセス権限エラー**
   - 既存のスプレッドシートにアクセスできない場合、新しいスプレッドシートが作成される

---

## 6. 確認方法

### Google Apps Scriptのログを確認

1. Google Apps Scriptのエディタで「表示」→「ログ」をクリック
2. 以下のログメッセージを確認：
   - `📊 saveToGoogleSheets関数が呼び出されました`
   - `✅ 新規スプレッドシートを作成しました` または `✅ 既存のスプレッドシートを開きました`
   - `✅ データを追加しました（予約）`
   - `✅ Google Sheetsに履歴を保存しました`

### Google Sheetsで直接確認

1. [Google Sheets](https://sheets.google.com)にアクセス
2. 「iTeen 武庫之荘校 - メール送信履歴」というスプレッドシートを探す
3. 「EmailHistory」シートを開く
4. データが追加されているか確認

---

## 7. トラブルシューティング

### データが保存されない場合

1. **Google Apps Scriptのログを確認**
   - エラーメッセージがあるか確認
   - `❌ Google Sheetsへの保存エラー:` が表示されていないか確認

2. **スプレッドシートIDを確認**
   - スクリプトプロパティに`GOOGLE_SHEETS_SPREADSHEET_ID`が保存されているか確認
   - そのIDのスプレッドシートが存在するか確認

3. **権限を確認**
   - Google Apps ScriptがGoogle Sheetsにアクセスできる権限があるか確認
   - 初回実行時に権限を承認したか確認

### スプレッドシートが作成されない場合

1. **Google Apps Scriptの権限を確認**
   - 「プロジェクトの設定」→「OAuth スコープ」で`https://www.googleapis.com/auth/spreadsheets`が含まれているか確認

2. **エラーログを確認**
   - `❌ スプレッドシート作成エラー:` が表示されていないか確認

