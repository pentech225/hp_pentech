'use strict';

/* ルビヘルパー */
function rb(kanji, yomi) {
  return `<ruby>${kanji}<rt>${yomi}</rt></ruby>`;
}

/* scratchblocksブロック用 pre タグ生成 */
function sb(code) {
  return `<pre class="blocks">${code}</pre>`;
}

const CHAPTERS = [

  /* ======================================================
     もくじ
     ====================================================== */
  {
    id: 'menu',
    title: 'もくじ',
    lessons: [
      {
        id: 'menu-1',
        title: 'ようこそ！',
        voice: 'PenTechがくしゅうガイドへようこそ！まずは、マウスのれんしゅうをしてから、スクラッチをはじめましょう！',
        pose: ['up', 'front'],
        brow: 'normal',
        content: `
<h3>ようこそ！PenTech ${rb('学習','がくしゅう')}ガイドへ</h3>
<p>スクラッチプログラミングをいっしょにまなぼう！</p>

<div style="background:#fff3e0;border:3px solid #ff9800;border-radius:12px;padding:14px;margin:12px 0">
  <div style="font-weight:bold;font-size:14px;margin-bottom:10px;text-align:center">🖱️ まず${rb('最初','さいしょ')}にやってみよう！</div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <a href="https://hirara.net/gallery/ynot/swf/ecgm_Tako.html" target="_blank"
       style="display:block;background:linear-gradient(135deg,#ef5350,#b71c1c);color:white;text-decoration:none;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:bold;box-shadow:0 4px 10px rgba(183,28,28,0.35);line-height:1.6">
      🐙 たこやきゲーム<br>
      <span style="font-size:11px;font-weight:normal;opacity:0.92">タイミングよくクリックしよう！</span>
    </a>  
    <a href="https://piyocom.com/app_mole.html" target="_blank"
       style="display:block;background:linear-gradient(135deg,#ff7043,#ff9800);color:white;text-decoration:none;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:bold;box-shadow:0 4px 10px rgba(255,120,0,0.35);line-height:1.6">
      🐭 モグラたたきゲーム<br>
      <span style="font-size:11px;font-weight:normal;opacity:0.92">クリックのれんしゅうはここから！</span>
    </a>
    <a href="https://hirara.net/gallery/ynot/swf/ecgm_Kingyo.html" target="_blank"
       style="display:block;background:linear-gradient(135deg,#29b6f6,#0288d1);color:white;text-decoration:none;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:bold;box-shadow:0 4px 10px rgba(2,136,209,0.35);line-height:1.6">
      🐟 きんぎょすくいゲーム<br>
      <span style="font-size:11px;font-weight:normal;opacity:0.92">マウスをうごかすれんしゅう！</span>
    </a>
  </div>
</div>

<h4 style="margin:14px 0 6px">このガイドの${rb('内容','ないよう')}</h4>
<div style="display:flex;flex-direction:column;gap:6px">
  <div style="background:#e3f2fd;border-left:4px solid #1976d2;border-radius:6px;padding:8px 10px;font-size:12px">
    🎬 <strong>はじめてのスクラッチ</strong><br>
    <span style="color:#555">ブロックのドラッグをおぼえよう</span>
  </div>
  <div style="background:#f3e5f5;border-left:4px solid #7b1fa2;border-radius:6px;padding:8px 10px;font-size:12px">
    🔑 <strong>プロローグ</strong>（アカウント）<br>
    <span style="color:#555">サービスのかいいんしょうをつくろう</span>
  </div>
  <div style="background:#e8f5e9;border-left:4px solid #388e3c;border-radius:6px;padding:8px 10px;font-size:12px">
    🧩 <strong>${rb('第','だい')}1${rb('章','しょう')} スクラッチをはじめよう</strong><br>
    <span style="color:#555">がめんのみかた・きほんそうさ</span>
  </div>
  <div style="background:#fff8e1;border-left:4px solid #f57f17;border-radius:6px;padding:8px 10px;font-size:12px">
    🎾 <strong>テニスコース</strong><br>
    <span style="color:#555">テニスゲームをつくろう！</span>
  </div>
</div>
        `
      },
    ]
  },

  /* ======================================================
     はじめてのスクラッチ
     ====================================================== */
  {
    id: 'intro',
    title: 'はじめてのスクラッチ',
    lessons: [
      {
        id: 'intro-1',
        title: '10ほうごかしてみよう',
        voice: 'うごきのカテゴリから、じゅっぽうごかすブロックをドラッグして、コードエリアにおとしてみよう！',
        pose: ['up', 'front'],
        brow: 'normal',
        content: `
<h3>ブロックをおいてみよう！</h3>
<p>アニメーションをみながら、まねしてみよう！</p>

<div id="sca" style="position:relative;width:312px;height:250px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">

  <div id="sca-steps" style="display:flex;gap:3px;padding:5px 5px 0;flex-wrap:nowrap"></div>
  <div id="sca-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:3px 4px;font-size:12px;min-height:20px"></div>

  <div style="position:absolute;top:52px;left:4px;right:4px;bottom:4px;display:flex;border:1.5px solid #ccc;border-radius:8px;overflow:hidden;background:white">

    <div style="width:62px;background:#f9f9f9;border-right:1px solid #e0e0e0;display:flex;flex-direction:column;padding:3px 2px;gap:2px">
      <div id="sca-cat" style="padding:5px 3px;text-align:center;border-radius:4px;font-size:10px;background:#4c97ff;color:white;font-weight:bold;transition:box-shadow 0.3s">🔵 うごき</div>
      <div style="padding:5px 3px;text-align:center;font-size:10px;color:#888">🟣 みため</div>
      <div style="padding:5px 3px;text-align:center;font-size:10px;color:#888">🟡 おと</div>
      <div style="padding:5px 3px;text-align:center;font-size:10px;color:#888">🟠 イベント</div>
    </div>

    <div style="width:108px;background:#f5f5f5;border-right:1px solid #e0e0e0;padding:5px 3px;display:flex;flex-direction:column;gap:3px">
      <div id="sca-blk" style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:10px;font-weight:bold;transition:box-shadow 0.3s,opacity 0.3s">▶ 10ほうごかす</div>
      <div style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:10px;opacity:0.35">↻ 15どまわす</div>
      <div style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:10px;opacity:0.35">↕ yざひょうをかえる</div>
    </div>

    <div style="flex:1;background:#f9f9f9;position:relative;display:flex;align-items:center;justify-content:center">
      <div id="sca-hint" style="color:#bbb;font-size:10px;text-align:center;border:2px dashed #ccc;border-radius:6px;padding:8px 6px;line-height:1.8;transition:opacity 0.4s">ここに<br>おとそう！</div>
      <div id="sca-placed" style="display:none;background:#4c97ff;color:white;padding:5px 8px;border-radius:6px;font-size:10px;font-weight:bold;position:absolute">▶ 10ほうごかす</div>
    </div>

  </div>

  <div id="sca-cur" style="position:absolute;top:60px;left:8px;font-size:18px;pointer-events:none;z-index:10;transition:top 0.7s cubic-bezier(.4,0,.2,1),left 0.7s cubic-bezier(.4,0,.2,1)">👆</div>
  <div id="sca-drag" style="position:absolute;top:78px;left:74px;background:#4c97ff;color:white;padding:5px 8px;border-radius:6px;font-size:10px;font-weight:bold;opacity:0;pointer-events:none;z-index:20;box-shadow:0 4px 12px rgba(76,151,255,0.6);transition:top 0.8s cubic-bezier(.4,0,.2,1),left 0.8s cubic-bezier(.4,0,.2,1),opacity 0.25s">▶ 10ほうごかす</div>

</div>

<style>
.sca-step{padding:2px 7px;border-radius:10px;background:#dde6ff;color:#6680cc;font-size:10px;font-weight:bold;white-space:nowrap}
.sca-step-on{background:#4c97ff;color:white}
#sca-cat.sca-glow{box-shadow:0 0 0 3px #fff,0 0 0 5px #4c97ff}
#sca-blk.sca-glow{box-shadow:0 0 0 3px #fff,0 0 0 6px #ff8c1a}
</style>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            { id:'sca-s0', label:'① えらぶ' },
            { id:'sca-s1', label:'② みつける' },
            { id:'sca-s2', label:'③ ドラッグ' },
            { id:'sca-s3', label:'④ かんせい！' },
          ];
          const stepsEl = $('sca-steps');
          if (stepsEl) {
            stepsEl.innerHTML = steps.map(s =>
              `<span id="${s.id}" class="sca-step">${s.label}</span>`
            ).join('');
          }
          const timers = [];
          const T = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };
          let loopId = null;
          const msg    = $('sca-msg');
          const cat    = $('sca-cat');
          const blk    = $('sca-blk');
          const cur    = $('sca-cur');
          const drag   = $('sca-drag');
          const hint   = $('sca-hint');
          const placed = $('sca-placed');
          if (!msg) return null;
          const setStep = n => steps.forEach((s,i) => {
            const el = $(s.id);
            if (el) el.className = 'sca-step' + (i===n?' sca-step-on':'');
          });
          const moveCur = (l,t) => { cur.style.left=l+'px'; cur.style.top=t+'px'; };

          function run() {
            cat.classList.remove('sca-glow');
            blk.classList.remove('sca-glow');
            blk.style.opacity = '1';
            drag.style.opacity = '0';
            drag.style.transition = 'none';
            drag.style.left = '74px'; drag.style.top = '78px';
            placed.style.display = 'none';
            hint.style.opacity = '1';
            setStep(0);
            msg.textContent = '「うごき」をクリックしよう！';
            cur.style.transition = 'none';
            moveCur(8, 60);

            T(() => {
              cur.style.transition = 'top 0.7s cubic-bezier(.4,0,.2,1),left 0.7s cubic-bezier(.4,0,.2,1)';
              moveCur(26, 68);
            }, 200);
            T(() => { cat.classList.add('sca-glow'); }, 900);
            T(() => {
              setStep(1);
              msg.textContent = '「10ほうごかす」をみつけよう！';
              moveCur(116, 68);
            }, 2000);
            T(() => { blk.classList.add('sca-glow'); }, 2700);
            T(() => {
              setStep(2);
              msg.textContent = 'コードエリアへドラッグ！';
              blk.style.opacity = '0.3';
              drag.style.transition = 'none';
              drag.style.opacity = '1';
              drag.style.left = '74px'; drag.style.top = '76px';
            }, 3600);
            T(() => {
              drag.style.transition = 'top 0.85s cubic-bezier(.4,0,.2,1),left 0.85s cubic-bezier(.4,0,.2,1)';
              drag.style.left = '210px'; drag.style.top = '110px';
              moveCur(226, 118);
            }, 4100);
            T(() => {
              setStep(3);
              msg.textContent = '🎉 かんせい！うごくよ！';
              drag.style.opacity = '0';
              placed.style.display = 'block';
              hint.style.opacity = '0';
              blk.classList.remove('sca-glow');
              blk.style.opacity = '1';
            }, 5200);
            T(() => {
              placed.style.display = 'none';
              hint.style.opacity = '1';
              cat.classList.remove('sca-glow');
            }, 7800);
          }

          run();
          loopId = setInterval(run, 8200);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },
    ]
  },

  /* ======================================================
     プロローグ
     ====================================================== */
  {
    id: 'prologue',
    title: 'プロローグ',
    lessons: [
      {
        id: 'prologue-1',
        title: 'アカウントってなに？',
        voice: 'アカウントとは、インターネットのサービスにはいるための、かいいんしょうのようなものです！ユーザーめいとパスワードのふたつがあれば、サインインできますよ！',
        pose: ['front', 'up'],
        brow: 'normal',
        content: `
          <h3>アカウントってなに？</h3>
          <p>アカウントとは、インターネットの${rb('サービス','さーびす')}にはいるための「かいいんしょう」のようなものです。</p>
          <ul>
            <li>👤 <strong>ユーザーめい</strong>… じぶんのなまえ（ニックネームでもOK）</li>
            <li>🔑 <strong>パスワード</strong>… ひみつのことば</li>
          </ul>
          <h3>スクラッチとアカウント</h3>
          <p>アカウントをつくると、つぎのことができます！</p>
          <ul>
            <li>✅ じぶんでつくったゲームをほぞんする</li>
            <li>✅ ほかのひとのゲームを${rb('改造','かいぞう')}する</li>
            <li>✅ せかい中のひととシェアする</li>
          </ul>
        `
      },
      {
        id: 'prologue-3',
        title: 'パスワードのたいせつさ',
        voice: 'パスワードはぜったいにほかのひとにおしえてはいけません！ともだちにもひみつにしておきましょう！',
        pose: ['chest', 'front'],
        brow: 'strong',
        content: `
          <h3>パスワードのたいせつさ</h3>
          <div style="background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:12px;margin:8px 0">
            <strong>🚫 パスワードは、ぜったいにほかのひとにおしえてはいけません！</strong>
          </div>
          <h3>いいパスワードのれい</h3>
          <ul>
            <li>✅ Neko2024! （${rb('大文字','おおもじ')}・すうじ・${rb('記号','きごう')}がまざっている）</li>
            <li>❌ 123456 （かんたんすぎる）</li>
            <li>❌ じぶんのなまえ （あてられやすい）</li>
          </ul>
        `
      },
    ]
  },

  /* ======================================================
     第1章
     ====================================================== */
  {
    id: 'chapter1',
    title: `${rb('第','だい')}1${rb('章','しょう')} スクラッチをはじめよう`,
    lessons: [
      {
        id: 'lesson-1-1',
        title: 'スクラッチとは',
        voice: 'スクラッチは、ブロックをくみあわせてゲームやアニメーションをつくれる、プログラミングのツールです！むずかしいコードはかかなくていいよ！',
        pose: ['up', 'front'],
        brow: 'normal',
        content: `
          <h3>スクラッチとは？</h3>
          <p>スクラッチは、MITメディアラボが${rb('開発','かいはつ')}した${rb('無料','むりょう')}のプログラミング${rb('学習','がくしゅう')}ツールです。</p>
          <ul>
            <li>🧩 ブロックをくみあわせてプログラムをつくる</li>
            <li>🎮 ゲームやアニメーションがつくれる</li>
            <li>🌏 ${rb('世界中','せかいじゅう')}のこどもたちがつかっている</li>
          </ul>
        `
      },
      {
        id: 'lesson-1-3',
        title: 'スクラッチのがめん',
        voice: 'スクラッチのがめんは3つのエリアにわかれています。ひだりのブロックエリア、まんなかのコードエリア、そしてみぎのステージです！',
        pose: ['side', 'front'],
        brow: 'normal',
        content: `
          <h3>スクラッチのがめんをみてみよう</h3>
          <p>スクラッチのがめんは大きく3つにわかれています：</p>
          <ul>
            <li>🟦 <strong>ブロックエリア</strong>（ひだり）… つかえるブロックがならんでいる</li>
            <li>⬜ <strong>コードエリア</strong>（まんなか）… ブロックをくみあわせるばしょ</li>
            <li>🟩 <strong>ステージ</strong>（みぎ）… プログラムがうごくばしょ</li>
          </ul>
        `
      },
    ]
  },

  /* ======================================================
     うごきのきほん
     ====================================================== */
  {
    id: 'motion',
    title: 'うごきのきほん',
    lessons: [

      /* ---- motion-1: ステージってどこ？ ---- */
      {
        id: 'motion-1',
        title: 'ステージってどこ？',
        voice: 'スクラッチのステージには、よこのエックスじくと、たてのワイじくがあります！まんなかの０、０がスタートのばしょです！',
        pose: ['side', 'front'],
        brow: 'normal',
        content: `
<h3>ステージのざひょう</h3>
<p><strong>x（よこ）</strong> と <strong>y（たて）</strong> のじくで、ばしょをあらわします。</p>

<div id="m1" style="position:relative;width:296px;height:196px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m1-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m1-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="position:relative;margin:2px auto;width:270px;height:142px;border:1.5px solid #ccc;border-radius:6px;background:white;overflow:hidden">
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 34px,#f0f0f0 34px,#f0f0f0 35px),repeating-linear-gradient(90deg,transparent,transparent 66px,#f0f0f0 66px,#f0f0f0 67px)"></div>
    <div id="m1-xa" style="position:absolute;top:70px;left:0;right:0;height:2px;background:#4c97ff;opacity:0.3;transition:opacity 0.4s"></div>
    <div id="m1-ya" style="position:absolute;top:0;bottom:0;left:134px;width:2px;background:#ff6b6b;opacity:0.3;transition:opacity 0.4s"></div>
    <div style="position:absolute;right:3px;top:55px;font-size:9px;font-weight:bold;color:#4c97ff">x →</div>
    <div style="position:absolute;top:2px;left:138px;font-size:9px;font-weight:bold;color:#ff6b6b">↑ y</div>
    <div id="m1-glow" style="position:absolute;top:58px;left:122px;width:24px;height:24px;border-radius:50%;background:radial-gradient(circle,rgba(255,215,0,0.9),transparent);opacity:0;transition:opacity 0.4s;pointer-events:none"></div>
    <div id="m1-origin" style="position:absolute;top:73px;left:118px;font-size:8px;color:#888">(0,0)</div>
    <div id="m1-cat" style="position:absolute;top:58px;left:122px;font-size:20px;transition:all 0.9s cubic-bezier(.4,0,.2,1)">🐱</div>
    <div id="m1-coord" style="position:absolute;bottom:3px;right:4px;font-size:9px;background:rgba(255,255,255,0.95);padding:1px 5px;border-radius:4px;color:#333;border:1px solid #ddd"></div>
  </div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>🔵 <strong>x</strong>… みぎ＋ / ひだり－</li>
  <li>🔴 <strong>y</strong>… うえ＋ / した－</li>
  <li>⭐ まんなか＝ <strong>(0, 0)</strong></li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            {id:'m1-s0',label:'① xじく'},
            {id:'m1-s1',label:'② yじく'},
            {id:'m1-s2',label:'③ げんてん'},
            {id:'m1-s3',label:'④ うごく！'},
          ];
          const stEl = $('m1-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m1-msg'), cat = $('m1-cat'), glow = $('m1-glow'),
                coord = $('m1-coord'), xa = $('m1-xa'), ya = $('m1-ya');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });
          const moveCat = (l, t, cx, cy) => { cat.style.left = l + 'px'; cat.style.top = t + 'px'; coord.textContent = 'x:' + cx + ', y:' + cy; };

          function run() {
            xa.style.opacity = '0.3'; ya.style.opacity = '0.3'; glow.style.opacity = '0';
            cat.style.transition = 'none'; moveCat(122, 58, 0, 0); coord.textContent = '';
            setStep(0); msg.textContent = 'よこのじくが x（エックス）！';
            T(() => xa.style.opacity = '1', 400);
            T(() => { setStep(1); msg.textContent = 'たてのじくが y（ワイ）！'; xa.style.opacity = '0.5'; ya.style.opacity = '1'; }, 2200);
            T(() => { setStep(2); msg.textContent = 'まんなかが (0,0) のげんてん！'; ya.style.opacity = '0.5'; glow.style.opacity = '1'; coord.textContent = 'x:0, y:0'; }, 4200);
            T(() => { setStep(3); msg.textContent = 'みぎへ！ x がふえる！'; glow.style.opacity = '0'; cat.style.transition = 'all 0.9s cubic-bezier(.4,0,.2,1)'; moveCat(190, 58, 120, 0); }, 6200);
            T(() => { msg.textContent = 'うえへ！ y がふえる！'; moveCat(190, 12, 120, 60); }, 7900);
            T(() => { msg.textContent = 'げんてんにもどった！'; moveCat(122, 58, 0, 0); glow.style.opacity = '1'; }, 9500);
            T(() => glow.style.opacity = '0', 11000);
          }
          run(); loopId = setInterval(run, 12000);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

      /* ---- motion-2: まっすぐすすもう ---- */
      {
        id: 'motion-2',
        title: 'まっすぐすすもう',
        voice: 'じゅっぽうごかすブロックをクリックするたびに、ネコがみぎへすすみます！すうじをおおきくすると、いっきにとおくすすめるよ！',
        pose: ['up', 'front'],
        brow: 'normal',
        content: `
<h3>クリックするたびにすすむ！</h3>
<p>「10ほうごかす」ブロックをクリックするたびに、ネコがみぎへすすみます。</p>

<div id="m2" style="position:relative;width:296px;height:196px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m2-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m2-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="position:absolute;top:48px;left:4px;right:4px;bottom:4px;display:flex;border:1.5px solid #ccc;border-radius:8px;overflow:hidden;background:white">
    <div style="flex:1;background:#f9f9f9;position:relative;display:flex;align-items:center;justify-content:center">
      <div id="m2-blk" style="background:#4c97ff;color:white;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:bold;box-shadow:0 2px 6px rgba(76,151,255,0.4);transition:transform 0.15s">▶ 10ほうごかす</div>
    </div>
    <div style="width:130px;background:#fff;border-left:1px solid #e0e0e0;position:relative;overflow:hidden">
      <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:#a8e6cf"></div>
      <div id="m2-cat" style="position:absolute;bottom:10px;left:8px;font-size:22px;transition:left 0.5s cubic-bezier(.4,0,.2,1)">🐱</div>
    </div>
  </div>
  <div id="m2-cur" style="position:absolute;top:86px;left:80px;font-size:16px;pointer-events:none;z-index:10;transition:all 0.5s cubic-bezier(.4,0,.2,1)">👆</div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>▶ ブロックを<strong>クリック</strong>するとネコがうごく</li>
  <li>🔢 すうじをかえると、うごくほうすうもかわる</li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            {id:'m2-s0',label:'① ブロック'},
            {id:'m2-s1',label:'② クリック'},
            {id:'m2-s2',label:'③ すすむ！'},
          ];
          const stEl = $('m2-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m2-msg'), cat = $('m2-cat'), cur = $('m2-cur'), blk = $('m2-blk');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });
          let catPos = 8;

          const clickBlk = () => {
            blk.style.transform = 'scale(0.9)';
            T(() => blk.style.transform = 'scale(1)', 150);
            catPos = Math.min(catPos + 28, 96);
            cat.style.left = catPos + 'px';
          };

          function run() {
            cat.style.transition = 'none'; catPos = 8; cat.style.left = '8px';
            cur.style.transition = 'none'; cur.style.left = '80px'; cur.style.top = '86px';
            setStep(0); msg.textContent = 'ブロックがコードエリアにあるよ！';
            T(() => { setStep(1); msg.textContent = 'ブロックをクリック！'; cur.style.transition = 'all 0.5s cubic-bezier(.4,0,.2,1)'; cur.style.left = '88px'; cur.style.top = '94px'; }, 1200);
            T(() => { setStep(2); msg.textContent = '🐱 すすんだ！'; cat.style.transition = 'left 0.5s cubic-bezier(.4,0,.2,1)'; clickBlk(); }, 2000);
            T(() => { msg.textContent = 'もういちどクリック！'; clickBlk(); }, 3100);
            T(() => { msg.textContent = '🎉 どんどんすすむ！'; clickBlk(); }, 4200);
          }
          run(); loopId = setInterval(run, 7000);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

      /* ---- motion-3: むきをかえよう ---- */
      {
        id: 'motion-3',
        title: 'むきをかえよう',
        voice: 'むきをどにするブロックで、ネコのむかうほうこうをかえられます！みぎは90ど、うえは0ど、ひだりはマイナス90ど、したは180どです！',
        pose: ['front', 'up'],
        brow: 'normal',
        content: `
<h3>むきを○どにする</h3>
<p>ネコがむかうほうこうは<strong>「ど（°）」</strong>であらわします。</p>

<div id="m3" style="position:relative;width:296px;height:210px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m3-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m3-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="display:flex;gap:8px;padding:4px 10px;align-items:flex-start">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;width:138px">
      <div id="m3-d0"   style="background:#e3f2fd;border:2px solid #90caf9;border-radius:8px;padding:6px 4px;text-align:center;font-size:10px;font-weight:bold;transition:all 0.3s">⬆️ うえ<br><span style="font-size:9px;color:#666">0°</span></div>
      <div id="m3-d90"  style="background:#e3f2fd;border:2px solid #90caf9;border-radius:8px;padding:6px 4px;text-align:center;font-size:10px;font-weight:bold;transition:all 0.3s">➡️ みぎ<br><span style="font-size:9px;color:#666">90°</span></div>
      <div id="m3-dm90" style="background:#e3f2fd;border:2px solid #90caf9;border-radius:8px;padding:6px 4px;text-align:center;font-size:10px;font-weight:bold;transition:all 0.3s">⬅️ ひだり<br><span style="font-size:9px;color:#666">-90°</span></div>
      <div id="m3-d180" style="background:#e3f2fd;border:2px solid #90caf9;border-radius:8px;padding:6px 4px;text-align:center;font-size:10px;font-weight:bold;transition:all 0.3s">⬇️ した<br><span style="font-size:9px;color:#666">180°</span></div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:10px">
      <div id="m3-arrow" style="font-size:30px;transition:transform 0.6s ease">➡️</div>
      <div id="m3-cat" style="font-size:26px">🐱</div>
      <div id="m3-deg" style="font-size:11px;font-weight:bold;color:#4c97ff;background:white;padding:2px 8px;border-radius:6px;border:1px solid #90caf9;min-width:40px;text-align:center"></div>
    </div>
  </div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>➡️ <strong>90°</strong>… みぎ（さいしょのむき）</li>
  <li>⬆️ <strong>0°</strong>… うえ &nbsp; ⬅️ <strong>-90°</strong>… ひだり &nbsp; ⬇️ <strong>180°</strong>… した</li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const dirs = [
            {id:'m3-d90',  label:'みぎ',   deg:'90°',  rot:0},
            {id:'m3-d0',   label:'うえ',   deg:'0°',   rot:-90},
            {id:'m3-dm90', label:'ひだり', deg:'-90°', rot:180},
            {id:'m3-d180', label:'した',   deg:'180°', rot:90},
          ];
          const allDirIds = ['m3-d0','m3-d90','m3-dm90','m3-d180'];
          const steps = [
            {id:'m3-s0',label:'① みぎ'},
            {id:'m3-s1',label:'② うえ'},
            {id:'m3-s2',label:'③ ひだり'},
            {id:'m3-s3',label:'④ した'},
          ];
          const stEl = $('m3-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m3-msg'), arrow = $('m3-arrow'), degEl = $('m3-deg');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });
          const resetDirs = () => allDirIds.forEach(id => { const el = $(id); if (el) { el.style.background = '#e3f2fd'; el.style.borderColor = '#90caf9'; } });
          const highlight = id => { const el = $(id); if (el) { el.style.background = '#bbdefb'; el.style.borderColor = '#1976d2'; } };

          function showDir(i) {
            const d = dirs[i];
            resetDirs(); highlight(d.id);
            setStep(i);
            msg.textContent = d.label + 'は ' + d.deg + '！';
            arrow.style.transform = 'rotate(' + d.rot + 'deg)';
            degEl.textContent = d.deg;
          }

          function run() {
            resetDirs(); arrow.style.transition = 'none'; arrow.style.transform = 'rotate(0deg)';
            degEl.textContent = ''; msg.textContent = 'ネコのむきをかえてみよう！';
            T(() => { arrow.style.transition = 'transform 0.6s ease'; showDir(0); }, 600);
            T(() => showDir(1), 2800);
            T(() => showDir(2), 5000);
            T(() => showDir(3), 7200);
            T(() => { resetDirs(); msg.textContent = 'ブロックのかずをかえるだけ！'; degEl.textContent = ''; }, 9400);
          }
          run(); loopId = setInterval(run, 11000);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

      /* ---- motion-4: くるくるまわろう ---- */
      {
        id: 'motion-4',
        title: 'くるくるまわろう',
        voice: 'まわすブロックで、ネコをくるくるまわせます！プラスのかずで時計まわり、マイナスのかずで反時計まわりです！',
        pose: ['up', 'front'],
        brow: 'normal',
        content: `
<h3>15どまわす</h3>
<p>「まわす」ブロックでネコをじぶんのまわりにくるくるまわせます。</p>

<div id="m4" style="position:relative;width:296px;height:196px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m4-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m4-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="display:flex;gap:10px;padding:4px 16px;align-items:center;height:128px">
    <div style="display:flex;flex-direction:column;gap:5px">
      <div id="m4-blk-r" style="background:#4c97ff;color:white;padding:6px 10px;border-radius:6px;font-size:10px;font-weight:bold;transition:all 0.2s;white-space:nowrap">↻ 15どまわす</div>
      <div id="m4-blk-l" style="background:#4c97ff;color:white;padding:6px 10px;border-radius:6px;font-size:10px;font-weight:bold;transition:all 0.2s;white-space:nowrap;opacity:0.45">↺ -15どまわす</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px">
      <div id="m4-cat" style="font-size:36px;display:inline-block;transform-origin:center">🐱</div>
      <div id="m4-deg" style="font-size:10px;color:#555;background:white;padding:2px 6px;border-radius:4px;border:1px solid #ddd">0°</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      <div id="m4-cw"  style="font-size:20px;opacity:0.3;transition:opacity 0.3s">🔃</div>
      <div style="font-size:9px;color:#888;text-align:center">時計<br>まわり</div>
      <div id="m4-ccw" style="font-size:20px;opacity:0.3;transition:opacity 0.3s">🔄</div>
      <div style="font-size:9px;color:#888;text-align:center">反時計<br>まわり</div>
    </div>
  </div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>↻ <strong>プラスのかず</strong>… 時計まわり（みぎまわり）</li>
  <li>↺ <strong>マイナスのかず</strong>… 反時計まわり（ひだりまわり）</li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            {id:'m4-s0',label:'① 時計まわり'},
            {id:'m4-s1',label:'② 反時計'},
            {id:'m4-s2',label:'③ もどる'},
          ];
          const stEl = $('m4-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m4-msg'), cat = $('m4-cat'), degEl = $('m4-deg'),
                blkR = $('m4-blk-r'), blkL = $('m4-blk-l'),
                cw = $('m4-cw'), ccw = $('m4-ccw');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });
          let rot = 0;

          function run() {
            rot = 0;
            cat.style.transition = 'none'; cat.style.transform = 'rotate(0deg)';
            degEl.textContent = '0°';
            blkR.style.opacity = '1'; blkL.style.opacity = '0.45';
            cw.style.opacity = '0.3'; ccw.style.opacity = '0.3';
            setStep(0); msg.textContent = '↻ プラスは時計まわり！';
            T(() => {
              blkR.style.transform = 'scale(0.9)';
              T(() => blkR.style.transform = 'scale(1)', 150);
              cw.style.opacity = '1';
              cat.style.transition = 'transform 2.5s linear';
              rot += 180; cat.style.transform = 'rotate(' + rot + 'deg)';
              degEl.textContent = '180°';
            }, 800);
            T(() => {
              setStep(1); msg.textContent = '↺ マイナスは反時計まわり！';
              blkR.style.opacity = '0.45'; blkL.style.opacity = '1';
              cw.style.opacity = '0.3'; ccw.style.opacity = '1';
            }, 3600);
            T(() => {
              blkL.style.transform = 'scale(0.9)';
              T(() => blkL.style.transform = 'scale(1)', 150);
              cat.style.transition = 'transform 2.5s linear';
              rot -= 180; cat.style.transform = 'rotate(' + rot + 'deg)';
              degEl.textContent = '0°';
            }, 4400);
            T(() => {
              setStep(2); msg.textContent = '🎉 もどった！ くりかえせるよ！';
              blkL.style.opacity = '0.45'; ccw.style.opacity = '0.3';
            }, 7200);
          }
          run(); loopId = setInterval(run, 9000);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

      /* ---- motion-5: ばしょへワープ！ ---- */
      {
        id: 'motion-5',
        title: 'ばしょへワープ！',
        voice: 'エックスざひょうをマルマル、ワイざひょうをマルマルにするブロックで、ネコをしていのばしょへワープさせられます！',
        pose: ['side', 'front'],
        brow: 'normal',
        content: `
<h3>x:○ y:○ にする</h3>
<p><strong>x</strong> と <strong>y</strong> のざひょうをしていして、ネコをワープさせよう！</p>

<div id="m5" style="position:relative;width:296px;height:210px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m5-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m5-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="display:flex;gap:6px;padding:4px 8px">
    <div style="width:112px;display:flex;flex-direction:column;gap:4px;padding-top:6px">
      <div id="m5-blk" style="background:#4c97ff;color:white;padding:6px 6px;border-radius:6px;font-size:9.5px;font-weight:bold;transition:all 0.2s;line-height:1.7">
        xざひょうを <span id="m5-vx" style="background:white;color:#333;padding:1px 4px;border-radius:3px;font-weight:bold">0</span> 、<br>
        yざひょうを <span id="m5-vy" style="background:white;color:#333;padding:1px 4px;border-radius:3px;font-weight:bold">0</span> にする
      </div>
      <div style="font-size:9px;color:#888;text-align:center;line-height:1.5">↑ ざひょうをかえると<br>ネコがワープ！</div>
    </div>
    <div style="flex:1;position:relative;border:1.5px solid #ccc;border-radius:6px;background:white;overflow:hidden;min-height:130px">
      <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 31px,#f5f5f5 31px,#f5f5f5 32px),repeating-linear-gradient(90deg,transparent,transparent 44px,#f5f5f5 44px,#f5f5f5 45px)"></div>
      <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#e0e0e0"></div>
      <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#e0e0e0"></div>
      <div id="m5-target" style="position:absolute;font-size:14px;opacity:0;transition:opacity 0.4s;z-index:1">⭐</div>
      <div id="m5-cat" style="position:absolute;font-size:20px;z-index:2">🐱</div>
      <div id="m5-label" style="position:absolute;bottom:2px;right:3px;font-size:8px;background:rgba(255,255,255,0.95);padding:1px 4px;border-radius:3px;border:1px solid #eee"></div>
    </div>
  </div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>🌀 ざひょうをしていするとすぐワープ！</li>
  <li>🎯 x:0 y:0 はまんなか（げんてん）</li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            {id:'m5-s0',label:'① いまのばしょ'},
            {id:'m5-s1',label:'② ざひょうをしてい'},
            {id:'m5-s2',label:'③ ワープ！'},
          ];
          const stEl = $('m5-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m5-msg'), cat = $('m5-cat'), target = $('m5-target'),
                vx = $('m5-vx'), vy = $('m5-vy'), blk = $('m5-blk'), label = $('m5-label');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });
          const toP = (sx, sy) => ({ l: Math.round(70 + sx * 0.27), t: Math.round(55 - sy * 0.27) });
          const poses = [
            {sx:0,  sy:0,   tx:'0',    ty:'0'},
            {sx:90, sy:55,  tx:'90',   ty:'55'},
            {sx:-70,sy:-45, tx:'-70',  ty:'-45'},
            {sx:60, sy:-65, tx:'60',   ty:'-65'},
          ];

          function run() {
            const p0 = toP(0, 0);
            cat.style.transition = 'none'; cat.style.left = p0.l + 'px'; cat.style.top = p0.t + 'px';
            target.style.opacity = '0'; label.textContent = 'x:0, y:0';
            vx.textContent = '0'; vy.textContent = '0';
            setStep(0); msg.textContent = 'いまのばしょは (0, 0) だよ！';

            const seq = poses.slice(1);
            seq.forEach((p, i) => {
              const base = i * 4200;
              T(() => {
                setStep(1);
                msg.textContent = 'ざひょうをかえるよ！x:' + p.tx + ' y:' + p.ty;
                const tp = toP(p.sx, p.sy);
                target.style.left = tp.l + 'px'; target.style.top = tp.t + 'px';
                target.style.opacity = '1';
                vx.textContent = p.tx; vy.textContent = p.ty;
                blk.style.boxShadow = '0 0 0 3px #fff,0 0 0 5px #4c97ff';
              }, base + 1400);
              T(() => {
                setStep(2); msg.textContent = '⚡ ワープ！';
                blk.style.boxShadow = '';
                const tp = toP(p.sx, p.sy);
                cat.style.transition = 'all 0.5s cubic-bezier(.4,0,.2,1)';
                cat.style.left = tp.l + 'px'; cat.style.top = tp.t + 'px';
                target.style.opacity = '0';
                label.textContent = 'x:' + p.tx + ', y:' + p.ty;
              }, base + 3000);
            });
          }
          run(); loopId = setInterval(run, 13500);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

      /* ---- motion-6: マウスをおいかけよう ---- */
      {
        id: 'motion-6',
        title: 'マウスをおいかけよう',
        voice: 'マウスのポインターへむけるブロックと、じゅっぽうごかすブロックをくみあわせると、ネコがマウスをおいかけます！',
        pose: ['up', 'front'],
        brow: 'normal',
        content: `
<h3>マウスをおいかけよう</h3>
<p>2つのブロックをあわせると、ネコがマウスを<strong>ずっとおいかける</strong>！</p>

<div id="m6" style="position:relative;width:296px;height:210px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m6-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m6-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="display:flex;gap:6px;padding:4px 8px">
    <div style="width:118px;display:flex;flex-direction:column;gap:3px;padding-top:4px">
      <div id="m6-b1" style="background:#9c27b0;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold;opacity:0.45;transition:opacity 0.3s">🔁 ずっと</div>
      <div id="m6-b2" style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold;margin-left:10px;opacity:0.45;transition:opacity 0.3s">🖱️ マウスへむける</div>
      <div id="m6-b3" style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold;margin-left:10px;opacity:0.45;transition:opacity 0.3s">▶ 10ほうごかす</div>
      <div style="background:#9c27b0;color:white;padding:3px 7px;border-radius:0 0 6px 6px;font-size:9px;font-weight:bold;opacity:0.45">end</div>
    </div>
    <div style="flex:1;position:relative;border:1.5px solid #ccc;border-radius:6px;background:white;overflow:hidden">
      <div id="m6-mouse" style="position:absolute;font-size:14px;transition:all 1.2s cubic-bezier(.4,0,.2,1);z-index:2;top:10px;left:70px">🖱️</div>
      <div id="m6-cat" style="position:absolute;font-size:22px;z-index:1;top:40px;left:30px;transition:all 1s cubic-bezier(.4,0,.2,1)">🐱</div>
    </div>
  </div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>🖱️ <strong>マウスへむける</strong>… カーソルのほうをむく</li>
  <li>▶ <strong>10ほうごかす</strong>… むいたほうへすすむ</li>
  <li>🔁 <strong>ずっと</strong>… くりかえすからずっとおいかける！</li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            {id:'m6-s0',label:'① ブロック'},
            {id:'m6-s1',label:'② マウスうごく'},
            {id:'m6-s2',label:'③ おいかける！'},
          ];
          const stEl = $('m6-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m6-msg'), cat = $('m6-cat'), mouse = $('m6-mouse'),
                b1 = $('m6-b1'), b2 = $('m6-b2'), b3 = $('m6-b3');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });

          function run() {
            cat.style.transition = 'none'; cat.style.left = '30px'; cat.style.top = '40px';
            mouse.style.transition = 'none'; mouse.style.left = '70px'; mouse.style.top = '10px';
            [b1, b2, b3].forEach(b => { if (b) b.style.opacity = '0.4'; });
            setStep(0); msg.textContent = 'このブロックをくみあわせよう！';

            T(() => { [b1, b2, b3].forEach(b => { if (b) b.style.opacity = '1'; }); setStep(1); msg.textContent = '🖱️ マウスがうごいた！'; mouse.style.transition = 'all 1.2s cubic-bezier(.4,0,.2,1)'; mouse.style.left = '10px'; mouse.style.top = '60px'; }, 1500);
            T(() => { setStep(2); msg.textContent = '🐱 ネコがおいかける！'; cat.style.transition = 'all 1s cubic-bezier(.4,0,.2,1)'; cat.style.left = '18px'; cat.style.top = '54px'; }, 2900);
            T(() => { msg.textContent = 'またマウスがうごいた！'; mouse.style.left = '80px'; mouse.style.top = '75px'; }, 4300);
            T(() => { msg.textContent = '🐱 ついてくよ！'; cat.style.left = '52px'; cat.style.top = '66px'; }, 5700);
            T(() => { msg.textContent = 'もういちど！'; mouse.style.left = '20px'; mouse.style.top = '20px'; }, 7100);
            T(() => { msg.textContent = '🎉 ずっとおいかけるよ！'; cat.style.left = '24px'; cat.style.top = '28px'; }, 8500);
          }
          run(); loopId = setInterval(run, 11000);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

      /* ---- motion-7: かべではねかえろう ---- */
      {
        id: 'motion-7',
        title: 'かべではねかえろう',
        voice: 'はしにふれたらはねかえるブロックをつかうと、ネコがステージのはしにとどいたとき、じどうではんたいむきにむきをかえます！',
        pose: ['front', 'up'],
        brow: 'normal',
        content: `
<h3>はしにふれたらはねかえる</h3>
<p>ステージのはしにとどいたら、<strong>じどうでむきがかわります</strong>！</p>

<div id="m7" style="position:relative;width:296px;height:200px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m7-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m7-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="display:flex;gap:8px;padding:4px 10px">
    <div style="width:110px;display:flex;flex-direction:column;gap:3px;padding-top:4px">
      <div style="background:#9c27b0;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold">🔁 ずっと</div>
      <div style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold;margin-left:10px">▶ 10ほうごかす</div>
      <div id="m7-blk2" style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold;margin-left:10px;transition:box-shadow 0.3s">🔀 はしではね返る</div>
      <div style="background:#9c27b0;color:white;padding:3px 7px;border-radius:0 0 6px 6px;font-size:9px;font-weight:bold">end</div>
    </div>
    <div style="flex:1;position:relative;border:2.5px solid #ccc;border-radius:6px;background:white;overflow:hidden;min-height:118px">
      <div id="m7-wall-r" style="position:absolute;top:0;right:0;bottom:0;width:4px;background:#ff6b6b;opacity:0;transition:opacity 0.2s"></div>
      <div id="m7-wall-l" style="position:absolute;top:0;left:0;bottom:0;width:4px;background:#ff6b6b;opacity:0;transition:opacity 0.2s"></div>
      <div id="m7-cat" style="position:absolute;font-size:24px;top:38px;left:8px;transition:left 1.8s linear">🐱</div>
    </div>
  </div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>🔀 はしにとどいたら<strong>じどうではんたい</strong>にむく</li>
  <li>💡 「さゆうのみ」といっしょにつかうと自然にみえる</li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            {id:'m7-s0',label:'① みぎへ'},
            {id:'m7-s1',label:'② かべ！'},
            {id:'m7-s2',label:'③ はねかえる！'},
            {id:'m7-s3',label:'④ くりかえし'},
          ];
          const stEl = $('m7-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m7-msg'), cat = $('m7-cat'),
                wallR = $('m7-wall-r'), wallL = $('m7-wall-l'), blk2 = $('m7-blk2');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });

          function run() {
            cat.style.transition = 'none'; cat.style.left = '8px'; cat.style.transform = 'scaleX(1)';
            wallR.style.opacity = '0'; wallL.style.opacity = '0';
            setStep(0); msg.textContent = 'みぎへすすむ！';
            T(() => { cat.style.transition = 'left 1.9s linear'; cat.style.left = '112px'; }, 400);
            T(() => { setStep(1); msg.textContent = '🚨 かべにとどいた！'; wallR.style.opacity = '1'; blk2.style.boxShadow = '0 0 0 2px #fff,0 0 0 4px #ff8c1a'; }, 2300);
            T(() => { setStep(2); msg.textContent = '🔀 はんたいむきにはねかえる！'; wallR.style.opacity = '0'; blk2.style.boxShadow = ''; cat.style.transition = 'none'; cat.style.transform = 'scaleX(-1)'; cat.style.transition = 'left 1.9s linear'; cat.style.left = '8px'; }, 2900);
            T(() => { setStep(3); msg.textContent = '🎉 ずっとはねかえりつづける！'; wallL.style.opacity = '1'; }, 4800);
            T(() => { wallL.style.opacity = '0'; cat.style.transition = 'none'; cat.style.transform = 'scaleX(1)'; }, 5400);
          }
          run(); loopId = setInterval(run, 7800);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

      /* ---- motion-8: ずっとうごかそう ---- */
      {
        id: 'motion-8',
        title: 'ずっとうごかそう',
        voice: 'ずっとブロックのなかに、じゅっぽうごかすと、はしではねかえるをいれると、ネコがずっとひとりでうごきつづけます！',
        pose: ['up', 'front'],
        brow: 'normal',
        content: `
<h3>ブロックをくみあわせよう</h3>
<p>3つのブロックをくみあわせると、ネコが<strong>ひとりでずっとうごく</strong>！</p>

<div id="m8" style="position:relative;width:296px;height:220px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m8-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m8-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="display:flex;gap:6px;padding:4px 8px">
    <div style="width:118px;display:flex;flex-direction:column;gap:3px;padding-top:4px">
      <div id="m8-b1" style="background:#ff9800;color:white;padding:5px 7px;border-radius:6px;font-size:9px;font-weight:bold;opacity:0;transition:opacity 0.4s,box-shadow 0.3s">🚩 はたがおされたとき</div>
      <div id="m8-b2" style="background:#9c27b0;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold;opacity:0;transition:opacity 0.4s,box-shadow 0.3s">🔁 ずっと</div>
      <div id="m8-b3" style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold;opacity:0;transition:opacity 0.4s,box-shadow 0.3s;margin-left:10px">▶ 10ほうごかす</div>
      <div id="m8-b4" style="background:#4c97ff;color:white;padding:5px 7px;border-radius:6px;font-size:9.5px;font-weight:bold;opacity:0;transition:opacity 0.4s,box-shadow 0.3s;margin-left:10px">🔀 はしではね返る</div>
      <div id="m8-b5" style="background:#9c27b0;color:white;padding:3px 7px;border-radius:0 0 6px 6px;font-size:9px;font-weight:bold;opacity:0;transition:opacity 0.4s">end</div>
    </div>
    <div style="flex:1;position:relative;border:2px solid #ccc;border-radius:6px;background:white;overflow:hidden">
      <div id="m8-wall-r" style="position:absolute;top:0;right:0;bottom:0;width:3px;background:#ff6b6b;opacity:0;transition:opacity 0.2s"></div>
      <div id="m8-wall-l" style="position:absolute;top:0;left:0;bottom:0;width:3px;background:#ff6b6b;opacity:0;transition:opacity 0.2s"></div>
      <div id="m8-flag" style="position:absolute;top:6px;left:50%;transform:translateX(-50%);font-size:18px;opacity:0;transition:opacity 0.4s">🚩</div>
      <div id="m8-cat" style="position:absolute;font-size:22px;top:44px;left:8px">🐱</div>
    </div>
  </div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>🚩 はたがおされたとき… スタートの合図</li>
  <li>🔁 ずっと… くりかえしつづける</li>
  <li>▶ ＋ 🔀 … すすんではねかえる！</li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            {id:'m8-s0',label:'① はたブロック'},
            {id:'m8-s1',label:'② ずっと'},
            {id:'m8-s2',label:'③ うごき追加'},
            {id:'m8-s3',label:'④ うごく！'},
          ];
          const stEl = $('m8-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m8-msg'), cat = $('m8-cat'), flag = $('m8-flag'),
                b1 = $('m8-b1'), b2 = $('m8-b2'), b3 = $('m8-b3'), b4 = $('m8-b4'), b5 = $('m8-b5'),
                wr = $('m8-wall-r'), wl = $('m8-wall-l');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });
          const glow = el => { if (el) { el.style.boxShadow = '0 0 0 2px #fff,0 0 0 4px #ff8c1a'; setTimeout(() => { if (el) el.style.boxShadow = ''; }, 700); } };

          function run() {
            [b1, b2, b3, b4, b5].forEach(b => { if (b) b.style.opacity = '0'; });
            flag.style.opacity = '0'; wr.style.opacity = '0'; wl.style.opacity = '0';
            cat.style.transition = 'none'; cat.style.left = '8px'; cat.style.transform = 'scaleX(1)';
            setStep(0); msg.textContent = 'まず「はた」ブロックをおこう！';
            T(() => { b1.style.opacity = '1'; glow(b1); }, 600);
            T(() => { setStep(1); msg.textContent = '「ずっと」ブロックをおこう！'; b2.style.opacity = '1'; b5.style.opacity = '1'; glow(b2); }, 2000);
            T(() => { setStep(2); msg.textContent = 'なかに「うごき」をいれよう！'; b3.style.opacity = '1'; glow(b3); }, 3400);
            T(() => { b4.style.opacity = '1'; glow(b4); msg.textContent = '「はねかえり」もいれよう！'; }, 4800);
            T(() => { setStep(3); msg.textContent = '🚩 みどりのはたをクリック！'; flag.style.opacity = '1'; }, 6200);
            T(() => { flag.style.opacity = '0'; msg.textContent = '🐱 うごきはじめた！'; cat.style.transition = 'left 1.9s linear'; cat.style.left = '112px'; }, 7400);
            T(() => { wr.style.opacity = '1'; }, 9300);
            T(() => { wr.style.opacity = '0'; cat.style.transition = 'none'; cat.style.transform = 'scaleX(-1)'; cat.style.transition = 'left 1.9s linear'; cat.style.left = '8px'; msg.textContent = '🎉 ずっとうごきつづける！'; }, 9700);
            T(() => wl.style.opacity = '1', 11600);
            T(() => { wl.style.opacity = '0'; cat.style.transition = 'none'; cat.style.transform = 'scaleX(1)'; }, 12000);
          }
          run(); loopId = setInterval(run, 14500);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

      /* ---- motion-9: むきのスタイル ---- */
      {
        id: 'motion-9',
        title: 'むきのスタイル',
        voice: 'かいてんのほうほうブロックで、ネコがむきをかえるときのようすをえらべます！ぜんほうこう、さゆうのみ、かいてんしないの3つです！',
        pose: ['chest', 'front'],
        brow: 'normal',
        content: `
<h3>かいてんのほうほう</h3>
<p>むきをかえるとき、ネコがどんなふうにみえるかえらべます！</p>

<div id="m9" style="position:relative;width:296px;height:222px;background:#eef3ff;border-radius:12px;overflow:hidden;margin:8px auto;border:2px solid #b8ccf4">
  <div id="m9-steps" style="display:flex;gap:3px;padding:5px 5px 0"></div>
  <div id="m9-msg" style="text-align:center;font-weight:bold;color:#1a1a2e;padding:2px 4px;font-size:11px;min-height:18px"></div>
  <div style="display:flex;justify-content:space-around;padding:4px 6px;gap:4px">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
      <div id="m9-l0" style="font-size:9px;font-weight:bold;background:#e3f2fd;border:2px solid #90caf9;border-radius:6px;padding:3px 5px;transition:all 0.3s;text-align:center;white-space:nowrap">ぜんほうこう</div>
      <div style="position:relative;width:74px;height:74px;border:1.5px solid #ddd;border-radius:6px;background:white;overflow:hidden">
        <div id="m9-c0" style="position:absolute;font-size:22px;top:24px;left:24px;transition:all 0.5s linear;transform-origin:center">🐱</div>
        <div id="m9-a0" style="position:absolute;font-size:12px;top:30px;left:30px;transition:all 0.5s linear;transform-origin:center;opacity:0">→</div>
      </div>
      <div id="m9-d0" style="font-size:9px;color:#555;background:white;padding:1px 4px;border-radius:4px;border:1px solid #ddd;text-align:center;min-width:60px">→ みぎ</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
      <div id="m9-l1" style="font-size:9px;font-weight:bold;background:#e8f5e9;border:2px solid #a5d6a7;border-radius:6px;padding:3px 5px;transition:all 0.3s;text-align:center;white-space:nowrap">さゆうのみ</div>
      <div style="position:relative;width:74px;height:74px;border:1.5px solid #ddd;border-radius:6px;background:white;overflow:hidden">
        <div id="m9-c1" style="position:absolute;font-size:22px;top:24px;left:24px;transition:transform 0.4s;transform-origin:center">🐱</div>
      </div>
      <div id="m9-d1" style="font-size:9px;color:#555;background:white;padding:1px 4px;border-radius:4px;border:1px solid #ddd;text-align:center;min-width:60px">→ みぎ</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
      <div id="m9-l2" style="font-size:9px;font-weight:bold;background:#fff3e0;border:2px solid #ffcc80;border-radius:6px;padding:3px 5px;transition:all 0.3s;text-align:center;white-space:nowrap">まわらない</div>
      <div style="position:relative;width:74px;height:74px;border:1.5px solid #ddd;border-radius:6px;background:white;overflow:hidden">
        <div id="m9-c2" style="position:absolute;font-size:22px;top:24px;left:24px;transform-origin:center">🐱</div>
      </div>
      <div id="m9-d2" style="font-size:9px;color:#555;background:white;padding:1px 4px;border-radius:4px;border:1px solid #ddd;text-align:center;min-width:60px">→ みぎ</div>
    </div>
  </div>
</div>

<ul style="font-size:12px;margin:4px 0 0">
  <li>🔄 <strong>ぜんほうこう</strong>… くるくるまわる（さかさまになることも）</li>
  <li>↔️ <strong>さゆうのみ</strong>… ひっくりかえらずにひだりみぎだけ</li>
  <li>⬛ <strong>まわらない</strong>… むきがかわってもすがたはそのまま</li>
</ul>
        `,
        onShow() {
          const $ = id => document.getElementById(id);
          const steps = [
            {id:'m9-s0',label:'① みぎへ'},
            {id:'m9-s1',label:'② ひだりへ'},
            {id:'m9-s2',label:'③ ちがい！'},
          ];
          const stEl = $('m9-steps');
          if (!stEl) return null;
          stEl.innerHTML = steps.map(s => `<span id="${s.id}" class="sca-step">${s.label}</span>`).join('');
          const timers = []; const T = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
          let loopId = null;
          const msg = $('m9-msg'),
                c0 = $('m9-c0'), c1 = $('m9-c1'), c2 = $('m9-c2'),
                d0 = $('m9-d0'), d1 = $('m9-d1'), d2 = $('m9-d2'),
                l0 = $('m9-l0'), l1 = $('m9-l1'), l2 = $('m9-l2');
          if (!msg) return null;
          const setStep = n => steps.forEach((s, i) => { const el = $(s.id); if (el) el.className = 'sca-step' + (i === n ? ' sca-step-on' : ''); });
          const hl = (el, on) => { if (el) el.style.boxShadow = on ? '0 0 0 2px #ff8c1a' : ''; };

          function run() {
            [c0, c1, c2].forEach(c => { if (c) { c.style.transition = 'none'; c.style.transform = ''; } });
            [d0, d1, d2].forEach(d => { if (d) d.textContent = '→ みぎ'; });
            [l0, l1, l2].forEach(l => hl(l, false));
            setStep(0); msg.textContent = 'みぎむき(90°)でうごかすよ！';

            T(() => { [l0, l1, l2].forEach(l => hl(l, true)); }, 800);
            T(() => {
              setStep(1); msg.textContent = 'こんどはひだりむき(-90°)！';
              [l0, l1, l2].forEach(l => hl(l, false));
            }, 2600);
            T(() => {
              [l0, l1, l2].forEach(l => hl(l, true));
              // ぜんほうこう: 180°回転（上下逆 + 左右反転）
              c0.style.transition = 'transform 0.6s linear';
              c0.style.transform = 'rotate(180deg)';
              d0.textContent = '← さかさま！';
              // さゆうのみ: scaleXで左右反転のみ
              c1.style.transition = 'transform 0.4s';
              c1.style.transform = 'scaleX(-1)';
              d1.textContent = '← ひっくり返らない';
              // まわらない: 変化なし
              d2.textContent = '← すがたはそのまま';
            }, 3400);
            T(() => {
              setStep(2); msg.textContent = '🎉 おなじうごきでもこんなにちがう！';
              [l0, l1, l2].forEach(l => hl(l, false));
            }, 5400);
            T(() => {
              [c0, c1, c2].forEach(c => { if (c) { c.style.transition = 'transform 0.5s'; c.style.transform = ''; } });
              [d0, d1, d2].forEach(d => { if (d) d.textContent = '→ みぎ'; });
            }, 7400);
          }
          run(); loopId = setInterval(run, 10000);
          return () => { timers.forEach(clearTimeout); if (loopId) clearInterval(loopId); };
        }
      },

    ]
  },

  /* ======================================================
     テニスコース
     ====================================================== */
  {
    id: 'tennis',
    title: 'テニスコース',
    lessons: [
      {
        id: 'tennis-1',
        title: 'マリーのスプライトをえらぼう',
        voice: 'みどりのはたをおしたとき、マリーがただしいばしょからはじまるようにブロックをくみましょう！',
        pose: ['front', 'up'],
        brow: 'strong',
        content: `
          <h3>こんなブロックを${rb('組','く')}もう</h3>
          <p>みどりのはたをおしたとき、マリーがただしいばしょからはじまるようにします。</p>
          ${sb(`
みどりのはたがおされたとき :: hat events
おおきさを (50) ％にする :: looks
xざひょうを (-200) 、yざひょうを (0) にする :: motion
(90) どにむける :: motion
ずっと :: control
end
`)}
          <div class="hint-box" style="background:#e8f4e8;border:2px solid #5cb85c;border-radius:8px;padding:10px;margin-top:8px">
            <strong>✅ かくにん！</strong>
            <p>みどりのはたをおして、マリーがただしいばしょにいるかたしかめよう！</p>
          </div>
        `
      },
      {
        id: 'tennis-2',
        title: 'マリーをWASDでうごかそう',
        voice: 'WASDキーでマリーをうごかすブロックをつくろう！ずっとのなかに4つのもしをいれるよ！',
        pose: ['up', 'front'],
        brow: 'normal',
        content: `
          <h3>WASDでうごかそう</h3>
          <p>「ずっと」のなかに4つの「もし」ブロックをいれます。</p>
          ${sb(`
ずっと :: control
もし <[w v] キーがおされた :: sensing> なら :: control
  yざひょうを (10) ずつかえる :: motion
end
もし <[s v] キーがおされた :: sensing> なら :: control
  yざひょうを (-10) ずつかえる :: motion
end
もし <[a v] キーがおされた :: sensing> なら :: control
  xざひょうを (-10) ずつかえる :: motion
end
もし <[d v] キーがおされた :: sensing> なら :: control
  xざひょうを (10) ずつかえる :: motion
end
end
`)}
          <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
            <tr style="background:#4c97ff;color:white"><th style="padding:4px">キー</th><th style="padding:4px">うごき</th></tr>
            <tr style="border-bottom:1px solid #ddd"><td style="padding:4px;text-align:center"><kbd>W</kbd></td><td style="padding:4px">yざひょう＋10（うえへ）</td></tr>
            <tr style="border-bottom:1px solid #ddd"><td style="padding:4px;text-align:center"><kbd>S</kbd></td><td style="padding:4px">yざひょう－10（したへ）</td></tr>
            <tr style="border-bottom:1px solid #ddd"><td style="padding:4px;text-align:center"><kbd>A</kbd></td><td style="padding:4px">xざひょう－10（ひだりへ）</td></tr>
            <tr><td style="padding:4px;text-align:center"><kbd>D</kbd></td><td style="padding:4px">xざひょう＋10（みぎへ）</td></tr>
          </table>
        `
      },
      {
        id: 'tennis-3',
        title: 'あるくアニメーションをつけよう',
        voice: 'うごくたびにコスチュームをかえて、あるくアニメーションをつけよう！',
        pose: ['side', 'front'],
        brow: 'normal',
        content: `
          <h3>あるくアニメーションをつけよう</h3>
          <p>ピンクの「あるくコスチュームへんこう」ブロックを、それぞれのうごきブロックのしたにいれよう！</p>
          ${sb(`
ずっと :: control
もし <[w v] キーがおされた :: sensing> なら :: control
  yざひょうを (10) ずつかえる :: motion
  あるくコスチュームへんこう :: custom
end
もし <[s v] キーがおされた :: sensing> なら :: control
  yざひょうを (-10) ずつかえる :: motion
  あるくコスチュームへんこう :: custom
end
もし <[a v] キーがおされた :: sensing> なら :: control
  xざひょうを (-10) ずつかえる :: motion
  あるくコスチュームへんこう :: custom
end
もし <[d v] キーがおされた :: sensing> なら :: control
  xざひょうを (10) ずつかえる :: motion
  あるくコスチュームへんこう :: custom
end
end
`)}
        `
      },
      {
        id: 'tennis-4',
        title: 'コートのそとにでないようにしよう',
        voice: 'Aキーのブロックをかいぞうして、コートのそとにでないようにしよう！もしブロックのなかに、もしブロックをいれるよ！',
        pose: ['front', 'up'],
        brow: 'strong',
        content: `
          <h3>コートのそとにでないようにしよう</h3>
          <p>xざひょうが -40 よりおおきくなりすぎたら、もどるようにします。</p>
          ${sb(`
ずっと :: control
もし <[a v] キーがおされた :: sensing> なら :: control
  xざひょうを (-10) ずつかえる :: motion
  あるくコスチュームへんこう :: custom
  もし <(xざひょう) > (-40) :: operators> なら :: control
    xざひょうを (-10) ずつかえる :: motion
  end
end
もし <[d v] キーがおされた :: sensing> なら :: control
  xざひょうを (10) ずつかえる :: motion
  あるくコスチュームへんこう :: custom
end
end
`)}
          <div style="background:#fff8dc;border:2px solid #ffd54f;border-radius:8px;padding:10px;margin-top:8px;font-size:12px">
            <strong>💡 ヒント</strong>
            <p>「もし xざひょう &gt; -40 なら」は、「xざひょうが -40 よりみぎにいったら」といういみだよ！</p>
          </div>
        `
      },
      {
        id: 'tennis-5',
        title: 'ボールをうつアニメーション',
        voice: 'マリーがボールにふれたとき、ラケットをふるアニメーションをつけよう！ずっとのなかに、もしボールにふれたならブロックをいれてね！',
        pose: ['side', 'front'],
        brow: 'normal',
        content: `
          <h3>ボールをうつアニメーション</h3>
          <p>「ずっと」のなかに「もしボールにふれたなら」ブロックをいれよう。</p>
          ${sb(`
ずっと :: control
// （うえのうごきブロックはそのまま）
もし <[ボール v] にふれた :: sensing> なら :: control
  うつ :: custom
end
end
`)}
          <div style="background:#e3f2fd;border:2px solid #4c97ff;border-radius:8px;padding:10px;margin-top:8px;font-size:12px">
            <strong>💡 ヒント</strong>
            <p>「ボール にふれた」は「しらべる」（みずいろ）のブロックだよ。<br>
            「うつ」はピンクの「${rb('定義','ていぎ')}」ブロックだよ。</p>
          </div>
        `
      },
    ]
  },

  /* ======================================================
     クレジット
     ====================================================== */
  {
    id: 'credits',
    title: 'クレジット',
    lessons: [
      {
        id: 'credits-1',
        title: 'このアプリについて',
        voice: 'このアプリでつかっているつくよみちゃんのキャラクターは、ゆめさきれいせんせいがつくったフリーそざいです！ありがとうございます！',
        pose: ['chest', 'front'],
        brow: 'normal',
        content: `
          <h3>キャラクタークレジット</h3>
          <p>このアプリでは、フリー${rb('素材','そざい')}キャラクター「つくよみちゃん」（© Rei Yumesaki）を${rb('使用','しよう')}しています。</p>

          <div style="background:#fff8e1;border:2px solid #ffd54f;border-radius:10px;padding:14px;margin:12px 0;line-height:2.2;font-size:12px">
            <div>■ キャラクター：<a href="https://tyc.rei-yumesaki.net/" target="_blank" style="color:#1565c0">つくよみちゃん</a></div>
            <div>■ キャラクターデザイン：<a href="https://tyc.rei-yumesaki.net/staff/rei-yumesaki/" target="_blank" style="color:#1565c0">${rb('夢前黎','ゆめさきれい')}</a></div>
            <div>■ イラスト${rb('素材','そざい')}：<a href="https://tyc.rei-yumesaki.net/material/illust/" target="_blank" style="color:#1565c0">きばやし</a>（つくよみちゃん${rb('万能','ばんのう')}ミニキャラ${rb('素材','そざい')} ver.1.2.0）</div>
            <div>■ ${rb('音声合成','おんせいごうせい')}：Web Speech API（ブラウザ${rb('内蔵','ないぞう')}）</div>
          </div>

          <p style="font-size:11px;color:#888;line-height:1.6">
            © 2023 Rei Yumesaki / きばやし<br>
            この${rb('素材','そざい')}は<a href="https://tyc.rei-yumesaki.net/about/terms/" target="_blank" style="color:#1565c0">つくよみちゃんキャラクターライセンス</a>にしたがいしようしています。
          </p>
        `
      },
    ]
  },
];
