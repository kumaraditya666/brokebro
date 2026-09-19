import { CHARACTERS, MEME_TEMPLATES } from "./data";
import { deflectMessage, isUnsafeInput, sanitizeContext } from "./safety";
import type {
  ChatAward,
  Language,
  MemeResult,
  RoastRequest,
  RoastResult,
  RoastStyle,
  WrappedStats,
} from "./types";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function detectLanguage(input: string): Exclude<Language, "auto"> {
  if (!input) return "hinglish";
  const devanagari = /[\u0900-\u097F]/.test(input);
  if (devanagari) return "hindi";
  const hinglishHints =
    /(bhai|yaar|arre|acha|kal|pakka|matlab|scene|jugaad|timepass|khana|padhai|yaad|wala|wale|hai|hain|kiya|gaya|tera|mera)/i;
  if (hinglishHints.test(input)) return "hinglish";
  return "english";
}

// ---- template banks (all original, playful, non-abusive) ----
const BANK: Record<RoastStyle, { hinglish: string[]; hindi: string[]; english: string[] }> = {
  desi: {
    hinglish: [
      "Bhai tera 'kal se padhunga' itna consistent hai ki calendar bhi confuse ho gaya. 📅💀",
      "Tu plan banane mein event manager hai, execute karne mein WiFi without recharge. 📶😭",
      "Bhai tere excuses sun ke alarm bhi snooze maang raha hai. ⏰",
      "Tu group ka woh notification hai jo sab ignore karte hain par delete nahi karte. 🔕😂",
      "Teri memory itni selective hai ki exam ka syllabus aur crush ka birthday dono bhool gaya. 🧠👻",
      "Bhai tera confidence dekh ke lagta hai result already leak ho gaya. 💀",
      "Tu fridge 7 baar khol chuka, Maggi khud jump karke nahi aayegi. 🍜",
    ],
    hindi: [
      "भाई का आत्मविश्वास अलग ही स्तर पर है, रिज़ल्ट से पहले ही मिठाई बाँट दी। 🍬💀",
      "भाई की प्लानिंग देखो, क्रियान्वयन गायब है। 📋👻",
      "भाई का 'कल से पक्का' इतना मशहूर है कि कैलेंडर भी शरमा गया। 📅",
      "दोस्तों का वो यार जो हर पार्टी में आता है, बस टाइम पर नहीं। ⏰😂",
    ],
    english: [
      "Bro has 47 plans and zero execution. Startup of excuses. 📋💀",
      "Your '5 minutes away' has its own timezone. Scientists are studying it. ⏰",
      "Bro opens the fridge 7 times hoping new food spawned. DLC nahi aayega. 🍜",
      "You are the group's 'seen 11:47 PM' — always online, never replying. 👀",
      "Your attendance and IPL points table — both unpredictable. 📊😭",
    ],
  },
  bhai: {
    hinglish: [
      "Bhai tu rehne de 😭 — tera scene dekh ke auto wala bhi meter off kar gaya. 🛺",
      "Bhai trust me bolna band kar, UPI ne bhi OTP bhejna band kar diya. 🤝💸",
      "Bhai tera swag dekh ke pados wali aunty bhi vlog banane lagi. 📱😂",
      "Bhai tu gym gaya tha ya selfie museum? Dono mein paseena nahi dikha. 💪🤳",
      "Bhai teri English dekh ke Shakespeare bhi Hinglish seekh raha hai. 📚🔥",
    ],
    hindi: [
      "भाई तू रहने दे 😭 — तेरा सीन देख के ट्रैफिक भी रुक गया। 🚗",
      "भाई का स्टाइल अलग है, टाइम पर आना छोड़ के सब कुछ करता है। 😎",
    ],
    english: [
      "Bhai mode on, execution off. Classic combo. 🔥😭",
      "Bro says 'trust me' — entire group forwards it as meme. 🤝",
    ],
  },
  savage: {
    hinglish: [
      "Bhai tera comeback itna slow hai ki BSNL bhi tez lage. 🐢💀",
      "Tu exam mein itna blank tha ki answer sheet ne khud doubt clear kar liya. 📝👻",
      "Bhai teri playlist bhi teri tarah — har mood mein same sad loop. 🎧😭",
      "Tera 'busy hoon' aur Jio ka network — dono ka bharosa nahi. 📶💀",
    ],
    hindi: ["भाई की हाज़िर-जवाबी इतनी धीमी है कि कछुआ भी आगे निकल गया। 🐢"],
    english: [
      "Your comebacks arrive faster by speed post. Still pending. 💀",
      "Bro studies one night before exam and calls it 'syllabus sprint'. 🏃📚",
    ],
  },
  cricket: {
    hinglish: [
      "Bhai tera confidence Rohit ke pull shot jaisa — dekh ke maza, result unpredictable. 🏏😂",
      "Tu group ka 12th man hai — har plan mein saath, playing XI mein kabhi nahi. 🏏👻",
      "Bhai teri timing tail-ender jaisi — jab zaroorat nahi tab six, exam mein duck. 🦆",
      "Tera 'kal se padhunga' DRS review jaisa — sabko pata hai out hai. 📺💀",
      "Bhai tu powerplay mein sota hai, death overs mein panic karta hai. 🏏😭",
    ],
    hindi: ["भाई की टाइमिंग ऐसी कि गली क्रिकेट में भी अंपायर confuse हो जाए। 🏏"],
    english: [
      "Bro treats deadlines like tail-enders treat yorkers — pure panic. 🏏",
      "You're the impact sub of plans: always discussed, never used. 😂",
    ],
  },
  bollywood: {
    hinglish: [
      "Bhai teri life ka trailer dhamakedaar, picture mein interval ke baad sab so gaye. 🎬😭",
      "Tu interval ke baad aane wala dost hai — entry late, popcorn khatam. 🍿",
      "Bhai tera struggle montage chal raha hai, background mein mummy 'beta khana kha le' bol rahi. 🎶🍛",
      "Picture ka climax: tu bola '5 min mein aaya' — 2 ghante ka intermission. 🎬⏰",
    ],
    hindi: ["भाई की ज़िंदगी ट्रेलर में ब्लॉकबस्टर, असल में इंटरवल लंबा है। 🎬"],
    english: [
      "Your life needs a parody trailer: 'Coming Soon (never)'. 🎬",
      "Interval hero — arrives late, steals samosa, saves nothing. 🍿",
    ],
  },
  parents: {
    hinglish: [
      "Beta Sharma ji ke bete ko dekho — woh bhi teri meme forward karta hai. 🏆😂",
      "Mummy: 'Phone rakh de.' Tu: '2 min.' Woh 2 min ab history hai. 📱",
      "Log kya kahenge? Log toh tere 'kal se pakka' pe already thesis likh chuke. 📚",
      "Papa: 'Marks kahan hain?' Tu: 'Vibes mein.' 📊😭",
      "Beta, rishtedaar puch rahe hain scope kya hai — meme engineer? 🔍",
    ],
    hindi: [
      "बेटा, शर्मा जी के बेटे को देखो — वो भी तुम्हारे मीम पर हँस रहा है। 🏆",
      "मम्मी बोलीं फोन रख दे, वो '2 मिनट' अब इतिहास है। 📱",
    ],
    english: [
      "Indian parents patch notes: 'Log kya kahenge' bug still not fixed. 😂",
      "Mom's CCTV vision spotted you opening fridge at 2 AM. Again. 🍜👀",
    ],
  },
  student: {
    hinglish: [
      "Bhai teri attendance 34% — proxy lagane wale dost ko Bharat Ratna milna chahiye. 🙋",
      "Tu last night padh ke topper wali feeling leta hai, result mein attendance wali reality. 📚💀",
      "Assignment deadline dekh ke tera laptop bhi resignation dena chahta hai. 💻😭",
      "Bhai tera 'ek din pehle syllabus khatam' wala plan har sem mein sequel lata hai. 🎬",
    ],
    hindi: ["भाई की अटेंडेंस और मानसून — दोनों का कोई भरोसा नहीं। 🌧️📚"],
    english: [
      "75% attendance criteria vs your 34% — enemies to lovers arc. 📚",
      "Group project role: 'moral support and fonts'. 🎨",
    ],
  },
  foodie: {
    hinglish: [
      "Bhai tu diet 'kal se' bol ke aaj biryani ka handi order kar deta hai. 🍛😭",
      "Swiggy delivery boy bhi tera naam dekh ke bolta — 'arre aap phir?' 🛵",
      "Tu Maggi mein bhi MasterChef twist dhoondhta hai — masala extra, patience zero. 🍜",
      "Bhai tere fridge mein sirf light jalti hai, khana nahi milta. 💡",
    ],
    hindi: ["भाई डाइट कल से, आज बिरयानी पक्की। 🍛"],
    english: [
      "Bro's fridge: lights on, nobody home (no food either). 💡🍜",
      "Zomato Gold expired, your hunger didn't. 🍕",
    ],
  },
  indianlife: {
    hinglish: [
      "Bhai tu signal pe horn baja ke traffic kam karne wala legend hai. 🚗📯",
      "Auto wala bola 'meter se' — tu shock mein UPI PIN bhool gaya. 🛺😂",
      "Metro mein seat ke liye tu Rajdhani wali sprint lagata hai. 🚇🏃",
      "Bhai teri life local train jaisi — bheed full, seat confirm kabhi nahi. 🚂",
      "Baarish aate hi tu 'Delhi weather >>>' story dalta hai, ghar pe inverter nahi. 🌧️",
    ],
    hindi: ["भाई ट्रैफिक में हॉर्न बजा के जाम खोलने वाला वैज्ञानिक। 🚗"],
    english: [
      "Bro honks at red light like it accepts UPI. It doesn't. 🚗",
      "Local train has better punctuality than your arrivals. 🚂⏰",
    ],
  },
};

