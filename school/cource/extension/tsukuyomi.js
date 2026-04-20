'use strict';

class Tsukuyomi {
  constructor(stageId, bubbleId, imgBase) {
    this._stage  = document.getElementById(stageId);
    this._bubble = document.getElementById(bubbleId);
    this._base   = imgBase;
    this._speaking = false;
    this._voice       = null;
    this._volume      = 1.0;
    this._rate        = 1.2;
    this._pitch       = 1.8;
    this._currentText = null;
    this._resolve     = null;
    this._restarting  = false;

    this._loadVoice();
    this._build();
    this._startBlinking();
  }

  _loadVoice() {
    const set = () => {
      this._voice = speechSynthesis.getVoices().find(v => v.name === 'Microsoft Sayaka - Japanese (Japan)')
                 || speechSynthesis.getVoices().find(v => v.name === 'Google 日本語')
                 || null;
    };
    set();
    speechSynthesis.onvoiceschanged = set;
  }

  _build() {
    const layers = [
      { id: 'ty-base',      src: 'base.png' },
      { id: 'ty-braid-l',   src: 'braid_l.png' },
      { id: 'ty-braid-r',   src: 'braid_r.png' },
      { id: 'ty-arm-r-gap', src: 'arm_r_gap.png', hidden: true },
      { id: 'ty-arm-r',     src: 'arm_r_front.png' },
      { id: 'ty-arm-l',     src: 'arm_l_front.png' },
      { id: 'ty-brow',      src: 'brow_normal.png' },
      { id: 'ty-eye-r',     src: 'eye_r_open.png' },
      { id: 'ty-eye-l',     src: 'eye_l_open.png' },
      { id: 'ty-mouth',     src: 'mouth_close_smile.png' },
      { id: 'ty-cheek',     src: 'cheek.png', hidden: true },
    ];

    this._imgs = {};
    for (const { id, src, hidden } of layers) {
      const img = document.createElement('img');
      img.id = id;
      img.src = this._base + src;
      img.alt = '';
      if (hidden) img.style.display = 'none';
      this._stage.appendChild(img);
      this._imgs[id] = img;
    }
  }

  _set(id, src) {
    this._imgs[id].src = this._base + src;
  }

  /** 腕ポーズ: 'front' | 'side' | 'up' | 'chest' | 'mic' */
  pose(left = 'front', right = 'front') {
    this._set('ty-arm-l', `arm_l_${left}.png`);
    this._set('ty-arm-r', `arm_r_${right}.png`);
    const needGap = right === 'side' || right === 'up';
    this._imgs['ty-arm-r-gap'].style.display = needGap ? '' : 'none';
  }

  /** 表情: brow = 'normal'|'weak'|'strong', smile, cheek */
  express(brow = 'normal', smile = false, cheek = false) {
    this._set('ty-brow', `brow_${brow}.png`);
    const eye = smile ? 'smile' : 'open';
    this._set('ty-eye-l', `eye_l_${eye}.png`);
    this._set('ty-eye-r', `eye_r_${eye}.png`);
    this._imgs['ty-cheek'].style.display = cheek ? '' : 'none';
  }

  /** 合成音声で喋る（口パク付き）*/
  say(text) {
    this._currentText = text;
    return new Promise(resolve => {
      this._resolve = resolve;
      this._startUtterance(text);
    });
  }

  _startUtterance(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice  = this._voice;
    utter.lang   = 'ja-JP';
    utter.rate   = this._rate;
    utter.pitch  = this._pitch;
    utter.volume = this._volume;

    this._speaking = true;
    this._bubble.textContent = text;
    this._bubble.style.display = 'block';
    this._loopMouth();

    utter.onend = () => {
      if (this._restarting) return; // 音量変更による再起動中は無視
      this._speaking = false;
      this._currentText = null;
      this._bubble.style.display = 'none';
      this._set('ty-mouth', 'mouth_close_smile.png');
      if (this._resolve) { this._resolve(); this._resolve = null; }
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  setRate(v)  { this._rate  = v; }
  setPitch(v) { this._pitch = v; }

  setVolume(v) {
    this._volume = v;
    if (this._speaking && this._currentText) {
      this._restarting = true;
      speechSynthesis.cancel();
      this._restarting = false;
      this._startUtterance(this._currentText);
    }
  }

  showBubble(text) {
    this._bubble.textContent = text;
    this._bubble.style.display = 'block';
  }

  hideBubble() {
    this._bubble.style.display = 'none';
  }

  _startBlinking() {
    const schedule = () => {
      // 2〜6秒のランダム間隔で瞬き
      const delay = 2000 + Math.random() * 4000;
      setTimeout(() => {
        if (!this._speaking) this._blink();
        // 20%の確率で連続瞬き
        if (Math.random() < 0.2) {
          setTimeout(() => { if (!this._speaking) this._blink(); }, 250);
        }
        schedule();
      }, delay);
    };
    schedule();
  }

  _blink() {
    this._set('ty-eye-l', 'eye_l_close.png');
    this._set('ty-eye-r', 'eye_r_close.png');
    setTimeout(() => {
      this._set('ty-eye-l', 'eye_l_open.png');
      this._set('ty-eye-r', 'eye_r_open.png');
    }, 140);
  }

  _loopMouth() {
    if (!this._speaking) return;
    const cur = this._imgs['ty-mouth'].src;
    const next = cur.includes('open') ? 'mouth_close.png' : 'mouth_open.png';
    this._set('ty-mouth', next);
    setTimeout(() => this._loopMouth(), 160);
  }
}
