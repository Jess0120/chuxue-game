/* =========================================================
 * story-ch4.js — 第 4 章〈初雪〉劇情資料
 *   ⚠ 第 1～4 章劇情為遊戲原創，非小說原作（劇本：小雅，僅供遊戲使用）。
 *   台詞取自《遊戲劇本　第 4 章〈初雪〉》。2019/12/12 深夜～12/14，白浦港下了今年第一場雪。
 *   結構：4-1 分歧（火場的最後一分鐘）→ 4-2 語音留言（共通）→ 4-3 結局 A／B／C
 *         → 4-4 尾聲・初雪（共通）→〔延伸〕原點（非正典，拾回全部碎片才播放）
 *
 *   路線判定（承接第 3 章，FLOW 在 story.js）：
 *     midEnd 2 火海：trustDong ≥ 3 → A 背影，否則 → C 孤身一人
 *     midEnd 3 門內：trustHao  ≥ 3 → B 門內，否則 → C 孤身一人
 *     midEnd 4 刀  ：固定 → A 背影（4-1A'）
 *   4-1 的第一格會設定 ending：1＝A、2＝B、3＝C，之後的語音留言地點、結局、尾聲最後一行都看它。
 *   本章新增的過場欄位：tint 'soft' ＝尾聲的柔和白藍色調（格式其餘同 story-ch3.js）
 *   B、C 路線的奔跑關（Stage4 縮短版）在 js/stage-ch4.js。
 * ========================================================= */
