import type { SituationCategory } from "./types";

export const STYLE_META: Record<string, { emoji: string; label: string; desc: string; gradient: string }> = {
  desi: { emoji: "🇮🇳", label: "Desi", desc: "Classic friend-group teasing", gradient: "from-orange-500 to-amber-400" },
  bhai: { emoji: "🔥", label: "Bhai Mode", desc: "Hinglish + full slang", gradient: "from-rose-500 to-orange-500" },
  savage: { emoji: "💀", label: "Savage", desc: "Extra spicy, still playful", gradient: "from-violet-500 to-fuchsia-500" },
  cricket: { emoji: "🏏", label: "Cricket", desc: "Every roast is a match", gradient: "from-green-500 to-emerald-400" },
  bollywood: { emoji: "🎬", label: "Bollywood", desc: "Parody trailer energy", gradient: "from-amber-400 to-pink-500" },
  parents: { emoji: "👨‍👩‍👦", label: "Parents", desc: "Sharma ji ke bete jokes", gradient: "from-sky-400 to-indigo-500" },
  student: { emoji: "📚", label: "Student", desc: "Attendance & exams", gradient: "from-cyan-400 to-blue-500" },
  foodie: { emoji: "🍕", label: "Foodie", desc: "Samosa to swiggy", gradient: "from-yellow-400 to-red-500" },
  indianlife: { emoji: "🚗", label: "Indian Life", desc: "Traffic, auto, metro", gradient: "from-teal-400 to-green-500" },
};

export const CHARACTERS = [
  { id: "chai-uncle", name: "Chai Uncle", emoji: "🍵", line: "Beta, cutting chai pe charcha hogi.", color: "#E8B86D" },
  { id: "overconfident-bro", name: "Overconfident Bro", emoji: "😎", line: "Bhai main toh pehle se ready tha.", color: "#FFB800" },
  { id: "exam-survivor", name: "Exam Survivor", emoji: "📝", line: "Kal se pakka padhunga. Pakka.", color: "#22d3ee" },
  { id: "indian-mom", name: "Indian Mom Energy", emoji: "👩", line: "Sharma ji ke bete ko dekho.", color: "#FF2E93" },
  { id: "hostel-legend", name: "Hostel Legend", emoji: "🛏️", line: "Mess ka khana + mera attitude.", color: "#8B5CF6" },
  { id: "gym-bro", name: "Gym Bro", emoji: "💪", line: "Protein over promises.", color: "#00E676" },
  { id: "cricket-expert", name: "Cricket Expert", emoji: "🏏", line: "Bhai main hota toh six tha.", color: "#16a34a" },
  { id: "tech-bro", name: "Tech Bro", emoji: "💻", line: "Bhai deployment Friday ko nahi.", color: "#60a5fa" },
  { id: "late-friend", name: "Always-Late Friend", emoji: "⏰", line: "5 min mein pahucha... 2 ghante se.", color: "#fb7185" },
  { id: "foodie", name: "Foodie Friend", emoji: "🍜", line: "Diet kal se. Aaj biryani.", color: "#fbbf24" },
  { id: "silent-friend", name: "Silent Friend", emoji: "🤫", line: "...seen 11:47 PM.", color: "#94a3b8" },
  { id: "trust-me", name: '"Bhai Trust Me" Friend', emoji: "🤝", line: "Bhai trust me, plan set hai.", color: "#FF6B1A" },
];

export const SITUATIONS: SituationCategory[] = [
  { id: "parents", emoji: "👨‍👩‍👦", label: "Indian Parents", hint: "marks, phone, relatives" },
  { id: "exams", emoji: "📚", label: "Exams", hint: "last-night padhai" },
  { id: "college", emoji: "🎓", label: "College", hint: "attendance, proxy" },
  { id: "school", emoji: "🏫", label: "School", hint: "PT period, homework" },
  { id: "hostel", emoji: "🛏️", label: "Hostel", hint: "mess, roommate" },
  { id: "cricket", emoji: "🏏", label: "Cricket", hint: "gully to IPL" },
  { id: "bollywood", emoji: "🎬", label: "Bollywood", hint: "parody trailer" },
  { id: "traffic", emoji: "🚗", label: "Traffic", hint: "auto, metro, signal" },
  { id: "food", emoji: "🍕", label: "Food", hint: "swiggy, maggi" },
  { id: "gym", emoji: "💪", label: "Gym", hint: "Jan membership" },
  { id: "friendship", emoji: "👯", label: "Friendship", hint: "no dating, only dosti" },
  { id: "shopping", emoji: "🛍️", label: "Shopping", hint: "sale, bargaining" },
  { id: "wedding", emoji: "💒", label: "Wedding", hint: "baraat, buffet" },
  { id: "relatives", emoji: "🧔", label: "Relatives", hint: "beta scope pucha?" },
  { id: "festivals", emoji: "🪔", label: "Festivals", hint: "diwali, holi" },
  { id: "travel", emoji: "🚂", label: "Travel", hint: "train, window seat" },
  { id: "gaming", emoji: "🎮", label: "Gaming", hint: "BGMI squad" },
  { id: "coding", emoji: "💻", label: "Coding", hint: "it works on my machine" },
];

