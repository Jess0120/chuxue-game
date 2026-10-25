/* =========================================================
 * stage-door.js — 第 2 章節奏關「門後」
 *   ⚠ 第 1～4 章劇情為遊戲原創，非小說原作。
 *   改寫自序章・二〈聆聽〉的判定：波紋與圓環重疊時按下。
 *   ・節拍：每分鐘約 110 下，三十拍一組 → 兩拍休止 → 三十拍 → 兩拍休止 → 十五拍（越來越慢、越來越輕）
 *   ・休止拍按下＝失誤（這裡不是腳步，是有人停下來）
 *   ・連續命中每 10 拍，悶響底下多一層很低的人聲數數（Web Audio 合成），畫面上的數字也越清楚
 *   ・打完第二組時判定：最高連續命中 ≥ 20，而且兩次休止都沒有按 → 聽出來了（doorOk、heardCount = true）
 *   ・失敗不會 Game Over：劇情照走，結果過場裡可以選「再聽一次」（FLOW 的 jump），
 *     也可以之後在回憶圖鑑「重聽門後」（只在第 3 章開始前算數）。
 * ========================================================= */
(function (CX) {
  'use strict';
  const { W, H, clamp } = CX;
  const input = CX.input, audio = CX.audio;
  const BEAT = 60 / 110;
  const NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const zh = n => n <= 10 ? NUM[n] : n < 20 ? '十' + NUM[n - 10] : NUM[Math.floor(n / 10)] + '十' + NUM[n % 10];
  const NEED_COMBO = 20;

  class StageDoor extends CX.Stage {
    constructor(game, opt = {}) {
      super(game, 'door');
      this.opt = opt;
      this.maxHearts = 0;
      this.TRAVEL = 1.5; this.R0 = 330; this.RT = 70;
      this.weather = new CX.Weather('rain', .7);
      // 節拍表
      this.beats = []; let t = 2.0;
      const group = (g, n, vol) => { for (let k = 1; k <= n; k++) { this.beats.push({ time: t, g, n: k, vol }); t += BEAT; } };
      const rest = (g) => { for (let k = 1; k <= 2; k++) { this.beats.push({ time: t, g, n: k, rest: true }); t += BEAT; } };
      group(1, 30, .55); rest(1); group(2, 30, .65); rest(2);
      this.judgeAt = this.beats[this.beats.length - 1].time + .3;
      for (let k = 1; k <= 15; k++) {             // 第三組（半組）：越來越慢、越來越輕，最後沒有了動靜
        this.beats.push({ time: t, g: 3, n: k, vol: .55 * (1 - k / 17), fade: true });
        t += BEAT * (1 + k * .05);
      }
      this.endAt = t + 1.2;
      this.clock = 0; this.combo = 0; this.maxCombo = 0; this.hits = 0; this.restPress = 0;
      this.pulse = 0; this.caps = []; this.capDone = {};
      this.judged = false; this.success = false;
      CX.vars.doorTries = (CX.vars.doorTries || 0) + 1;
      CX.vars.retryDoor = false;
      this.tryNo = CX.vars.doorTries;
    }
    get layer() { return Math.min(3, Math.floor(this.combo / 10)); }
    progress() { return clamp(this.clock / this.endAt, 0, 1); }
    caption(key, text, opt = {}) {
      if (this.capDone[key]) return; this.capDone[key] = true;
      this.caps.push({ text, t: 0, life: opt.life || 3.4, who: opt.who });
    }
    play(dt) {
      this.clock += dt; this.pulse = Math.max(0, this.pulse - dt * 2.5);
      this.caps.forEach(c => c.t += dt); this.caps = this.caps.filter(c => c.t < c.life);
      for (const b of this.beats) {
        if (!b.sounded && this.clock >= b.time) {
          b.sounded = true;
          if (b.rest) { if (b.g === 1 && b.n === 1) this.caption('rest', '停了。一、二。然後又開始。'); continue; }
          audio.sfx('thud', b.vol); this.pulse = b.fade ? .5 : 1;
          const L = this.layer;           // 人聲數數：連續命中越多越清楚
          if (L > 0 && !b.fade) audio.voice(118 - (b.n % 3) * 6, .26, .022 * L + .01, 480 + L * 60);
          if (b.fade && b.n < 8) audio.voice(110, .24, .02, 500);
        }
        if (!b.done && this.clock > b.time + (b.rest ? .27 : .24)) {
          b.done = true;
          if (!b.rest && !b.hit) { b.missed = true; if (!b.fade) { this.combo = 0; this.popup('錯過了', W / 2, 470, { world: false, color: '#ff98a6', size: 20, life: .8 }); } }
        }
      }
      // 玩家按下：找最近的一拍（含休止拍）
      if (input.wasPressed('action') || input.wasPressed('jump') || input.tapped) {
        let best = null, bd = 1e9;
        for (const b of this.beats) { if (b.done) continue; const d = Math.abs(this.clock - b.time); if (d < bd) { bd = d; best = b; } if (b.time > this.clock + 1) break; }
        if (best && best.rest && bd < .27) {
          best.done = true; this.restPress++; this.combo = 0; audio.sfx('miss', .7);
          this.popup('……這裡，什麼都沒有。', W / 2, 470, { world: false, color: '#ffb0a0', size: 20, life: 1.2 });
        } else if (best && !best.rest) {
          if (bd < .12) this.judge(best, '完美', '#bfe3ff');
          else if (bd < .24) this.judge(best, '不錯', '#e0e8ff');
          else if (bd < .4) { best.done = true; best.missed = true; if (!best.fade) this.combo = 0; this.popup(this.clock < best.time ? '太早了' : '太晚了', W / 2, 470, { world: false, color: '#ff98a6', size: 20, life: .8 }); }
        }
      }
      if (!this.judged && this.clock >= this.judgeAt) this.judge2();
      if (this.clock >= this.endAt) this.win();
    }
    judge(b, label, color) {
      b.hit = true; b.done = true; this.hits++;
      if (b.fade) return;
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.popup(label + (this.combo > 2 ? `　×${this.combo}` : ''), W / 2, 470, { world: false, color, size: 22, life: .7 });
      if (this.hits === 10) this.caption('h10', '……一陣一陣，如重物猛擊。');
      if (this.hits === 20) this.caption('h20', '它太準了。打人的人，不會這麼準。');
      if (this.hits === 30) this.caption('h30', '……二十八、二十九、三十。', { who: '沈昊（很低，幾乎被雨蓋住）', life: 4 });
    }
    /** 打完第二組：判定有沒有聽出來 */
    judge2() {
      this.judged = true;
      this.success = this.maxCombo >= NEED_COMBO && this.restPress === 0;
      if (!this.opt.replay) {
        CX.vars.doorOk = this.success;
        if (this.success) CX.vars.heardCount = true;
      }
      console.log('[door] try', this.tryNo, 'maxCombo', this.maxCombo, 'restPress', this.restPress, 'hits', this.hits, this.success ? '聽出來了' : '沒聽出來');
      this.popup(this.success ? '三十下，停兩下。' : '一陣一陣……', W / 2, 200, { world: false, size: 34, life: 3, color: this.success ? '#fff2d6' : '#d8c8d0' });
    }
    bot(dt) {
      super.bot(dt);
      if (this.status !== 'play') return;
      const wantFail = CX.DEBUG.fail && this.tryNo === 1 && !this.opt.replay;
      for (const b of this.beats) {
        if (b.done) continue;
        if (Math.abs(this.clock + dt - b.time) < .03 && (!b.rest || wantFail)) { input.botPressed.action = true; break; }
        if (b.time > this.clock + .2) break;
      }
    }
    drawWorld(ctx) {
      const t = this.t;
      CX.drawBackdrop(ctx, 'stair', t);
      ctx.fillStyle = `rgba(3,5,6,${.62 - this.pulse * .08})`; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = 290;
      ctx.save();
      ctx.strokeStyle = `rgba(220,235,225,${.55 + this.pulse * .4})`; ctx.lineWidth = 4;
      ctx.shadowColor = '#9fe0b8'; ctx.shadowBlur = 20 * this.pulse + 6;
      ctx.beginPath(); ctx.arc(cx, cy, this.RT + this.pulse * 6, 0, 6.283); ctx.stroke();
      ctx.restore();
      CX.drawYuzhen(ctx, cx, cy + 52, { t, eyesClosed: true, scale: 1.45 });
      if (this.status === 'play' || this.status === 'win') {
        for (const b of this.beats) {
          if (b.hit || (b.done && !b.rest)) continue;
          const k = (b.time - this.clock) / this.TRAVEL;
          if (k > 1 || k < -.2) continue;
          const r = Math.max(4, this.RT + (this.R0 - this.RT) * k);
          ctx.save();
          if (b.rest) { ctx.setLineDash([4, 10]); ctx.strokeStyle = `rgba(160,170,180,${.35 * (1 - Math.abs(k))})`; ctx.lineWidth = 1.5; }
          else { ctx.strokeStyle = `rgba(200,225,215,${(b.fade ? .5 : 1) * (1 - Math.abs(k) * .7)})`; ctx.lineWidth = b.fade ? 2 : 3; }
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke(); ctx.restore();
        }
        // 門後的數數：連續命中越多，數字越清楚
        const L = this.layer, cur = [...this.beats].reverse().find(b => b.sounded && !b.rest && !b.fade);
        if (L > 0 && cur && this.clock - cur.time < .45) CX.text(ctx, zh(cur.n), cx + 150, cy - 110, 26 + L * 4, '#e8f0ea', { alpha: .12 + L * .22 });
      }
      CX.text(ctx, '把耳朵貼上鐵門……', W / 2, 96, 20, 'rgba(225,235,230,.75)');
      // 字幕
      this.caps.forEach((c, i) => {
        const a = clamp(c.t * 3, 0, 1) * clamp((c.life - c.t) * 2, 0, 1);
        if (c.who) CX.text(ctx, c.who, W / 2, 132 + i * 52, 14, '#b9c9dc', { alpha: a });
        CX.text(ctx, c.text, W / 2, 154 + i * 52, 21, '#f2f4ff', { alpha: a, stroke: 'rgba(0,0,0,.6)', strokeW: 4 });
      });
      this.weather.draw(ctx, .55);
      CX.vignette(ctx, .85);
    }
    drawBanner(ctx, title, sub) {
      // M5：沒聽出來時，把原因說清楚（最長連續不到 20／休止時按了）
      const why = [];
      if (!this.success) {
        if (this.maxCombo < NEED_COMBO) why.push(`最長連續 ${this.maxCombo} 下（要 ${NEED_COMBO} 下）`);
        if (this.restPress) why.push(`休止時按了 ${this.restPress} 次`);
      }
      super.drawBanner(ctx, '— 門後 —', this.success ? '三十下，停兩下。' : '……只聽得見悶響。');
      if (why.length) CX.text(ctx, why.join('・'), W / 2, H / 2 + 50, 14, '#e8c8c8', { alpha: clamp(this.stateT * 3, 0, 1) });
    }
    /** M5：門檻提示——底部 20 顆小點，跟著「目前連續命中」亮起；連續達 20 下後保持亮著（休止沒按＝暖色「聽清楚了」，休止按過＝灰色） */
    drawMeter(ctx) {
      const full = this.maxCombo >= NEED_COMBO, ok = full && !this.restPress, n = full ? NEED_COMBO : Math.min(this.combo, NEED_COMBO);
      const gap = 12, x0 = W / 2 + 40 - (NEED_COMBO - 1) * gap / 2, y = 502;
      for (let i = 0; i < NEED_COMBO; i++) {
        ctx.beginPath(); ctx.arc(x0 + i * gap, y, 3.2, 0, 6.283);
        ctx.fillStyle = i < n ? (ok ? 'rgba(255,226,170,.95)' : full ? 'rgba(200,190,190,.6)' : 'rgba(200,235,215,.85)') : 'rgba(255,255,255,.14)'; ctx.fill();
      }
      const label = ok ? '聽清楚了' : `連續聽準 ${n} / ${NEED_COMBO}`;
      CX.text(ctx, label, x0 - 16, y, 13, ok ? '#ffe2aa' : 'rgba(220,232,226,.75)', { align: 'right' });
      if (this.restPress) CX.text(ctx, `休止按了 ${this.restPress} 次`, x0 + (NEED_COMBO - 1) * gap + 16, y, 12, 'rgba(255,176,160,.85)', { align: 'left' });
    }
    draw(ctx) {
      super.draw(ctx);
      if (this.status === 'play') {
        this.drawMeter(ctx);
        const inRest = this.beats.some(b => b.rest && Math.abs(b.time - this.clock) < .5);
        if (this.stateT < 6 || inRest) CX.text(ctx, '休止的時候，什麼都不要按', W / 2, 526, 13, inRest ? '#ffd8b0' : 'rgba(220,226,245,.55)');
      }
    }
  }
  CX.STAGES.door = StageDoor;
})(window.CX);
