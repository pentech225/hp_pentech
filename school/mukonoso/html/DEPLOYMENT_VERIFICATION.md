# デプロイ情報の紐づけ確認手順

実際にデプロイされているページ（https://www.pentech.info/school/mukonoso/html/reserve.html）とGoogle Apps Scriptのデプロイ情報が正しく紐づいているかを確認する手順です。

## 📋 確認項目

1. **実際のページに埋め込まれているGoogle Apps Script URL**
2. **Google Apps Script側のデプロイURL**
3. **Google Apps Script側の設定（アクセス権限など）**
4. **実際の動作確認**

---

## ステップ1: 実際のページのURLを確認

### 方法1: ブラウザの開発者ツールを使用

1. **実際のページを開く**
   - https://www.pentech.info/school/mukonoso/html/reserve.html を開く

2. **開発者ツールを開く**
   - `F12`キーを押す
   - または、右クリック → 「検証」を選択

3. **Consoleタブで確認**
   - 「Console」タブを開く
   - 以下のコマンドを入力してEnterキーを押す：
   ```javascript
   // ページ内のJavaScript変数を確認
   // 注意: 変数がスコープ内にある場合のみ確認可能
   ```

4. **Sourcesタブで確認**
   - 「Sources」タブを開く
   - `reserve.html`を選択
   - `GOOGLE_APPS_SCRIPT_URL`を検索（Ctrl+F）
   - 実際に使用されているURLを確認

### 方法2: ページのソースコードを確認

1. **ページのソースを表示**
   - ページ上で右クリック → 「ページのソースを表示」
   - または `Ctrl+U`（Windows）/ `Cmd+Option+U`（Mac）

2. **URLを検索**
   - `GOOGLE_APPS_SCRIPT_URL` または `script.google.com` を検索（Ctrl+F）
   - 実際に使用されているURLを確認

### 方法3: Networkタブで確認（実際の送信時）

1. **開発者ツールを開く**
   - `F12`キーを押す

2. **Networkタブを開く**
   - 「Network」タブを選択

3. **フォームを送信**
   - 予約フォームにテストデータを入力
   - 「予約を確定する」ボタンをクリック

4. **リクエストを確認**
   - Networkタブに表示されるリクエストを確認
   - `script.google.com`へのリクエストを探す
   - リクエストURLを確認

---

## ステップ2: Google Apps Script側のデプロイURLを確認

1. **Google Apps Scriptにアクセス**
   - https://script.google.com/ を開く
   - `iteen.mukonosou@gmail.com` のアカウントでログイン

2. **プロジェクトを開く**
   - 「iTeen 問い合わせ・予約フォーム」などのプロジェクトを選択

3. **デプロイ情報を確認**
   - 上部の「デプロイ」→「管理デプロイ」をクリック
   - デプロイされたWebアプリのURLを確認
   - 例: `https://script.google.com/macros/s/AKfycbwBemLT63uE89nyfvSj7FOkgWSHLGg8CsfoPrBmv49Hqa0LHJutgGE8Y00Xrab--n7f/exec`

4. **設定を確認**
   - 「アクセスできるユーザー」が「全員」になっているか確認
   - 「次のユーザーとして実行」が「自分」になっているか確認

---

## ステップ3: URLの一致確認

### 確認すべきURL

**実際のページで使用されているURL:**
```
（ステップ1で確認したURL）
```

**Google Apps Script側のデプロイURL:**
```
（ステップ2で確認したURL）
```

### 一致しているか確認

- ✅ **一致している場合**: 正しく紐づいています
- ❌ **一致していない場合**: 以下の対処が必要です
  1. 実際のページのURLを更新
  2. または、Google Apps Script側で新しいデプロイを作成

---

## ステップ4: Google Apps Scriptの動作確認

### GETリクエストでテスト

Google Apps Scriptの`doGet`関数は、GETリクエストで動作確認できます。

1. **ブラウザで直接アクセス**
   - Google Apps ScriptのデプロイURLをブラウザのアドレスバーに入力
   - 例: `https://script.google.com/macros/s/AKfycbwBemLT63uE89nyfvSj7FOkgWSHLGg8CsfoPrBmv49Hqa0LHJutgGE8Y00Xrab--n7f/exec`
   - 正常な場合、以下のようなJSONが表示されます：
   ```json
   {
     "success": true,
     "message": "iTeen予約フォーム API は正常に動作しています。",
     "note": "このAPIはPOSTリクエストで予約データを受け取ります。"
   }
   ```

2. **エラーが表示される場合**
   - 「このアプリは確認されていません」などのエラーが表示される場合
   - 「詳細」→「（安全ではないページ）に移動」をクリック
   - これでアクセスできるようになります

---

## ステップ5: 実際の送信テスト

### テスト手順

1. **実際のページでフォームを送信**
   - https://www.pentech.info/school/mukonoso/html/reserve.html を開く
   - テストデータを入力：
     - 学校区別: 小学生
     - 学年: 1年生
     - 日付と時間: 適当な日時を選択
     - お子様のお名前: テスト太郎
     - 電話番号: 09012345678
     - メールアドレス: （任意）

2. **開発者ツールで確認**
   - `F12`キーで開発者ツールを開く
   - 「Console」タブでエラーメッセージを確認
   - 「Network」タブでリクエストの成功/失敗を確認

3. **Google Apps Scriptのログを確認**
   - Google Apps Scriptのエディタで「表示」→「ログ」を開く
   - フォーム送信後にログを確認
   - エラーがないか確認

4. **メールとカレンダーを確認**
   - `iteen.mukonosou@gmail.com`にメールが届いているか確認
   - Googleカレンダーに予約イベントが追加されているか確認

---

## トラブルシューティング

### URLが一致しない場合

**原因:**
- 実際のページのURLが古い
- Google Apps Script側で新しいデプロイを作成したが、ページ側を更新していない

**対処方法:**
1. `reserve.html`と`contact.html`の`GOOGLE_APPS_SCRIPT_URL`を確認
2. Google Apps Script側の最新のデプロイURLと一致させる
3. 変更を保存して、サーバーに再デプロイ

### 「Failed to fetch」エラーが発生する場合

**原因:**
- Google Apps ScriptがWebアプリとして公開されていない
- 「アクセスできるユーザー」が「全員」に設定されていない
- ネットワークエラー

**対処方法:**
1. Google Apps Script側のデプロイ設定を確認
2. 「アクセスできるユーザー」を「全員」に設定
3. 必要に応じて再デプロイ

### メールが送信されない場合

**原因:**
- Google Apps Script側で権限が承認されていない
- メール送信の権限エラー

**対処方法:**
1. Google Apps Scriptのエディタで「実行」→「doPost」を選択
2. 権限を承認する
3. ログでエラーメッセージを確認

---

## 📝 確認チェックリスト

- [ ] 実際のページのURLを確認した
- [ ] Google Apps Script側のデプロイURLを確認した
- [ ] 両方のURLが一致していることを確認した
- [ ] Google Apps Scriptの設定（アクセス権限）を確認した
- [ ] GETリクエストで動作確認した
- [ ] 実際のフォーム送信で動作確認した
- [ ] メールが届くことを確認した
- [ ] カレンダーに予約が追加されることを確認した

---

## 🔄 定期的な確認

以下のタイミングで確認することを推奨します：

1. **新しいデプロイを作成した後**
2. **コードを更新した後**
3. **エラーが発生した時**
4. **定期的なメンテナンス時（月1回など）**

