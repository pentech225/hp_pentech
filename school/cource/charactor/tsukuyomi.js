'use strict';

class Tsukuyomi {
  constructor(imgBase) {
    this.base = imgBase; // 例: '../../charactor/tsukuyomi/'
    this._speaking = false;
    this._blinkTimer = null;

    this._voice = null;
    this._loadVoice();
    this._build();
    this._startBlinking();
  }

  // -------------------------------------------------------
  // 初期化
  // -------------------------------------------------------

  _loadVoice() {
    const set = () => {
      this._voice = speechSynthesis.getVoices().find(v => v.name === 'Google 日本語') || null;
    };
    set();
    speechSynthesis.onvoiceschanged = set;
  }

  _build() {
    const root = document.createElement('div');
    root.id = 'tsuyu-root';

    this._bubble = document.createElement('div');
    this._bubble.id = 'tsuyu-bubble';
    root.appendChild(this._bubble);

    // レイヤー順（後ろ→前）
    const layers = [
      { id: 'tsuyu-base',      src: 'base.png' },
      { id: 'tsuyu-braid-l',   src: 'braid_l.png' },
      { id: 'tsuyu-braid-r',   src: 'braid_r.png' },
      { id: 'tsuyu-arm-r-gap', src: 'arm_r_gap.png' },
      { id: 'tsuyu-arm-r',     src: 'arm_r_front.png' },
      { id: 'tsuyu-arm-l',     src: 'arm_l_front.png' },
      { id: 'tsuyu-brow',      src: 'brow_normal.png' },
      { id: 'tsuyu-eye-r',     src: 'eye_r_open.png' },
      { id: 'tsuyu-eye-l',     src: 'eye_l_open.png' },
      { id: 'tsuyu-mouth',     src: 'mouth_close_smile.png' },
      { id: 'tsuyu-cheek',     src: 'cheek.png' },
    ];

    this._imgs = {};
    for (const { id, src } of layers) {
      const img = document.createElement('img');
      img.id = id;
      img.src = this.base + src;
      img.alt = '';
      root.appendChild(img);
      this._imgs[id] = img;
    }

    // 隙間埋めは初期非表示
    this._imgs['tsuyu-arm-r-gap'].style.display = 'none';

    document.body.appendChild(root);
  }

  _setImg(id, src) {
    this._imgs[id].src = this.base + src;
  }

  // -------------------------------------------------------
  // 公開API
  // -------------------------------------------------------

  /**
   * 腕のポーズを変える
   * @param {'front'|'side'|'up'|'chest'|'mic'} left  左腕
   * @param {'front'|'side'|'up'|'chest'|'mic'} right 右腕
   */
  pose(left = 'front', right = 'front') {
    this._setImg('tsuyu-arm-l', `arm_l_${left}.png`);
    this._setImg('tsuyu-arm-r', `arm_r_${right}.png`);

    // 右腕を伸ばす・上げるときは隙間埋めを表示
    const needGap = right === 'side' || right === 'up';
    this._imgs['tsuyu-arm-r-gap'].style.display = needGap ? '' : 'none';
  }

  /**
   * 表情を変える
   * @param {'normal'|'weak'|'strong'} brow  眉
   * @param {boolean} smile  にっこり目にするか
   * @param {boolean} cheek  頬の赤みを出すか
   */
  express(brow = 'normal', smile = false, cheek = false) {
    this._setImg('tsuyu-brow', `brow_${brow}.png`);

    const eyeType = smile ? 'smile' : 'open';
    this._setImg('tsuyu-eye-l', `eye_l_${eyeType}.png`);
    this._setImg('tsuyu-eye-r', `eye_r_${eyeType}.png`);

    this._imgs['tsuyu-cheek'].style.opacity = cheek ? '1' : '0';
  }

  /**
   * テキストを合成音声で喋る（口パク付き）
   * @param {string} text
   * @returns {Promise<void>} 喋り終わったら resolve
   */
  say(text) {
    return new Promise(resolve => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.voice = this._voice;
      utter.lang  = 'ja-JP';
      utter.rate  = 1.2;
      utter.pitch = 1.2;

      this._speaking = true;
      this._bubble.textContent = text;
      this._bubble.style.display = 'block';
      this._loopMouth();

      utter.onend = () => {
        this._speaking = false;
        this._bubble.style.display = 'none';
        this._setImg('tsuyu-mouth', 'mouth_close_smile.png');
        resolve();
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    });
  }

  /** テキスト吹き出しだけ表示（音声なし） */
  showBubble(text) {
    this._bubble.textContent = text;
    this._bubble.style.display = 'block';
  }

  hideBubble() {
    this._bubble.style.display = 'none';
  }

  // -------------------------------------------------------
  // 内部：瞬き・口パク
  // -------------------------------------------------------

  _startBlinking() {
    this._blinkTimer = setInterval(() => {
      if (this._speaking) return; // 喋り中は瞬きしない
      if (Math.random() > 0.65) {
        this._blink();
      }
    }, 3000);
  }

  _blink(smile = false) {
    const closeType = smile ? 'smile' : 'close';
    this._setImg('tsuyu-eye-l', `eye_l_${closeType}.png`);
    this._setImg('tsuyu-eye-r', `eye_r_${closeType}.png`);
    setTimeout(() => {
      const openType = smile ? 'smile' : 'open';
      this._setImg('tsuyu-eye-l', `eye_l_${openType}.png`);
      this._setImg('tsuyu-eye-r', `eye_r_${openType}.png`);
    }, 140);
  }

  _loopMouth() {
    if (!this._speaking) return;
    const cur = this._imgs['tsuyu-mouth'].src;
    const next = cur.includes('open') ? 'mouth_close.png' : 'mouth_open.png';
    this._setImg('tsuyu-mouth', next);
    setTimeout(() => this._loopMouth(), 160);
  }
}
