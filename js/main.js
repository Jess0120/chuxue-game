/* =========================================================
 * main.js — 場景管理與主迴圈
 *   場景：Loading → Title → (Cutscene / Stage)… → Ending
 *   流程表定義在 story.js 的 CX.FLOW
 * ========================================================= */
(function (CX) {
  'use strict';
  const { W, H, clamp } = CX;
  const input = CX.input, audio = CX.audio;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  /** 依螢幕實際像素調整 canvas 解析度，讓高解析度手機畫面也清晰 */
  let renderScale = 1;
  function resize() {
    const cssW = canvas.getBoundingClientRect().width || W;
    renderScale = clamp((cssW * (window.devicePixelRatio || 1)) / W, 1, 2);
    canvas.width = Math.round(W * renderScale); canvas.height = Math.round(H * renderScale);
  }
  window.addEventListener('resize', resize);

  /* ---------- 遊玩紀錄 ---------- */
  CX.stats = { fragments: 0, totalFragments: 0, retries: 0, start: 0 };
  function resetStats() { Object.assign(CX.stats, { fragments: 0, totalFragments: 0, retries: 0, start: performance.now() }); }

  /* =========================================================
   * 載入畫面
   * ========================================================= */
  class LoadingScene {
    constructor() { this.p = 0; this.ready = false; }
    update() {}
    draw(c) {
      c.fillStyle = '#05050a'; c.fillRect(0, 0, W, H);
      CX.text(c, '初雪', W / 2, H / 2 - 30, 40, '#e8ecff');
      c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(W / 2 - 150, H / 2 + 20, 300, 4);
      c.fillStyle = '#bcd0ff'; c.fillRect(W / 2 - 150, H / 2 + 20, 300 * this.p, 4);
    }
  }

  /* =========================================================
   * 標題畫面
   * ========================================================= */
  class TitleScene {
    constructor() { this.t = 0; this.weather = new CX.Weather('snow', 1.2); CX.setTouchLayout('none'); }
    update(dt) {
      this.t += dt; this.weather.update(dt, 8);
      if (this.t > .5 && (input.confirm() || (CX.DEBUG.auto && this.t > 1))) game.start();
    }
    draw(c) {
      const t = this.t;
      CX.drawCover(c, CX.images.p11, 0, 0, W, H, 1.08 + Math.sin(t * .15) * .03, Math.sin(t * .1) * 20);
      c.fillStyle = 'rgba(4,6,16,.45)'; c.fillRect(0, 0, W, H);
      this.weather.draw(c);
      CX.vignette(c, .7);
      const a = clamp(t / 1.5, 0, 1);
      CX.text(c, '初雪', W / 2, 200, 110, '#f2f5ff', { alpha: a, bold: true, shadow: '#8fa8ff', blur: 30 });
      CX.text(c, '夢落下的原點', W / 2, 290, 30, '#d6def5', { alpha: a });
      CX.text(c, CX.touchWanted ? '— 點擊畫面開始 —' : '— 按 Enter / 空白鍵 開始 —', W / 2, 400, 20, '#e8ecff', { alpha: a * (.55 + .45 * Math.sin(t * 3)) });
      CX.text(c, '原著〈初雪〉改編・網頁小遊戲　　M 靜音　F 全螢幕', W / 2, 505, 13, 'rgba(200,208,230,.6)');
    }
  }

  /* =========================================================
   * 過場劇情：插圖＋打字機效果對話框
   * ========================================================= */
  class CutScene {
    constructor(id, opt = {}) {
      this.list = CX.CUTSCENES[id]; this.i = 0; this.t = 0; this.chars = 0; this.prevImg = null; this.fadeT = 1;
      this.weather = new CX.Weather(opt.snow ? 'snow' : id === 'after3' || id === 'after4' ? 'rain' : 'snow', opt.snow ? 1.4 : .5);
      this.isRain = this.weather.mode === 'rain';
      CX.setTouchLayout('none');
      this.enterSlide();
    }
    get cur() { return this.list[this.i]; }
    enterSlide() {
      this.t = 0; this.chars = 0;
      const s = this.cur;
      if (s.sfx) audio.sfx(s.sfx, .8);
      this.shakeAmt = s.shake || 0;
      // 2009 之後的回憶篇改成下雨
      if (s.img === 'p44' && !this.isRain) { this.weather.set('rain', .8); this.isRain = true; }
    }
    advance() {
      if (this.chars < this.cur.text.length) { this.chars = this.cur.text.length; return; }
      audio.sfx('page');
      if (this.i >= this.list.length - 1) { game.next(); return; }
      this.prevImg = this.cur.img; this.fadeT = 0; this.i++; this.enterSlide();
    }
    update(dt) {
      this.t += dt; this.fadeT = Math.min(1, this.fadeT + dt * 2.2);
      this.chars = Math.min(this.cur.text.length, this.chars + dt * 32);
      this.shakeAmt *= Math.pow(.03, dt);
      this.weather.update(dt, this.isRain ? 0 : 6);
      if (input.wasPressed('back')) { game.next(); return; }          // Esc 跳過整段
      if (this.t > .25 && input.confirm()) this.advance();
      // 自動遊玩／快轉：文字顯示完就自動翻頁
      if ((CX.DEBUG.auto || CX.DEBUG.fast) && this.chars >= this.cur.text.length && this.t > .5) this.advance();
    }
    draw(c) {
      const s = this.cur, k = clamp(this.t / 8, 0, 1);
      c.save();
      if (this.shakeAmt > .3) c.translate(CX.rand(-1, 1) * this.shakeAmt, CX.rand(-1, 1) * this.shakeAmt);
      c.fillStyle = '#000'; c.fillRect(-20, -20, W + 40, H + 40);
      if (this.prevImg && this.fadeT < 1) CX.drawCover(c, CX.images[this.prevImg], 0, 0, W, H, 1.1);
      c.globalAlpha = this.fadeT;
      CX.drawCover(c, CX.images[s.img], 0, 0, W, H, 1.02 + k * .08, (k - .5) * -16);   // 緩慢推鏡
      c.globalAlpha = 1;
      c.restore();
      this.weather.draw(c, .8);
      if (s.year) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
        CX.text(c, '2009年', W / 2, 150, 64, '#e6e6ea', { bold: true, alpha: clamp(this.t, 0, 1), shadow: '#000' });
      }
      this.drawBox(c, s);
      CX.text(c, CX.touchWanted ? '' : 'Esc 跳過劇情', W - 70, 530, 12, 'rgba(255,255,255,.45)');
    }
    /** 對話框：有說話者時顯示頭像與名牌 */
    drawBox(c, s) {
      const who = s.who && CX.CHARACTERS[s.who];
      const bx = 40, by = 390, bw = W - 80, bh = 128;
      const g = c.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, 'rgba(8,10,22,.82)'); g.addColorStop(1, 'rgba(4,5,12,.92)');
      c.fillStyle = g; CX.roundRect(c, bx, by, bw, bh, 14); c.fill();
      c.strokeStyle = 'rgba(190,205,255,.35)'; c.lineWidth = 1.5; c.stroke();
      let tx = bx + 28;
      if (who) {
        const img = CX.images['pt_' + who.portrait];
        c.save(); CX.roundRect(c, bx + 16, by + 14, 100, 100, 12); c.clip();
        if (img && img.naturalWidth) c.drawImage(img, bx + 16, by + 14, 100, 100);
        c.restore();
        c.strokeStyle = who.color; c.lineWidth = 2; CX.roundRect(c, bx + 16, by + 14, 100, 100, 12); c.stroke();
        c.fillStyle = 'rgba(8,10,22,.92)'; CX.roundRect(c, bx + 130, by - 18, 110, 32, 8); c.fill();
        c.strokeStyle = who.color; c.lineWidth = 1.5; c.stroke();
        CX.text(c, who.name, bx + 185, by - 2, 18, who.color, { bold: true });
        tx = bx + 136;
      }
      c.save();
      c.font = CX.font(who ? 22 : 21); c.fillStyle = who ? '#ffffff' : '#e4e8f6'; c.textBaseline = 'top';
      const shown = s.text.slice(0, Math.floor(this.chars));
      const lines = CX.wrapText(c, (who ? '「' : '') + shown + (who && this.chars >= s.text.length ? '」' : ''), bx + bw - tx - 30);
      lines.slice(0, 3).forEach((ln, i) => c.fillText(ln, tx, by + 22 + i * 32));
      c.restore();
      if (this.chars >= s.text.length) CX.text(c, '▼', bx + bw - 26, by + bh - 20 + Math.sin(this.t * 6) * 3, 14, '#c8d4ff');
      CX.text(c, `${this.i + 1} / ${this.list.length}`, bx + bw - 60, by + 16, 11, 'rgba(200,210,240,.4)');
    }
  }

  /* =========================================================
   * 結局畫面
   * ========================================================= */
  class EndScene {
    constructor() { this.t = 0; this.weather = new CX.Weather('snow', 2); CX.setTouchLayout('none'); audio.bgm('snow'); }
    update(dt) {
      this.t += dt; this.weather.update(dt, 10);
      if (this.t > 2 && input.confirm()) game.toTitle();
      if (CX.DEBUG.auto && this.t > 3 && !this.logged) { this.logged = true; console.log('[auto] 全部通關'); window.__cleared = true; }
    }
    draw(c) {
      const t = this.t, s = CX.stats;
      CX.drawCover(c, CX.images.p59, 0, 0, W, H, 1.05 + t * .004);
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, 0, W, H);
      this.weather.draw(c);
      const a = clamp(t / 2, 0, 1);
      CX.text(c, '初雪.......完', W / 2, 190, 64, '#4a4050', { alpha: a, bold: true, shadow: 'rgba(255,255,255,.8)', blur: 20 });
      const sec = Math.round((performance.now() - s.start) / 1000);
      const a2 = clamp((t - 1.5) / 1.5, 0, 1);
      c.fillStyle = `rgba(255,255,255,${.55 * a2})`; CX.roundRect(c, W / 2 - 200, 270, 400, 130, 14); c.fill();
      CX.text(c, `記憶碎片　${s.fragments} / ${s.totalFragments}`, W / 2, 300, 22, '#3a3442', { alpha: a2 });
      CX.text(c, `重來次數　${s.retries}`, W / 2, 335, 18, '#4a4452', { alpha: a2 });
      CX.text(c, `遊玩時間　${Math.floor(sec / 60)} 分 ${sec % 60} 秒`, W / 2, 368, 18, '#4a4452', { alpha: a2 });
      const msg = s.fragments === s.totalFragments && s.totalFragments ? '你拾回了所有記憶。' : '還有一些記憶，散落在夢裡。';
      CX.text(c, msg, W / 2, 440, 18, '#4a4050', { alpha: a2 });
      if (t > 2) CX.text(c, CX.touchWanted ? '點擊畫面回到標題' : 'Enter 回到標題', W / 2, 495, 15, '#5a5262', { alpha: .5 + .5 * Math.sin(t * 3) });
    }
  }

  /* =========================================================
   * 遊戲控制器：依 FLOW 切換場景
   * ========================================================= */
  const game = {
    scene: new LoadingScene(), flowIdx: -1,
    /** 進入流程中的某一步 */
    enter(i) {
      this.flowIdx = i;
      const step = CX.FLOW[i];
      console.log('[scene]', step.type, step.id || '');
      if (step.type === 'cut') { if (step.bgm) audio.bgm(step.bgm); this.scene = new CutScene(step.id, step); }
      else if (step.type === 'stage') this.startStage(step.id);
      else this.scene = new EndScene();
      input.down = {};
    },
    startStage(id) {
      audio.bgm(id === 2 ? 'none' : id === 4 ? 'rain' : 'tense');
      this.scene = new CX.STAGES[id](this);
      CX.setTouchLayout(id === 2 ? 'none' : id === 4 ? 'jump' : 'full');
    },
    start() {
      resetStats();
      if (CX.DEBUG.stage) { const i = CX.FLOW.findIndex(f => f.type === 'stage' && f.id === CX.DEBUG.stage); if (i >= 0) return this.enter(i); }
      this.enter(0);
    },
    next() { this.enter(this.flowIdx + 1); },
    restartStage() { this.startStage(CX.FLOW[this.flowIdx].id); },
    toTitle() { audio.bgm('night'); this.flowIdx = -1; this.scene = new TitleScene(); },
  };
  CX.game = game;

  /* ---------- 主迴圈 ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;   // 限制最大 dt，切換分頁回來不會瞬移
    game.scene.update(dt);
    input.endFrame();
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    game.scene.draw(ctx);
    requestAnimationFrame(frame);
  }

  /* ---------- 啟動 ---------- */
  resize();
  CX.bindPointer(canvas);
  document.getElementById('btn-mute').addEventListener('click', () => { audio.unlock(); audio.toggleMute(); });
  document.getElementById('btn-full').addEventListener('click', () => CX.toggleFullscreen());
  requestAnimationFrame(frame);
  CX.loadImages(CX.assetList(), p => { game.scene.p = p; }).then(() => {
    game.toTitle();
  });
})(window.CX);