(function (CX) {
  'use strict';

  CX.STAGE_INFO.c4 = { no: '第四章', name: '初雪' };

  /** 第 4 章記憶碎片（4 片）。c4-1 語音留言（必得），c4-2～c4-4 對應結局 A／B／C */
  CX.MEMORIES.c4 = [
    { text: '我先推的。他說了十年，對著一個死了十年的人。', lockedHint: '語音留言' },
    { text: '我第一次站在你前面，卻讓第四個人一個人沉進了海裡。', lockedHint: '結局 A　背影' },
    { text: '這一次，門裡的人被拉了出來，站在門外的換成了他。', lockedHint: '結局 B　門內' },
    { text: '四個人，只剩下孤身一人。這一次，是我。', lockedHint: '結局 C　孤身一人' },
  ];

  /** 結局名稱（結局畫面與圖鑑用）。ending 變數：1＝A、2＝B、3＝C */
  CX.ENDINGS = {
    1: { key: 'A', name: '結局 A　背影', sub: '保護東宇' },
    2: { key: 'B', name: '結局 B　門內', sub: '救下第四人' },
    3: { key: 'C', name: '結局 C　孤身一人', sub: '兩人都救不成' },
  };

  Object.assign(CX.CHARACTERS, {
    hao_m: { name: '沈昊（留言）', portrait: null, color: '#b9c9dc' },   // 語音信箱裡的聲音
    vmail: { name: '語音信箱', portrait: null, color: '#9aa4b8' },
  });

  const C = CX.CUTSCENES;
  /** 結局的黑底標題卡 */
  const ENDCARD = (card, frag, o) => Object.assign({ bg: 'black', card, text: '', hold: 4.2, frag }, o);
  /** 尾聲：柔和的白藍色調 */
  const SOFT = o => Object.assign({ tint: 'soft' }, o);

  /* ---------- 4-0　標題卡：雪第一次真正飄下來 ---------- */
  C.ch4_title = [
    { bg: 'black', text: '', hold: 1.0 },
    { bg: 'black', card: '第四章　初雪', text: '', hold: 3.2, weather: 'snow', sfx: 'a440' },
  ];

  /* ---------- 4-1A　來自②火海，trustDong ≥ 3 ---------- */
  C.ch4_A = [
    { bg: 'seawallFire', text: '他叫我跑的時候，我就跑了，一秒都沒有猶豫。', set: { ending: 1 } },
    { bg: 'seawallFire', text: '所以我跑得夠遠，遠到爆炸只把我推倒在雪地上。', shake: 10, sfx: 'boom', flash: '#ffd8a0' },
    { bg: 'seawallFire', text: '我回頭，先找的是他。' },
    { bg: 'seawallFire', text: '他在岸壁邊上，半個身子泡在海裡，跟他說好的一樣，在槍聲響起之前就跳了下去。他早就算好了，算好爆炸會往哪裡炸，算好我會往哪裡跑，算好自己要掉進哪一片海。' },
    { bg: 'seawallFire', text: '阿昊沒有算進去。', em: true },
    { bg: 'seawallFire', text: '我把東宇拖上岸，他的大衣吸滿了海水，重得像兩個人。', sfx: 'splash' },
    { bg: 'seawallFire', text: '東宇，東宇……', who: 'yu' },
    { bg: 'seawallFire', text: '……妳有跑。', who: 'dong' },
    { bg: 'seawallFire', text: '這次，妳有聽我的。', who: 'dong' },
    { bg: 'seawallFire', text: '火海的另一邊，什麼都沒有。' },
  ];

  /* ---------- 4-1A'　來自④刀 ---------- */
  C.ch4_A2 = [
    { bg: 'gasCage', text: '東宇倒在鋼瓶區的鐵網前，閥門只轉緊了一半。', set: { ending: 1 }, sfx: 'hiss' },
    { bg: 'gasCage', text: '我爬過去，用兩隻手把它轉到底。嘶嘶聲停了，港口安靜得只剩下浪聲。', sfx: 'metal' },
    { bg: 'seawall', text: '我趴在岸壁邊往下看。黑色的海，什麼都沒有浮起來。' },
    { bg: 'seawall', text: '……雨真。', who: 'dong' },
    { bg: 'seawall', text: '不要看了。', who: 'dong' },
  ];

  /* ---------- 4-1B　來自③門內，trustHao ≥ 3（中間是 run4b 奔跑關） ---------- */
  C.ch4_B1 = [
    { bg: 'gasCage', text: '火從地上那一點藍光竄起來，沿著漏出來的瓦斯爬上鐵網。', set: { ending: 2 }, flash: '#9fc0ff', sfx: 'hiss' },
    { bg: 'gasCage', text: '我抓住阿昊的手。' },
    { bg: 'gasCage', text: '走。', who: 'yu' },
    { bg: 'gasCage', text: '他看著我的手，看了很久，久到火光已經映在他的傷疤上。' },
    { bg: 'gasCage', text: '然後，他握住了。', em: true },
    { bg: 'gasCage', text: '那隻手很冷，指節上有舊的凍瘡疤。四手聯彈的時候，這隻手每次都比我慢半拍。' },
    { bg: 'gasCage', text: '這一次，他沒有慢。', em: true },
  ];
  C.ch4_B2 = [
    { bg: 'seawallFire', text: '我們跑。我聽見東宇在身後喊：「不要回頭！」' },
    { bg: 'seawallFire', text: '我還是回頭了。' },
    { bg: 'gasCage', text: '他沒有跟上來。他往反方向走，走進火裡，走向那個還在嘶嘶作響的閥門。只要它還開著，鋼瓶受熱就會一個接一個爆開，整排貨櫃都會被吞掉，我們也跑不出去。', sfx: 'hiss' },
    { bg: 'gasCage', text: '他背對著我們，那個為了我，能夠不計代價的背影。' },
    { bg: 'gasCage', text: '東宇——！', who: 'yu' },
    { bg: 'white', text: '', hold: 2.2, sfx: 'boom', shake: 16, flash: '#ffffff' },
  ];

  /* ---------- 4-1C　來自②或③，信任不足（中間是 run4c 奔跑關） ---------- */
  C.ch4_C1 = [
    { bg: 'seawallFire', text: '他叫我跑的時候，我猶豫了一秒。', set: { ending: 3 }, cond: 'midEnd!=3' },
    { bg: 'seawallFire', text: '只有一秒。', em: true, cond: 'midEnd!=3' },
    { bg: 'gasCage', text: '我伸手，阿昊沒有握。', set: { ending: 3 }, cond: 'midEnd==3' },
    { bg: 'gasCage', text: '妳站到門這邊來，就夠了。', who: 'hao', cond: 'midEnd==3' },
    { bg: 'gasCage', text: '他轉身走向鐵網，走進火裡。東宇罵了一聲，追了過去。', cond: 'midEnd==3' },
    { bg: 'gasCage', text: '不要——', who: 'yu', cond: 'midEnd==3' },
  ];
  C.ch4_C2 = [
    { bg: 'seawallFire', text: '可是他算好的每一件事，都是用秒來算的。爆炸的時候我還不夠遠，他只好又轉身撲過來，把我壓在身下，替我擋住火。等我爬起來，他已經不動了。阿昊在火的另一邊，我看不到他。', cond: 'midEnd!=3', sfx: 'boom', shake: 14, flash: '#ffd8a0' },
    { bg: 'white', text: '', hold: 2.2, sfx: 'boom', shake: 16, flash: '#ffffff', cond: 'midEnd==3' },
    { bg: 'seawallFire', text: '我坐在雪地上。' },
    { bg: 'seawallFire', text: '曾經形影不離的四個人，只剩下孤身一人。' },
    { bg: 'seawallFire', text: '這一次，是我。', em: true },
  ];

  /* ---------- 4-2　語音留言（共通・真相收束） ---------- */
  C.ch4_msg = [
    { bg: 'hospital', weather: 'none', text: '醫院的走廊。東宇在加護病房裡。', cond: 'ending==1' },
    { bg: 'ambulance', weather: 'none', text: '救護車的後車廂。阿昊坐在旁邊，脖子包著紗布，看著車窗外。', cond: 'ending==2' },
    { bg: 'police', weather: 'none', text: '警局。跟 2009 年同一種白色日光燈。', cond: 'ending==3' },
    { bg: 'phoneClose', text: '胖達的摺疊手機，那天晚上一直留在旅社的桌上充電。' },
    { bg: 'phoneClose', note: '✉ 語音留言　1 則\n12/12　23:20', noteStyle: 'sms', text: '小螢幕上亮著一個小小的信封圖示：語音留言一則，12/12　23:20。', sfx: 'radio' },
    { bg: 'phoneClose', text: '十一點二十分，我正走在往港口的路上。他在港口等我，撥了一個死了十年的人的號碼，沒有人接，他就對著語音信箱說了這些話。' },
    { bg: 'voicemail', text: '胖達。', who: 'hao_m' },
    { bg: 'voicemail', text: '今年是第十年。你媽走了，手機在我這裡。我還是每個月幫你繳錢，你知道為什麼嗎？因為我找不到別的號碼可以說這件事。', who: 'hao_m' },
    { bg: 'voicemail', text: '那天晚上，東宇抓住我的衣領，我推了他。', who: 'hao_m' },
    { bg: 'voicemail', text: '我先推的。', who: 'hao_m', em: true, hold: 1.2 },
    { bg: 'voicemail', text: '我不想讓他救我。我一輩子都站在他後面，連要死的時候，他都要衝過來決定我能不能死。所以我推了他，用我全部的力氣。', who: 'hao_m' },
    { bg: 'voicemail', text: '他沒有放手，把我往回拉。然後你就倒下去了。', who: 'hao_m' },
    { bg: 'voicemail', text: '他跟警察說，是他推的。他沒有說我推了他。一個字都沒有。', who: 'hao_m' },
    { bg: 'voicemail', text: '你知道最恨的是什麼嗎？不是他害死你。是他連這個都要替我扛。我連當一個壞人的資格，都被他拿走了。', who: 'hao_m' },
    { bg: 'voicemail', text: '所以我一直跟自己說，他才是殺人犯。我說了十年，說到我自己都信了。', who: 'hao_m' },
    { bg: 'voicemail', text: '我在門裡面數拍子，數到我的手斷了也沒有用。李雨真在外面喊開門，我沒有開。我怕一停下來，就再也開始不了。', who: 'hao_m' },
    { bg: 'voicemail', text: '我每年都寄卡片給她，每一張都只寫一句話：『那天晚上，我在數拍子。』她一張都沒有回。', who: 'hao_m' },
    { bg: 'voicemail', text: '今天晚上，我要她自己想起來。如果她想起來了，我就……', who: 'hao_m' },
    { bg: 'black', text: '留言已結束。', who: 'vmail', sfx: 'warn' },
    { bg: 'black', text: '那一秒半。', cond: 'askedMore', em: true },
    { bg: 'black', text: '東宇停下來的那一秒半，空白的那一格，原來是這個。', cond: 'askedMore' },
    // 第 2 章「刻意缺格」在這裡補上；沒在第 2 章追問到的，碎片 c2-5 也在這裡補發
    { bg: 'pushGap', tint: 'cold', text: '', hold: 3.2, weather: 'rain', sfx: 'rain', frag: 'c2-5', cond: '!askedMore' },
    { bg: 'pushGap', tint: 'cold', text: '', hold: 3.2, weather: 'rain', sfx: 'rain', cond: 'askedMore' },
    { bg: 'pushGap', weather: 'rain', tint: 'cold', text: '雨中，阿昊的手按在東宇的胸口上，用力推出去。東宇的手，仍然抓著他的衣領。', frag: 'c4-1' },
  ];

  /* ---------- 4-3　結局 A　背影 ---------- */
  C.ch4_endA = [
    { bg: 'hospital', weather: 'snow', text: '醫院。三天後。窗外的雪已經積起來了。' },
    { bg: 'hospital', text: '東宇醒來的時候，我把留言放給他聽。' },
    { bg: 'hospital', text: '他聽完，閉上眼睛很久。' },
    { bg: 'hospital', text: '他推的那一下，很輕。', who: 'dong' },
    { bg: 'hospital', text: '真的很輕。是我自己沒站穩。', who: 'dong' },
    { bg: 'hospital', text: '東宇。', who: 'yu' },
    { bg: 'hospital', text: '是我拉的，雨真。不管他推不推，我都會那樣拉。那是我的手。', who: 'dong' },
    { bg: 'hospital', text: '他到現在還在替阿昊扛。' },
    { bg: 'hospital', text: '我沒有再說話，只是把他的手放進我的手心裡。這隻手拉過阿昊，撞倒過胖達，也替我擋過兩顆子彈。' },
    { bg: 'hospital', text: '海巡在第三天撈到了一件黑色斗篷，沒有找到人。' },
    { bg: 'seawallDay', weather: 'snow', note: '我聽到了。三十下，停兩下。', text: '雪中的港口岸壁。我一個人站在那裡，把一張卡片放進海裡。卡片上是我自己的字。' },
    { bg: 'seawallDay', text: '這一次，是我站在他前面。', em: true },
    { bg: 'seawallDay', text: '可是我保護的那個背影，從來都不需要我保護。需要的那個人，我讓他一個人沉進了海裡。' },
    ENDCARD('結局 A　背影', 'c4-2', { sfx: 'keyHi' }),
  ];

  /* ---------- 4-3　結局 B　門內 ---------- */
  C.ch4_endB = [
    { bg: 'chapel', weather: 'snow', text: '兩天後。港口附近的小教堂，外面在下雪。東宇的遺照沒有笑，是他工作證上的照片。' },
    { bg: 'chapel', text: '阿昊站在我旁邊，脖子上的紗布還沒拆，左手打著石膏。警察在門口等他，他自己要求的，要等喪禮結束。' },
    { bg: 'chapel', text: '他每次都這樣。', who: 'hao' },
    { bg: 'chapel', text: '每次都衝過來，決定好所有事情，然後自己去死。', who: 'hao' },
    { bg: 'chapel', text: '這次，他決定的是你要活下來。', who: 'yu' },
    { bg: 'chapel', text: '我知道。', who: 'hao' },
    { bg: 'chapel', text: '他看著那張照片很久。' },
    { bg: 'chapel', text: '李雨真，同學。', who: 'hao' },
    { bg: 'chapel', text: '他又在名字中間停了一拍，跟小時候一模一樣。' },
    { bg: 'chapel', text: '那天晚上，門裡面的人是我。今天晚上，門外面的人是他。', who: 'hao' },
    { bg: 'chapel', text: '角色對調了。結果還是沒有好下場。', who: 'hao' },
    { bg: 'chapel', text: '我握住他的手。冷的，有凍瘡疤的手。' },
    { bg: 'chapel', text: '但你在這裡。', who: 'yu' },
    { bg: 'chapel', text: '他沒有抽回去。' },
    { bg: 'chapelOut', text: '教堂外，雪落在台階上。阿昊被警察帶上車之前，回頭說了一句：' },
    { bg: 'chapelOut', text: '那首曲子，高音部我還記得。', who: 'hao', sfx: 'keyHi' },
    { bg: 'chapelOut', text: '低音部，我也是。', who: 'yu' },
    ENDCARD('結局 B　門內', 'c4-3', { sfx: 'fourhands' }),
  ];

  /* ---------- 4-3　結局 C　孤身一人 ---------- */
  C.ch4_endC = [
    { bg: 'roomNight', weather: 'snow', text: '雪夜，旅社房間。桌上有兩樣東西：胖達的摺疊手機，和母親連夜寄來的十張卡片。' },
    { bg: 'roomNight', text: '我拆開了十張卡片。', sfx: 'page' },
    { bg: 'roomNight', note: '那天晚上，我在數拍子。', text: '十張，每一張都只有一句話。' },
    { bg: 'roomNight', text: '字跡從十七歲寫到二十七歲，越寫越穩。最後一張的郵戳是上個禮拜。' },
    { bg: 'phoneClose', text: '我拿起胖達的手機，撥了阿昊的號碼。' },
    { bg: 'phoneClose', text: '關機。', em: true },
    { bg: 'phoneClose', text: '我又撥了東宇的號碼。', sfx: 'ring' },
    { bg: 'phoneClose', text: '電話那頭一直響，響到轉進語音信箱。東宇的信箱沒有設定問候語，只有一聲「嗶」。', sfx: 'warn' },
    { bg: 'phoneClose', text: '東宇。', who: 'yu' },
    { bg: 'phoneClose', text: '我在門外喊的時候，你說你聽得到。', who: 'yu' },
    { bg: 'phoneClose', text: '那你現在，也聽得到嗎。', who: 'yu' },
    { bg: 'roomNight', text: '', hold: 2.4 },                         // 雪落在窗玻璃上，沒有化
    { bg: 'roomNight', text: '夢裡有人倒下，現實裡就一定有人倒下。' },
    { bg: 'roomNight', text: '我以為自己能改的，是倒下的人是誰。' },
    { bg: 'roomNight', text: '到最後，我改掉的只有一件事：這一次，被留下來的人是我。', em: true },
    ENDCARD('結局 C　孤身一人', 'c4-4', { sfx: 'keyHi' }),
  ];

  /* ---------- 4-4　尾聲・初雪（共通）：重用序章 ending 的 p55～p58 構圖，加上下雪 ---------- */
  C.ch4_epilogue = [
    SOFT({ bg: 'seawallDay', weather: 'snow', text: '那天晚上，港口下了今年第一場雪。' }),
    SOFT({ bg: 'seawallDay', text: '我站在雪裡，想起另一場初雪。' }),
    SOFT({ img: 'p55', text: '彷彿做了一個很久的夢，我依然記得那一天，從相遇開始，或許，就是一場意外。', tag: '2000年12月' }),
    SOFT({ img: 'p56', text: '同學妳好，我叫延東宇，旁邊這位是胖達，我們是很好的朋友，不介意的話，認識一下吧。', who: 'dong_s', tag: '2000年12月' }),
    SOFT({ img: 'p57', text: '嗯，我叫。', who: 'yu_s', tag: '2000年12月' }),
    SOFT({ img: 'p58', text: '李雨真。', who: 'dong_s', tag: '2000年12月' }),   // 劇本：東宇先說出她的名字（他早就從點名簿上記住了）
    SOFT({ img: 'p59', text: '放學。校門口，一個穿得很單薄的男孩背著琴袋，在雪裡等。', tag: '2000年12月' }),
    SOFT({ img: 'p59', text: '李雨真，同學。要遲到了。', who: 'hao_s', tag: '2000年12月' }),
    SOFT({ img: 'p59', text: '那是四個人第一次站在一起。', tag: '2000年12月' }),
    SOFT({ img: 'p59', text: '胖達把手裡的暖暖包塞給那個男孩，說：「你的手好紅喔。」', tag: '2000年12月' }),
    SOFT({ bg: 'seawallDay', text: '這一次，我站在你前面。', em: true, cond: 'ending==1' }),
    SOFT({ bg: 'seawallDay', text: '這一次，門裡的人，有人拉出來了。', em: true, cond: 'ending==2' }),
    SOFT({ bg: 'seawallDay', text: '這一次，我記得你們每一個人。', em: true, cond: 'ending!=1 && ending!=2' }),
    { bg: 'black', card: '初雪　夢落下的原點', cardSub: '——完——', text: '', hold: 4.6, sfx: 'a440' },
  ];
})(window.CX);
