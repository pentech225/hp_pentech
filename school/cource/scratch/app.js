'use strict';

/* ============================================================
   スクラッチまなびば — メインスクリプト
   ============================================================ */

/* ============================================================
   1. ユーティリティ
   ============================================================ */

/** ルビタグを生成 */
function rb(text, reading) {
  if (!reading) return text;
  return `<ruby>${text}<rt>${reading}</rt></ruby>`;
}

/** HTML特殊文字をエスケープ（スコア表示に使用） */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 画像プレースホルダーHTML */
function imgPh(caption) {
  return `<div class="img-ph"><span>📷</span>${caption || 'せつめいがぞう'}</div>`;
}

/* ============================================================
   2. Scratch ヘルパー
   ============================================================ */

function scratchEmbed(embedId) {
  if (!embedId) {
    return `<div class="scratch-ph">
      <span class="ph-icon">🐱</span>
      <p>もうすぐゲームがはいるよ！</p>
      <p style="font-size:13px">（せんせいがプロジェクトをついかします）</p>
    </div>`;
  }
  return `<iframe
    src="https://scratch.mit.edu/projects/${embedId}/embed"
    width="485" height="402"
    allowtransparency="true" frameborder="0"
    scrolling="no" allowfullscreen></iframe>`;
}

function scratchLink(url, embedId) {
  const href = url || (embedId ? `https://scratch.mit.edu/projects/${embedId}/` : null);
  if (!href) {
    return `<p style="color:#bbb;font-size:14px">（せんせいがリンクをついかします）</p>`;
  }
  return `<a href="${href}" target="_blank" rel="noopener" class="btn btn-scratch">
    🔗 スクラッチをひらく
  </a>`;
}

/* ============================================================
   3. データ定義
   ============================================================ */

/* ---- プロローグ ---- */
const PROLOGUE = [
  {
    id: 'prologue-1',
    title: 'アカウントってなに？',
    prev: null,
    next: 'prologue-2',
    total: 4, num: 1,
    content: () => `
      <p>みなさんは、インターネットで${rb('動画','どうが')}をみたり、ゲームをしたりしたことがありますか？<br>
      そういうサービスをつかうとき、「アカウント」がひつようになることがあります。</p>

      <h3>アカウントってなに？</h3>
      <p>アカウントとは、インターネットのサービスにはいるための「かいいんしょう」のようなものです。</p>
      <p>アカウントには、ふたつのものがあります：</p>
      <ul>
        <li>👤 <strong>ユーザーめい</strong>… じぶんのなまえ（ニックネームでもOK）</li>
        <li>🔑 <strong>パスワード</strong>… ひみつのことば</li>
      </ul>
      <p>このふたつをつかって、サービスに「サインイン」することができます。</p>

      <h3>スクラッチとアカウント</h3>
      <p>スクラッチはアカウントがなくてもゲームをあそぶことができます。<br>
      でも、アカウントをつくると、つぎのことができるようになります！</p>
      <ul>
        <li>✅ じぶんでつくったゲームをほぞんする</li>
        <li>✅ ほかのひとのゲームをリミックス（${rb('改造','かいぞう')}）する</li>
        <li>✅ せかい中のひととシェアする</li>
      </ul>
    `
  },
  {
    id: 'prologue-2',
    title: 'スクラッチのアカウントをつくろう',
    prev: 'prologue-1',
    next: 'prologue-3',
    total: 4, num: 2,
    content: () => `
      <div class="warn-box">
        <span class="warn-icon">⚠️</span>
        <p><strong>かならずせんせいといっしょにやりましょう！</strong><br>
        メールアドレスはせんせいのものをつかいます。</p>
      </div>

      <h3>アカウントをつくるじゅんばん</h3>

      <div class="step-box">
        <div class="step-circle">1</div>
        <div class="step-body">
          <strong>scratch.mit.edu にアクセスしよう</strong>
          <p>ブラウザのアドレスバーに「scratch.mit.edu」とうちこんで、Enterをおそう。</p>
          ${imgPh('Scratchのトップページ')}
        </div>
      </div>

      <div class="step-box">
        <div class="step-circle">2</div>
        <div class="step-body">
          <strong>「スクラッチにさんかしよう」をクリック</strong>
          <p>ページのうえのほうにあるボタンをさがしてクリックしよう。</p>
          ${imgPh('「さんかしよう」ボタン')}
        </div>
      </div>

      <div class="step-box">
        <div class="step-circle">3</div>
        <div class="step-body">
          <strong>ユーザーめいをきめよう</strong>
          <p>じぶんのすきなニックネームをつかおう。ほんとうのなまえはつかわなくていいよ。</p>
          ${imgPh('ユーザーめい入力')}
        </div>
      </div>

      <div class="step-box">
        <div class="step-circle">4</div>
        <div class="step-body">
          <strong>パスワードをきめよう</strong>
          <p>6もじいじょうで、すうじもまぜよう。<br>
          <strong>かならずノートにかきとめておこう！</strong></p>
          ${imgPh('パスワード入力')}
        </div>
      </div>

      <div class="step-box">
        <div class="step-circle">5</div>
        <div class="step-body">
          <strong>せんせいのメールアドレスをいれよう</strong>
          <p>メールアドレスはせんせいにきいてね。せんせいと一緒に入れよう。</p>
          ${imgPh('メールアドレス入力')}
        </div>
      </div>

      <div class="step-box">
        <div class="step-circle">6</div>
        <div class="step-body">
          <strong>かんせい！ノートにメモしよう</strong>
          <p>アカウントができたら、ノートにかきとめよう：</p>
          <p>📓 ユーザーめい：＿＿＿＿＿＿＿＿＿＿＿</p>
          <p>📓 パスワード　：＿＿＿＿＿＿＿＿＿＿＿</p>
        </div>
      </div>
    `
  },
  {
    id: 'prologue-3',
    title: 'パスワードのたいせつさ',
    prev: 'prologue-2',
    next: 'prologue-4',
    total: 4, num: 3,
    content: () => `
      <p>パスワードは「ひみつのあいことば」です。<br>
      このひみつは、じぶんだけがしっているものです。</p>

      <div class="warn-box">
        <span class="warn-icon">🚫</span>
        <p><strong>パスワードは、ぜったいにほかのひとにおしえてはいけません！</strong><br>
        ともだちにも、おしえないようにしよう。</p>
      </div>

      <h3>どうしてたいせつなの？</h3>
      <p>パスワードをひとにおしえてしまうと、そのひとがあなたのアカウントにはいれるようになってしまいます。</p>
      <ul>
        <li>😢 じぶんのゲームをかえられてしまうかも</li>
        <li>😢 へんなコメントをかかれてしまうかも</li>
        <li>😢 アカウントがつかえなくなるかも</li>
      </ul>

      <h3>いいパスワードとわるいパスワード</h3>
      <div class="pw-compare">
        <div class="pw-box pw-good">
          <h4>✅ いいパスワード</h4>
          <p>Neko2024!</p>
          <p>Star★Moon7</p>
          <p>・大${rb('文字','もじ')}・小${rb('文字','もじ')}・すうじがまざっている</p>
          <p>・8もじいじょう</p>
        </div>
        <div class="pw-box pw-bad">
          <h4>❌ わるいパスワード</h4>
          <p>123456</p>
          <p>じぶんのなまえ</p>
          <p>password</p>
          <p>・かんたんすぎる</p>
          <p>・あてられやすい</p>
        </div>
      </div>
    `
  },
  {
    id: 'prologue-4',
    title: 'パスワードのかんりかた',
    prev: 'prologue-3',
    next: 'lesson-1-1',
    total: 4, num: 4,
    content: () => `
      <p>パスワードはわすれやすいので、きちんとかんりしましょう。</p>

      <h3>かんりのしかた</h3>

      <div class="step-box">
        <div class="step-circle">📓</div>
        <div class="step-body">
          <strong>ノートにかいてほかんしよう</strong>
          <p>じぶんだけのひみつのノートにかいて、たいせつにしまっておこう。</p>
          <p>ノートはなくさないように、きめたばしょにしまっておこう。</p>
        </div>
      </div>

      <div class="step-box">
        <div class="step-circle">👩‍🏫</div>
        <div class="step-body">
          <strong>せんせいにあずかってもらおう</strong>
          <p>ノートのコピーをせんせいにわたしておくと、わすれたときもあんしん！</p>
        </div>
      </div>

      <h3>ぜったいにやってはいけないこと</h3>
      <ul>
        <li>❌ パソコンのがめんにはりつけない</li>
        <li>❌ インターネットにのせない</li>
        <li>❌ ひとがきこえるところでいわない</li>
        <li>❌ ともだちにみせない</li>
      </ul>

      <h3>パスワードをわすれたら？</h3>
      <div class="warn-box">
        <span class="warn-icon">💡</span>
        <p>わすれたときは、すぐ<strong>せんせいにそうだん</strong>しよう！<br>
        せんせいのメールアドレスにリセットのメールをおくることができます。</p>
      </div>
    `
  }
];

