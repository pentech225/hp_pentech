# LINE通知の設定手順

予約情報が追加された際にLINE通知を受け取るための設定手順です。

## 📋 前提条件

- LINEアカウントを持っていること
- Google Apps Scriptのエディタにアクセスできること

---

## 🔑 ステップ1: LINE Notifyトークンの取得

1. **LINE Notifyにアクセス**
   - [LINE Notify](https://notify-bot.line.me/) にアクセス
   - LINEアカウントでログイン

2. **トークンを発行**
   - 右上の「マイページ」をクリック
   - 「トークンを発行する」をクリック
   - トークン名を入力（例：「iTeen予約通知」）
   - 通知を送信するトークルームまたはグループを選択
     - **個人に通知**: 「1-on-1でLINE Notifyから通知を受け取る」を選択
     - **グループに通知**: 既存のグループを選択、または新規グループを作成
   - 「発行する」をクリック

3. **トークンをコピー**
   - 表示されたトークンをコピー（**このトークンは一度しか表示されません**）
   - 例: `AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

---

## ⚙️ ステップ2: Google Apps Scriptにトークンを設定

### 方法1: `setLineNotifyToken`関数を使用（推奨）

1. **Google Apps Scriptのエディタを開く**
   - [Google Apps Script](https://script.google.com/) にアクセス
   - プロジェクトを開く

2. **`setLineNotifyToken`関数を編集**
   - `google-apps-script-code.js`ファイルを開く
   - `setLineNotifyToken`関数を探す（ファイルの最後の方）
   - 以下の行を編集：
   ```javascript
   const token = 'YOUR_LINE_NOTIFY_TOKEN_HERE';
   ```
   - 実際のトークンに置き換える：
   ```javascript
   const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'; // 実際のトークン
   ```

3. **関数を実行**
   - 関数名を選択（`setLineNotifyToken`）
   - 「実行」ボタンをクリック
   - 「承認が必要です」と表示されたら「承認」をクリック
   - Googleアカウントを選択
   - 「詳細」→「（安全ではないページ）に移動」をクリック
   - 「許可」をクリック

4. **実行結果を確認**
   - 実行ログに「✅ LINE Notifyトークンを設定しました」と表示されれば成功

### 方法2: スクリプトプロパティから直接設定

1. **Google Apps Scriptのエディタを開く**
   - [Google Apps Script](https://script.google.com/) にアクセス
   - プロジェクトを開く

2. **スクリプトプロパティを開く**
   - 左側のメニューから「プロジェクトの設定」（⚙️アイコン）をクリック
   - 「スクリプト プロパティ」セクションまでスクロール

3. **プロパティを追加**
   - 「スクリプト プロパティを追加」をクリック
   - **プロパティ**: `LINE_NOTIFY_TOKEN`
   - **値**: 取得したLINE Notifyトークン
   - 「保存」をクリック

---

## 🧪 ステップ3: 動作確認

### テスト方法1: テスト関数を作成して実行

1. **Google Apps Scriptのエディタで、以下の関数を追加**：
   ```javascript
   function testLineNotification() {
     sendLineNotification('🧪 テスト通知です。\n\nLINE通知が正常に動作しています！');
   }
   ```

2. **関数を実行**
   - 関数名を選択（`testLineNotification`）
   - 「実行」ボタンをクリック

3. **LINEで通知を確認**
   - LINEアプリを開く
   - 通知が届いているか確認

### テスト方法2: 実際の予約フォームから送信

1. **予約フォームを開く**
   - 本番環境の予約フォームにアクセス

2. **テスト予約を送信**
   - 適当な情報を入力して送信

3. **LINEで通知を確認**
   - LINEアプリを開く
   - 予約情報が通知されているか確認

---

## ✅ 動作確認チェックリスト

- [ ] LINE Notifyトークンを取得した
- [ ] Google Apps Scriptにトークンを設定した
- [ ] テスト通知が正常に届いた
- [ ] 実際の予約フォームから送信して通知が届いた

---

## 🔧 トラブルシューティング

### 通知が届かない場合

1. **トークンが正しく設定されているか確認**
   - Google Apps Scriptの「プロジェクトの設定」→「スクリプト プロパティ」で確認
   - プロパティ名が `LINE_NOTIFY_TOKEN` であることを確認
   - 値が正しいトークンであることを確認

2. **実行ログを確認**
   - Google Apps Scriptのエディタで「実行」→「実行ログを表示」を確認
   - エラーメッセージがないか確認

3. **LINE Notifyのトークンが有効か確認**
   - [LINE Notify マイページ](https://notify-bot.line.me/my/) で確認
   - トークンが無効化されていないか確認

4. **通知先の設定を確認**
   - LINE Notifyのマイページで、通知先が正しく設定されているか確認

### エラーメッセージ

#### 「LINE Notifyトークンが設定されていません」
- **原因**: スクリプトプロパティに `LINE_NOTIFY_TOKEN` が設定されていない
- **解決方法**: ステップ2を再度実行してトークンを設定

#### 「LINE通知の送信に失敗しました。レスポンスコード: 401」
- **原因**: トークンが無効または期限切れ
- **解決方法**: LINE Notifyで新しいトークンを発行して再設定

#### 「LINE通知の送信に失敗しました。レスポンスコード: 400」
- **原因**: リクエストの形式が正しくない
- **解決方法**: Google Apps Scriptのコードを確認（通常は自動で修正されます）

---

## 📱 通知内容のカスタマイズ

通知メッセージの内容を変更したい場合は、`handleReservationForm`関数内の以下の部分を編集してください：

```javascript
const lineMessage = `🔔 新しい予約が追加されました

お子様のお名前: ${childName}
電話番号: ${phone}
メールアドレス: ${email}
学校区別: ${schoolType}
学年: ${grade}
予約希望日時: ${dateDisplay} ${timeDisplay}${message ? `\n\nご質問・ご要望:\n${message}` : ''}`;
```

---

## 🔒 セキュリティに関する注意

- **トークンは機密情報です**
  - コードに直接書かない（`PropertiesService`を使用）
  - 他人に共有しない
  - 定期的にトークンを再発行することを推奨

- **トークンの無効化**
  - LINE Notifyのマイページから、不要になったトークンを無効化できます
  - セキュリティ上の理由で定期的に再発行することを推奨

---

## 📚 参考リンク

- [LINE Notify公式サイト](https://notify-bot.line.me/)
- [LINE Notify API ドキュメント](https://notify-bot.line.me/doc/ja/)
- [Google Apps Script ドキュメント](https://developers.google.com/apps-script)

---

## 🎉 完了

これで、予約情報が追加された際にLINE通知を受け取ることができます！

通知が届かない場合は、上記のトラブルシューティングを参照してください。

