/**
 * スキル街道 - フロントエンドロジック
 *
 * config.js（CONFIG.SKILL_TRAIL_GOOGLE_APPS_SCRIPT_URL 等）を先に読み込むこと。
 *
 * 通信方式について:
 *   GAS Web AppへのPOSTは `Content-Type: text/plain;charset=utf-8` で送る。
 *   これはCORSプリフライト（OPTIONS）を発生させないための定石（PRD参照）。
 *   GAS側は e.postData.contents を JSON.parse して扱う。
 *
 * PIN・講師パスワードの扱い:
 *   - 生徒PINはログイン成功後 sessionStorage に保持し、書き込み系リクエスト（かくにんをおねがいする）の
 *     たびに毎回サーバーへ再送して再検証させる（PRDのセキュリティ要件）。
 *   - 講師パスワードは sessionStorage には保存しない（タブを閉じずに放置された共有PCでの露出を避けるため）。
 *     講師モード中のみメモリ上（本スクリプトのモジュール変数）に保持し、ページ再読み込みで消える。
 *   - CONFIG.SKILL_TRAIL_STAFF_PASSWORD_HINT は config.js 上のプレースホルダとしてのみ保持しており、
 *     本スクリプトのロジックでは意図的に参照していない（未使用）。書き込みの可否は必ずGAS側
 *     Script Propertiesとの照合のみで決まる設計とし、クライアント側の値で判定する経路を一切作らない
 *     ことで「クライアント側だけで承認が通ってしまう」抜け道の混入を防いでいる。
 */
