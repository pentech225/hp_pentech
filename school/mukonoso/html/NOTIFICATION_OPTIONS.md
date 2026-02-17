# 予約情報追加時の通知方法 - 候補一覧

予約情報がGoogle Sheetsに追加された際に通知を受け取る方法の候補です。

## 📧 1. メール通知（推奨：最も簡単）

### メリット
- ✅ **実装が最も簡単** - 既にGmailAppが使える
- ✅ **追加設定不要** - Google Apps Scriptの標準機能
- ✅ **無料**
- ✅ **確実に届く** - メールボックスに保存される
- ✅ **履歴が残る** - 過去の通知を確認できる

### デメリット
- ⚠️ リアルタイム性が低い（メールチェックが必要）
- ⚠️ スマホの通知設定に依存

### 実装方法
```javascript
// saveToGoogleSheets関数の成功後に追加
GmailApp.sendEmail(
  'iteen.mukonosou@gmail.com',
  '【新規予約】無料体験予約のお申し込み',
  `新しい予約が追加されました。

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
予約希望日時: ${dateDisplay} ${timeDisplay}
${message ? `ご質問・ご要望:\n${message}` : ''}

Google Sheetsで確認: [スプレッドシートURL]`
);
```

### 実装難易度
⭐☆☆☆☆（非常に簡単）

---

## 📱 2. LINE通知（推奨：日本で人気）

### メリット
- ✅ **リアルタイム通知** - スマホに即座に届く
- ✅ **無料**
- ✅ **設定が簡単** - LINE Notify APIを使用
- ✅ **グループ通知可能** - 複数人に同時通知
- ✅ **日本で広く使われている**

### デメリット
- ⚠️ LINE Notifyのトークン取得が必要
- ⚠️ LINEアプリが必要

### 実装方法
1. [LINE Notify](https://notify-bot.line.me/)でトークンを取得
2. Google Apps ScriptでWebhookにPOSTリクエスト

```javascript
function sendLineNotification(message) {
  const LINE_NOTIFY_TOKEN = 'YOUR_LINE_NOTIFY_TOKEN'; // PropertiesServiceに保存推奨
  const url = 'https://notify-api.line.me/api/notify';
  
  const options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Bearer ' + LINE_NOTIFY_TOKEN
    },
    'payload': {
      'message': message
    }
  };
  
  UrlFetchApp.fetch(url, options);
}
```

### 実装難易度
⭐⭐☆☆☆（簡単）

---

## 💬 3. Slack通知

### メリット
- ✅ **リアルタイム通知**
- ✅ **無料プランあり**
- ✅ **チャンネルに投稿可能** - チームで共有
- ✅ **リッチなメッセージ形式** - ボタンやリンクなど

### デメリット
- ⚠️ Slackアカウントとワークスペースが必要
- ⚠️ Webhook URLの設定が必要

### 実装方法
1. SlackワークスペースでIncoming Webhookを設定
2. Google Apps ScriptでWebhookにPOSTリクエスト

```javascript
function sendSlackNotification(message) {
  const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL'; // PropertiesServiceに保存推奨
  
  const payload = {
    'text': message,
    'username': '予約通知Bot',
    'icon_emoji': ':bell:'
  };
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
}
```

### 実装難易度
⭐⭐☆☆☆（簡単）

---

## 💬 4. Google Chat通知

### メリット
- ✅ **Google Workspaceと統合**
- ✅ **無料**（Google Workspaceアカウントが必要）
- ✅ **リアルタイム通知**
- ✅ **Googleアカウントで完結**

### デメリット
- ⚠️ Google Workspaceアカウントが必要
- ⚠️ Webhook URLの設定が必要

### 実装方法
1. Google ChatでWebhook URLを取得
2. Google Apps ScriptでWebhookにPOSTリクエスト

```javascript
function sendGoogleChatNotification(message) {
  const GOOGLE_CHAT_WEBHOOK_URL = 'YOUR_GOOGLE_CHAT_WEBHOOK_URL';
  
  const payload = {
    'text': message
  };
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_URL, options);
}
```

### 実装難易度
⭐⭐☆☆☆（簡単）

---

## 🎮 5. Discord通知

### メリット
- ✅ **リアルタイム通知**
- ✅ **無料**
- ✅ **リッチなメッセージ形式**

### デメリット
- ⚠️ Discordアカウントとサーバーが必要
- ⚠️ Webhook URLの設定が必要

### 実装方法
1. DiscordサーバーでWebhookを作成
2. Google Apps ScriptでWebhookにPOSTリクエスト

```javascript
function sendDiscordNotification(message) {
  const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL';
  
  const payload = {
    'content': message,
    'username': '予約通知Bot'
  };
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
}
```

### 実装難易度
⭐⭐☆☆☆（簡単）

---

## 📞 6. SMS通知（Twilio）

### メリット
- ✅ **確実に届く** - 電話番号に直接送信
- ✅ **リアルタイム通知**

### デメリット
- ❌ **有料** - 1通あたり数円〜数十円
- ⚠️ Twilioアカウントの設定が必要
- ⚠️ 実装がやや複雑

### 実装難易度
⭐⭐⭐☆☆（中程度）

---

## 📊 比較表

| 方法 | 難易度 | コスト | リアルタイム性 | 設定の簡単さ |
|------|--------|--------|----------------|--------------|
| **メール通知** | ⭐☆☆☆☆ | 無料 | 低 | ⭐⭐⭐⭐⭐ |
| **LINE通知** | ⭐⭐☆☆☆ | 無料 | 高 | ⭐⭐⭐⭐☆ |
| **Slack通知** | ⭐⭐☆☆☆ | 無料 | 高 | ⭐⭐⭐☆☆ |
| **Google Chat** | ⭐⭐☆☆☆ | 無料* | 高 | ⭐⭐⭐☆☆ |
| **Discord通知** | ⭐⭐☆☆☆ | 無料 | 高 | ⭐⭐⭐☆☆ |
| **SMS通知** | ⭐⭐⭐☆☆ | 有料 | 高 | ⭐⭐☆☆☆ |

*Google Workspaceアカウントが必要

---

## 🎯 推奨順位

### 1位：メール通知
- **理由**: 実装が最も簡単で、確実に届く
- **用途**: 基本的な通知として最適

### 2位：LINE通知
- **理由**: 日本で広く使われており、リアルタイム性が高い
- **用途**: スマホで即座に通知を受けたい場合

### 3位：Slack通知
- **理由**: チームで共有したい場合に最適
- **用途**: 複数人で予約を管理する場合

---

## 💡 複数方法の併用も可能

複数の通知方法を組み合わせることも可能です。例えば：
- **メール通知** + **LINE通知** = 確実性とリアルタイム性の両立
- **メール通知** + **Slack通知** = 個人通知とチーム共有の両立

---

## 📝 実装時の注意点

1. **トークンやURLの管理**
   - `PropertiesService`を使用して機密情報を保存
   - コードに直接書かない

2. **エラーハンドリング**
   - 通知送信に失敗しても、データ保存は成功させる
   - 通知エラーはログに記録

3. **通知頻度の制限**
   - 短時間に大量の通知が来ないように制限を設ける（必要に応じて）

4. **通知内容の最適化**
   - 重要な情報だけを含める
   - 長すぎるメッセージは避ける

---

## 🚀 次のステップ

どの通知方法を実装しますか？
1. メール通知（最も簡単）
2. LINE通知（リアルタイム）
3. その他の方法

選択後、実装コードを提供します。

