// コツパス（仮） ― 毎日10分のITパスポート学習（試作 v0.2）
// 保存はこの端末のブラウザ（localStorage）だけ。サーバーなし。
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
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 保存できない環境でも動かす */ } }

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
    r.n += 1;
    if (ok && !hinted) { r.ok += 1; r.box = Math.min(r.box + 1, INTERVALS.length - 1); r.due = addDays(today(), INTERVALS[r.box]); }
    else if (ok && hinted) { r.ok += 0.5; r.hint = (r.hint || 0) + 1; r.due = addDays(today(), INTERVALS[0]); } // ヒントつき正解：段階は上げず、明日もう一度
    else { r.box = 0; r.due = addDays(today(), INTERVALS[0]); }
    S.rec[q.id] = r;
    S.log.push(hinted ? { d: today(), id: q.id, f: q.field, ok, h: 1 } : { d: today(), id: q.id, f: q.field, ok });
    if (S.log.length > 600) S.log = S.log.slice(-600);
    S.qCount = (S.qCount || 0) + 1;
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
    s.i += 1; s.answered = null; s.hinted = false;
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

  function render() {
    window.scrollTo(0, 0);
    $badge.hidden = !S.settings;
    $badge.textContent = `連続 ${S.streak.count}日`;
    if (!S.settings) return renderSetup();
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

  function renderSetup(editing) {
    const st = S.settings || {};
    const minD = addDays(today(), 7), maxD = addDays(today(), 365);
    let exam = st.examDate && st.examDate >= minD && st.examDate <= maxD ? st.examDate : null;
    let ym = (exam || addDays(today(), 90)).slice(0, 7);
    let pref = st.pref || "";
    let venue = st.venue || "";
    let mIdx = Math.max(0, MINUTE_STEPS.indexOf(st.minutes || 10));

    $view.innerHTML = `
      <h1>${editing ? "設定" : "はじめに3つだけ決めます"}</h1>
      <p class="sub">決めた日から逆算して、毎日のメニューを自動でつくります。どれもあとで変えられます。</p>

      <h2>1. 試験を受ける日</h2>
      <div class="months" id="months"></div>
      <div id="cal"></div>
      <p id="examOut" class="pick"></p>

      <h2>2. 住んでいるところ（受ける会場）</h2>
      <select id="pref"><option value="">都道府県をえらぶ</option>
        ${REGIONS.map(([r, ps]) => `<optgroup label="${r}">${ps.split(" ").map(p => `<option ${p === pref ? "selected" : ""}>${p}</option>`).join("")}</optgroup>`).join("")}
      </select>
      <div id="venues"></div>

      <h2>3. 1日に使う時間</h2>
      <div class="slider">
        <input id="min" type="range" min="0" max="${MINUTE_STEPS.length - 1}" step="1" value="${mIdx}">
        <div class="ticks">${MINUTE_STEPS.map(m => `<span>${m}</span>`).join("")}</div>
      </div>
      <p id="minOut" class="pick"></p>

      <p style="margin-top:20px"><button class="primary go" id="go">${editing ? "保存する" : "この計画ではじめる"}</button></p>
      <p id="err" class="danger"></p>
      ${editing ? `<div class="links"><button id="back">もどる</button><button id="reset">データを全部消す</button></div>` : ""}
    `;

    const drawMonths = () => {
      const start = parse(today()); start.setDate(1);
      let html = "";
      for (let i = 0; i < 13; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const key = fmt(d).slice(0, 7);
        if (key > maxD.slice(0, 7)) break;
        const label = (i === 0 || d.getMonth() === 0) ? `${d.getFullYear()}年<br>${d.getMonth() + 1}月` : `${d.getMonth() + 1}月`;
        html += `<button data-ym="${key}" class="${key === ym ? "on" : ""}">${label}</button>`;
      }
      $view.querySelector("#months").innerHTML = html;
      $view.querySelectorAll("#months button").forEach(b => b.onclick = () => { ym = b.dataset.ym; drawMonths(); drawCal(); });
    };
    const drawCal = () => {
      const [y, m] = ym.split("-").map(Number);
      const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
      let cells = WD.map((w, i) => `<span class="wd ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</span>`).join("");
      for (let i = 0; i < first.getDay(); i++) cells += "<span></span>";
      for (let d = 1; d <= days; d++) {
        const s = `${y}-${pad(m)}-${pad(d)}`, wd = (first.getDay() + d - 1) % 7;
        const off = s < minD || s > maxD;
        cells += `<button data-d="${s}" class="${wd === 0 ? "sun" : wd === 6 ? "sat" : ""} ${s === exam ? "on" : ""}" ${off ? "disabled" : ""}>${d}</button>`;
      }
      $view.querySelector("#cal").innerHTML = `<div class="cal">${cells}</div>`;
      $view.querySelectorAll("#cal button").forEach(b => b.onclick = () => { exam = b.dataset.d; drawCal(); drawExam(); drawVenues(); });
    };
    const drawExam = () => {
      $view.querySelector("#examOut").innerHTML = exam
        ? `<b>${jpDate(exam)}</b>　あと <b>${diffDays(exam, today())}日</b>`
        : `<span class="sub">月をえらんで、日にちをタップ。受けられるのは1週間後〜1年後まで。土日は色つき。</span>`;
    };
    const drawVenues = () => {
      const box = $view.querySelector("#venues");
      if (!pref) { box.innerHTML = `<p class="sub">えらぶと、その県の試験会場と、だいたいの開催日がわかります。</p>`; return; }
      const vs = venuesOf(pref);
      box.innerHTML = `
        <p class="sub">${pref}の会場は${vs.length}か所。受ける予定の会場をタップ。</p>
        <div class="venues">${vs.map(v => {
          const open = exam ? venueOpenOn(v[5], exam) : null;
          return `<button class="venue ${v[2] === venue ? "on" : ""}" data-v="${esc(v[2])}">
            <b>${esc(v[2])}</b><span>${esc(v[1])}・${esc(v[4])}</span>
            <span>開催の目安：${esc(v[5])}</span>
            ${open === false ? `<span class="danger">選んだ日（${WD[parse(exam).getDay()]}曜日）は、基本の開催曜日に入っていません</span>` : ""}
          </button>`;
        }).join("")}</div>
        <div class="note">
          <p>ITパスポートはCBT方式（会場のパソコンで解く）で、一年中、会場ごとの日程で受けられます。実際の空きと日時は、県ごとの公式の一覧（3か月先まで）で確かめてください：<a href="${prefPdf(pref)}" target="_blank" rel="noopener">${pref}の試験開催状況一覧（IPA）</a></p>
          <p>※ 会場と「開催の目安」は、IPA「CBT試験会場一覧」<b>${jpYmd(V.asOf)}時点</b>の情報です（${jpYmd(V.fetched)}に取り込み）。会場・日程は変わることがあります。申し込む前に必ず<a href="https://www3.jitec.ipa.go.jp/JitesCbt/html/examhall/examhall_info.html" target="_blank" rel="noopener">IPAの公式サイト</a>で確認してください。</p>
        </div>`;
      box.querySelectorAll(".venue").forEach(b => b.onclick = () => { venue = b.dataset.v; drawVenues(); });
    };
    const drawMin = () => {
      const m = MINUTE_STEPS[mIdx];
      $view.querySelector("#minOut").innerHTML = `<b>${m}分</b>＝1日${PER_DAY[m]}問と、その解説。${m === 10 ? "（おすすめ）" : m < 10 ? "まずは続けることが一番。" : ""}`;
    };
    drawMonths(); drawCal(); drawExam(); drawVenues(); drawMin();
    $view.querySelector("#pref").onchange = e => { pref = e.target.value; venue = ""; drawVenues(); };
    $view.querySelector("#min").oninput = e => { mIdx = Number(e.target.value); drawMin(); };

    $view.querySelector("#go").onclick = () => {
      const err = $view.querySelector("#err");
      if (!exam) { err.textContent = "試験を受ける日をえらんでください（とりあえずの日でOK）。"; return; }
      S.settings = { examDate: exam, minutes: MINUTE_STEPS[mIdx], pref, venue, start: (S.settings && S.settings.start) || today() };
      save(); render();
    };
    if (editing) {
      $view.querySelector("#back").onclick = render;
      const rb = $view.querySelector("#reset");
      rb.onclick = () => {
        if (rb.dataset.sure) { S = fresh(); save(); render(); return; }
        rb.dataset.sure = "1"; rb.textContent = "本当に消す（もう一度押す）";
      };
    }
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

  function renderHome() {
    const ph = phaseInfo();
    const done = !!S.days[today()];
    const n = PER_DAY[S.settings.minutes] || 5;
    const notice = S.notice; delete S.notice; save();
    $view.innerHTML = `
      ${notice ? `<div class="card">${esc(notice)}</div>` : ""}
      ${done ? "" : `<button class="primary go pulse" id="start"><span class="play">▶</span>今日の${n}問をはじめる<small>約${S.settings.minutes}分</small></button>`}
      <div class="card exam">
        <div class="sub">試験の日</div>
        <b>${jpDate(S.settings.examDate)}</b>
        ${S.settings.venue ? `<div>${esc(S.settings.venue)}（${esc(S.settings.pref)}）</div>` : S.settings.pref ? `<div class="sub">${esc(S.settings.pref)}・会場はまだ（設定でえらべます）</div>` : ""}
      </div>
      ${paceHtml()}
      <div class="row">
        <div class="card"><div class="sub">試験まで</div><div class="big">${Math.max(0, ph.left)}<small style="font-size:16px">日</small></div></div>
        <div class="card"><div class="sub">連続</div><div class="big">${S.streak.count}<small style="font-size:16px">日</small></div>
          <div class="sub">おやすみ券 ${S.freeze.left}枚</div></div>
      </div>
      <div class="card">
        <div class="sub">いまの段階</div>
        <div class="phase">${PHASES.map((p, i) => `<div class="${i === ph.idx ? "now" : ""}">${p.name}</div>`).join("")}</div>
        <p class="sub">${phaseHint(ph.idx)}</p>
      </div>
      ${done
        ? `<div class="card"><b>今日のぶんは終わりました。</b><p class="sub">また明日。もう少しやりたい日だけ↓</p>
           <button id="more">もう3問だけ（連続記録には関係なし）</button></div>`
        : ""}
      ${meterHtml()}
      <div class="links"><button id="settings">設定</button></div>
      <p class="sub">収録 ${QS.length}問（試作版）</p>
    `;
    const st = $view.querySelector("#start");
    if (st) st.onclick = () => { buildSession(n, false); render(); };
    const mo = $view.querySelector("#more");
    if (mo) mo.onclick = () => { buildSession(3, true); render(); };
    $view.querySelector("#settings").onclick = () => renderSetup(true);
    bindPace();
  }

  function phaseHint(i) {
    return [
      "まずは用語に慣れる時期です。わからなくて当たり前なので、解説を読めば十分です。",
      "3分野を本番の比率で一周する時期です。間違えた問題は、自動でまた出てきます。",
      "弱い分野を多めに出します。3分野とも300点の線をこえるのが目標です。",
      "間違えたことのある問題を中心に出します。前日は軽めにして、夜ふかしはしないでください。"
    ][i] || "";
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
      <p style="font-weight:600">${esc(q.q)}</p>
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
        : `<button id="hintBtn" class="hintbtn">ヒントを見る（使うと「ヒントつき正解」になります）</button>`}</div>` : ""}
      ${answered ? `
        <div class="result ${ok ? "ok" : "ng"}">${ok ? (s.hinted ? "正解！（ヒントつき）" : "正解！") : `ざんねん。正解は ${MARKS[q.answer]}`}</div>
        ${ok && s.hinted ? `<p class="sub">ヒントつきの正解は、明日もう一度出ます。次はヒントなしで解いてみましょう。</p>` : ""}
        <div class="box"><h3>ひとこと解説</h3><div class="explain">${esc(q.short)}</div></div>
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
      <p style="font-weight:600">${esc(q.q)}</p>
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
      <h1>${s.extra ? "おつかれさま！" : "今日はおしまい！"}</h1>
      <div class="card">
        <div class="sub">今日の結果</div>
        <div class="big">${okN} / ${s.results.length}</div>
        ${hintN ? `<p>そのうち ヒントつきの正解 ${hintN}問</p>` : ""}
        ${s.extra ? "" : `<p>連続 <b>${S.streak.count}日</b>（最高 ${S.streak.best}日）</p>`}
        <p class="sub">間違えた問題は明日、正解した問題は数日後にまた出ます。</p>
      </div>
      <button class="primary" id="home">ホームへ</button>
    `;
    $view.querySelector("#home").onclick = () => { S.session = null; save(); render(); };
  }

  checkStreak();
  render();
})();
