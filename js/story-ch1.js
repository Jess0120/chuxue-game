/* =========================================================
 * story-ch1.js — 第 1 章〈碎片〉劇情資料
 *   ⚠ 第 1～4 章劇情為遊戲原創，非小說原作（劇本：小雅，僅供遊戲使用）。
 *   台詞取自《遊戲劇本　第 1 章〈碎片〉》，時間：2019/12/11，白浦港。
 *
 *   過場格式（在原本 img / text / who 之外新增）：
 *     bg      : 沒有插圖時用程式背景（js/backdrops.js 的 CX.BACKDROPS）
 *     note    : 畫面中央的紙條／剪報／簡訊；noteStyle = paper｜pen｜print｜sms
 *     card    : 黑底大字標題卡（text 留空時不顯示對話框，hold 秒後自動翻頁）
 *     choice  : 選項 [{ text, set, add, goto, cond }]；cond 不成立的選項不顯示
 *     cond    : 條件不成立就跳過這一格（例如 'trustDong>=1'）
 *     goto    : 這一格結束後跳到另一段過場；沒有 text 的 goto 格＝直接跳
 *     set/add : 改遊戲變數（engine.js 的 CX.vars）；item：取得道具
 *     frag    : 播到這一格時拾回記憶碎片（例如 'c1-5'）
 * ========================================================= */
