'use strict';

const tsuyu       = new Tsukuyomi('tsuyu-stage', 'tsuyu-bubble', 'img/');
const chapterSel  = document.getElementById('chapter-sel');
const lessonSel   = document.getElementById('lesson-sel');
const main        = document.getElementById('sp-main');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');
const progress    = document.getElementById('lesson-progress');
let   _cleanup    = null;
const _spokenLessons = new Set();

/* ===== ドロップダウン初期化 ===== */
CHAPTERS.forEach(ch => {
  const opt = document.createElement('option');
  opt.value = ch.id;
  opt.textContent = ch.title;
  chapterSel.appendChild(opt);
});

function populateLessonSelect(lessons) {
  lessonSel.innerHTML = '';
  lessons.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = l.title;
    lessonSel.appendChild(opt);
  });
}

/* ===== レッスン表示 ===== */
function showLesson(lesson) {
  if (!lesson) return;

  if (_cleanup) { _cleanup(); _cleanup = null; }

  main.innerHTML = lesson.content;
  main.scrollTop = 0;

  scratchblocks.renderMatching('#sp-main pre.blocks', {
    style: 'scratch3',
    languages: ['ja']
  });

  const [left, right] = lesson.pose;
  tsuyu.pose(left, right);
  tsuyu.express(lesson.brow, false, false);
  if (!_spokenLessons.has(lesson.id)) {
    _spokenLessons.add(lesson.id);
    tsuyu.say(lesson.voice);
  }

  if (lesson.onShow) _cleanup = lesson.onShow() || null;

  updateFooter();
}

function currentChapter() {
  return CHAPTERS.find(c => c.id === chapterSel.value);
}

function updateFooter() {
  const ch = currentChapter();
  const idx = ch.lessons.findIndex(l => l.id === lessonSel.value);
  const total = ch.lessons.length;
  progress.textContent = `${idx + 1} / ${total}`;
  const chIdx    = CHAPTERS.findIndex(c => c.id === chapterSel.value);
  const isFirst  = chIdx === 0 && idx === 0;
  const isLast   = chIdx === CHAPTERS.length - 1 && idx === total - 1;
  btnPrev.disabled = isFirst;
  btnNext.disabled = isLast;
}

/* ===== 目次カードのクリック（イベント委譲） ===== */
main.addEventListener('click', e => {
  const btn = e.target.closest('[data-navigate]');
  if (!btn) return;
  const chapterId = btn.dataset.navigate;
  const ch = CHAPTERS.find(c => c.id === chapterId);
  if (!ch) return;
  chapterSel.value = chapterId;
  populateLessonSelect(ch.lessons);
  showLesson(ch.lessons[0]);
});

/* ===== イベント ===== */
chapterSel.addEventListener('change', () => {
  const ch = currentChapter();
  populateLessonSelect(ch.lessons);
  showLesson(ch.lessons[0]);
});

lessonSel.addEventListener('change', () => {
  const lesson = currentChapter().lessons.find(l => l.id === lessonSel.value);
  showLesson(lesson);
});

btnPrev.addEventListener('click', () => {
  const ch  = currentChapter();
  const idx = ch.lessons.findIndex(l => l.id === lessonSel.value);

  if (idx > 0) {
    // 章内の前のレッスンへ
    lessonSel.value = ch.lessons[idx - 1].id;
    showLesson(ch.lessons[idx - 1]);
  } else {
    // 章の先頭 → 前の章の最後へ
    const chIdx = CHAPTERS.findIndex(c => c.id === chapterSel.value);
    if (chIdx > 0) {
      const prevCh = CHAPTERS[chIdx - 1];
      chapterSel.value = prevCh.id;
      populateLessonSelect(prevCh.lessons);
      const last = prevCh.lessons[prevCh.lessons.length - 1];
      lessonSel.value = last.id;
      showLesson(last);
    }
  }
});

btnNext.addEventListener('click', () => {
  const ch  = currentChapter();
  const idx = ch.lessons.findIndex(l => l.id === lessonSel.value);

  if (idx < ch.lessons.length - 1) {
    // 章内の次のレッスンへ
    lessonSel.value = ch.lessons[idx + 1].id;
    showLesson(ch.lessons[idx + 1]);
  } else {
    // 章の末尾 → 次の章へ
    const chIdx = CHAPTERS.findIndex(c => c.id === chapterSel.value);
    if (chIdx < CHAPTERS.length - 1) {
      const nextCh = CHAPTERS[chIdx + 1];
      chapterSel.value = nextCh.id;
      populateLessonSelect(nextCh.lessons);
      showLesson(nextCh.lessons[0]);
    }
  }
});

/* ===== 設定ページ ===== */
const btnSettings  = document.getElementById('btn-settings');
const spSettings   = document.getElementById('sp-settings');
const spNav        = document.getElementById('sp-nav');
const spFooter     = document.getElementById('sp-footer');
const rateSlider   = document.getElementById('setting-rate');
const rateVal      = document.getElementById('setting-rate-val');
const pitchSlider  = document.getElementById('setting-pitch');
const pitchVal     = document.getElementById('setting-pitch-val');

// localStorage から設定を復元
const saved = JSON.parse(localStorage.getItem('iteenSettings') || '{}');
if (saved.rate)  { rateSlider.value  = saved.rate;  tsuyu.setRate(saved.rate);   rateVal.textContent  = saved.rate; }
if (saved.pitch) { pitchSlider.value = saved.pitch; tsuyu.setPitch(saved.pitch); pitchVal.textContent = saved.pitch; }

rateSlider.addEventListener('input', () => {
  const v = parseFloat(rateSlider.value);
  rateVal.textContent = v.toFixed(1);
  tsuyu.setRate(v);
  saveSettings();
});

pitchSlider.addEventListener('input', () => {
  const v = parseFloat(pitchSlider.value);
  pitchVal.textContent = v.toFixed(1);
  tsuyu.setPitch(v);
  saveSettings();
});

document.getElementById('btn-rate-test').addEventListener('click', () => {
  tsuyu.say('こんにちは！つくよみちゃんです。このスピードと声の高さはいかがですか？');
});

function saveSettings() {
  localStorage.setItem('iteenSettings', JSON.stringify({
    rate:  rateSlider.value,
    pitch: pitchSlider.value,
  }));
}

function toggleSettings() {
  const isOpen = !spSettings.classList.contains('hidden');
  spSettings.classList.toggle('hidden', isOpen);
  main.classList.toggle('hidden', !isOpen);
  spNav.classList.toggle('hidden', !isOpen);
  spFooter.classList.toggle('hidden', !isOpen);
  btnSettings.classList.toggle('active', !isOpen);
}

btnSettings.addEventListener('click', toggleSettings);

/* ===== 音量トグル ===== */
const VOLUME_STEPS = [
  { v: 1.0, icon: '🔊', label: '100%' },
  { v: 0.7, icon: '🔉', label: '70%'  },
  { v: 0.3, icon: '🔈', label: '30%'  },
  { v: 0.0, icon: '🔇', label: '0%'   },
];
let volIdx = 0;
const btnVol = document.getElementById('btn-volume');
btnVol.addEventListener('click', () => {
  volIdx = (volIdx + 1) % VOLUME_STEPS.length;
  const step = VOLUME_STEPS[volIdx];
  tsuyu.setVolume(step.v);
  btnVol.textContent = step.icon;
  btnVol.title = `音量: ${step.label}`;
});

/* ===== 起動時 ===== */
const firstChapter = CHAPTERS[0];
populateLessonSelect(firstChapter.lessons);
showLesson(firstChapter.lessons[0]);
