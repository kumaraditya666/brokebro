// Legendary Indian meme lines — short iconic quotations (1 line each) with source credit.
// Kept to brief quotes with attribution; full credit to the original creators.

export type FamousCategory =
  | "bollywood"
  | "tv"
  | "webseries"
  | "youtube"
  | "cricket"
  | "viral"
  | "daily";

export interface FamousLine {
  id: string;
  text: string;
  source: string;
  vibe: string;
  emoji: string;
  category: FamousCategory;
}

export const FAMOUS_CATEGORIES: { id: FamousCategory | "all"; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "⭐" },
  { id: "bollywood", label: "Bollywood", emoji: "🎬" },
  { id: "tv", label: "TV", emoji: "📺" },
  { id: "webseries", label: "Web Series", emoji: "🍿" },
  { id: "youtube", label: "YouTube", emoji: "🎤" },
  { id: "cricket", label: "Cricket", emoji: "🏏" },
  { id: "viral", label: "Viral", emoji: "🌪️" },
  { id: "daily", label: "Daily Desi", emoji: "🇮🇳" },
];

export const FAMOUS_LINES: FamousLine[] = [
  // ---------- BOLLYWOOD ----------
  { id: "bw-sholay-kitne", text: "Kitne aadmi the?", source: "Sholay (1975)", vibe: "Jab dost ka plan flop ho jaye", emoji: "😎", category: "bollywood" },
  { id: "bw-deewar-maa", text: "Mere paas maa hai.", source: "Deewar (1975)", vibe: "Ultimate comeback line", emoji: "🏆", category: "bollywood" },
  { id: "bw-don", text: "Don ko pakadna mushkil hi nahi, namumkin hai.", source: "Don (1978)", vibe: "Plan bana ke gayab hone wala dost", emoji: "👻", category: "bollywood" },
  { id: "bw-deewar-gaadi", text: "Aaj mere paas gaadi hai, bangla hai, paisa hai... tumhare paas kya hai?", source: "Deewar (1975)", vibe: "Salary-day flex", emoji: "💸", category: "bollywood" },
  { id: "bw-ddlj", text: "Bade bade deshon mein aisi chhoti chhoti baatein hoti rehti hain.", source: "DDLJ (1995)", vibe: "Chhoti mistake pe cover-up", emoji: "🤷", category: "bollywood" },
  { id: "bw-oso", text: "Picture abhi baaki hai, mere dost.", source: "Om Shanti Om (2007)", vibe: "Exams abhi khatam nahi hue", emoji: "🎬", category: "bollywood" },
  { id: "bw-shahenshah", text: "Rishte mein toh hum tumhare baap lagte hain.", source: "Shahenshah (1988)", vibe: "Group admin energy", emoji: "👑", category: "bollywood" },
  { id: "bw-aaa-teja", text: "Teja main hoon, mark idhar hai.", source: "Andaz Apna Apna (1994)", vibe: "Overconfident friend", emoji: "😎", category: "bollywood" },
  { id: "bw-aaa-gogo", text: "Crime master Gogo naam hai mera.", source: "Andaz Apna Apna (1994)", vibe: "Failed jugaad ke baad", emoji: "🕶️", category: "bollywood" },
  { id: "bw-3idiots-well", text: "Aal izz well!", source: "3 Idiots (2009)", vibe: "Result se pehle wali feeling", emoji: "🤞", category: "bollywood" },
  { id: "bw-3idiots-chatur", text: "Jahapanah, tussi great ho, tohfa kabool karo.", source: "3 Idiots (2009)", vibe: "Teacher ki buttering", emoji: "🧈", category: "bollywood" },
  { id: "bw-phera-double", text: "25 din mein paisa double.", source: "Phir Hera Pheri (2006) — Baburao", vibe: "Dost ke business ideas", emoji: "💰", category: "bollywood" },
  { id: "bw-hera-utha", text: "Utha le re baba, utha le.", source: "Hera Pheri (2000)", vibe: "Monday morning mood", emoji: "😩", category: "bollywood" },
  { id: "bw-hera-tez", text: "Bahut tez ho rahe ho, hain?", source: "Hera Pheri (2000) — Baburao", vibe: "Jab dost zyada smart bane", emoji: "🧠", category: "bollywood" },
  { id: "bw-hera-khopdi", text: "Khopdi tod, khopdi tod saale ka!", source: "Hera Pheri (2000)", vibe: "Gaming rage moment", emoji: "🎮", category: "bollywood" },
  { id: "bw-welcome-control", text: "Control Uday, control.", source: "Welcome (2007)", vibe: "Anger management", emoji: "😤", category: "bollywood" },
  { id: "bw-welcome-majnu", text: "Majnu bhai ke aage koi bol sakta hai kya?", source: "Welcome (2007)", vibe: "Dost ki so-called art", emoji: "🎨", category: "bollywood" },
  { id: "bw-wanted", text: "Ek baar jo maine commitment kar di, uske baad main khud ki bhi nahi sunta.", source: "Wanted (2009)", vibe: "Gym promises", emoji: "💪", category: "bollywood" },
  { id: "bw-dabangg-swagat", text: "Swagat nahi karoge humara?", source: "Dabangg (2010)", vibe: "Party mein late entry", emoji: "🎉", category: "bollywood" },
  { id: "bw-dabangg-thappad", text: "Thappad se darr nahi lagta sahab, pyaar se lagta hai.", source: "Dabangg (2010)", vibe: "Emotional friend", emoji: "🥺", category: "bollywood" },
  { id: "bw-gow-kehke", text: "Keh ke loonga.", source: "Gangs of Wasseypur (2012)", vibe: "Last roast ka badla", emoji: "🔥", category: "bollywood" },
  { id: "bw-gow-na-ho", text: "Tumse na ho payega.", source: "Gangs of Wasseypur (2012)", vibe: "Dost ka diet plan", emoji: "🍛", category: "bollywood" },
  { id: "bw-munna-tension", text: "Tension lene ka nahi, sirf dene ka.", source: "Munna Bhai MBBS (2003)", vibe: "Group ka stress-supplier", emoji: "😌", category: "bollywood" },
  { id: "bw-munna-jhappi", text: "Bole toh... jaadu ki jhappi de de.", source: "Munna Bhai MBBS (2003)", vibe: "Jhagde ke baad patch-up", emoji: "🤗", category: "bollywood" },
  { id: "bw-pushpa", text: "Pushpa... jhukega nahi!", source: "Pushpa (2021)", vibe: "Attendance short, attitude tall", emoji: "😤", category: "bollywood" },

  // ---------- TV ----------
  { id: "tv-cid-daya", text: "Daya, darwaza tod do.", source: "CID", vibe: "Dost snacks leke room lock kare tab", emoji: "🚪", category: "tv" },
  { id: "tv-cid-gadbad", text: "Kuch toh gadbad hai.", source: "CID — ACP Pradyuman", vibe: "Dost sus behave kare tab", emoji: "🕵️", category: "tv" },
  { id: "tv-crimepatrol", text: "Satark rahein, savdhaan rahein.", source: "Crime Patrol", vibe: "Exam hall warning", emoji: "⚠️", category: "tv" },
  { id: "tv-biggboss", text: "Bigg Boss chahte hain ki tum kal se pakka padho.", source: "Bigg Boss (format)", vibe: "Mummy via Bigg Boss", emoji: "📺", category: "tv" },

  // ---------- WEB SERIES ----------
  { id: "ws-binod", text: "Dekh raha hai Binod?", source: "Panchayat (TVF)", vibe: "Obvious cheez point out karna", emoji: "👀", category: "webseries" },
  { id: "ws-banrakas", text: "Banrakas kahin ke!", source: "Panchayat S2 (TVF)", vibe: "Best friend ke liye pyaar bhari daant", emoji: "😂", category: "webseries" },
  { id: "ws-mirzapur-maza", text: "Shuru majboori mein kiye the, ab maza aa raha hai.", source: "Mirzapur", vibe: "Proxy attendance journey", emoji: "🙋", category: "webseries" },
  { id: "ws-mirzapur-chacha", text: "Chacha vidhayak hain humare.", source: "Mirzapur", vibe: "Contacts wala dost", emoji: "📞", category: "webseries" },
  { id: "ws-sacred", text: "Kabhi kabhi lagta hai apun hi bhagwan hai.", source: "Sacred Games", vibe: "Ek mock test achha jane ke baad", emoji: "😇", category: "webseries" },
  { id: "ws-scam", text: "Risk hai toh ishq hai.", source: "Scam 1992", vibe: "Last-night syllabus sprint", emoji: "📚", category: "webseries" },

  // ---------- YOUTUBE / CREATORS ----------
  { id: "yt-carry-kaise", text: "Toh kaise hain aap log?", source: "CarryMinati", vibe: "Group mein entry greeting", emoji: "🎤", category: "youtube" },
  { id: "yt-carry-gormint", text: "Ye bik gayi hai gormint.", source: "CarryMinati", vibe: "Canteen price hike", emoji: "🍛", category: "youtube" },
  { id: "yt-bb-beizzati", text: "Gajab beizzati hai!", source: "BB Ki Vines — Bhuvan Bam", vibe: "Teacher se roast hone ke baad", emoji: "😭", category: "youtube" },
  { id: "yt-samay", text: "Aur bhai, kya chal raha hai?", source: "Samay Raina", vibe: "Mahino baad catch-up", emoji: "📞", category: "youtube" },
  { id: "yt-system", text: "System hang kar denge!", source: "Elvish Yadav fan meme", vibe: "Overconfident bro", emoji: "⚙️", category: "youtube" },
  { id: "yt-rasode", text: "Rasode mein kaun tha?", source: "Kokilaben rap — Yashraj Mukhate", vibe: "Mess food mystery", emoji: "🍲", category: "youtube" },
  { id: "yt-biggini", text: "Biggini shoot kar diya!", source: "Yashraj Mukhate", vibe: "Photo dump caption", emoji: "📸", category: "youtube" },
  { id: "yt-pawri", text: "Pawri ho rahi hai!", source: "Dananeer (viral video)", vibe: "Party stories", emoji: "🎉", category: "youtube" },

  // ---------- CRICKET ----------
  { id: "cr-dhoni", text: "Dhoni finishes off in style!", source: "Ravi Shastri — commentary", vibe: "Last-ball submission", emoji: "🏏", category: "cricket" },
  { id: "cr-tracer", text: "Tracer bullet!", source: "Ravi Shastri — commentary", vibe: "Dost ke superfast replies", emoji: "🚄", category: "cricket" },
  { id: "cr-chhakka", text: "Gend hawa mein... aur ye chhah!", source: "Hindi commentary classic", vibe: "Har chhoti jeet pe celebration", emoji: "🎈", category: "cricket" },

  // ---------- VIRAL ----------
  { id: "vr-kehna", text: "Arey, kehna kya chahte ho?", source: "News debate meme", vibe: "Confusing explanation pe", emoji: "🤔", category: "viral" },
  { id: "vr-sabar", text: "Ruko zara, sabar karo.", source: "Viral video meme", vibe: "Impatient friend ke liye", emoji: "⏳", category: "viral" },
  { id: "vr-ias", text: "Padhai-likhai mein dhyaan lagao, IAS-WIAS bano.", source: "Viral teacher video", vibe: "Mummy ka favourite dialogue", emoji: "👩", category: "viral" },
  { id: "vr-chronology", text: "Aap chronology samajhiye.", source: "Famous speech meme", vibe: "Plan explain karte waqt", emoji: "📋", category: "viral" },
  { id: "vr-mitron", text: "Mitron!", source: "Famous speech meme", vibe: "Announcement se pehle", emoji: "📢", category: "viral" },

  // ---------- DAILY DESI ----------
  { id: "dd-goodmorning", text: "Good morning 🌹🌹🙏", source: "WhatsApp uncles — daily 6 AM", vibe: "Subah ka broadcast", emoji: "🌅", category: "daily" },
  { id: "dd-forwarded", text: "Forwarded many times.", source: "WhatsApp gyaan", vibe: "Bina source ka funda", emoji: "📩", category: "daily" },
  { id: "dd-scope", text: "Beta, scope kya hai?", source: "Relatives audit", vibe: "Career questions", emoji: "🔍", category: "daily" },
  { id: "dd-log", text: "Log kya kahenge?", source: "Indian parents classic", vibe: "Permission denied", emoji: "🚫", category: "daily" },
  { id: "dd-kalse", text: "Kal se pakka.", source: "Students ka national pledge", vibe: "Har tooti hui kasam", emoji: "📅", category: "daily" },
  { id: "dd-5min", text: "5 minute mein aa raha hoon.", source: "Indian Standard Time", vibe: "2 ghante wali entry", emoji: "⏰", category: "daily" },
  { id: "dd-bhainebola", text: "Bhai ne bola karne ka, toh karne ka.", source: "Mumbai street meme", vibe: "No-question jugaad", emoji: "🤝", category: "daily" },
  { id: "dd-paisavasool", text: "Full paisa vasool!", source: "Movie-review uncle", vibe: "Khaane ke baad review", emoji: "🎬", category: "daily" },
];

