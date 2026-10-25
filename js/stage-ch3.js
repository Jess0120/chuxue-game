/* =========================================================
 * stage-ch3.js — 第 3 章〈港口〉的縮短版關卡
 *   交接說明：第 3 章重用序章的 Stage1（貨櫃奔跑）、Stage2（聆聽）、Stage3（火海），各縮成一段。
 *   這三關沒有雪花碎片（第 3 章的 5 片碎片都在劇情與中間結局裡）。
 *     run3    ：3-3　甩開手，往貨櫃最上層跑（Stage1 縮短）
 *     listen3 ：3-3　左腳重、右腳輕的四步，然後 3 2 1（Stage2 縮短）
 *     fire3   ：結局②　身後扣下扳機之後，跑出火海（Stage3 只留爆炸後半段）
 * ========================================================= */
(function (CX) {
  'use strict';
  const { H } = CX;
  const { Stage1, Stage2, Stage3, CONTAINER } = CX.STAGE_CLASSES;

  Object.assign(CX.STAGE_INFO, {
    run3: { no: '第三章', name: '第七區', goal: '甩開他的手，往貨櫃最上層跑。跟夢裡一樣。',
            keys: '← → 移動　　↑ / 空白鍵 跳躍', touch: '◀ ▶ 移動　　跳 跳躍' },
    listen3: { no: '第三章', name: '腳步聲', goal: '閉上眼睛。左腳重，右腳輕，拖一點點。四步之後，倒數三聲。',
               keys: '空白鍵 / Enter 按下', touch: '點擊畫面', hint: '倒數的 3、2、1 只要聽，不要按' },
    fire3: { no: '第三章', name: '火海', goal: '他扣下了扳機。跑，跳過箱子，不要回頭。',
             keys: '← → 移動　　↑ / 空白鍵 跳躍', touch: '◀ ▶ 移動　　跳 跳躍' },
  });

  class StageRun3 extends Stage1 {
    constructor(game) {
      super(game);
      this.id = 'run3'; this.info = CX.STAGE_INFO.run3;
      const cols = [[0, 520, 460], [520, 120, 400], [640, 170, 340], [920, 140, 340], [1060, 170, 280], [1340, 180, 300], [1600, 420, 250]];
      this.solids = cols.map(([x, w, top], i) => ({ x, y: top, w, h: H + 40 - top, color: CONTAINER[i % CONTAINER.length], dock: i === 0 }));
      this.endX = 2020; this.goalX = 1900;
      this.frags = []; this.events = [6];
    }
  }

  class StageListen3 extends Stage2 {
    constructor(game) {
      super(game);
      this.id = 'listen3'; this.info = CX.STAGE_INFO.listen3;
      // 四步：左腳重（大聲）、右腳輕、左腳重、右腳拖一點點（間隔不平均）
      const steps = [[1.8, .85], [2.75, .4], [3.5, .9], [4.55, .42]];
      this.beats = steps.map(([time, vol]) => ({ time, hit: false, missed: false, vol }));
      this.finalStart = 4.55 + 1.1;
      for (let i = 0; i < 4; i++) this.beats.push({ time: this.finalStart + i * .8, hit: false, missed: false, vol: 1, final: i });
      this.COMBO_FRAGS = []; this.frags = [];
      this.finalWord = '……';        // 「就是現在」留給後面的選項
    }
  }

  class StageFire3 extends Stage3 {
    constructor(game) {
      super(game);
      this.id = 'fire3'; this.info = CX.STAGE_INFO.fire3;
      this.hoodName = '阿昊';
      this.endX = 1640; this.exitX = 1500; this.triggerX = 0;
      this.covers = [];
      this.crates = [720, 960, 1230].map((x, i) => ({ x, y: this.ground - (i === 1 ? 56 : 42), w: 44, h: i === 1 ? 56 : 42 }));
      this.solids = [{ x: -200, y: this.ground, w: this.endX + 400, h: 100 }, ...this.crates];
      this.frags = [];
      this.phase = 2; this.boomT = 0;     // 一開始就是爆炸後半段
    }
  }

  Object.assign(CX.STAGES, { run3: StageRun3, listen3: StageListen3, fire3: StageFire3 });
})(window.CX);
