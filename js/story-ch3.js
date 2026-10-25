/* =========================================================
 * story-ch3.js — 第 3 章〈港口〉劇情資料
 *   ⚠ 第 1～4 章劇情為遊戲原創，非小說原作（劇本：小雅，僅供遊戲使用）。
 *   台詞取自《遊戲劇本　第 3 章〈港口〉》。2019/12/13　22:40～第七區的午夜。
 *   序章的夢，在現實裡重演一次；這一次，可以不照著走。
 *
 *   本章新增的過場欄位（格式其餘同 story-ch1.js／story-ch2.js）：
 *     diff       : 劇本裡的粗體句（與夢不同的地方）。換成暖色字，翻頁前多停一下
 *     tint       : 'frost' ＝跟序章同一個構圖，地上多了一層很薄的雪
 *     flip       : 插圖左右反轉重用（結局④的 p22）
 *     flash      : 進入這一格時閃一下的顏色（例如 '#9fc0ff' 藍光）
 *     cardSub    : 標題卡底下置中的一行小字（中間結局用）
 *     choiceNote / choiceNoteIf : 選項上方的一行小字，以及顯示條件
 *   FLOW 新增步驟：{ type:'retry', to:'存檔點 id', set:{…} } ＝ Game Over 回到存檔點（變數還原）
 *   縮短版關卡（貨櫃奔跑／腳步聲／火海）在 js/stage-ch3.js。
 * ========================================================= */
