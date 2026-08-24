/* =============================================================
   ScratchJrレッスン 設定駆動テンプレート

   ★教材差し替え手順（CEO/先生向け）★
   1. 下の SECTIONS 配列の各要素を書き換えるだけで新しいレッスンになる。
      - title      : 補助パネルの一覧表示に使う名前（子ども向け画面には表示されない）
      - youtubeId  : YouTubeの動画ID（限定公開でよい。URLの v= のあとの文字列）
      - start      : このセクションの開始秒（数値）
      - end        : このセクションで自動一時停止する秒（数値）
   2. セクションは配列の順番どおりに再生される。増やす/減らす/並べ替えも自由。
   3. 動画ファイル（mp4等）は絶対にこのリポジトリにコミットしないこと。
      必ずYouTube側にアップロードし、youtubeIdだけを差し替える。
   4. MENU_URL は最終セクション終了後の「進む」タップで遷移する先。
      本番メニューURL確定後に差し替えること（現状はプレースホルダー "#"）。

   ※本テンプレートには子どもごとのログイン・進捗記録機能は含まれていない。
     将来TODO: 子どもごとのログイン・進捗記録機能は別案件で検討する。
============================================================= */

const SECTIONS = [
  { title: "セクション1（ダミー）", youtubeId: "M7lc1UVf-VE", start: 0, end: 15 },
  { title: "セクション2（ダミー）", youtubeId: "M7lc1UVf-VE", start: 15, end: 35 },
  { title: "セクション3（ダミー）", youtubeId: "M7lc1UVf-VE", start: 35, end: 55 },
  { title: "セクション4（ダミー）", youtubeId: "M7lc1UVf-VE", start: 55, end: 75 },
];

// プレースホルダー。本番メニューURL確定後に差し替える。
const MENU_URL = "#";

let player = null;
let playerReady = false;
let currentIndex = 0;
let pendingAutoplayIndex = null; // API準備待ちの間に再生要求が来た場合のインデックス

const overlay = document.getElementById("tap-overlay");
const startZone = document.getElementById("start-zone");
const navZone = document.getElementById("nav-zone");
const zoneBack = document.getElementById("zone-back");
const zoneNext = document.getElementById("zone-next");

const teacherGear = document.getElementById("teacher-gear");
const teacherPanel = document.getElementById("teacher-panel");
const panelReset = document.getElementById("panel-reset");
const panelClose = document.getElementById("panel-close");
const panelSectionList = document.getElementById("panel-section-list");

function setState(state) {
  overlay.classList.remove("state-idle", "state-playing", "state-paused");
  overlay.classList.add("state-" + state);
}

function updateNavZoneAvailability() {
  // 先頭セクションでの「戻る」は安全な挙動（現在のセクションを再生し直す）にするため、
  // 常に有効のままにしておく（エラーにはならない）。誤操作防止の視覚的な弱化のみ行う。
  zoneBack.classList.toggle("disabled", currentIndex === 0);
}

function playSection(index, { fromStart = true } = {}) {
  if (!playerReady) {
    pendingAutoplayIndex = index;
    return;
  }
  const section = SECTIONS[index];
  if (!section) return;
  currentIndex = index;
  setState("playing");
  updateNavZoneAvailability();
  player.loadVideoById({
    videoId: section.youtubeId,
    startSeconds: fromStart ? section.start : section.start,
    endSeconds: section.end,
  });
}

function goNext() {
  const nextIndex = currentIndex + 1;
  if (nextIndex >= SECTIONS.length) {
    // 最終セクション終了後の「進む」= MENU_URLへ遷移
    if (MENU_URL && MENU_URL !== "#") {
      window.location.href = MENU_URL;
    } else {
      // MENU_URL未確定の間はメニューへ飛べないため、安全に最終セクションを再生し直す
      playSection(currentIndex, { fromStart: true });
    }
    return;
  }
  playSection(nextIndex, { fromStart: true });
}

function goBack() {
  if (currentIndex === 0) {
    // 先頭セクションでの「戻る」はエラーにせず、現在のセクションを再生し直すだけにする
    playSection(0, { fromStart: true });
    return;
  }
  playSection(currentIndex - 1, { fromStart: true });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    setState("paused");
    updateNavZoneAvailability();
  }
}

function onPlayerReady() {
  playerReady = true;
  if (pendingAutoplayIndex !== null) {
    const idx = pendingAutoplayIndex;
    pendingAutoplayIndex = null;
    playSection(idx);
  }
}

// YouTube IFrame Player APIが非同期でロードされたあとに呼ばれるグローバルコールバック
window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("player", {
    width: "100%",
    height: "100%",
    playerVars: {
      controls: 0,
      rel: 0,
      modestbranding: 1,
      fs: 0,
      disablekb: 1,
      iv_load_policy: 3,
      playsinline: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
};

// 初回スタートタップ（中央の単一領域。ブラウザの自動再生ポリシー対応のため、
// 最初のユーザー操作をトリガーに再生を開始する）
startZone.addEventListener("click", () => {
  playSection(0);
});

zoneNext.addEventListener("click", () => {
  if (!overlay.classList.contains("state-paused")) return;
  goNext();
});

zoneBack.addEventListener("click", () => {
  if (!overlay.classList.contains("state-paused")) return;
  goBack();
});

// ---- 先生用補助パネル ----
function renderSectionList() {
  panelSectionList.innerHTML = "";
  SECTIONS.forEach((section, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "panel-section-btn";
    btn.textContent = section.title;
    btn.addEventListener("click", () => {
      teacherPanel.classList.add("hidden");
      playSection(index);
    });
    panelSectionList.appendChild(btn);
  });
}

teacherGear.addEventListener("click", () => {
  teacherPanel.classList.remove("hidden");
});

panelClose.addEventListener("click", () => {
  teacherPanel.classList.add("hidden");
});

panelReset.addEventListener("click", () => {
  teacherPanel.classList.add("hidden");
  setState("idle");
  currentIndex = 0;
});

renderSectionList();
setState("idle");