const MEME_BANK: { top: string; bottom: string; caption: string; situation: string }[] = [
  { top: "Friend says:", bottom: "'5 minute mein aa raha hoon' / Reality: 2 hours later", caption: "Indian Standard Time is a lifestyle, not a timezone. ⏰😭", situation: "friendship" },
  { top: "POV:", bottom: "You opened the fridge for the 7th time hoping new food spawned", caption: "Fridge mein sirf light hai, magic nahi. 🧊😂", situation: "food" },
  { top: "Mummy:", bottom: "'Sharma ji ke bete ko dekho' / Me: opens meme app", caption: "Final boss of Indian childhood. 🏆", situation: "parents" },
  { top: "Syllabus:", bottom: "1 night. 8 chapters. Full confidence.", caption: "Kal se pakka gang rise up. 📚🔥", situation: "exams" },
  { top: "Auto wala:", bottom: "'Meter se chalenge' / Entire auto: *shocked*", caption: "Rare footage, colorized. 🛺😱", situation: "traffic" },
  { top: "Gully cricket rule:", bottom: "Jo ball ghar mein gayi, woh out + ball gayi", caption: "Constitution of India (gully edition). 🏏", situation: "cricket" },
  { top: "Wedding be like:", bottom: "Paneer counter pe Avengers assemble", caption: "Buffet is war. 🍛⚔️", situation: "wedding" },
  { top: "Hostel 2 AM:", bottom: "Maggi + trauma bonding", caption: "Mess ka khana bhool jao. 🍜🌙", situation: "hostel" },
  { top: "Relatives:", bottom: "'Beta, scope kya hai?' / Me: scope leke aaya hoon", caption: "Audit season never ends. 🔍😭", situation: "relatives" },
  { top: "Metro:", bottom: "Seat mili = lottery lagi", caption: "Window seat = VIP darshan. 🚇", situation: "traffic" },
  { top: "Group admin:", bottom: "'Kal trip pakka' / Trip: still in planning since 2019", caption: "Goa plan cinematic universe. 🏖️👻", situation: "friendship" },
  { top: "Proxy:", bottom: "Present sir (in 3 different voices)", caption: "Vocal range of legends. 🙋🎭", situation: "college" },
];

