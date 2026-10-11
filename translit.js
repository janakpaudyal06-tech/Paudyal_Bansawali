// Roman → नेपाली (देवनागरी) रूपान्तरण, नामका लागि।
//
// Translit.variants("ram")  → ["राम", "रम", ...]   (पहिलो = सबैभन्दा सम्भावित)
// Translit.convert("ram prasad 2010") → "राम प्रसाद २०१०"
//
// पहिले शब्दकोश (WORDS) हेरिन्छ, त्यसपछि ध्वनिका नियम लागू हुन्छन्।
// बारम्बार गलत हुने नाम WORDS मा थप्नुहोस्।
(function () {
  const DIGITS = "०१२३४५६७८९";

  const WORDS = {
    // थर
    paudyal: "पौड्याल", poudyal: "पौड्याल", paudel: "पौडेल", poudel: "पौडेल",
    sharma: "शर्मा", adhikari: "अधिकारी", bhattarai: "भट्टराई", dahal: "दाहाल",
    koirala: "कोइराला", pokharel: "पोखरेल", pokhrel: "पोखरेल", acharya: "आचार्य",
    aryal: "अर्याल", bhandari: "भण्डारी", devkota: "देवकोटा", dhakal: "ढकाल",
    ghimire: "घिमिरे", gautam: "गौतम", joshi: "जोशी", khanal: "खनाल",
    lamichhane: "लामिछाने", neupane: "न्यौपाने", pandey: "पाण्डे", pande: "पाण्डे",
    parajuli: "पराजुली", regmi: "रेग्मी", rijal: "रिजाल", sapkota: "सापकोटा",
    subedi: "सुवेदी", timalsina: "तिमल्सिना", tiwari: "तिवारी", upadhyaya: "उपाध्याय",
    wagle: "वाग्ले", gyawali: "ज्ञवाली", baral: "बराल", bhatta: "भट्ट",
    shrestha: "श्रेष्ठ", bhatt: "भट्ट",
    // नाम र नामका भाग
    hirandalal: "हिरन्दलाल", ram: "राम", shyam: "श्याम", hari: "हरि", krishna: "कृष्ण",
    laxmi: "लक्ष्मी", lakshmi: "लक्ष्मी", sita: "सीता", gita: "गीता", geeta: "गीता",
    radha: "राधा", ganga: "गङ्गा", durga: "दुर्गा", parvati: "पार्वती", kamala: "कमला",
    devi: "देवी", maya: "माया", kumari: "कुमारी", kumar: "कुमार", prasad: "प्रसाद",
    bahadur: "बहादुर", lal: "लाल", nath: "नाथ", raj: "राज", dev: "देव", datta: "दत्त",
    dutta: "दत्त", chandra: "चन्द्र", narayan: "नारायण", narayana: "नारायण",
    ganesh: "गणेश", bishnu: "विष्णु", vishnu: "विष्णु", shiva: "शिव", shiv: "शिव",
    gopal: "गोपाल", govinda: "गोविन्द", gobinda: "गोविन्द", keshav: "केशव", keshab: "केशव",
    madhav: "माधव", madhab: "माधव", mohan: "मोहन", padma: "पद्म", purna: "पूर्ण",
    tek: "टेक", tika: "टीका", til: "तिल", tilak: "तिलक", dhan: "धन", man: "मान",
    mani: "मणि", kanta: "कान्त", khadga: "खड्ग", bhim: "भीम", bhola: "भोला",
    shree: "श्री", shri: "श्री", sri: "श्री", shrimati: "श्रीमती", prithvi: "पृथ्वी",
    prakash: "प्रकाश", bhagwati: "भगवती", bhagawati: "भगवती", yagya: "यज्ञ",
    dil: "दिल", hem: "हेम", lok: "लोक", nar: "नर", bal: "बल", jang: "जङ्ग",
    bikram: "विक्रम", vikram: "विक्रम", ishwar: "ईश्वर", iswar: "ईश्वर", ishwor: "ईश्वर",
    ishwori: "ईश्वरी", bhawani: "भवानी", sarita: "सरिता", sunita: "सुनिता",
    anita: "अनिता", kalpana: "कल्पना", rita: "रीता", sabitri: "सावित्री",
    savitri: "सावित्री", sharada: "शारदा", saraswati: "सरस्वती", uma: "उमा",
    yamuna: "यमुना", kaushalya: "कौशल्या", tulsi: "तुलसी", dharma: "धर्म", kul: "कुल",
    dhruba: "ध्रुव", dhruv: "ध्रुव", rudra: "रुद्र", indra: "इन्द्र", mahesh: "महेश",
    dinesh: "दिनेश", suresh: "सुरेश", ramesh: "रमेश", rajendra: "राजेन्द्र",
    surendra: "सुरेन्द्र", narendra: "नरेन्द्र", upendra: "उपेन्द्र",
    mahendra: "महेन्द्र", devendra: "देवेन्द्र", gyanendra: "ज्ञानेन्द्र",
    binod: "विनोद", pramod: "प्रमोद", santosh: "सन्तोष", ashok: "अशोक",
    deepak: "दीपक", dipak: "दीपक", kamal: "कमल", bimal: "विमल", nirmal: "निर्मल",
    madan: "मदन", ratna: "रत्न", khem: "खेम", prem: "प्रेम", om: "ओम",
    narayani: "नारायणी", purushottam: "पुरुषोत्तम", uttam: "उत्तम", hom: "होम",
    sitaram: "सीताराम", tikaram: "टीकाराम", kala: "कला",
    // नाता र विवरण
    kanchha: "कान्छा", kanchhi: "कान्छी", jetha: "जेठा", jethi: "जेठी",
    maila: "माइला", maili: "माइली", saila: "साइँला", saili: "साइँली",
    sal: "साल", saal: "साल", janma: "जन्म", mrityu: "मृत्यु", gaun: "गाउँ",
    jilla: "जिल्ला", chhora: "छोरा", chhori: "छोरी", buwa: "बुवा", aama: "आमा"
  };
  // यी शब्द अर्को नामको पछाडि जोडिएर आउन सक्छन् (जस्तै "hiralal" → "हिरा" + "लाल")
  const SUFFIXES = ["bahadur", "prasad", "kumari", "kumar", "chandra", "narayan", "nath",
    "raj", "lal", "ram", "dev", "devi", "maya", "mani", "kanta", "datta", "man"];

  const CONS = [ // [roman, देवनागरी, आफैंमा संयुक्त अक्षर?]
    ["ksh", "क्ष", 1], ["chh", "छ"], ["gy", "ज्ञ", 1], ["ch", "च"], ["kh", "ख"],
    ["gh", "घ"], ["jh", "झ"], ["th", "थ"], ["dh", "ध"], ["ph", "फ"], ["bh", "भ"],
    ["sh", "श"], ["tt", "त्त", 1], ["x", "क्ष", 1],
    ["k", "क"], ["c", "क"], ["q", "क"], ["g", "ग"], ["j", "ज"], ["z", "ज"], ["t", "त"],
    ["d", "द"], ["n", "न"], ["p", "प"], ["f", "फ"], ["b", "ब"], ["m", "म"], ["y", "य"],
    ["r", "र"], ["l", "ल"], ["v", "व"], ["w", "व"], ["s", "स"], ["h", "ह"]
  ];
  const VOWELS = [ // [roman, स्वतन्त्र स्वर, मात्रा, छोटो/लामो जोडी]
    ["aa", "आ", "ा", "a"], ["ai", "ऐ", "ै"], ["au", "औ", "ौ"], ["ou", "औ", "ौ"],
    ["ee", "ई", "ी", "i"], ["ii", "ई", "ी", "i"], ["oo", "ऊ", "ू", "u"], ["uu", "ऊ", "ू", "u"],
    ["a", "अ", "", "aa"], ["i", "इ", "ि", "ee"], ["u", "उ", "ु", "oo"],
    ["e", "ए", "े"], ["o", "ओ", "ो"]
  ];
  const VOWEL_BY_ROMAN = Object.fromEntries(VOWELS.map(v => [v[0], v]));
  const RI_OK = new Set(["क", "ग", "द", "ह", "म", "स", "ब", "व", "न"]); // कृ, गृ, दृ ...

  function tokenize(word) {
    const out = [];
    let i = 0;
    outer: while (i < word.length) {
      for (const [r, dev, cluster] of CONS) {
        if (word.startsWith(r, i)) { out.push({ c: true, dev, cluster: !!cluster }); i += r.length; continue outer; }
      }
      for (const v of VOWELS) {
        if (word.startsWith(v[0], i)) { out.push({ c: false, r: v[0] }); i += v[0].length; continue outer; }
      }
      i++; // अज्ञात अक्षर छोडिन्छ
    }
    // ध्वनि-नियम
    for (let k = 0; k < out.length; k++) {
      const t = out[k], next = out[k + 1], prev = out[k - 1];
      // n + k/g → ङ (शङ्कर, गङ्गा); अन्त्यको "ng" → ङ (गुरुङ)
      if (t.c && t.dev === "न" && next && next.c && ["क", "ख", "ग", "घ"].includes(next.dev)) {
        t.dev = "ङ";
        if (next.dev === "ग" && k + 2 === out.length) out.splice(k + 1, 1);
      }
      // sh + n/t/th → ष्ण, ष्ट, ष्ठ (विष्णु, श्रेष्ठ)
      if (t.c && t.dev === "श" && next && next.c && ["न", "त", "थ"].includes(next.dev)) {
        t.dev = "ष";
        next.dev = { "न": "ण", "त": "ट", "थ": "ठ" }[next.dev];
      }
      // kri → कृ (कृष्ण, दृष्टि)
      if (t.c && RI_OK.has(t.dev) && !(prev && prev.c) && next && next.c && next.dev === "र" &&
          out[k + 2] && !out[k + 2].c && out[k + 2].r === "i") {
        out.splice(k + 1, 2, { c: false, r: "ri", matra: "ृ", ind: "ऋ" });
      }
    }
    return out;
  }

  // flips: स्वरको index हरू जसको छोटो/लामो रूप उल्टाउने
  function build(tokens, flips) {
    const vowelIdx = tokens.map((t, i) => (t.c ? -1 : i)).filter(i => i >= 0);
    const last = tokens.length - 1;
    let out = "";
    let prevCons = false;
    tokens.forEach((t, i) => {
      if (t.c) {
        if (prevCons) out += "्";
        out += t.dev;
        prevCons = true;
        return;
      }
      let r = t.r;
      if (t.matra === undefined) {
        const afterCluster = i >= 2 && tokens[i - 1].c && (tokens[i - 2].c || tokens[i - 1].cluster) ||
          (i === 1 && tokens[0].cluster);
        if (r === "a" && prevCons) {
          if (i === last && !afterCluster) r = "aa";               // माया, राधा
          else if (vowelIdx.length === 1 && i < last) r = "aa";    // राम, लाल
        }
        if (r === "i" && prevCons && i === last) r = "ee";         // जोशी, कुमारी
        if (flips.has(i) && VOWEL_BY_ROMAN[r][3]) r = VOWEL_BY_ROMAN[r][3];
      }
      const v = VOWEL_BY_ROMAN[r];
      const ind = t.ind || v[1], matra = t.matra !== undefined ? t.matra : v[2];
      out += prevCons ? matra : ind;
      prevCons = false;
    });
    return out;
  }

  function ruleVariants(word) {
    const tokens = tokenize(word);
    if (!tokens.length) return [];
    const list = [build(tokens, new Set())];
    tokens.forEach((t, i) => {
      if (!t.c && t.matra === undefined && VOWEL_BY_ROMAN[t.r][3]) list.push(build(tokens, new Set([i])));
    });
    return list;
  }

  const cache = new Map();
  function variants(raw) {
    const word = raw.toLowerCase();
    if (!/^[a-z]+$/.test(word)) return [raw];
    if (cache.has(word)) return cache.get(word);
    const list = [];
    if (WORDS[word]) list.push(WORDS[word]);
    for (const s of SUFFIXES) {
      if (word.length - s.length >= 2 && word.endsWith(s)) {
        variants(word.slice(0, -s.length)).slice(0, 3).forEach(p => list.push(p + WORDS[s]));
      }
    }
    list.push(...ruleVariants(word));
    const result = [...new Set(list)].slice(0, 8);
    cache.set(word, result);
    return result;
  }

  // पाठलाई शब्द र अरू भागमा छुट्याउँछ: [{word:"ram"}, {text:" "}, ...]
  function segments(text) {
    return (text.match(/[A-Za-z]+|[^A-Za-z]+/g) || []).map(s =>
      /^[A-Za-z]/.test(s) ? { word: s } : { text: s.replace(/\d/g, d => DIGITS[d]) }
    );
  }

  function convert(text) {
    return segments(text).map(s => (s.word ? variants(s.word)[0] : s.text)).join("");
  }

  window.Translit = { variants, segments, convert };
})();
