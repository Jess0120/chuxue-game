/* =========================================================
 * story-ch2.js — 第 2 章〈頂樓〉劇情資料
 *   ⚠ 第 1～4 章劇情為遊戲原創，非小說原作（劇本：小雅，僅供遊戲使用）。
 *   台詞取自《遊戲劇本　第 2 章〈頂樓〉》。現在線：2019/12/12 清晨～傍晚；回憶線：2009/11/27 夜。
 *
 *   本章新增的過場欄位（格式其餘同 story-ch1.js）：
 *     tint    : 'cold' ＝回放段的冷藍色調
 *     tag     : 畫面右上角的小字（例如「東宇的版本」）
 *     lock    : 這一格不能手動翻頁（刻意空白格用，時間到自動翻）
 *     hotspot : { x, y, frag, label } 畫面上可以點的雪花（點擊或按 E 拾回），只在該格出現
 *     choice 的 dim : 灰色選項（條件不足時的替代選項，選了沒有變化）
 *   節奏關「門後」在 js/stage-door.js。
 * ========================================================= */
(function (CX) {
  'use strict';

  CX.STAGE_INFO.c2 = { no: '第二章', name: '頂樓' };
  CX.STAGE_INFO.door = {
    no: '第二章', name: '門後',
    goal: '跟著門後的聲音按下。三十下之後，會停兩下——停的時候，什麼都不要按。',
    keys: 'Enter／空白鍵：在波紋與圓環重疊時按下', touch: '在波紋與圓環重疊時點擊畫面',
    hint: '連續聽準，悶響底下會浮出別的聲音。',
  };

  /** 第 2 章記憶碎片（6 片）。編號 c2-1～c2-6，對應劇本 2-1～2-6 */
  CX.MEMORIES.c2 = [
    { text: '他只會聽你的，雖然他很討厭你。胖達總是知道每個人在想什麼。', lockedHint: '回放中，點擊話筒上的雪花' },
    { text: '四個人，只有一把鑰匙。我們把它放在最不會弄丟的人身上。', lockedHint: '回放中，點擊門口掛鎖上的雪花' },
    { text: '三十下，停兩下。打人的人，不會數拍子。', lockedHint: '節奏關「門後」：聽出來' },
    { text: '筆在紙上劃破一個洞。我站的那一邊，就是那個洞。', lockedHint: '警局' },
    { text: '那一秒半，雨聲很大，什麼都沒有。', lockedHint: '休息室：追問' },
    { text: '妳在門外喊的時候，我其實聽得到。', lockedHint: '傍晚，閘門外' },
  ];

  Object.assign(CX.CHARACTERS, {
    dong_n:  { name: '東宇', portrait: null, color: '#9fc4ff', noQuote: true, textColor: '#d6e6ff' },   // 回放段：東宇的旁白（不加引號、字色不同）
    panda_v: { name: '胖達', portrait: null, color: '#ffd2a0' },                                       // 話筒裡的聲音
    yu17:    { name: '雨真（17 歲）', portrait: 'yu', color: '#c9d4ff' },
    yu27:    { name: '雨真（27 歲・旁白）', portrait: null, color: '#c9d4ff', noQuote: true, textColor: '#fff2d6' },
    police:  { name: '女警', portrait: null, color: '#d8dde6' },
    radio:   { name: '氣象廣播', portrait: null, color: '#b8c2d0' },
  });

  const C = CX.CUTSCENES;
  /** 回放段共用：冷色調＋右上角「東宇的版本」 */
  const DV = o => Object.assign({ tint: 'cold', tag: '東宇的版本' }, o);

  C.ch2_title = [
    { bg: 'black', sfx: 'thud', text: '', hold: 1.6 },
    { bg: 'black', card: '第二章　頂樓', text: '', hold: 2.6 },
  ];

  /* ---------- 2-1　第七區・員工休息室（清晨） ---------- */
  C.ch2_break = [
    { bg: 'breakroom', text: '我在閘門外等到他下班。' },
    { bg: 'breakroom', text: '他看到我的時候沒有趕我走，只是嘆了一口氣，把我帶進休息室，倒了一杯熱水放在我面前。杯子上印著貨運公司的商標，杯緣有個缺口。' },
    { bg: 'breakroom', text: '我把摺疊手機放在桌上，打開那則簡訊給他看。' },
    { bg: 'breakroom', text: '他看了很久，久到熱水不再冒煙。' },
    { bg: 'breakroom', text: '他把胖達的號碼留了十年。', who: 'dong' },
    { bg: 'breakroom', text: '他打給我了。他要我問你，那天晚上，門是誰鎖的。', who: 'yu' },
    { bg: 'breakroom', text: '阿昊。', who: 'dong' },
    { bg: 'breakroom', text: '他回答得太快，好像這個問題他已經回答過很多次，只是對象都不是我。' },
    { bg: 'breakroom', text: '……不是你？', who: 'yu' },
    { bg: 'breakroom', text: '門是他鎖的，人是我推的。', who: 'dong' },
    { bg: 'breakroom', text: '他把杯子轉了半圈，讓缺口朝向自己。' },
    { bg: 'breakroom', text: '妳要聽，我就從電話開始講。', who: 'dong' },
  ];

  /* ---------- 2-2／2-3　回放・2009（東宇的版本） ---------- */
  const RECEIVER = { x: 600, y: 238, frag: 'c2-1', label: '話筒' };
  const PADLOCK = { x: 545, y: 300, frag: 'c2-2', label: '掛鎖' };
  C.ch2_dong = [
    DV({ bg: 'phoneClose', weather: 'rain', text: '那天我燒到三十九度。妳端粥來，坐在床邊叫我吃，我嫌燙，妳就一直吹。', who: 'dong_n' }),
    DV({ bg: 'phoneClose', sfx: 'ring', text: '十點五十二分，家裡的電話響了，是胖達打來的。', who: 'dong_n' }),
    DV({ bg: 'phoneClose', hotspot: RECEIVER, text: '東宇，阿昊在頂樓，在欄杆外面。他傳簡訊給我……我先過去。你不要跟雨真說，他……他不想讓她看到。', who: 'panda_v' }),
    DV({ bg: 'phoneClose', hotspot: RECEIVER, text: '你快點來。他只會聽你的，雖然他很討厭你。', who: 'panda_v' }),
    DV({ bg: 'phoneClose', hotspot: RECEIVER, text: '我掛掉電話，回頭看到妳的臉，白得跟紙一樣。', who: 'dong_n' }),
    // 接回原文的場面：雨真攔住東宇（台詞沿用 after3）
    DV({ img: 'p45', text: '你生病了，生病就應該在家休養，而且哪有人大半夜的還跑去學校。', who: 'yu' }),
    DV({ img: 'p45', text: '我那時不知道妳前一天晚上做了夢。我只知道妳抓著我的手不放，抓了快十分鐘。', who: 'dong_n' }),
    DV({ img: 'p46', text: '最後我推開妳，連手機都忘了拿。', who: 'dong_n' }),
    // 頂樓
    DV({ bg: 'roof', hotspot: PADLOCK, text: '我到的時候，胖達跪在欄杆內側，兩隻手伸出去抓著阿昊的手腕。', who: 'dong_n' }),
    DV({ bg: 'roof', hotspot: PADLOCK, text: '阿昊站在外面那條水泥邊上，背對著操場。', who: 'dong_n' }),
    DV({ bg: 'roof', hotspot: PADLOCK, text: '阿昊，你看，東宇來了。他發燒還跑來，你看他濕成那樣……你進來好不好，我們回去，我請你們吃消夜。', who: 'panda_v' }),
    DV({ bg: 'roof', text: '你叫他來幹什麼。', who: 'hao_v' }),
    DV({ bg: 'roof', text: '沈昊的聲音很平靜，平靜得不對勁。' }),
    DV({ bg: 'roof', text: '他一來，就會把所有事情都決定好。你看著。', who: 'hao_v' }),
    DV({ bg: 'roof', text: '他說得沒錯。我什麼都沒說，直接衝過去，半個身體探出欄杆，抓住了他的衣領。', who: 'dong_n' }),
    DV({ bg: 'roof', text: '進來。', who: 'dong' }),
    DV({ bg: 'roof', text: '放手。', who: 'hao_v' }),
    DV({ bg: 'roof', text: '進來，阿昊。', who: 'dong' }),
    // ⚠ 刻意的缺格：東宇不肯講的那一秒半（沈昊先推了他）。不是 bug，第 4 章 4-2 才補上。
    { bg: 'gray', weather: 'none', sfx: 'rain', text: '', hold: 1.5, lock: true, blank: true },
    DV({ bg: 'roof', weather: 'rain', text: '我用力把他往裡面拉。兩個人一起往後倒，他的手撞到欄杆，我的手肘撞到胖達。', who: 'dong_n' }),
    DV({ bg: 'roof', text: '地上很滑。胖達往後倒，撞到水塔的鐵架。', who: 'dong_n' }),
    DV({ bg: 'roofAfter', sfx: 'metal', shake: 4, text: '', hold: 2.4 }),
    DV({ bg: 'roofAfter', text: '那一聲，我到現在都還聽得見。', who: 'dong_n' }),
    DV({ bg: 'roof', text: '阿昊爬過去，叫他的名字，叫了好幾次，然後轉過頭來看我。', who: 'dong_n' }),
    DV({ bg: 'roof', text: '你別再碰他。', who: 'hao_v' }),
    DV({ bg: 'roof', shake: 3, text: '滾出去！', who: 'hao_v' }),
    DV({ bg: 'roof', text: '他用一隻手把我推出門外，鐵鍊繞上門把，掛鎖扣上。鑰匙在胖達身上，我們四個人只有那一把。', who: 'dong_n' }),
    DV({ bg: 'stair', text: '我跑下樓找警衛，警衛室沒有人。我跑回來，敲門，喊，然後腳就站不住了。', who: 'dong_n' }),
    DV({ bg: 'stair', text: '接著妳就來了。', who: 'dong_n' }),
  ];

  /* ---------- 2-4　回放・2009・頂樓門外（雨真） ---------- */
  C.ch2_door = [
    { img: 'p48', text: '難道，真的發生了，夢境與現實交疊……出現在眼前的，卻只有坐在頂樓門前，絕望的他。' },
    { img: 'p50', text: '東宇，那……那，現在是什麼情況。', who: 'yu' },
    { img: 'p50', text: '來不及了，一切……', who: 'dong' },
    { bg: 'stair', text: '我把耳朵貼上鐵門。' },
    { bg: 'stair', text: '十年來，我一直以為我記得門後的聲音。' },
    { bg: 'stair', text: '可是在東宇講完以後，我再聽一次，才發現我從來沒有好好聽過。' },
  ];

  /* ---------- 節奏關「門後」之後：判定結果 ---------- */
  C.ch2_door_result = [
    // 成功（這一次聽出來了：doorOk）
    { bg: 'stair', cond: 'doorOk', text: '三十下，停兩下。' },
    { bg: 'stair', cond: 'doorOk', sfx: 'keyHi', text: '鋼琴老師在我七歲時就教過，數拍子要數出聲音，數出聲音，手才不會亂。阿昊練琴的時候也是這樣，邊彈邊數，小小聲的，只有坐在旁邊的我聽得見。' },
    { bg: 'stair', cond: 'doorOk', text: '那不是在打人。' },
    { bg: 'stair', cond: 'doorOk', text: '那是在救人。', em: true },
    { bg: 'stair', cond: 'doorOk', text: '壓斷的是肋骨，數拍子的是阿昊。我說要開門的時候，他沒有回答，是因為他一停下來，胖達就沒有機會了。' },
    { bg: 'stair', cond: 'doorOk', text: '可是十七歲的我，只聽見我在夢裡就聽過的那個聲音。' },
    { img: 'p51', cond: 'doorOk', text: '……開門，開門……', who: 'yu' },
    { img: 'p51', cond: 'doorOk', text: '我喊著喊著，門後越來越慢，越來越輕，最後沒有了動靜。', frag: 'c2-3' },
    // 失敗
    { bg: 'stair', cond: '!doorOk', text: '一陣一陣，如重物猛擊般，精確將人骨敲碎的聲音。' },
    { bg: 'stair', cond: '!doorOk', text: '我還是只聽得到這個。' },
    { img: 'p51', cond: '!doorOk', text: '我捂住耳朵，喊到嗓音沙啞，也再不會有人回答。' },
    { bg: 'stair', cond: '!doorOk', text: '', choice: [
      { text: '再聽一次（重來「門後」）', set: { retryDoor: true } },
      { text: '繼續（之後也可以在回憶圖鑑「重聽門後」）', set: { retryDoor: false } },
    ] },
  ];

  /* ---------- 2-5　回放・2009・警局（站在哪一邊） ---------- */
  const PT = { tag: '這是回憶。發生過的事不會改變。改變的，是妳今天選擇相信什麼。' };
  C.ch2_police = [
    { bg: 'police', weather: 'none', text: '李同學，妳在門外，聽到了什麼？', who: 'police' },
    { bg: 'police', text: '延東宇那時候在哪裡？他有沒有進去過？', who: 'police' },
    { bg: 'police', text: '我記得那張紙，還記得自己簽名的時候，筆在紙上劃破了一個洞。' },
    { bg: 'police', text: '我記得自己說了什麼。' },
    Object.assign({ bg: 'police', text: '可是現在，二十七歲的我，必須重新決定，我站在哪一邊。' }, PT),
    Object.assign({ bg: 'police', text: '', choice: [
      { text: '「東宇一直和我在一起。門後……有人在打人。」', add: { trustDong: 1, trustHao: -1 }, goto: 'ch2_police_A' },
      { text: '「門後有人在數數。他在救胖達。」', cond: 'heardCount', add: { trustHao: 2 }, goto: 'ch2_police_B' },
      { text: '「門後……有一種聲音，我說不出來」', cond: '!heardCount', dim: true, goto: 'ch2_police_X' },
      { text: '「我不記得。我什麼都不記得。」', goto: 'ch2_police_C' },
    ] }, PT),
  ];
  C.ch2_police_A = [
    { bg: 'police', text: '東宇一直和我在一起。門後……有人在打人。', who: 'yu17' },
    { bg: 'police', text: '女警的筆停了一下，在「沈昊」兩個字下面畫了一條線。' },
    { bg: 'police', text: '十年前，我說的就是這一句。' },
    { bg: 'police', text: '這句話替東宇作了證，也讓病床上的阿昊被問了三個禮拜，問他為什麼要打胖達。' },
    { bg: 'police', text: '我那時候以為我在保護東宇。我一直都站在他那一邊，連想都沒想過。', frag: 'c2-4' },
  ];
  C.ch2_police_B = [
    { bg: 'police', text: '……東宇一直和我在一起。門後……有人在打人。', who: 'yu17' },
    { bg: 'police', shake: 2, text: '畫面停住，嘴型和字幕對不上。' },
    { bg: 'police', text: '不對。', who: 'yu27' },
    { bg: 'police', text: '門後有人在數數。三十下，停兩下。他在救胖達。', who: 'yu27' },
    { bg: 'police', text: '女警的筆不會停，紙上那條線也擦不掉。' },
    { bg: 'police', text: '可是至少現在，我站到了門的另一邊。', frag: 'c2-4' },
  ];
  // 沒有聽出數拍子時的灰色選項：選了沒有變化（劇本只寫「選了也沒有變化」，以下兩句為實作補的過渡）
  C.ch2_police_X = [
    { bg: 'police', text: '門後……有一種聲音，我說不出來。', who: 'yu17' },
    { bg: 'police', text: '女警等了一會兒，什麼也沒有寫。那個聲音，我那時候說不出來，現在也還是說不出來。', frag: 'c2-4' },
  ];
  C.ch2_police_C = [
    { bg: 'police', text: '我不記得。我什麼都不記得。', who: 'yu17' },
    { bg: 'police', text: '這句話是真的，又不完全是真的。' },
    { bg: 'police', text: '後來我真的什麼都不記得了。醫生說那叫解離。我只知道，忘記是一個最安全的位置，不用站在任何一邊。', frag: 'c2-4' },
  ];

  /* ---------- 2-6　現在・員工休息室 ---------- */
  C.ch2_after = [
    { bg: 'breakroom', text: '他在救胖達，對不對。', who: 'yu' },
    { bg: 'breakroom', text: '對。', who: 'dong' },
    { bg: 'breakroom', text: '你跟警察說過嗎？', who: 'yu' },
    { bg: 'breakroom', text: '說過。法醫也說，肋骨是 CPR 壓斷的。', who: 'dong' },
    { bg: 'breakroom', text: '可是我說……', who: 'yu' },
    { bg: 'breakroom', text: '妳說的，也是妳聽到的。', who: 'dong' },
    { bg: 'breakroom', text: '他說得很輕，好像要把這件事放到一個不會砸到我的地方。' },
    { bg: 'breakroom', text: '後來他沒被起訴。可是學校裡的人，比較喜歡妳說的那個版本。', who: 'dong' },
    { bg: 'breakroom', text: '我低頭看著杯子上的缺口。' },
    { bg: 'breakroom', text: '十年前的我，替他擋掉了一半的罪，把另一半推到了門的後面。' },
    { bg: 'breakroom', text: '你說人是你推的。', who: 'yu' },
    { bg: 'breakroom', text: '是我拉的，是我撞到的。結果都一樣。', who: 'dong' },
    { bg: 'breakroom', text: '他回答得太快，又是這樣。' },
    { bg: 'breakroom', text: '', choice: [
      { text: '「我相信你。」', add: { trustDong: 1 }, goto: 'ch2_after_A' },
      { text: '「你還有沒說的。剛才那裡，你停了一下。」', set: { askedMore: true }, add: { trustHao: 1 }, goto: 'ch2_after_B' },
    ] },
  ];
  C.ch2_after_A = [
    { bg: 'breakroom', text: '……嗯。', who: 'dong' },
    { bg: 'breakroom', text: '他看起來鬆了一口氣，又好像更累了。' },
    { bg: 'breakroom', text: '我想起小時候，他每次跌倒都說不痛，說完就躲到廁所去哭。胖達會守在門口，跟所有人說裡面沒人。' },
  ];
  C.ch2_after_B = [
    { bg: 'breakroom', text: '沒有。', who: 'dong' },
    { bg: 'breakroom', text: '你講到「進來，阿昊」之後，停了一秒半。你講話不會停那麼久，除非你在想要怎麼講。', who: 'yu' },
    { bg: 'breakroom', text: '他看了我一眼。這是他第一次露出被看穿的表情。' },
    { bg: 'breakroom', text: '妳的耳朵，還是一樣討厭。', who: 'dong' },
    { bg: 'breakroom', text: '那一秒半的事，跟妳沒有關係，跟胖達也沒有關係。那是我跟阿昊之間的事。', who: 'dong' },
    { bg: 'breakroom', text: '他不再說了。可是我知道，那個空白的地方有東西。', frag: 'c2-5' },
  ];

  /* ---------- 2-7　現在・閘門外・傍晚 ---------- */
  C.ch2_gate = [
    { bg: 'gateDusk', sfx: 'radio', text: '……今晚到明天，北部山區及沿海有機會降下今年第一場雪……', who: 'radio' },
    { bg: 'gateDusk', text: '東宇送我到閘門外。他拿出自己的手機，把螢幕轉給我看。' },
    { bg: 'gateDusk', note: '沈昊\n12 月 12 日，夜裡，第七區。\n你帶她來，或者我去帶她。十年了。', noteStyle: 'sms', text: '', hold: 4.2 },
    { bg: 'gateDusk', text: '你也收到了。', who: 'yu' },
    { bg: 'gateDusk', text: '上個月就收到了。他每年都會傳一句話給我，今年是第一次叫我帶人。', who: 'dong' },
    { bg: 'gateDusk', text: '十二月十二日……就是今天。', who: 'yu' },
    { bg: 'gateDusk', text: '我一個人去。', who: 'dong' },
    { bg: 'gateDusk', text: '夢裡，你也是一個人。', who: 'yu' },
    { bg: 'gateDusk', text: '他沒有說話。' },
    { bg: 'gateDusk', cond: 'toldDream', text: '妳說，夢裡我叫妳跑。', who: 'dong' },
    { bg: 'gateDusk', cond: 'toldDream', text: '那是對的。我會那樣叫，就代表那是對的。', who: 'dong' },
    { bg: 'gateDusk', cond: '!toldDream', text: '妳昨天說只是一個夢。', who: 'dong' },
    { bg: 'gateDusk', cond: '!toldDream', text: '……嗯。', who: 'yu' },
    { bg: 'gateDusk', cond: '!toldDream', text: '那就讓它只是一個夢。', who: 'dong' },
    { bg: 'gateDusk', text: '他轉身要走，又停下來。' },
    { bg: 'gateDusk', text: '雨真。妳在門外喊的時候，我其實聽得到。', who: 'dong' },
    { bg: 'gateDusk', text: '我只是，不知道要怎麼回答妳。', who: 'dong' },
    { bg: 'yardDusk', weather: 'snow', text: '他走進堆場，背影被一排一排的貨櫃吞掉。' },
    { bg: 'yardDusk', text: '天空開始飄下一點很細的東西，落到手背上就化了，分不清是雨還是雪。', frag: 'c2-6' },
  ];

})(window.CX);
