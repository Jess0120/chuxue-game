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
  //   fragments / totalFragments：本次遊玩「過關時」拾回的碎片數（死亡重來的那次不算）
  //   found：本次遊玩拾回過的碎片編號（Set，不會重複）
  //   圖鑑與隱藏結局用的是跨遊玩累計的 CX.memory（engine.js）
  CX.stats = { fragments: 0, totalFragments: 0, retries: 0, start: 0, found: new Set() };
  function resetStats() { Object.assign(CX.stats, { fragments: 0, totalFragments: 0, retries: 0, start: performance.now(), found: new Set() }); }

  /** 隱藏結局條件：跨多次遊玩，曾經拾回過全部碎片（對玩家比較友善，不必一次全收） */
  CX.CONDITIONS = { allMemories: () => CX.memory.complete() };

  /* ---------- 畫面按鈕（滑鼠、觸控、鍵盤選取共用） ---------- */
  function drawButton(c, r, label, opt = {}) {
    c.save();
    c.fillStyle = opt.selected ? (opt.selFill || 'rgba(190,205,255,.28)') : 'rgba(10,14,30,.55)';
    CX.roundRect(c, r.x, r.y, r.w, r.h, 10); c.fill();
    c.strokeStyle = opt.selected ? 'rgba(235,240,255,.9)' : 'rgba(190,205,255,.35)'; c.lineWidth = opt.selected ? 2 : 1.2; c.stroke();
    c.restore();
    CX.text(c, label, r.x + r.w / 2, r.y + r.h / 2 + 1, opt.size || 19, opt.color || (opt.selected ? '#ffffff' : '#d6def5'), { alpha: opt.alpha });
  }
  const PREV_KEYS = ['ArrowUp', 'KeyW', 'ArrowLeft', 'KeyA'], NEXT_KEYS = ['ArrowDown', 'KeyS', 'ArrowRight', 'KeyD'];
  const OK_KEYS = ['Enter', 'NumpadEnter', 'Space', 'KeyZ', 'KeyJ'];

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
    constructor() {
      this.t = 0; this.weather = new CX.Weather('snow', 1.2); CX.setTouchLayout('none');
      this.sel = 0;
      this.btns = [{ x: W / 2 - 120, y: 362, w: 240, h: 44, act: 'start' }, { x: W / 2 - 120, y: 418, w: 240, h: 44, act: 'gallery' }];
    }
    choose(act) { audio.sfx('page'); if (act === 'gallery') game.openGallery(); else game.start(); }
    update(dt) {
      this.t += dt; this.weather.update(dt, 8);
      if (CX.DEBUG.auto && this.t > 1) return game.start();
      if (this.t <= .5) return;
      if (input.keyHit(...PREV_KEYS)) this.sel = (this.sel + 1) % 2;
      else if (input.keyHit(...NEXT_KEYS)) this.sel = (this.sel + 1) % 2;
      if (input.keyHit('KeyG')) return this.choose('gallery');
      if (input.keyHit(...OK_KEYS) || input.wasPressed('action')) return this.choose(this.btns[this.sel].act);
      if (input.tapped) {
        const b = this.btns.find(b => input.tapIn(b));
        this.choose(b ? b.act : 'start');        // 點按鈕以外的地方＝開始遊戲（維持原本「點擊畫面開始」）
      }
    }
    draw(c) {
      const t = this.t;
      CX.drawCover(c, CX.images.p11, 0, 0, W, H, 1.08 + Math.sin(t * .15) * .03, Math.sin(t * .1) * 20);
      c.fillStyle = 'rgba(4,6,16,.45)'; c.fillRect(0, 0, W, H);
      this.weather.draw(c);
      CX.vignette(c, .7);
      const a = clamp(t / 1.5, 0, 1);
      CX.text(c, '初雪', W / 2, 190, 110, '#f2f5ff', { alpha: a, bold: true, shadow: '#8fa8ff', blur: 30 });
      CX.text(c, '夢落下的原點', W / 2, 280, 30, '#d6def5', { alpha: a });
      const m = CX.memory;
      drawButton(c, this.btns[0], '開始遊戲', { selected: this.sel === 0, alpha: a });
      drawButton(c, this.btns[1], `回憶圖鑑　${m.count()} / ${m.total()}${m.complete() ? '　★' : ''}`, { selected: this.sel === 1, alpha: a, size: 18 });
      const hint = CX.touchWanted ? '— 點擊按鈕選擇 —' : '↑ ↓ 選擇　Enter / 空白鍵 確認　G 回憶圖鑑';
      CX.text(c, hint, W / 2, 485, 15, '#e8ecff', { alpha: a * (.55 + .45 * Math.sin(t * 3)) });
      CX.text(c, '原著〈初雪〉改編・網頁小遊戲　　M 靜音　F 全螢幕', W / 2, 515, 13, 'rgba(200,208,230,.6)');
    }
  }

  /* =========================================================
   * 回憶圖鑑：依章節列出每片記憶碎片，未拾回的顯示「？？？」
   * ========================================================= */
  class GalleryScene {
    constructor(onBack) {
      this.t = 0; this.onBack = onBack; this.ch = 1; this.weather = new CX.Weather('snow', .7);
      CX.setTouchLayout('none');
      this.chapters = Object.keys(CX.MEMORIES).map(Number);
      this.tabs = this.chapters.map((ch, i) => ({ x: 60 + i * 212, y: 92, w: 204, h: 38, ch }));
      this.bBack = { x: W / 2 - 70, y: 486, w: 140, h: 36 };
      this.bPrev = { x: 60, y: 486, w: 120, h: 36 };
      this.bNext = { x: W - 180, y: 486, w: 120, h: 36 };
      this.bHidden = { x: W / 2 + 90, y: 486, w: 190, h: 36 };
    }
    setCh(ch) { if (ch !== this.ch) audio.sfx('page'); this.ch = ch; }
    step(d) { const i = this.chapters.indexOf(this.ch); this.setCh(this.chapters[(i + d + this.chapters.length) % this.chapters.length]); }
    update(dt) {
      this.t += dt; this.weather.update(dt, 6);
      if (this.t < .25) return;
      const done = CX.memory.complete();
      if (input.keyHit('ArrowLeft', 'KeyA', 'ArrowUp', 'KeyW')) this.step(-1);
      if (input.keyHit('ArrowRight', 'KeyD', 'ArrowDown', 'KeyS')) this.step(1);
      ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((k, i) => { if (input.keyHit(k) && this.chapters[i]) this.setCh(this.chapters[i]); });
      if (input.keyHit('Escape', 'Backspace', 'Enter', 'NumpadEnter', 'KeyG')) return this.onBack();
      if (done && input.keyHit('KeyH')) return game.playHidden();
      if (input.tapped) {
        const tab = this.tabs.find(r => input.tapIn(r));
        if (tab) this.setCh(tab.ch);
        else if (input.tapIn(this.bPrev)) this.step(-1);
        else if (input.tapIn(this.bNext)) this.step(1);
        else if (input.tapIn(this.bBack)) return this.onBack();
        else if (done && input.tapIn(this.bHidden)) return game.playHidden();
      }
    }
    draw(c) {
      const m = CX.memory, done = m.complete();
      CX.drawCover(c, CX.images.p59, 0, 0, W, H, 1.06);
      c.fillStyle = 'rgba(6,8,20,.78)'; c.fillRect(0, 0, W, H);
      this.weather.draw(c, .6);
      CX.text(c, '回憶圖鑑', 60, 48, 32, '#f2f5ff', { align: 'left', bold: true, shadow: '#8fa8ff' });
      CX.text(c, `已拾回　${m.count()} / ${m.total()}`, 260, 44, 18, '#dfe6ff', { align: 'left' });
      CX.text(c, done ? CX.HIDDEN_TEXT.galleryUnlocked : CX.HIDDEN_TEXT.galleryLocked, 260, 70, 14, done ? '#ffe0a0' : 'rgba(200,210,235,.6)', { align: 'left' });
      // 章節分頁
      for (const r of this.tabs) {
        const list = CX.MEMORIES[r.ch], got = list.filter((_, i) => m.has(`${r.ch}-${i + 1}`)).length;
        drawButton(c, r, `${CX.STAGE_INFO[r.ch].no}　${got}/${list.length}`, { selected: r.ch === this.ch, size: 16 });
      }
      CX.text(c, CX.STAGE_INFO[this.ch].name, W / 2, 147, 15, '#aebce0');
      // 條目
      const list = CX.MEMORIES[this.ch];
      const rowH = list.length > 6 ? 46 : 52, top = 160;
      list.forEach((mem, i) => {
        const id = `${this.ch}-${i + 1}`, has = m.has(id), y = top + i * rowH;
        c.fillStyle = has ? 'rgba(160,180,255,.1)' : 'rgba(255,255,255,.04)';
        CX.roundRect(c, 60, y, W - 120, rowH - 6, 8); c.fill();
        if (has) CX.drawFragment(c, 84, y + (rowH - 6) / 2, 0);
        else CX.text(c, '·', 84, y + (rowH - 6) / 2, 22, 'rgba(255,255,255,.3)');
        CX.text(c, String(i + 1).padStart(2, '0'), 112, y + (rowH - 6) / 2, 14, 'rgba(200,210,240,.5)');
        c.save(); c.font = CX.font(15); c.textBaseline = 'middle';
        if (has) {
          const lines = CX.wrapText(c, mem.text, W - 120 - 110).slice(0, 2);
          c.fillStyle = '#eef2ff';
          const cy = y + (rowH - 6) / 2 - (lines.length - 1) * 10;
          lines.forEach((ln, k) => c.fillText(ln, 135, cy + k * 20));
        } else {
          c.fillStyle = 'rgba(220,225,240,.55)'; c.font = CX.font(17);
          c.fillText('？？？', 135, y + (rowH - 6) / 2);
          if (mem.lockedHint) { c.font = CX.font(13); c.fillStyle = 'rgba(200,210,240,.45)'; c.fillText('（' + mem.lockedHint + '）', 200, y + (rowH - 6) / 2 + 1); }
        }
        c.restore();
      });
      // 底部按鈕
      drawButton(c, this.bPrev, '◀ 上一章', { size: 15 });
      drawButton(c, this.bNext, '下一章 ▶', { size: 15 });
      drawButton(c, this.bBack, '返回', { size: 16 });
      if (done) drawButton(c, this.bHidden, '重溫隱藏結局' + (CX.touchWanted ? '' : '（H）'), { size: 15, color: '#ffe0a0' });
      if (!CX.touchWanted) CX.text(c, '← → 切換章節　Esc 返回', W / 2, 532, 11, 'rgba(200,210,240,.4)');
    }
  }

  /* =========================================================
   * 過場劇情：插圖＋打字機效果對話框
   * ========================================================= */
  class CutScene {
    constructor(id, opt = {}) {
      this.opt = opt; this.id = id;
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
      if (this.i >= this.list.length - 1) { this.finish(); return; }
      this.prevImg = this.cur.img; this.fadeT = 0; this.i++; this.enterSlide();
    }
    finish() { if (this.opt.onDone) this.opt.onDone(); else game.next(); }
    update(dt) {
      this.t += dt; this.fadeT = Math.min(1, this.fadeT + dt * 2.2);
      this.chars = Math.min(this.cur.text.length, this.chars + dt * 32);
      this.shakeAmt *= Math.pow(.03, dt);
      this.weather.update(dt, this.isRain ? 0 : 6);
      if (input.wasPressed('back')) { this.finish(); return; }        // Esc 跳過整段
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
      const cap = s.caption || (s.year ? '2009年' : '');     // 畫面中央的大字標題
      if (cap) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
        CX.text(c, cap, W / 2, 150, s.caption ? 52 : 64, '#e6e6ea', { bold: true, alpha: clamp(this.t, 0, 1), shadow: '#000' });
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
    constructor() {
      this.t = 0; this.weather = new CX.Weather('snow', 2); CX.setTouchLayout('none'); audio.bgm('snow');
      this.sel = 0;
      this.btns = [{ x: W / 2 - 230, y: 478, w: 210, h: 40, act: 'title' }, { x: W / 2 + 20, y: 478, w: 210, h: 40, act: 'gallery' }];
    }
    choose(act) { audio.sfx('page'); if (act === 'gallery') game.openGallery(); else game.toTitle(); }
    update(dt) {
      this.t += dt; this.weather.update(dt, 10);
      if (this.t > 2) {
        if (input.keyHit(...PREV_KEYS, ...NEXT_KEYS)) this.sel = 1 - this.sel;
        if (input.keyHit('KeyG')) return this.choose('gallery');
        if (input.keyHit(...OK_KEYS) || input.wasPressed('action')) return this.choose(this.btns[this.sel].act);
        if (input.tapped) { const b = this.btns.find(b => input.tapIn(b)); return this.choose(b ? b.act : 'title'); }
      }
      if (CX.DEBUG.auto && this.t > 3 && !this.logged) { this.logged = true; console.log('[auto] 全部通關'); window.__cleared = true; }
    }
    draw(c) {
      const t = this.t, s = CX.stats, m = CX.memory;
      CX.drawCover(c, CX.images.p59, 0, 0, W, H, 1.05 + t * .004);
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, 0, W, H);
      this.weather.draw(c);
      const a = clamp(t / 2, 0, 1);
      CX.text(c, '初雪.......完', W / 2, 160, 64, '#4a4050', { alpha: a, bold: true, shadow: 'rgba(255,255,255,.8)', blur: 20 });
      const sec = Math.round((performance.now() - s.start) / 1000);
      const a2 = clamp((t - 1.5) / 1.5, 0, 1);
      c.fillStyle = `rgba(255,255,255,${.55 * a2})`; CX.roundRect(c, W / 2 - 220, 228, 440, 158, 14); c.fill();
      CX.text(c, `本次拾回記憶碎片　${s.fragments} / ${s.totalFragments}`, W / 2, 256, 20, '#3a3442', { alpha: a2 });
      CX.text(c, `回憶圖鑑（累計）　${m.count()} / ${m.total()}`, W / 2, 289, 18, '#4a4452', { alpha: a2 });
      CX.text(c, `重來次數　${s.retries}`, W / 2, 321, 18, '#4a4452', { alpha: a2 });
      CX.text(c, `遊玩時間　${Math.floor(sec / 60)} 分 ${sec % 60} 秒`, W / 2, 353, 18, '#4a4452', { alpha: a2 });
      const done = m.complete();
      CX.text(c, done ? CX.HIDDEN_TEXT.endDone : '還有一些記憶，散落在夢裡。', W / 2, 412, 18, '#4a4050', { alpha: a2 });
      if (!done) CX.text(c, CX.HIDDEN_TEXT.endHint, W / 2, 442, 16, '#6a5070', { alpha: a2 * (.7 + .3 * Math.sin(t * 2)), bold: true });
      if (t > 2) {
        drawButton(c, this.btns[0], '回到標題', { selected: this.sel === 0, size: 17, selFill: 'rgba(70,58,96,.85)' });
        drawButton(c, this.btns[1], '回憶圖鑑' + (CX.touchWanted ? '' : '（G）'), { selected: this.sel === 1, size: 17, selFill: 'rgba(70,58,96,.85)' });
      }
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
      // 有條件的步驟（例如隱藏結局）：條件不成立就跳過
      if (step.cond && !(CX.CONDITIONS[step.cond] && CX.CONDITIONS[step.cond]())) { console.log('[scene] skip', step.id, '(' + step.cond + ')'); return this.enter(i + 1); }
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
    openGallery() { console.log('[scene] gallery'); this.flowIdx = -1; this.scene = new GalleryScene(() => this.toTitle()); },
    /** 從圖鑑重溫隱藏結局，看完回到圖鑑 */
    playHidden() { console.log('[scene] cut hidden (replay)'); audio.bgm('snow'); this.flowIdx = -1; this.scene = new CutScene('hidden', { snow: true, onDone: () => this.openGallery() }); },
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
