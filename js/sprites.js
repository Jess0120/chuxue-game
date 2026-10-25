/* =========================================================
 * sprites.js — 角色繪製
 *   不使用圖片素材，全部用 Canvas 向量繪製 Q 版側身角色，
 *   造型依照漫畫設定：
 *     李雨真：黑色及腰長髮、白皙、白色高領 + 深藍大衣（2009 年為制服＋紅領結）
 *     延東宇：黑色短髮、黑色高領 + 黑大衣（2009 年為灰色連帽外套）
 *     斗篷男：全黑連帽斗篷、看不清臉
 *     沈昊（第 1 章起）：斗篷脫下版，臉與頸有傷疤（粗略向量，待正式立繪）
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


  /* ---------- 沈昊（阿昊，斗篷脫下版；粗略向量，之後可換正式立繪） ----------
   *   傷疤：臉、頸、左胸、左臂（劇本設定），用淡色細線表示，不畫傷口。
   *   左腳拖一點：limp 參數讓左腳擺幅變小。 */
  CX.drawHao = function (ctx, x, y, o = {}) {
    const f = o.facing || 1, young = o.young;
    const bob = o.run && !o.air ? Math.abs(Math.sin(o.t * 14)) * 2 : 0;
    ctx.save();
    ctx.translate(x, y - bob); ctx.scale(f * (o.scale || 1.4), o.scale || 1.4);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    rim(ctx);
    const [a1, a2] = legAngles(o);
    leg(ctx, -2, -23, 22, a2 * (young ? 1 : .45), '#15151b', 5.5);   // 左腳（拖步）
    leg(ctx, 2, -23, 22, a1, '#15151b', 5.5);
    ctx.fillStyle = young ? '#5a6478' : '#1a1a22';                   // 8 歲：灰藍外套；27 歲：深色長外套
    ctx.beginPath(); ctx.moveTo(-9, -52); ctx.lineTo(9, -52); ctx.lineTo(11, -20); ctx.lineTo(-11, -20); ctx.fill();
    ctx.strokeStyle = young ? '#5a6478' : '#1a1a22'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -49); ctx.lineTo(2, -34); ctx.stroke();
    if (young) { ctx.fillStyle = '#2a2a30'; ctx.fillRect(-14, -50, 5, 26); }   // 琴袋
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(1, -63, 9.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = HAIR; ctx.beginPath();
    ctx.moveTo(-10, -61); ctx.lineTo(-10, -70); ctx.lineTo(-4, -75); ctx.lineTo(5, -75); ctx.lineTo(10, -70);
    ctx.lineTo(10, -64); ctx.lineTo(6, -68); ctx.lineTo(1, -66); ctx.lineTo(-4, -68); ctx.lineTo(-7, -58); ctx.fill();
    if (!young) {
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(205,150,150,.85)'; ctx.lineWidth = .9;
      ctx.beginPath(); ctx.moveTo(-2, -66); ctx.lineTo(4, -58); ctx.moveTo(0, -61); ctx.lineTo(6, -63);
      ctx.moveTo(-3, -55); ctx.lineTo(3, -51); ctx.stroke();
    }
    ctx.restore();
  };

  /** 程式產生的頭像（100×100），放進 CX.images['pt_*']，對話框直接使用 */
  function portrait(draw) {
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 200;
    const c = cv.getContext('2d'); c.scale(2, 2);
    const g = c.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#2b3142'); g.addColorStop(1, '#10121a');
    c.fillStyle = g; c.fillRect(0, 0, 100, 100);
    draw(c); return cv;
  }
  function face(c, o) {
    c.fillStyle = o.coat; c.beginPath(); c.moveTo(14, 100); c.quadraticCurveTo(50, 64, 86, 100); c.fill();
    c.fillStyle = SKIN; c.fillRect(43, 60, 14, 14);
    c.beginPath(); c.ellipse(50, 46, 20, 24, 0, 0, 6.283); c.fill();
    c.fillStyle = HAIR; c.beginPath();
    c.moveTo(28, 50); c.quadraticCurveTo(24, 18, 50, 18); c.quadraticCurveTo(78, 18, 72, 50);
    c.lineTo(66, 34); c.lineTo(56, 38); c.lineTo(46, 32); c.lineTo(36, 40); c.closePath(); c.fill();
    c.fillStyle = '#1c1a20'; c.fillRect(39, 48, 7, 2); c.fillRect(55, 48, 7, 2);
    if (o.scar) {
      c.strokeStyle = 'rgba(200,140,140,.9)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(34, 40); c.lineTo(46, 62); c.moveTo(38, 52); c.lineTo(48, 50);
      c.moveTo(42, 64); c.lineTo(52, 74); c.moveTo(30, 88); c.lineTo(42, 96); c.stroke();
    }
  }
  CX.makePortraits = function () {
    CX.images.pt_hao = portrait(c => face(c, { coat: '#1a1a22', scar: true }));
    CX.images.pt_hao_s = portrait(c => { c.save(); c.translate(50, 60); c.scale(.85, .85); c.translate(-50, -50); face(c, { coat: '#5a6478' }); c.restore(); });
    CX.images.pt_panda_s = portrait(c => {
      c.fillStyle = '#c8783a'; c.beginPath(); c.moveTo(10, 100); c.quadraticCurveTo(50, 62, 90, 100); c.fill();
      c.fillStyle = SKIN; c.beginPath(); c.ellipse(50, 52, 24, 24, 0, 0, 6.283); c.fill();
      c.fillStyle = HAIR; c.beginPath(); c.ellipse(50, 34, 24, 12, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#1c1a20'; c.beginPath(); c.arc(41, 52, 2.5, 0, 6.283); c.arc(59, 52, 2.5, 0, 6.283); c.fill();
      c.strokeStyle = '#a05050'; c.lineWidth = 1.5; c.beginPath(); c.arc(50, 60, 6, .2, Math.PI - .2); c.stroke();
    });
  };

  /** 信任度圖示：東宇＝黑大衣的扣子；阿昊＝一個琴鍵（不顯示數字） */
  CX.drawTrustIcon = function (ctx, kind, x, y, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
    ctx.shadowColor = 'rgba(200,215,255,.8)'; ctx.shadowBlur = 12;
    if (kind === 'trustHao') {
      ctx.fillStyle = '#f4f4f0'; CX.roundRect(ctx, -11, -22, 22, 44, 3); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#15151a'; ctx.fillRect(4, -22, 10, 26);
    } else {
      ctx.fillStyle = '#1a1a20'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#4a4a56'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 6.283); ctx.stroke();
      ctx.fillStyle = '#5a5a66'; [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 2, 0, 6.283); ctx.fill(); });
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