/* ---- 第1章 ---- */
const CHAPTER1 = [
  {
    id: 'lesson-1-1',
    title: 'スクラッチとは',
    prev: 'prologue-4',
    next: 'lesson-1-2',
    total: 8, num: 1,
    content: () => `
      <h3>スクラッチってなに？</h3>
      <p>スクラッチ（Scratch）は、アメリカの<strong>MIT（えむあいてぃー）</strong>という${rb('大学','だいがく')}がつくったプログラミングツールです。</p>
      <p>${rb('世界中','せかいじゅう')}のこどもたちがつかっていて、ゲームや${rb('動画','どうが')}、アートなどをつくることができます。</p>

      <h3>なにができるの？</h3>
      <ul>
        <li>🎮 ゲームをつくる</li>
        <li>🎨 アニメーションをつくる</li>
        <li>🎵 おとをならすプログラムをつくる</li>
        <li>📖 えほんをつくる</li>
      </ul>

      <h3>どうやってつくるの？</h3>
      <p>「ブロック」とよばれるパーツをつみかさねてプログラムをつくります。<br>
      むずかしいことばをおぼえなくても、ブロックをならべるだけでOKです！</p>
      ${imgPh('スクラッチのブロックイメージ')}
    `
  },
  {
    id: 'lesson-1-2',
    title: 'スクラッチへのアクセス',
    prev: 'lesson-1-1',
    next: 'lesson-1-3',
    total: 8, num: 2,
    content: () => `
      <h3>スクラッチをひらこう</h3>
      <p>スクラッチはインターネットブラウザ（Chrome など）でつかいます。<br>
      アドレスバーに <strong>scratch.mit.edu</strong> とうちこんで、Enterをおそう。</p>
      ${imgPh('ブラウザのアドレスバーに入力')}

      <h3>日本語にしよう</h3>
      <p>スクラッチのページのいちばんしたにある${rb('言語','げんご')}メニューから「<strong>日本語</strong>」をえらぼう。</p>
      ${imgPh('言語メニューで日本語を選択')}

      <h3>サインインしよう</h3>
      <p>プロローグでつくったアカウントのユーザーめいとパスワードをつかってサインインしよう。</p>
      ${imgPh('サインインボタン')}
    `
  },
  {
    id: 'lesson-1-3',
    title: 'スクラッチの画面',
    prev: 'lesson-1-2',
    next: 'lesson-1-4',
    total: 8, num: 3,
    content: () => `
      <h3>スクラッチのがめんのぶぶん</h3>
      ${imgPh('スクラッチの画面全体（各部の名称つき）')}

      <h3>ステージ</h3>
      <p>ゲームや${rb('作品','さくひん')}がうごく「スクリーン」です。ここにキャラクターがひょうじされます。</p>

      <h3>スプライト</h3>
      <p>ゲームにとうじょうするキャラクターのことです。ネコ・むし・ロボットなど、たくさんえらべます。</p>

      <h3>ブロックパレット</h3>
      <p>つかえるブロックのいちらんです。いろでしゅるいがわかります：<br>
      🟦 うごき　🟩 みため　🟨 イベント　🟧 せいぎょ　など</p>

      <h3>スクリプトエリア</h3>
      <p>ブロックをここにひきずってならべて、プログラムをつくります。</p>
    `
  },
  {
    id: 'lesson-1-4',
    title: 'プログラムの作成',
    prev: 'lesson-1-3',
    next: 'lesson-1-5',
    total: 8, num: 4,
    content: () => `
      <h3>ブロックをつかおう</h3>
      <p>ブロックパレットからブロックをえらんで、スクリプトエリアにひきずります（ドラッグ）。</p>
      ${imgPh('ブロックのドラッグ操作')}

      <h3>ブロックをくっつけよう</h3>
      <p>ブロックをちかづけると、パチッとくっつきます。これがプログラムになります！</p>
      ${imgPh('ブロックのつなぎかた')}

      <h3>ブロックのいろのいみ</h3>
      <ul>
        <li>🔵 <strong>うごき</strong>：スプライトをうごかす</li>
        <li>🟣 <strong>みため</strong>：スプライトのみためをかえる</li>
        <li>🟡 <strong>イベント</strong>：「はたがおされたとき」など、きっかけになるブロック</li>
        <li>🟠 <strong>せいぎょ</strong>：「ずっと」「もしなら」などのくりかえしや${rb('条件','じょうけん')}</li>
      </ul>
    `
  },
  {
    id: 'lesson-1-5',
    title: 'プログラムの実行と停止',
    prev: 'lesson-1-4',
    next: 'lesson-1-6',
    total: 8, num: 5,
    content: () => `
      <h3>プログラムをうごかそう（${rb('実行','じっこう')}）</h3>
      <p>ステージのうえにある <strong style="color:green">▶ みどりのはた</strong> をクリックするとプログラムがはじまります。</p>
      ${imgPh('みどりのはたボタン')}

      <h3>プログラムをとめよう（${rb('停止','ていし')}）</h3>
      <p>ステージのうえにある <strong style="color:red">🛑 あかいまるいボタン</strong> をクリックするとプログラムがとまります。</p>
      ${imgPh('停止ボタン')}

      <div class="warn-box">
        <span class="warn-icon">💡</span>
        <p>プログラムがとまらなくなったときは、あかいボタンをクリックしよう！</p>
      </div>
    `
  },
  {
    id: 'lesson-1-6',
    title: 'プログラムの保存',
    prev: 'lesson-1-5',
    next: 'lesson-1-7',
    total: 8, num: 6,
    content: () => `
      <h3>プログラムをほぞんしよう</h3>
      <p>サインインしているときは、プログラムがじどうでほぞんされます。</p>
      <p>てどうでほぞんするには、「ファイル」メニューから「コンピューターにほぞんする」をえらびます。</p>
      ${imgPh('ファイルメニュー → コンピューターに保存')}

      <h3>ほぞんしたファイル</h3>
      <p>ほぞんすると <strong>.sb3</strong> というファイルができます。このファイルをなくさないように！</p>

      <div class="warn-box">
        <span class="warn-icon">💾</span>
        <p>じゅぎょうがおわるまえに、かならずほぞんしよう！</p>
      </div>
    `
  },
  {
    id: 'lesson-1-7',
    title: 'プログラムの読み込み',
    prev: 'lesson-1-6',
    next: 'lesson-1-8',
    total: 8, num: 7,
    content: () => `
      <h3>ほぞんしたプログラムをひらこう</h3>
      <p>「ファイル」メニューから「コンピューターからよみこむ」をえらびます。</p>
      ${imgPh('ファイルメニュー → コンピューターから読み込む')}

      <h3>ファイルをえらぼう</h3>
      <p>ほぞんしておいた <strong>.sb3</strong> ファイルをえらんでクリックします。</p>
      ${imgPh('ファイル選択ダイアログ')}

      <p>これで、まえにつくったプログラムがひらきます！</p>
    `
  },
  {
    id: 'lesson-1-8',
    title: 'ステージの画面表示',
    prev: 'lesson-1-7',
    next: 'chapter2',
    total: 8, num: 8,
    content: () => `
      <h3>ステージのひょうじをかえよう</h3>
      <p>ステージのひょうじには、みっつのモードがあります：</p>

      <div class="step-box">
        <div class="step-circle">📱</div>
        <div class="step-body">
          <strong>ノーマルモード</strong>
          <p>ふつうのおおきさ。プログラムをつくりながらゲームをたしかめるときにつかいます。</p>
        </div>
      </div>
      <div class="step-box">
        <div class="step-circle">🔲</div>
        <div class="step-body">
          <strong>スモールモード</strong>
          <p>ちいさくひょうじ。ブロックをたくさんならべたいときにべんり。</p>
        </div>
      </div>
      <div class="step-box">
        <div class="step-circle">📺</div>
        <div class="step-body">
          <strong>フルスクリーンモード</strong>
          <p>がめんいっぱいにひょうじ。できあがったゲームであそぶときにつかいます。</p>
        </div>
      </div>

      ${imgPh('ステージ右上の表示切替ボタン')}

      <div class="warn-box">
        <span class="warn-icon">🎉</span>
        <p><strong>だいいっしょうがおわりました！</strong><br>
        つぎはいよいよゲームをつくっていきましょう！</p>
      </div>
    `
  }
];

