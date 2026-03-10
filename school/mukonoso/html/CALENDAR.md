# カレンダー 総合ガイド

このファイルは以下の内容を統合したものです：
- CALENDAR_IDENTIFICATION.md
- CALENDAR_MANUAL.md
- CALENDAR_USAGE.md
- GOOGLE_CALENDAR_SETUP.md

---

## GoogleカレンダーAPI連携の設定方法

### 概要

無料体験予約フォームで、Googleカレンダーの予約済み日時を自動的に非表示にする機能の設定方法です。

### セットアップ手順

#### ステップ1: Google Cloud Consoleでの設定

**プロジェクトの作成:**
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. プロジェクト名を入力（例: "iTeen予約システム"）

**Calendar APIの有効化:**
1. 左メニューから「APIとサービス」→「ライブラリ」を選択
2. "Calendar API"を検索
3. 「有効にする」をクリック

**API Keyの作成（公開カレンダーの場合）:**
1. 「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「APIキー」を選択
3. **重要**: APIキーの制限を設定
   - 「APIキーを制限」をクリック
   - 「アプリケーションの制限」で「HTTPリファラー（ウェブサイト）」を選択
   - 「ウェブサイトの制限」にあなたのドメインを追加（例: `https://yourdomain.com/*`）
   - 「APIの制限」で「Calendar API」のみを許可

**OAuth2.0認証の設定（プライベートカレンダーの場合）:**
1. 「認証情報を作成」→「OAuth クライアント ID」を選択
2. アプリケーションの種類: 「ウェブアプリケーション」
3. 承認済みのリダイレクト URIを設定
4. クライアントIDとクライアントシークレットを取得

#### ステップ2: Googleカレンダーの設定

