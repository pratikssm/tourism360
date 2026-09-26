/* Tourism360 AI suite — rule-based engine, LLM future-ready (pluggable provider) */

export interface PlanInput {
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  pace: string;
}

export interface DayPlan {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  tip: string;
}

const pick = (arr: unknown[], n: number, seed: number): unknown[] => {
  if (!arr.length) return [];
  const out: unknown[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed + i) % arr.length]);
  return out;
};

export function buildItinerary(input: PlanInput, listings: Record<string, unknown>[]): DayPlan[] {
  const first = input.destination.toLowerCase().split(',')[0].trim();
  const pool = listings.filter((l) =>
    !input.destination ||
    String(l.city || '').toLowerCase().includes(first) ||
    l.destination_slug
  );
  const src = pool.length >= 3 ? pool : listings;
  const days: DayPlan[] = [];
  const budgetTip: Record<string, string> = {
    Budget: 'Use metro/local buses, eat at local dhabas, and book stays early for the best indicative deals.',
    Comfort: 'Mix 1 premium experience per day with relaxed cafe breaks and a mid-range stay.',
    Luxury: 'Private transfers, curated guided tours, and fine-dining evenings — confirm all reservations directly.',
  };
  for (let d = 1; d <= input.days; d++) {
    const [a, b, c] = pick(src, 3, (d - 1) * 3) as Record<string, unknown>[];
    days.push({
      day: d,
      title: d === 1 ? `Arrival + first sights in ${input.destination}` : d === input.days ? `Farewell day in ${input.destination}` : `Deep dive — day ${d} in ${input.destination}`,
      morning: a ? `${a.title} (${a.city}) — start early, ~2-3 hrs.` : 'Heritage walk + local breakfast.',
      afternoon: b ? `${b.title} (${b.city}) — lunch nearby, then explore.` : 'Museum / market + lunch.',
      evening: c ? `${c.title} (${c.city}) — sunset hours.` : 'Sunset point + dinner.',
      tip: budgetTip[input.budget] || budgetTip.Comfort,
    });
  }
  return days;
}

export function recommend(
  prefs: { interests: string[]; city: string; budget: string },
  listings: Record<string, unknown>[],
  destinations: Record<string, unknown>[]
) {
  void prefs.budget;
  const score = (l: Record<string, unknown>) => {
    let s = 0;
    const tags = Array.isArray(l.tags) ? (l.tags as string[]).join(' ') : '';
    const hay = `${l.title} ${l.description} ${l.category} ${tags}`.toLowerCase();
    prefs.interests.forEach((i) => { if (hay.includes(i.toLowerCase())) s += 3; });
    if (prefs.city && String(l.city || '').toLowerCase().includes(prefs.city.toLowerCase())) s += 4;
    if (l.category === 'experience' || l.category === 'attraction') s += 1;
    return s;
  };
  const ranked = [...listings].map((l) => ({ ...l, _s: score(l) })).sort((a, b) => (b._s as number) - (a._s as number)).slice(0, 6);
  const dests = [...destinations].slice(0, 3);
  return { picks: ranked, destinations: dests };
}

export function chatReply(msg: string, lang: string): string {
  const m = msg.toLowerCase();
  const hi = lang === 'hi';
  const has = (...ws: string[]) => ws.some((w) => m.includes(w));
  if (has('hello', 'hi ', 'hey', 'namaste')) return hi ? 'नमस्ते! मैं Tourism360 सहायक हूँ। बताइए — डेस्टिनेशन, होटल, प्लान या मौसम, क्या चाहिए?' : 'Hello! I am the Tourism360 assistant. Ask me about destinations, hotels, trip plans, weather or safety.';
  if (has('weather', 'temperature')) return hi ? 'किसी भी शहर के पेज पर लाइव मौसम Open-Meteo से दिखता है। Destinations पर जाएँ और शहर खोलें।' : 'Live weather (Open-Meteo) appears on every destination/city page. Open any city to see current conditions.';
  if (has('plan', 'itinerary', 'trip')) return hi ? 'AI Trip Planner में शहर, दिन और बजट चुनें — मैं दिन-वार प्लान बना दूँगा।' : 'Head to the AI Trip Planner: pick a destination, days and budget and I will build a day-wise itinerary.';
  if (has('hotel', 'stay')) return hi ? 'Hotels पेज पर शहर चुनकर फ़िल्टर करें। कीमतें सांकेतिक हैं — बुकिंग से पहले प्रोवाइडर से पुष्टि करें।' : 'Use the Hotels page and filter by city. Prices shown are indicative only — always confirm with the provider.';
  if (has('price', 'cost', 'fare')) return hi ? 'हम लाइव कीमत/भाड़ा नहीं दिखाते। Transport और listing पेज पर सांकेतिक जानकारी ही है।' : 'We never fabricate live prices or fares. Listings show indicative info only; confirm with providers.';
  if (has('safe', 'emergency', 'sos', 'help')) return hi ? 'Safety पेज पर हेल्पलाइन 112, सलाह और SOS कार्ड है।' : 'See the Safety page for helpline 112, travel advisories and the SOS card.';
  if (has('book')) return hi ? 'किसी listing पर Book दबाएँ — यह request के रूप में Dashboard में सेव होगी। पेमेंट अभी उपलब्ध नहीं।' : 'Tap Book on any listing — it saves as a request in your dashboard. No payments are taken right now.';
  if (has('guide', 'agent', 'business', 'owner')) return hi ? 'Guide/Agent/Owner के रूप में Register करें और Dashboard से listings व bookings संभालें।' : 'Register as a Guide, Agent or Business Owner to manage listings and bookings from your dashboard.';
  if (has('cinema', 'movie')) return hi ? 'Cinema पेज पर सांकेतिक सूची है — शो टाइम थियेटर से कन्फर्म करें।' : 'The Cinema page shows an indicative line-up — confirm showtimes with the theatre directly.';
  if (has('thank')) return hi ? 'आपका स्वागत है! शुभ यात्रा!' : 'You are welcome! Happy travels!';
  if (has('food', 'restaurant', 'eat')) return hi ? 'Restaurants पेज पर शहर के हिसाब से खाना खोजें — थाली, कैफे, स्ट्रीट फूड सब मिलेगा।' : 'Check the Restaurants page filtered by city — thalis, cafes, street food and fine dining.';
  if (has('event', 'festival', 'concert')) return hi ? 'Events पेज पर त्योहार, कॉन्सर्ट और कल्चरल नाइट्स देखें।' : 'Browse the Events page for festivals, concerts and cultural nights.';
  return hi ? 'समझ गया! Destinations, Hotels, Events, Planner या Safety में से कुछ पूछें — या Explore में सर्च करें।' : 'Got it! Ask about destinations, hotels, events, the planner or safety — or search in Explore.';
}
