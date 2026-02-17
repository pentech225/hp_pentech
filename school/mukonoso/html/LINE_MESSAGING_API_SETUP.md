# LINE Messaging API 設定手順

LINE Notifyの代替手段として、LINE Messaging APIを使用する設定手順です。

## 📋 前提条件

- LINEアカウントを持っていること
- LINE公式アカウントを作成できること（無料）
- Google Apps Scriptのエディタにアクセスできること

---

## 🔑 ステップ1: LINE Developersコンソールでチャネルを作成

1. **LINE Developersコンソールにアクセス**
   - [LINE Developers](https://developers.line.biz/ja/) にアクセス
   - LINEアカウントでログイン

2. **プロバイダーを作成**
   - 「プロバイダーを作成」をクリック
   - プロバイダー名を入力（例：「iTeen予約通知」）
   - 「作成」をクリック

3. **Messaging APIチャネルを作成**
   - 作成したプロバイダーを選択
   - 「チャネルを作成」をクリック
   - 「Messaging API」を選択
   - チャネル情報を入力：
     - **チャネル名**: 「iTeen予約通知」など
     - **チャネル説明**: 任意
     - **大業種**: 「教育」など
     - **小業種**: 適切なものを選択
     - **メールアドレス**: 通知を受け取るメールアドレス
   - 利用規約に同意して「作成」をクリック

---

## 🔑 ステップ2: チャネルアクセストークンを取得

1. **チャネル設定を開く**
   - 作成したチャネルを選択
   - 「Messaging API」タブを開く

2. **チャネルアクセストークンを取得**
   - 「チャネルアクセストークン」セクションまでスクロール
   - 「発行」をクリック
   - 表示されたトークンをコピー（**このトークンは一度しか表示されません**）
   - 例: `AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

3. **チャネルシークレットを確認**
   - 「基本設定」タブを開く
   - 「チャネルシークレット」をコピー（後で使用します）

---

## 🔑 ステップ3: Webhook URLを設定（オプション）

**注意**: 予約通知を送信するだけの場合は、Webhook URLの設定は不要です。

Webhook URLは、LINEからメッセージを受信する場合に必要です。今回は送信のみなので、設定は不要です。

---

## 🔑 ステップ4: ユーザーIDを取得（通知先の設定）

LINE Messaging APIでは、通知を送信する先のユーザーIDが必要です。

### 方法1: 友だち追加してユーザーIDを取得

1. **QRコードを取得**
   - チャネル設定の「Messaging API」タブを開く
   - 「QRコード」を表示
   - QRコードをスキャンして友だち追加

2. **Webhookイベントを有効化**
   - 「Webhookの利用」を「利用する」に設定
   - 「検証」をクリックして成功を確認

3. **Webhookイベントを受信する関数を作成**
   - Google Apps ScriptにWebhook受信関数を追加（後述）

4. **メッセージを送信してユーザーIDを取得**
   - 友だち追加したLINEアカウントにメッセージを送信
   - WebhookイベントからユーザーIDを取得

### 方法2: プッシュメッセージ用のユーザーIDを取得（推奨）

1. **友だち追加**
   - チャネル設定の「Messaging API」タブからQRコードを取得
   - QRコードをスキャンして友だち追加

2. **ユーザーIDを取得**
   - 友だち追加後、以下のAPIを呼び出してユーザーIDを取得：
   ```javascript
   function getLineUserId() {
     const channelAccessToken = 'YOUR_CHANNEL_ACCESS_TOKEN';
     const url = 'https://api.line.me/v2/bot/followers/ids';
     
     const options = {
       'method': 'get',
       'headers': {
         'Authorization': 'Bearer ' + channelAccessToken
       }
     };
     
     const response = UrlFetchApp.fetch(url, options);
     const data = JSON.parse(response.getContentText());
     Logger.log('ユーザーID: ' + data.userIds[0]);
     return data.userIds[0];
   }
   ```

---

## ⚙️ ステップ5: Google Apps ScriptにトークンとユーザーIDを設定

### 方法1: スクリプトプロパティから設定（推奨）

1. **Google Apps Scriptのエディタを開く**
   - [Google Apps Script](https://script.google.com/) にアクセス
   - プロジェクトを開く

2. **スクリプトプロパティを開く**
   - 左側のメニューから「プロジェクトの設定」（⚙️アイコン）をクリック
   - 「スクリプト プロパティ」セクションまでスクロール

3. **プロパティを追加**
   - 「スクリプト プロパティを追加」をクリック
   - **プロパティ**: `LINE_CHANNEL_ACCESS_TOKEN`
   - **値**: 取得したチャネルアクセストークン
   - 「保存」をクリック
   
   - 再度「スクリプト プロパティを追加」をクリック
   - **プロパティ**: `LINE_USER_ID`
   - **値**: 取得したユーザーID
   - 「保存」をクリック

### 方法2: 関数を使用して設定

1. **Google Apps Scriptのエディタで、以下の関数を追加**：
   ```javascript
   function setLineMessagingAPICredentials() {
     const properties = PropertiesService.getScriptProperties();
     
     // チャネルアクセストークン
     const channelAccessToken = 'YOUR_CHANNEL_ACCESS_TOKEN_HERE';
     
     // ユーザーID（通知先）
     const userId = 'YOUR_USER_ID_HERE';
     
     if (channelAccessToken === 'YOUR_CHANNEL_ACCESS_TOKEN_HERE' || 
         userId === 'YOUR_USER_ID_HERE') {
       Logger.log('⚠️ トークンとユーザーIDを設定してください');
       return false;
     }
     
     properties.setProperty('LINE_CHANNEL_ACCESS_TOKEN', channelAccessToken);
     properties.setProperty('LINE_USER_ID', userId);
     
     Logger.log('✅ LINE Messaging APIの認証情報を設定しました');
     return true;
   }
   ```

2. **実際の値に置き換えて実行**
   - `YOUR_CHANNEL_ACCESS_TOKEN_HERE` を実際のチャネルアクセストークンに置き換え
   - `YOUR_USER_ID_HERE` を実際のユーザーIDに置き換え
   - 関数を実行

---

## 🔧 ステップ6: LINE Messaging API送信関数を追加

Google Apps Scriptに以下の関数を追加します：

```javascript
// LINE Messaging APIで通知を送信する関数
function sendLineMessagingAPI(message) {
  try {
    Logger.log('📱 LINE Messaging APIで通知を送信開始');
    console.log('📱 LINE Messaging APIで通知を送信開始');
    
    // スクリプトプロパティから認証情報を取得
    const properties = PropertiesService.getScriptProperties();
    const channelAccessToken = properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
    const userId = properties.getProperty('LINE_USER_ID');
    
    if (!channelAccessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKENが設定されていません');
    }
    
    if (!userId) {
      throw new Error('LINE_USER_IDが設定されていません');
    }
    
    // LINE Messaging APIのエンドポイント
    const url = 'https://api.line.me/v2/bot/message/push';
    
    // リクエストボディ
    const payload = {
      'to': userId,
      'messages': [
        {
          'type': 'text',
          'text': message
        }
      ]
    };
    
    // リクエストオプション
    const options = {
      'method': 'post',
      'headers': {
        'Authorization': 'Bearer ' + channelAccessToken,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload)
    };
    
    Logger.log('📱 LINE Messaging APIにリクエストを送信します...');
    console.log('📱 LINE Messaging APIにリクエストを送信します...');
    
    // LINE Messaging APIにリクエストを送信
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('📱 LINE Messaging APIレスポンスコード: ' + responseCode);
    Logger.log('📱 LINE Messaging APIレスポンス: ' + responseText);
    console.log('📱 LINE Messaging APIレスポンスコード:', responseCode);
    console.log('📱 LINE Messaging APIレスポンス:', responseText);
    
    if (responseCode === 200) {
      Logger.log('✅ LINE Messaging APIで通知を送信しました');
      console.log('✅ LINE Messaging APIで通知を送信しました');
      return true;
    } else {
      Logger.log('❌ LINE Messaging APIの送信に失敗しました。レスポンスコード: ' + responseCode);
      Logger.log('❌ レスポンス: ' + responseText);
      console.error('❌ LINE Messaging APIの送信に失敗しました。レスポンスコード:', responseCode);
      console.error('❌ レスポンス:', responseText);
      throw new Error('LINE Messaging APIの送信に失敗しました。レスポンスコード: ' + responseCode + ', レスポンス: ' + responseText);
    }
  } catch (error) {
    Logger.log('❌ LINE Messaging API送信エラー: ' + error.toString());
    Logger.log('❌ エラーメッセージ: ' + error.message);
    Logger.log('❌ エラースタック: ' + error.stack);
    console.error('❌ LINE Messaging API送信エラー:', error);
    throw error;
  }
}
```

---

## 🔄 ステップ7: コードを更新してLINE Messaging APIを使用

`handleReservationForm`関数内のLINE通知部分を、LINE Messaging APIを使用するように変更します：

```javascript
// LINE Messaging APIで通知を送信（保存成功後）
try {
  Logger.log('📱 LINE通知を送信します...');
  console.log('📱 LINE通知を送信します...');
  
  const lineMessage = `🔔 新しい予約が追加されました

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
予約希望日時: ${dateDisplay} ${timeDisplay}${message ? `\n\nご質問・ご要望:\n${message}` : ''}`;
  
  sendLineMessagingAPI(lineMessage);
  
  Logger.log('✅ LINE通知を送信しました');
  console.log('✅ LINE通知を送信しました');
} catch (lineError) {
  Logger.log('⚠️ LINE通知の送信に失敗しました: ' + lineError.toString());
  console.warn('⚠️ LINE通知の送信に失敗しました:', lineError);
  // LINE通知のエラーは記録するが続行（データ保存は成功している）
}
```

---

## 🧪 ステップ8: 動作確認

1. **テスト関数を作成**
   ```javascript
   function testLineMessagingAPI() {
     sendLineMessagingAPI('🧪 テスト通知です。\n\nLINE Messaging APIが正常に動作しています！');
   }
   ```

2. **関数を実行**
   - 関数名を選択（`testLineMessagingAPI`）
   - 「実行」ボタンをクリック

3. **LINEで通知を確認**
   - LINEアプリを開く
   - 通知が届いているか確認

---

## 💰 料金について

LINE Messaging APIは、**月500通まで無料**です。

- **無料枠**: 月500通まで
- **超過分**: 1通あたり0.1円（税込）

詳細は [LINE Messaging API 料金](https://developers.line.biz/ja/docs/messaging-api/pricing/) を参照してください。

---

## 🔒 セキュリティに関する注意

- **チャネルアクセストークンは機密情報です**
  - コードに直接書かない（`PropertiesService`を使用）
  - 他人に共有しない
  - 定期的に再発行することを推奨

- **チャネルシークレットも機密情報です**
  - Webhook検証などで使用する場合は、同様に管理してください

---

## 📚 参考リンク

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [LINE Messaging API 料金](https://developers.line.biz/ja/docs/messaging-api/pricing/)
- [LINE Developers コンソール](https://developers.line.biz/console/)

---

## 🎉 完了

これで、LINE Messaging APIを使用して通知を受け取ることができます！

LINE Notifyが終了した後も、LINE Messaging APIで継続的にLINE通知を受け取ることができます。