(function (CX) {
  'use strict';

  CX.STAGE_INFO.c3 = { no: '第三章', name: '港口' };

  /** 第 3 章記憶碎片（5 片）。編號 c3-1～c3-5，對應中間結局①～④與 3-2 */
  CX.MEMORIES.c3 = [
    { text: '這一次，沒有冷風把我叫醒。', lockedHint: '中間結局①　沉海' },
    { text: '夢裡沒有告訴我，回頭的時候，要先找誰。', lockedHint: '中間結局②　火海' },
    { text: '我站到門的這一邊，晚了十年。', lockedHint: '中間結局③　門內' },
    { text: '這一次，我沒有猶豫。他也沒有躲。', lockedHint: '中間結局④　刀' },
    { text: '左腳重，右腳輕，拖一點點。那是骨頭斷過、又沒有長好的腳步。', lockedHint: '第七區' },
  ];

  Object.assign(CX.CHARACTERS, {
    hao_h: { name: '沈昊', portrait: 'hood', color: '#b9c9dc' },   // 還戴著斗篷帽子的沈昊（3-2、3-3、3-5）
  });

  const C = CX.CUTSCENES;
  /** 旅社場景：風雪裡夾著雨 */
  const INN = o => Object.assign({ bg: 'roomNight' }, o);
  /** 3-2：跟序章同一個構圖，地上一層薄雪 */
  const FR = o => Object.assign({ tint: 'frost' }, o);
  /** 中間結局的黑底標題卡 */
  const ENDCARD = (card, sub, frag, o) => Object.assign({ bg: 'black', card, cardSub: sub, text: '', hold: 4.2, frag }, o);

  C.ch3_title = [
    { bg: 'black', text: '', hold: 1.2, set: { ch3Started: true } },   // 從這裡開始，圖鑑「重聽門後」不再改存檔的 heardCount
    { bg: 'black', card: '第三章　港口', text: '', hold: 2.6 },
  ];

  /* ---------- 3-1　旅社（22:40） ---------- */
  C.ch3_inn = [
    INN({ text: '十點四十分。窗外的雪裡夾著雨，打在玻璃上，一下一下。', weather: 'snow' }),
    INN({ text: '摺疊手機插著充電線，紅色的小燈亮著。' }),
    INN({ note: '阿昊\n十一點半。第七區，最裡面那排。一個人來。', noteStyle: 'sms', sfx: 'ring', text: '', hold: 3.8 }),
    INN({ text: '十年前，他也是在這個時間傳簡訊給胖達。' }),
    INN({ text: '摺疊手機的電還沒充滿。我把它留在桌上，帶上自己的手機。' }),
    INN({ text: '', choice: [
      { text: '打給東宇：「我要去。」', set: { goneAlone: false }, add: { trustDong: 1 }, goto: 'ch3_inn_call' },
      { text: '不打給任何人，一個人去。', set: { goneAlone: true }, add: { trustHao: 1 }, goto: 'ch3_inn_alone' },
    ] }),
  ];
  C.ch3_inn_call = [
    INN({ text: '……我就知道。', who: 'dong' }),
    INN({ text: '走靠海那一側，不要進鋼瓶區。我在那裡等。', who: 'dong' }),
    INN({ text: '東宇，夢裡你中了兩槍。', who: 'yu' }),
    INN({ text: '那就不要讓他開第三槍。', who: 'dong' }),
    { goto: 'ch3_inn_knife' },
  ];
  C.ch3_inn_alone = [
    INN({ text: '我看著通訊錄裡東宇的名字，最後還是把手機收進口袋，沒有撥出去。' }),
    INN({ text: '如果打了，就會有人替我做決定。' }),
    INN({ text: '這一次，我想自己走到那裡。' }),
    { goto: 'ch3_inn_knife' },
  ];
  C.ch3_inn_knife = [
    INN({ text: '出門前，我把瑞士刀放進外套口袋。紅色的刀柄。' }),
    INN({ text: '是爸爸以前的。我出門一定會帶著它。夢裡的我知道的事，現實的我也知道。' }),
  ];

  /* ---------- 3-2　第七區（23:30）〔存檔點〕 ---------- */
  C.ch3_port = [
    FR({ img: 'p01', text: '在午夜港口，我站在夢裡站過的地方。', weather: 'snow' }),
    FR({ img: 'p02', text: '陌生城市的街口，空無一人，時間彷彿靜止。差別只在於，這一次，我知道自己是為了什麼來的。' }),
    FR({ img: 'p04', text: '一陣風颳過來，我縮到貨櫃旁邊，跟夢裡同一個位置。' }),
    FR({ img: 'p04', text: '我發現自己在數。風，七秒一陣。海浪，比昨天又低了一點。還有腳步聲，從右邊，左腳重，右腳輕，左腳拖了一點點。', sfx: 'step' }),
    FR({ img: 'p04', text: '那是骨頭斷過、又沒有長好的腳步。' }),
    FR({ img: 'p05', text: '咻——碰——', sfx: 'shot', shake: 8 }),
    FR({ img: 'p06', text: '還想去哪裡，', who: 'hao_h' }),
    FR({ img: 'p07', text: '妳應該明白，自己身處在一個什麼樣的狀況下，真是可惜，如果當時我們角色對調，或許能夠有好下場吧，', who: 'hao_h' }),
    FR({ img: 'p08', text: '李雨真，同學。', who: 'hao_h' }),
    FR({ img: 'p08', text: '他抓住我的手腕。手很冷，跟琴房裡那雙手一樣白。' }),
    FR({ img: 'p08', text: '這一次，我回頭了。', em: true }),
    FR({ img: 'p08', text: '阿昊。', who: 'yu', frag: 'c3-5' }),
    FR({ img: 'p08', text: '他的手抖了一下。斗篷的帽子底下，我只看得到他的嘴角，停在一個很難看的弧度。' }),
    FR({ img: 'p08', text: '……妳記得了。', who: 'hao_h' }),
    FR({ img: 'p08', text: '記得多少？名字？手？還是只記得我在門後面打死了胖達？', who: 'hao_h' }),
    FR({ img: 'p08', text: '', choiceNote: '夢裡的路，已經走過一次了。', choiceNoteIf: 'dreamRetry', choice: [
      { text: '甩開他的手，往貨櫃最上層奔跑。（照著夢走）', set: { ran3: true } },
      { text: '不跑，看著他。', set: { ran3: false }, add: { trustHao: 1 } },
    ] }),
  ];

  /* ---------- 3-3　貨櫃最上層（照著夢走） ---------- */
  C.ch3_run = [
    FR({ img: 'p09', text: '我沒有回話，只是甩開他的手，拚命往上跑。' }),
    FR({ img: 'p09', text: '跟夢裡一樣。' }),
  ];
  C.ch3_top = [
    { img: 'p11', text: '前方是一片汪洋。我拿出口袋裡的瑞士刀，閉上眼睛。' },
    { img: 'p13', text: '左腳重，右腳輕，拖一點點。', sfx: 'step' },
    { img: 'p13', text: '一步，一步，慢慢靠近。', sfx: 'step' },
  ];
  C.ch3_knife = [
    { img: 'p13', text: '3　2　1', hold: 1.6 },
    { img: 'p14', text: '', choice: [
      { text: '「就是現在。」轉身刺。', set: { threwKnife: false } },
      { text: '把刀丟進海裡。', set: { threwKnife: true }, add: { trustHao: 1 } },
    ] },
  ];
  /** 刺了，但現實和夢不一樣：東宇趕到 */
  C.ch3_stab = [
    { img: 'p15', text: '刀尖沒入他的腹部，我手上一熱。', shake: 6, set: { stabbed: true } },
    { img: 'p18', text: '沈昊低頭看了一眼，笑了。' },
    { img: 'p18', text: '妳知道壞人跟好人的差別嗎，壞人不會憐憫，也不會有感情，更不會猶豫，要刺，就應該一刀斃命，需要示範給妳看嗎。', who: 'hao_h' },
    { img: 'p18', text: '他握住刀柄。' },
    { bg: 'gasCage', text: '照明塔的光突然打在我們身上。', flash: '#fff4d8' },
    { bg: 'gasCage', text: '阿昊！', who: 'dong' },
  ];

  /* ---------- 中間結局①　沉海（Game Over → 回 3-2 存檔點） ---------- */
  C.ch3_end1 = [
    { img: 'p15', text: '心裡倒數過後，我轉身向那個人撲了過去——', shake: 6 },
    { img: 'p18', text: '妳知道壞人跟好人的差別嗎？壞人不會憐憫，也不會有感情，更不會猶豫。', who: 'hao_h' },
    { img: 'p21', text: '是該想起來了吧？', who: 'hao_h' },
    { img: 'p22', text: '噗通——', sfx: 'splash' },
    { img: 'p23', text: '隨著自己慢慢沉入海底，我才發現，這一次沒有冷風會把我叫醒。', em: true },
    { img: 'p24', text: '', hold: 1.8, lock: true },
    ENDCARD('中間結局①　沉海', '她什麼都沒有改變。', 'c3-1', { sfx: 'keyHi', hold: 4.6 }),
  ];

  /* ---------- 3-4　貨櫃之間（不跑／把刀丟進海裡） ---------- */
  C.ch3_talk = [
    { bg: 'yardNight', text: '刀落進海裡，聲音很小，在浪聲裡只是一個休止符。', cond: 'threwKnife', sfx: 'splash', weather: 'snow' },
    { bg: 'yardNight', text: '……妳連刺都不刺了？', who: 'hao_h', cond: 'threwKnife' },
    { bg: 'yardNight', text: '夢裡的妳，刺得很準。', who: 'hao_h', cond: 'threwKnife' },
    { bg: 'yardNight', text: '雪越下越大。', weather: 'snow' },
    { bg: 'yardNight', text: '他把斗篷脫下來。' },
    { bg: 'yardNight', text: '大面積的傷疤在照明塔的光底下若隱若現，從左邊的臉頰一路爬到脖子，再鑽進衣領裡。左手的手指有兩根彎不直了。' },
    { bg: 'yardNight', text: '二樓走廊的採光罩。玻璃，還有鐵架。', who: 'hao' },
    { bg: 'yardNight', text: '醫生說，我能活下來是因為下面有那片採光罩。我說，那是因為我連死都死不好。', who: 'hao' },
    { bg: 'yardNight', text: '你那時候……是要跳的。', who: 'yu' },
    { bg: 'yardNight', text: '我跳了兩次。第一次，胖達把我拉住。第二次，就沒有人了。', who: 'hao' },
    { bg: 'yardNight', text: '李雨真，同學。我問妳，那天晚上，妳在門外聽到了什麼？', who: 'hao' },
    // 第 2 章節奏關「門後」有沒有聽出來
    { bg: 'yardNight', text: '你在數拍子。三十下，停兩下。', who: 'yu', cond: 'heardCount' },
    { bg: 'yardNight', text: '他的表情碎掉了，不是傷疤底下那張臉，是更裡面的東西。', cond: 'heardCount' },
    { bg: 'yardNight', text: '……十年。', who: 'hao', cond: 'heardCount' },
    { bg: 'yardNight', text: '警察拿妳的筆錄問我，為什麼要打他。我說我在救他，他們說，那為什麼李同學聽到的是打人？', who: 'hao', cond: 'heardCount' },
    { bg: 'yardNight', text: '如果當時我們角色對調，門外的是我，門裡的是妳，我會聽得出來。我一定會聽得出來，然後我會替妳作證。', who: 'hao', cond: 'heardCount', add: { trustHao: 1 }, sfx: 'trust' },
    { bg: 'yardNight', text: '我聽到……有人在敲。很重。', who: 'yu', cond: '!heardCount' },
    { bg: 'yardNight', text: '對，所以是我打死了他。妳到現在，還是這樣聽的。', who: 'hao', cond: '!heardCount' },
    { bg: 'yardNight', text: '他笑了一聲，把槍舉了起來。', cond: '!heardCount' },
    { bg: 'yardNight', text: '雪地上，有腳步聲跑過來。', sfx: 'step' },
    { bg: 'yardNight', text: '他來了。他每次都會來。', who: 'hao' },
  ];

  /* ---------- 3-5　鋼瓶區前（粗體句＝與夢不同：diff） ---------- */
  C.ch3_gas = [
    { img: 'p27', text: '槍聲響起。一個熟悉的身影把我緊緊抱住。', sfx: 'shot', shake: 6 },
    { img: 'p28', text: '我建議你放下槍吧，因為從現在起，我不允許任何人傷害她。', who: 'dong' },
    { img: 'p29', text: '不允許，這句話是說給弱勢的一方聽的，但我想你還沒搞清楚狀況。', who: 'hao_h' },
    { img: 'p29', text: '槍聲再度響起，他沒有躲。', sfx: 'shot', shake: 6 },
    { img: 'p31', text: '你中彈了！為什麼不躲，你根本用不著保護我，', who: 'yu' },
    { img: 'p31', text: '你明明知道這是夢裡的事，為什麼還要照著走。', who: 'yu', diff: true },
    { img: 'p32', text: '夢裡的我說「我們又不認識」。現實裡的我認識他，所以這句話說不出口。', diff: true },
    { img: 'p33', text: '記得嗎，至少在我面前，妳可以不用擔心受傷.....', who: 'dong' },
    { img: 'p33', text: '他話還沒說完，第二顆子彈就打在他的背上。', sfx: 'shot', shake: 8 },
    { img: 'p34', text: '當年那個跟在我身後的小孩，又一次替我擋下了兩發子彈，' },
    { img: 'p34', text: '跟夢裡一模一樣。夢裡有人倒下，現實裡就一定有人倒下。', diff: true },
    { bg: 'gasCage', text: '阿昊按著腹部，我的刀還插在那裡。他開槍的手在抖。', diff: true, cond: 'stabbed' },
    { bg: 'gasCage', text: '我說過了，她是我的人。', who: 'dong' },
    { bg: 'gasCage', text: '他撿起地上一片碎掉的照明燈玻璃，劃過阿昊的頸側。', sfx: 'metal', flash: '#e8f0ff' },
    { bg: 'gasCage', text: '這麼多年，你還是沒變，延東宇，就是這種個性，他們才會離開，你不要忘了，那次事件中，你，才是殺人犯。', who: 'hao_h' },
    { bg: 'gasCage', text: '東宇的嘴唇動了一下。那一秒半，又出現了。', diff: true, cond: 'askedMore' },
    { img: 'p40', text: '妳相信我嗎？看準時機逃跑，然後，保護好自己。', who: 'dong' },
    { bg: 'gasCage', text: '他用一隻手臂把我護在後面。' },
    { bg: 'gasCage', text: '然後，我聽到了。' },
    { bg: 'gasCage', text: '嘶——', sfx: 'hiss', hold: 2 },
    { bg: 'gasCage', text: '很細的聲音，從他背後的鐵網裡傳出來。一個比降 B 還低一點的音，一直沒有停。' },
    { bg: 'gasCage', text: '是瓦斯。他在跟阿昊說話的時候，已經把閥門打開了。', diff: true },
    { bg: 'gasCage', text: '我告訴過他夢裡有爆炸。他沒有想辦法讓爆炸不要發生，他想的是，怎麼讓爆炸只帶走他們兩個。', diff: true, cond: 'toldDream' },
    { bg: 'gasCage', text: '', choice: [
      { text: '相信他，逃。', set: { midEnd: 2 } },
      { text: '不逃，站到兩人中間。', set: { midEnd: 3 }, cond: 'heardCount' },        // 沒有聽出拍子：這個選項不出現
      { text: '握緊刀，刺向阿昊。', set: { midEnd: 4 }, cond: '!threwKnife' },
      { text: '撿起地上的玻璃，刺向阿昊。', set: { midEnd: 4 }, cond: 'threwKnife' },
    ] },
  ];

  /* ---------- 中間結局②　火海 ---------- */
  C.ch3_end2a = [
    { img: 'p41', text: '你想要報仇，來吧，時機到了。', who: 'dong' },
    { img: 'p41', text: '我聽懂了他的暗示，拔腿就往遠處跑。' },
    { img: 'p41', text: '身後，阿昊扣下了扳機。', sfx: 'shot' },
  ];
  C.ch3_end2b = [
    { img: 'p42', text: '', sfx: 'boom', shake: 12, flash: '#ffffff', hold: 1.4 },
    { img: 'p43', text: '我停下腳步，身後全被大火覆蓋。', flash: '#ff9a40' },
    { img: 'p43', text: '這是夢裡已經發生過一次的畫面，所以我知道接下來會是什麼。' },
    { img: 'p43', text: '可是夢裡沒有告訴我，我回頭的時候，要先找誰。', diff: true },
    ENDCARD('中間結局②　火海', '', 'c3-2'),
  ];

  /* ---------- 中間結局③　門內 ---------- */
  C.ch3_end3 = [
    { bg: 'gasCage', text: '我沒有跑。' },
    { bg: 'gasCage', text: '我從東宇的手臂底下鑽出去，站到他們兩個中間，背對著東宇，面對著槍口。' },
    { bg: 'gasCage', text: '阿昊。', who: 'yu' },
    { bg: 'gasCage', text: '那天晚上，你在數拍子。二十八、二十九、三十。停兩下，再數一次。', who: 'yu' },
    { bg: 'gasCage', text: '你數了很久。我在外面一直喊開門，你沒有停。', who: 'yu' },
    { bg: 'gasCage', text: '我聽見了。我只是，晚了十年。', who: 'yu' },
    { bg: 'gasCage', text: '槍口在抖。' },
    { bg: 'gasCage', text: '……妳現在才站到門這邊來。', who: 'hao_h' },
    { bg: 'gasCage', text: '阿昊，放下。這裡全是瓦斯。', who: 'dong' },
    { bg: 'gasCage', text: '沈昊看了一眼鐵網，又看了一眼東宇，然後笑了，笑得很輕。' },
    { bg: 'gasCage', text: '所以你又決定好了。連我要怎麼死，都決定好了。', who: 'hao_h' },
    { bg: 'gasCage', text: '他按著脖子的那隻手鬆開，槍垂了下來。' },
    { bg: 'gasCage', text: '可是他的手指沒有離開扳機。他在抖，抖得跟十七歲那年在欄杆外面一樣。' },
    { bg: 'gasCage', text: '', sfx: 'shot', shake: 8, flash: '#7fb0ff', hold: 1.6 },   // 走火打在地上：火花，鐵網那邊閃出一道藍光
    ENDCARD('中間結局③　門內', '', 'c3-3'),
  ];

  /* ---------- 中間結局④　刀 ---------- */
  C.ch3_end4 = [
    { bg: 'gasCage', text: '延東宇叫我跑，我沒有跑。' },
    { bg: 'gasCage', text: '我握緊手裡的東西，從他身後衝出去。' },
    { bg: 'gasCage', text: '3　2　1，就是現在。', sfx: 'step' },
    { img: 'p15', text: '這一次，我沒有猶豫。', diff: true, shake: 6 },
    { img: 'p18', text: '刺進去的時候，阿昊沒有躲。他低頭看著我的手，好像在看一首終於練完的曲子。' },
    { img: 'p18', text: '……壞人不會猶豫。', who: 'hao_h' },
    { img: 'p18', text: '原來角色對調，是這種感覺。' },
    { img: 'p21', text: '他往後退了一步，兩步。腳下是港口的岸壁，再往後就是海。' },
    { img: 'p21', text: '阿昊——', who: 'yu' },
    { img: 'p21', text: '他沒有抓住我伸出去的手。' },
    { img: 'p22', flip: true, text: '噗通——', sfx: 'splash' },
    { bg: 'gasCage', text: '東宇在我身後倒下。鐵網裡的嘶嘶聲還在響，他伸手把閥門轉緊，轉到一半，就沒有力氣了。', sfx: 'hiss' },
    ENDCARD('中間結局④　刀', '', 'c3-4', { set: { trustHao: 0 } }),
  ];

  /* ---------- 第 4 章：製作中 ---------- */
  C.wip4 = [
    { bg: 'black', card: '第四章　初雪', text: '第四章〈初雪〉正在製作中。進度已存檔，之後可從標題畫面「繼續」。' },
  ];
})(window.CX);