const WRAPPED_AWARDS: ChatAward[] = [
  { emoji: "🏆", title: 'Most Likely To Say "Bhai Ek Kaam Tha..."', desc: "Help chahiye ya treat chahiye?", winner: "Group ka jugaadu" },
  { emoji: "😂", title: "Most Likely To Send Memes", desc: "Forwarded many times, still funny", winner: "Meme minister" },
  { emoji: "🕐", title: "Most Likely To Reply 6 Hours Later", desc: "Seen 11:47 PM, reply next day", winner: "Busy legend" },
  { emoji: "🍕", title: "Most Likely To Talk About Food", desc: "Every topic ends at biryani", winner: "Foodie-in-chief" },
  { emoji: "📱", title: "Most Likely To Be Online 24/7", desc: "Last seen: just now (always)", winner: "Night owl" },
  { emoji: "💀", title: 'Most Likely To Say "Bhai Trust Me"', desc: "Trust issues speedrun", winner: "Plan master" },
  { emoji: "🏏", title: "Sofa Selector Award", desc: "Har ball pe expert opinion", winner: "Commentator bhai" },
  { emoji: "🍵", title: "Chai Sutta Philosopher", desc: "Cutting pe life decisions", winner: "Chai uncle 2.0" },
];

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function generateRoast(req: RoastRequest): RoastResult {
  const raw = `${req.context ?? ""} ${req.name ?? ""}`;
  if (isUnsafeInput(raw)) {
    return {
      id: uid("roast"),
      text: deflectMessage(),
      style: req.style,
      language: req.language === "auto" ? "hinglish" : req.language,
      character: "Chai Uncle",
      tags: ["safe", "playful"],
      createdAt: Date.now(),
    };
  }
  const lang: Exclude<Language, "auto"> =
    req.language === "auto" ? detectLanguage(req.context ?? "") : req.language;
  const bank = BANK[req.style] ?? BANK.desi;
  const lines = bank[lang] ?? bank.hinglish;
  const ctx = sanitizeContext(req.context ?? "");
  const seedBase = `${req.style}|${lang}|${ctx}|${req.target}|${req.name ?? ""}`;
  // context-aware pick + light personalization
  const idx = hash(seedBase) % lines.length;
  let text = lines[idx];

  if (ctx.length > 8) {
    const suffix = pick(
      [
        ` (Context: "${ctx.slice(0, 60)}" — evidence mil gaya. 👀)`,
        ` Waise "${ctx.slice(0, 48)}..." wala scene sabko pata hai. 😂`,
        ``,
      ],
      hash(seedBase + "sfx")
    );
    if (lang === "hindi" && suffix.includes("Context")) {
      text = `${text} (सबूत मिल गया: "${ctx.slice(0, 48)}")`;
    } else {
      text = `${text}${suffix}`;
    }
  }
  if (req.name && req.name.trim().length > 1 && hash(req.name) % 3 === 0) {
    text = `${req.name.trim().split(" ")[0]}, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  }

  return {
    id: uid("roast"),
    text,
    style: req.style,
    language: lang,
    character: pick(CHARACTERS, hash(seedBase + "char")).name,
    hinglish: lang === "hinglish" ? text : pick(BANK[req.style].hinglish, hash(seedBase + "h")),
    hindi: lang === "hindi" ? text : pick(BANK[req.style].hindi, hash(seedBase + "hi")),
    english: lang === "english" ? text : pick(BANK[req.style].english, hash(seedBase + "e")),
    tags: [req.style, lang, req.target, "playful"],
    createdAt: Date.now(),
  };
}

export function generateRoastVariations(req: RoastRequest, n = 3): RoastResult[] {
  const out: RoastResult[] = [];
  const seen = new Set<string>();
  let salt = 0;
  while (out.length < n && salt < 20) {
    const r = generateRoast({ ...req, context: `${req.context ?? ""} #${salt}` });
    // de-dup by text
    if (!seen.has(r.text)) {
      seen.add(r.text);
      out.push(r);
    }
    salt++;
  }
  return out;
}

