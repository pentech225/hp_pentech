# Scratch学習教材 詳細設計書

**プロジェクト名**: スクラッチまなびば  
**作成日**: 2026-04-13  
**ステータス**: 詳細設計

---

## 1. ファイル構成（確定）

```
scratch/
  index.html            ← HTML骨格（全セクションを含む）
  style.css             ← 全スタイル（デザイントークン〜コンポーネント）
  app.js                ← データ定義 + 全ロジック
  images/
    mascot.svg          ← ヘッダーのマスコットキャラ
    prologue/
      p1-account.png    ← P-1: アカウント説明図
      p2-signup.png     ← P-2: アカウント作成手順
      p3-password.png   ← P-3: パスワード説明図
      p4-manage.png     ← P-4: 管理方法説明図
    chapter1/
      c1-3-screen.png   ← 1-3: Scratch画面説明
      c1-4-block.png    ← 1-4: ブロック説明
      ...（1-1〜1-8）
    chapter2/
      g1-step2-1.png    ← ゲーム1 作り方画像1
      g1-step2-2.png    ← ゲーム1 作り方画像2
      g2-step2-1.png    ← ゲーム2 作り方画像1
      ...
    chapter3/ 〜 chapter5/
      （同様）
```

---

## 2. HTML構造（index.html）

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>スクラッチまなびば</title>
  <link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- ===== HEADER ===== -->
  <header id="header">
    <div id="header-mascot"><!-- SVGキャラ --></div>
    <h1 id="header-title">スクラッチまなびば</h1>
    <button class="btn btn-typing" onclick="navigate('typing')">
      ⌨️ タイピング
    </button>
  </header>

  <!-- ===== LAYOUT WRAPPER ===== -->
  <div id="wrapper">

    <!-- ===== SIDEBAR ===== -->
    <nav id="sidebar">
      <!-- app.js の renderNav() が動的生成 -->
    </nav>

    <!-- ===== MAIN CONTENT ===== -->
    <main id="main-content">

      <!-- トップ -->
      <section id="page-home" class="page"></section>

      <!-- プロローグ各ページ -->
      <section id="page-prologue"   class="page"></section>
      <section id="page-prologue-1" class="page"></section>
      <section id="page-prologue-2" class="page"></section>
      <section id="page-prologue-3" class="page"></section>
      <section id="page-prologue-4" class="page"></section>

      <!-- 第1章 -->
      <section id="page-chapter1"   class="page"></section>
      <section id="page-lesson-1-1" class="page"></section>
      <!-- ... 1-2 〜 1-8 -->

      <!-- 第2〜5章（ゲーム） -->
      <section id="page-chapter2"   class="page"></section>
      <section id="page-game-1"     class="page"></section>
      <!-- ... game-2 〜 game-30 -->

      <!-- 付録・タイピング -->
      <section id="page-appendix"   class="page"></section>
      <section id="page-typing"     class="page"></section>

    </main>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

---

## 3. CSSデザイントークン（style.css）

```css
:root {
  /* ===== カラー（パステル系） ===== */
  --c-pink:    #FF9EC4;   /* プライマリ：ピンク */
  --c-blue:    #A8D8EA;   /* セカンダリ：ライトブルー */
  --c-mint:    #A8E6CF;   /* アクセント：ミント */
  --c-yellow:  #FFD3A5;   /* 警告・強調：パステルオレンジ */
  --c-purple:  #D4B8E0;   /* 補足：パステルパープル */
  --c-bg:      #FFF5F8;   /* 背景：薄ピンク */
  --c-white:   #FFFFFF;
  --c-text:    #555555;   /* 本文テキスト */
  --c-heading: #FF6B9D;   /* 見出しテキスト */
  --c-border:  #FFD6E7;   /* ボーダー */

  /* ===== タイポグラフィ ===== */
  --font:      'M PLUS Rounded 1c', sans-serif;
  --fs-base:   20px;      /* 本文（幼児向け大きめ） */
  --fs-large:  26px;      /* 小見出し */
  --fs-xlarge: 34px;      /* 大見出し */
  --fs-small:  16px;      /* 補足テキスト */
  --fs-ruby:   11px;      /* ルビ */
  --lh:        1.9;       /* 行間 */

  /* ===== レイアウト ===== */
  --sidebar-w: 230px;
  --header-h:  72px;
  --radius:    16px;
  --radius-sm: 8px;

  /* ===== シャドウ ===== */
  --shadow:       0 4px 16px rgba(255, 158, 196, 0.2);
  --shadow-hover: 0 6px 24px rgba(255, 158, 196, 0.4);
}
```