export const TRENDING_ROASTS = [
  { text: "Bhai tera attendance aur IPL points table dono unpredictable hain. 💀", tag: "Student" },
  { text: "Tu gym membership lene gaya tha ya bas AC enjoy karne? 🥶", tag: "Gym" },
  { text: "Tera WiFi se zyada unstable tera 'kal se pakka' hai. 📶", tag: "Desi" },
  { text: "Bhai assignment ka deadline dekh ke tera laptop bhi resignation dena chahta hai. 💻", tag: "College" },
  { text: "Tu '5 min mein aa raha' bol ke time-travel kar leta hai kya? ⏰", tag: "Late Friend" },
  { text: "Fridge tu 7 baar khol chuka, Maggi khud jump karke nahi aayegi. 🍜", tag: "Foodie" },
  { text: "Tera confidence dekh ke lagta hai result already leak ho gaya. 💀", tag: "Bhai Mode" },
  { text: "Sharma ji ka beta bhi tera proxy lagana seekh raha hai. 📚", tag: "Parents" },
];

export const MEME_TEMPLATES = [
  { id: "pov-fridge", name: "POV Fridge Check", emoji: "🧊", desc: "7th fridge open, same dal" },
  { id: "five-min", name: '"5 Min Mein Aaya"', emoji: "⏰", desc: "Indian Standard Time" },
  { id: "kal-se", name: '"Kal Se Pakka"', emoji: "📅", desc: "India's national pledge" },
  { id: "proxy", name: "Proxy Legend", emoji: "🙋", desc: "Present sir, (3 voices)" },
  { id: "sharma-beta", name: "Sharma Ji Ka Beta", emoji: "🏆", desc: "The final boss" },
  { id: "auto-meter", name: "Auto Meter Se", emoji: "🛺", desc: "Meter se chalo bhai" },
  { id: "chai-break", name: "Chai Break", emoji: "🍵", desc: "Har problem ka solution" },
  { id: "wedding-buffet", name: "Wedding Buffet", emoji: "🍛", desc: "Paneer ke liye war" },
  { id: "cricket-sofa", name: "Sofa Selector", emoji: "🏏", desc: "Ghar baithe expert" },
  { id: "relatives-audit", name: "Relatives Audit", emoji: "🔍", desc: "Beta, scope kya hai?" },
];

export const EVERGREEN_TRENDS = [
  { emoji: "🏏", title: "Cricket sofa experts", desc: "Har ball pe selection committee" },
  { emoji: "🪔", title: "Festival prep chaos", desc: "Safai, mithai, relatives" },
  { emoji: "📚", title: "Exam-season survivors", desc: "One night, full syllabus" },
  { emoji: "🛺", title: "Auto vs Metro debates", desc: "Meter se chalo discourse" },
  { emoji: "🍜", title: "Midnight Maggi club", desc: "2 AM, hostel, legend" },
  { emoji: "💒", title: "Wedding buffet wars", desc: "Paneer counter stampede" },
];

export const DEMO_ROASTS = [
  "Bhai tu gym membership lene gaya tha ya bas AC enjoy karne? 🥶",
  "Tera WiFi se zyada unstable tera 'kal se pakka' hai. 📶💀",
  "Bhai assignment ka deadline dekh ke tera laptop bhi resignation dena chahta hai. 💻😭",
  "Tu group ka woh banda hai jo plan banata hai aur khud hi nahi aata. 📋👻",
  "Bhai tera 'bhai trust me' sun ke UPI ne bhi OTP bhejna band kar diya. 🤝💸",
  "Sharma ji ka beta bhi tera procrastination dekh ke notes maang raha hai. 📚",
];