/* ---- ゲームデータ（第2〜5章）---- */
const GAMES = [
  // === 第2章: 初歩編 ===
  {
    id: 1, chapter: 2,
    title: 'ネコにタッチゲーム',
    embed_id: '', url: '',
    prev: null, next: 2,
    step2: () => `
      <h3>このゲームのルール</h3>
      <p>マウスでうごくネコにタッチするとポイントがあがります。<br>
      ネコはランダムにうごきまわっています。</p>

      <h3>つくりかた</h3>

      <div class="make-step">
        <strong>① ネコのスプライトをかくにんしよう</strong>
        <p>スクラッチをひらくと、さいしょからネコのスプライトがあります。</p>
        ${imgPh('ネコのスプライト確認')}
      </div>

      <div class="make-step">
        <strong>② ブロックをならべよう</strong>
        <p>スクリプトエリアにつぎのブロックをならべます：</p>
        <ul>
          <li>🟡「みどりのはたがおされたとき」</li>
          <li>🟠「ずっと」</li>
          <li>🔵「ランダムなばしょへいく」</li>
          <li>🟠「1びょうまつ」</li>
        </ul>
        ${imgPh('ブロックのならべかた')}
      </div>

      <div class="make-step">
        <strong>③ タッチしたときのスクリプトをつくろう</strong>
        <p>マウスポインターにふれたときにポイントがあがるようにします。</p>
        ${imgPh('タッチ判定のブロック')}
      </div>

      <div class="make-step">
        <strong>④ ためしてみよう！</strong>
        <p>みどりのはたをクリックして、ネコをおいかけよう！</p>
      </div>
    `
  },
  { id: 2,  chapter: 2, title: 'ネコ追いかけゲーム',             embed_id: '', url: '', prev: 1,  next: 3  },
  { id: 3,  chapter: 2, title: '鳥にタッチゲーム',               embed_id: '', url: '', prev: 2,  next: 4  },
  { id: 4,  chapter: 2, title: 'みかんキャッチゲーム',           embed_id: '', url: '', prev: 3,  next: 5  },
  { id: 5,  chapter: 2, title: '動く的当てゲーム',               embed_id: '', url: '', prev: 4,  next: 6  },
  // === 第3章: 基礎編 ===
  { id: 6,  chapter: 3, title: 'ボールよけゲーム',               embed_id: '', url: '', prev: 5,  next: 7  },
  { id: 7,  chapter: 3, title: 'スロットマシンゲーム',           embed_id: '', url: '', prev: 6,  next: 8  },
  { id: 8,  chapter: 3, title: 'ロボット星当てゲーム',           embed_id: '', url: '', prev: 7,  next: 9  },
  { id: 9,  chapter: 3, title: '猿鳥合戦ゲーム',                 embed_id: '', url: '', prev: 8,  next: 10 },
  { id: 10, chapter: 3, title: 'フルーツ集めゲーム',             embed_id: '', url: '', prev: 9,  next: 11 },
  // === 第4章: 実践編 ===
  { id: 11, chapter: 4, title: 'コウモリと対決ゲーム',           embed_id: '', url: '', prev: 10, next: 12 },
  { id: 12, chapter: 4, title: 'カラーボールよけゲーム',         embed_id: '', url: '', prev: 11, next: 13 },
  { id: 13, chapter: 4, title: 'ロボット反撃シューティングゲーム', embed_id: '', url: '', prev: 12, next: 14 },
  { id: 14, chapter: 4, title: '動物よけゲーム',                 embed_id: '', url: '', prev: 13, next: 15 },
  { id: 15, chapter: 4, title: 'ハートキャッチゲーム',           embed_id: '', url: '', prev: 14, next: 16 },
  { id: 16, chapter: 4, title: '宇宙船着陸ゲーム',               embed_id: '', url: '', prev: 15, next: 17 },
  { id: 17, chapter: 4, title: '風船割りゲーム',                 embed_id: '', url: '', prev: 16, next: 18 },
  { id: 18, chapter: 4, title: '3次元ロボットよけゲーム',         embed_id: '', url: '', prev: 17, next: 19 },
  { id: 19, chapter: 4, title: '和音当てゲーム',                 embed_id: '', url: '', prev: 18, next: 20 },
  { id: 20, chapter: 4, title: '色塗りゲーム',                   embed_id: '', url: '', prev: 19, next: 21 },
  // === 第5章: 応用編 ===
  { id: 21, chapter: 5, title: 'ルーレットゲーム',               embed_id: '', url: '', prev: 20, next: 22 },
  { id: 22, chapter: 5, title: '弾幕シューティングゲーム',       embed_id: '', url: '', prev: 21, next: 23 },
  { id: 23, chapter: 5, title: 'ヘビたたきゲーム',               embed_id: '', url: '', prev: 22, next: 24 },
  { id: 24, chapter: 5, title: 'ロボット迎撃シューティングゲーム', embed_id: '', url: '', prev: 23, next: 25 },
  { id: 25, chapter: 5, title: '人魚の魚釣りゲーム',             embed_id: '', url: '', prev: 24, next: 26 },
  { id: 26, chapter: 5, title: '異次元恐竜ハンティングゲーム',   embed_id: '', url: '', prev: 25, next: 27 },
  { id: 27, chapter: 5, title: '路地でフルーツ集めゲーム',       embed_id: '', url: '', prev: 26, next: 28 },
  { id: 28, chapter: 5, title: '迷路脱出ゲーム',                 embed_id: '', url: '', prev: 27, next: 29 },
  { id: 29, chapter: 5, title: '神経衰弱ゲーム',                 embed_id: '', url: '', prev: 28, next: 30 },
  { id: 30, chapter: 5, title: '間違い探しゲーム',               embed_id: '', url: '', prev: 29, next: null }
];

