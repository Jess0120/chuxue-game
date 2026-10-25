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
  function resetStats() { Object.assign(CX.stats, { fragments: 0, totalFragments: 0, retries: 0, start: performance.now(), found: new Set(), originSeen: false }); }

  /** 隱藏結局條件：跨多次遊玩，曾經拾回過全部碎片（對玩家比較友善，不必一次全收） */
  CX.CONDITIONS = { allMemories: () => CX.memory.complete() };
  /** 已達成過的正式結局（A／B／C），跨多次遊玩累計 */
  const END_KEY = 'chuxue.endings.v1';
  CX.endingsSeen = function () { try { const a = JSON.parse(localStorage.getItem(END_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };

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
      this.cp = CX.checkpoint.load();
      const acts = this.cp ? ['continue', 'start', 'gallery'] : ['start', 'gallery'];
      const y0 = this.cp ? 326 : 362;
      this.btns = acts.map((act, k) => ({ x: W / 2 - 130, y: y0 + k * 52, w: 260, h: 44, act }));
    }
    choose(act) { audio.sfx('page'); if (act === 'gallery') game.openGallery(); else if (act === 'continue') game.continueGame(); else game.start(); }
    update(dt) {
      this.t += dt; this.weather.update(dt, 8);
      if (CX.DEBUG.auto && this.t > 1) return game.start();
      if (this.t <= .5) return;
      const nb = this.btns.length;
      if (input.keyHit(...PREV_KEYS)) this.sel = (this.sel + nb - 1) % nb;
      else if (input.keyHit(...NEXT_KEYS)) this.sel = (this.sel + 1) % nb;
      if (input.keyHit('KeyG')) return this.choose('gallery');
      if (input.keyHit(...OK_KEYS) || input.wasPressed('action')) return this.choose(this.btns[this.sel].act);
      if (input.tapped) {
        const b = this.btns.find(b => input.tapIn(b));
        this.choose(b ? b.act : this.btns[0].act);   // 點按鈕以外的地方＝第一個按鈕（維持原本「點擊畫面開始」）
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
      this.btns.forEach((b, k) => {
        const label = b.act === 'start' ? (this.cp ? '從頭開始' : '開始遊戲') : b.act === 'continue' ? `繼續：${this.cp.name || '存檔點'}` : `回憶圖鑑　${m.count()} / ${m.total()}${m.complete() ? '　★' : ''}`;
        drawButton(c, b, label, { selected: this.sel === k, alpha: a, size: b.act === 'start' ? 19 : 18 });
      });
      const hint = CX.touchWanted ? '— 點擊按鈕選擇 —' : '↑ ↓ 選擇　Enter / 空白鍵 確認　G 回憶圖鑑';
      CX.text(c, hint, W / 2, 485, 15, '#e8ecff', { alpha: a * (.55 + .45 * Math.sin(t * 3)) });
      CX.text(c, '序章改編自原著〈初雪〉・第一～四章為遊戲原創（非原作）　　M 靜音　F 全螢幕', W / 2, 515, 13, 'rgba(200,208,230,.6)');
    }
  }

  /* =========================================================
   * 回憶圖鑑：依章節列出每片記憶碎片，未拾回的顯示「？？？」
   * ========================================================= */
  class GalleryScene {
    constructor(onBack) {
      this.t = 0; this.onBack = onBack; this.weather = new CX.Weather('snow', .7);
      CX.setTouchLayout('none');
      this.chapters = Object.keys(CX.MEMORIES);          // '1'～'4'＝序章各段，'c1'＝第一章…
      this.ch = this.chapters[0];
      const n = this.chapters.length, gap = 8, tw = (W - 120 - gap * (n - 1)) / n;
      this.tabs = this.chapters.map((ch, i) => ({ x: 60 + i * (tw + gap), y: 92, w: tw, h: 38, ch }));
      this.bBack = { x: W / 2 - 70, y: 486, w: 140, h: 36 };
      this.bPrev = { x: 60, y: 486, w: 120, h: 36 };
      this.bNext = { x: W - 180, y: 486, w: 120, h: 36 };
      this.bHidden = { x: W / 2 + 90, y: 486, w: 190, h: 36 };
      this.bDoor = { x: W / 2 - 280, y: 486, w: 190, h: 36 };
      this.bRoof = { x: 664, y: 24, w: 180, h: 34 };   // 右上角留給 HTML 的音量／全螢幕按鈕
    }
    /** 「頂樓那一晚」：玩過第 2 章（拾回任一片 c2-*）就開放 */
    get canRoof() { return (CX.MEMORIES.c2 || []).some((_, i) => CX.memory.has('c2-' + (i + 1))); }
    /** 第 2 章分頁：玩過第 2 章（拾回過任一片）就能「重聽門後」 */
    get canDoor() { return this.ch === 'c2' && CX.MEMORIES.c2 && CX.MEMORIES.c2.some((_, i) => CX.memory.has('c2-' + (i + 1)));
    }
    setCh(ch) { if (ch !== this.ch) audio.sfx('page'); this.ch = ch; }
    step(d) { const i = this.chapters.indexOf(this.ch); this.setCh(this.chapters[(i + d + this.chapters.length) % this.chapters.length]); }
    update(dt) {
      this.t += dt; this.weather.update(dt, 6);
      if (this.t < .25) return;
      const done = CX.memory.complete();
      if (input.keyHit('ArrowLeft', 'KeyA', 'ArrowUp', 'KeyW')) this.step(-1);
      if (input.keyHit('ArrowRight', 'KeyD', 'ArrowDown', 'KeyS')) this.step(1);
      ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'].forEach((k, i) => { if (input.keyHit(k) && this.chapters[i]) this.setCh(this.chapters[i]); });
      if (input.keyHit('Escape', 'Backspace', 'Enter', 'NumpadEnter', 'KeyG')) return this.onBack();
      if (done && input.keyHit('KeyH')) return game.playHidden();
      if (this.canDoor && input.keyHit('KeyR')) return game.replayDoor();
      if (this.canRoof && input.keyHit('KeyT')) return game.openRoof(this.ch);
      if (input.tapped) {
        if (this.canRoof && input.tapIn(this.bRoof)) return game.openRoof(this.ch);
        const tab = this.tabs.find(r => input.tapIn(r));
        if (tab) this.setCh(tab.ch);
        else if (input.tapIn(this.bPrev)) this.step(-1);
        else if (input.tapIn(this.bNext)) this.step(1);
        else if (input.tapIn(this.bBack)) return this.onBack();
        else if (done && input.tapIn(this.bHidden)) return game.playHidden();
        else if (this.canDoor && input.tapIn(this.bDoor)) return game.replayDoor();
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
        drawButton(c, r, `${CX.STAGE_INFO[r.ch].no}　${got}/${list.length}`, { selected: r.ch === this.ch, size: this.tabs.length > 7 ? 13 : this.tabs.length > 4 ? 14 : 16 });
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
      if (done) drawButton(c, this.bHidden, (CX.HIDDEN_TEXT.galleryReplay || '重溫隱藏結局') + (CX.touchWanted ? '' : '（H）'), { size: 15, color: '#ffe0a0' });
      if (this.canRoof) drawButton(c, this.bRoof, '頂樓那一晚' + (CX.touchWanted ? '' : '（T）'), { size: 14, color: '#cfe0ff' });
      else CX.text(c, '頂樓那一晚：玩過第二章後開放', 754, 41, 12, 'rgba(200,210,240,.4)');
      if (this.canDoor) drawButton(c, this.bDoor, '重聽門後' + (CX.touchWanted ? '' : '（R）'), { size: 15, color: '#cfe8da' });
      if (!CX.touchWanted) CX.text(c, '← → 切換章節　Esc 返回', W / 2, 532, 11, 'rgba(200,210,240,.4)');
    }
  }


  /* =========================================================
   * 圖鑑特別頁「頂樓那一晚」：第 2 章刻意空白的那一格（2-3）與前後兩格、相關碎片放在一起。
   *   ・玩過第 2 章（拾回任一片 c2-*）就能進來；空白格要在第 4 章語音留言（c4-1）後才補上畫面。
   *   ・全部 45 片拾回後，這裡也是延伸結局〈原點〉的入口之一（另一個是圖鑑底部按鈕）。
   *   ・頁面上的台詞全部取自既有劇本段落（ch2_dong、ch4_msg），不新增劇情。
   * ========================================================= */
  const ROOF_FRAGS = ['c2-2', 'c2-3', 'c2-5', 'c4-1'];
  function memOf(id) { const [ch, n] = id.split('-'); return (CX.MEMORIES[ch] || [])[n - 1]; }
  /** 取出 ch2_dong 空白格前後各 n 格；filled＝c4-1 已拾回時，空白格換成第 4 章補上的畫面。效果欄位一律拿掉，重播不改存檔 */
  function roofSlides(filled) {
    const src = CX.CUTSCENES.ch2_dong || [], gi = src.findIndex(s => s.blank);
    if (gi < 0) return [];
    const strip = s => { const o = Object.assign({}, s); ['frag', 'set', 'add', 'item', 'goto', 'cond', 'hotspot', 'choice'].forEach(k => delete o[k]); return o; };
    const before = src.slice(Math.max(0, gi - 3), gi).map(strip), after = src.slice(gi + 1, gi + 3).map(strip);
    let gap = [strip(src[gi])];
    if (filled) {
      const m = CX.CUTSCENES.ch4_msg || [];
      gap = m.filter(s => s.bg === 'pushGap').filter((s, i, a) => s.text || a.findIndex(x => !x.text) === i).map(strip);
      gap.forEach(g => { g.tag = '那一秒半'; delete g.lock; });
    }
    return before.concat(gap, after);
  }
  class RoofScene {
    constructor(onBack) {
      this.t = 0; this.onBack = onBack; this.weather = new CX.Weather('rain', .5);
      CX.setTouchLayout('none');
      this.filled = CX.memory.has('c4-1');
      const pw = 256, ph = 144, gap = 22, x0 = (W - pw * 3 - gap * 2) / 2;
      this.panels = [0, 1, 2].map(i => ({ x: x0 + i * (pw + gap), y: 112, w: pw, h: ph }));
      this.bPlay = { x: W / 2 - 300, y: 486, w: 190, h: 36 };
      this.bBack = { x: W / 2 - 70, y: 486, w: 140, h: 36 };
      this.bOrigin = { x: W / 2 + 110, y: 486, w: 190, h: 36 };
    }
    update(dt) {
      this.t += dt; this.weather.update(dt, 4);
      if (this.t < .25) return;
      const done = CX.memory.complete();
      if (input.keyHit('Escape', 'Backspace', 'KeyT')) return this.onBack();
      if (input.keyHit('Enter', 'NumpadEnter', 'Space')) return game.playRoof();
      if (done && input.keyHit('KeyH')) return game.playHidden();
      if (input.tapped) {
        if (input.tapIn(this.bPlay)) return game.playRoof();
        if (input.tapIn(this.bBack)) return this.onBack();
        if (done && input.tapIn(this.bOrigin)) return game.playHidden();
      }
    }
    drawPanel(c, r, key, label, caption, dim) {
      c.save(); CX.roundRect(c, r.x, r.y, r.w, r.h, 6); c.clip();
      c.translate(r.x, r.y); c.scale(r.w / W, r.h / H);
      if (key) CX.drawBackdrop(c, key, this.t); else { c.fillStyle = '#5c5f66'; c.fillRect(0, 0, W, H); }
      c.fillStyle = 'rgba(40,70,140,.22)'; c.fillRect(0, 0, W, H);
      c.restore();
      c.save(); c.strokeStyle = dim ? 'rgba(200,210,240,.25)' : 'rgba(200,215,255,.55)'; c.lineWidth = 1.5; CX.roundRect(c, r.x, r.y, r.w, r.h, 6); c.stroke(); c.restore();
      CX.text(c, label, r.x + r.w / 2, r.y - 12, 14, '#cfe0ff');
      c.save(); c.font = CX.font(13); c.fillStyle = 'rgba(225,232,250,.85)'; c.textBaseline = 'top';
      CX.wrapText(c, caption, r.w).slice(0, 3).forEach((ln, k) => c.fillText(ln, r.x, r.y + r.h + 8 + k * 18));
      c.restore();
    }
    draw(c) {
      const m = CX.memory, done = m.complete();
      c.fillStyle = '#070a16'; c.fillRect(0, 0, W, H);
      this.weather.draw(c, .5);
      CX.text(c, '頂樓那一晚', 60, 48, 30, '#f2f5ff', { align: 'left', bold: true, shadow: '#8fa8ff' });
      CX.text(c, '2009年・頂樓　東宇沒有說出口的那一秒半，和它前後的兩格（遊戲原創，非原作）', 60, 80, 13, 'rgba(200,210,240,.7)', { align: 'left' });
      const [a, g, b] = this.panels;
      this.drawPanel(c, a, 'roof', '之前', '東宇：「進來。」阿昊：「放手。」\n東宇：「進來，阿昊。」');
      if (this.filled) this.drawPanel(c, g, 'pushGap', '那一秒半', '雨中，阿昊的手按在東宇的胸口上，用力推出去。東宇的手，仍然抓著他的衣領。');
      else {
        this.drawPanel(c, g, null, '那一秒半', '（空白。東宇不肯講的一格——第四章語音留言之後補上）', true);
        CX.text(c, '？', g.x + g.w / 2, g.y + g.h / 2, 40, 'rgba(255,255,255,.35)');
      }
      this.drawPanel(c, b, 'roof', '之後', '我用力把他往裡面拉。兩個人一起往後倒，他的手撞到欄杆，我的手肘撞到胖達。');
      // 相關碎片
      CX.text(c, '相關的記憶碎片', 60, 326, 15, '#aebce0', { align: 'left' });
      ROOF_FRAGS.forEach((id, i) => {
        const mem = memOf(id), has = m.has(id), y = 340 + i * 31;
        c.fillStyle = has ? 'rgba(160,180,255,.1)' : 'rgba(255,255,255,.04)'; CX.roundRect(c, 60, y, W - 120, 27, 6); c.fill();
        if (has) CX.drawFragment(c, 80, y + 13, 0); else CX.text(c, '·', 80, y + 13, 20, 'rgba(255,255,255,.3)');
        c.save(); c.textBaseline = 'middle'; c.font = CX.font(12); c.fillStyle = 'rgba(200,210,240,.5)'; c.fillText(id, 98, y + 14);
        c.font = CX.font(14); c.fillStyle = has ? '#eef2ff' : 'rgba(220,225,240,.55)';
        c.fillText(has ? mem.text : '？？？' + (mem && mem.lockedHint ? '　（' + mem.lockedHint + '）' : ''), 150, y + 14);
        c.restore();
      });
      const got = ROOF_FRAGS.filter(id => m.has(id)).length;
      CX.text(c, done ? '全部記憶已拾回：可以從這裡進入延伸結局〈原點〉（非原作）。'
        : `這一頁 ${got} / ${ROOF_FRAGS.length}　・全部 ${m.total()} 片拾回後，這裡會開啟延伸結局〈原點〉（非原作）的入口。`,
        W / 2, 474, 12, done ? '#ffe0a0' : 'rgba(200,210,240,.55)');
      drawButton(c, this.bPlay, '播放這一段' + (CX.touchWanted ? '' : '（Enter）'), { size: 15, color: '#cfe0ff' });
      drawButton(c, this.bBack, '返回圖鑑', { size: 15 });
      if (done) drawButton(c, this.bOrigin, '延伸結局〈原點〉' + (CX.touchWanted ? '' : '（H）'), { size: 14, color: '#ffe0a0' });
      if (!CX.touchWanted) CX.text(c, 'Esc／T 返回圖鑑', W / 2, 532, 11, 'rgba(200,210,240,.4)');
    }
  }

  /* =========================================================
   * 過場劇情：插圖＋打字機效果對話框
   *   第 1 章起支援：choice 選項、cond 條件格、goto 跳段、set/add 變數、
   *   frag 碎片、bg 程式背景、note 紙條、card 標題卡（格式見 story-ch1.js 開頭）
   * ========================================================= */
  class CutScene {
    constructor(id, opt = {}) {
      this.opt = opt; this.id = id;
      this.list = opt.list || CX.CUTSCENES[id]; this.i = 0; this.t = 0; this.chars = 0; this.prev = null; this.fadeT = 1;
      const wm = opt.weather || (opt.snow ? 'snow' : (opt.rain || id === 'after3' || id === 'after4') ? 'rain' : 'snow');
      this.weather = new CX.Weather(wm === 'none' ? 'snow' : wm, wm === 'none' ? 0 : opt.snow ? 1.4 : wm === 'rain' ? .8 : .5);
      this.isRain = this.weather.mode === 'rain';
      this.sel = 0; this.pendingFinish = false;
      CX.setTouchLayout('none');
      this.enterSlide();
    }
    get cur() { return this.list && this.list[this.i]; }
    get len() { const s = this.cur; return s && s.text ? s.text.length : 0; }
    /** 目前這一格可選的選項（cond 不成立的不顯示） */
    /** 這一格還沒拾回的可點雪花 */
    get hotspot() { const s = this.cur, h = s && s.hotspot; return h && !CX.stats.found.has(h.frag) ? h : null; }
    get choices() { const s = this.cur; return s && s.choice ? s.choice.filter(o => CX.evalCond(o.cond)) : null; }
    switchTo(id) {
      if (!CX.CUTSCENES[id]) { console.warn('[cut] 找不到過場', id); this.pendingFinish = true; return false; }
      console.log('[cut] goto', id); this.list = CX.CUTSCENES[id]; this.id = id; this.i = 0; return true;
    }
    /** 進入目前這一格：跳過條件不成立的格、處理純跳轉格，再觸發音效／變數／碎片 */
    enterSlide() {
      for (let guard = 0; guard < 500; guard++) {
        const s = this.cur;
        if (!s) { this.pendingFinish = true; return; }
        if (!CX.evalCond(s.cond)) { this.i++; continue; }
        if (s.goto && s.text == null && !s.choice) { CX.applyEffects(s); if (!this.switchTo(s.goto)) return; continue; }
        break;
      }
      this.t = 0; this.chars = 0; this.sel = 0;
      const s = this.cur;
      if (s.sfx) audio.sfx(s.sfx, .8);
      this.shakeAmt = s.shake || 0;
      if (s.flash) { this.flashA = .85; this.flashC = s.flash; }
      if (!s.choice) CX.applyEffects(s);
      if (s.frag) CX.awardMemory(s.frag);
      if (s.weather) { this.weather.set(s.weather === 'none' ? 'snow' : s.weather, s.weather === 'none' ? 0 : .8); this.isRain = s.weather === 'rain'; }
      // 2009 之後的回憶篇改成下雨
      if (s.img === 'p44' && !this.isRain) { this.weather.set('rain', .8); this.isRain = true; }
    }
    /** 往下一格（或 goto 到另一段） */
    step(gotoId) {
      const s = this.cur;
      this.prev = s; this.fadeT = 0;
      const g = gotoId || (s && s.goto);
      if (g) { if (!this.switchTo(g)) return; }
      else this.i++;
      if ((s && s.blank) || (this.cur && this.cur.blank)) this.fadeT = 1;   // 空白格前後硬切，不淡入淡出
      this.enterSlide();
    }
    advance() {
      if (this.chars < this.len) { this.chars = this.len; return; }
      if (this.cur.choice) return;                 // 等玩家選
      audio.sfx('page');
      this.step();
    }
    choose(k) {
      const o = this.choices[k]; if (!o) return;
      audio.sfx('page'); console.log('[choice]', o.text);
      CX.applyEffects(o);
      this.step(o.goto || null);
    }
    /** Esc：快轉到下一個選項（途中的變數與碎片照常生效）；沒有選項就結束整段 */
    skipAhead() {
      for (let guard = 0; guard < 500; guard++) {
        const s = this.cur;
        if (s && !s.choice) {
          const g = s.goto;
          if (g) { if (!this.switchTo(g)) break; }
          else this.i++;
        }
        const n = this.cur;
        if (!n) break;
        if (!CX.evalCond(n.cond)) { this.i++; continue; }
        if (n.choice) { this.prev = null; this.enterSlide(); this.chars = this.len; return; }
        if (n.goto && n.text == null) { CX.applyEffects(n); continue; }
        CX.applyEffects(n); if (n.frag) CX.awardMemory(n.frag);
      }
      this.finish();
    }
    choiceRects(n) {
      const w = 600, h = 46, gap = 12, top = 372 - n * (h + gap);
      return Array.from({ length: n }, (_, k) => ({ x: W / 2 - w / 2, y: top + k * (h + gap), w, h }));
    }
    finish() { if (this.done) return; this.done = true; if (this.opt.onDone) this.opt.onDone(); else game.next(); }
    update(dt) {
      if (this.pendingFinish) { this.pendingFinish = false; return this.finish(); }
      const s = this.cur; if (!s) return;
      this.t += dt; this.fadeT = Math.min(1, this.fadeT + dt * 2.2);
      this.chars = Math.min(this.len, this.chars + dt * 32);
      this.shakeAmt *= Math.pow(.03, dt);
      if (this.flashA) this.flashA *= Math.pow(.02, dt);
      this.weather.update(dt, this.isRain ? 0 : 6);
      const ch = this.chars >= this.len && this.choices;
      if (ch && ch.length) {
        if (input.keyHit(...PREV_KEYS)) this.sel = (this.sel + ch.length - 1) % ch.length;
        if (input.keyHit(...NEXT_KEYS)) this.sel = (this.sel + 1) % ch.length;
        if (this.t > .4) {
          if (input.tapped) { const k = this.choiceRects(ch.length).findIndex(r => input.tapIn(r)); if (k >= 0) return this.choose(k); }
          else if (input.keyHit(...OK_KEYS)) return this.choose(this.sel);
          for (let k = 0; k < ch.length && k < 4; k++) if (input.keyHit('Digit' + (k + 1), 'Numpad' + (k + 1))) return this.choose(k);
        }
        if (CX.DEBUG.auto && this.t > .8) { const q = CX.DEBUG.picks; const k = q && q.length ? q.shift() : CX.DEBUG.pick; return this.choose(Math.min(k, ch.length - 1)); }
        return;
      }
      // 畫面上可以點的雪花（第 2 章起）：點中就拾回，不翻頁
      const hs = this.hotspot;
      if (hs && this.t > .2) {
        const hit = (input.tapped && input.tapIn({ x: hs.x - 44, y: hs.y - 44, w: 88, h: 88 })) || input.keyHit('KeyE') || (CX.DEBUG.auto && this.t > .35);
        if (hit) { CX.awardMemory(hs.frag); return; }
      }
      if (input.wasPressed('back')) { this.skipAhead(); return; }        // Esc 跳過（遇到選項會停下）
      if (s.lock) { if (this.t > (s.hold || 1.5)) this.advance(); return; }   // 刻意空白格：不能手動翻，時間到自動翻
      const minT = s.diff && this.chars >= this.len ? 1.2 : .25;          // 與夢不同的句子：多停一下才能翻
      if (this.t > minT && input.confirm()) this.advance();
      // 沒有文字的格（標題卡、簡訊畫面）：hold 秒後自動翻頁
      if (!this.len && this.t > (s.hold || 2.4)) this.advance();
      // 自動遊玩／快轉：文字顯示完就自動翻頁
      if ((CX.DEBUG.auto || CX.DEBUG.fast) && this.chars >= this.len && this.t > (s.diff ? 1.4 : .5)) this.advance();
    }
    drawBg(c, s, zoom, pan) {
      if (s.flip) { c.save(); c.translate(W, 0); c.scale(-1, 1); }     // 左右反轉重用插圖（第 3 章結局④）
      if (s.img) CX.drawCover(c, CX.images[s.img], 0, 0, W, H, zoom, pan);
      else if (s.bg) CX.drawBackdrop(c, s.bg, this.t);
      if (s.flip) c.restore();
    }
    draw(c) {
      const s = this.cur;
      if (!s) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); return; }
      const k = clamp(this.t / 8, 0, 1);
      c.save();
      if (this.shakeAmt > .3) c.translate(CX.rand(-1, 1) * this.shakeAmt, CX.rand(-1, 1) * this.shakeAmt);
      c.fillStyle = '#000'; c.fillRect(-20, -20, W + 40, H + 40);
      if (this.prev && this.fadeT < 1) this.drawBg(c, this.prev, 1.1, 0);
      c.globalAlpha = this.fadeT;
      this.drawBg(c, s, 1.02 + k * .08, (k - .5) * -16);   // 緩慢推鏡
      c.globalAlpha = 1;
      if (s.tint === 'cold') { c.fillStyle = 'rgba(30,60,130,.28)'; c.fillRect(-20, -20, W + 40, H + 40); }   // 回放段的冷藍色調
      if (s.tint === 'soft') {                                          // 第 4 章尾聲：柔和的白藍色調
        c.fillStyle = 'rgba(214,228,255,.22)'; c.fillRect(-20, -20, W + 40, H + 40);
        const g = c.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 560); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(235,242,255,.35)');
        c.fillStyle = g; c.fillRect(-20, -20, W + 40, H + 40);
      }
      if (s.tint === 'frost') {                                         // 第 3 章：同一個港口，地上多了一層很薄的雪
        const g = c.createLinearGradient(0, H * .55, 0, H); g.addColorStop(0, 'rgba(235,240,250,0)'); g.addColorStop(1, 'rgba(235,240,250,.38)');
        c.fillStyle = g; c.fillRect(-20, H * .55, W + 40, H * .45 + 20); c.fillStyle = 'rgba(10,16,34,.18)'; c.fillRect(-20, -20, W + 40, H + 40);
      }
      if (this.flashA > .01) { c.fillStyle = this.flashC; c.globalAlpha = this.flashA; c.fillRect(-20, -20, W + 40, H + 40); c.globalAlpha = 1; }      c.restore();
      this.weather.draw(c, .8);
      if (s.tag) CX.text(c, s.tag, W - 104, 25, 14, s.tint === 'cold' ? '#b8d0ff' : 'rgba(240,242,250,.85)', { align: 'right', stroke: 'rgba(0,0,0,.55)', strokeW: 3 });
      const hs = this.hotspot;
      if (hs) {
        const p = .6 + .4 * Math.sin(this.t * 4);
        c.save(); c.shadowColor = '#cfe0ff'; c.shadowBlur = 18 * p; c.strokeStyle = `rgba(210,225,255,${.35 + .35 * p})`; c.lineWidth = 2;
        c.beginPath(); c.arc(hs.x, hs.y, 26 + p * 4, 0, 6.283); c.stroke(); c.restore();
        CX.drawFragment(c, hs.x, hs.y, this.t);
        CX.text(c, hs.label + (CX.touchWanted ? '（點擊雪花）' : '（點擊雪花／E）'), hs.x, hs.y + 42, 13, '#dfe8ff', { stroke: 'rgba(0,0,0,.6)', strokeW: 3 });
      }
      if (s.note) { c.save(); c.globalAlpha = clamp(this.t * 3, 0, 1); CX.drawNote(c, s.note, s.noteStyle); c.restore(); }
      const cap = s.caption || (s.year ? '2009年' : '');     // 畫面中央的大字標題
      if (cap) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
        CX.text(c, cap, W / 2, 150, s.caption ? 52 : 64, '#e6e6ea', { bold: true, alpha: clamp(this.t, 0, 1), shadow: '#000' });
      }
      if (s.card) CX.text(c, s.card, W / 2, s.text ? 200 : s.cardSub ? H / 2 - 24 : H / 2, 46, '#eef0f8', { bold: true, alpha: clamp(this.t / 1.2, 0, 1), shadow: '#8fa8ff', blur: 20 });
      if (s.cardSub) CX.text(c, s.cardSub, W / 2, H / 2 + 40, 22, '#d8dceb', { alpha: clamp((this.t - 1) / 1.2, 0, 1) });
      if (s.footnote) CX.text(c, s.footnote, 24, 22, 13, 'rgba(235,238,248,.75)', { align: 'left', stroke: 'rgba(0,0,0,.5)', strokeW: 3 });
      if (this.len) this.drawBox(c, s);
      const ch = this.chars >= this.len && this.choices;
      if (ch && ch.length) {
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, W, H);
        this.choiceRects(ch.length).forEach((r, i) => drawButton(c, r, ch[i].text, { selected: i === this.sel, size: 18, color: ch[i].dim ? 'rgba(170,176,190,.75)' : undefined }));
        if (!CX.touchWanted) CX.text(c, '↑ ↓ 選擇　Enter 決定', W / 2, 396, 13, 'rgba(220,226,245,.6)');
        if (s.choiceNote && CX.evalCond(s.choiceNoteIf)) CX.text(c, s.choiceNote, W / 2, this.choiceRects(ch.length)[0].y - 24, 15, 'rgba(200,214,255,.8)', { stroke: 'rgba(0,0,0,.6)', strokeW: 3 });
      }
      CX.text(c, CX.touchWanted ? '' : 'Esc 跳過劇情', W - 70, 530, 12, 'rgba(255,255,255,.45)');
    }
    /** 對話框：有說話者時顯示頭像與名牌（沒有頭像的角色只顯示名牌） */
    drawBox(c, s) {
      const who = s.who && CX.CHARACTERS[s.who];
      const bx = 40, by = 390, bw = W - 80, bh = 128;
      const g = c.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, 'rgba(8,10,22,.82)'); g.addColorStop(1, 'rgba(4,5,12,.92)');
      c.fillStyle = g; CX.roundRect(c, bx, by, bw, bh, 14); c.fill();
      c.strokeStyle = 'rgba(190,205,255,.35)'; c.lineWidth = 1.5; c.stroke();
      let tx = bx + 28;
      if (who) {
        const img = who.portrait && CX.images['pt_' + who.portrait];
        const tagX = img ? bx + 130 : bx + 16;
        if (img) {
          c.save(); CX.roundRect(c, bx + 16, by + 14, 100, 100, 12); c.clip();
          if (img.naturalWidth || img.width) c.drawImage(img, bx + 16, by + 14, 100, 100);
          c.restore();
          c.strokeStyle = who.color; c.lineWidth = 2; CX.roundRect(c, bx + 16, by + 14, 100, 100, 12); c.stroke();
          tx = bx + 136;
        }
        c.save(); c.font = CX.font(18, true); const tw = Math.max(110, c.measureText(who.name).width + 30); c.restore();
        c.fillStyle = 'rgba(8,10,22,.92)'; CX.roundRect(c, tagX, by - 18, tw, 32, 8); c.fill();
        c.strokeStyle = who.color; c.lineWidth = 1.5; c.stroke();
        CX.text(c, who.name, tagX + tw / 2, by - 2, 18, who.color, { bold: true });
      }
      c.save();
      const q = who && !who.noQuote;                       // 東宇的回放旁白等：有名牌、不加引號
      c.font = CX.font(who ? 22 : 21); c.fillStyle = s.diff ? DIFF_COLOR : s.em ? '#ffe6b0' : who ? (who.textColor || '#ffffff') : '#e4e8f6'; c.textBaseline = 'top';
      const shown = s.text.slice(0, Math.floor(this.chars));
      const lines = CX.wrapText(c, (q ? '「' : '') + shown + (q && this.chars >= s.text.length ? '」' : ''), bx + bw - tx - 30);
      lines.slice(0, 3).forEach((ln, i) => c.fillText(ln, tx, by + 22 + i * 32));
      c.restore();
      if (this.chars >= s.text.length && !s.choice) CX.text(c, '▼', bx + bw - 26, by + bh - 20 + Math.sin(this.t * 6) * 3, 14, '#c8d4ff');
      CX.text(c, `${this.i + 1} / ${this.list.length}`, bx + bw - 60, by + 16, 11, 'rgba(200,210,240,.4)');
    }
  }

  /* =========================================================
   * 點擊調查（第 1 章起）：CX.EXPLORE[id] = { bg, title, hint, objects:[…] }
   *   objects：{ id, kind, label, x,y,w,h, lines:[過場格…], after:[先調查完的 id], exit }
   *   點物件（或 ← → 選、Enter 決定）就播放它的 lines；全部調查完才會出現 exit 物件。
   * ========================================================= */
  /** 第 3 章起：劇本粗體句（與夢不同的地方）用的字色 */
  const DIFF_COLOR = '#ffb98a';
  class ExploreScene {
    constructor(id, step = {}) {
      this.id = id; this.def = CX.EXPLORE[id]; this.step = step;
      this.t = 0; this.done = new Set(); this.sel = 0;
      CX.setTouchLayout('none');
    }
    get visible() { return this.def.objects.filter(o => !o.after || o.after.every(a => this.done.has(a))); }
    get required() { return this.def.objects.filter(o => !o.exit); }
    investigate(o) {
      if (!o) return;
      audio.sfx('page'); console.log('[explore]', this.id, o.id);
      if (o.exit) return game.next();
      const back = () => {
        this.done.add(o.id); this.t = 0; CX.setTouchLayout('none'); game.scene = this;
        const v = this.visible; this.sel = Math.max(0, v.findIndex(x => !this.done.has(x.id)));
      };
      game.scene = new CutScene(this.id + ':' + o.id, { list: o.lines, weather: 'none', onDone: back });
    }
    update(dt) {
      this.t += dt;
      const v = this.visible;
      if (this.sel >= v.length) this.sel = 0;
      if (this.t < .3) return;
      if (CX.DEBUG.auto) { if (this.t > .6) this.investigate(v.find(x => !this.done.has(x.id))); return; }
      if (input.keyHit(...PREV_KEYS)) this.sel = (this.sel + v.length - 1) % v.length;
      if (input.keyHit(...NEXT_KEYS)) this.sel = (this.sel + 1) % v.length;
      if (input.tapped) { const o = v.find(x => input.tapIn({ x: x.x - 8, y: x.y - 8, w: x.w + 16, h: x.h + 16 })); if (o) this.investigate(o); }
      else if (input.keyHit(...OK_KEYS)) this.investigate(v[this.sel]);
    }
    draw(c) {
      CX.drawBackdrop(c, this.def.bg, this.t);
      const v = this.visible;
      v.forEach((o, k) => CX.drawProp(c, o, { t: this.t, sel: k === this.sel && !CX.touchWanted, done: this.done.has(o.id), labels: CX.touchWanted, opened: this.done.has('box') }));
      c.fillStyle = 'rgba(4,6,14,.72)'; CX.roundRect(c, 24, 18, 470, 62, 10); c.fill();
      CX.text(c, this.def.title, 44, 38, 20, '#f2f5ff', { align: 'left', bold: true });
      const req = this.required, n = req.filter(o => this.done.has(o.id)).length;
      CX.text(c, `調查　${n} / ${req.length}`, 470, 38, 15, '#cfd8f5', { align: 'right' });
      CX.text(c, this.def.hint, 44, 63, 13, 'rgba(210,218,240,.75)', { align: 'left' });
      if (!CX.touchWanted) CX.text(c, '← → 選擇物件　Enter / 空白鍵 調查　（也可以直接點擊）', W / 2, 522, 13, 'rgba(220,226,245,.6)');
    }
  }

  /* =========================================================
   * 結局畫面
   * ========================================================= */
  class EndScene {
    constructor() {
      this.t = 0; this.weather = new CX.Weather('snow', 2); CX.setTouchLayout('none'); audio.bgm('snow');
      this.sel = 0;
      // 這次達成的結局（第 4 章 ending 變數），累計記錄在 localStorage
      this.ending = CX.ENDINGS && CX.ENDINGS[CX.vars.ending];
      this.seen = CX.endingsSeen();
      if (this.ending && !this.seen.includes(this.ending.key)) { this.seen.push(this.ending.key); try { localStorage.setItem(END_KEY, JSON.stringify(this.seen)); } catch (e) { /* 存不了就算了 */ } }
      this.origin = !!CX.stats.originSeen;
      console.log('[end]', this.ending ? this.ending.name : '（無結局）', '已達成：', this.seen.join(','), this.origin ? '＋延伸結局・原點' : '');
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
      CX.text(c, '初雪.......完', W / 2, this.ending ? 128 : 160, 64, '#4a4050', { alpha: a, bold: true, shadow: 'rgba(255,255,255,.8)', blur: 20 });
      if (this.ending) {
        const tag = this.ending.name + '（' + this.ending.sub + '）' + (this.origin ? '　＋　延伸結局・原點（非原作）' : '');
        CX.text(c, tag, W / 2, 188, 20, '#3a3050', { alpha: a, bold: true, shadow: 'rgba(255,255,255,.9)', blur: 10 });
        // M5：累計顯示改成「已達成的寫出名稱、沒達成的寫？？？」，比只寫字母清楚
        const names = {}; Object.values(CX.ENDINGS).forEach(e => { names[e.key] = e.name.replace(/^結局\s*[A-C]\s*/, ''); });
        const seen = ['A', 'B', 'C'].map(k => this.seen.includes(k) ? `❄ ${k} ${names[k]}` : `・${k} ？？？`).join('　　');
        CX.text(c, `已達成的結局（${this.seen.length} / 3）　${seen}`, W / 2, 214, 15, '#4a4452', { alpha: a });
      }
      const sec = Math.round((performance.now() - s.start) / 1000);
      const a2 = clamp((t - 1.5) / 1.5, 0, 1);
      c.fillStyle = `rgba(255,255,255,${.55 * a2})`; CX.roundRect(c, W / 2 - 220, 232, 440, 154, 14); c.fill();
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
      if (this.ending) CX.text(c, this.origin ? '第一～四章、結局 A／B／C 為遊戲原創，延伸結局〈原點〉為遊戲延伸，皆非原作。' : '第一～四章與結局 A／B／C 為遊戲原創，非原作。', W / 2, 531, 12, 'rgba(60,50,70,.85)', { alpha: a2 });
    }
  }

  /* =========================================================
   * 畫面最上層的浮動提示（過場／調查用；關卡有自己的 toast）
   *   ・記憶碎片：拾回時顯示回憶文字
   *   ・信任度：角落短暫出現圖示（東宇＝扣子、阿昊＝琴鍵），不顯示數字
   *   ・道具：取得時顯示一行字
   * ========================================================= */
  const overlay = {
    toast: null, ping: null, banner: null,
    update(dt) {
      ['toast', 'ping', 'banner'].forEach(k => { const o = this[k]; if (o) { o.t += dt; if (o.t > o.life) this[k] = null; } });
    },
    draw(c) {
      const p = this.ping;
      if (p) { const a = clamp(p.t * 4, 0, 1) * clamp((p.life - p.t) * 2, 0, 1); CX.drawTrustIcon(c, p.kind, 46, 112 - Math.min(p.t, .4) * 20, a); }
      const b = this.banner;
      if (b) { const a = clamp(b.t * 4, 0, 1) * clamp((b.life - b.t) * 2, 0, 1); c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(8,12,28,.86)'; CX.roundRect(c, W / 2 - 220, 330, 440, 40, 10); c.fill(); c.restore(); CX.text(c, b.text, W / 2, 350, 17, '#ffe6b0', { alpha: a }); }
      const m = this.toast; if (!m) return;
      const a = clamp(m.t * 4, 0, 1) * clamp((m.life - m.t) * 2, 0, 1);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a; c.font = CX.font(17);
      const lines = CX.wrapText(c, m.text, 680).slice(0, 3);
      const bh = 40 + lines.length * 26, bw = 780, bx = (W - bw) / 2, by = 96;
      c.fillStyle = 'rgba(8,12,28,.9)'; CX.roundRect(c, bx, by, bw, bh, 12); c.fill();
      c.strokeStyle = 'rgba(190,210,255,.5)'; c.lineWidth = 1.5; c.stroke();
      CX.drawFragment(c, bx + 30, by + bh / 2, m.t);
      const [ch, n] = m.id.split('-');
      CX.text(c, `記憶碎片　${(CX.STAGE_INFO[ch] || { no: ch }).no}・${n}${m.isNew ? '　NEW' : ''}`, bx + 58, by + 18, 13, m.isNew ? '#ffe0a0' : '#aebce0', { align: 'left' });
      c.fillStyle = '#eef2ff'; c.textBaseline = 'top'; c.font = CX.font(17);
      lines.forEach((ln, k) => c.fillText(ln, bx + 58, by + 32 + k * 26));
      c.restore();
    },
  };
  CX.overlay = overlay;
  /** 過場／調查裡拾回記憶碎片（編號如 'c1-3'） */
  CX.awardMemory = function (id) {
    const isNew = CX.memory.add(id);
    if (!CX.stats.found.has(id)) { CX.stats.found.add(id); CX.stats.fragments++; }
    audio.sfx('pick');
    const text = CX.memory.text(id) || '……';
    overlay.toast = { id, text, t: 0, life: Math.min(6, 3 + text.length * .06), isNew };
    console.log('[memory]', id, isNew ? 'new' : 'again', text);
  };
  CX.onTrust = function (kind) { overlay.ping = { kind, t: 0, life: 1.8 }; audio.sfx('trust'); };
  CX.onItem = function (name) { overlay.banner = { text: '取得道具：' + name, t: 0, life: 2.6 }; };

  /* =========================================================
   * 遊戲控制器：依 FLOW 切換場景
   * ========================================================= */
  const game = {
    scene: new LoadingScene(), flowIdx: -1,
    /** 進入流程中的某一步 */
    enter(i) {
      this.flowIdx = i;
      const step = CX.FLOW[i];
      if (!step) { this.scene = new EndScene(); return; }
      // 有條件的步驟（例如延伸結局）：條件不成立就跳過
      if (step.cond && !CX.evalCond(step.cond)) { console.log('[scene] skip', step.id || step.type, '(' + step.cond + ')'); return this.enter(i + 1); }
      console.log('[scene]', step.type, step.id || '');
      if (step.fragTotal) CX.stats.totalFragments += step.fragTotal;
      if (step.type === 'cut') { if (step.bgm) audio.bgm(step.bgm); if (step.id === 'origin') CX.stats.originSeen = true; this.scene = new CutScene(step.id, step); }
      else if (step.type === 'stage') this.startStage(step.id);
      else if (step.type === 'explore') { if (step.bgm) audio.bgm(step.bgm); this.scene = new ExploreScene(step.id, step); }
      else if (step.type === 'checkpoint') { CX.checkpoint.save(step.id, step.name); return this.enter(i + 1); }
      else if (step.type === 'label') return this.enter(i + 1);
      // Game Over（第 3 章結局①）：回到指定的存檔點，變數還原成存檔當時的樣子，再套上 step.set
      else if (step.type === 'retry') {
        const j = CX.FLOW.findIndex(f => f.type === 'checkpoint' && f.id === step.to);
        const cp = CX.checkpoint.load();
        if (cp && cp.id === step.to) { CX.resetVars(); Object.assign(CX.vars, JSON.parse(JSON.stringify(cp.vars || {}))); }
        Object.assign(CX.vars, step.set || {}); CX.stats.retries = (CX.stats.retries || 0) + 1;
        console.log('[retry] →', step.to, JSON.stringify(step.set || {}));
        return this.enter(j < 0 ? i + 1 : j);
      }
      else if (step.type === 'jump') { const j = CX.FLOW.findIndex(f => f.label === step.to); if (j < 0) console.warn('[flow] 找不到 label', step.to); return this.enter(j < 0 ? i + 1 : j); }
      else this.scene = new EndScene();
      input.down = {};
    },
    startStage(id) {
      const quiet = id === 2 || id === 'door' || id === 'listen3';        // 節奏關：不放背景音樂、不顯示方向鍵
      const runner = id === 4 || id === 'run4b' || id === 'run4c';        // 自動奔跑（只有跳躍鍵）
      audio.bgm(quiet ? 'none' : id === 4 ? 'rain' : 'tense');
      this.scene = new CX.STAGES[id](this);
      CX.setTouchLayout(quiet ? 'none' : runner ? 'jump' : 'full');
    },
    /** 圖鑑「重聽門後」：重玩節奏關。成功的話補上碎片；第 3 章真正開始之前，存檔裡的 heardCount 也一起改成 true */
    replayDoor() {
      console.log('[scene] stage door (replay)'); this.flowIdx = -1;
      audio.bgm('none'); CX.setTouchLayout('none');
      const st = new CX.STAGES.door(this, { replay: true });
      st.onDone = s => {
        if (s.success) {
          CX.awardMemory('c2-3');
          const cp = CX.checkpoint.load();
          if (cp && cp.vars && !cp.vars.ch3Started && /^ch[23]$/.test(cp.id)) { CX.checkpoint.patch({ heardCount: true }); console.log('[door] replay → 存檔 heardCount = true'); }
        }
        this.openGallery('c2');
      };
      this.scene = st;
    },
    start() {
      resetStats(); CX.resetVars();
      if (CX.DEBUG.ch) { const i = CX.FLOW.findIndex(f => f.type === 'checkpoint' && f.id === 'ch' + CX.DEBUG.ch); if (i >= 0) return this.enter(i); }
      if (CX.DEBUG.stage) { const i = CX.FLOW.findIndex(f => f.type === 'stage' && f.id === CX.DEBUG.stage); if (i >= 0) return this.enter(i); }
      this.enter(0);
    },
    next() { this.enter(this.flowIdx + 1); },
    /** 從存檔點繼續（變數一起還原） */
    continueGame() {
      const cp = CX.checkpoint.load();
      const i = cp ? CX.FLOW.findIndex(f => f.type === 'checkpoint' && f.id === cp.id) : -1;
      if (i < 0) return this.start();
      resetStats(); CX.resetVars(); Object.assign(CX.vars, cp.vars || {});
      console.log('[checkpoint] load', cp.id);
      this.enter(i + 1);
    },
    restartStage() { this.startStage(CX.FLOW[this.flowIdx].id); },
    toTitle() { audio.bgm('night'); this.flowIdx = -1; this.scene = new TitleScene(); },
    openGallery(ch) { console.log('[scene] gallery'); this.flowIdx = -1; this.scene = new GalleryScene(() => this.toTitle()); if (ch && CX.MEMORIES[ch]) this.scene.ch = ch; },
    /** 圖鑑特別頁「頂樓那一晚」；playRoof＝重播那一段（不改存檔），看完回到特別頁 */
    openRoof(ch) { console.log('[scene] roof night'); this.flowIdx = -1; this.galleryCh = ch || this.galleryCh; this.scene = new RoofScene(() => this.openGallery(this.galleryCh)); },
    playRoof() {
      const filled = CX.memory.has('c4-1'); console.log('[scene] cut roof night (replay)', filled ? 'filled' : 'blank');
      audio.bgm('none'); this.flowIdx = -1;
      this.scene = new CutScene('roofNight', { list: roofSlides(filled), rain: true, onDone: () => this.openRoof() });
    },
    /** 從圖鑑重溫延伸結局〈原點〉，看完回到圖鑑 */
    playHidden() { console.log('[scene] cut hidden (replay)'); audio.bgm('snow'); this.flowIdx = -1; this.scene = new CutScene('origin', { snow: true, onDone: () => this.openGallery() }); },
  };
  CX.game = game;

  /* ---------- 主迴圈 ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;   // 限制最大 dt，切換分頁回來不會瞬移
    game.scene.update(dt);
    overlay.update(dt);
    input.endFrame();
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    game.scene.draw(ctx);
    overlay.draw(ctx);
    requestAnimationFrame(frame);
  }

  /* ---------- 啟動 ---------- */
  resize();
  CX.bindPointer(canvas);
  document.getElementById('btn-mute').addEventListener('click', () => { audio.unlock(); audio.toggleMute(); });
  document.getElementById('btn-full').addEventListener('click', () => CX.toggleFullscreen());
  requestAnimationFrame(frame);
  CX.loadImages(CX.assetList(), p => { game.scene.p = p; }).then(() => {
    if (CX.makePortraits) CX.makePortraits();      // 沈昊、胖達等程式繪製頭像
    game.toTitle();
  });
})(window.CX);