---

## 4. CSSクラス設計

### 4.1 レイアウト系

| クラス / ID | 役割 |
|------------|------|
| `#header` | 固定ヘッダー（高さ: `--header-h`） |
| `#wrapper` | サイドバー＋メインのflex親 |
| `#sidebar` | 左ナビ（幅: `--sidebar-w`、固定）|
| `#main-content` | メインコンテンツエリア |
| `.page` | 各画面セクション（`display:none`）|
| `.page.active` | 表示中の画面（`display:block`）|

### 4.2 ナビゲーション系

| クラス | 役割 |
|--------|------|
| `.nav-chapter` | サイドバーの章見出し |
| `.nav-item` | サイドバーの各レッスンリンク |
| `.nav-item.current` | 現在開いているレッスン |

### 4.3 ゲームレッスン系（★コア）

| クラス | 役割 |
|--------|------|
| `.step-tabs` | STEP1/2/3のタブバー |
| `.step-tab` | 各タブボタン |
| `.step-tab.active` | 選択中タブ |
| `.step-panel` | 各STEPのコンテンツ（`display:none`）|
| `.step-panel.active` | 表示中パネル |
| `.scratch-embed-wrap` | iframeの外枠 |
| `.scratch-open-btn` | 「スクラッチをひらく」ボタン |
| `.remix-steps` | リミックス手順リスト |
| `.remix-step` | 手順1件（番号＋説明）|

### 4.4 ボタン系

| クラス | 用途 | 色 |
|--------|------|----|
| `.btn` | 全ボタン共通（丸角・大きめ）| - |
| `.btn-primary` | 主要アクション | ピンク |
| `.btn-next` | 「つぎへ」 | ミント |
| `.btn-back` | 「もどる」 | グレー |
| `.btn-scratch` | 「スクラッチをひらく」 | オレンジ |
| `.btn-done` | 「できた！」（ToDo）| 黄緑 |
| `.btn-typing` | ヘッダーのタイピングボタン | ブルー |
| `.btn-record` | スコア記録ボタン | パープル |

### 4.5 タイピングコーナー系

| クラス | 役割 |
|--------|------|
| `.typing-course-cards` | コース選択カードの横並び |
| `.typing-course-card` | 各コースカード |
| `.score-form` | スコア入力フォーム |
| `.score-table` | 記録一覧テーブル |

---

## 5. JavaScriptの関数設計（app.js）

### 5.1 ルーティング・ナビゲーション

```js
// ハッシュが変わったら対応する .page を表示する
function navigate(pageId)
// 例: navigate('game-1') → #page-game-1 を .active に

// URLハッシュを監視して自動遷移
function initRouter()
// window.addEventListener('hashchange', ...) で実装

// サイドバーのHTML生成
function renderNav()
// CURRICULUM データから動的に生成
```

### 5.2 ルビ（全ページで使用）

```js
// <ruby>テキスト<rt>よみ</rt></ruby> を返す
function rb(text, reading)
// 例: rb("操作", "そうさ") → "<ruby>操作<rt>そうさ</rt></ruby>"
```

### 5.3 Scratch連携

```js
// Scratch iframeのHTMLを返す（projectId未設定時はプレースホルダー）
function scratchEmbed(projectId)

// 「スクラッチをひらく」リンクのHTMLを返す
function scratchLink(projectUrl, projectId)
```

### 5.4 ゲームレッスン（3ステップ）

```js
// ゲームIDからゲームレッスン画面全体のHTMLを生成してセクションに注入
function renderGamePage(gameId)

// STEP1/2/3のタブを切り替える
function switchStep(gameId, stepNum)
// 例: switchStep(1, 2) → ゲーム1のSTEP2を表示
```

### 5.5 タイピングスコア

```js
// localStorageにスコアを追記保存
function saveScore(course, score)
// key: "scratch_typing_scores"
// value: [{date, course, score}, ...]

// localStorageからスコア一覧を読み込む
function loadScores()

// スコアテーブルのHTMLを更新する
function renderScoreTable()
```

### 5.6 全体初期化