/** ゲーム2〜30のSTEP2デフォルトコンテンツ */
function defaultStep2(title) {
  return `
    <div class="content-ph">
      <p class="ph-icon">📚</p>
      <p><strong>「${title}」のつくりかた</strong>はじゅんびちゅうです。</p>
      <p>「スクラッチプログラミング${rb('事例','じれい')}${rb('大全集','だいぜんしゅう')}」のほんをみながらつくってみよう！</p>
    </div>
  `;
}

/* ---- チャプターメタ ---- */
const CHAPTER_META = {
  2: { label: `${rb('第','だい')}2${rb('章','しょう')}`, sublabel: `${rb('初歩','しょほ')}${rb('編','へん')}`, desc: 'かんたんなゲームをつくってみよう', icon: '🌱', color: '#A8E6CF', games: [1,2,3,4,5] },
  3: { label: `${rb('第','だい')}3${rb('章','しょう')}`, sublabel: `${rb('基礎','きそ')}${rb('編','へん')}`, desc: 'すこしふくざつなゲームをつくってみよう', icon: '⭐', color: '#A8D8EA', games: [6,7,8,9,10] },
  4: { label: `${rb('第','だい')}4${rb('章','しょう')}`, sublabel: `${rb('実践','じっせん')}${rb('編','へん')}`, desc: 'ふくざつなゲームをつくってみよう', icon: '🔥', color: '#FFD3A5', games: [11,12,13,14,15,16,17,18,19,20] },
  5: { label: `${rb('第','だい')}5${rb('章','しょう')}`, sublabel: `${rb('応用','おうよう')}${rb('編','へん')}`, desc: 'こうどなゲームをつくってみよう', icon: '👑', color: '#D4B8E0', games: [21,22,23,24,25,26,27,28,29,30] }
};

/* ============================================================
   4. ページレンダラー
   ============================================================ */

