/* =========================================================
 * backdrops.js — 第 1 章起的程式繪製背景、調查物件、紙條／簡訊
 *   新章節還沒有插圖時，用這些簡單的向量畫面暫代（之後可換成 assets/panels/ 的圖）。
 *   ・CX.drawBackdrop(ctx, key, t)：整張背景（cutscene 的 bg 欄位、explore 的 bg）
 *   ・CX.drawProp(ctx, obj, st)：調查場景裡可點擊的物件
 *   ・CX.drawNote(ctx, text, style, alpha)：畫面中央的紙條／剪報／簡訊
 *   注意：這裡不要直接設定 globalAlpha（淡入淡出由外層控制）。
 * ========================================================= */
(function (CX) {
  'use strict';
  const { W, H } = CX;

  function sky(c, top, bot) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  /** 遠景：起重機與貨櫃剪影（rusty = 最遠那排最上層的鏽色貨櫃） */
  function harbor(c, x, y, w, h, o = {}) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    const k = w / 960;
    c.fillStyle = o.far || 'rgba(70,78,92,1)';
    // 起重機
    [[.18, .2], [.55, .12], [.82, .25]].forEach(([px, py]) => {
      const cx = x + px * w, cy = y + py * h;
      c.fillRect(cx - 4 * k, cy, 8 * k, h);
      c.fillRect(cx - 90 * k, cy, 180 * k, 7 * k);
      c.beginPath(); c.moveTo(cx, cy - 40 * k); c.lineTo(cx - 70 * k, cy); c.lineTo(cx + 70 * k, cy); c.closePath(); c.fill();
    });
    // 貨櫃堆
    const cols = ['#7a3a34', '#2f4f73', '#4e6b55', '#6a6f78', '#83472f', '#38506a'];
    const base = y + h * .62, cw = 92 * k, chh = 26 * k;
    for (let i = 0; i < 12; i++) for (let j = 0; j < 3 + (i * 7 % 3); j++) {
      c.fillStyle = o.night ? 'rgba(20,24,34,1)' : cols[(i * 3 + j) % cols.length];
      c.fillRect(x + i * cw * .86 - 10 * k, base - j * chh, cw * .84, chh - 2 * k);
    }
    if (o.rusty) { c.fillStyle = o.night ? '#3a2a20' : '#8a5a2e'; c.fillRect(x + 10 * cw * .86 - 10 * k, base - 4 * chh, cw * .84, chh - 2 * k); }
    c.restore();
  }
  function windowFrame(c, x, y, w, h) {
    c.strokeStyle = '#2a2c34'; c.lineWidth = 10; c.strokeRect(x, y, w, h);
    c.lineWidth = 5; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke();
  }
  function rainOnGlass(c, x, y, w, h, t) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.strokeStyle = 'rgba(200,210,230,.25)'; c.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) { const px = x + (i * 53 % w), py = y + ((i * 97 + t * 60 * (1 + i % 3)) % h); c.beginPath(); c.moveTo(px, py); c.lineTo(px - 1, py + 14); c.stroke(); }
    c.restore();
  }
  function desk(c, night) {
    c.fillStyle = night ? '#1b1612' : '#4a3a2c'; c.fillRect(80, 330, 800, 26);
    c.fillStyle = night ? '#120f0c' : '#33271d'; c.fillRect(80, 356, 800, 184);
    c.fillStyle = night ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.2)'; c.fillRect(80, 356, 800, 10);
  }
  function stain(c) { c.fillStyle = 'rgba(120,100,70,.12)'; c.beginPath(); c.ellipse(640, 40, 90, 26, .1, 0, 6.283); c.fill(); }

  CX.BACKDROPS = {
    white: c => { c.fillStyle = '#f6f6f8'; c.fillRect(0, 0, W, H); },
    black: c => { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); },
    /** 港邊旅社・清晨 */
    room(c, t) {
      sky(c, '#5d6472', '#3a3f4a'); stain(c);
      c.fillStyle = 'rgba(190,200,215,1)'; c.fillRect(120, 60, 360, 230);
      harbor(c, 120, 60, 360, 230, { rusty: true });
      windowFrame(c, 120, 60, 360, 230);
      desk(c, false);
    },
    /** 窗外特寫：最遠那排最上層的鏽色貨櫃 */
    window(c, t) {
      sky(c, '#9aa3b1', '#6c7480');
      harbor(c, 0, 0, W, H, { rusty: true });
      windowFrame(c, 20, 20, W - 40, H - 40);
    },
    /** 旅社走廊・公共區域的窗邊 */
    hall(c, t) {
      sky(c, '#4b505b', '#2c2f36');
      c.fillStyle = 'rgba(170,180,195,1)'; c.fillRect(560, 70, 300, 260);
      harbor(c, 560, 70, 300, 260, {});
      windowFrame(c, 560, 70, 300, 260);
      c.fillStyle = '#23252c'; c.fillRect(0, 400, W, 140);
      c.fillStyle = 'rgba(255,240,200,.08)'; c.beginPath(); c.moveTo(560, 330); c.lineTo(860, 330); c.lineTo(960, 540); c.lineTo(420, 540); c.fill();
    },
    /** 白浦港・第七區大門（白天，風大） */
    gate(c, t) {
      sky(c, '#8d949f', '#5e646e');
      harbor(c, 0, 40, W, 360, {});
      c.fillStyle = '#4a4d54'; c.fillRect(0, 380, W, 160);
      // 鐵絲網
      c.strokeStyle = 'rgba(40,44,50,.7)'; c.lineWidth = 1;
      for (let x = -200; x < W; x += 18) { c.beginPath(); c.moveTo(x, 240); c.lineTo(x + 140, 380); c.moveTo(x + 140, 240); c.lineTo(x, 380); c.stroke(); }
      c.fillStyle = '#2e3138'; for (let x = 0; x < W; x += 160) c.fillRect(x, 230, 6, 150);
      // 警衛亭
      c.fillStyle = '#d8d6cf'; c.fillRect(760, 270, 120, 110); c.fillStyle = '#3c4048'; c.fillRect(775, 290, 90, 40);
      c.fillStyle = '#c9a53a'; c.fillRect(600, 330, 160, 8);
    },
    /** 交班：工人走出閘門，最後一個穿黑大衣 */
    gateCrowd(c, t) {
      CX.BACKDROPS.gate(c, t);
      for (let i = 0; i < 5; i++) {
        const x = 200 + i * 90 + Math.sin(t + i) * 2;
        c.fillStyle = '#2a2d33'; c.fillRect(x - 9, 400, 18, 50);
        c.fillStyle = '#d9e04a'; c.fillRect(x - 10, 412, 20, 6);
        c.fillStyle = '#c8b8a8'; c.beginPath(); c.arc(x, 392, 8, 0, 6.283); c.fill();
      }
      if (CX.drawDongyu) CX.drawDongyu(c, 720, 470, { scale: 1.6, facing: -1, t });
    },
    /** 旅社房間・雨夜 */
    roomNight(c, t) {
      sky(c, '#15171f', '#0b0c12');
      c.fillStyle = '#1c2230'; c.fillRect(120, 60, 360, 230);
      harbor(c, 120, 60, 360, 230, { night: true, rusty: true, far: 'rgba(30,34,44,1)' });
      rainOnGlass(c, 120, 60, 360, 230, t);
      windowFrame(c, 120, 60, 360, 230);
      desk(c, true);
      // 摺疊手機的藍光
      const g = c.createRadialGradient(560, 320, 4, 560, 320, 160); g.addColorStop(0, 'rgba(120,170,255,.35)'); g.addColorStop(1, 'rgba(120,170,255,0)');
      c.fillStyle = g; c.fillRect(380, 160, 360, 300);
    },
  };
  /* ---------- 第 2 章〈頂樓〉 ---------- */
  function rainLines(c, t, a = .3, n = 90) {
    c.save(); c.strokeStyle = `rgba(190,205,230,${a})`; c.lineWidth = 1;
    for (let i = 0; i < n; i++) { const x = (i * 71 + t * 90) % (W + 60) - 30, y = (i * 137 + t * 900 * (1 + i % 3 * .3)) % (H + 40) - 20; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y + 18); c.stroke(); }
    c.restore();
  }
  function cup(c, x, y, s = 1) {
    c.fillStyle = '#e8e6df'; c.beginPath(); c.moveTo(x - 22 * s, y - 50 * s); c.lineTo(x + 22 * s, y - 50 * s); c.lineTo(x + 18 * s, y); c.lineTo(x - 18 * s, y); c.closePath(); c.fill();
    c.fillStyle = '#2f5d8a'; c.fillRect(x - 12 * s, y - 32 * s, 24 * s, 10 * s);       // 貨運公司的商標
    c.fillStyle = '#5a5a60'; c.beginPath(); c.moveTo(x + 6 * s, y - 50 * s); c.lineTo(x + 12 * s, y - 50 * s); c.lineTo(x + 9 * s, y - 45 * s); c.fill();   // 杯緣的缺口
  }
  function chainLock(c, x, y, open) {
    c.strokeStyle = '#8a8f98'; c.lineWidth = 3;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(x - 40 + i * 14, y + Math.sin(i) * 3, 8, 5, 0, 0, 6.283); c.stroke(); }
    c.fillStyle = '#b89a4a'; CX.roundRect(c, x + 44, y - 4, 22, 26, 4); c.fill();
    c.strokeStyle = '#b89a4a'; c.lineWidth = 3; c.beginPath(); c.arc(x + 55, y - 4, 7, Math.PI, open ? Math.PI * 1.6 : 0); c.stroke();
  }
  Object.assign(CX.BACKDROPS, {
    /** 第七區・員工休息室（清晨）：鐵皮屋、閃爍的日光燈、泡麵碗、缺口杯子 */
    breakroom(c, t) {
      sky(c, '#3a3f47', '#22252b');
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; for (let x = 0; x < W; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 330); c.stroke(); }
      c.fillStyle = '#8ea2b8'; c.fillRect(620, 70, 240, 150);                          // 窗：天剛亮
      const g = c.createLinearGradient(0, 70, 0, 220); g.addColorStop(0, 'rgba(255,214,170,.5)'); g.addColorStop(1, 'rgba(255,214,170,0)'); c.fillStyle = g; c.fillRect(620, 70, 240, 150);
      harbor(c, 620, 70, 240, 150, { far: 'rgba(60,66,78,1)' }); windowFrame(c, 620, 70, 240, 150);
      const flick = (Math.sin(t * 23) > .6 || Math.sin(t * 3.1) > .95) ? .25 : .85;     // 一支日光燈在閃
      c.fillStyle = `rgba(235,245,255,${flick})`; c.fillRect(200, 26, 180, 8); c.fillStyle = 'rgba(235,245,255,.85)'; c.fillRect(420, 26, 180, 8);
      c.fillStyle = '#5a5248'; c.fillRect(110, 330, 740, 22); c.fillStyle = '#3c362f'; c.fillRect(110, 352, 740, 188);
      c.fillStyle = '#d9d2c4'; c.beginPath(); c.ellipse(260, 326, 40, 12, 0, 0, 6.283); c.fill();   // 泡麵碗
      c.fillStyle = '#c7c9cc'; CX.roundRect(c, 690, 268, 60, 62, 8); c.fill(); c.fillStyle = '#2a2c30'; c.fillRect(712, 254, 16, 16);   // 電熱水壺
      cup(c, 480, 330, 1.2);
    },
    /** 2009・東宇的房間：家用電話話筒的特寫 */
    phoneClose(c, t) {
      sky(c, '#141a2a', '#0a0d16');
      c.fillStyle = 'rgba(120,150,210,.08)'; c.fillRect(80, 60, 260, 200); rainOnGlass(c, 80, 60, 260, 200, t); windowFrame(c, 80, 60, 260, 200);
      c.save(); c.translate(560, 300); c.rotate(-.35);
      c.fillStyle = '#d7d4cc'; CX.roundRect(c, -150, -26, 300, 52, 24); c.fill();
      c.fillStyle = '#bdb9b0'; c.beginPath(); c.ellipse(-130, 0, 46, 40, 0, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(130, 0, 46, 40, 0, 0, 6.283); c.fill();
      c.fillStyle = '#4a4740'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(-140 + (i % 3) * 10, -12 + Math.floor(i / 3) * 10, 2.5, 0, 6.283); c.fill(); }
      c.restore();
      c.strokeStyle = '#8f8a80'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 14; i++) c.arc(700 + i * 14, 400 + Math.sin(i) * 4, 8, 0, 6.283); c.stroke();
    },
    /** 2009・頂樓（大雨）：左邊水塔與鐵架，右邊及腰欄杆，門口地上有鐵鍊和打開的掛鎖 */
    roof(c, t) {
      sky(c, '#1a2232', '#0c1018');
      c.fillStyle = '#0e1320'; for (let i = 0; i < 18; i++) c.fillRect(i * 58, 300 - (i * 37 % 90), 50, 200);   // 遠方的城市
      c.fillStyle = '#2a3040'; c.fillRect(0, 380, W, 160);                                  // 地面積水
      c.fillStyle = 'rgba(150,170,210,.08)'; for (let i = 0; i < 6; i++) c.fillRect(80 + i * 140, 430 + (i % 2) * 40, 90, 4);
      c.fillStyle = '#39404e'; c.fillRect(60, 150, 170, 140); c.fillStyle = '#2b313d'; c.beginPath(); c.ellipse(145, 150, 85, 18, 0, 0, 6.283); c.fill();   // 水塔
      c.strokeStyle = '#4a5162'; c.lineWidth = 7; c.beginPath(); c.moveTo(75, 290); c.lineTo(85, 390); c.moveTo(215, 290); c.lineTo(205, 390); c.moveTo(80, 330); c.lineTo(210, 330); c.stroke();
      c.strokeStyle = '#59606e'; c.lineWidth = 5; c.beginPath(); c.moveTo(640, 330); c.lineTo(W, 330); c.stroke();   // 欄杆
      c.lineWidth = 3; for (let x = 650; x < W; x += 40) { c.beginPath(); c.moveTo(x, 330); c.lineTo(x, 385); c.stroke(); }
      c.fillStyle = '#20252f'; c.fillRect(360, 170, 130, 215); c.strokeStyle = '#3b4250'; c.lineWidth = 4; c.strokeRect(360, 170, 130, 215);   // 樓梯間的門
      chainLock(c, 420, 300, true);                         // 門把上的鐵鍊與打開的掛鎖
      rainLines(c, t, .28);
    },
    /** 胖達的一隻手攤在積水裡，熊貓貼紙的手機從口袋滑出一半（不畫傷口） */
    roofAfter(c, t) {
      sky(c, '#121826', '#080b12');
      c.fillStyle = '#1d2330'; c.fillRect(0, 300, W, 240);
      c.fillStyle = 'rgba(150,170,210,.1)'; c.beginPath(); c.ellipse(480, 420, 300, 60, 0, 0, 6.283); c.fill();
      c.fillStyle = '#c8b8a8'; c.beginPath(); c.ellipse(420, 410, 60, 18, -.1, 0, 6.283); c.fill();     // 手
      for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(362 - i * 4, 392 + i * 11, 16, 6, -.4, 0, 6.283); c.fill(); }
      c.fillStyle = '#b8bcc4'; CX.roundRect(c, 520, 380, 50, 78, 6); c.fill();                              // 摺疊手機
      c.fillStyle = '#fff'; c.beginPath(); c.arc(545, 410, 11, 0, 6.283); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(539, 406, 3.5, 0, 6.283); c.arc(551, 406, 3.5, 0, 6.283); c.fill();   // 熊貓貼紙
      rainLines(c, t, .22, 70);
    },
    /** 刻意的缺格：一片空白的灰（第 4 章 4-2 才補上） */
    gray(c) { c.fillStyle = '#8a8c90'; c.fillRect(0, 0, W, H); },
    /** 頂樓門外的樓梯間：昏暗，只有逃生指示燈的綠光 */
    stair(c, t) {
      sky(c, '#0a0e0c', '#050706');
      c.fillStyle = '#1a201d'; c.fillRect(330, 90, 300, 360); c.strokeStyle = '#2c3530'; c.lineWidth = 6; c.strokeRect(330, 90, 300, 360);
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2; for (let y = 120; y < 450; y += 40) { c.beginPath(); c.moveTo(336, y); c.lineTo(624, y); c.stroke(); }
      const g = c.createRadialGradient(480, 60, 4, 480, 60, 220); g.addColorStop(0, 'rgba(60,255,140,.35)'); g.addColorStop(1, 'rgba(60,255,140,0)');
      c.fillStyle = g; c.fillRect(200, 0, 560, 300);
      c.fillStyle = '#2fd47a'; c.fillRect(440, 40, 80, 26); c.fillStyle = '#0b2a18'; c.fillRect(452, 46, 18, 14);
      for (let i = 0; i < 5; i++) { c.fillStyle = `rgba(40,48,44,${1 - i * .15})`; c.fillRect(0, 450 + i * 18, W, 18); }
    },
    /** 2009・刑警隊的小房間：白色日光燈，只畫手和筆錄紙 */
    police(c, t) {
      sky(c, '#c9ccd0', '#9da1a7');
      c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(300, 20, 360, 10);
      c.fillStyle = '#6b6f76'; c.fillRect(0, 330, W, 210);
      c.fillStyle = '#f4f2ec'; c.save(); c.translate(500, 420); c.rotate(-.06); c.fillRect(-150, -90, 300, 200);
      c.strokeStyle = 'rgba(80,90,120,.35)'; c.lineWidth = 1; for (let y = -70; y < 100; y += 18) { c.beginPath(); c.moveTo(-130, y); c.lineTo(130, y); c.stroke(); }
      c.restore();
      c.fillStyle = '#d8c3ad'; c.beginPath(); c.ellipse(650, 400, 46, 22, -.3, 0, 6.283); c.fill();       // 女警的手
      c.strokeStyle = '#20232a'; c.lineWidth = 6; c.beginPath(); c.moveTo(625, 395); c.lineTo(570, 440); c.stroke();
      c.fillStyle = 'rgba(160,140,120,.55)'; c.beginPath(); c.ellipse(150, 470, 120, 60, 0, 0, 6.283); c.fill();   // 雨真身上的毛毯一角
    },
    /** 閘門外・傍晚：鉛灰色天空 */
    gateDusk(c, t) {
      CX.BACKDROPS.gate(c, t);
      c.fillStyle = 'rgba(30,36,52,.45)'; c.fillRect(0, 0, W, H);
      const g = c.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, 'rgba(60,64,80,.6)'); g.addColorStop(1, 'rgba(160,120,110,.15)'); c.fillStyle = g; c.fillRect(0, 0, W, 260);
    },
    /** 東宇走進堆場，背影被一排一排的貨櫃吞掉 */
    yardDusk(c, t) {
      sky(c, '#4a4f5c', '#262a34');
      harbor(c, 0, 20, W, 420, { far: 'rgba(40,44,54,1)' });
      c.fillStyle = '#2c3038'; c.fillRect(0, 400, W, 140);
      if (CX.drawDongyu) { c.save(); c.globalAlpha *= Math.max(0, 1 - t / 9); CX.drawDongyu(c, 560 + Math.min(t, 9) * 8, 450, { scale: .9 - Math.min(t, 9) * .03, facing: 1, t }); c.restore(); }
    },
  });

  CX.drawBackdrop = function (c, key, t = 0) {
    const f = CX.BACKDROPS[key];
    if (f) f(c, t); else { c.fillStyle = '#0a0a12'; c.fillRect(0, 0, W, H); }
  };

  /* ---------- 調查物件 ---------- */
  function glow(c, o, st) {
    if (st.done) return;
    const a = st.sel ? .9 : .35 + .25 * Math.sin(st.t * 3);
    c.save(); c.strokeStyle = `rgba(200,220,255,${a})`; c.lineWidth = st.sel ? 2.5 : 1.5;
    c.shadowColor = '#bcd4ff'; c.shadowBlur = st.sel ? 16 : 8;
    CX.roundRect(c, o.x - 6, o.y - 6, o.w + 12, o.h + 12, 10); c.stroke(); c.restore();
  }
  const PROPS = {
    box(c, o, st) {
      c.fillStyle = st.opened ? '#9b7a52' : '#b08a5c'; c.fillRect(o.x, o.y + 18, o.w, o.h - 18);
      c.fillStyle = '#c49c6a'; c.beginPath(); c.moveTo(o.x, o.y + 18); c.lineTo(o.x + 20, o.y); c.lineTo(o.x + o.w - 20, o.y); c.lineTo(o.x + o.w, o.y + 18); c.fill();
      c.fillStyle = '#e8e2d2'; c.fillRect(o.x + 24, o.y + 40, 90, 34);
      c.fillStyle = '#555'; c.font = CX.font(11); c.textBaseline = 'top'; c.fillText('白浦港　第七區', o.x + 30, o.y + 46); c.fillText('李雨真　收', o.x + 30, o.y + 60);
    },
    photo(c, o) {
      c.save(); c.translate(o.x + o.w / 2, o.y + o.h / 2); c.rotate(-.06);
      c.fillStyle = '#efeae0'; c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      c.fillStyle = '#6d7886'; c.fillRect(-o.w / 2 + 6, -o.h / 2 + 6, o.w - 12, o.h - 18);
      for (let i = 0; i < 4; i++) { const x = -o.w / 2 + 20 + i * 22; c.fillStyle = '#2b2b33'; c.fillRect(x - 5, -2, 10, 20); if (i < 3) { c.fillStyle = '#e2c9b0'; c.beginPath(); c.arc(x, -8, 5, 0, 6.283); c.fill(); } }
      c.restore();
    },
    program(c, o) {
      c.save(); c.translate(o.x + o.w / 2, o.y + o.h / 2); c.rotate(.05);
      c.fillStyle = '#e6d9b8'; c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      c.strokeStyle = 'rgba(120,100,60,.5)'; c.beginPath(); c.moveTo(0, -o.h / 2); c.lineTo(0, o.h / 2); c.stroke();
      c.fillStyle = '#5a4a30'; c.font = CX.font(10); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('冬季發表會', o.w / 4, -8); c.fillText('2003', o.w / 4, 8);
      c.restore();
    },
    clipping(c, o) {
      c.fillStyle = '#cfcab8'; c.fillRect(o.x, o.y, o.w, o.h);
      c.fillStyle = '#f0ede4'; c.fillRect(o.x + 10, o.y + 8, o.w - 20, o.h - 16);
      c.fillStyle = 'rgba(40,40,40,.55)'; for (let i = 0; i < 4; i++) c.fillRect(o.x + 16, o.y + 14 + i * 9, o.w - 32 - (i % 2) * 18, 3);
    },
    phone(c, o) {
      c.fillStyle = '#b9bcc4'; CX.roundRect(c, o.x, o.y, o.w, o.h, 8); c.fill();
      c.strokeStyle = '#8a8d95'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x + 2, o.y + o.h / 2); c.lineTo(o.x + o.w - 2, o.y + o.h / 2); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(o.x + o.w / 2, o.y + o.h * .28, 7, 0, 6.283); c.fill();
      c.fillStyle = '#222'; [[-3, -3], [3, -3]].forEach(([dx, dy]) => { c.beginPath(); c.arc(o.x + o.w / 2 + dx, o.y + o.h * .28 + dy, 2, 0, 6.283); c.fill(); });
    },
    note(c, o) {
      c.save(); c.translate(o.x + o.w / 2, o.y + o.h / 2); c.rotate(-.04);
      c.fillStyle = '#f7f5ee'; c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      c.fillStyle = 'rgba(30,30,30,.7)'; c.fillRect(-o.w / 2 + 14, -2, o.w - 28, 3);
      c.restore();
    },
    door(c, o) {
      c.fillStyle = '#3d342c'; c.fillRect(o.x, o.y, o.w, o.h);
      c.strokeStyle = '#2a231d'; c.lineWidth = 4; c.strokeRect(o.x + 12, o.y + 14, o.w - 24, o.h - 28);
      c.fillStyle = '#c0a060'; c.beginPath(); c.arc(o.x + o.w - 22, o.y + o.h / 2, 5, 0, 6.283); c.fill();
    },
  };
  CX.drawProp = function (c, o, st) {
    c.save();
    const f = PROPS[o.kind];
    if (f) f(c, o, st);
    if (st.done) { c.fillStyle = 'rgba(10,12,20,.35)'; c.fillRect(o.x - 4, o.y - 4, o.w + 8, o.h + 8); }
    c.restore();
    glow(c, o, st);
    if (st.sel || st.labels) CX.text(c, o.label + (st.done ? '　✓' : ''), o.x + o.w / 2, o.y - 18, 15, st.done ? 'rgba(220,225,240,.6)' : '#f2f5ff', { stroke: 'rgba(0,0,0,.7)', strokeW: 4 });
  };

  /* ---------- 紙條／剪報／節目單／簡訊 ---------- */
  CX.drawNote = function (c, text, style = 'paper') {
    const phone = style === 'sms';
    c.save();
    c.font = CX.font(phone ? 19 : 21);
    const lines = []; String(text).split('\n').forEach(p => { const w = CX.wrapText(c, p, 440); if (!w.length) lines.push(''); else lines.push(...w); });
    const lh = phone ? 30 : 32, bw = 520, bh = 60 + lines.length * lh, bx = (W - bw) / 2, by = Math.max(30, 200 - bh / 2);
    if (phone) {
      c.fillStyle = 'rgba(8,16,36,.94)'; CX.roundRect(c, bx, by, bw, bh, 14); c.fill();
      c.strokeStyle = 'rgba(120,170,255,.7)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#bcd6ff';
    } else {
      c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 18;
      c.fillStyle = style === 'print' ? '#f8f7f2' : style === 'pen' ? '#efe9dc' : '#ece4cf';
      c.fillRect(bx, by, bw, bh); c.shadowBlur = 0;
      c.fillStyle = style === 'pen' ? '#2c3f8a' : '#2a2620';
    }
    c.textBaseline = 'top'; c.textAlign = style === 'print' ? 'center' : 'left';
    lines.forEach((ln, i) => c.fillText(ln, style === 'print' ? W / 2 : bx + 40, by + 30 + i * lh));
    c.restore();
  };
})(window.CX);
