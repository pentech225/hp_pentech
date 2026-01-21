# GoogleカレンダーAPI連携の設定方法

## 概要
無料体験予約フォームで、Googleカレンダーの予約済み日時を自動的に非表示にする機能の設定方法です。

## セットアップ手順

### 1. Google Cloud Consoleでの設定

#### 1.1 プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. プロジェクト名を入力（例: "iTeen予約システム"）

#### 1.2 Calendar APIの有効化
1. 左メニューから「APIとサービス」→「ライブラリ」を選択
2. "Calendar API"を検索
3. 「有効にする」をクリック

#### 1.3 API Keyの作成（公開カレンダーの場合）
1. 「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「APIキー」を選択
3. APIキーが作成されます
4. **重要**: APIキーの制限を設定
   - 「APIキーを制限」をクリック
   - 「アプリケーションの制限」で「HTTPリファラー（ウェブサイト）」を選択
   - 「ウェブサイトの制限」にあなたのドメインを追加（例: `https://yourdomain.com/*`）
   - 「APIの制限」で「Calendar API」のみを許可

#### 1.4 OAuth2.0認証の設定（プライベートカレンダーの場合）
1. 「認証情報を作成」→「OAuth クライアント ID」を選択
2. アプリケーションの種類: 「ウェブアプリケーション」
3. 承認済みのリダイレクト URIを設定
4. クライアントIDとクライアントシークレットを取得

### 2. Googleカレンダーの設定

#### 2.1 カレンダーIDの取得
1. [Googleカレンダー](https://calendar.google.com/)にアクセス
2. 左側のカレンダー一覧から、使用するカレンダーを選択
3. カレンダー名の横の「⋮」（三点リーダー）をクリック
4. 「設定と共有」を選択
5. 「カレンダーの統合」セクションで「カレンダーID」をコピー
   - 形式: `xxxxxxxxxxxx@group.calendar.google.com`

#### 2.2 カレン）
1. カレンダーの設定画面で「このカレンダーを一般公開するダーの公開設定（API Key使用時」にチェック
2. 「すべてのイベントの詳細を表示」を選択
3. 保存

### 3. コードの設定

#### 3.1 フロントエンドでの設定（reserve.html）

```javascript
// GOOGLE_CALENDAR_CONFIG を更新
const GOOGLE_CALENDAR_CONFIG = {
  calendarId: 'your-calendar-id@group.calendar.google.com', // 取得したカレンダーID
  apiKey: 'YOUR_API_KEY', // 取得したAPI Key
};
```

#### 3.2 関数の有効化

`reserve.html`の以下の行のコメントを外して有効化：

```javascript
// ページ読み込み時に実行
updateUnavailableTimes();

// または定期的に更新（5分ごと）
setInterval(updateUnavailableTimes, 5 * 60 * 1000);
```

## セキュリティに関する注意事項

⚠️ **重要**: API Keyをクライアント側（JavaScript）に直接記述するのはセキュリティリスクがあります。

### 推奨される実装方法

#### 方法1: サーバーサイドプロキシ（推奨）
バックエンドサーバーでGoogleカレンダーAPIを呼び出し、フロントエンドに結果を返す方法。

**例: Node.js + Express**

```javascript
// server.js
const express = require('express');
const { google } = require('googleapis');

const app = express();

app.get('/api/calendar-events', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: YOUR_API_KEY });
    const response = await calendar.events.list({
      calendarId: 'your-calendar-id@group.calendar.google.com',
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    res.json(response.data.items || []);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

app.listen(3000);
```

**フロントエンド側の変更**

```javascript
async function fetchGoogleCalendarEvents(startDate, endDate) {
  try {
    const response = await fetch(`/api/calendar-events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
    const events = await response.json();
    return events;
  } catch (error) {
    console.error('カレンダーイベント取得エラー:', error);
    return [];
  }
}
```

#### 方法2: 環境変数の使用
API Keyを環境変数として管理し、ビルド時に注入。

## 動作確認

1. ブラウザの開発者ツール（F12）を開く
2. コンソールタブを確認
3. `updateUnavailableTimes()`を実行
4. エラーがないか確認
5. カレンダー上で予約済みの日時が非表示になっているか確認

## トラブルシューティング

### エラー: "API key not valid"
- API Keyが正しく設定されているか確認
- API Keyの制限設定を確認
- Calendar APIが有効になっているか確認

### エラー: "Calendar not found"
- カレンダーIDが正しいか確認
- カレンダーが公開設定になっているか確認（API Key使用時）

### エラー: CORSエラー
- サーバーサイドプロキシを使用することを推奨
- または、Google Cloud Consoleでリファラー制限を確認

### 予約済み時間が反映されない
- `updateUnavailableTimes()`が実行されているか確認
- ブラウザのコンソールでエラーを確認
- カレンダーのイベントが正しい形式（dateTime形式）か確認

## 参考リンク

- [Google Calendar API ドキュメント](https://developers.google.com/calendar/api/v3/reference)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Calendar API クイックスタート](https://developers.google.com/calendar/api/quickstart/js)