function renderHome() {
  const ch2 = GAMES.filter(g => g.chapter === 2);
  const ch3 = GAMES.filter(g => g.chapter === 3);
  const ch4 = GAMES.filter(g => g.chapter === 4);
  const ch5 = GAMES.filter(g => g.chapter === 5);

  function chips(items, prefix) {
    return items.map(it => `<span class="lesson-chip" onclick="navigate('${prefix}${it.id || it.num}')">${it.short || it.title}</span>`).join('');
  }

  const pChips = PROLOGUE.map(l =>
    `<span class="lesson-chip" onclick="navigate('${l.id}')">P-${l.num} ${l.title}</span>`).join('');
  const c1Chips = CHAPTER1.map(l =>
    `<span class="lesson-chip" onclick="navigate('${l.id}')">1-${l.num} ${l.title}</span>`).join('');
  const c2Chips = ch2.map(g =>
    `<span class="lesson-chip" onclick="navigate('game-${g.id}')">ゲーム${g.id}</span>`).join('');
  const c3Chips = ch3.map(g =>
    `<span class="lesson-chip" onclick="navigate('game-${g.id}')">ゲーム${g.id}</span>`).join('');
  const c4Chips = ch4.map(g =>
    `<span class="lesson-chip" onclick="navigate('game-${g.id}')">ゲーム${g.id}</span>`).join('');
  const c5Chips = ch5.map(g =>
    `<span class="lesson-chip" onclick="navigate('game-${g.id}')">ゲーム${g.id}</span>`).join('');

  return `
    <div class="home-hero">
      <div class="home-hero-mascot">🐱</div>
      <h2>スクラッチまなびばへ ようこそ！</h2>
      <p>ここをよめば、スクラッチがつかえるようになるよ！</p>
    </div>

    <div class="chapter-cards">
      <div class="chapter-card" onclick="navigate('prologue')">
        <div class="chapter-card-header">
          <span class="chapter-card-icon">📖</span>
          <h3>プロローグ — アカウントとパスワードをまなぼう</h3>
        </div>
        <p>スクラッチをはじめるまえに、インターネットのルールをおぼえよう。</p>
        <div class="lesson-chips">${pChips}</div>
      </div>

      <div class="chapter-card" onclick="navigate('chapter1')">
        <div class="chapter-card-header">
          <span class="chapter-card-icon">📘</span>
          <h3>${rb('第','だい')}1${rb('章','しょう')} — スクラッチの${rb('概要','がいよう')}と${rb('操作','そうさ')}</h3>
        </div>
        <p>スクラッチのがめんのみかたとつかいかたをおぼえよう。</p>
        <div class="lesson-chips">${c1Chips}</div>
      </div>

      <div class="chapter-card" onclick="navigate('chapter2')">
        <div class="chapter-card-header">
          <span class="chapter-card-icon">🌱</span>
          <h3>${rb('第','だい')}2${rb('章','しょう')} — ${rb('初歩','しょほ')}${rb('編','へん')} かんたんなゲームをつくってみよう</h3>
        </div>
        <p>まずはかんたんなゲームからつくってみよう！（ゲーム1〜5）</p>
        <div class="lesson-chips">${c2Chips}</div>
      </div>

      <div class="chapter-card" onclick="navigate('chapter3')">
        <div class="chapter-card-header">
          <span class="chapter-card-icon">⭐</span>
          <h3>${rb('第','だい')}3${rb('章','しょう')} — ${rb('基礎','きそ')}${rb('編','へん')} すこしふくざつなゲームをつくってみよう</h3>
        </div>
        <p>もうすこしむずかしいゲームにちょうせんしよう！（ゲーム6〜10）</p>
        <div class="lesson-chips">${c3Chips}</div>
      </div>

      <div class="chapter-card" onclick="navigate('chapter4')">
        <div class="chapter-card-header">
          <span class="chapter-card-icon">🔥</span>
          <h3>${rb('第','だい')}4${rb('章','しょう')} — ${rb('実践','じっせん')}${rb('編','へん')} ふくざつなゲームをつくってみよう</h3>
        </div>
        <p>かなりむずかしいゲームにちょうせん！（ゲーム11〜20）</p>
        <div class="lesson-chips">${c4Chips}</div>
      </div>

      <div class="chapter-card" onclick="navigate('chapter5')">
        <div class="chapter-card-header">
          <span class="chapter-card-icon">👑</span>
          <h3>${rb('第','だい')}5${rb('章','しょう')} — ${rb('応用','おうよう')}${rb('編','へん')} こうどなゲームをつくってみよう</h3>
        </div>
        <p>さいこうレベルのゲームにちょうせん！（ゲーム21〜30）</p>
        <div class="lesson-chips">${c5Chips}</div>
      </div>

      <div class="chapter-card" onclick="navigate('appendix')">
        <div class="chapter-card-header">
          <span class="chapter-card-icon">📎</span>
          <h3>${rb('付録','ふろく')} — スクラッチへの${rb('参加登録','さんかとうろく')}とサインイン</h3>
        </div>
        <p>アプリのインストールや${rb('参加登録','さんかとうろく')}のくわしいせつめい。</p>
      </div>

      <div class="chapter-card" onclick="navigate('typing')">
        <div class="chapter-card-header">
          <span class="chapter-card-icon">⌨️</span>
          <h3>タイピング れんしゅう</h3>
        </div>
        <p>ひらがなやアルファベットのタイピングをれんしゅうしよう！スコアをきろくできるよ。</p>
      </div>
    </div>
  `;
}

/* ---- プロローグ一覧 ---- */
function renderPrologueIndex() {
  const cards = PROLOGUE.map(l => `
    <div class="lesson-card" onclick="navigate('${l.id}')">
      <span class="card-num">P-${l.num}</span>
      <h4>${l.title}</h4>
    </div>`).join('');
  return `
    <h2 class="chapter-overview-title">📖 プロローグ</h2>
    <p class="chapter-overview-sub">スクラッチをはじめるまえに、インターネットのルールをまなぼう。</p>
    <div class="lesson-grid">${cards}</div>
  `;
}

/* ---- レッスンページ（プロローグ・第1章共通）---- */
function renderLesson(lesson) {
  const prevBtn = lesson.prev
    ? `<button class="btn btn-back" onclick="navigate('${lesson.prev}')">← もどる</button>`
    : `<button class="btn btn-back" onclick="navigate('${lesson.id.startsWith('prologue') ? 'prologue' : 'chapter1'}')">← いちらんへ</button>`;
  const nextBtn = lesson.next
    ? `<button class="btn btn-next" onclick="navigate('${lesson.next}')">つぎへ →</button>`
    : `<button class="btn btn-primary" onclick="navigate('home')">🏠 ホームへ</button>`;

  return `
    <div class="lesson-header">
      <h2>${lesson.title}</h2>
      <span class="lesson-progress">${lesson.num} / ${lesson.total}</span>
    </div>
    <div class="lesson-body">${lesson.content()}</div>
    <div class="lesson-nav">${prevBtn}${nextBtn}</div>
  `;
}