```js
// ページ読み込み時に実行
function init()
// └ renderNav()
// └ initRouter()
// └ 全ページのHTMLを生成
// └ renderScoreTable()

window.addEventListener('DOMContentLoaded', init)
```

---

## 6. データ定義（app.js 内）

### 6.1 プロローグ・第1章データ

```js
const CURRICULUM = {
  prologue: {
    id: "prologue",
    label: "プロローグ",
    icon: "📖",
    lessons: [
      {
        id: "prologue-1",
        title: "アカウントってなに？",
        prev: null,
        next: "prologue-2",
        content: `...HTML文字列（rb()使用）...`,
        images: ["images/prologue/p1-account.png"]
      },
      { id: "prologue-2", title: "スクラッチのアカウントをつくろう",
        prev: "prologue-1", next: "prologue-3", content: "...", images: [...] },
      { id: "prologue-3", title: `${rb("パスワード","ぱすわーど")}のたいせつさ`,
        prev: "prologue-2", next: "prologue-4", content: "...", images: [...] },
      { id: "prologue-4", title: `${rb("パスワード","ぱすわーど")}のかんりかた`,
        prev: "prologue-3", next: "lesson-1-1", content: "...", images: [...] },
    ]
  },
  chapter1: {
    id: "chapter1",
    label: `${rb("第","だい")}1${rb("章","しょう")}`,
    icon: "📘",
    lessons: [
      { id: "lesson-1-1", title: "スクラッチとは",
        prev: "prologue-4", next: "lesson-1-2", content: "...", images: [] },
      { id: "lesson-1-2", title: "スクラッチへのアクセス",
        prev: "lesson-1-1", next: "lesson-1-3", content: "...", images: [...] },
      // ... 1-3 〜 1-8
      { id: "lesson-1-8", title: "ステージのがめんひょうじ",
        prev: "lesson-1-7", next: "chapter2", content: "...", images: [...] },
    ]
  }
};
```

### 6.2 ゲームデータ（第2〜5章）