export function generateDesiMeme(situation = "friendship", language: Language = "hinglish"): MemeResult {
  const pool = MEME_BANK.filter((m) => m.situation === situation);
  const list = pool.length ? pool : MEME_BANK;
  const seed = hash(situation + Date.now().toString().slice(0, 8));
  const base = pick(list, seed % list.length);
  const template = pick(MEME_TEMPLATES, (seed >> 3) % MEME_TEMPLATES.length);
  const lang: Exclude<Language, "auto"> = language === "auto" ? "hinglish" : language;
  const hinglish = `${base.top} ${base.bottom} — ${base.caption}`;
  const hindiMap: Record<string, string> = {
    friendship: "दोस्ती गई, मीम बच गया। 😂",
    food: "फ्रिज में जादू नहीं, सिर्फ़ लाइट है। 🧊",
    parents: "शर्मा जी का बेटा फाइनल बॉस है। 🏆",
    exams: "एक रात, पूरा सिलेबस। 🔥",
    traffic: "मीटर से चलो, चमत्कार देखो। 🛺",
    cricket: "गली क्रिकेट संविधान। 🏏",
    wedding: "बुफे एक युद्ध है। 🍛",
    hostel: "रात 2 बजे मैगी क्लब। 🌙",
    relatives: "रिश्तेदार ऑडिट चालू है। 🔍",
    traffic2: "सीट मिली मतलब लॉटरी। 🚇",
    college: "प्रॉक्सी लेजेंड्स। 🙋",
  };
  return {
    id: uid("meme"),
    top: base.top,
    bottom: base.bottom,
    caption: base.caption,
    hinglish,
    hindi: `${base.top} ${base.bottom} — ${hindiMap[base.situation] ?? "देसी मीम पक्का। 😂"}`,
    english: `${base.top} ${base.bottom}. Indian internet classic. 😂`,
    template: template.name,
    situation: base.situation,
  };
}

