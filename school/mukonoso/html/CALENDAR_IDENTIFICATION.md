# Googleカレンダーの予定識別方法

## 識別の流れ

Googleカレンダーの予定を識別する処理は、以下の3つのステップで行われています。

## ステップ1: GoogleカレンダーAPIからイベントを取得

**該当コード**: `fetchGoogleCalendarEvents()` 関数

```614:657:school/mukonoso/html/reserve.html
async function fetchGoogleCalendarEvents(startDate, endDate) {
  try {
    // 方法1: API Keyを使用する場合（公開カレンダーのみ）
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_CONFIG.calendarId)}/events?` +
      `key=${GOOGLE_CALENDAR_CONFIG.apiKey}&` +
      `timeMin=${startDate.toISOString()}&` +
      `timeMax=${endDate.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('GoogleカレンダーAPI エラー:', data.error);
      return [];
    }
    
    return data.items || [];
```

**処理内容**:
- GoogleカレンダーAPIにリクエストを送信
- 指定された期間（現在から3ヶ月先まで）のイベントを取得
- イベントのリスト（`data.items`）を返す

**取得されるデータの形式**:
```javascript
[
  {
    id: "event123",
    summary: "無料体験予約",
    start: {
      dateTime: "2025-01-20T14:00:00+09:00",  // ← ここから日時を抽出
      timeZone: "Asia/Tokyo"
    },
    end: {
      dateTime: "2025-01-20T15:00:00+09:00",
      timeZone: "Asia/Tokyo"
    }
  },
  // ... 他のイベント
]
```

## ステップ2: イベントから予約済み時間を抽出

**該当コード**: `updateUnavailableTimes()` 関数内の処理

```703:723:school/mukonoso/html/reserve.html
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
        processedCount++;
        console.log(`  📌 ${dateStr} ${timeStr} を予約済みとして登録`);
      }
    }
  }
});
```

**処理内容**:
1. **各イベントをループ処理**
   - `events.forEach(event => { ... })`

2. **イベントの開始時間を取得**
   - `event.start.dateTime` から日時を取得
   - 例: `"2025-01-20T14:00:00+09:00"`

3. **日付と時間に分割**
   - `formatDate(eventDate)` → `"2025-01-20"`
   - `formatTime(eventDate)` → `"14:00"`

4. **予約可能な時間帯かチェック**
   - `timeSlots.includes(timeStr)` で、10:00～19:00の範囲内か確認

5. **unavailableTimesに登録**
   - 形式: `{ "2025-01-20": ["14:00", "16:00"] }`
   - 同じ時間帯が重複しないようにチェック

## ステップ3: カレンダー上で予約済み時間帯を無効化

**該当コード**: `generateTimeOptions()` 関数

```815:835:school/mukonoso/html/reserve.html
function generateTimeOptions(preferenceNum) {
  const container = document.getElementById(`time-options-${preferenceNum}`);
  container.innerHTML = '';
  
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

**処理内容**:
1. **選択された日付を取得**
   - `selectedDate` = `"2025-01-20"`

2. **その日付の予約済み時間帯を取得**
   - `unavailableForDate` = `["14:00", "16:00"]` または `[]`

3. **各時間帯のボタンを生成**
   - 10:00、11:00、12:00... のボタンを作成

4. **予約済みかどうかを判定**
   - `if (unavailableForDate.includes(time))`
   - 予約済みの場合: `disabled`クラスを追加（グレーアウト、クリック不可）
   - 予約可能な場合: クリックイベントを追加

## 識別のポイント

### 1. イベントの開始時間のみを使用

```javascript
event.start.dateTime  // ← 開始時間のみを使用
```

**理由**: 
- 予約枠は1時間単位で管理
- 開始時間が予約済みかどうかを判定すれば十分

### 2. timeSlotsに含まれる時間帯のみを対象

```javascript
if (timeSlots.includes(timeStr)) {
  // 10:00～19:00の範囲内のみ
}
```

**理由**:
- 営業時間外のイベントは無視
- 予約可能な時間帯のみを管理

### 3. 日付と時間を分けて管理

```javascript
unavailableTimes = {
  "2025-01-20": ["14:00", "16:00"],  // 日付をキー、時間の配列を値
  "2025-01-21": ["10:00", "15:00"]
}
```

**理由**:
- 日付ごとに予約済み時間帯を管理
- 効率的に検索・判定可能

## 実際の動作例

### 例: Googleカレンダーに以下のイベントがある場合

1. **2025年1月20日 14:00～15:00** 「無料体験予約」
2. **2025年1月20日 16:00～17:00** 「無料体験予約」
3. **2025年1月21日 10:00～11:00** 「無料体験予約」

### 処理の流れ

1. **APIから取得**
   ```javascript
   events = [
     { start: { dateTime: "2025-01-20T14:00:00+09:00" } },
     { start: { dateTime: "2025-01-20T16:00:00+09:00" } },
     { start: { dateTime: "2025-01-21T10:00:00+09:00" } }
   ]
   ```

2. **unavailableTimesに登録**
   ```javascript
   unavailableTimes = {
     "2025-01-20": ["14:00", "16:00"],
     "2025-01-21": ["10:00"]
   }
   ```

3. **カレンダー上で表示**
   - 2025年1月20日を選択 → 14:00と16:00がグレーアウト
   - 2025年1月21日を選択 → 10:00がグレーアウト

## コードの該当箇所まとめ

| 処理 | 関数名 | 行番号 |
|------|--------|--------|
| Googleカレンダーからイベント取得 | `fetchGoogleCalendarEvents()` | 614-657行 |
| 予約済み時間の抽出 | `updateUnavailableTimes()` | 686-730行 |
| 時間選択ボタンの生成 | `generateTimeOptions()` | 815-835行 |
| 日付フォーマット | `formatDate()` | 842行付近 |
| 時間フォーマット | `formatTime()` | 823-827行 |

## デバッグ方法

ブラウザのコンソール（F12）で以下を実行して確認:

```javascript
// 1. 取得したイベントを確認
fetchGoogleCalendarEvents(new Date(), new Date(Date.now() + 90*24*60*60*1000))
  .then(events => console.log('取得したイベント:', events));

// 2. 予約済み時間帯を確認
console.log('予約済み日時:', unavailableTimes);

// 3. 特定の日付の予約済み時間帯を確認
console.log('2025-01-20の予約済み:', unavailableTimes['2025-01-20']);
```

