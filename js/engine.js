/* =========================================================
 * engine.js — 遊戲底層工具
 *   ・CX 命名空間與常數
 *   ・輸入（鍵盤 / 觸控 / 滑鼠 / 自動遊玩機器人）
 *   ・音效（Web Audio 即時合成，不需要任何音檔）
 *   ・天氣粒子（雪、雨、火星）
 *   ・圖片載入、文字換行等小工具
 * ========================================================= */
window.CX = window.CX || {};

(function (CX) {
  'use strict';

  /* ---------- 常數與網址參數 ---------- */
  CX.W = 960;                    // 邏輯寬度
  CX.H = 540;                    // 邏輯高度
  const params = new URLSearchParams(location.search);
  CX.DEBUG = {
    auto: params.has('auto'),                     // ?auto=1 自動遊玩（測試用）
    stage: parseInt(params.get('stage') || '0', 10), // ?stage=3 直接跳到某一章
    fast: params.has('fast'),                     // ?fast=1 劇情自動快轉
  };

  /* ---------- 數學小工具 ---------- */
  CX.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  CX.lerp = (a, b, t) => a + (b - a) * t;
  CX.rand = (a, b) => a + Math.random() * (b - a);
  CX.ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  /** 可重現的亂數（關卡配置固定，方便測試） */
  CX.seeded = function (seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  };
  /** 矩形碰撞 */
  CX.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  /* =========================================================
   * 輸入系統
   *   isDown(動作)：是否按住   wasPressed(動作)：這一幀是否剛按下
   *   動作名稱：left / right / jump / action / back
   * ========================================================= */
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    Enter: 'action', KeyZ: 'action', KeyJ: 'action',
    Escape: 'back',
  };
  const Input = {
    down: {},          // 鍵盤與觸控按住狀態
    pressed: {},       // 本幀剛按下
    bot: {},           // 自動遊玩機器人的「虛擬按鍵」
    botPressed: {},
    tapped: false,     // 本幀是否點擊了畫面（滑鼠或手指）
    tapX: -1, tapY: -1, // 點擊位置（換算成 960×540 的邏輯座標）
    codes: {},         // 本幀剛按下的實體按鍵（e.code），選單用
    keyHit(...cs) { return cs.some(c => this.codes[c]); },
    /** 這一幀是否點到了某個矩形區域（邏輯座標） */
    tapIn(r) { return this.tapped && this.tapX >= r.x && this.tapX <= r.x + r.w && this.tapY >= r.y && this.tapY <= r.y + r.h; },
    isDown(a) { return !!(this.down[a] || this.bot[a]); },
    wasPressed(a) { return !!(this.pressed[a] || this.botPressed[a]); },
    /** 「確認」：空白鍵、Enter、點擊畫面都算 */
    confirm() { return this.wasPressed('action') || this.wasPressed('jump') || this.tapped; },
    press(a) { if (!this.down[a]) this.pressed[a] = true; this.down[a] = true; },
    release(a) { this.down[a] = false; },
    /** 每幀結束時呼叫，清掉「剛按下」狀態 */
    endFrame() { this.pressed = {}; this.botPressed = {}; this.tapped = false; this.codes = {}; },
  };
  CX.input = Input;

  window.addEventListener('keydown', e => {
    if (e.code === 'KeyM') CX.audio.toggleMute();
    if (e.code === 'KeyF') CX.toggleFullscreen();
    const a = KEYMAP[e.code];
    if (!e.repeat) Input.codes[e.code] = true;
    if (a) { e.preventDefault(); if (!e.repeat) Input.press(a); }
    CX.audio.unlock();
  });
  window.addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) Input.release(a); });
  window.addEventListener('blur', () => { Input.down = {}; });

  /** 綁定 canvas 點擊與觸控按鈕（main.js 初始化時呼叫） */
  CX.bindPointer = function (canvas) {
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      Input.tapped = true;
      const r = canvas.getBoundingClientRect();
      Input.tapX = (e.clientX - r.left) / r.width * CX.W;
      Input.tapY = (e.clientY - r.top) / r.height * CX.H;
      CX.audio.unlock();
      if (e.pointerType === 'touch') CX.showTouch(true);
    });
    document.querySelectorAll('#touch .tbtn').forEach(btn => {
      const act = btn.dataset.act;
      const on = e => { e.preventDefault(); e.stopPropagation(); Input.press(act); btn.classList.add('on'); CX.audio.unlock(); };
      const off = e => { e.preventDefault(); Input.release(act); btn.classList.remove('on'); };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('pointerleave', off);
    });
  };
  /** 顯示或隱藏觸控按鈕；mode 控制要顯示哪些按鈕 */
  CX.touchWanted = matchMedia('(pointer: coarse)').matches;
  CX.showTouch = function (wanted) { if (wanted) CX.touchWanted = true; };
  CX.setTouchLayout = function (mode) {
    const el = document.getElementById('touch');
    if (!el) return;
    el.classList.toggle('hidden', !CX.touchWanted || mode === 'none');
    el.querySelector('.pad-left').style.display = mode === 'full' ? 'flex' : 'none';
  };
  CX.toggleFullscreen = function () {
    const el = document.documentElement;
    if (!document.fullscreenElement) { el.requestFullscreen && el.requestFullscreen().catch(() => {}); }
    else { document.exitFullscreen && document.exitFullscreen(); }
  };

  /* =========================================================
   * 音效：全部用 Web Audio 振盪器與雜訊即時合成
   * ========================================================= */
  const Audio = {
    ctx: null, master: null, muted: false, bgmTimer: null, bgmStep: 0, bgmMode: null,
    /** 瀏覽器規定要使用者互動後才能播放聲音 */
    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
      if (this.bgmMode) this.bgm(this.bgmMode);
    },
    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
      const b = document.getElementById('btn-mute');
      if (b) b.classList.toggle('off', this.muted);
    },
    /** 單一音符（類鋼琴：快速起音、指數衰減） */
    tone(freq, dur = .4, type = 'sine', vol = .2, when = 0) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + when;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    /** 白雜訊（腳步、槍聲、爆炸、水花都用它加濾波器做出來） */
    noise(dur = .2, vol = .3, filterFreq = 1000, type = 'lowpass') {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq;
      const g = this.ctx.createGain(); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t);
    },
    sfx(name, v = 1) {
      switch (name) {
        case 'jump': this.tone(520, .12, 'triangle', .08 * v); this.tone(780, .1, 'triangle', .05 * v, .04); break;
        case 'step': this.noise(.12, .5 * v, 380); this.tone(70, .12, 'sine', .25 * v); break;
        case 'shot': this.noise(.35, .5 * v, 1800); this.tone(90, .3, 'sine', .3 * v); break;
        case 'boom': this.noise(1.6, .9 * v, 400); this.tone(45, 1.2, 'sine', .5 * v); break;
        case 'splash': this.noise(.8, .4 * v, 2500, 'bandpass'); break;
        case 'hit': this.tone(180, .25, 'square', .08 * v); this.tone(120, .3, 'square', .06 * v, .06); break;
        case 'good': this.tone(880, .3, 'sine', .15 * v); this.tone(1320, .4, 'sine', .08 * v, .05); break;
        case 'perfect': [880, 1108, 1320].forEach((f, i) => this.tone(f, .5, 'sine', .12 * v, i * .05)); break;
        case 'miss': this.tone(220, .3, 'triangle', .1 * v); break;
        case 'pick': this.tone(1568, .25, 'sine', .08 * v); this.tone(2093, .35, 'sine', .06 * v, .07); break;
        case 'warn': this.tone(660, .12, 'square', .05 * v); this.tone(660, .12, 'square', .05 * v, .18); break;
        case 'page': this.noise(.08, .08 * v, 3000, 'highpass'); break;
      }
    },
    /** 背景音樂：簡單的鋼琴琶音循環（呼應「學過鋼琴」的設定） */
    bgm(mode) {
      this.bgmMode = mode;
      clearInterval(this.bgmTimer); this.bgmTimer = null;
      if (!this.ctx || !mode || mode === 'none') return;
      const SONGS = {
        // 每一項是 [頻率…]，每拍彈一個音
        night: [220, 261.6, 329.6, 392, 329.6, 261.6, 196, 246.9, 293.7, 349.2, 293.7, 246.9],
        tense: [110, 130.8, 164.8, 130.8, 103.8, 130.8, 155.6, 130.8],
        rain: [196, 233.1, 293.7, 233.1, 174.6, 220, 261.6, 220],
        snow: [261.6, 329.6, 392, 523.3, 392, 329.6, 293.7, 349.2, 440, 587.3, 440, 349.2],
      };
      const notes = SONGS[mode] || SONGS.night;
      const beat = mode === 'tense' ? 260 : 420;
      this.bgmStep = 0;
      this.bgmTimer = setInterval(() => {
        const f = notes[this.bgmStep % notes.length];
        this.tone(f, 1.6, 'sine', .05);
        this.tone(f * 2, .8, 'triangle', .012);
        if (this.bgmStep % notes.length === 0) this.tone(f / 2, 3, 'sine', .05);
        this.bgmStep++;
      }, beat);
    },
  };
  CX.audio = Audio;

  /* =========================================================
   * 天氣粒子：snow（初雪）/ rain（2009 雨夜）/ embers（火星）
   * ========================================================= */
  class Weather {
    constructor(mode = 'snow', density = 1) { this.parts = []; this.set(mode, density); }
    set(mode, density = 1) {
      this.mode = mode; this.density = density;
      const n = Math.floor((mode === 'rain' ? 220 : mode === 'embers' ? 70 : 140) * density);
      this.parts = [];
      for (let i = 0; i < n; i++) this.parts.push(this.spawn(true));
    }
    spawn(anyY) {
      const p = { x: Math.random() * CX.W, y: anyY ? Math.random() * CX.H : -10, z: CX.rand(.3, 1), ph: Math.random() * 6.28 };
      if (this.mode === 'embers') { p.y = anyY ? Math.random() * CX.H : CX.H + 10; }
      return p;
    }
    update(dt, wind = 0) {
      for (const p of this.parts) {
        if (this.mode === 'rain') {
          p.y += 900 * p.z * dt; p.x += (-120 + wind) * p.z * dt;
        } else if (this.mode === 'embers') {
          p.y -= 80 * p.z * dt; p.x += Math.sin(p.ph += dt * 2) * 30 * dt + wind * dt;
        } else {
          p.y += 40 * p.z * dt + 10 * dt; p.ph += dt * (1 + p.z);
          p.x += (Math.sin(p.ph) * 18 + wind) * p.z * dt;
        }
        if (p.y > CX.H + 12 || p.y < -20 || p.x < -20 || p.x > CX.W + 20) {
          Object.assign(p, this.spawn(false));
          if (p.x < 0 || p.x > CX.W) p.x = Math.random() * CX.W;
        }
      }
    }
    draw(ctx, alpha = 1) {
      ctx.save();
      if (this.mode === 'rain') {
        ctx.strokeStyle = `rgba(180,190,210,${.35 * alpha})`; ctx.lineWidth = 1;
        ctx.beginPath();
        for (const p of this.parts) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3 * p.z, p.y + 18 * p.z); }
        ctx.stroke();
      } else if (this.mode === 'embers') {
        for (const p of this.parts) {
          ctx.fillStyle = `rgba(255,${120 + 80 * p.z | 0},60,${.7 * alpha * p.z})`;
          ctx.fillRect(p.x, p.y, 2.5 * p.z, 2.5 * p.z);
        }
      } else {
        for (const p of this.parts) {
          ctx.globalAlpha = (.35 + .6 * p.z) * alpha;
          ctx.fillStyle = '#f4f6ff';
          ctx.beginPath(); ctx.arc(p.x, p.y, 1 + 2.2 * p.z, 0, 6.283); ctx.fill();
        }
      }
      ctx.restore();
    }
  }
  CX.Weather = Weather;

  /* =========================================================
   * 記憶碎片存檔（localStorage）
   *   碎片編號格式「章-序號」，例如 '1-3' = 第一章第 3 片。
   *   記錄的是「曾經拾回過」的聯集：跨多次遊玩累計，重來或死亡不會重複計算。
   * ========================================================= */
  const MEM_KEY = 'chuxue.memories.v1';
  CX.memory = {
    _set: null,
    _load() {
      if (this._set) return this._set;
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem(MEM_KEY) || '[]'); } catch (e) { arr = []; }
      this._set = new Set(Array.isArray(arr) ? arr : []);
      return this._set;
    },
    _save() { try { localStorage.setItem(MEM_KEY, JSON.stringify([...this._load()])); } catch (e) { /* 無痕模式等情況存不了就算了 */ } },
    has(id) { return this._load().has(id); },
    /** 拾回一片；回傳 true 代表這是第一次拾回 */
    add(id) { const s = this._load(); if (s.has(id)) return false; s.add(id); this._save(); return true; },
    /** 所有碎片的編號（依 story.js 的 CX.MEMORIES） */
    allIds() { const ids = []; Object.keys(CX.MEMORIES || {}).forEach(ch => CX.MEMORIES[ch].forEach((m, i) => ids.push(`${ch}-${i + 1}`))); return ids; },
    count() { return this.allIds().filter(id => this.has(id)).length; },
    total() { return this.allIds().length; },
    complete() { const t = this.total(); return t > 0 && this.count() === t; },
    text(id) { const [ch, i] = id.split('-').map(Number); const m = CX.MEMORIES[ch] && CX.MEMORIES[ch][i - 1]; return m ? m.text : ''; },
    reset() { this._set = new Set(); this._save(); },
  };

  /* ---------- 圖片載入 ---------- */
  CX.images = {};
  CX.loadImages = function (list, onProgress) {
    let done = 0;
    return Promise.all(list.map(([key, src]) => new Promise(res => {
      const img = new Image();
      img.onload = img.onerror = () => { done++; onProgress && onProgress(done / list.length); res(); };
      img.src = src; CX.images[key] = img;
    })));
  };
  /** 以 cover 方式把圖畫滿區域，並支援緩慢推鏡（Ken Burns 效果） */
  CX.drawCover = function (ctx, img, x, y, w, h, zoom = 1, panX = 0, panY = 0) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, x + (w - dw) / 2 + panX, y + (h - dh) / 2 + panY, dw, dh);
  };

  /* ---------- 中文逐字換行（標點不放行首） ---------- */
  const NO_HEAD = '，。、！？；：」』）…—.,!?';
  CX.wrapText = function (ctx, text, maxW) {
    const lines = []; let cur = '';
    for (const ch of text) {
      if (ch === '\n') { lines.push(cur); cur = ''; continue; }
      const t = cur + ch;
      if (ctx.measureText(t).width > maxW && cur) {
        if (NO_HEAD.includes(ch)) { cur = t; continue; }
        lines.push(cur); cur = ch;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  CX.FONT = '"Noto Serif TC","Noto Serif CJK TC","Source Han Serif TC","PMingLiU","Songti TC",serif';
  CX.font = (size, bold) => `${bold ? 'bold ' : ''}${size}px ${CX.FONT}`;

  /** 置中文字（可加外框） */
  CX.text = function (ctx, str, x, y, size, color = '#fff', opt = {}) {
    ctx.save();
    ctx.font = CX.font(size, opt.bold);
    ctx.textAlign = opt.align || 'center';
    ctx.textBaseline = 'middle';
    if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
    if (opt.shadow) { ctx.shadowColor = opt.shadow; ctx.shadowBlur = opt.blur || 12; }
    if (opt.stroke) { ctx.lineWidth = opt.strokeW || 4; ctx.strokeStyle = opt.stroke; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color; ctx.fillText(str, x, y);
    ctx.restore();
  };

  /** 圓角矩形路徑 */
  CX.roundRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  /** 畫面四周暗角 */
  CX.vignette = function (ctx, strength = .6) {
    const g = ctx.createRadialGradient(CX.W / 2, CX.H / 2, CX.H * .35, CX.W / 2, CX.H / 2, CX.H * .95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, CX.W, CX.H);
  };
})(window.CX);
