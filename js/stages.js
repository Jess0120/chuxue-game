/* =========================================================
 * stages.js — 四個關卡
 *   Stage  ：共用基底（標題卡、血量、收集物、勝敗畫面、特效）
 *   Stage1 ：午夜港口（橫向平台跳躍＋被追逐）
 *   Stage2 ：聆聽（節奏判定）
 *   Stage3 ：看準時機（潛行＋火海逃脫）
 *   Stage4 ：2009・雨夜（自動奔跑閃避）
 *   每個關卡都有 bot() 方法，供 ?auto=1 自動遊玩測試使用。
 * ========================================================= */
(function (CX) {
  'use strict';
  const { W, H, clamp, overlap } = CX;
  const input = CX.input, audio = CX.audio;

  /* =========================================================
   * 共用基底
   * ========================================================= */
  class Stage {
    constructor(game, id) {
      this.game = game; this.id = id; this.info = CX.STAGE_INFO[id];
      this.status = 'intro';   // intro → play → win / lose
      this.t = 0; this.stateT = 0;
      this.hearts = 3; this.maxHearts = 3;
      this.frags = []; this.got = 0;
      this.shakeAmt = 0; this.flashAmt = 0; this.flashColor = '#fff';
      this.popups = [];
      this.camX = 0;
      this.loseMsg = '';
      this.weather = new CX.Weather('snow', .8);
    }
    /* ---- 特效 ---- */
    shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
    flash(a, c = '#fff') { this.flashAmt = a; this.flashColor = c; }
    popup(text, x, y, opt = {}) { this.popups.push({ text, x, y, t: 0, life: opt.life || 1.4, color: opt.color || '#fff', size: opt.size || 26, world: opt.world !== false }); }

    setStatus(s) { this.status = s; this.stateT = 0; }
    win() { if (this.status !== 'play') return; this.setStatus('win'); audio.sfx('perfect'); }
    lose(msg) {
      if (this.status !== 'play') return;
      this.loseMsg = msg; this.setStatus('lose'); audio.sfx('hit'); this.shake(10);
      CX.stats.retries++;
    }
    damage(msg) {
      this.hearts--; this.shake(8); this.flash(.5, '#ff4050'); audio.sfx('hit');
      if (this.hearts <= 0) this.lose(msg);
    }
    /** 收集物判定（世界座標的圓形） */
    collect(box) {
      this.frags.forEach((f, i) => {
        if (f.got) return;
        if (Math.abs(f.x - (box.x + box.w / 2)) < 26 && Math.abs(f.y - (box.y + box.h / 2)) < 44) this.awardFrag(i, f.x, f.y - 20);
      });
    }
    /** 拾回第 i 片記憶碎片：本章計數＋存進圖鑑＋顯示回憶文字 */
    awardFrag(i, wx, wy) {
      const f = this.frags[i];
      if (!f || f.got) return;
      f.got = true; this.got++; audio.sfx('pick');
      const id = `${this.id}-${i + 1}`;
      const isNew = CX.memory.add(id);
      CX.stats.found.add(id);
      if (wx != null) this.popup(isNew ? '記憶碎片' : '記憶碎片（已收錄）', wx, wy, { size: 18, color: '#cfe0ff' });
      const text = CX.memory.text(id) || '……';
      this.toast = { text, id, t: 0, life: Math.min(6, 3 + text.length * .06), isNew };
      console.log('[memory]', id, isNew ? 'new' : 'again', text);
    }
    /** 畫出尚未撿到的碎片；圖鑑裡已經有的會畫得比較淡 */
    drawFrags(ctx, t) {
      this.frags.forEach((f, i) => {
        if (f.got) return;
        ctx.save(); ctx.globalAlpha = CX.memory.has(`${this.id}-${i + 1}`) ? .45 : 1;
        CX.drawFragment(ctx, f.x, f.y, t); ctx.restore();
      });
    }
    /** 拾回碎片時，畫面下方短暫出現的回憶文字 */
    drawToast(ctx) {
      const m = this.toast; if (!m) return;
      const a = clamp(m.t * 4, 0, 1) * clamp((m.life - m.t) * 2, 0, 1);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = CX.font(17);
      const lines = CX.wrapText(ctx, m.text, 680).slice(0, 3);
      const bh = 40 + lines.length * 26, bw = 780, bx = (W - bw) / 2, by = this.toastTop ? 74 : H - 18 - bh;
      ctx.fillStyle = 'rgba(8,12,28,.86)'; CX.roundRect(ctx, bx, by, bw, bh, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(190,210,255,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      CX.drawFragment(ctx, bx + 30, by + bh / 2, this.t);
      const [ch, n] = m.id.split('-');
      CX.text(ctx, `記憶碎片　${CX.STAGE_INFO[ch].no}・${n}${m.isNew ? '　NEW' : ''}`, bx + 58, by + 18, 13, m.isNew ? '#ffe0a0' : '#aebce0', { align: 'left' });
      ctx.fillStyle = '#eef2ff'; ctx.textBaseline = 'top'; ctx.font = CX.font(17);
      lines.forEach((ln, k) => ctx.fillText(ln, bx + 58, by + 32 + k * 26));
      ctx.restore();
    }

    /* ---- 主迴圈 ---- */
    update(dt) {
      if (!this._fragChecked) {
        this._fragChecked = true;
        const want = (CX.MEMORIES[this.id] || []).length;
        if (want !== this.frags.length) console.warn(`[memory] 第 ${this.id} 章有 ${this.frags.length} 片碎片，但 story.js 寫了 ${want} 段文字`);
      }
      this.t += dt; this.stateT += dt;
      if (CX.DEBUG.auto) this.bot(dt);
      if (this.status === 'intro') {
        if (this.stateT > 3.2 || (this.stateT > .6 && input.confirm())) this.setStatus('play');
      } else if (this.status === 'play') {
        this.play(dt);
      } else if (this.status === 'win') {
        this.idle(dt);
        if (this.stateT > 1.8) {
          CX.stats.fragments += this.got; CX.stats.totalFragments += this.frags.length;
          this.game.next();
        }
      } else if (this.status === 'lose') {
        this.idle(dt);
        if (this.stateT > .8) {
          if (input.wasPressed('back')) this.game.toTitle();
          else if (input.confirm()) this.game.restartStage();
        }
      }
      this.shakeAmt *= Math.pow(.02, dt); this.flashAmt = Math.max(0, this.flashAmt - dt * 1.5);
      this.popups.forEach(p => p.t += dt); this.popups = this.popups.filter(p => p.t < p.life);
      if (this.toast) { this.toast.t += dt; if (this.toast.t > this.toast.life) this.toast = null; }
      this.weather.update(dt, this.wind || 0);
    }
    idle(dt) {}       // 勝敗畫面時讓背景繼續動（子類別可覆寫）
    play(dt) {}
    bot(dt) {
      // 自動遊玩：標題卡直接略過；輸了就重來
      input.bot = {};
      if (this.status === 'intro' && this.stateT > .7) input.botPressed.action = true;
      if (this.status === 'lose' && this.stateT > 1) { console.warn('[auto] 關卡失敗：' + this.loseMsg); input.botPressed.action = true; }
    }

    draw(ctx) {
      ctx.save();
      if (this.shakeAmt > .3) ctx.translate(CX.rand(-1, 1) * this.shakeAmt, CX.rand(-1, 1) * this.shakeAmt);
      this.drawWorld(ctx);
      // 浮動文字
      for (const p of this.popups) {
        const k = p.t / p.life, x = p.world ? p.x - this.camX : p.x;
        CX.text(ctx, p.text, x, p.y - k * 30, p.size, p.color, { alpha: 1 - k * k, stroke: 'rgba(0,0,0,.7)', bold: true });
      }
      ctx.restore();
      if (this.flashAmt > 0) { ctx.fillStyle = this.flashColor; ctx.globalAlpha = this.flashAmt; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      if (this.status !== 'intro') this.drawHUD(ctx);
      this.drawToast(ctx);
      if (this.status === 'intro') this.drawIntro(ctx);
      if (this.status === 'win') this.drawBanner(ctx, '— 章節完成 —', `記憶碎片 ${this.got} / ${this.frags.length}`);
      if (this.status === 'lose') this.drawLose(ctx);
    }
    drawWorld(ctx) {}
    /** 共用 HUD：章名、血量、碎片數、進度條 */
    drawHUD(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; CX.roundRect(ctx, 12, 10, 300, 56, 10); ctx.fill();
      CX.text(ctx, `${this.info.no}　${this.info.name}`, 26, 26, 16, '#dfe4f5', { align: 'left' });
      if (this.maxHearts) {
        for (let i = 0; i < this.maxHearts; i++) CX.text(ctx, '♥', 32 + i * 22, 50, 20, i < this.hearts ? '#ff6b7d' : 'rgba(255,255,255,.2)');
      }
      if (this.frags.length) { CX.drawFragment(ctx, 120, 50, 0); CX.text(ctx, `× ${this.got}`, 136, 50, 16, '#dfe8ff', { align: 'left' }); }
      const p = this.progress ? this.progress() : null;
      if (p != null) {
        ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(190, 46, 108, 6);
        ctx.fillStyle = '#bcd0ff'; ctx.fillRect(190, 46, 108 * clamp(p, 0, 1), 6);
      }
      ctx.restore();
    }
    drawIntro(ctx) {
      const a = clamp(this.stateT * 2, 0, 1) * clamp((3.2 - this.stateT) * 2, 0, 1);
      ctx.fillStyle = `rgba(4,4,10,${.75 * a + .1})`; ctx.fillRect(0, 0, W, H);
      CX.text(ctx, this.info.no, W / 2, 170, 24, '#aab4d0', { alpha: a });
      CX.text(ctx, this.info.name, W / 2, 225, 56, '#f2f4ff', { alpha: a, bold: true, shadow: '#7f9cff' });
      CX.text(ctx, this.info.goal, W / 2, 310, 20, '#dde2f2', { alpha: a });
      CX.text(ctx, CX.touchWanted ? this.info.touch : this.info.keys, W / 2, 360, 18, '#9fb0d8', { alpha: a });
      if (this.info.hint) CX.text(ctx, this.info.hint, W / 2, 392, 16, '#cfe0ff', { alpha: a });
      CX.text(ctx, '（按任意鍵開始）', W / 2, 425, 15, '#7884a6', { alpha: a * (.5 + .5 * Math.sin(this.t * 4)) });
    }
    drawBanner(ctx, title, sub) {
      const a = clamp(this.stateT * 3, 0, 1);
      ctx.fillStyle = `rgba(0,0,0,${.45 * a})`; ctx.fillRect(0, H / 2 - 60, W, 120);
      CX.text(ctx, title, W / 2, H / 2 - 14, 34, '#fff', { alpha: a, shadow: '#9fb8ff' });
      CX.text(ctx, sub, W / 2, H / 2 + 28, 18, '#cdd8f5', { alpha: a });
    }
    drawLose(ctx) {
      const a = clamp(this.stateT * 2, 0, 1);
      ctx.fillStyle = `rgba(10,0,4,${.7 * a})`; ctx.fillRect(0, 0, W, H);
      CX.text(ctx, this.loseMsg, W / 2, H / 2 - 40, 30, '#ffd6dc', { alpha: a });
      CX.text(ctx, '這只是夢……再試一次吧。', W / 2, H / 2 + 6, 18, '#c9b6c0', { alpha: a });
      CX.text(ctx, CX.touchWanted ? '點擊畫面 重新挑戰' : 'Enter / 空白鍵 重新挑戰　　Esc 回到標題', W / 2, H / 2 + 60, 16, '#e8e8f0', { alpha: a * (.6 + .4 * Math.sin(this.t * 4)) });
    }
  }

  /* ---------- 平台物理（第一、三章共用） ---------- */
  const GRAV = 1800, JUMP_V = 680, RUN = 260;
  function makeBody(x, y) { return { x, y, w: 22, h: 84, vx: 0, vy: 0, onGround: false, coyote: 0, buffer: 0, facing: 1 }; }
  /** 讀取左右與跳躍輸入，處理「土狼時間」與「預輸入」讓手感更寬容 */
  function controlBody(b, dt, speed = RUN) {
    const dir = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    b.vx = CX.lerp(b.vx, dir * speed, clamp(dt * 14, 0, 1));
    if (dir) b.facing = dir;
    b.coyote = b.onGround ? .1 : b.coyote - dt;
    b.buffer = input.wasPressed('jump') ? .12 : b.buffer - dt;
    if (b.buffer > 0 && b.coyote > 0) { b.vy = -JUMP_V; b.buffer = 0; b.coyote = 0; audio.sfx('jump'); }
    if (!input.isDown('jump') && b.vy < -250) b.vy = -250;    // 短按跳得低
    b.vy = Math.min(b.vy + GRAV * dt, 1200);
  }
  /** 先移動 X 再移動 Y，分軸處理與實心方塊的碰撞 */
  function moveBody(b, solids, dt) {
    b.x += b.vx * dt;
    for (const s of solids) if (overlap(b, s)) { if (b.vx > 0) b.x = s.x - b.w; else if (b.vx < 0) b.x = s.x + s.w; b.vx = 0; }
    b.y += b.vy * dt; b.onGround = false;
    for (const s of solids) if (overlap(b, s)) {
      if (b.vy > 0) { b.y = s.y - b.h; b.onGround = true; } else b.y = s.y + s.h;
      b.vy = 0;
    }
  }
  /** 貨櫃顏色 */
  const CONTAINER = ['#5b2a26', '#2b3f5c', '#3d4a3a', '#6a4a2a', '#3b2d4d', '#2c4d4d'];
  function drawContainer(ctx, x, y, w, h, color) {
    ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    for (let i = x + 8; i < x + w - 4; i += 12) ctx.fillRect(i, y + 4, 3, h - 8);   // 波浪鐵皮紋路
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = 'rgba(170,190,255,.12)'; ctx.fillRect(x, y, w, 3);                // 月光邊緣
  }
  /** 夜空、月亮、城市剪影（視差捲動） */
  function drawNightSky(ctx, camX, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#060a18'); g.addColorStop(.6, '#101a33'); g.addColorStop(1, '#1a2440');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 月亮
    ctx.save(); ctx.shadowColor = '#dfe8ff'; ctx.shadowBlur = 50;
    ctx.fillStyle = '#eef2ff'; ctx.beginPath(); ctx.arc(760 - camX * .03, 95, 38, 0, 6.283); ctx.fill(); ctx.restore();
    // 遠景城市
    ctx.fillStyle = '#0b1224';
    for (let i = 0; i < 40; i++) {
      const bx = ((i * 97 - camX * .15) % 1400 + 1400) % 1400 - 200, bh = 60 + (i * 53 % 110);
      ctx.fillRect(bx, 400 - bh, 60, bh + 100);
      ctx.fillStyle = 'rgba(255,214,140,.35)';
      if (i % 3 === 0) ctx.fillRect(bx + 12, 410 - bh + 14, 4, 5);
      ctx.fillStyle = '#0b1224';
    }
    // 起重機剪影
    ctx.strokeStyle = '#0d1428'; ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 700 - camX * .3) % 2800 + 2800) % 2800 - 300;
      ctx.beginPath(); ctx.moveTo(cx, 430); ctx.lineTo(cx, 150); ctx.lineTo(cx + 160, 150); ctx.moveTo(cx - 50, 150); ctx.lineTo(cx, 150); ctx.stroke();
    }
  }
  function drawSea(ctx, camX, t, top = 500) {
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, '#16233f'); g.addColorStop(1, '#070b16');
    ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
    ctx.strokeStyle = 'rgba(180,200,255,.18)'; ctx.lineWidth = 1.5;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, top + 8 + r * 10 + Math.sin(x * .03 + t * 2 + r + camX * .02) * 2);
      ctx.stroke();
    }
  }

  /* =========================================================
   * 第一章　午夜港口：往貨櫃最上層奔跑
   * ========================================================= */
  class Stage1 extends Stage {
    constructor(game) {
      super(game, 1);
      // 每根「貨櫃柱」：x、寬、頂端高度（往下一直延伸到海面）
      const cols = [[0, 520, 460], [520, 120, 400], [640, 170, 340], [920, 140, 340], [1060, 170, 280],
                    [1340, 180, 300], [1600, 150, 250], [1750, 140, 190], [2000, 240, 190], [2240, 180, 130], [2510, 450, 130]];
      this.solids = cols.map(([x, w, top], i) => ({ x, y: top, w, h: H + 40 - top, color: CONTAINER[i % CONTAINER.length], dock: i === 0 }));
      this.endX = 2960; this.goalX = 2860;
      this.p = makeBody(160, 460 - 84);
      this.hood = { x: -160, y: 460 };
      // 記憶碎片位置。懸在海面上的幾片，高度對準「在邊緣全力起跳」的拋物線，玩家照正常跳法就拿得到
      [[330, 420], [865, 200], [1150, 230], [1300, 130], [1945, 50], [2465, 16], [2700, 90]].forEach(([x, y]) => this.frags.push({ x, y }));
      this.events = [7, 17];      // 背景槍聲的時間點（不會造成傷害，只是氣氛）
    }
    progress() { return this.p.x / this.goalX; }
    play(dt) {
      const p = this.p;
      controlBody(p, dt);
      moveBody(p, this.solids, dt);
      if (p.x < 0) p.x = 0;
      if (p.x > this.endX - p.w) p.x = this.endX - p.w;
      this.collect(p);
      // 斗篷男：等速追趕；距離太遠時加速（橡皮筋），保持壓迫感
      const gap = p.x - this.hood.x;
      const sp = this.stateT < 1.5 ? 0 : gap > 420 ? 320 : 175;
      this.hood.x += sp * dt;
      this.hood.y = CX.lerp(this.hood.y, p.y + p.h, dt * 3);
      if (this.stateT > 1.5 && this.stateT % 1.1 < dt) audio.sfx('step', .3);
      if (gap < 14) this.lose('被黑影追上了……');
      if (p.y > H + 40) { audio.sfx('splash'); this.lose('掉進了冰冷的海裡……'); }
      // 氣氛事件：遠方槍響
      if (this.events.length && this.stateT > this.events[0]) {
        this.events.shift(); audio.sfx('shot', .6); this.shake(6); this.flash(.25);
        this.popup('咻——碰——', W / 2, 140, { world: false, color: '#ffae5a', size: 34, life: 1.6 });
      }
      if (p.x >= this.goalX && p.onGround) this.win();
      this.camX = clamp(p.x - W * .4, 0, this.endX - W);
    }
    bot(dt) {
      super.bot(dt);
      if (this.status !== 'play') return;
      const p = this.p; input.bot.right = true;
      const front = p.x + p.w, feet = p.y + p.h;
      const colAt = x => this.solids.find(s => x >= s.x && x < s.x + s.w);
      // 前方有高一階的貨櫃：提早起跳；前方是海：踩到邊緣才跳
      const wall = colAt(front + 20), edge = colAt(front + 4), under = colAt(p.x + p.w / 2);
      const needJump = !edge || (wall && wall.y < feet - 4);
      if (p.onGround && needJump && under) { input.botPressed.jump = true; this.botHold = .35; }
      this.botHold = (this.botHold || 0) - dt;
      input.bot.jump = this.botHold > 0;     // 長按跳到最高
    }
    drawWorld(ctx) {
      const cx = this.camX, t = this.t;
      drawNightSky(ctx, cx, t);
      drawSea(ctx, cx, t, 500);
      ctx.save(); ctx.translate(-cx, 0);
      for (const s of this.solids) {
        if (s.x + s.w < cx - 10 || s.x > cx + W + 10) continue;
        if (s.dock) {
          ctx.fillStyle = '#2a2a33'; ctx.fillRect(s.x, s.y, s.w, s.h);
          ctx.fillStyle = '#3a3a46'; ctx.fillRect(s.x, s.y, s.w, 6);
          for (let x = s.x + 40; x < s.x + s.w; x += 120) { ctx.fillStyle = '#1c1c22'; ctx.fillRect(x, s.y - 14, 10, 14); }  // 繫船柱
        } else {
          for (let y = s.y; y < 500; y += 60) drawContainer(ctx, s.x, y, s.w, Math.min(60, 500 - y), s.color);
        }
      }
      // 終點：月光下的貨櫃頂端
      ctx.fillStyle = 'rgba(200,215,255,.12)'; ctx.fillRect(this.goalX - 10, 0, 100, 130);
      CX.text(ctx, '↓ 最上層', this.goalX + 40, 100 + Math.sin(t * 3) * 4, 16, '#dfe6ff');
      this.drawFrags(ctx, t);
      // 斗篷男與雨真
      CX.drawHood(ctx, this.hood.x, this.hood.y, { t, smoke: true, alpha: .95 });
      const p = this.p;
      CX.drawYuzhen(ctx, p.x + p.w / 2, p.y + p.h, { facing: p.facing, t, run: Math.abs(p.vx) > 20, air: !p.onGround });
      ctx.restore();
      this.weather.draw(ctx, .7);
      CX.vignette(ctx, .55);
      // 黑影逼近的畫面左側暗紅提示
      const gap = this.p.x - this.hood.x;
      if (gap < 260 && this.status === 'play') {
        const g = ctx.createLinearGradient(0, 0, 160, 0);
        g.addColorStop(0, `rgba(120,0,20,${.5 * (1 - gap / 260)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 160, H);
      }
    }
  }

  /* =========================================================
   * 第二章　聆聽：節奏判定
   *   波紋從外往內收縮，與中心圓環重疊的瞬間就是腳步聲落下的時刻
   * ========================================================= */
  class Stage2 extends Stage {
    constructor(game) {
      super(game, 2);
      this.maxHearts = 3;
      this.TRAVEL = 1.5;          // 波紋從外圈收縮到圓環所需秒數
      this.R0 = 330; this.RT = 70; // 起始半徑、目標半徑
      const rnd = CX.seeded(2009);
      // 腳步聲時間表：越來越近、節奏略有變化
      this.beats = []; let tt = 1.8;
      for (let i = 0; i < 10; i++) { this.beats.push({ time: tt, hit: false, missed: false, vol: .25 + i * .07 }); tt += .95 + rnd() * .6 - i * .02; }
      // 最後的「3、2、1」倒數，第四拍才是出手時機
      this.finalStart = tt + .6;
      for (let i = 0; i < 4; i++) this.beats.push({ time: this.finalStart + i * .8, hit: false, missed: false, vol: 1, final: i });
      this.clock = 0; this.combo = 0; this.hits = 0;
      // 記憶碎片：節奏關沒有雪花可撿，改成連續不失誤的獎勵
      this.COMBO_FRAGS = [3, 6, 10];
      this.toastTop = true;       // 下方是判定文字，回憶文字改顯示在上方
      this.COMBO_FRAGS.forEach(n => this.frags.push({ combo: n }));
      this.pulse = 0;
      this.weather = new CX.Weather('snow', .5);
    }
    progress() { return this.hits / this.beats.length; }
    play(dt) {
      this.clock += dt; this.pulse = Math.max(0, this.pulse - dt * 2.5);
      // 腳步聲在命中時刻播放（即使玩家沒按，也聽得到）
      for (const b of this.beats) {
        if (!b.sounded && this.clock >= b.time) {
          b.sounded = true; audio.sfx('step', b.vol); this.pulse = 1;
          if (b.final != null && b.final < 3) this.popup(String(3 - b.final), W / 2, 300, { world: false, size: 64, life: .75 });
        }
        if (!b.hit && !b.missed && !(b.final < 3) && this.clock > b.time + .24) {
          b.missed = true; this.combo = 0;
          this.popup('錯過了', W / 2, 460, { world: false, color: '#ff98a6', size: 22 });
          this.damage('腳步聲……已經到了身後。');
          if (b.final === 3 && this.status === 'play') this.retryFinal();
        }
      }
      // 玩家按下：找最近的一拍判定
      if (input.wasPressed('action') || input.wasPressed('jump') || input.tapped) {
        const next = this.beats.find(b => !b.hit && !b.missed);
        if (next) {
          const d = Math.abs(this.clock - next.time);
          if (next.final != null && next.final < 3) {
            // 倒數 3、2、1 只要聽，不要按（按了只提示，不扣血）
            if (d < .45) this.popup('還不是時候…', W / 2, 460, { world: false, color: '#ffd59a', size: 20 });
          } else if (d < .12) { this.judge(next, '完美', '#bfe3ff', 'perfect'); }
          else if (d < .24) { this.judge(next, '不錯', '#e0e8ff', 'good'); }
          else if (d < .45) {
            next.missed = true; this.combo = 0;
            this.popup(this.clock < next.time ? '太早了' : '太晚了', W / 2, 460, { world: false, color: '#ff98a6', size: 22 });
            this.damage('心跳太亂，聽不清腳步聲了……');
            if (next.final === 3 && this.status === 'play') this.retryFinal();
          }
        }
      }
      // 倒數的前三拍自動算通過
      for (const b of this.beats) if (b.final != null && b.final < 3 && !b.hit && this.clock > b.time + .25) { b.hit = true; this.hits++; }
      // 過關條件：最後一拍抓到，且前面每一拍都已判定（抓到或錯過都算，錯過只扣血）
      const last = this.beats.find(b => b.final === 3);
      if (last.hit && this.beats.every(b => b.hit || b.missed) && this.status === 'play') {
        this.popup('就是現在。', W / 2, 220, { world: false, size: 44, life: 1.8, color: '#ffffff' });
        this.win();
      }
    }
    judge(b, label, color, snd) {
      b.hit = true; this.hits++; this.combo++; audio.sfx(snd, .6);
      this.popup(label + (this.combo > 2 ? `　×${this.combo}` : ''), W / 2, 460, { world: false, color, size: 24 });
      const fi = this.COMBO_FRAGS.indexOf(this.combo);
      if (fi >= 0 && !this.frags[fi].got) {
        this.awardFrag(fi);
        this.popup(`連續 ${this.combo} 拍！記憶碎片`, W / 2, 400, { world: false, color: '#cfe0ff', size: 20, life: 1.8 });
      }
    }
    /** 最後一拍沒抓到：重新倒數一次（扣了血但不必整關重來） */
    retryFinal() {
      const base = this.clock + 1.2;
      this.beats.filter(b => b.final != null).forEach((b, i) => { b.time = base + i * .8; b.hit = false; b.missed = false; b.sounded = false; });
      this.hits = this.beats.filter(b => b.hit).length;
    }
    bot(dt) {
      super.bot(dt);
      if (this.status !== 'play') return;
      const next = this.beats.find(b => !b.hit && !b.missed);
      if (next && next.final !== 0 && next.final !== 1 && next.final !== 2 && Math.abs(this.clock + dt - next.time) < .03) input.botPressed.action = true;
    }
    drawWorld(ctx) {
      const t = this.t;
      ctx.fillStyle = '#04050b'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = .28 + this.pulse * .1;
      CX.drawCover(ctx, CX.images.p13, 0, 0, W, H, 1.05);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(5,6,14,.55)'; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = 300;
      // 中心圓環（隨心跳微微脈動）
      ctx.save();
      ctx.strokeStyle = `rgba(220,230,255,${.6 + this.pulse * .4})`; ctx.lineWidth = 4;
      ctx.shadowColor = '#9fb8ff'; ctx.shadowBlur = 20 * this.pulse + 6;
      ctx.beginPath(); ctx.arc(cx, cy, this.RT + this.pulse * 6, 0, 6.283); ctx.stroke();
      ctx.restore();
      // 圓環中的閉眼雨真
      CX.drawYuzhen(ctx, cx, cy + 52, { t, eyesClosed: true, scale: 1.45 });
      // 收縮中的波紋
      if (this.status === 'play' || this.status === 'win') {
        for (const b of this.beats) {
          if (b.hit || b.missed || b.final === 0 || b.final === 1 || b.final === 2) continue;
          const k = (b.time - this.clock) / this.TRAVEL;     // 1 → 0 代表從外圈到圓環
          if (k > 1 || k < -.2) continue;
          const r = this.RT + (this.R0 - this.RT) * k;
          ctx.strokeStyle = b.final === 3 ? `rgba(255,190,120,${1 - Math.abs(k) * .6})` : `rgba(200,215,255,${1 - Math.abs(k) * .7})`;
          ctx.lineWidth = b.final === 3 ? 6 : 3;
          ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, r), 0, 6.283); ctx.stroke();
        }
      }
      CX.text(ctx, '閉上眼睛，仔細聆聽……', W / 2, 110, 22, 'rgba(225,230,250,.8)');
      if (this.clock > this.finalStart - .8 && this.status === 'play') CX.text(ctx, '倒數三聲後——就是現在', W / 2, 150, 18, '#ffcf9a');
      this.weather.draw(ctx, .5);
      CX.vignette(ctx, .8);
    }
  }

  /* =========================================================
   * 第三章　看準時機：潛行 → 爆炸 → 逃離火海
   * ========================================================= */
  class Stage3 extends Stage {
    constructor(game) {
      super(game, 3);
      this.ground = 470;
      this.endX = 3150; this.exitX = 3020; this.triggerX = 1900;
      this.p = makeBody(300, this.ground - 84);
      this.covers = [[520, 110], [860, 120], [1200, 110], [1560, 120]].map(([x, w]) => ({ x, w }));
      // 第二階段的箱子（要跳過）
      this.crates = [2200, 2440, 2700].map((x, i) => ({ x, y: this.ground - (i === 1 ? 56 : 42), w: 44, h: i === 1 ? 56 : 42 }));
      this.solids = [{ x: -200, y: this.ground, w: this.endX + 400, h: 100 }, ...this.crates];
      [[565, 430], [915, 430], [1255, 430], [1620, 430], [2222, 315], [2462, 310], [2850, 400]].forEach(([x, y]) => this.frags.push({ x, y }));
      this.rnd = CX.seeded(77);
      this.gaze = 'dong'; this.gazeT = 0; this.gazeDur = 2.4;
      this.phase = 1; this.fireX = -999; this.boomT = -1;
      this.sweep = 0;
    }
    progress() { return this.p.x / this.exitX; }
    inCover() { const c = this.p.x + this.p.w / 2; return this.covers.some(s => c > s.x + 6 && c < s.x + s.w - 6); }
    play(dt) {
      const p = this.p;
      controlBody(p, dt, this.phase === 1 ? 175 : RUN);   // 潛行時放慢腳步
      moveBody(p, this.solids, dt);
      p.x = clamp(p.x, 230, this.endX - p.w);
      this.collect(p);
      if (this.phase === 1) this.updateGaze(dt);
      else this.updateFire(dt);
      this.camX = clamp(p.x - W * .4, 0, this.endX - W);
    }
    /** 斗篷男的視線循環：盯著東宇 → 警告「！」→ 紅光掃視 */
    updateGaze(dt) {
      this.gazeT += dt;
      if (this.gazeT > this.gazeDur) {
        this.gazeT = 0;
        if (this.gaze === 'dong') { this.gaze = 'warn'; this.gazeDur = .85; audio.sfx('warn'); }
        else if (this.gaze === 'warn') { this.gaze = 'watch'; this.gazeDur = 1.7; }
        else { this.gaze = 'dong'; this.gazeDur = 2 + this.rnd() * 1.4; }
      }
      if (this.gaze === 'watch') {
        this.sweep = this.gazeT / this.gazeDur;
        const moving = Math.abs(this.p.vx) > 25 || !this.p.onGround;
        if (moving && !this.inCover() && !this.spotCD) {
          this.spotCD = true; this.damage('被斗篷男發現了……');
          this.popup('被發現了！', this.p.x, this.p.y - 20, { color: '#ff8090' });
          this.popup('東宇：「看著我！」', 200, 140, { color: '#ffd9a8', size: 20, world: false });
          this.gaze = 'dong'; this.gazeT = 0; this.gazeDur = 2.2;   // 東宇挺身吸引注意
        }
      } else this.spotCD = false;
      if (this.gaze === 'dong' && this.gazeT < dt && this.rnd() < .5) this.popup('東宇：' + ['我說過了，她是我的人。', '你的對手是我。', '別看她，看著我。'][this.rnd() * 3 | 0], 200, 140, { color: '#ffd9a8', size: 18, life: 2, world: false });
      // 抵達觸發點：東宇的暗號，然後爆炸
      if (this.p.x > this.triggerX) {
        this.phase = 2; this.boomT = 0; this.gaze = 'dong';
        this.popup('東宇：「你想要報仇，來吧，時機到了。」', W / 2, 140, { color: '#ffd9a8', size: 22, life: 2.2, world: false });
      }
    }
    updateFire(dt) {
      this.boomT += dt;
      if (this.boomT > 1 && this.fireX < -900) {
        audio.sfx('boom'); this.shake(16); this.flash(.8, '#ffb070');
        this.fireX = this.p.x - 520; this.weather.set('embers', 1.2);
        this.popup('轟——！', W / 2, 160, { world: false, color: '#ffb35a', size: 56, life: 1.6 });
        this.popup('快跑！', W / 2, 220, { world: false, color: '#fff', size: 28, life: 1.6 });
      }
      if (this.fireX > -900) {
        this.fireX += (this.p.x - this.fireX > 600 ? 320 : 205) * dt;
        if (this.fireX > this.p.x - 6) this.lose('來不及逃出火海……');
      }
      if (this.p.x >= this.exitX) this.win();
    }
    bot(dt) {
      super.bot(dt);
      if (this.status !== 'play') return;
      const p = this.p;
      if (this.phase === 1) {
        // 只在斗篷男看著東宇時前進；在陰影裡也可以前進
        input.bot.right = this.gaze === 'dong' && !(this.gazeT > this.gazeDur - .15 && !this.inCover());
        if (this.gaze !== 'dong' && this.inCover()) input.bot.right = true;
      } else {
        input.bot.right = true;
        const c = this.crates.find(c => c.x - (p.x + p.w) > 0 && c.x - (p.x + p.w) < 60);
        if (c && p.onGround) { input.botPressed.jump = true; this.botHold = .35; }
        this.botHold = (this.botHold || 0) - dt;
        input.bot.jump = this.botHold > 0;
      }
    }
    drawWorld(ctx) {
      const cx = this.camX, t = this.t, G = this.ground;
      drawNightSky(ctx, cx + 3000, t);
      // 背景貨櫃牆
      ctx.save(); ctx.translate(-cx * .6, 0);
      for (let x = -100; x < this.endX; x += 150) drawContainer(ctx, x, G - 150, 146, 70, CONTAINER[Math.abs(Math.round(x / 150)) % CONTAINER.length]);
      ctx.restore();
      ctx.save(); ctx.translate(-cx, 0);
      // 地面
      ctx.fillStyle = '#20202a'; ctx.fillRect(cx - 10, G, W + 20, H - G);
      ctx.fillStyle = '#2f2f3a'; ctx.fillRect(cx - 10, G, W + 20, 5);
      // 陰影掩護區（前景貨櫃投下的影子）
      for (const c of this.covers) {
        drawContainer(ctx, c.x - 10, G - 140, c.w + 20, 40, '#1c2433');
        ctx.fillStyle = 'rgba(0,0,8,.72)'; ctx.fillRect(c.x, G - 100, c.w, 100);
        ctx.fillStyle = '#121722'; ctx.fillRect(c.x - 10, G - 100, 8, 100); ctx.fillRect(c.x + c.w + 2, G - 100, 8, 100);
        CX.text(ctx, '陰影', c.x + c.w / 2, G + 22, 13, 'rgba(180,190,220,.5)');
      }
      // 第二階段箱子與出口
      for (const c of this.crates) { ctx.fillStyle = '#5a4026'; ctx.fillRect(c.x, c.y, c.w, c.h); ctx.strokeStyle = '#2a1c10'; ctx.lineWidth = 3; ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4); ctx.beginPath(); ctx.moveTo(c.x + 2, c.y + 2); ctx.lineTo(c.x + c.w - 2, c.y + c.h - 2); ctx.stroke(); }
      ctx.fillStyle = '#0c0f18'; ctx.fillRect(this.exitX, G - 160, 120, 160);
      ctx.fillStyle = 'rgba(255,230,170,.25)'; ctx.fillRect(this.exitX + 20, G - 130, 80, 130);
      CX.text(ctx, '出口', this.exitX + 60, G - 175, 18, '#ffe9c0');
      this.drawFrags(ctx, t);
      // 東宇與斗篷男（爆炸後消失在火光中）
      if (this.fireX < -900) {
        const watching = this.gaze !== 'dong';
        CX.drawHood(ctx, 110, G, { t, aim: true, facing: 1, eyeColor: watching ? '#ff5060' : 'rgba(200,210,230,.8)' });
        CX.drawDongyu(ctx, 190, G, { t, facing: -1, guard: true });
        if (this.gaze === 'warn') CX.text(ctx, '！', 115, G - 110 + Math.sin(t * 20) * 3, 40, '#ff5a6a', { bold: true, stroke: '#000' });
        if (this.gaze === 'watch') {
          // 紅色雷射瞄準光：從槍口掃向右方
          const sx = 145, sy = G - 64;
          const tx = cx + W * (.15 + this.sweep * .85), ty = G - 30;
          ctx.save(); ctx.strokeStyle = 'rgba(255,40,60,.75)'; ctx.lineWidth = 2; ctx.shadowColor = '#ff2040'; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.fillStyle = 'rgba(255,40,60,.12)'; ctx.fillRect(cx, G - 120, W, 120);
          ctx.restore();
        }
      }
      // 雨真
      const p = this.p;
      CX.drawYuzhen(ctx, p.x + p.w / 2, p.y + p.h, { facing: p.facing, t, run: Math.abs(p.vx) > 20, air: !p.onGround, alpha: this.inCover() ? .6 : 1 });
      // 火牆
      if (this.fireX > -900) {
        const fx = this.fireX;
        const g = ctx.createLinearGradient(fx - 400, 0, fx + 60, 0);
        g.addColorStop(0, 'rgba(255,90,20,.95)'); g.addColorStop(.8, 'rgba(255,150,40,.85)'); g.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(fx - 1200, H); ctx.lineTo(fx - 1200, 0);
        for (let y = 0; y <= H; y += 20) ctx.lineTo(fx + Math.sin(y * .05 + t * 10) * 20 + Math.sin(y * .13 - t * 7) * 14, y);
        ctx.lineTo(fx - 1200, H); ctx.fill();
      }
      ctx.restore();
      if (this.fireX > -900) { ctx.fillStyle = 'rgba(255,120,40,.08)'; ctx.fillRect(0, 0, W, H); }
      this.weather.draw(ctx, .8);
      CX.vignette(ctx, .6);
      if (this.phase === 1 && this.status === 'play') {
        const label = { dong: ['斗篷男正盯著東宇 — 快走！', '#bfe8c8'], warn: ['！他要轉過來了', '#ffcf80'], watch: ['紅光掃視中 — 停下或躲進陰影', '#ff8a98'] }[this.gaze];
        CX.text(ctx, label[0], W / 2, 92, 20, label[1], { stroke: 'rgba(0,0,0,.6)' });
      }
    }
  }

  /* =========================================================
   * 第四章　2009・雨夜：自動奔跑，跳過障礙趕往學校
   * ========================================================= */
  class Stage4 extends Stage {
    constructor(game) {
      super(game, 4);
      this.ground = 470; this.speed = 330; this.dist = 0; this.length = 9200;
      this.p = { x: 200, y: this.ground - 84, w: 22, h: 84, vy: 0, onGround: true };
      this.inv = 0; this.slow = 0;
      this.weather = new CX.Weather('rain', 1);
      // 用固定種子產生障礙物，確保每次關卡都一樣
      const rnd = CX.seeded(2009); this.obs = [];
      let x = 900;
      while (x < this.length - 500) {
        const k = rnd();
        const o = k < .4 ? { type: 'puddle', w: 70, h: 6 } : k < .7 ? { type: 'fence', w: 26, h: 38 } : { type: 'bin', w: 32, h: 46 };
        o.x = x; o.y = this.ground - o.h; this.obs.push(o);
        if (rnd() < .35) this.frags.push({ x: x + o.w / 2, y: this.ground - 150 });
        x += 420 + rnd() * 380;
      }
      this.flashT = 4;
    }
    progress() { return this.dist / this.length; }
    play(dt) {
      const p = this.p;
      const sp = this.speed * (this.slow > 0 ? .55 : 1);
      this.slow -= dt; this.inv -= dt;
      this.dist += sp * dt; this.camX = this.dist;
      // 跳躍（長按跳更高）
      if ((input.wasPressed('jump') || input.wasPressed('action') || input.tapped) && p.onGround) { p.vy = -640; p.onGround = false; audio.sfx('jump'); }
      const holding = input.isDown('jump') || input.isDown('action');
      p.vy += (p.vy < 0 && holding ? 1500 : 2600) * dt;
      p.y += p.vy * dt;
      if (p.y >= this.ground - p.h) { p.y = this.ground - p.h; p.vy = 0; p.onGround = true; }
      // 障礙物判定（世界座標 = 畫面座標 + dist）
      const box = { x: p.x + this.dist + 2, y: p.y, w: p.w - 4, h: p.h };
      for (const o of this.obs) {
        if (o.hitDone || !overlap(box, o)) continue;
        o.hitDone = true;
        if (this.inv > 0) continue;
        this.inv = 1.2; this.slow = .8;
        if (o.type === 'puddle') audio.sfx('splash', .6);
        this.popup(o.type === 'puddle' ? '踩到水窪！' : '撞到了！', box.x, p.y - 10, { color: '#ffb0bc' });
        this.damage('跌倒在雨中……來不及了。');
      }
      this.collect(box);
      // 閃電（只是氣氛）
      this.flashT -= dt;
      if (this.flashT < 0) { this.flashT = 5 + Math.random() * 4; this.flash(.35, '#dfe6ff'); }
      if (this.dist >= this.length) this.win();
    }
    bot(dt) {
      super.bot(dt);
      if (this.status !== 'play') return;
      const p = this.p, front = p.x + this.dist + p.w;
      const o = this.obs.find(o => o.x + o.w > front - p.w);
      if (o && p.onGround && o.x - front < 34 + (o.type === 'puddle' ? 10 : 0)) { input.botPressed.jump = true; this.botHold = .2; }
      this.botHold = (this.botHold || 0) - dt;
      input.bot.jump = this.botHold > 0;
    }
    drawWorld(ctx) {
      const d = this.dist, t = this.t, G = this.ground;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1b1e24'); g.addColorStop(1, '#3a3e46');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 遠景舊公寓與路燈
      for (let i = 0; i < 12; i++) {
        const bx = ((i * 160 - d * .25) % 1920 + 1920) % 1920 - 160, bh = 140 + (i * 71 % 120);
        ctx.fillStyle = '#23262d'; ctx.fillRect(bx, G - bh - 40, 140, bh + 40);
        ctx.fillStyle = 'rgba(255,220,150,.18)';
        for (let wy = G - bh - 20; wy < G - 60; wy += 34) for (let wx = bx + 14; wx < bx + 130; wx += 32) if ((wx * 7 + wy) % 5 < 2) ctx.fillRect(wx, wy, 12, 14);
      }
      for (let i = 0; i < 6; i++) {
        const lx = ((i * 260 - d * .9) % 1560 + 1560) % 1560 - 100;
        ctx.fillStyle = '#16181c'; ctx.fillRect(lx, G - 190, 5, 190);
        const lg = ctx.createRadialGradient(lx + 3, G - 188, 2, lx + 3, G - 188, 170);
        lg.addColorStop(0, 'rgba(255,225,160,.4)'); lg.addColorStop(1, 'rgba(255,225,160,0)');
        ctx.fillStyle = lg; ctx.fillRect(lx - 170, G - 360, 346, 360);
        ctx.fillStyle = '#16181c'; ctx.fillRect(lx - 10, G - 192, 18, 5);
      }
      // 地面（濕亮的柏油路）
      ctx.fillStyle = '#2a2d33'; ctx.fillRect(0, G, W, H - G);
      ctx.fillStyle = 'rgba(200,210,230,.08)'; ctx.fillRect(0, G, W, 3);
      for (let x = -((d) % 80); x < W; x += 80) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, G + 34, 40, 3); }
      // 終點：學校
      const sx = this.length - d + 260;
      if (sx < W + 300) {
        ctx.fillStyle = '#1b1d22'; ctx.fillRect(sx, G - 280, 360, 280);
        ctx.fillStyle = 'rgba(255,230,180,.25)'; for (let i = 0; i < 4; i++) ctx.fillRect(sx + 30 + i * 80, G - 250, 40, 30);
        CX.text(ctx, '學校', sx + 180, G - 300, 20, '#e8e8ee');
      }
      ctx.save(); ctx.translate(-d, 0);
      for (const o of this.obs) {
        if (o.x - d > W + 50 || o.x + o.w - d < -50) continue;
        if (o.type === 'puddle') { ctx.fillStyle = 'rgba(140,160,200,.45)'; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, G - 1, o.w / 2, 6, 0, 0, 6.283); ctx.fill(); }
        else if (o.type === 'fence') { ctx.fillStyle = '#8a6a3c'; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.fillStyle = '#c33'; ctx.fillRect(o.x, o.y + 6, o.w, 6); ctx.fillStyle = '#eee'; ctx.fillRect(o.x, o.y + 18, o.w, 6); }
        else { ctx.fillStyle = '#3e5a3a'; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.fillStyle = '#2c4029'; ctx.fillRect(o.x - 3, o.y, o.w + 6, 7); }
      }
      this.drawFrags(ctx, t);
      ctx.restore();
      // 遠方東宇的背影（越跑越遠，代表她趕不上）
      const dongX = 620 + Math.min(260, this.dist * .03);
      if (dongX < W + 30) CX.drawDongyu(ctx, dongX, G, { t, run: true, outfit: 'hoodie', alpha: .55 });
      const p = this.p;
      const blink = this.inv > 0 && Math.floor(t * 16) % 2;
      if (!blink) CX.drawYuzhen(ctx, p.x + p.w / 2, p.y + p.h, { t, run: true, air: !p.onGround, outfit: 'school' });
      this.weather.draw(ctx, 1);
      ctx.fillStyle = 'rgba(60,70,90,.12)'; ctx.fillRect(0, 0, W, H);   // 2009 回憶的灰階濾鏡感
      CX.vignette(ctx, .6);
      CX.text(ctx, `距離學校 ${Math.max(0, Math.ceil((this.length - this.dist) / 10))} m`, W - 110, 82, 16, '#dfe2ea', { stroke: 'rgba(0,0,0,.5)' });
    }
  }

  CX.STAGES = { 1: Stage1, 2: Stage2, 3: Stage3, 4: Stage4 };
})(window.CX);
