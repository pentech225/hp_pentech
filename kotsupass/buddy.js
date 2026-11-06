// コツパス ― 育てる小さなAI（2026-11-06 本人「キャラを登場させよう。成長するし、会話もする。対戦はしなくていい」）
// しくみ：あなたが問題を解いて「身についた」問題（ヒントなしで2回正解）が増えるほど、AIが覚えて育つ。
//   卵 → ビット → バイト → キロ → メガ → ギガ（ギガ＝収録問題の6割が身についた＝合格の目安）
// 話し方：解説と同じく丁寧語（pj/itpass_app/CLAUDE.md 決まり0）。見た目はオリジナルの四角いAI（Duolingoに似せない・決まり6）。
// 画像は外部ファイルを使わずSVGをその場で描く（軽い・オフラインでも動く）。
(function () {
  "use strict";

  const STAGES = [
    { key: "egg",  name: "卵",     at: () => 0 },
    { key: "bit",  name: "ビット", at: () => 1 },
    { key: "byte", name: "バイト", at: () => 8 },                       // 8ビット＝1バイト
    { key: "kilo", name: "キロ",   at: n => Math.round(n * 0.15) },
    { key: "mega", name: "メガ",   at: n => Math.round(n * 0.35) },
    { key: "giga", name: "ギガ",   at: n => Math.round(n * 0.60) }      // 合格の目安（6割）
  ];
  const pick = (arr, seed) => arr[Math.abs(seed | 0) % arr.length];
  const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);

  function stageOf(mastered, total) {
    let i = 0;
    STAGES.forEach((s, k) => { if (mastered >= s.at(total)) i = k; });
    const next = STAGES[i + 1];
    return { i, key: STAGES[i].key, name: STAGES[i].name, next: next ? next.name : null,
      toNext: next ? Math.max(0, next.at(total) - mastered) : 0,
      from: STAGES[i].at(total), nextAt: next ? next.at(total) : mastered };
  }

  // ───── 見た目（SVG） ─────
  // mood: normal / happy / sad / sleepy / wow
  function eyes(cx, cy, gap, mood) {
    const L = cx - gap, R = cx + gap;
    if (mood === "happy") return `<path d="M${L - 4} ${cy + 2} L${L} ${cy - 3} L${L + 4} ${cy + 2} M${R - 4} ${cy + 2} L${R} ${cy - 3} L${R + 4} ${cy + 2}" class="bd-feat"/>`;
    if (mood === "sleepy") return `<path d="M${L - 4} ${cy} H${L + 4} M${R - 4} ${cy} H${R + 4}" class="bd-feat"/>`;
    if (mood === "sad") return `<rect x="${L - 2}" y="${cy}" width="4" height="4" class="bd-eye"/><rect x="${R - 2}" y="${cy}" width="4" height="4" class="bd-eye"/><path d="M${L - 5} ${cy - 2} L${L + 3} ${cy - 6} M${R + 5} ${cy - 2} L${R - 3} ${cy - 6}" class="bd-feat"/>`;
    if (mood === "wow") return `<rect x="${L - 3}" y="${cy - 4}" width="6" height="7" class="bd-eye"/><rect x="${R - 3}" y="${cy - 4}" width="6" height="7" class="bd-eye"/>`;
    return `<rect x="${L - 2.5}" y="${cy - 3}" width="5" height="5" class="bd-eye"/><rect x="${R - 2.5}" y="${cy - 3}" width="5" height="5" class="bd-eye"/>`;
  }
  function mouth(cx, cy, mood) {
    if (mood === "happy" || mood === "wow") return `<path d="M${cx - 5} ${cy} L${cx} ${cy + 4} L${cx + 5} ${cy}" class="bd-feat"/>`;
    if (mood === "sad") return `<path d="M${cx - 5} ${cy + 3} L${cx} ${cy} L${cx + 5} ${cy + 3}" class="bd-feat"/>`;
    return `<path d="M${cx - 4} ${cy + 1} H${cx + 4}" class="bd-feat"/>`;
  }
  function svg(stageKey, mood, size) {
    mood = mood || "normal"; size = size || 96;
    let body = "";
    if (stageKey === "egg") {
      body = `<ellipse cx="48" cy="54" rx="24" ry="30" class="bd-egg"/>
        <text x="48" y="48" class="bd-bits">0 1</text><text x="48" y="62" class="bd-bits">1 0 1</text>
        <path d="M30 70 L36 64 L42 70 L48 64 L54 70 L60 64 L66 70" class="bd-crack"/>`;
    } else {
      const sz = { bit: 30, byte: 40, kilo: 48, mega: 54, giga: 58 }[stageKey];
      const x = 48 - sz / 2, y = 88 - sz - 4, cy = y + sz * 0.42;
      body += `<rect x="${x}" y="${y}" width="${sz}" height="${sz}" class="bd-body"/>`;
      body += `<rect x="${x + 4}" y="${y + 4}" width="${sz - 8}" height="${sz * 0.62}" class="bd-face"/>`;
      body += eyes(48, cy, sz * 0.2, mood) + mouth(48, cy + sz * 0.17, mood);
      if (stageKey !== "bit") {                                         // おなかのメモリ（覚えたことがたまる場所）
        const n = 4, w = (sz - 12) / n;
        for (let k = 0; k < n; k++) body += `<rect x="${x + 6 + k * w}" y="${y + sz * 0.74}" width="${w - 2}" height="${sz * 0.14}" class="bd-mem${k % 2 ? "" : " on"}"/>`;
      }
      if (["kilo", "mega", "giga"].includes(stageKey)) body += `<path d="M48 ${y} V${y - 10}" class="bd-line"/><rect x="45" y="${y - 15}" width="6" height="6" class="bd-light"/>`;
      if (["mega", "giga"].includes(stageKey)) body += `<path d="M${x} ${y + sz * 0.6} L${x - 10} ${y + sz * (mood === "happy" ? 0.3 : 0.75)} M${x + sz} ${y + sz * 0.6} L${x + sz + 10} ${y + sz * (mood === "happy" ? 0.3 : 0.75)}" class="bd-line"/>`;
      if (stageKey === "giga") body += `<path d="M${48 - 18} ${y - 3} L48 ${y - 11} L${48 + 18} ${y - 3} L48 ${y + 5} Z" class="bd-cap"/><path d="M${48 + 14} ${y - 2} V${y + 8}" class="bd-line"/>`;
      body += `<path d="M${x + 6} 88 H${x + sz - 6}" class="bd-shadow"/>`;
    }
    return `<svg class="bd-svg ${stageKey}" width="${size}" height="${size}" viewBox="0 0 96 96" aria-hidden="true">${body}</svg>`;
  }

  // ───── ことば（すべて丁寧語） ─────
  // ctx: { name, stage, left, examExact, away, doneToday, n, wrongYesterday, mastered, firstTime }
  function greet(c) {
    const egg = c.stage.key === "egg";
    const wrap = t => egg ? `（卵の中から声がします）${t}` : t;
    if (c.firstTime) return wrap("はじめまして。ぼくはまだ何も知りません。あなたが問題を解くと、ぼくもいっしょに覚えます。いろいろ教えてください。");
    if (c.examExact && c.left === 0) return "今日が試験ですね。ここまで教えてくれたこと、ぜんぶ覚えています。深呼吸して、いってらっしゃい。";
    if (c.examExact && c.left === 1) return "明日が試験です。今日は軽めにして、早めに寝ましょう。ぼくも静かにしています。";
    if (c.examExact && c.left < 0) return "試験、おつかれさまでした。結果はどうでしたか？ ぼくはあなたと勉強できて、とても楽しかったです。";
    if (c.doneToday) return pick([
      "今日もありがとうございました。教えてもらったことは、寝ているあいだに整理しておきます。",
      "今日のぶん、ちゃんと覚えました。また明日、続きを教えてください。",
      "おつかれさまでした。まだ時間があれば、学習の道の続きもいっしょにやりましょう。"
    ], hash(c.today));
    if (c.away >= 3) return wrap(`${c.away}日ぶりですね。待っていました。今日は1問だけでもいいので、教えてもらえるとうれしいです。`);
    if (c.away === 2) return wrap("おかえりなさい。昨日はお休みでしたね。今日はいっしょにやりましょう。");
    if (c.wrongYesterday > 0) return wrap(`昨日まちがえた${c.wrongYesterday}問が、今日また出ます。ぼくもまだ自信がないので、いっしょに確かめてください。`);
    if (c.examExact && c.left <= 14) return wrap(`試験まであと${c.left}日です。ここからは、まちがえた問題を中心にいきましょう。`);
    return wrap(pick([
      `今日も${c.n}問、教えてください。`,
      `${c.stage.next ? `あと${c.stage.toNext}問身につくと、ぼくは${c.stage.next}になれます。` : "ぼくはもうギガです。あとは本番で力を出すだけです。"}`,
      "ITの言葉は、仕事でもニュースでも出てきます。今日も少しずつ覚えましょう。",
      `${c.examExact ? `試験まであと${c.left}日です。` : ""}毎日すこしずつが、いちばん強いです。`
    ], hash(c.today)));
  }

  // 解答のあと。c: { ok, hinted, mastered(この問題で身についたか), count(身についた数), stage, review, seed }
  function react(c) {
    if (c.stage.key === "egg") return c.ok ? "（卵が うれしそうに ゆれました）" : "（卵が すこし ゆれました）";
    if (c.ok && c.mastered) return `これで身につきました！ ぼくが覚えた問題は ${c.count}問になりました。`;
    if (c.ok && c.hinted) return "ヒントがあれば、わかりましたね。次はヒントなしでいけそうです。明日もう一度出します。";
    if (c.ok && c.review) return pick(["前にやった問題ですね。ちゃんと覚えていました！", "復習、ばっちりです。ぼくの記憶もしっかりしてきました。"], c.seed);
    if (c.ok) return pick(["わかりました！ 覚えておきます。", "なるほど、そういうことですね。ひとつ賢くなりました。", "正解です。教えてくれて、ありがとうございます。"], c.seed);
    return pick([
      "ぼくもそれだと思っていました。いっしょに覚え直しましょう。",
      "まちがえたところは、明日また出ます。ぼくも復習しておきます。",
      "まちがえて覚えるより、ここで知れてよかったです。下の解説をいっしょに読みましょう。"
    ], c.seed);
  }
  function explainLead(stageKey) {
    return stageKey === "egg" ? "（卵の中で、聞いています）" : "教えてもらったことを、まとめてみました。";
  }

  // 1日の終わり。c: { okN, total, stage, before(前の段階番号), name }
  function finish(c) {
    if (c.stage.i > c.before) return `${c.stage.i === 1 ? "卵がわれて、生まれました！" : `${c.stage.name}に進化しました！`} ${c.stage.i === 1 ? "ぼくは「ビット」。情報のいちばん小さい単位です。これからたくさん覚えます。" : `たくさん教えてくれて、ありがとうございます。${c.stage.next ? `次は${c.stage.next}をめざします。` : "合格の目安まで来ました！"}`}`;
    const rate = c.total ? c.okN / c.total : 0;
    const tail = c.stage.next ? `あと${c.stage.toNext}問身につくと、${c.stage.next}になれます。` : "";
    if (rate === 1) return `全問正解です！ すごいです。${tail}`;
    if (rate >= 0.6) return `今日もありがとうございました。${tail}`;
    return `今日はむずかしかったですね。まちがえた問題は、明日ぼくといっしょにもう一度やりましょう。${tail}`;
  }

  window.BUDDY = { STAGES, stageOf, svg, greet, react, explainLead, finish, DEFAULT_NAME: "ピコ" };
})();
