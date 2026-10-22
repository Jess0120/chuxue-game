/* =========================================================
 * story.js — 劇情資料
 *   文字改編自原著〈初雪〉。為了遊戲節奏有刪減，
 *   並將較血腥的描寫改為點到為止。
 *   每一格：img = 插圖（assets/panels/）、text = 旁白或台詞、
 *           who = 說話者（對應 CHARACTERS，留空則為旁白）
 * ========================================================= */
(function (CX) {
  'use strict';

  /** 角色名牌與頭像 */
  CX.CHARACTERS = {
    yu:     { name: '李雨真', portrait: 'yu',     color: '#c9d4ff' },
    dong:   { name: '延東宇', portrait: 'dong',   color: '#ffd9a8' },
    dong_q: { name: '？？？', portrait: 'dong',   color: '#ffd9a8' },
    hood:   { name: '斗篷男', portrait: 'hood',   color: '#d0d0d8' },
    yu_s:   { name: '李雨真', portrait: 'yu_s',   color: '#ffd0dc' },
    dong_s: { name: '延東宇', portrait: 'dong_s', color: '#ffe2b8' },
  };

  /** 各段過場劇情 */
  CX.CUTSCENES = {
    prologue: [
      { img: 'p01', text: '在午夜港口醒來，眺望陌生城市街口。' },
      { img: 'p02', text: '空無一人，時間彷彿靜止，冷清，還不足以形容。' },
      { img: 'p04', text: '我是為了什麼逃離，又為了什麼漂泊……細想自己的曾經，在遙遠的，也就記不清了。' },
      { img: 'p05', text: '寂寥黑暗中，一陣槍響划過片刻寧靜。', sfx: 'shot', shake: 8 },
      { img: 'p06', text: '還想去哪裡，', who: 'hood' },
      { img: 'p07', text: '妳應該明白，自己身處在一個什麼樣的狀況下。', who: 'hood' },
      { img: 'p08', text: '李雨真，同學。', who: 'hood' },
      { img: 'p09', text: '我沒有回話，只是甩開他的手，拼命往貨櫃最上層奔跑。' },
    ],
    after1: [
      { img: 'p11', text: '前方映入眼簾的，是一片汪洋。' },
      { img: 'p12', text: '我默默拿起藏在口袋裡的瑞士刀，' },
      { img: 'p13', text: '閉上眼睛，仔細聆聽向我一步步慢慢靠近的腳步聲。也許是學過鋼琴的緣故，聽力比其他人都還敏銳。' },
    ],
    after2: [
      { img: 'p14', text: '「就是現在。」' },
      { img: 'p15', text: '心裡倒數過後，我轉身向那個人撲了過去——', shake: 6 },
      { img: 'p18', text: '妳知道壞人跟好人的差別嗎？壞人不會憐憫，也不會有感情，更不會猶豫。', who: 'hood' },
      { img: 'p21', text: '是該想起來了吧？', who: 'hood' },
      { img: 'p22', text: '噗通——', sfx: 'splash' },
      { img: 'p23', text: '隨著自己慢慢沉入海底，心情也逐漸平息下來，' },
      { img: 'p24', text: '再度閉上眼睛，也許這次，將永遠沈睡。' },
      { img: 'p25', text: '一陣冷風催促我醒了過來，依然像最開始一樣躲在貨櫃旁。' },
      { img: 'p26', text: '撫摸著自己，沒有疼痛，沒有傷口，難道是幻影，或是，預知！？' },
      { img: 'p27', text: '下一秒，槍聲還是響起。只是這次，一個熟悉的身影將我緊緊抱住。', sfx: 'shot' },
      { img: 'p28', text: '我建議你放下槍吧，因為從現在起，我不允許任何人傷害她。', who: 'dong_q' },
      { img: 'p29', text: '不允許，這句話是說給弱勢的一方聽的，但我想你還沒搞清楚狀況。', who: 'hood' },
      { img: 'p31', text: '你中彈了！為什麼不躲……', who: 'yu' },
      { img: 'p32', text: '你根本用不著保護我，我對你有那麼重要嗎，我們又不認識。', who: 'yu' },
      { img: 'p33', text: '記得嗎，至少在我面前，妳可以不用擔心受傷……', who: 'dong_q' },
      { img: 'p34', text: '延東宇，腦海中閃過這個名字。' },
      { img: 'p40', text: '妳相信我嗎？看準時機逃跑，然後，保護好自己。', who: 'dong' },
    ],
    after3: [
      { img: 'p41', text: '你想要報仇，來吧，時機到了。', who: 'dong' },
      { img: 'p42', text: '隨之而來的，是一陣爆炸聲。', sfx: 'boom', shake: 12 },
      { img: 'p43', text: '我停下腳步，身後全被大火覆蓋。難道我又，再次害了人嗎……夢境的出現，只是悲劇的開始。' },
      { img: 'p44', text: '雨水如石頭般沈重，雲像是被上了一層深灰色染料，暈開一片陰霾。', year: true },
      { img: 'p45', text: '你生病了，生病就應該在家休養，而且哪有人大半夜的還跑去學校。', who: 'yu' },
      { img: 'p46', text: '東宇沒有回話，只是用力把我推開後衝出門口，往學校跑去。' },
      { img: 'p47', text: '那場夢真實到寧可相信，也不願向命運開賭盤。我追了上去——' },
    ],
    after4: [
      { img: 'p48', text: '難道，真的發生了，夢境與現實交疊……出現在眼前的，卻只有坐在頂樓門前，絕望的他。' },
      { img: 'p49', text: '隔著門的距離，耳邊傳來孱弱的呼救，緊接著，是一陣一陣沉悶的聲響。' },
      { img: 'p50', text: '東宇，那……那，現在是什麼情況。', who: 'yu' },
      { img: 'p50', text: '來不及了，一切……', who: 'dong' },
      { img: 'p51', text: '開門，開門……\n喊到嗓音沙啞，也再不會有人回答。', who: 'yu' },
      { img: 'p52', text: '我們等到警衛趕來開門，曾經形影不離的四個人，只剩下孤身一人。' },
      { img: 'p53', text: '東宇跪在一旁，眼神放空，咆哮。' },
      { img: 'p54', text: '之後我們分別被警察帶走，這是我和他，最後一次。' },
    ],
    ending: [
      { img: 'p55', text: '彷彿做了一個很久的夢，我依然記得那一天。從相遇開始，或許，就是一場意外。' },
      { img: 'p56', text: '同學妳好，我叫延東宇，旁邊這位是胖達，我們是很好的朋友，不介意的話，認識一下吧。', who: 'dong_s' },
      { img: 'p57', text: '嗯，我叫。', who: 'yu_s' },
      { img: 'p58', text: '李雨真。', who: 'yu_s' },
    ],
  };

  /** 每章開頭的標題卡與操作說明 */
  CX.STAGE_INFO = {
    1: { no: '第一章', name: '午夜港口', goal: '往貨櫃最上層奔跑，別被身後的黑影追上！',
         keys: '← → 移動　　↑ / 空白鍵 跳躍', touch: '◀ ▶ 移動　　跳 跳躍' },
    2: { no: '第二章', name: '聆聽', goal: '閉上眼睛。當腳步聲的波紋與圓環重疊時按下！',
         keys: '空白鍵 / Enter 按下', touch: '點擊畫面' },
    3: { no: '第三章', name: '看準時機', goal: '趁斗篷男注意東宇時移動；紅光掃來時停下或躲進陰影，最後逃離火海！',
         keys: '← → 移動　　↑ / 空白鍵 跳躍', touch: '◀ ▶ 移動　　跳 跳躍' },
    4: { no: '第四章', name: '2009・雨夜', goal: '追上東宇！跳過水窪與障礙物，趕往學校。',
         keys: '↑ / 空白鍵 跳躍（長按跳更高）', touch: '點擊畫面或按「跳」跳躍' },
  };

  /** 遊戲流程：依序執行 */
  CX.FLOW = [
    { type: 'cut', id: 'prologue', bgm: 'night' },
    { type: 'stage', id: 1 },
    { type: 'cut', id: 'after1', bgm: 'night' },
    { type: 'stage', id: 2 },
    { type: 'cut', id: 'after2', bgm: 'night' },
    { type: 'stage', id: 3 },
    { type: 'cut', id: 'after3', bgm: 'rain' },
    { type: 'stage', id: 4 },
    { type: 'cut', id: 'after4', bgm: 'rain' },
    { type: 'cut', id: 'ending', bgm: 'snow', snow: true },
    { type: 'end' },
  ];

  /** 需要預先載入的圖片清單 */
  CX.assetList = function () {
    const set = new Set(['p11', 'p59']);
    Object.values(CX.CUTSCENES).forEach(list => list.forEach(s => set.add(s.img)));
    const list = [...set].map(k => [k, `assets/panels/${k}.jpg`]);
    ['yu', 'dong', 'hood', 'yu_s', 'dong_s'].forEach(k => list.push(['pt_' + k, `assets/portraits/${k}.jpg`]));
    return list;
  };
})(window.CX);