export function generateCaption(style: RoastStyle, language: Language): string[] {
  const lang: Exclude<Language, "auto"> = language === "auto" ? "hinglish" : language;
  const bank = BANK[style] ?? BANK.desi;
  const lines = bank[lang] ?? bank.hinglish;
  const s = hash(style + lang + Date.now().toString().slice(0, 9));
  return [lines[s % lines.length], lines[(s >> 2) % lines.length], lines[(s >> 4) % lines.length]];
}

export function analyzeChat(text: string): ChatAward[] {
  const t = text.toLowerCase();
  const has = (re: RegExp) => re.test(t);
  const awards: ChatAward[] = [];
  if (has(/kaam|help|paise|treat|party/)) awards.push(WRAPPED_AWARDS[0]);
  awards.push(WRAPPED_AWARDS[1]);
  if (has(/seen|reply|kal|later|busy/)) awards.push(WRAPPED_AWARDS[2]);
  if (has(/khana|biryani|maggi|swiggy|zomato|chai|samosa|pizza/)) awards.push(WRAPPED_AWARDS[3]);
  awards.push(WRAPPED_AWARDS[4]);
  if (has(/trust me|pakka|plan/)) awards.push(WRAPPED_AWARDS[5]);
  if (has(/cricket|ipl|six|out|match/)) awards.push(WRAPPED_AWARDS[6]);
  if (awards.length < 3) awards.push(WRAPPED_AWARDS[7]);
  // playful winner assignment from names found
  const names = Array.from(text.matchAll(/(?:^|\n)\s*([A-Z][a-zA-Z]{2,12}|[\u0900-\u097F]{3,})\s*[:\-]/g))
    .map((m) => m[1])
    .slice(0, 6);
  return awards.slice(0, 4).map((a, i) => ({
    ...a,
    winner: names[i % Math.max(names.length, 1)] ?? a.winner,
  }));
}

export function generateGroupWrapped(chatText: string): WrappedStats {
  const lines = chatText.split("\n").filter(Boolean);
  const totalMessages = Math.max(lines.length, 12);
  const lower = chatText.toLowerCase();
  const count = (re: RegExp) => (lower.match(re) || []).length;
  const bhaiCount = count(/bhai/g) || Math.floor(totalMessages * 0.06) + 12;
  const cryCount = count(/😭|lol|hahaha|😂/g) || Math.floor(totalMessages * 0.04) + 8;
  const foodCount =
    count(/biryani|maggi|chai|samosa|pizza|swiggy|zomato|khana|food/g) ||
    Math.floor(totalMessages * 0.02) + 5;
  const midnightCount = Math.floor(totalMessages * 0.08) + 3;
  const words = lower
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["kaise", "aur", "hai", "hain", "with", "this", "that"].includes(w));
  const freq = new Map<string, number>();
  words.forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1));
  const topWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, c]) => ({ word, count: c }));
  if (!topWords.length) {
    topWords.push(
      { word: "bhai", count: bhaiCount },
      { word: "pakka", count: 14 },
      { word: "scene", count: 11 }
    );
  }
  return {
    totalMessages: totalMessages > 100 ? totalMessages : 18492,
    bhaiCount,
    cryCount,
    foodCount,
    midnightCount,
    topWords,
    awards: analyzeChat(chatText).slice(0, 2),
    headline: pick(
      ['"Most Likely To Say Bhai Ek Kaam Tha..."', '"Goa Plan Since 2019" Gang', '"Kal Se Pakka" Legends'],
      totalMessages % 3
    ),
  };
}

export function buildShareText(roast: string): string {
  return `${roast}\n\n— via ROASTED INDIA 🇮🇳 (Bhai, evidence mil gaya 😂)`;
}
