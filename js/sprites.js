/* =========================================================
 * sprites.js — 角色繪製
 *   不使用圖片素材，全部用 Canvas 向量繪製 Q 版側身角色，
 *   造型依照漫畫設定：
 *     李雨真：黑色及腰長髮、白皙、白色高領 + 深藍大衣（2009 年為制服＋紅領結）
 *     延東宇：黑色短髮、黑色高領 + 黑大衣（2009 年為灰色連帽外套）
 *     斗篷男：全黑連帽斗篷、看不清臉
 *   (x, y) 為角色腳底中心點。
 * ========================================================= */
(function (CX) {
  'use strict';

  const SKIN = '#f2e2da', HAIR = '#0c0c12';
  /** 月光輪廓光：讓深色角色在夜景中依然看得清楚 */
  function rim(ctx) { ctx.shadowColor = 'rgba(175,195,255,.7)'; ctx.shadowBlur = 7; }

  /** 畫一隻腳（擺動角度 a） */
  function leg(ctx, x, y, len, a, color, w = 5, shoe = '#111') {
    const ex = x + Math.sin(a) * len, ey = y + Math.cos(a) * len;
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = shoe; ctx.beginPath(); ctx.ellipse(ex + 2, ey, 4, 2.6, 0, 0, 6.283); ctx.fill();
  }

  /** 走路/跑步時的雙腳角度 */
  function legAngles(o) {
    if (o.air) return [-.5, .7];
    if (!o.run) return [-.08, .08];
    const s = Math.sin(o.t * 14) * .75;
    return [s, -s];
  }

  /* ---------- 李雨真 ---------- */
  CX.drawYuzhen = function (ctx, x, y, o = {}) {
    const f = o.facing || 1, school = o.outfit === 'school';
    const bob = o.run && !o.air ? Math.abs(Math.sin(o.t * 14)) * 2 : 0;
    ctx.save();
    ctx.translate(x, y - bob); ctx.scale(f * (o.scale || 1.3), o.scale || 1.3);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    rim(ctx);

    // 長髮（在身體後面，隨奔跑往後飄）
    const sway = (o.run ? 8 : 2) + Math.sin(o.t * 6) * 2;
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.moveTo(-6, -62);
    ctx.quadraticCurveTo(-14 - sway, -40, -10 - sway * 1.6, -26);
    ctx.quadraticCurveTo(-4 - sway, -30, 0, -36);
    ctx.quadraticCurveTo(4, -50, 6, -60);
    ctx.fill();

    // 腳
    const [a1, a2] = legAngles(o);
    const legC = school ? SKIN : '#15151c';
    leg(ctx, -2, -22, 21, a2, legC, 5, '#0d0d10');
    leg(ctx, 2, -22, 21, a1, legC, 5, '#0d0d10');
    if (school) { // 黑色長襪
      ctx.fillStyle = '#16161c';
      [[-2, a2], [2, a1]].forEach(([lx, a]) => {
        ctx.save(); ctx.translate(lx, -22); ctx.rotate(-a);
        ctx.fillRect(-2.6, 10, 5.2, 11); ctx.restore();
      });
    }

    // 身體（大衣或制服外套）
    ctx.fillStyle = school ? '#1e2540' : '#1b2033';
    ctx.beginPath();
    ctx.moveTo(-8, -50); ctx.lineTo(8, -50); ctx.lineTo(school ? 9 : 11, -22); ctx.lineTo(school ? -9 : -11, -22);
    ctx.closePath(); ctx.fill();
    if (school) { // 百褶裙
      ctx.fillStyle = '#23232e';
      ctx.beginPath(); ctx.moveTo(-9, -28); ctx.lineTo(9, -28); ctx.lineTo(12, -17); ctx.lineTo(-12, -17); ctx.fill();
      ctx.fillStyle = '#f3f3f6'; ctx.fillRect(-3, -50, 6, 10);          // 白襯衫
      ctx.fillStyle = '#b3283a'; ctx.beginPath();                        // 紅領結
      ctx.moveTo(0, -46); ctx.lineTo(-4, -49); ctx.lineTo(-4, -43); ctx.lineTo(0, -46);
      ctx.lineTo(4, -49); ctx.lineTo(4, -43); ctx.fill();
    } else {
      ctx.fillStyle = '#ececf2'; ctx.fillRect(-4, -52, 8, 5);           // 白色高領
    }
    // 手臂
    const arm = o.run ? Math.sin(o.t * 14) * .9 : .1;
    ctx.strokeStyle = school ? '#1e2540' : '#1b2033'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -47); ctx.lineTo(Math.sin(arm) * 12, -47 + Math.cos(arm) * 14); ctx.stroke();

    // 頭
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(1, -61, 9.5, 0, 6.283); ctx.fill();
    // 瀏海與頭頂
    ctx.fillStyle = HAIR; ctx.beginPath();
    ctx.arc(0, -62, 10.5, Math.PI * .95, Math.PI * 2.08); ctx.quadraticCurveTo(9, -58, 6, -60);
    ctx.quadraticCurveTo(2, -64, -2, -58); ctx.lineTo(-10, -56); ctx.fill();
    // 眼睛（閉眼時畫成一條線）
    ctx.strokeStyle = '#2a1f24'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (o.eyesClosed) { ctx.moveTo(4, -59); ctx.quadraticCurveTo(6, -57.5, 8, -59); }
    else { ctx.moveTo(5, -60); ctx.lineTo(7.5, -60); }
    ctx.stroke();
    ctx.restore();
  };

  /* ---------- 延東宇 ---------- */
  CX.drawDongyu = function (ctx, x, y, o = {}) {
    const f = o.facing || 1, young = o.outfit === 'hoodie';
    const bob = o.run && !o.air ? Math.abs(Math.sin(o.t * 14)) * 2 : 0;
    ctx.save();
    ctx.translate(x, y - bob); ctx.scale(f * (o.scale || 1.4), o.scale || 1.4);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    rim(ctx);
    const [a1, a2] = legAngles(o);
    leg(ctx, -2, -23, 22, a2, '#111116', 5.5);
    leg(ctx, 2, -23, 22, a1, '#111116', 5.5);
    // 黑大衣 / 灰色連帽外套
    ctx.fillStyle = young ? '#3a3b42' : '#121218';
    ctx.beginPath(); ctx.moveTo(-9, -52); ctx.lineTo(9, -52); ctx.lineTo(12, -20); ctx.lineTo(-12, -20); ctx.fill();
    ctx.fillStyle = young ? '#d8d6d0' : '#202028'; ctx.fillRect(-4, -54, 8, 6);
    // 手臂（張開保護時往前伸）
    ctx.strokeStyle = young ? '#3a3b42' : '#121218'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -49);
    if (o.guard) ctx.lineTo(-16, -44); else {
      const arm = o.run ? Math.sin(o.t * 14) * .9 : .1;
      ctx.lineTo(Math.sin(arm) * 13, -49 + Math.cos(arm) * 15);
    }
    ctx.stroke();
    // 頭與短髮
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(1, -63, 9.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = HAIR; ctx.beginPath();
    ctx.moveTo(-10, -60); ctx.lineTo(-11, -68); ctx.lineTo(-6, -74); ctx.lineTo(2, -75); ctx.lineTo(9, -72);
    ctx.lineTo(11, -65); ctx.lineTo(8, -66); ctx.lineTo(6, -62); ctx.lineTo(3, -66); ctx.lineTo(-3, -64);
    ctx.lineTo(-6, -57); ctx.fill();
    ctx.strokeStyle = '#1d1a1c'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(5, -62); ctx.lineTo(8, -62.5); ctx.stroke();
    ctx.restore();
  };

  /* ---------- 斗篷男（黑影） ---------- */
  CX.drawHood = function (ctx, x, y, o = {}) {
    const f = o.facing || 1, t = o.t || 0;
    ctx.save();
    ctx.translate(x, y); ctx.scale(f * (o.scale || 1.5), o.scale || 1.5);
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    // 飄動的煙霧殘影
    if (o.smoke) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(5,5,10,${.18 - i * .03})`;
        ctx.beginPath(); ctx.arc(-14 - i * 9 + Math.sin(t * 3 + i) * 3, -20 - i * 4, 14 - i, 0, 6.283); ctx.fill();
      }
    }
    // 斗篷本體（下擺破碎、隨時間飄動）
    ctx.fillStyle = '#07070b';
    ctx.beginPath();
    ctx.moveTo(-4, -78);
    ctx.quadraticCurveTo(12, -78, 12, -60);
    ctx.lineTo(16, -4);
    for (let i = 0; i <= 6; i++) {
      const px = 16 - i * 6, py = (i % 2 ? -8 : 0) + Math.sin(t * 5 + i) * 2;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(-14, -56);
    ctx.quadraticCurveTo(-16, -78, -4, -78);
    ctx.fill();
    // 兜帽內陰影與反光的眼
    ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.ellipse(4, -64, 5, 7, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = o.eyeColor || 'rgba(200,210,230,.8)'; ctx.fillRect(5, -65, 3, 1.4);
    // 舉起的手（第三章：持槍瞄準，只畫成簡單剪影）
    if (o.aim) {
      ctx.strokeStyle = '#07070b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(4, -52); ctx.lineTo(24, -54); ctx.stroke();
      ctx.fillStyle = '#222'; ctx.fillRect(22, -58, 10, 4);
    }
    ctx.restore();
  };

  /** 記憶碎片（雪花形狀的收集物） */
  CX.drawFragment = function (ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 4); ctx.rotate(t * .8);
    ctx.shadowColor = '#bcd4ff'; ctx.shadowBlur = 14;
    ctx.strokeStyle = '#eef4ff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10);
      ctx.moveTo(0, -6); ctx.lineTo(-3, -9); ctx.moveTo(0, -6); ctx.lineTo(3, -9); ctx.stroke();
    }
    ctx.restore();
  };
})(window.CX);