(function (CX) {
  'use strict';

  CX.STAGE_INFO.c1 = { no: '第一章', name: '碎片' };

  /** 第 1 章記憶碎片（7 片）。編號 c1-1～c1-7，對應劇本的 1-1～1-7 */
  CX.MEMORIES.c1 = [
    { text: '照片上曾經形影不離的四個人，其中一個沒有臉。', lockedHint: '調查房間' },
    { text: '四手聯彈，高音部的那個人，翻譜總是慢半拍。', lockedHint: '調查房間' },
    { text: '新聞裡只有一個人坦承，另一個人沒有名字。', lockedHint: '調查房間' },
    { text: '是該想起來了吧？他在夢裡這樣說過，在紙上又說了一次。', lockedHint: '調查房間' },
    { text: '那段時間的事，能忘就讓它忘。可是我忘掉的，好像不只是我自己的事。', lockedHint: '打給媽媽' },
    { text: '他先認出來的是我的名字，我先認出來的是他的背影。', lockedHint: '港口' },
    { text: '李雨真，同學。只有一個人會在名字中間停那一拍。', lockedHint: '雨夜' },
  ];

  const C = CX.CUTSCENES;

  /* ---------- 銜接：第 0 章 → 第 1 章 ---------- */
  C.ch1_title = [
    { bg: 'white', text: '', sfx: 'a440', hold: 2.8 },
    { bg: 'black', card: '第一章　碎片', text: '', hold: 2.6 },
  ];

  /* ---------- 1-1　港邊旅社・清晨 ---------- */
  C.ch1_wake = [
    { bg: 'room', text: '我醒來的時候，還記得海水的溫度。' },
    { bg: 'room', text: '先是心臟的位置，再來是腹部，然後是背。我一處一處摸過去，沒有傷口，沒有血，連一點疼痛都沒有，只有睡衣被汗浸濕，貼在身上。' },
    { bg: 'room', text: '又是那樣的夢。' },
    { bg: 'room', text: '在夢裡，我也這樣醒來過一次，躲在貨櫃旁，以為自己逃過了，結果槍聲還是響起，有人替我擋下兩顆子彈，然後是火。' },
    { bg: 'room', text: '我坐起來，數自己的心跳。一分鐘七十二下，太快，但是很規律。' },
    { bg: 'room', text: '這一次，應該是真的醒了。' },
    { bg: 'window', text: '……就是那裡。', who: 'yu' },
    { bg: 'window', text: '我昨天傍晚才到這座城市，在那之前，我從來沒有來過白浦港。可是那個鏽掉的貨櫃，我在夢裡站過它的頂端，從那裡看出去，是一片汪洋。' },
  ];

  /* ---------- 1-2　旅社房間・紙箱（點擊調查） ----------
   *   紙箱 → 合照／節目單／剪報／舊手機 → 箱底紙條 → 門（離開房間）
   *   太長的話可以把 after 調掉、或刪掉其中一兩個物件（交接說明：可縮成三個）。 */
  const FOUR = ['photo', 'program', 'clipping', 'phone'];
  CX.EXPLORE = CX.EXPLORE || {};
  CX.EXPLORE.ch1_room = {
    bg: 'room', title: '港邊旅社・房間', hint: '點擊桌上的東西調查（全部調查完才能離開房間）',
    objects: [
      { id: 'box', kind: 'box', label: '紙箱', x: 560, y: 240, w: 200, h: 96, lines: [
        { bg: 'room', text: '紙箱是前天寄到琴行的，收件人寫我的名字，沒有寄件人，只有一個地址：白浦港，第七區。' },
        { bg: 'room', text: '我把它帶上火車的時候，還不知道自己為什麼要來。現在知道了，又好像更不知道了。' },
      ] },
      { id: 'photo', kind: 'photo', label: '合照', after: ['box'], x: 150, y: 352, w: 120, h: 80, lines: [
        { bg: 'room', note: '（一張洗出來的相片，邊角捲起）\n頂樓的欄杆前站著四個人，穿著同樣的制服，後面是水塔。\n最右邊那個人的臉被剪掉了，切口很整齊。', noteStyle: 'paper', text: '胖達……東宇……我。', who: 'yu' },
        { bg: 'room', note: '2008 秋，頂樓。\n胖達、東宇、雨真、阿昊。', noteStyle: 'pen', text: '背面有藍色原子筆寫的字，字跡圓圓胖胖的。' },
        { bg: 'room', text: '阿昊。' },
        { bg: 'room', text: '我念了兩次，舌頭知道這個名字，腦子卻不知道。照片裡的我笑得很開，一隻手勾著那個沒有臉的人的手臂。', frag: 'c1-1' },
      ] },
      { id: 'program', kind: 'program', label: '節目單', after: ['box'], x: 300, y: 360, w: 110, h: 70, lines: [
        { bg: 'room', note: '2003 年冬季發表會\n第七首　四手聯彈\n演出：李雨真、沈昊', noteStyle: 'paper', text: '一張對折的節目單，紙已經發黃。' },
        { bg: 'room', note: '2003 年冬季發表會\n第七首　四手聯彈\n演出：李雨真、沈昊', noteStyle: 'paper', text: '沈昊。' },
        { bg: 'room', sfx: 'fourhands', text: '我的手指自己動了起來，在桌面上彈出低音部的前四小節。那是我彈的聲部，旁邊應該還有一個人負責高音，也負責翻譜。他每次翻譜都慢半拍，被老師罵過好幾次。' },
        { bg: 'room', text: '我想不起他的臉，只記得那雙手，很白，指節上有凍瘡。', frag: 'c1-2' },
      ] },
      { id: 'clipping', kind: 'clipping', label: '剪報', after: ['box'], x: 440, y: 362, w: 110, h: 60, lines: [
        { bg: 'room', note: '高二生頂樓推擠，同學撞擊身亡\n另一人墜樓重傷\n\n延姓學生向警方坦承「是我推的」，全案依少年事件處理。', noteStyle: 'paper', text: '我讀了三遍。' },
        { bg: 'room', text: '延東宇。在夢裡，他擋在我前面，說他不允許任何人傷害我。他身後的那個人說，你，才是殺人犯。' },
        { bg: 'room', note: '（剪報右下角，很輕的鉛筆字）\n他沒有說謊，但也沒有說完。', noteStyle: 'pen', text: '剪報右下角有一行鉛筆字，很輕，幾乎被擦掉了。', frag: 'c1-3' },
      ] },
      { id: 'phone', kind: 'phone', label: '舊手機', after: ['box'], x: 590, y: 368, w: 46, h: 70, lines: [
        { bg: 'room', text: '一支銀色的摺疊手機，2009 年的款式。打開來螢幕是黑的，背面貼著一張已經褪色的熊貓貼紙。' },
        { bg: 'room', text: '這是胖達的手機。我不知道自己為什麼這麼確定，大概是那張貼紙，他什麼東西都要貼熊貓。' },
        { bg: 'room', text: '沒有電。充電孔是舊規格。', item: '胖達的手機（沒電）' },
      ] },
      { id: 'note', kind: 'note', label: '箱底的紙條', after: FOUR, x: 690, y: 372, w: 120, h: 50, lines: [
        { bg: 'room', note: '是該想起來了吧。', noteStyle: 'print', text: '紙箱底下壓著一張便條，字是印表機印的，一行字置中。' },
        { bg: 'room', text: '我把紙條放下，手在發抖。' },
        { bg: 'room', text: '這句話，我在夢裡聽過。他說完之後，就把我踹進了海裡。', frag: 'c1-4' },
      ] },
      { id: 'door', kind: 'door', label: '離開房間', exit: true, after: ['note'], x: 800, y: 70, w: 110, h: 250 },
    ],
  };

  /* ---------- 1-3　旅社走廊・電話（選項） ---------- */
  C.ch1_call = [
    { bg: 'hall', text: '媽，妳還記得一個叫沈昊的人嗎？學琴的。', who: 'yu' },
    { bg: 'hall', text: '電話那頭停了很久，久到我以為斷線了。' },
    { bg: 'hall', text: '……妳怎麼突然問這個。', who: 'mom' },
    { bg: 'hall', text: '還有延東宇。', who: 'yu' },
    { bg: 'hall', text: '雨真，醫生說過，那段時間的事，妳能忘就讓它忘。', who: 'mom' },
    { bg: 'hall', text: '', choice: [
      { text: '「我想知道東宇後來怎麼了。」', add: { trustDong: 1 }, goto: 'ch1_call_A' },
      { text: '「沈昊是不是找過我？」', add: { trustHao: 1 }, goto: 'ch1_call_B' },
    ] },
  ];
  C.ch1_call_A = [
    { bg: 'hall', text: '那孩子被判了……不是坐牢，是保護管束。後來就搬走了。他一次都沒有來找過妳。我本來以為他會來。', who: 'mom' },
    { bg: 'hall', text: '他走之前，在我們家樓下站了一個晚上，我沒有讓他上來。', who: 'mom' },
    { goto: 'ch1_call_end' },
  ];
  C.ch1_call_B = [
    { bg: 'hall', text: '……每年十二月都會寄一張卡片來。沒有寫回郵地址，只寫給妳。', who: 'mom' },
    { bg: 'hall', text: '我都收起來了。當年警察說，他可能是……我怕。', who: 'mom' },
    { bg: 'hall', text: '卡片上寫什麼？', who: 'yu' },
    { bg: 'hall', text: '我沒有拆。十張，都在妳房間的衣櫃上面。', who: 'mom' },
    { goto: 'ch1_call_end' },
  ];
  C.ch1_call_end = [
    { bg: 'hall', text: '雨真，妳現在在哪裡？', who: 'mom' },
    { bg: 'hall', text: '在工作。', who: 'yu' },
    { bg: 'hall', text: '我第一次對她說謊，說得很順。', frag: 'c1-5' },
  ];

  /* ---------- 1-4　白浦港・第七區大門（白天，選項） ---------- */
  C.ch1_port = [
    { bg: 'gate', sfx: 'keyHi', text: '我站在閘門外，閉上眼睛。' },
    { bg: 'gate', text: '起重機的鋼索，一秒震七下。貨櫃落地的悶響，從左邊數過來第三排。海浪拍上岸壁的聲音，比夢裡低了半個音。' },
    { bg: 'gate', text: '就是這裡。夢裡的聲音幾乎都是對的。' },
    { bg: 'gate', text: '既然聲音是對的，那個人也會在這裡。' },
    { bg: 'gateCrowd', text: '我先認出來的是背影。' },
    { bg: 'gateCrowd', text: '和夢裡一樣，和更久以前也一樣，那個走在前面，總是慢下來等我的背影。' },
    { bg: 'gateCrowd', text: '延東宇。', who: 'yu' },
    { bg: 'gateCrowd', text: '他停下來，沒有回頭。' },
    { bg: 'gateCrowd', text: '妳認錯人了。', who: 'dong' },
    { bg: 'gateCrowd', text: '你左邊的肩膀比右邊低。小學的時候，你幫胖達搬營養午餐的桶子，扭到以後就一直這樣。', who: 'yu' },
    { bg: 'gateCrowd', text: '我不知道這段記憶是從哪裡冒出來的，說出口的時候，連我自己都嚇了一跳。' },
    { bg: 'gate', text: '他終於轉過身。' },
    { bg: 'gate', text: '清秀的臉，比夢裡瘦一點，眼睛下面有很深的陰影。他看著我的樣子，很像在看一個不應該出現的東西。' },
    { bg: 'gate', text: '……妳不該來這裡。', who: 'dong' },
    { bg: 'gate', text: '有人寄東西給我，叫我來。', who: 'yu' },
    { bg: 'gate', text: '那就更不該來。', who: 'dong' },
    { bg: 'gate', text: '他的手在口袋裡握緊了，我看得出來，因為大衣的布料繃住了。' },
    { bg: 'gate', text: '我做了一個夢。', who: 'yu' },
    { bg: 'gate', text: '他的表情一下子變了。他還記得我會做那種夢。' },
    { bg: 'gate', text: '', choice: [
      { text: '把夢全部告訴他（港口、槍、刀、擋下的子彈、爆炸）', set: { toldDream: true }, add: { trustDong: 1 }, goto: 'ch1_port_A' },
      { text: '「沒什麼。只是一個夢。」', set: { toldDream: false }, goto: 'ch1_port_B' },
    ] },
  ];
  C.ch1_port_A = [
    { bg: 'gate', text: '我說了。說到他替我擋下兩顆子彈的時候，他沒有任何反應，好像那只是天氣預報。' },
    { bg: 'gate', text: '說到最後的爆炸，他抬頭看了一眼堆場深處，那裡有一個用鐵網圍起來的區域，裡面放著一排一排灰色的鋼瓶。' },
    { bg: 'gate', text: '夢裡，我有叫妳跑嗎？', who: 'dong' },
    { bg: 'gate', text: '有。', who: 'yu' },
    { bg: 'gate', text: '那就跑。不管發生什麼事。', who: 'dong' },
    { bg: 'gate', text: '那你呢？', who: 'yu' },
    { bg: 'gate', text: '他沒有回答。' },
    { goto: 'ch1_port_end' },
  ];
  C.ch1_port_B = [
    { bg: 'gate', text: '……是嗎。', who: 'dong' },
    { bg: 'gate', text: '他看著我，像是在等我說下去。我沒有說，他也就不問了。他從以前就是這樣，我不說，他就不問，然後自己去做決定。' },
    { bg: 'gate', text: '回去吧，搭今天的車。', who: 'dong' },
    { goto: 'ch1_port_end' },
  ];
  C.ch1_port_end = [
    { bg: 'gate', text: '雨真。', who: 'dong' },
    { bg: 'gate', text: '十年來第一次有人用這種聲音叫我的名字。' },
    { bg: 'gate', text: '寄東西給妳的人，妳不要見他。', who: 'dong' },
    { bg: 'gate', text: '他說完就走了，沒有說那個人是誰。' },
    { bg: 'gate', text: '可是他知道。', frag: 'c1-6' },
  ];

  /* ---------- 1-5　旅社房間・夜 ---------- */
  C.ch1_night = [
    { bg: 'roomNight', text: '巷口那家舊手機行的老闆找了二十分鐘，才找到一個新的萬用充電器。' },
    { bg: 'roomNight', sfx: 'boot', text: '開機畫面停在一隻像素熊貓上。' },
    { bg: 'roomNight', text: '收件匣裡只剩最後一則簡訊，寄件人存的是「阿昊」。' },
    { bg: 'roomNight', note: '阿昊\n2009/11/27　22:47\n胖達，對不起。幫我跟李雨真同學說，那首曲子我練不完了。', noteStyle: 'sms', text: '' , hold: 4.5 },
    { bg: 'roomNight', text: '李雨真同學。' },
    { bg: 'roomNight', text: '我看著那四個字，耳邊響起的卻是夢裡的聲音，低沈，帶著一點磁性，在名字和「同學」中間停一拍。' },
    { bg: 'roomNight', text: '「李雨真，同學。」', em: true },
    { bg: 'roomNight', text: '小時候在琴房，他總是這樣叫我，因為我第一次自我介紹的時候太緊張，說了「我叫李雨真同學」。他笑了一整個學期。' },
    { bg: 'roomNight', text: '阿昊……沈昊。', who: 'yu' },
    { bg: 'roomNight', text: '夢裡穿斗篷的那個人，是第四個人。' },
    { bg: 'roomNight', note: '通話紀錄\n2009/11/27　22:52\n撥出：東宇家　2 分 11 秒', noteStyle: 'sms', text: '胖達收到簡訊五分鐘後，打給東宇。' },
    { bg: 'roomNight', text: '而我在東宇家，接到那通電話的人不是我。我只記得東宇掛上電話以後的臉，還有我拚命拉住他的手。' },
    // 電話裡選了 A（問東宇）
    { bg: 'roomNight', cond: 'trustDong>=1', text: '我記得自己說：「你生病了，生病就應該在家休養。」' },
    { bg: 'roomNight', cond: 'trustDong>=1', text: '我記得他一句話都沒說。' },
    { bg: 'roomNight', cond: 'trustDong>=1', text: '我不記得那通電話裡，胖達說了什麼。' },
    // 電話裡選了 B（問沈昊）
    { bg: 'roomNight', cond: 'trustHao>=1', text: '十張卡片，十年，一年一張。每年十二月，在初雪之前。' },
    { bg: 'roomNight', cond: 'trustHao>=1', text: '他一直在等我拆開。' },
    { bg: 'roomNight', note: '阿昊　來電', noteStyle: 'sms', sfx: 'ring', shake: 3, text: '', hold: 2.6 },
    { bg: 'roomNight', note: '阿昊　來電', noteStyle: 'sms', text: '我盯著那四個字，按下接聽。' },
    { bg: 'roomNight', text: '電話那頭很安靜，只有呼吸聲，還有風聲，和我窗外聽到的是同一陣海風。' },
    { bg: 'roomNight', text: '妳終於開機了。', who: 'hao_v' },
    { bg: 'roomNight', text: '……阿昊。', who: 'yu' },
    { bg: 'roomNight', text: '他停了一下，像是很久沒有被人用這個名字叫過。' },
    { bg: 'roomNight', text: '妳想起來了多少？', who: 'hao_v' },
    { bg: 'roomNight', text: '你的名字。還有你的手。', who: 'yu' },
    { bg: 'roomNight', text: '那還不夠。', who: 'hao_v' },
    { bg: 'roomNight', text: '妳去問他。問他那天晚上，門是誰鎖的。', who: 'hao_v' },
    { bg: 'roomNight', text: '電話斷了。' },
    { bg: 'black', sfx: 'keyHi', text: '', hold: 2.4, frag: 'c1-7' },
  ];

  /* ---------- 第 2 章以後：製作中 ---------- */
  C.wip = [
    { bg: 'black', card: '第二章　頂樓', text: '第二章〈頂樓〉以後正在製作中。進度已存檔，之後可從標題畫面「繼續」。' },
  ];
})(window.CX);