/* ---- チャプター概要（第1章・2〜5章共通）---- */
function renderChapterOverview(chNum) {
  if (chNum === 1) {
    const cards = CHAPTER1.map(l => `
      <div class="lesson-card" onclick="navigate('${l.id}')">
        <span class="card-num">1-${l.num}</span>
        <h4>${l.title}</h4>
      </div>`).join('');
    return `
      <h2 class="chapter-overview-title">📘 ${rb('第','だい')}1${rb('章','しょう')}: スクラッチの${rb('概要','がいよう')}と${rb('操作','そうさ')}</h2>
      <p class="chapter-overview-sub">スクラッチのがめんのみかたとつかいかたをおぼえよう。</p>
      <div class="lesson-grid">${cards}</div>
    `;
  }
  const meta = CHAPTER_META[chNum];
  const cards = meta.games.map(id => {
    const g = GAMES.find(x => x.id === id);
    return `
      <div class="lesson-card" onclick="navigate('game-${g.id}')">
        <span class="card-num">${g.id}</span>
        <h4>${g.title}</h4>
      </div>`;
  }).join('');
  return `
    <h2 class="chapter-overview-title">${meta.icon} ${meta.label}: ${meta.sublabel}</h2>
    <p class="chapter-overview-sub">${meta.desc}（ゲーム${meta.games[0]}〜${meta.games[meta.games.length-1]}）</p>
    <div class="lesson-grid">${cards}</div>
  `;
}

/* ---- ゲームレッスン（3ステップ）---- */
function renderGameLesson(game) {
  if (!game) return `<p>ゲームがみつかりません。</p>`;

  const step2html = game.step2 ? game.step2() : defaultStep2(game.title);

  const prevBtn = game.prev
    ? `<button class="btn btn-back" onclick="navigate('game-${game.prev}')">← ゲーム${game.prev}</button>`
    : `<button class="btn btn-back" onclick="navigate('chapter${game.chapter}')">← いちらんへ</button>`;
  const nextBtn = game.next
    ? `<button class="btn btn-next" onclick="navigate('game-${game.next}')">ゲーム${game.next}へ →</button>`
    : `<button class="btn btn-primary" onclick="navigate('home')">🏠 ホームへ</button>`;

  return `
    <h2 class="game-title">
      <span class="game-num">ゲーム${game.id}</span>${game.title}
    </h2>

    <div class="step-tabs">
      <button id="tab-${game.id}-1" class="step-tab active" onclick="switchStep(${game.id},1)">
        <span class="tab-num">STEP 1</span>
        <span class="tab-label">あそぶ</span>
      </button>
      <button id="tab-${game.id}-2" class="step-tab" onclick="switchStep(${game.id},2)">
        <span class="tab-num">STEP 2</span>
        <span class="tab-label">つくりかた</span>
      </button>
      <button id="tab-${game.id}-3" class="step-tab" onclick="switchStep(${game.id},3)">
        <span class="tab-num">STEP 3</span>
        <span class="tab-label">つくる</span>
      </button>
    </div>

    <!-- STEP 1: あそぶ -->
    <div id="panel-${game.id}-1" class="step-panel active">
      <p class="step-lead">まず あそんでみよう！</p>
      <div class="scratch-embed-wrap">
        ${scratchEmbed(game.embed_id)}
      </div>
      <p class="step-note">どんなゲームか わかった？</p>
      <div style="text-align:center">
        <button class="btn btn-next" onclick="switchStep(${game.id},2)">つぎへ（つくりかたをみる）→</button>
      </div>
    </div>

    <!-- STEP 2: つくりかた -->
    <div id="panel-${game.id}-2" class="step-panel">
      <p class="step-lead">どうやって つくるの？</p>
      ${step2html}
      <div style="text-align:right; margin-top:20px">
        <button class="btn btn-next" onclick="switchStep(${game.id},3)">つぎへ（じぶんでつくる）→</button>
      </div>
    </div>

    <!-- STEP 3: つくる -->
    <div id="panel-${game.id}-3" class="step-panel">
      <p class="step-lead">じぶんで つくってみよう！</p>
      <ol class="remix-list">
        <li class="remix-step">
          <strong>① スクラッチをひらこう</strong>
          <p>したのボタンをクリックして、スクラッチをひらこう。</p>
          <div style="margin-top:10px">${scratchLink(game.url, game.embed_id)}</div>
        </li>
        <li class="remix-step">
          <strong>② サインインしよう</strong>
          <p>プロローグでつくったアカウントでサインインしてね。</p>
          ${imgPh('サインインのやりかた')}
        </li>
        <li class="remix-step">
          <strong>③「なかをみる」をクリックしよう</strong>
          <p>ステージのしたにある「なかをみる」ボタンをおそう。</p>
          ${imgPh('「なかをみる」ボタン')}
        </li>
        <li class="remix-step">
          <strong>④「リミックス」をクリックしよう</strong>
          <p>みどりの「リミックス」ボタンをおすと、じぶんのプロジェクトとしてほぞんされるよ！</p>
          ${imgPh('「リミックス」ボタン')}
        </li>
        <li class="remix-step">
          <strong>⑤ じぶんでかえてみよう！</strong>
          <p>ブロックをかえたり、スプライトをかえたりして、オリジナルのゲームをつくってね！</p>
        </li>
      </ol>
      <div style="margin-top:16px">
        <button class="btn btn-done" disabled title="もうすぐつかえるよ！">✅ できた！（もうすぐ）</button>
      </div>
    </div>

    <div class="lesson-nav" style="margin-top:16px">${prevBtn}${nextBtn}</div>
  `;
}