```js
const GAMES = [
  // ===== 第2章: 初歩編 =====
  {
    id: 1, chapter: 2,
    title: "ネコにタッチゲーム",
    embed_id: "",      // ← 先生がscratch.mit.eduのプロジェクトIDを入力
    project_url: "",   // ← 先生がscratch.mit.eduのURLを入力
    prev: null,
    next: 2,
    step2_html: `
      <p>${rb("最初","さいしょ")}に、ネコの${rb("動","うご")}きをつくります。</p>
      <img src="images/chapter2/g1-step2-1.png" alt="ネコのブロック">
      <p>...</p>
    `,
  },
  { id: 2,  chapter: 2, title: "ネコ追いかけゲーム",    embed_id: "", project_url: "", prev: 1,  next: 3,  step2_html: "" },
  { id: 3,  chapter: 2, title: "鳥にタッチゲーム",      embed_id: "", project_url: "", prev: 2,  next: 4,  step2_html: "" },
  { id: 4,  chapter: 2, title: "みかんキャッチゲーム",  embed_id: "", project_url: "", prev: 3,  next: 5,  step2_html: "" },
  { id: 5,  chapter: 2, title: "動く的当てゲーム",      embed_id: "", project_url: "", prev: 4,  next: 6,  step2_html: "" },
  // ===== 第3章: 基礎編 =====
  { id: 6,  chapter: 3, title: "ボールよけゲーム",       embed_id: "", project_url: "", prev: 5,  next: 7,  step2_html: "" },
  { id: 7,  chapter: 3, title: "スロットマシンゲーム",   embed_id: "", project_url: "", prev: 6,  next: 8,  step2_html: "" },
  { id: 8,  chapter: 3, title: "ロボット星当てゲーム",   embed_id: "", project_url: "", prev: 7,  next: 9,  step2_html: "" },
  { id: 9,  chapter: 3, title: "猿鳥合戦ゲーム",         embed_id: "", project_url: "", prev: 8,  next: 10, step2_html: "" },
  { id: 10, chapter: 3, title: "フルーツ集めゲーム",     embed_id: "", project_url: "", prev: 9,  next: 11, step2_html: "" },
  // ===== 第4章: 実践編 =====
  { id: 11, chapter: 4, title: "コウモリと対決ゲーム",          embed_id: "", project_url: "", prev: 10, next: 12, step2_html: "" },
  { id: 12, chapter: 4, title: "カラーボールよけゲーム",        embed_id: "", project_url: "", prev: 11, next: 13, step2_html: "" },
  { id: 13, chapter: 4, title: "ロボット反撃シューティングゲーム", embed_id: "", project_url: "", prev: 12, next: 14, step2_html: "" },
  { id: 14, chapter: 4, title: "動物よけゲーム",               embed_id: "", project_url: "", prev: 13, next: 15, step2_html: "" },
  { id: 15, chapter: 4, title: "ハートキャッチゲーム",          embed_id: "", project_url: "", prev: 14, next: 16, step2_html: "" },
  { id: 16, chapter: 4, title: "宇宙船着陸ゲーム",             embed_id: "", project_url: "", prev: 15, next: 17, step2_html: "" },
  { id: 17, chapter: 4, title: "風船割りゲーム",               embed_id: "", project_url: "", prev: 16, next: 18, step2_html: "" },
  { id: 18, chapter: 4, title: "3次元ロボットよけゲーム",       embed_id: "", project_url: "", prev: 17, next: 19, step2_html: "" },
  { id: 19, chapter: 4, title: "和音当てゲーム",               embed_id: "", project_url: "", prev: 18, next: 20, step2_html: "" },
  { id: 20, chapter: 4, title: "色塗りゲーム",                 embed_id: "", project_url: "", prev: 19, next: 21, step2_html: "" },
  // ===== 第5章: 応用編 =====
  { id: 21, chapter: 5, title: "ルーレットゲーム",              embed_id: "", project_url: "", prev: 20, next: 22, step2_html: "" },
  { id: 22, chapter: 5, title: "弾幕シューティングゲーム",      embed_id: "", project_url: "", prev: 21, next: 23, step2_html: "" },
  { id: 23, chapter: 5, title: "ヘビたたきゲーム",             embed_id: "", project_url: "", prev: 22, next: 24, step2_html: "" },
  { id: 24, chapter: 5, title: "ロボット迎撃シューティングゲーム", embed_id: "", project_url: "", prev: 23, next: 25, step2_html: "" },
  { id: 25, chapter: 5, title: "人魚の魚釣りゲーム",           embed_id: "", project_url: "", prev: 24, next: 26, step2_html: "" },
  { id: 26, chapter: 5, title: "異次元恐竜ハンティングゲーム",  embed_id: "", project_url: "", prev: 25, next: 27, step2_html: "" },
  { id: 27, chapter: 5, title: "路地でフルーツ集めゲーム",      embed_id: "", project_url: "", prev: 26, next: 28, step2_html: "" },
  { id: 28, chapter: 5, title: "迷路脱出ゲーム",               embed_id: "", project_url: "", prev: 27, next: 29, step2_html: "" },
  { id: 29, chapter: 5, title: "神経衰弱ゲーム",               embed_id: "", project_url: "", prev: 28, next: 30, step2_html: "" },
  { id: 30, chapter: 5, title: "間違い探しゲーム",             embed_id: "", project_url: "", prev: 29, next: null, step2_html: "" },
];
```

### 6.3 タイピングスコアのlocalStorage構造

```js
// キー名
const SCORE_KEY = "scratch_typing_scores";

// 保存形式（JSONArray）
[
  { "date": "2026-04-13", "course": "ひらがな",     "score": "320" },
  { "date": "2026-04-13", "course": "アルファベット", "score": "280" }
]

// 将来のログイン実装に備えた拡張形式（Phase2）
{
  "user_id": null,
  "name": null,
  "typing_scores": [...],
  "completed_lessons": []
}
```

---

## 7. ゲームレッスン画面のHTML生成ロジック

`renderGamePage(gameId)` が生成するHTMLの構造:

