// コツパス ― 毎日10分のITパスポート学習（試作 v0.5）
// 保存はこの端末（localStorage）。ログインしたときは Firebase（Firestore）にも保存して、ほかの端末と同期する。
(function () {
  "use strict";

  const KEY = "ipass10.v1";
  const QS = window.QUESTIONS || [];
  const BY_ID = Object.fromEntries(QS.map(q => [q.id, q]));
  const FIELDS = {
    technology: { name: "テクノロジ系", ratio: 0.45 },
    strategy: { name: "ストラテジ系", ratio: 0.35 },
    management: { name: "マネジメント系", ratio: 0.20 }
  };
  const FIELD_ORDER = ["strategy", "management", "technology"];
  const INTERVALS = [1, 3, 7, 14, 30];        // 間違い→1日後、正解のたびに 3→7→14→30日後
  const MINUTE_STEPS = [3, 5, 10, 15, 20, 30];  // 1日の時間のめもり
  const PER_DAY = { 3: 2, 5: 3, 10: 5, 15: 8, 20: 10, 30: 15 }; // 1日の分数 → 問題数（解説こみで1問約2分）
  const PHASES = [
    { end: 0.2, name: "用語になれる" },
    { end: 0.7, name: "分野を一周" },
    { end: 0.9, name: "弱点つぶし" },
    { end: 1.0, name: "仕上げ" }
  ];
  const MARKS = ["ア", "イ", "ウ", "エ"];
  // 必要な勉強時間の目安（ユーキャン：初学者 約180時間／ITの知識がある人 約30〜50時間）
  // 腕試しの実力 k（0〜1）から 30 + 150×(1−k) 時間と見積もる
  const HOURS_BEGINNER = 180, HOURS_MIN = 30;
  const MIN_PER_Q = 2;                          // 解説こみで1問あたり約2分
  const NEW_SYSTEM = "2027-04-01";             // 2027年度から新しい試験制度（IPA）
  const PLACE_PER_FIELD = 4;                    // 腕試し：分野ごとに4問（計12問）

  // ───── 日付 ─────
  const pad = n => String(n).padStart(2, "0");
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => fmt(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000); // a - b
  const mondayOf = s => { const d = parse(s); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return fmt(d); };

  // ───── 保存 ─────
  function fresh() {
    return {
      settings: null,
      rec: {},
      log: [],
      streak: { count: 0, last: null, best: 0 },
      freeze: { left: 1, week: null, used: [] },
      days: {},
      session: null
    };
  }
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = fresh(); }
  function save() {
    S.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 保存できない環境でも動かす */ }
    syncSoon();
  }
  // 前の版（日にちだけを決めていた設定）からの引っ越し
  if (S.settings && !S.settings.targetMonth) {
    S.settings.targetMonth = S.settings.examDate.slice(0, 7);
    S.settings.examExact = false; S.settings.ngDays = S.settings.ngDays || [];
  }
  if (S.settings && !S.auth) S.auth = { mode: "guest" }; // 前の版から使っている人はゲストとして続ける

  // ───── 連続記録とおやすみ券 ─────
  function checkStreak() {
    const t = today();
    if (S.streak.last && S.streak.last !== t) {
      const missed = diffDays(t, S.streak.last) - 1;
      if (missed >= 1) {
        if (missed <= S.freeze.left) {
          for (let i = 1; i <= missed; i++) S.freeze.used.push(addDays(S.streak.last, i));
          S.freeze.left -= missed;
          S.streak.last = addDays(t, -1);      // 休んだ日を券で埋めた
          S.notice = `おやすみ券を${missed}枚使って、連続記録を守りました。`;
        } else {
          if (S.streak.count > 0) S.notice = `連続記録がとぎれました（${S.streak.count}日）。今日からまた1日目です。`;
          S.streak.count = 0;
        }
      }
    }
    const wk = mondayOf(t);
    if (S.freeze.week !== wk) { S.freeze.week = wk; S.freeze.left = 1; } // 毎週月曜に1枚（ためられない）
    save();
  }

  function finishDay() {
    const t = today();
    if (S.days[t]) return;
    S.days[t] = true;
    if (S.streak.last === addDays(t, -1)) S.streak.count += 1;
    else if (S.streak.last !== t) S.streak.count = 1;
    S.streak.last = t;
    S.streak.best = Math.max(S.streak.best, S.streak.count);
    save();
  }

  // ───── 計画 ─────
  function phaseInfo() {
    const st = S.settings;
    const total = Math.max(1, diffDays(st.examDate, st.start));
    const left = diffDays(st.examDate, today());
    const frac = Math.min(1, Math.max(0, 1 - left / total));
    const idx = PHASES.findIndex(p => frac < p.end || p.end === 1);
    return { left, frac, idx };
  }

  // ───── 実力の目安（足切りメーター） ─────
  function fieldStats() {
    const out = {};
    for (const f of FIELD_ORDER) {
      const recent = S.log.filter(l => l.f === f).slice(-30);
      const n = recent.length;
      const acc = n ? recent.reduce((a, l) => a + (l.ok ? (l.h ? 0.5 : 1) : 0), 0) / n : 0; // ヒントつき正解は半分
      out[f] = { n, acc, score: Math.round(acc * 1000) };
    }
    const enough = FIELD_ORDER.every(f => out[f].n >= 5);
    const total = Math.round(FIELD_ORDER.reduce((s, f) => s + out[f].acc * FIELDS[f].ratio, 0) * 1000);
    return { per: out, enough, total };
  }

  // ───── 今日のメニュー ─────
  function buildSession(count, extra) {
    const t = today();
    const seen = new Set(Object.keys(S.rec));
    const due = Object.entries(S.rec)
      .filter(([id, r]) => r.due <= t && BY_ID[id])
      .sort((a, b) => a[1].due.localeCompare(b[1].due))
      .map(([id]) => id);
    const picked = [];
    const take = id => { if (id && !picked.includes(id)) picked.push(id); };

    // 1) 復習（期限が来たもの）を最大4割
    due.slice(0, Math.ceil(count * 0.4)).forEach(take);

    // 2) 新しい問題：本番の出題比率に近づくように分野を選ぶ。弱点つぶし以降は弱い分野を優先
    const ph = phaseInfo();
    const stats = fieldStats();
    const fieldCount = f => QS.filter(q => q.field === f && (seen.has(q.id) || picked.includes(q.id))).length;
    while (picked.length < count) {
      const unseen = QS.filter(q => !seen.has(q.id) && !picked.includes(q.id));
      if (!unseen.length) break;
      const avail = FIELD_ORDER.filter(f => unseen.some(q => q.field === f));
      let f;
      if (ph.idx >= 2 && stats.enough) {
        f = avail.slice().sort((a, b) => stats.per[a].acc - stats.per[b].acc)[0];
      } else {
        const totalSeen = avail.reduce((s, x) => s + fieldCount(x), 0) || 1;
        f = avail.slice().sort((a, b) =>
          (FIELDS[b].ratio - fieldCount(b) / totalSeen) - (FIELDS[a].ratio - fieldCount(a) / totalSeen))[0];
      }
      take(unseen.find(q => q.field === f).id);
    }

    // 3) まだ足りなければ、残りの復習 → 正答率の低い問題から
    due.forEach(id => { if (picked.length < count) take(id); });
    if (picked.length < count) {
      Object.entries(S.rec)
        .filter(([id]) => BY_ID[id])
        .sort((a, b) => (a[1].ok / a[1].n) - (b[1].ok / b[1].n))
        .forEach(([id]) => { if (picked.length < count) take(id); });
    }
    S.session = { day: t, ids: picked, i: 0, answered: null, results: [], extra: !!extra };
    save();
  }

  function answer(choice) {
    const s = S.session;
    const q = BY_ID[s.ids[s.i]];
    const ok = choice === q.answer;
    const hinted = !!s.hinted && s.mode !== "placement";
    s.answered = choice;
    s.results.push(ok);
    (s.hints = s.hints || []).push(hinted);
    const r = S.rec[q.id] || { box: 0, due: today(), n: 0, ok: 0 };
    const wasMastered = r.box >= 2, review = r.n > 0;
    r.n += 1;
    if (ok && !hinted) { r.ok += 1; r.box = Math.min(r.box + 1, INTERVALS.length - 1); r.due = addDays(today(), INTERVALS[r.box]); }
    else if (ok && hinted) { r.ok += 0.5; r.hint = (r.hint || 0) + 1; r.due = addDays(today(), INTERVALS[0]); } // ヒントつき正解：段階は上げず、明日もう一度
    else { r.box = 0; r.due = addDays(today(), INTERVALS[0]); }
    S.rec[q.id] = r;
    S.log.push(hinted ? { d: today(), id: q.id, f: q.field, ok, h: 1 } : { d: today(), id: q.id, f: q.field, ok });
    if (S.log.length > 600) S.log = S.log.slice(-600);
    S.qCount = (S.qCount || 0) + 1;
    if (s.mode !== "placement" && window.BUDDY) {
      s.react = BUDDY.react({ ok, hinted, review, mastered: !wasMastered && r.box >= 2, count: masteredCount(),
        stage: buddyStage(), seed: S.qCount });
    }
    if (s.mode === "placement") {
      s.marks.push(choice === -1 ? "u" : ok ? "c" : "w");
      s.i += 1; s.answered = null;
      if (s.i >= s.ids.length) finishPlacement();
    }
    save();
    render();
  }

  function next() {
    const s = S.session;
    s.i += 1; s.answered = null; s.hinted = false; s.react = null;
    if (s.i >= s.ids.length) {
      if (!s.extra) finishDay();
      s.done = true;
    }
    save();
    render();
  }

  // ───── 画面 ─────
  const $view = document.getElementById("view");
  const $badge = document.getElementById("streakBadge");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tag = f => `<span class="tag ${f}">${FIELDS[f].name}</span>`;

  // ───── 育てるAI（buddy.js） ─────
  const masteredCount = () => Object.values(S.rec).filter(r => r.box >= 2).length;   // ヒントなしで2回正解＝身についた
  const buddyStage = () => BUDDY.stageOf(masteredCount(), QS.length);
  const buddyName = () => (S.buddy && S.buddy.name) || BUDDY.DEFAULT_NAME;
  // 段階が上がったかを調べ、上がっていれば記録して前の段階を返す
  function buddyCheck() {
    const st = buddyStage();
    const before = S.buddy.stage || 0;
    if (st.i !== before) { S.buddy.stage = st.i; save(); }
    return { st, before };
  }
  const bubble = (mood, text, opts) => `<div class="buddy-say${opts && opts.small ? " small" : ""}">
      <div class="buddy-face">${BUDDY.svg(buddyStage().key, mood, opts && opts.small ? 56 : 80)}</div>
      <div class="buddy-bubble">${opts && opts.head ? `<div class="buddy-name">${esc(opts.head)}</div>` : ""}${esc(text)}</div>
    </div>`;
  function renderNaming() {
    $view.innerHTML = `
      <div class="card buddy-card">
        <div class="buddy-face big">${BUDDY.svg("egg", "normal", 120)}</div>
        <h2>AIの卵が届きました</h2>
        <p>この卵の中には、まだ何も知らない小さなAIがいます。あなたが問題を解いて身についた問題が増えるほど、このAIも覚えて育ちます。</p>
        <p class="sub">卵 → ビット → バイト → キロ → メガ → ギガ（ギガが合格の目安）</p>
        <label class="sub" for="bdName">名前をつけてください</label>
        <input id="bdName" maxlength="10" value="${esc(BUDDY.DEFAULT_NAME)}">
        <button class="primary go" id="bdOk">この名前にする</button>
      </div>`;
    $view.querySelector("#bdOk").onclick = () => {
      const v = $view.querySelector("#bdName").value.trim() || BUDDY.DEFAULT_NAME;
      S.buddy = { name: v.slice(0, 10), born: today(), stage: buddyStage().i, greeted: false };
      save(); render();
    };
  }
  function buddyHomeHtml() {
    const { st, before } = buddyCheck();
    const t = today();
    const past = Object.keys(S.days).filter(d => d < t).sort();
    const last = past[past.length - 1];
    const y = addDays(t, -1);
    const ph = phaseInfo();
    const firstTime = !S.buddy.greeted;
    if (firstTime) { S.buddy.greeted = true; save(); }
    const away = last && !S.days[t] ? diffDays(t, last) : 0;
    const text = st.i > before
      ? BUDDY.finish({ okN: 0, total: 0, stage: st, before })
      : BUDDY.greet({
          stage: st, today: t, firstTime, n: PER_DAY[S.settings.minutes] || 5,
          left: ph.left, examExact: !!S.settings.examExact, doneToday: !!S.days[t], away,
          wrongYesterday: new Set(S.log.filter(l => l.d === y && !l.ok).map(l => l.id)).size
        });
    const mood = st.i > before ? "wow" : away >= 3 ? "sad" : S.days[t] ? "happy" : "normal";
    const span = Math.max(1, st.nextAt - st.from), got = masteredCount() - st.from;
    return `<div class="card buddy-card">
      ${bubble(mood, text, { head: `${buddyName()}（${st.name}）` })}
      <div class="buddy-grow">
        <div class="sub">${st.next ? `${st.next}まで あと${st.toNext}問` : "ギガ（合格の目安）に到達"}　・　身についた問題 ${masteredCount()} / ${QS.length}</div>
        <div class="track"><div class="fill" style="width:${st.next ? Math.min(100, Math.round(got / span * 100)) : 100}%"></div></div>
      </div>
    </div>`;
  }

  function render() {
    window.scrollTo(0, 0);
    if (!S.auth) return renderLogin();
    $badge.hidden = !S.settings;
    $badge.textContent = `連続 ${S.streak.count}日`;
    if (!S.settings) return renderSetup();
    if (!S.buddy) return renderNaming();
    const s = S.session;
    if (s && s.mode === "placement") return s.done ? renderPlacementResult() : renderPlacement();
    if (s && s.day === today() && !s.done) return renderQuiz();
    if (s && s.day === today() && s.done) return renderDone();
    return renderHome();
  }

  // ───── 最初の設定（試験日・住んでいる県と会場・1日の時間） ─────
  const WD = ["日", "月", "火", "水", "木", "金", "土"];
  const jpDate = s => { const d = parse(s); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`; };
  const jpYmd = s => { const [y, m, d] = s.split("-").map(Number); return `${y}年${m}月${d}日`; };
  const REGIONS = [
    ["北海道・東北", "北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県"],
    ["関東", "茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県"],
    ["中部", "新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県"],
    ["近畿", "三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県"],
    ["中国", "鳥取県 島根県 岡山県 広島県 山口県"],
    ["四国", "徳島県 香川県 愛媛県 高知県"],
    ["九州・沖縄", "福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県"]
  ];
  const V = window.VENUES || { list: [] };
  const venuesOf = pref => V.list.filter(v => v[0] === pref);
  const prefPdf = pref => "https://www3.jitec.ipa.go.jp/JitesCbt/html/examhall/pdf/" + encodeURIComponent(pref + "_試験開催状況一覧") + ".pdf";
  const venueOpenOn = (sched, dateStr) => {           // 会場の基本の開催曜日に、選んだ日が入るか
    const wd = parse(dateStr).getDay();
    if (!/曜日|平日/.test(sched)) return null;          // 曜日の記載がない会場は判定しない
    if (sched.includes(WD[wd] + "曜日")) return true;
    return wd >= 1 && wd <= 5 && sched.includes("平日");
  };

  // ───── 試験日程（IPA「試験開催状況一覧」の取り込み） ─────
  const SCH = window.SCHEDULE || { prefs: {}, venues: {} };
  const APPLY_URL = "https://www3.jitec.ipa.go.jp/JitesCbt/html/application/applies.html";
  const monthEnd = ym => { const [y, m] = ym.split("-").map(Number); return fmt(new Date(y, m, 0)); };
  const jpYm = ym => { const [y, m] = ym.split("-").map(Number); return `${y}年${m}月`; };
  const asOfText = s => { const m = (s || "").match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d+)時)?/); return m ? `${+m[1]}年${+m[2]}月${+m[3]}日${m[4] ? " " + m[4] + "時" : ""}` : ""; };
  // その県の会場：会場一覧（venues.js）＋日程にだけ出てくる会場
  function venuesFor(pref) {
    const list = venuesOf(pref).map(v => ({ name: v[2], city: v[1], access: v[4], sched: v[5] }));
    Object.entries(SCH.venues).forEach(([name, x]) => {
      if (x.p === pref && !list.some(v => v.name === name)) list.push({ name, city: "", access: "", sched: "" });
    });
    return list;
  }
  // 会場の、その月の回（受けられない曜日をのぞく）
  function slotsFor(venue, ym, ng) {
    const x = SCH.venues[venue];
    if (!x) return [];
    return x.s.filter(r => r[0].startsWith(ym) && r[0] >= addDays(today(), 1) && !(ng || []).includes(parse(r[0]).getDay()));
  }
  const lastPublished = venue => { const x = SCH.venues[venue]; return x && x.s.length ? x.s[x.s.length - 1][0] : null; };

  function renderSetup(editing) {
    const st = S.settings || {};
    const firstYm = today().slice(0, 7);
    let ym = st.targetMonth || addDays(today(), 90).slice(0, 7);
    let ng = (st.ngDays || []).slice();
    let pref = st.pref || "";
    let venue = st.venue || "";
    let slot = st.examExact ? { d: st.examDate, t: st.examTime } : null;
    let mIdx = Math.max(0, MINUTE_STEPS.indexOf(st.minutes || 10));

    $view.innerHTML = `
      <h1>${editing ? "設定" : "はじめに決めること"}</h1>
      <p class="sub">決めたことから逆算して、毎日のメニューを自動でつくります。どれもあとで変えられます。</p>

      <h2>1. いつまでに受けますか？</h2>
      <p class="sub">日にちはまだ決めなくて大丈夫です。「何月までに受けるか」だけ決めましょう。</p>
      <div class="months" id="months"></div>
      <p id="monthOut" class="pick"></p>

      <h2>2. 受けられない曜日</h2>
      <p class="sub">授業や仕事で受けられない曜日をタップしてください（日程さがしのときに外します）。</p>
      <div class="days" id="ng"></div>

      <h2>3. 住んでいるところ（受ける会場）</h2>
      <select id="pref"><option value="">都道府県をえらぶ</option>
        ${REGIONS.map(([r, ps]) => `<optgroup label="${r}">${ps.split(" ").map(p => `<option ${p === pref ? "selected" : ""}>${p}</option>`).join("")}</optgroup>`).join("")}
      </select>
      <div id="venues"></div>
      <div id="slots"></div>

      <h2>4. 1日に使う時間</h2>
      <div class="slider">
        <input id="min" type="range" min="0" max="${MINUTE_STEPS.length - 1}" step="1" value="${mIdx}">
        <div class="ticks">${MINUTE_STEPS.map(m => `<span>${m}</span>`).join("")}</div>
      </div>
      <p id="minOut" class="pick"></p>

      <p style="margin-top:20px"><button class="primary go" id="go">${editing ? "保存する" : "この計画ではじめる"}</button></p>
      ${editing ? `<div class="links"><button id="back">もどる</button><button id="reset">データを全部消す</button></div>` : ""}
    `;

    const drawMonths = () => {
      const start = parse(today()); start.setDate(1);
      let html = "";
      for (let i = 0; i < 12; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const key = fmt(d).slice(0, 7);
        if (key === firstYm && diffDays(monthEnd(key), today()) < 7) continue; // 今月が残り1週間を切っていたら出さない
        const label = (i === 0 || d.getMonth() === 0) ? `${d.getFullYear()}年<br>${d.getMonth() + 1}月` : `${d.getMonth() + 1}月`;
        html += `<button data-ym="${key}" class="${key === ym ? "on" : ""}">${label}</button>`;
      }
      $view.querySelector("#months").innerHTML = html;
      $view.querySelectorAll("#months button").forEach(b => b.onclick = () => { ym = b.dataset.ym; slot = null; drawMonths(); drawVenues(); drawSlots(); });
      const left = diffDays(monthEnd(ym), today());
      $view.querySelector("#monthOut").innerHTML = `<b>${jpYm(ym)}中</b>に受ける　月末まであと <b>${left}日</b>${ym >= NEW_SYSTEM.slice(0, 7) ? `<br><span class="sub">※ 2027年4月から新しい試験制度になる予定です（IPA）。範囲が変わるかもしれません。</span>` : ""}`;
    };
    const drawNg = () => {
      $view.querySelector("#ng").innerHTML = WD.map((w, i) => `<button data-w="${i}" class="${ng.includes(i) ? "ng" : ""} ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}${ng.includes(i) ? "<small>×</small>" : ""}</button>`).join("");
      $view.querySelectorAll("#ng button").forEach(b => b.onclick = () => {
        const w = Number(b.dataset.w);
        ng = ng.includes(w) ? ng.filter(x => x !== w) : ng.concat(w);
        if (slot && ng.includes(parse(slot.d).getDay())) slot = null;
        drawNg(); drawVenues(); drawSlots();
      });
    };
    const drawVenues = () => {
      const box = $view.querySelector("#venues");
      if (!pref) { box.innerHTML = `<p class="sub">えらぶと、その県の試験会場と、発表ずみの試験日がわかります。</p>`; return; }
      const vs = venuesFor(pref);
      box.innerHTML = `
        <p class="sub">${pref}の会場は${vs.length}か所です。受ける予定の会場をタップしてください。</p>
        <div class="venues">${vs.map(v => {
          const n = new Set(slotsFor(v.name, ym, ng).map(r => r[0])).size;
          return `<button class="venue ${v.name === venue ? "on" : ""}" data-v="${esc(v.name)}">
            <b>${esc(v.name)}</b>
            ${v.access ? `<span>${esc(v.city)}・${esc(v.access)}</span>` : ""}
            ${v.sched ? `<span>開催の目安：${esc(v.sched)}</span>` : ""}
            <span class="${n ? "okc" : ""}">${n ? `${jpYm(ym)}の試験日：${n}日分 発表ずみ` : `${jpYm(ym)}の試験日：まだ発表されていません`}</span>
          </button>`;
        }).join("")}</div>`;
      box.querySelectorAll(".venue").forEach(b => b.onclick = () => { venue = b.dataset.v; slot = null; drawVenues(); drawSlots(); });
    };
    const drawSlots = () => {
      const box = $view.querySelector("#slots");
      if (!pref || !venue) { box.innerHTML = ""; return; }
      const rows = slotsFor(venue, ym, ng);
      const asOf = asOfText(SCH.prefs[pref]);
      const note = `<div class="note">
          <p>※ 試験日・開始時刻・空席は、IPA「試験開催状況一覧」<b>${asOf}時点</b>の情報です。空席はすぐに変わります。申し込む前に必ず<a href="${APPLY_URL}" target="_blank" rel="noopener">IPAの受験申込みのページ</a>で確認してください。</p>
          <p>県ごとの最新の一覧：<a href="${prefPdf(pref)}" target="_blank" rel="noopener">${pref}の試験開催状況一覧（IPA）</a>／会場の情報は「CBT試験会場一覧」${jpYmd(V.asOf)}時点</p>
        </div>`;
      if (!rows.length) {
        const last = lastPublished(venue);
        box.innerHTML = `<h3 class="slot-h">${esc(venue)}の${jpYm(ym)}の日程</h3>
          <p>まだ発表されていません。${last ? `いまは${jpYmd(last)}の回まで出ています。` : ""}発表されたら、ホームでお知らせします。それまでは「${jpYm(ym)}中に受ける」で計画を立てます。</p>${note}`;
        return;
      }
      const byDay = {};
      rows.forEach(r => (byDay[r[0]] = byDay[r[0]] || []).push(r));
      box.innerHTML = `<h3 class="slot-h">${esc(venue)}の${jpYm(ym)}の日程</h3>
        <p class="sub">受ける回をタップすると、その日に向けて計画を立てます。まだ決めないなら、えらばなくて大丈夫です。</p>
        <div class="slotlist">${Object.entries(byDay).map(([d, rs]) => `
          <div class="slotday"><b>${jpDate(d).replace(/^\d+年/, "")}</b>
            <div class="slottimes">${rs.map(r => {
              const on = slot && slot.d === r[0] && slot.t === r[1];
              return `<button class="${on ? "on" : ""}" data-d="${r[0]}" data-t="${r[1]}" ${r[3] === 0 ? "disabled" : ""}>${r[1]}〜<small>${r[3] === 0 ? "満席" : `空席${r[3]}`}</small></button>`;
            }).join("")}</div>
          </div>`).join("")}</div>
        ${slot ? `<p class="pick">えらんだ回：<b>${jpDate(slot.d)} ${slot.t}〜</b>　<a href="#" id="unslot">日にちはまだ決めない</a></p>` : ""}
        ${note}`;
      box.querySelectorAll(".slottimes button").forEach(b => b.onclick = () => { slot = { d: b.dataset.d, t: b.dataset.t }; drawSlots(); });
      const un = box.querySelector("#unslot");
      if (un) un.onclick = e => { e.preventDefault(); slot = null; drawSlots(); };
    };
    const drawMin = () => {
      const m = MINUTE_STEPS[mIdx];
      $view.querySelector("#minOut").innerHTML = `<b>${m}分</b>＝1日${PER_DAY[m]}問と、その解説です。${m === 10 ? "（おすすめ）" : m < 10 ? "まずは続けることがいちばんです。" : ""}`;
    };
    drawMonths(); drawNg(); drawVenues(); drawSlots(); drawMin();
    $view.querySelector("#pref").onchange = e => { pref = e.target.value; venue = ""; slot = null; drawVenues(); drawSlots(); };
    $view.querySelector("#min").oninput = e => { mIdx = Number(e.target.value); drawMin(); };

    $view.querySelector("#go").onclick = () => {
      S.settings = Object.assign({}, st, {
        targetMonth: ym, ngDays: ng, pref, venue,
        examExact: !!slot, examDate: slot ? slot.d : monthEnd(ym), examTime: slot ? slot.t : "",
        applied: slot && st.examExact && st.examDate === slot.d && st.examTime === slot.t ? !!st.applied : false,
        minutes: MINUTE_STEPS[mIdx], start: st.start || today()
      });
      save(); render();
    };
    if (editing) {
      $view.querySelector("#back").onclick = render;
      const rb = $view.querySelector("#reset");
      rb.onclick = () => {
        if (rb.dataset.sure) { const a = S.auth; S = fresh(); S.auth = a; save(); render(); return; }
        rb.dataset.sure = "1"; rb.textContent = "本当に消す（もう一度押す）";
      };
    }
  }

  // ホームの「試験」カード
  function examHtml() {
    const st = S.settings;
    const place = st.venue ? `${esc(st.venue)}（${esc(st.pref)}）` : st.pref ? `${esc(st.pref)}・会場はまだ` : "会場はまだ";
    if (st.examExact) {
      return `<div class="card exam">
        <div class="sub">試験の日</div>
        <b>${jpDate(st.examDate)} ${esc(st.examTime)}〜</b>
        <div>${place}</div>
        ${st.applied
          ? `<p class="okc">申し込みずみ</p>`
          : `<div class="choicebtns"><a class="btnlink" href="${APPLY_URL}" target="_blank" rel="noopener">IPAのページで申し込む</a><button id="applied">申し込みました</button></div>
             <p class="sub">空席は ${asOfText(SCH.prefs[st.pref])}時点の情報です。</p>`}
      </div>`;
    }
    const n = st.venue ? new Set(slotsFor(st.venue, st.targetMonth, st.ngDays).map(r => r[0])).size : 0;
    return `<div class="card exam">
      <div class="sub">試験</div>
      <b>${jpYm(st.targetMonth)}中に受ける</b>
      <div>${place}</div>
      ${n ? `<p class="okc">${jpYm(st.targetMonth)}の試験日が${n}日分 発表されています。</p><button id="pickDay">受ける日をえらぶ</button>`
          : st.venue ? `<p class="sub">${jpYm(st.targetMonth)}の試験日は、まだ発表されていません（${asOfText(SCH.prefs[st.pref])}時点）。</p>` : ""}
    </div>`;
  }

  // ───── 学習の道（分野ごとの単元を1本の道に並べる） ─────
  function units() {
    const out = [];
    FIELD_ORDER.forEach(f => {
      const cats = [];
      QS.filter(q => q.field === f).forEach(q => { const c = q.category.replace(/（.*$/, ""); if (!cats.includes(c)) cats.push(c); });
      cats.forEach(c => {
        const qs = QS.filter(q => q.field === f && q.category.replace(/（.*$/, "") === c);
        const mastered = qs.filter(q => S.rec[q.id] && S.rec[q.id].box >= 2).length;   // ヒントなしで2回正解＝身についた
        const seen = qs.filter(q => S.rec[q.id]).length;
        out.push({ f, c, ids: qs.map(q => q.id), n: qs.length, mastered, seen });
      });
    });
    return out;
  }
  function pathHtml() {
    const us = units();
    const cur = us.findIndex(u => u.mastered < u.n);
    let lastF = "";
    const zig = [0, 1, 2, 1];
    return `<div class="card path">
      <h2 style="margin-top:0">学習の道</h2>
      <p class="sub">単元をタップすると、その単元の問題を5問つづけて解けます（毎日の連続記録とは別です）。</p>
      ${us.map((u, i) => {
        const head = u.f !== lastF ? `<div class="path-field ${u.f}">${FIELDS[u.f].name}</div>` : "";
        lastF = u.f;
        const state = u.mastered === u.n ? "done" : i === cur ? "now" : u.seen ? "some" : "";
        return `${head}<div class="path-row z${zig[i % 4]}">
          <button class="node ${u.f} ${state}" data-u="${i}" aria-label="${esc(u.c)}">${state === "done" ? "済" : i === cur ? "▶" : i + 1}</button>
          <div class="node-label"><b>${esc(u.c)}</b><span>${u.mastered}/${u.n}問 身についた${i === cur ? "・いまここ" : ""}</span></div>
        </div>`;
      }).join("")}
    </div>`;
  }
  // 単元（または道の続き）から n 問：身についていない問題を先に
  function buildPractice(unitIdx, count) {
    const us = units();
    const start = unitIdx == null ? Math.max(0, us.findIndex(u => u.mastered < u.n)) : unitIdx;
    const picked = [];
    for (let i = start; i < us.length && picked.length < count; i++) {
      us[i].ids.slice().sort((x, y) => ((S.rec[x] || {}).box || 0) - ((S.rec[y] || {}).box || 0))
        .forEach(id => { if (picked.length < count) picked.push(id); });
    }
    if (!picked.length) return false;
    S.session = { day: today(), ids: picked, i: 0, answered: null, results: [], extra: true, practice: true };
    save(); render();
    return true;
  }

  function renderHome() {
    const done = !!S.days[today()];
    const n = PER_DAY[S.settings.minutes] || 5;
    const notice = S.notice; delete S.notice; save();
    const ph = phaseInfo();
    $view.innerHTML = `
      ${notice ? `<div class="card">${esc(notice)}</div>` : ""}
      ${buddyHomeHtml()}
      ${done
        ? `<div class="card"><b>今日のぶんは終わりました。</b><p class="sub">もっと解きたいときは、ここから続けられます（連続記録とは別です）。</p>
             <button class="primary go" id="more"><span class="play">▶</span>道の続きを5問</button></div>`
        : `<button class="primary go pulse" id="start"><span class="play">▶</span>今日の${n}問をはじめる<small>約${S.settings.minutes}分</small></button>`}
      <div class="row">
        <div class="card"><div class="sub">${S.settings.examExact ? "試験まで" : "月末まで"}</div><div class="big">${Math.max(0, ph.left)}<small style="font-size:16px">日</small></div></div>
        <div class="card"><div class="sub">連続</div><div class="big">${S.streak.count}<small style="font-size:16px">日</small></div>
          <div class="sub">おやすみ券 ${S.freeze.left}枚</div></div>
      </div>
      ${examHtml()}
      ${paceHtml()}
      ${pathHtml()}
      <div class="card">
        <div class="sub">いまの段階</div>
        <div class="phase">${PHASES.map((p, i) => `<div class="${i === ph.idx ? "now" : ""}">${p.name}</div>`).join("")}</div>
        <p class="sub">${phaseHint(ph.idx)}</p>
      </div>
      ${meterHtml()}
      <div class="links"><button id="settings">設定</button>${accountButton()}</div>
      <p class="sub">収録 ${QS.length}問（試作版）</p>
    `;
    const on = (sel, fn) => { const b = $view.querySelector(sel); if (b) b.onclick = e => { e.preventDefault(); fn(); }; };
    on("#start", () => { buildSession(n, false); render(); });
    on("#more", () => buildPractice(null, 5));
    on("#settings", () => renderSetup(true));
    on("#pickDay", () => renderSetup(true));
    on("#applied", () => { S.settings.applied = true; save(); render(); });
    on("#account", renderAccount);
    $view.querySelectorAll(".node").forEach(b => b.onclick = () => buildPractice(Number(b.dataset.u), 5));
    bindPace();
  }

  function meterHtml() {
    const st = fieldStats();
    const rows = FIELD_ORDER.map(f => {
      const p = st.per[f];
      const w = Math.max(2, p.score / 10);
      const low = p.n >= 5 && p.score < 400;
      return `<div class="meter">
        <div class="name"><span>${FIELDS[f].name}</span>
          <span class="${low ? "danger" : ""}">${p.n >= 5 ? `${p.score}点${low ? "（足切り注意）" : ""}` : `あと${5 - p.n}問で表示`}</span></div>
        <div class="track"><div class="fill" style="width:${p.n >= 5 ? w : 0}%;background:var(--${f})"></div><span class="line300"></span></div>
      </div>`;
    }).join("");
    return `<div class="card">
      <h2 style="margin-top:0">合格メーター（目安）</h2>
      <p class="sub">合格は総合600点以上、かつ3分野それぞれ300点以上。赤い線が300点です。</p>
      ${rows}
      <p>${st.enough ? `総合の目安：<b>${st.total}点</b> ${st.total >= 600 ? "（合格ライン）" : "（600点まであと" + (600 - st.total) + "点）"}` : `<span class="sub">3分野とも5問ずつ解くと、総合の目安が出ます。</span>`}</p>
      <p class="sub">直近30問の正答率から出した目安です。本番の点数（IRT方式）とは一致しません。</p>
    </div>`;
  }

  // ───── ログイン（Firebase Authentication：Googleでログイン。次回からは自動でログイン） ─────
  // firebase-config.js に window.FIREBASE_CONFIG があるときだけ有効。無いときはゲストだけ。
  // 学習の記録は Firestore の users/{uid} に1つの文書として保存し、ほかの端末でも続きができる。
  const FB_VER = "10.12.2";
  const AUTH = { enabled: !!window.FIREBASE_CONFIG, user: null, db: null, timer: null };
  const loadScript = src => new Promise((ok, ng) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ng; document.head.appendChild(s); });

  async function initAuth() {
    if (!AUTH.enabled) return null;
    try {
      const b = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
      await loadScript(b + "firebase-app-compat.js");
      await Promise.all([loadScript(b + "firebase-auth-compat.js"), loadScript(b + "firebase-firestore-compat.js")]);
      firebase.initializeApp(window.FIREBASE_CONFIG);
      AUTH.db = firebase.firestore();
      await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL); // 次回から自動でログイン
      try { await firebase.auth().getRedirectResult(); } catch (e) { S.notice = "ログインできませんでした：" + e.message; }
      return await new Promise(ok => { const off = firebase.auth().onAuthStateChanged(u => { off(); ok(u); }); });
    } catch (e) {
      AUTH.enabled = false;            // 通信できないときはゲストとして動かす
      return null;
    }
  }

  async function onSignedIn(user) {
    AUTH.user = user;
    try {
      const doc = await AUTH.db.collection("users").doc(user.uid).get();
      const remote = doc.exists ? JSON.parse(doc.data().state || "null") : null;
      // 新しい方を使う（はじめての端末なら、サーバーの記録を持ってくる）
      if (remote && (!S.settings || (remote.updatedAt || 0) > (S.updatedAt || 0))) S = Object.assign(fresh(), remote);
    } catch (e) { S.notice = "記録を読み込めませんでした。この端末の記録で続けます。"; }
    S.auth = { mode: "google", uid: user.uid, name: user.displayName || user.email || "" };
    save();
  }

  function syncSoon() {
    if (!AUTH.user || !AUTH.db) return;
    clearTimeout(AUTH.timer);
    AUTH.timer = setTimeout(() => {
      AUTH.db.collection("users").doc(AUTH.user.uid)
        .set({ state: JSON.stringify(S), updatedAt: S.updatedAt || Date.now() })
        .catch(() => { /* 通信できないときは次の保存でもう一度 */ });
    }, 1500);
  }

  function googleLogin() {
    const p = new firebase.auth.GoogleAuthProvider();
    const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    (mobile ? firebase.auth().signInWithRedirect(p) : firebase.auth().signInWithPopup(p))
      .then(r => r && r.user && onSignedIn(r.user).then(render))
      .catch(e => { const el = $view.querySelector("#loginErr"); if (el) el.textContent = "ログインできませんでした：" + e.message; });
  }

  function renderLogin() {
    $badge.hidden = true;
    $view.innerHTML = `
      <div class="login">
        <h1>コツパス</h1>
        <p>ITパスポートに、毎日10分で。<br>試験日から逆算して、今日やる問題を出します。</p>
        ${AUTH.enabled
          ? `<button class="primary go" id="google">Googleでログイン</button>
             <p class="sub">ログインすると、記録がほかのスマホやパソコンでも続きから使えます。次回からは自動でログインします。</p>`
          : `<p class="sub">ログイン機能は準備中です。いまはゲストとして使えます（記録はこの端末に保存されます）。</p>`}
        <p id="loginErr" class="danger"></p>
        <button id="guest">${AUTH.enabled ? "ログインせずに使う（記録はこの端末だけ）" : "ゲストではじめる"}</button>
      </div>`;
    const g = $view.querySelector("#google");
    if (g) g.onclick = googleLogin;
    $view.querySelector("#guest").onclick = () => { S.auth = { mode: "guest" }; save(); render(); };
  }

  function accountButton() {
    return `<button id="account">${S.auth && S.auth.mode === "google" ? "アカウント" : "ログイン"}</button>`;
  }

  function renderAccount() {
    const a = S.auth || {};
    $view.innerHTML = `
      <h1>アカウント</h1>
      ${a.mode === "google"
        ? `<div class="card"><p>ログイン中：<b>${esc(a.name)}</b></p><p class="sub">記録は自動で保存され、ほかの端末でも続きから使えます。</p></div>
           <button id="logout">ログアウト</button>
           <p class="sub">ログアウトすると、この端末から記録を消します（サーバーには残ります）。</p>`
        : `<div class="card"><p>いまはゲストです。記録はこの端末だけに保存されています。</p></div>
           ${AUTH.enabled ? `<button class="primary go" id="google">Googleでログインして記録を引きつぐ</button><p id="loginErr" class="danger"></p>` : `<p class="sub">ログイン機能は準備中です。</p>`}`}
      <div class="links"><button id="back">もどる</button></div>`;
    const on = (sel, fn) => { const b = $view.querySelector(sel); if (b) b.onclick = fn; };
    on("#google", googleLogin);
    on("#back", render);
    on("#logout", () => firebase.auth().signOut().then(() => { AUTH.user = null; S = fresh(); save(); render(); }));
  }

  function phaseHint(i) {
    return [
      "まずは用語に慣れる時期です。わからなくて当たり前なので、解説を読めば十分です。",
      "3分野を本番の比率で一周する時期です。間違えた問題は、自動でまた出てきます。",
      "弱い分野を多めに出します。3分野とも300点の線をこえるのが目標です。",
      "間違えたことのある問題を中心に出します。前日は軽めにして、夜ふかしはしないでください。"
    ][i] || "";
  }

  // 問題文：改行はそのまま、"|" で始まる行のかたまりは表にする（過去問の表・プログラムを読めるように）
  function qHtml(text) {
    const lines = String(text).split("\n");
    let html = "", rows = [];
    const flush = () => {
      if (!rows.length) return;
      const cells = rows.filter(r => !/^\|[\s|:-]+\|?$/.test(r))
        .map(r => r.replace(/^\||\|\s*$/g, "").split("|").map(c => esc(c.trim())));
      html += `<div class="qtable"><table>${cells.map((r, i) => `<tr>${r.map(c => i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
      rows = [];
    };
    lines.forEach(l => {
      if (/^\s*\|/.test(l)) { rows.push(l.trim()); return; }
      flush();
      html += `<p>${esc(l)}</p>`;
    });
    flush();
    return html.replace(/<p><\/p>/g, "");
  }

  function renderQuiz() {
    const s = S.session;
    const q = BY_ID[s.ids[s.i]];
    if (!q) { next(); return; }
    const answered = s.answered !== null && s.answered !== undefined;
    const ok = answered && s.answered === q.answer;
    const pct = Math.round((s.i / s.ids.length) * 100);
    const isReview = S.rec[q.id] && S.rec[q.id].n > (answered ? 1 : 0);
    $view.innerHTML = `
      <div class="sub">${s.i + 1} / ${s.ids.length}問 ${isReview ? "・復習" : ""}</div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div>${tag(q.field)}<span class="sub">${esc(q.category)}</span></div>
      <div class="qtext">${qHtml(q.q)}</div>
      <div class="choices">
        ${q.choices.map((c, i) => {
          let cls = "";
          if (answered && i === q.answer) cls = "correct";
          else if (answered && i === s.answered) cls = "wrong";
          return `<button class="choice ${cls}" data-i="${i}" ${answered ? "disabled" : ""}><span class="mark">${MARKS[i]}</span><span>${esc(c)}</span></button>`;
        }).join("")}
      </div>
      ${q.hint && (s.hinted || !answered) ? `<div id="hintArea">${s.hinted
        ? `<div class="box hint"><h3>ヒント</h3><div class="explain">${esc(q.hint)}</div></div>`
        : `<button id="hintBtn" class="hintbtn">ヒントを見る</button>`}</div>` : ""}
      ${answered ? `
        <div class="result ${ok ? "ok" : "ng"}">${ok ? (s.hinted ? "正解！（ヒントつき）" : "正解！") : `ざんねん。正解は ${MARKS[q.answer]}`}</div>
        ${ok && s.hinted ? `<p class="sub">ヒントつきの正解は、明日もう一度出ます。次はヒントなしで解いてみましょう。</p>` : ""}
        ${s.react ? bubble(ok ? "happy" : "sad", s.react, { small: true }) : ""}
        <div class="box buddy-explain"><h3>ひとこと解説 <span class="sub">（${esc(buddyName())}のまとめ）</span></h3>
          <p class="sub">${esc(BUDDY.explainLead(buddyStage().key))}</p>
          <div class="explain">${esc(q.talk || q.short)}</div></div>
        ${q.whyWrong ? `<div class="box"><h3>ほかの選択肢</h3><ul class="why">
          ${q.whyWrong.map((w, i) => i === q.answer ? "" : `<li><b>${MARKS[i]}</b> ${esc(w)}</li>`).join("")}</ul></div>` : ""}
        ${q.society ? `<div class="box society"><h3>社会でどう役立つ？</h3><div class="explain">${esc(q.society)}</div></div>` : ""}
        ${q.memo ? `<div class="box memo"><h3>彦阪メモ</h3><div class="explain">${esc(q.memo)}</div></div>` : ""}
        <p class="source">出典：${esc(q.source)}</p>
        <button class="primary" id="next">${s.i + 1 >= s.ids.length ? (s.extra ? "おわる" : "今日はおしまい") : "つぎへ"}</button>
      ` : ""}
    `;
    const hb = $view.querySelector("#hintBtn");
    if (hb) hb.onclick = () => {                // 画面を描き直さず、その場でヒントを開く（スクロール位置を保つ）
      s.hinted = true; save();
      $view.querySelector("#hintArea").innerHTML = `<div class="box hint"><h3>ヒント</h3><div class="explain">${esc(q.hint)}</div></div>`;
    };
    if (!answered) $view.querySelectorAll(".choice").forEach(b => b.onclick = () => answer(Number(b.dataset.i)));
    else { $view.querySelector("#next").onclick = next; $view.querySelector(".result").scrollIntoView({ block: "start", behavior: "smooth" }); }
  }

  // ───── 腕試し → 必要な勉強時間 ─────
  function startPlacement() {
    const seenFirst = (a, b) => (S.rec[a.id] ? 1 : 0) - (S.rec[b.id] ? 1 : 0);
    const per = FIELD_ORDER.map(f => QS.filter(q => q.field === f).sort(seenFirst).slice(0, PLACE_PER_FIELD).map(q => q.id));
    const ids = [];
    for (let i = 0; i < PLACE_PER_FIELD; i++) per.forEach(list => { if (list[i]) ids.push(list[i]); });
    S.session = { mode: "placement", day: today(), ids, i: 0, answered: null, results: [], marks: [] };
    save(); render();
  }

  function finishPlacement() {
    const s = S.session;
    const per = {};
    for (const f of FIELD_ORDER) {
      const idx = s.ids.map((id, i) => i).filter(i => BY_ID[s.ids[i]].field === f);
      const n = idx.length || 1;
      const c = idx.filter(i => s.marks[i] === "c").length;
      const w = idx.filter(i => s.marks[i] === "w").length;
      // 4択の当てずっぽうを差し引く（まちがい3つにつき1つは偶然の正解とみなす）
      per[f] = { n: idx.length, c, k: Math.max(0, (c - w / 3) / n) };
    }
    const k = FIELD_ORDER.reduce((a, f) => a + per[f].k * FIELDS[f].ratio, 0);
    const hours = Math.round(HOURS_MIN + (HOURS_BEGINNER - HOURS_MIN) * (1 - k));
    S.placement = { date: today(), per, k, hours, q0: S.qCount || 0 };
    s.done = true;
  }

  function paceNumbers() {
    const p = S.placement;
    const studied = Math.max(0, ((S.qCount || 0) - p.q0) * MIN_PER_Q / 60);
    const remain = Math.max(0, p.hours - studied);
    const days = Math.max(1, diffDays(S.settings.examDate, today()));
    const perDay = Math.ceil(remain * 60 / days);
    const mins = S.settings.minutes;
    const daysAtMine = Math.ceil(remain * 60 / mins);
    return { studied, remain, days, perDay, mins, daysAtMine, altDate: addDays(today(), daysAtMine) };
  }

  const hm = m => m >= 60 ? `${Math.floor(m / 60)}時間${m % 60 ? (m % 60) + "分" : ""}` : `${m}分`;

  function paceHtml() {
    if (!S.placement) {
      return `<div class="card"><b>合格までに、何時間の勉強が必要？</b>
        <p class="sub">腕試し12問（約5分）で今の実力をはかり、試験日までに1日何分やればいいかを出します。</p>
        <button id="placeStart">腕試しをする</button></div>`;
    }
    const x = paceNumbers();
    const ok = x.perDay <= x.mins;
    const step = MINUTE_STEPS.find(m => m >= x.perDay);
    return `<div class="card">
      <div class="sub">合格までの勉強時間（目安）</div>
      <p>残り <b>約${Math.round(x.remain)}時間</b> ÷ 試験まで ${x.days}日 ＝ <b class="${ok ? "" : "danger"}">1日 約${hm(x.perDay)}</b></p>
      ${ok
        ? `<p>いまの1日${x.mins}分で間に合うペースです。</p>`
        : `<p class="danger">いまの1日${x.mins}分だと足りません。</p>
           <div class="choicebtns">
             ${step ? `<button id="applyMin">1日${step}分にする</button>` : `<button id="applyMin">アプリを1日30分にする</button>`}
             ${x.daysAtMine <= 365 ? `<button id="applyDate">1日${x.mins}分のまま、試験日を${jpDate(x.altDate)}にする</button>` : ""}
           </div>
           ${x.daysAtMine <= 365 && x.altDate >= NEW_SYSTEM ? `<p class="sub">※ 2027年4月からITパスポートは新しい試験制度になる予定です（IPA）。範囲が変わるかもしれないので、できれば3月までに受けるのがおすすめです。</p>` : ""}
           ${step ? "" : `<p class="sub">1日30分をこえる分（約${hm(x.perDay - 30)}）は、参考書や過去問道場でおぎなってください。</p>`}`}
      <p class="sub">腕試し（${jpYmd(S.placement.date)}）の結果から出した目安。初学者は約180時間、ITの知識がある人は約30〜50時間という目安（ユーキャン）をもとにしています。<a href="#" id="placeAgain">腕試しをやり直す</a></p>
    </div>`;
  }

  function bindPace() {
    const on = (id, fn) => { const b = $view.querySelector(id); if (b) b.onclick = e => { e.preventDefault(); fn(); }; };
    on("#placeStart", startPlacement);
    on("#placeAgain", startPlacement);
    on("#applyMin", () => {
      const x = paceNumbers();
      S.settings.minutes = MINUTE_STEPS.find(m => m >= x.perDay) || 30;
      save(); render();
    });
    on("#applyDate", () => { S.settings.examDate = paceNumbers().altDate; save(); render(); });
  }

  function renderPlacement() {
    const s = S.session;
    const q = BY_ID[s.ids[s.i]];
    $view.innerHTML = `
      <div class="sub">腕試し ${s.i + 1} / ${s.ids.length}問　わからなければ「わからない」でOK（当てずっぽうより正確に出ます）</div>
      <div class="progress"><i style="width:${Math.round(s.i / s.ids.length * 100)}%"></i></div>
      <div>${tag(q.field)}<span class="sub">${esc(q.category)}</span></div>
      <div class="qtext">${qHtml(q.q)}</div>
      <div class="choices">
        ${q.choices.map((c, i) => `<button class="choice" data-i="${i}"><span class="mark">${MARKS[i]}</span><span>${esc(c)}</span></button>`).join("")}
        <button class="choice" data-i="-1"><span class="mark">？</span><span>わからない</span></button>
      </div>
      <p class="sub">腕試しでは解説を出しません。まちがえた問題は、明日からの毎日の問題に解説つきで出てきます。</p>
    `;
    $view.querySelectorAll(".choice").forEach(b => b.onclick = () => answer(Number(b.dataset.i)));
  }

  function renderPlacementResult() {
    const p = S.placement;
    $view.innerHTML = `
      <h1>腕試しの結果</h1>
      <div class="card">
        ${FIELD_ORDER.map(f => `<p>${tag(f)} ${p.per[f].c} / ${p.per[f].n}問 正解</p>`).join("")}
        <p class="sub">いちばん時間をかけたいのは <b>${FIELDS[FIELD_ORDER.slice().sort((a, b) => p.per[a].k - p.per[b].k)[0]].name}</b>（3分野とも300点以上が合格の条件）</p>
      </div>
      <div class="card">
        <div class="sub">合格までに必要な勉強時間（目安）</div>
        <div class="big">約${p.hours}<small style="font-size:16px">時間</small></div>
      </div>
      ${paceHtml()}
      <button class="primary go" id="home">ホームへ</button>
    `;
    bindPace();
    $view.querySelector("#home").onclick = () => { S.session = null; save(); render(); };
  }

  function renderDone() {
    const s = S.session;
    const okN = s.results.filter(Boolean).length;
    const hintN = (s.hints || []).filter((h, i) => h && s.results[i]).length;
    $view.innerHTML = `
      <h1>${s.extra ? "おつかれさまでした！" : "今日はおしまい！"}</h1>
      ${(() => { const { st, before } = buddyCheck(); return `<div class="card buddy-card">${bubble(st.i > before ? "wow" : okN === s.results.length ? "happy" : "normal",
          BUDDY.finish({ okN, total: s.results.length, stage: st, before }), { head: `${buddyName()}（${st.name}）` })}</div>`; })()}
      <div class="card">
        <div class="sub">${s.extra ? "結果" : "今日の結果"}</div>
        <div class="big">${okN} / ${s.results.length}</div>
        ${hintN ? `<p>そのうち ヒントつきの正解 ${hintN}問</p>` : ""}
        ${s.extra ? "" : `<p>連続 <b>${S.streak.count}日</b>（最高 ${S.streak.best}日）</p>`}
        <p class="sub">間違えた問題は明日、正解した問題は数日後にまた出ます。</p>
      </div>
      <button class="primary go" id="more"><span class="play">▶</span>もう5問つづける</button>
      <button id="home">ホームへ</button>
      <p class="sub">「もう5問」は学習の道の続きから出します。連続記録とは別です。</p>
    `;
    $view.querySelector("#more").onclick = () => { S.session = null; buildPractice(null, 5); };
    $view.querySelector("#home").onclick = () => { S.session = null; save(); render(); };
  }

  // ───── 起動 ─────
  (async () => {
    if (AUTH.enabled) {
      $view.innerHTML = `<p class="sub" style="margin-top:40px;text-align:center">読み込み中…</p>`;
      const user = await initAuth();
      if (user) await onSignedIn(user);
      else if (S.auth && S.auth.mode === "google") S.auth = null;   // ログインが切れていたら、ログイン画面へ
    }
    checkStreak();
    render();
  })();
})();