/* ---- タイピングページ ---- */
function renderTyping() {
  return `
    <div class="typing-header">
      <h2>⌨️ タイピング れんしゅう</h2>
      <p>つぎのコースをえらんでください。クリックするとれんしゅうサイトがひらくよ！</p>
    </div>

    <div class="typing-courses">
      <div class="typing-course">
        <div class="course-icon">🈵</div>
        <h3>ひらがな タイピング</h3>
        <a href="https://n-typing.com/" target="_blank" rel="noopener" class="btn btn-primary">
          れんしゅうする
        </a>
      </div>
      <div class="typing-course">
        <div class="course-icon">🔤</div>
        <h3>アルファベット タイピング</h3>
        <a href="https://n-typing.com/" target="_blank" rel="noopener" class="btn btn-typing" style="font-size:18px;padding:12px 28px;">
          れんしゅうする
        </a>
      </div>
    </div>

    <div class="score-section">
      <h3>📊 スコアをきろくしよう</h3>
      <div class="score-form">
        <label for="score-course">コース：</label>
        <select id="score-course">
          <option value="ひらがな">ひらがな</option>
          <option value="アルファベット">アルファベット</option>
        </select>
        <label for="score-input">スコア：</label>
        <input type="number" id="score-input" placeholder="例: 320" min="0" max="9999">
        <span>てん</span>
        <button class="btn btn-record" onclick="submitScore()">💾 きろくする</button>
      </div>

      <div class="score-table-wrap">
        <table class="score-table">
          <thead>
            <tr>
              <th>${rb('日付','ひづけ')}</th>
              <th>コース</th>
              <th>スコア</th>
            </tr>
          </thead>
          <tbody id="score-tbody">
            <tr class="no-score-row"><td colspan="3">まだきろくがないよ！れんしゅうしてスコアをきろくしよう！</td></tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:16px; text-align:right">
        <button class="btn btn-back" style="font-size:14px;padding:8px 18px" onclick="clearScores()">🗑️ きろくをけす</button>
      </div>
    </div>
  `;
}

/* ---- 付録ページ ---- */
function renderAppendix() {
  return `
    <h2 class="chapter-overview-title">📎 ${rb('付録','ふろく')}: スクラッチへの${rb('参加登録','さんかとうろく')}とサインイン</h2>
    <p class="chapter-overview-sub">くわしいせつめいはこちら。プロローグとあわせてよもう。</p>

    <div class="appendix-card">
      <h3>${rb('付録','ふろく')}1 — Scratchアプリのインストールとじっこう</h3>
      <p>パソコンにスクラッチのアプリをいれる${rb('方法','ほうほう')}。</p>
    </div>
    <div class="appendix-card">
      <h3>${rb('付録','ふろく')}2 — スクラッチへの${rb('参加登録','さんかとうろく')}とサインイン</h3>
      <p>アカウントのつくりかたとサインインのくわしいせつめい。（→ プロローグP-2もみてね）</p>
    </div>
    <div class="appendix-card">
      <h3>${rb('付録','ふろく')}3 — サインインしてひろがるスクラッチのせかい</h3>
      <p>アカウントをつくるとできることのくわしいせつめい。</p>
    </div>

    <div style="margin-top:24px">
      <button class="btn btn-next" onclick="navigate('prologue-2')">📖 アカウントのつくりかたをみる →</button>
    </div>
  `;
}

/* ============================================================
   5. ルーター
   ============================================================ */

function getPageHTML(pageId) {
  if (!pageId || pageId === 'home') return renderHome();
  if (pageId === 'prologue')  return renderPrologueIndex();
  if (pageId === 'chapter1')  return renderChapterOverview(1);
  if (pageId === 'chapter2')  return renderChapterOverview(2);
  if (pageId === 'chapter3')  return renderChapterOverview(3);
  if (pageId === 'chapter4')  return renderChapterOverview(4);
  if (pageId === 'chapter5')  return renderChapterOverview(5);
  if (pageId === 'appendix')  return renderAppendix();
  if (pageId === 'typing')    return renderTyping();

  if (pageId.startsWith('prologue-')) {
    const n = parseInt(pageId.split('-')[1], 10);
    const lesson = PROLOGUE[n - 1];
    return lesson ? renderLesson(lesson) : `<p>ページがみつかりません。</p>`;
  }
  if (pageId.startsWith('lesson-1-')) {
    const n = parseInt(pageId.split('-')[2], 10);
    const lesson = CHAPTER1[n - 1];
    return lesson ? renderLesson(lesson) : `<p>ページがみつかりません。</p>`;
  }
  if (pageId.startsWith('game-')) {
    const id = parseInt(pageId.split('-')[1], 10);
    const game = GAMES.find(g => g.id === id);
    return renderGameLesson(game);
  }

  return `<p>ページがみつかりません。（ID: ${esc(pageId)}）</p>`;
}

function showPage(pageId) {
  const main = document.getElementById('main');
  main.innerHTML = `<div class="page">${getPageHTML(pageId)}</div>`;
  window.scrollTo(0, 0);
  updateNavHighlight(pageId);
  if (pageId === 'typing') renderScoreTable();
}

function navigate(pageId) {
  window.location.hash = pageId;
}

/* ============================================================
   6. サイドバー
   ============================================================ */