**カレンダーIDの取得:**
1. [Googleカレンダー](https://calendar.google.com/)にアクセス
2. 左側のカレンダー一覧から、使用するカレンダーを選択
3. カレンダー名の横の「⋮」（三点リーダー）をクリック
4. 「設定と共有」を選択
5. 「カレンダーの統合」セクションで「カレンダーID」をコピー
   - 形式: `xxxxxxxxxxxx@group.calendar.google.com`

**カレンダーの公開設定（API Key使用時）:**
1. カレンダーの設定画面で「このカレンダーを一般公開する」にチェック
2. 「すべてのイベントの詳細を表示」を選択
3. 保存

#### ステップ3: コードの設定

**フロントエンドでの設定（reserve.html）:**

```javascript
// GOOGLE_CALENDAR_CONFIG を更新
const GOOGLE_CALENDAR_CONFIG = {
  calendarId: 'your-calendar-id@group.calendar.google.com', // 取得したカレンダーID
  apiKey: 'YOUR_API_KEY', // 取得したAPI Key
};
```

**関数の有効化:**
```javascript
// ページ読み込み時に実行
updateUnavailableTimes();

// または定期的に更新（5分ごと）
setInterval(updateUnavailableTimes, 5 * 60 * 1000);
```

### 現在の設定状況

**既に設定済み:**
- API Key: `AIzaSyCk05BaK1CeOJByKFI7ysVC5cdftqYWndw`
- カレンダーID: `16f6013dd3e06376074237fd9cf818e7287bb388ed28757e477058f90c97be52@group.calendar.google.com`
- 自動更新: ページ読み込み時に実行

---

## Googleカレンダーの予定識別方法

### 識別の流れ（3ステップ）

Googleカレンダーの予定を識別する処理は、以下の3つのステップで行われています。

#### ステップ1: GoogleカレンダーAPIからイベントを取得

**該当関数**: `fetchGoogleCalendarEvents()`

```javascript
async function fetchGoogleCalendarEvents(startDate, endDate) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_CONFIG.calendarId)}/events?` +
    `key=${GOOGLE_CALENDAR_CONFIG.apiKey}&` +
    `timeMin=${startDate.toISOString()}&` +
    `timeMax=${endDate.toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime`;

  const response = await fetch(url);
  const data = await response.json();
  return data.items || [];
}
```

**処理内容:**
- GoogleカレンダーAPIにリクエストを送信
- 指定された期間（現在から3ヶ月先まで）のイベントを取得

**取得されるデータの形式:**
```javascript
[
  {
    id: "event123",
    summary: "無料体験予約",
    start: {
      dateTime: "2025-01-20T14:00:00+09:00",
      timeZone: "Asia/Tokyo"
    },
    end: {
      dateTime: "2025-01-20T15:00:00+09:00",
      timeZone: "Asia/Tokyo"
    }
  }
]
```

#### ステップ2: イベントから予約済み時間を抽出

**該当関数**: `updateUnavailableTimes()` 内の処理

```javascript
events.forEach(event => {
  if (event.start && event.start.dateTime) {
    const eventDate = new Date(event.start.dateTime);
    const dateStr = formatDate(eventDate);
    const timeStr = formatTime(eventDate);

    // timeSlotsに含まれる時間帯のみを対象とする
    if (timeSlots.includes(timeStr)) {
      if (!unavailableTimes[dateStr]) {
        unavailableTimes[dateStr] = [];
      }

      // 同じ時間帯が既に登録されていない場合のみ追加
      if (!unavailableTimes[dateStr].includes(timeStr)) {
        unavailableTimes[dateStr].push(timeStr);
      }
    }
  }
});
```

**処理内容:**
1. 各イベントの開始時間を取得（`event.start.dateTime`）
2. 日付と時間に分割（`formatDate()`, `formatTime()`）
3. 予約可能な時間帯かチェック（10:00〜19:00の範囲）
4. `unavailableTimes`に登録：`{ "2025-01-20": ["14:00", "16:00"] }`

#### ステップ3: カレンダー上で予約済み時間帯を無効化

**該当関数**: `generateTimeOptions()`

```javascript
function generateTimeOptions(preferenceNum) {
  const selectedDate = document.getElementById(`preference-${preferenceNum}-date`).value;
  const unavailableForDate = unavailableTimes[selectedDate] || [];

  timeSlots.forEach(time => {
    const timeBtn = document.createElement('button');
    timeBtn.type = 'button';
    timeBtn.className = 'time-button';
    timeBtn.textContent = time;

    if (unavailableForDate.includes(time)) {
      timeBtn.classList.add('disabled');
    } else {
      timeBtn.addEventListener('click', () => selectTime(preferenceNum, time, timeBtn));
    }

    container.appendChild(timeBtn);
  });
}
```

**処理内容:**
- 予約済みの時間帯に`disabled`クラスを追加（グレーアウト、クリック不可）
- 予約可能な時間帯にクリックイベントを追加

### 識別のポイント

- **イベントの開始時間のみを使用**: 予約枠は1時間単位で管理されているため、開始時間のみで判定
- **timeSlotsに含まれる時間帯のみを対象**: 営業時間外のイベントは無視
- **日付と時間を分けて管理**: 効率的な検索・判定のため

### 実際の動作例

Googleカレンダーに以下のイベントがある場合：

1. 2025年1月20日 14:00〜15:00 「無料体験予約」
2. 2025年1月20日 16:00〜17:00 「無料体験予約」
3. 2025年1月21日 10:00〜11:00 「無料体験予約」

**処理の流れ:**
```javascript
// unavailableTimesに登録
unavailableTimes = {
  "2025-01-20": ["14:00", "16:00"],
  "2025-01-21": ["10:00"]
}
```
- 2025年1月20日を選択 → 14:00と16:00がグレーアウト
- 2025年1月21日を選択 → 10:00がグレーアウト

### コードの該当箇所まとめ

| 処理 | 関数名 | 行番号 |
|------|--------|--------|
| Googleカレンダーからイベント取得 | `fetchGoogleCalendarEvents()` | 614-657行 |
| 予約済み時間の抽出 | `updateUnavailableTimes()` | 686-730行 |
| 時間選択ボタンの生成 | `generateTimeOptions()` | 815-835行 |

---

## GoogleカレンダーAPIの使い方

### 基本的な動作

ページを開くと、**自動的に**Googleカレンダーから予約済みの日時を取得し、カレンダー上で無効化（グレーアウト）します。

### 動作確認方法

1. `reserve.html`をブラウザで開く
2. `F12`キーを押して開発者ツールを開く
3. 「コンソール」タブで以下のようなメッセージを確認：
   ```
   📅 Googleカレンダーから予約済み日時を取得中...
   ✅ 5件のイベントを取得しました
   📌 5件の予約済み時間帯を登録しました
   予約済み日時: { "2025-01-15": ["10:00", "14:00"], ... }
   ✅ カレンダーを更新しました
   ```

### 予約済み日時の表示方法

#### カレンダー上での表示
- **選択可能な日付**: 通常の白背景
- **選択不可な日付**: グレーアウト（過去の日付や予約済みの日付）
- **今日の日付**: オレンジの枠線

#### 時間選択での表示
- **選択可能な時間**: 通常の白背景ボタン
- **選択不可な時間**: グレーアウトボタン（クリック不可）

### 手動で更新する方法

ブラウザのコンソールで以下を実行：

```javascript
updateUnavailableTimes()
```

### 定期更新を有効にする（5分ごと）

`reserve.html`の以下の行のコメントを外してください：

```javascript
// 定期的に更新する場合（5分ごと）- 必要に応じてコメントを外す
setInterval(updateUnavailableTimes, 5 * 60 * 1000);
```

---

## Googleカレンダーへの予約枠追加方法

### 方法1: Googleカレンダーに手動で追加（簡単）

1. [Googleカレンダー](https://calendar.google.com/)にアクセス
2. 左側のカレンダー一覧から、使用しているカレンダーを選択
3. 日付をクリックしてイベントを作成
4. **タイトル**: 「無料体験予約」など
5. **日時**: 予約可能な日時を設定（例: 2025年1月20日 14:00〜15:00）
6. **保存**

**注意:**
- 開始時間が10:00〜19:00の範囲内であること
- 開始時間が正確に設定されていること

### 方法2: フォーム送信時に自動追加

フォーム送信時に、第一希望の日時が自動的にGoogleカレンダーに追加されるようになっています。

**現在の実装:**
- フォーム送信時に`addReservationToCalendar()`が実行されます
- ただし、**API Keyのみではイベント追加はできません**（OAuth2.0認証が必要）

### 方法3: サーバーサイドで実装（推奨）

**Node.js + Express の例:**

```javascript
// server.js
const express = require('express');
const { google } = require('googleapis');