(function () {
  "use strict";

  if (typeof CONFIG === "undefined") {
    console.error("CONFIGが読み込まれていません。config.jsを先に読み込んでください。");
    return;
  }

  var SCHOOL_ID = "mukonoso";

  // ============================================================
  // アイコン（線画SVG。design_principles.md準拠：フラット・グラデーション無し）
  // ============================================================
  var ICONS = {
    flag: '<line x1="6" y1="3" x2="6" y2="21"/><path d="M6 4h13l-4 5 4 5H6"/>',
    cat: '<circle cx="12" cy="13" r="7"/><path d="M7 8 5 3l5 3M17 8l2-5-5 3"/><circle cx="9.3" cy="12.5" r=".6" fill="currentColor" stroke="none"/><circle cx="14.7" cy="12.5" r=".6" fill="currentColor" stroke="none"/>',
    message: '<path d="M4 5h16v11H9l-4 4v-4H4z"/><circle cx="9" cy="10.5" r=".6" fill="currentColor" stroke="none"/><circle cx="12" cy="10.5" r=".6" fill="currentColor" stroke="none"/><circle cx="15" cy="10.5" r=".6" fill="currentColor" stroke="none"/>',
    loop: '<path d="M4 12a8 8 0 0 1 14-5.2M20 12a8 8 0 0 1-14 5.2"/><path d="M17.5 4v3h-3M6.5 20v-3h3"/>',
    cursor: '<path d="M6 3l5.5 15 2-6 6-2z"/>',
    speaker: '<path d="M4 10v4h4l6 4V6l-6 4z"/><path d="M17 9a5 5 0 0 1 0 6"/>',
    variable: '<path d="M4 5h11l5 7-5 7H4l4-7z"/><text x="10.4" y="15.3" font-size="7.5" fill="currentColor" stroke="none" font-family="Zen Maru Gothic, sans-serif">x</text>',
    compare: '<path d="M8 7l-4 5 4 5"/><path d="M16 7l4 5-4 5"/>',
    puzzle: '<path d="M5 5h5.2a1.6 1.6 0 0 1 3 0H19v5.2a1.6 1.6 0 0 1 0 3V19h-5.2a1.6 1.6 0 0 0-3 0H5v-5.2a1.6 1.6 0 0 0 0-3z"/>',
    clone: '<rect x="4" y="4" width="12" height="12" rx="1.5"/><rect x="9" y="9" width="12" height="12" rx="1.5" opacity=".6"/>',
    trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M4 5h3v3a3 3 0 0 1-3-3zM20 5h-3v3a3 3 0 0 0 3-3z"/><path d="M12 13v3M9 20h6M9.5 20c0-2 1-2.5 2.5-3 1.5.5 2.5 1 2.5 3"/>',
    medal: '<path d="M8 3l2 6M16 3l-2 6"/><circle cx="12" cy="14" r="6"/><path d="M9.3 14.2l1.8 1.8L15 12.2"/>',
    upload: '<rect x="4" y="4" width="16" height="12" rx="1"/><path d="M12 14V8M9 11l3-3 3 3"/><path d="M4 20h16" stroke-linecap="round"/>',
    film: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><line x1="8" y1="5" x2="8" y2="19"/><line x1="16" y1="5" x2="16" y2="19"/><line x1="3" y1="10" x2="8" y2="10"/><line x1="16" y1="10" x2="21" y2="10"/>',
    text: '<path d="M5 6h14M12 6v13"/>',
    transition: '<rect x="3" y="6" width="9" height="12" rx="1"/><rect x="12" y="6" width="9" height="12" rx="1" opacity=".45"/><path d="M9 12h9M15 9l3 3-3 3"/>',
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    pencilcube: '<path d="M12 4l7 4v8l-7 4-7-4V8z"/><path d="M12 4v8l7-4M12 12l-7-4M12 12v9"/><path d="M17 3l2.5 2.5L14 11l-2.6.6L12 9z" fill="currentColor" stroke="none" opacity=".9"/>',
    printer: '<rect x="6" y="3" width="12" height="6" rx="1"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><rect x="8" y="14" width="8" height="6"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 4.9L4 16.5 6.5 19l5.3-5.3a4 4 0 0 0 4.9-5.4l-2.6 2.6-2.1-2.1z"/>',
    q: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.8 2.3c-.9.5-1.3 1-1.3 2" /><circle cx="12" cy="16.6" r=".6" fill="currentColor" stroke="none"/>'
  };
  function iconSvg(key) { return '<svg viewBox="0 0 24 24">' + (ICONS[key] || ICONS.q) + '</svg>'; }
  function lockSvg() { return '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'; }
  function checkSvg() { return '<svg viewBox="0 0 24 24"><path d="M4 12l5 5 11-11"/></svg>'; }
  function pendingSvg() { return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>'; }

  // ============================================================
  // スクラッチ街道: 16ノード（Entry/Bronze/Silver/Gold・4段階版）
  // 出典: サーティファイ「ジュニア・プログラミング検定～Scratch部門～」を参考にPenTechが独自設計
  //       https://jpsk.jp/examinations/scratch.html / https://www.sikaku.gr.jp/js/ks/point/
  // ============================================================
  var NODE_ORDER = [
    "e1", "e2", "e3", "e4", "e-clear",
    "b1", "b2", "b3", "b-clear",
    "si1", "si2", "si-clear",
    "g1", "g2", "g3", "g-clear"
  ];

  var NODE_META = {
    "e1": { tier: "entry", tierLabel: "Entry(4級)", title: "みどりの旗をおそう", desc: "クリックでプログラムが動く仕組み（緑旗トリガー）", icon: "flag" },
    "e2": { tier: "entry", tierLabel: "Entry(4級)", title: "キャラクターをうごかす", desc: "動き・見た目ブロックで歩く・ジャンプなどのアニメーション", icon: "cat" },
    "e3": { tier: "entry", tierLabel: "Entry(4級)", title: "メッセージでつながる", desc: "ブロック同士をメッセージ送受信で連携させる", icon: "message" },
    "e4": { tier: "entry", tierLabel: "Entry(4級)", title: "くりかえしとぶんき", desc: "繰り返す／もし〜なら／もし〜でなければ、触れた判定の基本制御", icon: "loop" },
    "e-clear": { tier: "entry", tierLabel: "Entry(4級)", title: "Entry（4級）相当クリア", desc: "上記を組み合わせたミニ課題の完成", icon: "medal", milestone: true },

    "b1": { tier: "bronze", tierLabel: "Bronze(3級)", title: "マウス・キーであそぼう", desc: "マウス座標・キー入力・クリックイベント", icon: "cursor" },
    "b2": { tier: "bronze", tierLabel: "Bronze(3級)", title: "おとであそぼう", desc: "音の基本操作、音楽拡張機能", icon: "speaker" },
    "b3": { tier: "bronze", tierLabel: "Bronze(3級)", title: "へんすうとけいさん", desc: "変数の作成、四則演算・ランダム・文字列結合", icon: "variable" },
    "b-clear": { tier: "bronze", tierLabel: "Bronze(3級)", title: "Bronze（3級）相当クリア", desc: "上記を組み合わせたミニ課題の完成", icon: "medal", milestone: true },

    "si1": { tier: "silver", tierLabel: "Silver(2級)", title: "くらべる・くみあわせる", desc: "比較演算子、かつ／または／ではない、背景変化などの複合イベント", icon: "compare" },
    "si2": { tier: "silver", tierLabel: "Silver(2級)", title: "もじ・かずのわざ", desc: "文字列の一部取得・長さ、割った余り・四捨五入、タイマー", icon: "text" },
    "si-clear": { tier: "silver", tierLabel: "Silver(2級)", title: "Silver（2級）相当クリア", desc: "上記を組み合わせたミニ課題の完成", icon: "medal", milestone: true },

    "g1": { tier: "gold", tierLabel: "Gold(1級)", title: "じぶんのブロック", desc: "カスタムブロック、リスト機能", icon: "puzzle" },
    "g2": { tier: "gold", tierLabel: "Gold(1級)", title: "クローンをつかう", desc: "クローン機能一式、絶対値・切り上げ・切り下げ", icon: "clone" },
    "g3": { tier: "gold", tierLabel: "Gold(1級)", title: "オリジナルゲームかんせい", desc: "企画から発表まで、自分のオリジナルゲームを完成させる", icon: "trophy" },
    "g-clear": { tier: "gold", tierLabel: "Gold(1級)そつぎょう", title: "Gold（1級）相当クリア", desc: "スキル街道そつぎょう。最終マイルストーン", icon: "trophy", milestone: true }
  };

  var TIER_LABELS = { entry: "Entry(4級)", bronze: "Bronze(3級)", silver: "Silver(2級)", gold: "Gold(1級)" };

  // ============================================================
  // 動画編集・3Dプリンタ・霧の道（内容は仮。データは非永続＝コードにハードコード）
  // 状態はページ滞在中のみメモリで保持（サーバー保存なし、講師承認フロー対象外）
  // ============================================================
  var HARDCODED_REGIONS = [
    {
      id: "video", name: "どうが編集の道", sub: "カット編集から作品発表まで（内容は仮）", color: "var(--magenta)", tentative: true,
      nodes: [
        { id: "v1", tier: "STEP1", title: "そざいをとりこむ", icon: "upload", desc: "撮った動画を編集ソフトに取り込む" },
        { id: "v2", tier: "STEP1", title: "カットへんしゅう", icon: "film", desc: "いらない部分を切ってつなげる" },
        { id: "v3", tier: "STEP2", title: "テロップをつける", icon: "text", desc: "字幕・タイトル文字を入れる" },
        { id: "v4", tier: "STEP2", title: "BGM・こうかおん", icon: "speaker", desc: "音楽と効果音でもりあげる" },
        { id: "v5", tier: "STEP3", title: "切りかえエフェクト", icon: "transition", desc: "場面転換・トランジションを使う" },
        { id: "v6", tier: "STEP3", title: "さくひんをこうかい", icon: "trophy", desc: "限定公開で作品を発表する" }
      ]
    },
    {
      id: "print", name: "3Dプリンタの道", sub: "モデルを見る所から作品づくりまで（内容は仮）", color: "var(--teal)", tentative: true,
      nodes: [
        { id: "p1", tier: "STEP1", title: "3Dモデルをさわる", icon: "cube", desc: "ビューアで回転・拡大して観察する" },
        { id: "p2", tier: "STEP1", title: "きほんのずけい", icon: "cube", desc: "立方体や円柱を組み合わせる" },
        { id: "p3", tier: "STEP2", title: "じぶんでせっけい", icon: "pencilcube", desc: "簡単な形を自分でモデリングする" },
        { id: "p4", tier: "STEP2", title: "プリントしてみる", icon: "printer", desc: "スライサー設定をして出力する" },
        { id: "p5", tier: "STEP3", title: "しあげとちょうせい", icon: "wrench", desc: "やすりがけ・パーツの調整をする" },
        { id: "p6", tier: "STEP3", title: "さくひんをつくる", icon: "trophy", desc: "オリジナル作品を完成させる" }
      ]
    },
    {
      id: "fog", name: "霧の向こうの道", sub: "Python・Web制作・統合かんきょうなど、次の道は検討中", color: "var(--ink-soft)", fog: true,
      nodes: [
        { id: "f1", tier: "?", title: "Python", icon: "q", desc: "検討中" },
        { id: "f2", tier: "?", title: "Web制作", icon: "q", desc: "検討中" },
        { id: "f3", tier: "?", title: "？？？", icon: "q", desc: "検討中" }
      ]
    }
  ];

  function defaultHardcodedState() {
    var s = {};
    HARDCODED_REGIONS.forEach(function (r) {
      r.nodes.forEach(function (n, i) {
        if (r.fog) { s[n.id] = "fog"; return; }
        s[n.id] = i === 0 ? "current" : "locked";
      });
    });
    return s;
  }
  var hardcodedState = defaultHardcodedState();

  // ============================================================
  // セッション（sessionStorage: 生徒PINのみ。講師パスワードは保存しない）
  // ============================================================
  var SESSION = {
    STUDENT_ID: "skill_trail_student_id",
    STUDENT_NAME: "skill_trail_display_name",
    STUDENT_PIN: "skill_trail_pin"
  };

  function saveStudentSession(studentId, displayName, pin) {
    sessionStorage.setItem(SESSION.STUDENT_ID, studentId);
    sessionStorage.setItem(SESSION.STUDENT_NAME, displayName);
    sessionStorage.setItem(SESSION.STUDENT_PIN, pin);
  }
  function loadStudentSession() {
    var id = sessionStorage.getItem(SESSION.STUDENT_ID);
    if (!id) return null;
    return {
      studentId: id,
      displayName: sessionStorage.getItem(SESSION.STUDENT_NAME) || id,
      pin: sessionStorage.getItem(SESSION.STUDENT_PIN) || ""
    };
  }
  function clearStudentSession() {
    sessionStorage.removeItem(SESSION.STUDENT_ID);
    sessionStorage.removeItem(SESSION.STUDENT_NAME);
    sessionStorage.removeItem(SESSION.STUDENT_PIN);
  }

  // ============================================================
  // GAS通信ヘルパー
  // ============================================================
  function gasGetStudents() {
    var url = CONFIG.SKILL_TRAIL_GOOGLE_APPS_SCRIPT_URL + "?action=students&school_id=" + encodeURIComponent(SCHOOL_ID);
    return fetch(url).then(function (r) { return r.json(); });
  }
  function gasPost(type, data) {
    var body = Object.assign({ type: type, school_id: SCHOOL_ID }, data);
    return fetch(CONFIG.SKILL_TRAIL_GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  // ============================================================
  // 進捗の再同期（サーバーの正の状態に合わせる）
  // request_review 送信後、成功/論理失敗/通信断のいずれの経路でも呼び出し、
  // 楽観的UI更新（pending表示）が実際のサーバー状態と食い違ったまま残らないようにする。
  // ============================================================
  function resyncScratchProgress() {
    if (!app.student) return Promise.resolve();
    return gasPost("login", { student_id: app.student.studentId, pin: app.student.pin }).then(function (r2) {
      if (r2 && r2.success) {
        app.progress = {};
        (r2.progress || []).forEach(function (p) { app.progress[p.node_id] = p.status; });
      }
      renderStudentApp();
    }).catch(function () {
      // 再同期自体も失敗した場合は次回ログイン/再読み込みで復旧する（楽観的UI更新は表示に残るが、
      // これ以上リトライはせずユーザーに通信状態を伝えるに留める）
      toast("通信状態が不安定です。もう一度お試しください");
    });
  }

  // ============================================================
  // トースト
  // ============================================================
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 1900);
  }

  // ============================================================
  // アプリ状態
  // ============================================================
  var app = {
    mode: "login",       // login | student | staff
    student: null,       // {studentId, displayName, pin}
    progress: {},         // node_id -> status
    staffPassword: null, // メモリ保持のみ
    pendingStudents: []   // staff_progress_all の結果
  };

  // ============================================================
  // レイアウト（Polytopia風・波形パス）
  // ============================================================
  var SPACING_X = 190, AMP = 60, PAD_L = 90, PAD_R = 120, PAD_T = 160;

  function layout(nodeIds) {
    var pts = nodeIds.map(function (id, i) {
      var x = PAD_L + i * SPACING_X;
      var y = PAD_T + (i % 2 === 0 ? -AMP : AMP);
      return { id: id, x: x, y: y };
    });
    var width = PAD_L + (nodeIds.length - 1) * SPACING_X + PAD_R;
    var height = PAD_T * 2;
    return { pts: pts, width: width, height: height };
  }

  function decoSvg(width, height, seed) {
    var hills = "";
    var n = Math.round(width / 140);
    for (var i = 0; i < n; i++) {
      var cx = 40 + i * 140 + ((i * seed) % 23);
      var cy = height - 4;
      var r = 34 + (i % 3) * 6;
      hills += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--paper-line)"/>';
    }
    return '<svg class="deco-layer" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '" aria-hidden="true">' + hills + '</svg>';
  }

  // ============================================================
  // スクラッチ街道の描画
  // ============================================================
  function scratchNodeState(nodeId) {
    return app.progress[nodeId] || "locked";
  }

  function renderScratchRegion() {
    var geo = layout(NODE_ORDER);
    var segs = [];
    for (var i = 1; i < geo.pts.length; i++) {
      var toId = geo.pts[i].id;
      var st = scratchNodeState(toId);
      var opened = (st === "current" || st === "pending" || st === "done");
      segs.push({ x1: geo.pts[i - 1].x, y1: geo.pts[i - 1].y, x2: geo.pts[i].x, y2: geo.pts[i].y, opened: opened });
    }
    var pathHtml = segs.map(function (s) {
      var stroke = s.opened ? "var(--trail)" : "var(--trail-locked)";
      var dash = s.opened ? "" : ' stroke-dasharray="3 12"';
      return '<line x1="' + s.x1 + '" y1="' + s.y1 + '" x2="' + s.x2 + '" y2="' + s.y2 + '" stroke="' + stroke + '" stroke-width="' + (s.opened ? 16 : 8) + '" stroke-linecap="round"' + dash + '/>';
    }).join("");
    var centerHtml = segs.map(function (s) {
      if (!s.opened) return "";
      return '<line x1="' + s.x1 + '" y1="' + s.y1 + '" x2="' + s.x2 + '" y2="' + s.y2 + '" stroke="var(--paper-deep)" stroke-width="2" stroke-dasharray="1 13" stroke-linecap="round" opacity=".55"/>';
    }).join("");
    var pathSvg = '<svg class="path-layer" viewBox="0 0 ' + geo.width + ' ' + geo.height + '" width="' + geo.width + '" height="' + geo.height + '" aria-hidden="true">' + pathHtml + centerHtml + '</svg>';
    var deco = decoSvg(geo.width, geo.height, 7);

    // 段階の境目マーカー（Entry/Bronze/Silver/Gold）
    var seenTiers = {};
    var markers = "";
    NODE_ORDER.forEach(function (id, i) {
      var tier = NODE_META[id].tier;
      if (!seenTiers[tier]) {
        seenTiers[tier] = true;
        var x = geo.pts[i].x;
        markers += '<span class="tier-marker" style="left:' + x + 'px;top:14px">' + TIER_LABELS[tier] + '</span>';
      }
    });

    var badges = NODE_ORDER.map(function (id, i) {
      var meta = NODE_META[id];
      var p = geo.pts[i];
      var st = scratchNodeState(id);
      var cls = ["badge-btn", st];
      if (meta.milestone) cls.push("milestone");
      var chip = "";
      if (st === "locked") chip = '<span class="lock-chip">' + lockSvg() + '</span>';
      if (st === "pending") chip = '<span class="pending-chip">' + pendingSvg() + '</span>';
      if (st === "done") chip = '<span class="check-chip">' + checkSvg() + '</span>';
      var titleAttr = (st === "current" ? "できた！かくにんをおねがいするには押してね" : meta.desc).replace(/"/g, "&quot;");
      return '<button type="button" class="' + cls.join(" ") + '" style="left:' + p.x + 'px;top:' + p.y + 'px" ' +
        'data-scratch-node="' + id + '" title="' + titleAttr + '">' +
        '<span class="tier-pill tier-' + meta.tier + '">' + meta.tierLabel + '</span>' +
        '<span class="ring">' + iconSvg(meta.icon) + chip + '</span>' +
        '<span class="badge-label">' + meta.title + '</span>' +
        '</button>';
    }).join("");

    return '' +
      '<section class="region" data-region-id="scratch">' +
      '<div class="region-head">' +
      '<div>' +
      '<div class="region-name"><span class="swatch" style="background:var(--blue)"></span>スクラッチ街道</div>' +
      '<div class="region-sub">サーティファイ「ジュニア・プログラミング検定～Scratch部門～」を参考にした、ブロックプログラミングの基礎コース（Entry→Bronze→Silver→Gold）</div>' +
      '</div>' +
      '</div>' +
      '<div class="track-scroll"><div class="track" style="width:' + geo.width + 'px;height:' + geo.height + 'px">' + deco + pathSvg + markers + badges + '</div></div>' +
      '</section>';
  }

  // ============================================================
  // 動画/3Dプリンタ/霧の道（ハードコード）の描画
  // ============================================================
  function renderHardcodedRegion(region) {
    var ids = region.nodes.map(function (n) { return n.id; });
    var geo = layout(ids);
    var segs = [];
    for (var i = 1; i < geo.pts.length; i++) {
      var toId = geo.pts[i].id;
      var st = hardcodedState[toId];
      var opened = region.fog ? false : (st === "current" || st === "done");
      segs.push({ x1: geo.pts[i - 1].x, y1: geo.pts[i - 1].y, x2: geo.pts[i].x, y2: geo.pts[i].y, opened: opened });
    }
    var pathHtml = segs.map(function (s) {
      var stroke = s.opened ? "var(--trail)" : "var(--trail-locked)";
      var dash = s.opened ? "" : ' stroke-dasharray="3 12"';
      return '<line x1="' + s.x1 + '" y1="' + s.y1 + '" x2="' + s.x2 + '" y2="' + s.y2 + '" stroke="' + stroke + '" stroke-width="' + (s.opened ? 16 : 8) + '" stroke-linecap="round"' + dash + '/>';
    }).join("");
    var pathSvg = '<svg class="path-layer" viewBox="0 0 ' + geo.width + ' ' + geo.height + '" width="' + geo.width + '" height="' + geo.height + '" aria-hidden="true">' + pathHtml + '</svg>';
    var deco = decoSvg(geo.width, geo.height, region.id.length + 3);

    var badges = region.nodes.map(function (n, i) {
      var p = geo.pts[i];
      var st = hardcodedState[n.id];
      var cls = ["badge-btn", region.fog ? "fog" : st];
      var chip = "";
      if (!region.fog) {
        if (st === "locked") chip = '<span class="lock-chip">' + lockSvg() + '</span>';
        if (st === "done") chip = '<span class="check-chip">' + checkSvg() + '</span>';
      }
      var title = region.fog ? n.title : n.desc;
      return '<button type="button" class="' + cls.join(" ") + '" style="left:' + p.x + 'px;top:' + p.y + 'px" ' +
        'data-hardcoded-region="' + region.id + '" data-hardcoded-node="' + n.id + '" title="' + title.replace(/"/g, "&quot;") + '">' +
        '<span class="tier-pill">' + n.tier + '</span>' +
        '<span class="ring">' + iconSvg(n.icon) + chip + '</span>' +
        '<span class="badge-label">' + n.title + '</span>' +
        '</button>';
    }).join("");

    var flagBadge = region.tentative ? '<span class="tentative-flag">内容は仮</span>' : "";
    var fogNote = region.fog ? '<span class="tentative-flag" style="color:var(--ink-soft);background:var(--paper-line);">未確定</span>' : "";

    return '' +
      '<section class="region" data-region-id="' + region.id + '">' +
      '<div class="region-head"><div>' +
      '<div class="region-name"><span class="swatch" style="background:' + region.color + '"></span>' + region.name + flagBadge + fogNote + '</div>' +
      '<div class="region-sub">' + region.sub + '</div>' +
      '</div></div>' +
      '<div class="track-scroll"><div class="track" style="width:' + geo.width + 'px;height:' + geo.height + 'px">' + deco + pathSvg + badges + '</div></div>' +
      '</section>';
  }

  // ============================================================
  // 画面: ログイン（生徒選択）
  // ============================================================
  function renderLoginScreen(students) {
    var root = document.getElementById("app-root");
    var listHtml;
    if (!students || students.length === 0) {
      listHtml = '<p class="empty-note">まだ生徒が登録されていません。スタッフにおたずねください。</p>';
    } else {
      listHtml = '<div class="student-grid">' + students.map(function (s) {
        return '<button type="button" class="student-chip" data-select-student="' + s.student_id + '" data-select-name="' + (s.display_name || "").replace(/"/g, "&quot;") + '">' +
          (s.display_name || s.student_id) + '</button>';
      }).join("") + '</div>';
    }
    root.innerHTML = '' +
      '<div class="login-screen">' +
      '<h2>だれのスキル街道？</h2>' +
      '<p>じぶんの名前をえらんでね</p>' +
      listHtml +
      '</div>';
  }

  // ============================================================
  // 画面: 生徒モード（メイン）
  // ============================================================
  function renderStudentApp() {
    var root = document.getElementById("app-root");
    var s = app.student;
    root.innerHTML = '' +
      '<div class="legend-row">' +
      '<span class="legend-item"><span class="legend-dot locked"></span>ロック中</span>' +
      '<span class="legend-item"><span class="legend-dot current"></span>ちょうせん中</span>' +
      '<span class="legend-item"><span class="legend-dot pending"></span>かくにんまち</span>' +
      '<span class="legend-item"><span class="legend-dot done"></span>クリア済み</span>' +
      '<span class="spacer"></span>' +
      '</div>' +
      '<main id="regions">' +
      renderScratchRegion() +
      HARDCODED_REGIONS.map(renderHardcodedRegion).join("") +
      '</main>' +
      renderDisclaimer();
  }

  function renderDisclaimer() {
    return '<div class="disclaimer">' +
      '<b>「スキル街道」について</b><br>' +
      '「スキル街道」の級表示は、サーティファイ「ジュニア・プログラミング検定～Scratch部門～」を参考にPenTechが独自に設計した学習の目安です。同検定の公式教材・提携プログラムではなく、検定の受験・合否を保証するものではありません。' +
      '</div>';
  }

  // ============================================================
  // 画面: 講師モード
  // ============================================================
  function renderStaffApp() {
    var root = document.getElementById("app-root");
    var students = app.pendingStudents || [];
    var rows = [];
    students.forEach(function (st) {
      (st.progress || []).forEach(function (p) {
        if (p.status !== "pending") return;
        var meta = NODE_META[p.node_id];
        if (!meta) return;
        rows.push({ studentId: st.student_id, displayName: st.display_name, nodeId: p.node_id, meta: meta, updatedAt: p.updated_at });
      });
    });

    var rowsHtml;
    if (rows.length === 0) {
      rowsHtml = '<p class="pending-empty">承認待ちのバッジはありません。</p>';
    } else {
      rowsHtml = '<div class="pending-list">' + rows.map(function (r) {
        return '<div class="pending-row">' +
          '<span class="who">' + r.displayName + '</span>' +
          '<span class="what">' + r.meta.tierLabel + ' ／ ' + r.meta.title + '</span>' +
          '<span class="when">' + formatDate(r.updatedAt) + '</span>' +
          '<span class="row-actions">' +
          '<button type="button" class="btn btn-approve" data-approve-student="' + r.studentId + '" data-approve-node="' + r.nodeId + '">承認</button>' +
          '<button type="button" class="btn btn-reject" data-reject-student="' + r.studentId + '" data-reject-node="' + r.nodeId + '">差し戻し</button>' +
          '</span>' +
          '</div>';
      }).join("") + '</div>';
    }

    root.innerHTML = '' +
      '<section class="region staff-panel">' +
      '<div class="region-head"><div>' +
      '<div class="region-name">講師モード：承認待ち一覧</div>' +
      '<div class="region-sub">「かくにんまち」のバッジを確認し、承認 または 差し戻しをしてください。</div>' +
      '</div></div>' +
      rowsHtml +
      '</section>' +
      renderDisclaimer();
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    } catch (e) { return iso; }
  }

  // ============================================================
  // ヘッダー（共通）
  // ============================================================
  function renderHeaderActions() {
    var wrap = document.getElementById("header-actions");
    if (app.mode === "student" && app.student) {
      wrap.innerHTML = '' +
        '<span class="who-am-i">ログイン中：<b>' + app.student.displayName + '</b></span>' +
        '<div style="display:flex;gap:8px;">' +
        '<button type="button" class="btn" id="btn-switch-user">べつの人にきりかえる</button>' +
        '<button type="button" class="btn btn-staff" id="btn-staff-mode">こうしモード</button>' +
        '</div>';
    } else if (app.mode === "staff") {
      wrap.innerHTML = '' +
        '<span class="who-am-i">講師モード</span>' +
        '<div style="display:flex;gap:8px;">' +
        '<button type="button" class="btn" id="btn-exit-staff">生徒モードにもどる</button>' +
        '</div>';
    } else {
      wrap.innerHTML = '<button type="button" class="btn btn-quiet" id="btn-staff-mode">こうしモード（講師用）</button>';
    }
  }

  function renderAll() {
    renderHeaderActions();
    if (app.mode === "login") {
      gasGetStudents().then(function (res) {
        if (res && res.success) {
          renderLoginScreen(res.students);
        } else {
          document.getElementById("app-root").innerHTML = '<p class="empty-note">生徒一覧の取得に失敗しました。しばらくしてからもう一度お試しください。</p>';
        }
      }).catch(function () {
        document.getElementById("app-root").innerHTML = '<p class="empty-note">通信エラーが発生しました。ネットワークをご確認ください。</p>';
      });
    } else if (app.mode === "student") {
      renderStudentApp();
    } else if (app.mode === "staff") {
      refreshStaffList();
    }
  }

  function refreshStaffList() {
    gasPost("staff_progress_all", { staff_password: app.staffPassword }).then(function (res) {
      if (res && res.success) {
        app.pendingStudents = res.students || [];
        renderStaffApp();
      } else {
        toast("講師データの取得に失敗しました");
        exitStaffMode();
      }
    }).catch(function () {
      toast("通信エラーが発生しました");
    });
  }

  // ============================================================
  // モーダル: PIN入力
  // ============================================================
  function showPinModal(studentId, displayName) {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "pin-modal-overlay";
    overlay.innerHTML = '' +
      '<div class="modal-box">' +
      '<h3>' + displayName + ' さん</h3>' +
      '<p class="modal-sub">4けたのPINをいれてね</p>' +
      '<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" class="pin-input" id="pin-input" autofocus>' +
      '<div class="modal-error" id="pin-error"></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn" id="pin-cancel">やめる</button>' +
      '<button type="button" class="btn btn-primary" id="pin-submit">ログイン</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById("pin-input");
    var errEl = document.getElementById("pin-error");
    input.focus();

    function submit() {
      var pin = input.value.trim();
      if (!/^[0-9]{4}$/.test(pin)) {
        errEl.textContent = "4けたの数字でいれてね";
        return;
      }
      gasPost("login", { student_id: studentId, pin: pin }).then(function (res) {
        if (res && res.success) {
          saveStudentSession(studentId, res.display_name || displayName, pin);
          app.student = { studentId: studentId, displayName: res.display_name || displayName, pin: pin };
          app.progress = {};
          (res.progress || []).forEach(function (p) { app.progress[p.node_id] = p.status; });
          app.mode = "student";
          overlay.remove();
          renderAll();
        } else {
          var msg = (res && res.error === "PIN_MISMATCH") ? "PINがちがいます" :
            (res && res.error === "STUDENT_NOT_FOUND") ? "生徒がみつかりません" : "ログインにしっぱいしました";
          errEl.textContent = msg;
          input.value = "";
          input.focus();
        }
      }).catch(function () {
        errEl.textContent = "通信エラーが発生しました";
      });
    }

    document.getElementById("pin-submit").addEventListener("click", submit);
    document.getElementById("pin-cancel").addEventListener("click", function () { overlay.remove(); });
    input.addEventListener("keypress", function (e) { if (e.key === "Enter") submit(); });
  }

  // ============================================================
  // モーダル: 講師ログイン
  // ============================================================
  function showStaffLoginModal() {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = '' +
      '<div class="modal-box">' +
      '<h3>講師モード</h3>' +
      '<p class="modal-sub">講師パスワードをいれてください</p>' +
      '<input type="password" class="text-input" id="staff-pw-input" autofocus>' +
      '<div class="modal-error" id="staff-pw-error"></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn" id="staff-cancel">やめる</button>' +
      '<button type="button" class="btn btn-primary" id="staff-submit">きりかえる</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById("staff-pw-input");
    var errEl = document.getElementById("staff-pw-error");
    input.focus();

    function submit() {
      var pw = input.value;
      if (!pw) { errEl.textContent = "パスワードを入力してください"; return; }
      gasPost("staff_login", { staff_password: pw }).then(function (res) {
        if (res && res.success) {
          app.staffPassword = pw; // メモリ保持のみ（sessionStorageには保存しない）
          app.mode = "staff";
          overlay.remove();
          renderAll();
        } else {
          errEl.textContent = "パスワードが正しくありません";
          input.value = "";
          input.focus();
        }
      }).catch(function () {
        errEl.textContent = "通信エラーが発生しました";
      });
    }

    document.getElementById("staff-submit").addEventListener("click", submit);
    document.getElementById("staff-cancel").addEventListener("click", function () { overlay.remove(); });
    input.addEventListener("keypress", function (e) { if (e.key === "Enter") submit(); });
  }

  function exitStaffMode() {
    app.staffPassword = null;
    app.pendingStudents = [];
    var restored = loadStudentSession();
    if (restored) {
      app.mode = "student";
      app.student = restored;
      // 講師モードから戻った際は最新状態を取り直す
      gasPost("login", { student_id: restored.studentId, pin: restored.pin }).then(function (res) {
        if (res && res.success) {
          app.progress = {};
          (res.progress || []).forEach(function (p) { app.progress[p.node_id] = p.status; });
        }
        renderAll();
      }).catch(function () { renderAll(); });
    } else {
      app.mode = "login";
      renderAll();
    }
  }

  // ============================================================
  // イベント
  // ============================================================
  document.addEventListener("click", function (e) {
    var studentChip = e.target.closest("[data-select-student]");
    if (studentChip) {
      showPinModal(studentChip.getAttribute("data-select-student"), studentChip.getAttribute("data-select-name"));
      return;
    }

    var switchBtn = e.target.closest("#btn-switch-user");
    if (switchBtn) {
      clearStudentSession();
      app.student = null;
      app.progress = {};
      app.mode = "login";
      renderAll();
      return;
    }

    var staffModeBtn = e.target.closest("#btn-staff-mode");
    if (staffModeBtn) { showStaffLoginModal(); return; }

    var exitStaffBtn = e.target.closest("#btn-exit-staff");
    if (exitStaffBtn) { exitStaffMode(); return; }

    // スクラッチ街道ノードのクリック
    var scratchBtn = e.target.closest("[data-scratch-node]");
    if (scratchBtn) {
      var nodeId = scratchBtn.getAttribute("data-scratch-node");
      var st = scratchNodeState(nodeId);
      if (st === "locked") {
        scratchBtn.classList.add("shake");
        setTimeout(function () { scratchBtn.classList.remove("shake"); }, 400);
        toast("🔒 まだひらいていません");
        return;
      }
      if (st === "pending") { toast("⏳ かくにんまちです。講師の確認をまってね"); return; }
      if (st === "done") { toast("🏅 クリア済みのバッジです"); return; }
      if (st === "current") {
        if (!app.student) return;
        // 楽観的UI更新
        app.progress[nodeId] = "pending";
        renderStudentApp();
        toast("✋ かくにんをおねがいしました");
        gasPost("request_review", { student_id: app.student.studentId, pin: app.student.pin, region_id: "scratch", node_id: nodeId })
          .then(function (res) {
            if (res && res.success) {
              app.progress = {};
              (res.progress || []).forEach(function (p) { app.progress[p.node_id] = p.status; });
              renderStudentApp();
            } else {
              // サーバー側で拒否された場合（INVALID_STATE等）は再ログインして正の状態に同期
              toast("申請に失敗しました。状態を再取得します");
              resyncScratchProgress();
            }
          }).catch(function () {
            // fetch自体が失敗（通信断・タイムアウト等）した場合も、楽観的更新した pending 表示を
            // サーバーの正の状態（実際にはまだ current の可能性が高い）に再同期する
            toast("通信エラーが発生しました。状態を再取得します");
            resyncScratchProgress();
          });
        return;
      }
      return;
    }

    // ハードコード区画（動画/3Dプリンタ/霧の道）のクリック
    var hardcodedBtn = e.target.closest("[data-hardcoded-node]");
    if (hardcodedBtn) {
      var regionId = hardcodedBtn.getAttribute("data-hardcoded-region");
      var region = HARDCODED_REGIONS.filter(function (r) { return r.id === regionId; })[0];
      var hNodeId = hardcodedBtn.getAttribute("data-hardcoded-node");
      if (region.fog) { toast("🌫 まだ霧の中…けんとう中です"); return; }
      var hst = hardcodedState[hNodeId];
      var idx = region.nodes.findIndex(function (n) { return n.id === hNodeId; });
      if (hst === "locked") {
        hardcodedBtn.classList.add("shake");
        setTimeout(function () { hardcodedBtn.classList.remove("shake"); }, 400);
        toast("🔒 まだひらいていません");
        return;
      }
      if (hst === "current") {
        hardcodedState[hNodeId] = "done";
        var next = region.nodes[idx + 1];
        if (next && hardcodedState[next.id] === "locked") hardcodedState[next.id] = "current";
        toast("✅ バッジを獲得しました：" + region.nodes[idx].title);
        renderStudentApp();
        return;
      }
      if (hst === "done") { toast("🏅 クリア済みのバッジです"); return; }
      return;
    }

    // 講師モード: 承認
    var approveBtn = e.target.closest("[data-approve-node]");
    if (approveBtn) {
      var apStudent = approveBtn.getAttribute("data-approve-student");
      var apNode = approveBtn.getAttribute("data-approve-node");
      var approvedBy = window.prompt("承認する講師名（任意・空欄でもOK）", "") || "";
      gasPost("approve_node", { staff_password: app.staffPassword, student_id: apStudent, region_id: "scratch", node_id: apNode, approved_by: approvedBy })
        .then(function (res) {
          if (res && res.success) { toast("承認しました"); refreshStaffList(); }
          else { toast("承認に失敗しました"); }
        }).catch(function () { toast("通信エラーが発生しました"); });
      return;
    }

    // 講師モード: 差し戻し
    var rejectBtn = e.target.closest("[data-reject-node]");
    if (rejectBtn) {
      var rjStudent = rejectBtn.getAttribute("data-reject-student");
      var rjNode = rejectBtn.getAttribute("data-reject-node");
      var comment = window.prompt("差し戻しコメント（任意・空欄でもOK）", "") || "";
      gasPost("reject_node", { staff_password: app.staffPassword, student_id: rjStudent, region_id: "scratch", node_id: rjNode, comment: comment })
        .then(function (res) {
          if (res && res.success) { toast("差し戻しました"); refreshStaffList(); }
          else { toast("差し戻しに失敗しました"); }
        }).catch(function () { toast("通信エラーが発生しました"); });
      return;
    }
  });

  // ============================================================
  // 初期化
  // ============================================================
  function init() {
    var restored = loadStudentSession();
    if (restored) {
      app.mode = "student";
      app.student = restored;
      renderHeaderActions();
      document.getElementById("app-root").innerHTML = '<p class="empty-note">よみこみ中…</p>';
      gasPost("login", { student_id: restored.studentId, pin: restored.pin }).then(function (res) {
        if (res && res.success) {
          app.progress = {};
          (res.progress || []).forEach(function (p) { app.progress[p.node_id] = p.status; });
          renderAll();
        } else {
          clearStudentSession();
          app.mode = "login";
          app.student = null;
          renderAll();
        }
      }).catch(function () {
        renderAll();
      });
    } else {
      renderAll();
    }
  }

  init();
})();