function renderSidebar() {
  const nav = document.getElementById('nav-inner');

  const c2 = CHAPTER_META[2].games.map(id => { const g=GAMES.find(x=>x.id===id); return `<div class="nav-item" data-page="game-${g.id}" onclick="navigate('game-${g.id}')">ゲーム${g.id}: ${g.title}</div>`; }).join('');
  const c3 = CHAPTER_META[3].games.map(id => { const g=GAMES.find(x=>x.id===id); return `<div class="nav-item" data-page="game-${g.id}" onclick="navigate('game-${g.id}')">ゲーム${g.id}: ${g.title}</div>`; }).join('');
  const c4 = CHAPTER_META[4].games.map(id => { const g=GAMES.find(x=>x.id===id); return `<div class="nav-item" data-page="game-${g.id}" onclick="navigate('game-${g.id}')">ゲーム${g.id}: ${g.title}</div>`; }).join('');
  const c5 = CHAPTER_META[5].games.map(id => { const g=GAMES.find(x=>x.id===id); return `<div class="nav-item" data-page="game-${g.id}" onclick="navigate('game-${g.id}')">ゲーム${g.id}: ${g.title}</div>`; }).join('');

  nav.innerHTML = `
    <div class="nav-home" data-page="home" onclick="navigate('home')">🏠 ホーム</div>
    <div class="nav-divider"></div>

    <div class="nav-chapter-header" onclick="toggleNav('prologue')">
      <span>📖 プロローグ</span><span class="nav-toggle">▼</span>
    </div>
    <div class="nav-lessons" id="nav-lessons-prologue">
      <div class="nav-item" data-page="prologue" onclick="navigate('prologue')">いちらん</div>
      ${PROLOGUE.map(l=>`<div class="nav-item" data-page="${l.id}" onclick="navigate('${l.id}')">P-${l.num} ${l.title}</div>`).join('')}
    </div>

    <div class="nav-chapter-header" onclick="toggleNav('ch1')">
      <span>📘 第1章: 概要と操作</span><span class="nav-toggle">▼</span>
    </div>
    <div class="nav-lessons" id="nav-lessons-ch1">
      <div class="nav-item" data-page="chapter1" onclick="navigate('chapter1')">いちらん</div>
      ${CHAPTER1.map(l=>`<div class="nav-item" data-page="${l.id}" onclick="navigate('${l.id}')">1-${l.num} ${l.title}</div>`).join('')}
    </div>

    <div class="nav-chapter-header" onclick="toggleNav('ch2')">
      <span>🌱 第2章: 初歩編</span><span class="nav-toggle">▼</span>
    </div>
    <div class="nav-lessons" id="nav-lessons-ch2">
      <div class="nav-item" data-page="chapter2" onclick="navigate('chapter2')">いちらん</div>
      ${c2}
    </div>

    <div class="nav-chapter-header" onclick="toggleNav('ch3')">
      <span>⭐ 第3章: 基礎編</span><span class="nav-toggle">▼</span>
    </div>
    <div class="nav-lessons" id="nav-lessons-ch3">
      <div class="nav-item" data-page="chapter3" onclick="navigate('chapter3')">いちらん</div>
      ${c3}
    </div>

    <div class="nav-chapter-header" onclick="toggleNav('ch4')">
      <span>🔥 第4章: 実践編</span><span class="nav-toggle">▼</span>
    </div>
    <div class="nav-lessons" id="nav-lessons-ch4">
      <div class="nav-item" data-page="chapter4" onclick="navigate('chapter4')">いちらん</div>
      ${c4}
    </div>

    <div class="nav-chapter-header" onclick="toggleNav('ch5')">
      <span>👑 第5章: 応用編</span><span class="nav-toggle">▼</span>
    </div>
    <div class="nav-lessons" id="nav-lessons-ch5">
      <div class="nav-item" data-page="chapter5" onclick="navigate('chapter5')">いちらん</div>
      ${c5}
    </div>

    <div class="nav-divider"></div>
    <div class="nav-item" data-page="appendix" onclick="navigate('appendix')" style="padding-left:16px">📎 付録</div>
    <div class="nav-item" data-page="typing"   onclick="navigate('typing')"   style="padding-left:16px">⌨️ タイピング</div>
  `;
}

function toggleNav(id) {
  const lessons = document.getElementById('nav-lessons-' + id);
  if (!lessons) return;
  const header = lessons.previousElementSibling;
  lessons.classList.toggle('open');
  if (header) header.classList.toggle('open');
}

function updateNavHighlight(pageId) {
  document.querySelectorAll('.nav-item, .nav-home').forEach(el => {
    el.classList.toggle('current', el.dataset.page === pageId);
  });

  // 現在のページが属するチャプターを自動で開く
  const autoOpen = {
    'prologue': 'prologue',
    'prologue-1': 'prologue', 'prologue-2': 'prologue', 'prologue-3': 'prologue', 'prologue-4': 'prologue',
    'chapter1': 'ch1',
    'lesson-1-1': 'ch1', 'lesson-1-2': 'ch1', 'lesson-1-3': 'ch1', 'lesson-1-4': 'ch1',
    'lesson-1-5': 'ch1', 'lesson-1-6': 'ch1', 'lesson-1-7': 'ch1', 'lesson-1-8': 'ch1',
    'chapter2': 'ch2', 'chapter3': 'ch3', 'chapter4': 'ch4', 'chapter5': 'ch5'
  };

  let openId = autoOpen[pageId];
  if (!openId && pageId.startsWith('game-')) {
    const gid = parseInt(pageId.split('-')[1], 10);
    const g = GAMES.find(x => x.id === gid);
    if (g) openId = 'ch' + g.chapter;
  }

  if (openId) {
    const el = document.getElementById('nav-lessons-' + openId);
    const header = el && el.previousElementSibling;
    if (el && !el.classList.contains('open')) {
      el.classList.add('open');
      if (header) header.classList.add('open');
    }
  }
}

/* ============================================================
   7. ゲームステップ切替
   ============================================================ */

function switchStep(gameId, stepNum) {
  [1, 2, 3].forEach(n => {
    const tab   = document.getElementById(`tab-${gameId}-${n}`);
    const panel = document.getElementById(`panel-${gameId}-${n}`);
    if (tab)   tab.classList.toggle('active', n === stepNum);
    if (panel) panel.classList.toggle('active', n === stepNum);
  });
}

/* ============================================================
   8. タイピングスコア
   ============================================================ */

const SCORE_KEY = 'scratch_typing_scores';

function loadScores() {
  try { return JSON.parse(localStorage.getItem(SCORE_KEY)) || []; }
  catch { return []; }
}

function saveScore(course, score) {
  const scores = loadScores();
  const now = new Date();
  const date = `${now.getMonth()+1}/${now.getDate()}`;
  scores.unshift({ date, course, score: String(score) });
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}

function renderScoreTable() {
  const tbody = document.getElementById('score-tbody');
  if (!tbody) return;
  const scores = loadScores();
  if (scores.length === 0) {
    tbody.innerHTML = `<tr class="no-score-row"><td colspan="3">まだきろくがないよ！れんしゅうしてきろくしよう！</td></tr>`;
    return;
  }
  tbody.innerHTML = scores.map(s => `
    <tr>
      <td>${esc(s.date)}</td>
      <td>${esc(s.course)}</td>
      <td>${esc(s.score)} てん</td>
    </tr>`).join('');
}

function submitScore() {
  const course = document.getElementById('score-course').value;
  const input  = document.getElementById('score-input');
  const val    = input.value.trim();
  if (!val || isNaN(val) || Number(val) < 0) {
    alert('スコアをすうじでにゅうりょくしてね！');
    return;
  }
  saveScore(course, val);
  input.value = '';
  renderScoreTable();
}

function clearScores() {
  if (!confirm('きろくをすべてけしますか？')) return;
  localStorage.removeItem(SCORE_KEY);
  renderScoreTable();
}

/* ============================================================
   9. 初期化
   ============================================================ */

window.addEventListener('hashchange', () => {
  const pageId = window.location.hash.slice(1) || 'home';
  showPage(pageId);
});

window.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  // 初期表示：プロローグを開いた状態にする
  toggleNav('prologue');
  const pageId = window.location.hash.slice(1) || 'home';
  showPage(pageId);
});