const app = express();
app.use(express.json());

// OAuth2.0認証の設定
const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);

oauth2Client.setCredentials({
  refresh_token: 'YOUR_REFRESH_TOKEN'
});

// カレンダーにイベントを追加するエンドポイント
app.post('/api/add-calendar-event', async (req, res) => {
  try {
    const { date, time, summary, description } = req.body;

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = new Date(`${date}T${time}:00+09:00`);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);

    const event = {
      summary: summary || '無料体験予約',
      description: description || '',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'your-calendar-id@group.calendar.google.com',
      resource: event,
    });

    res.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to add event' });
  }
});

app.listen(3000);
```

### 予約枠の管理方法

#### 定期的な予約枠を設定する（繰り返しイベント）

1. イベントを作成
2. 「繰り返し」を選択
3. 繰り返しパターンを設定（例: 毎週月曜日 14:00〜15:00）
4. 保存

#### 特定の日を予約不可にする

Googleカレンダーに「予約不可」というイベントを作成：
1. 予約不可にしたい日付を選択
2. タイトル: 「予約不可」または「休校日」
3. 時間: 10:00〜19:00（すべての時間帯をカバー）
4. 保存

#### 営業時間を変更する

コード内の`timeSlots`配列を編集：

```javascript
// 例: 12:00〜13:00を休憩時間として除外
const timeSlots = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
```

---

## デバッグ方法

ブラウザのコンソール（F12）で以下を実行して確認：

```javascript
// 1. 取得したイベントを確認
fetchGoogleCalendarEvents(new Date(), new Date(Date.now() + 90*24*60*60*1000))
  .then(events => console.log('取得したイベント:', events));

// 2. 予約済み時間帯を確認
console.log('予約済み日時:', unavailableTimes);

// 3. 特定の日付の予約済み時間帯を確認
console.log('2025-01-20の予約済み:', unavailableTimes['2025-01-20']);
```

---

## セキュリティに関する注意事項

**API Keyをクライアント側（JavaScript）に直接記述するのはセキュリティリスクがあります。**

### 推奨される実装方法

#### 方法1: サーバーサイドプロキシ（推奨）

バックエンドサーバーでGoogleカレンダーAPIを呼び出し、フロントエンドに結果を返す方法：

```javascript
// server.js
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
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});
```

```javascript
// フロントエンド
async function fetchGoogleCalendarEvents(startDate, endDate) {
  const response = await fetch(`/api/calendar-events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
  const events = await response.json();
  return events;
}
```

#### 方法2: 環境変数の使用

API Keyを環境変数として管理し、ビルド時に注入。

---

## カレンダートラブルシューティング

### CORSエラーが出る

**解決方法:**
1. サーバーサイドプロキシを使用（推奨）
2. または、Google Cloud ConsoleでAPIキーのHTTPリファラー制限を設定

### API Keyエラー（"API key not valid"）

1. Google Cloud ConsoleでAPI Keyが正しく設定されているか確認
2. Calendar APIが有効になっているか確認
3. API Keyの制限設定を確認

### カレンダーが見つからない（"Calendar not found"）

1. カレンダーIDが正しいか確認
2. カレンダーが公開設定になっているか確認（API Key使用時）
   - Googleカレンダー → カレンダーの設定 → 「このカレンダーを一般公開する」にチェック

### 予約済み日時が反映されない

1. コンソールでエラーが出ていないか確認
2. `updateUnavailableTimes()`を手動実行して確認
3. カレンダーのイベントが正しい形式（dateTime形式）か確認
4. イベントの開始時間が10:00〜19:00の範囲内か確認

---

## 参考リンク

- [Google Calendar API ドキュメント](https://developers.google.com/calendar/api/v3/reference)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Calendar API クイックスタート](https://developers.google.com/calendar/api/quickstart/js)