```html
<div class="game-lesson">
  <h2 class="lesson-title">
    ゲーム1: ネコにタッチゲーム
  </h2>

  <!-- タブ -->
  <div class="step-tabs">
    <button class="step-tab active" onclick="switchStep(1,1)">
      STEP1<br>あそぶ
    </button>
    <button class="step-tab" onclick="switchStep(1,2)">
      STEP2<br>つくりかた
    </button>
    <button class="step-tab" onclick="switchStep(1,3)">
      STEP3<br>つくる
    </button>
  </div>

  <!-- STEP1 -->
  <div id="step-1-1" class="step-panel active">
    <p class="step-lead">まず あそんでみよう！</p>
    <div class="scratch-embed-wrap">
      <iframe src="https://scratch.mit.edu/projects/【ID】/embed"
        width="485" height="402"
        allowtransparency="true" frameborder="0"
        scrolling="no" allowfullscreen>
      </iframe>
      <!-- embed_idが空の場合はプレースホルダー -->
    </div>
    <p class="step-note">どんなゲームか わかった？</p>
    <button class="btn btn-next" onclick="switchStep(1,2)">
      つぎへ（つくりかたをみる）→
    </button>
  </div>

  <!-- STEP2 -->
  <div id="step-1-2" class="step-panel">
    <p class="step-lead">どうやって つくるの？</p>
    <!-- step2_html の内容がここに入る -->
    <button class="btn btn-next" onclick="switchStep(1,3)">
      つぎへ（じぶんでつくる）→
    </button>
  </div>

  <!-- STEP3 -->
  <div id="step-1-3" class="step-panel">
    <p class="step-lead">じぶんで つくってみよう！</p>
    <ol class="remix-steps">
      <li class="remix-step">
        <strong>① スクラッチをひらこう</strong>
        <a href="【project_url】" target="_blank" class="btn btn-scratch">
          🔗 スクラッチをひらく
        </a>
      </li>
      <li class="remix-step">
        <strong>② サインインしよう</strong>
        <p>プロローグでつくったアカウントでサインインしてね</p>
        <img src="images/remix-signin.png" alt="サインイン画面">
      </li>
      <li class="remix-step">
        <strong>③「なかをみる」をクリックしよう</strong>
        <img src="images/remix-see-inside.png" alt="なかをみるボタン">
      </li>
      <li class="remix-step">
        <strong>④「リミックス」をクリックしよう</strong>
        <img src="images/remix-button.png" alt="リミックスボタン">
        <p>これで じぶんのプロジェクトができたよ！</p>
      </li>
      <li class="remix-step">
        <strong>⑤ じぶんでかえてみよう！</strong>
        <p>ブロックをかえて、オリジナルのゲームをつくってね</p>
      </li>
    </ol>
    <!-- ToDo: できた！ボタン（Phase2でクリア記録） -->
    <button class="btn btn-done" disabled title="もうすぐつかえるよ！">
      ✅ できた！（もうすぐ）
    </button>
  </div>

  <!-- フッターナビ -->
  <div class="lesson-nav">
    <button class="btn btn-back" onclick="navigate('chapter2')">
      ← もどる
    </button>
    <button class="btn btn-next" onclick="navigate('game-2')">
      つぎのゲームへ →
    </button>
  </div>
</div>
```

---

## 8. 先生向け：プロジェクトID入力箇所

先生がやることは `app.js` の `GAMES` 配列の2か所だけ:

```js
// app.js 内 ← ここだけ編集すればOK
{ id: 1, chapter: 2, title: "ネコにタッチゲーム",
  embed_id:    "123456789",                              // ← ここにIDを入れる
  project_url: "https://scratch.mit.edu/projects/123456789/", // ← ここにURLを入れる
  ...
}
```

scratch.mit.edu のURLから数字部分をコピーするだけ。

---

## 9. 設計フェーズ完了チェックリスト

- [x] 要件定義（requirements.md）
- [x] 技術要件定義（basic_design.md 内）
- [x] 基本設計（basic_design.md）
- [x] 詳細設計（detailed_design.md）
- [ ] **実装**（index.html / style.css / app.js）← 次のフェーズ

---

## 10. 実装順序（推奨）

```
Step A: HTML骨格 + CSS基本レイアウト（ヘッダー・サイドバー・メイン）
Step B: ナビゲーション（navigate関数・ハッシュルーティング）
Step C: トップページ（カリキュラム一覧）
Step D: プロローグ（P-1〜P-4）← テキスト内容は仮で可
Step E: 第1章（1-1〜1-8）← テキスト内容は仮で可
Step F: ゲームレッスンテンプレート（3ステップ構造）
Step G: ゲーム1〜5（第2章）← iframeはプレースホルダーで可
Step H: タイピングコーナー（スコア記録）
Step I: 残りゲーム（第3〜5章・付録）← 同じテンプレートを繰り返す
```
