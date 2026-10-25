/* =========================================================
 * stage-ch4.js — 第 4 章〈初雪〉的縮短版關卡
 *   劇本建議：4-1 的 B、C 路線重用序章 Stage4 的自動奔跑，在火光中奔跑閃避；A 路線只有劇情。
 *     run4b ：4-1B　雨真拉著沈昊的手，兩個人一起在火光和倒下的貨櫃之間跑
 *     run4c ：4-1C　一個人跑（從②過來：猶豫了一秒之後才跑；從③過來：往火的反方向跑）
 *   這兩關沒有雪花碎片（第 4 章的 4 片都在劇情與結局裡）。
 *   跌倒只是重來這一小段，不影響路線。
 * ========================================================= */
(function (CX) {
  'use strict';
  const { W, H } = CX;
  const { Stage4 } = CX.STAGE_CLASSES;

  Object.assign(CX.STAGE_INFO, {
    run4b: { no: '第四章', name: '火光', goal: '抓緊他的手。在火光和倒下的貨櫃之間，一起跑出去。',
             keys: '↑ / 空白鍵 跳躍（長按跳更高）', touch: '點擊畫面或按「跳」跳躍' },
    run4c: { no: '第四章', name: '火光', goal: '跑。跳過燒起來的木箱和倒下的貨櫃。',
             keys: '↑ / 空白鍵 跳躍（長按跳更高）', touch: '點擊畫面或按「跳」跳躍' },
  });

  class StageRun4 extends Stage4 {
    constructor(game, id, withHao) {
      super(game);
      this.id = id; this.info = CX.STAGE_INFO[id]; this.withHao = withHao;
      this.length = 3600; this.speed = 320;
      this.weather = new CX.Weather('embers', 1.2);
      this.fallMsg = '火光撲過來……跌倒了。'; this.puddleMsg = '踩到火了！';
      this.boltColor = '#ffb070'; this.flashT = 2.5;
      // 固定種子的障礙物：火（低）、木箱（中）、倒下的貨櫃（高）
      const rnd = CX.seeded(1212); this.obs = []; this.frags = [];
      let x = 800;
      while (x < this.length - 450) {
        const k = rnd();
        const o = k < .35 ? { type: 'puddle', w: 64, h: 6 } : k < .75 ? { type: 'fence', w: 30, h: 36 } : { type: 'bin', w: 46, h: 44 };
        o.x = x; o.y = this.ground - o.h; this.obs.push(o);
        x += 470 + rnd() * 330;
      }
    }
    drawWorld(ctx) {
      const d = this.dist, t = this.t, G = this.ground;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b0a12'); g.addColorStop(.6, '#3a1a12'); g.addColorStop(1, '#1a0e0c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 身後（左側）的火光
      const fg = ctx.createRadialGradient(-60, G - 60, 30, -60, G - 60, 520);
      fg.addColorStop(0, `rgba(255,150,60,${.55 + .1 * Math.sin(t * 7)})`); fg.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
      // 遠景：一排一排的貨櫃剪影，偶爾有火舌
      for (let i = 0; i < 12; i++) {
        const bx = ((i * 170 - d * .3) % 2040 + 2040) % 2040 - 170, bh = 80 + (i * 53 % 110);
        ctx.fillStyle = '#1a1214'; ctx.fillRect(bx, G - bh - 30, 150, bh + 30);
        if (i % 3 === 0) CX.drawFlames(ctx, bx + 10, G - bh - 30, 130, 40, t, i);
      }
      // 地面：一層薄雪，被火光照成橘色
      ctx.fillStyle = '#2a2224'; ctx.fillRect(0, G, W, H - G);
      ctx.fillStyle = 'rgba(255,200,160,.35)'; ctx.fillRect(0, G, W, 3);
      // 終點：港口出口的閘門
      const sx = this.length - d + 260;
      if (sx < W + 300) {
        ctx.fillStyle = '#16161c'; ctx.fillRect(sx, G - 220, 16, 220); ctx.fillRect(sx + 200, G - 220, 16, 220); ctx.fillRect(sx, G - 220, 216, 14);
        CX.text(ctx, '出口', sx + 108, G - 240, 20, '#f0e8e0');
      }
      ctx.save(); ctx.translate(-d, 0);
      for (const o of this.obs) {
        if (o.x - d > W + 50 || o.x + o.w - d < -50) continue;
        if (o.type === 'puddle') {          // 地上的一小片火
          CX.drawFlames(ctx, o.x, G, o.w, 30, t, o.x * .01);
        } else if (o.type === 'fence') {    // 木箱
          ctx.fillStyle = '#6a4a2c'; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeStyle = '#3a2816'; ctx.lineWidth = 3; ctx.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
          ctx.beginPath(); ctx.moveTo(o.x + 2, o.y + 2); ctx.lineTo(o.x + o.w - 2, o.y + o.h - 2); ctx.stroke();
        } else {                            // 倒下的貨櫃一角
          ctx.fillStyle = '#4a2420'; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let i = o.x + 6; i < o.x + o.w - 3; i += 9) ctx.fillRect(i, o.y + 4, 3, o.h - 8);
          ctx.fillStyle = 'rgba(235,240,250,.5)'; ctx.fillRect(o.x, o.y, o.w, 3);
        }
      }
      ctx.restore();
      const p = this.p;
      const blink = this.inv > 0 && Math.floor(t * 16) % 2;
      if (!blink) {
        const bx = p.x + p.w / 2, by = p.y + p.h;
        if (this.withHao) {                 // 沈昊在她身後半步，手牽著手
          CX.drawHao(ctx, bx - 46, by + 2, { t: t + .2, run: true, air: !p.onGround });
          ctx.strokeStyle = '#d8c3ad'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(bx - 34, by - 50); ctx.lineTo(bx - 12, by - 46); ctx.stroke();
        }
        CX.drawYuzhen(ctx, bx, by, { t, run: true, air: !p.onGround });
      }
      this.weather.draw(ctx, 1);
      CX.vignette(ctx, .6);
      CX.text(ctx, `距離出口 ${Math.max(0, Math.ceil((this.length - this.dist) / 10))} m`, W - 110, 82, 16, '#f0e4da', { stroke: 'rgba(0,0,0,.5)' });
    }
  }

  class StageRun4B extends StageRun4 { constructor(game) { super(game, 'run4b', true); } }
  class StageRun4C extends StageRun4 { constructor(game) { super(game, 'run4c', false); } }

  Object.assign(CX.STAGES, { run4b: StageRun4B, run4c: StageRun4C });
})(window.CX);
