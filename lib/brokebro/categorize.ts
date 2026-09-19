/** Rule-based auto-categorization. Always overridable by the user. */
const RULES: Array<{ cat: string; keys: string[] }> = [
  { cat: "Food", keys: ["zomato", "swiggy", "canteen", "mess", "chai", "maggi", "pizza", "burger", "cafe", "restaurant", "food", "dominos", "eat"] },
  { cat: "Transport", keys: ["uber", "ola", "rapido", "metro", "bus", "auto", "petrol", "cab", "train", "transport"] },
  { cat: "Entertainment", keys: ["movie", "pvr", "inox", "concert", "game", "party", "netflix", "spotify", "bookmyshow"] },
  { cat: "Shopping", keys: ["amazon", "flipkart", "myntra", "shirt", "shoes", "shopping", "decathlon", "uniqlo"] },
  { cat: "Education", keys: ["course", "udemy", "coursera", "book", "xerox", "print", "stationery", "fees", "college"] },
  { cat: "Hostel", keys: ["hostel", "rent", "room", "pg ", "warden"] },
  { cat: "Bills", keys: ["recharge", "jio", "airtel", "vi ", "electricity", "wifi", "bill", "broadband"] },
  { cat: "Health", keys: ["pharma", "doctor", "apollo", "med", "gym", "health", "clinic"] },
  { cat: "Subscriptions", keys: ["subscription", "prime", "hotstar", "icloud", "google one", "youtube premium"] },
  { cat: "Travel", keys: ["flight", "makemytrip", "goibibo", "hotel", "trip", "goa", "travel", "irctc"] },
];

export function suggestCategory(input: string): { category: string; confidence: "high" | "low" } {
  const s = input.toLowerCase();
  for (const r of RULES) {
    if (r.keys.some((k) => s.includes(k))) return { category: r.cat, confidence: "high" };
  }
  return { category: "Other", confidence: "low" };
}

export function parseQuickAdd(input: string): { amount?: number; text: string } {
  const m = input.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return { amount: m ? Number(m[1]) : undefined, text: input };
}