export function famousByCategory(cat: FamousCategory | "all"): FamousLine[] {
  if (cat === "all") return FAMOUS_LINES;
  return FAMOUS_LINES.filter((l) => l.category === cat);
}

export function searchFamous(q: string): FamousLine[] {
  const s = q.trim().toLowerCase();
  if (!s) return FAMOUS_LINES;
  return FAMOUS_LINES.filter(
    (l) =>
      l.text.toLowerCase().includes(s) ||
      l.source.toLowerCase().includes(s) ||
      l.vibe.toLowerCase().includes(s)
  );
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function randomFamousLine(seed: string, cat?: FamousCategory | "all"): FamousLine {
  const pool = cat && cat !== "all" ? famousByCategory(cat) : FAMOUS_LINES;
  return pool[hash(seed) % pool.length];
}

export function famousById(id: string): FamousLine | undefined {
  return FAMOUS_LINES.find((l) => l.id === id);
}

const STYLE_PUNCH: Record<string, (FamousCategory | "all")[]> = {
  cricket: ["cricket"],
  bollywood: ["bollywood"],
  parents: ["tv", "daily"],
  student: ["viral", "daily"],
  foodie: ["daily", "youtube"],
  indianlife: ["daily", "viral"],
  desi: ["bollywood", "daily", "viral"],
  bhai: ["youtube", "viral", "bollywood"],
  savage: ["bollywood", "webseries"],
};

export function punchlineForStyle(style: string, seed: string): FamousLine {
  const cats = STYLE_PUNCH[style] ?? ["bollywood", "daily"];
  const cat = cats[hash(seed + style) % cats.length];
  return randomFamousLine(seed + "punch", cat);
}
