/* Tourism360 AI suite
 *
 * Destination-safe itinerary + recommendations engine.
 *
 * IMPORTANT RULES:
 * 1. Never use another city/destination as fallback.
 * 2. Never invent database information.
 * 3. If requested destination has no database records,
 *    return an explicit "data unavailable" message.
 * 4. Prices, ratings, availability, timings and other
 *    live information must never be fabricated.
 */

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

type Listing = Record<string, unknown>;

const normalize = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizeSlug = (value: unknown): string =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getCity = (listing: Listing): string =>
  normalize(listing.city);

const getDestinationSlug = (listing: Listing): string =>
  normalizeSlug(listing.destination_slug);

const getCategory = (listing: Listing): string =>
  normalize(listing.category);

const getTags = (listing: Listing): string[] => {
  if (Array.isArray(listing.tags)) {
    return listing.tags
      .map((tag) => normalize(tag))
      .filter(Boolean);
  }

  if (typeof listing.tags === 'string') {
    return listing.tags
      .split(',')
      .map((tag) => normalize(tag))
      .filter(Boolean);
  }

  return [];
};

/**
 * Strict destination matching.
 *
 * Example:
 * Jaipur -> only city "jaipur" or destination_slug "jaipur"
 * Jodhpur -> only city "jodhpur" or destination_slug "jodhpur"
 *
 * IMPORTANT:
 * There is intentionally NO cross-city fallback.
 */
export function matchesDestination(
  listing: Listing,
  destination: string
): boolean {
  const requestedCity = normalize(destination);
  const requestedSlug = normalizeSlug(destination);

  if (!requestedCity) {
    return false;
  }

  const city = getCity(listing);
  const slug = getDestinationSlug(listing);

  return (
    city === requestedCity ||
    slug === requestedSlug
  );
}

/**
 * Match a listing with selected interests.
 */
function interestScore(
  listing: Listing,
  interests: string[]
): number {
  if (!interests.length) {
    return 0;
  }

  const title = normalize(listing.title);
  const description = normalize(listing.description);
  const category = getCategory(listing);
  const tags = getTags(listing);

  const haystack = [
    title,
    description,
    category,
    ...tags,
  ].join(' ');

  let score = 0;

  for (const interest of interests) {
    const key = normalize(interest);

    if (!key) {
      continue;
    }

    if (haystack.includes(key)) {
      score += 5;
    }

    if (category === key) {
      score += 4;
    }

    if (tags.includes(key)) {
      score += 6;
    }
  }

  return score;
}

/**
 * Select listings ONLY from requested destination.
 */
function selectListings(
  input: PlanInput,
  listings: Listing[]
): Listing[] {
  const destinationListings = listings.filter((listing) =>
    matchesDestination(
      listing,
      input.destination
    )
  );

  /*
   * IMPORTANT:
   * Do not use another destination if there are
   * insufficient records.
   */
  if (!destinationListings.length) {
    return [];
  }

  const scored = destinationListings.map(
    (listing) => ({
      listing,
      score: interestScore(
        listing,
        input.interests
      ),
    })
  );

  const hasInterestMatch = scored.some(
    (item) => item.score > 0
  );

  if (hasInterestMatch) {
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return String(
        a.listing.title || ''
      ).localeCompare(
        String(
          b.listing.title || ''
        )
      );
    });
  }

  return scored.map(
    (item) => item.listing
  );
}

/**
 * Deterministic selection.
 *
 * No random data.
 * No cross-city fallback.
 */
const pick = (
  arr: Listing[],
  n: number,
  seed: number
): Listing[] => {
  if (!arr.length || n <= 0) {
    return [];
  }

  const out: Listing[] = [];
  const used = new Set<number>();

  for (
    let i = 0;
    i < arr.length &&
    out.length < n;
    i++
  ) {
    const index =
      (seed + i) % arr.length;

    if (!used.has(index)) {
      used.add(index);
      out.push(arr[index]);
    }
  }

  return out;
};

/**
 * Convert budget input into a numeric amount.
 *
 * Supports:
 * ₹50000
 * ₹50,000
 * 50000
 * 50,000
 * "50000"
 */
function parseBudget(
  budget: string
): number {
  if (!budget) {
    return 0;
  }

  const cleaned = String(budget)
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .replace(/[^\d.]/g, '');

  const value = Number(cleaned);

  return Number.isFinite(value)
    ? value
    : 0;
}

/**
 * Budget guidance.
 *
 * This does NOT calculate fake prices.
 * It only changes general planning advice.
 */
function getBudgetTip(
  budget: string
): string {
  const amount = parseBudget(budget);

  if (!amount) {
    return (
      'Set a trip budget to receive more suitable planning guidance. ' +
      'Current prices and availability must be confirmed directly with providers.'
    );
  }

  if (amount < 10000) {
    return (
      'With this budget, consider local transport, ' +
      'local food and selected attractions. ' +
      'Confirm current prices and availability directly with providers.'
    );
  }

  if (amount < 25000) {
    return (
      'This budget can support a balanced trip plan. ' +
      'Choose activities according to your priorities and confirm current prices and availability with providers.'
    );
  }

  if (amount < 50000) {
    return (
      'This budget allows more flexibility for stays, food and experiences. ' +
      'Actual prices and availability must still be confirmed directly with providers.'
    );
  }

  return (
    'This budget provides higher flexibility for premium stays, ' +
    'private transfers and curated experiences. ' +
    'Do not treat this as a live price estimate; confirm all current prices and availability with providers.'
  );
}

const paceLimit: Record<string, number> = {
  Relaxed: 2,
  Balanced: 3,
  Packed: 4,
};

function createEmptySlot(
  destination: string,
  category: string
): string {
  const labels: Record<
    string,
    string
  > = {
    attraction:
      'No verified attraction available in the database',

    activity:
      'No verified activity available in the database',

    experience:
      'No verified experience available in the database',

    restaurant:
      'No verified restaurant available in the database',

    hotel:
      'No verified hotel available in the database',

    shopping:
      'No verified shopping listing available in the database',

    cinema:
      'No verified cinema listing available in the database',

    event:
      'No verified event available in the database',
  };

  return (
    `${labels[category] || 'No verified listing available in the database'} ` +
    `for ${destination}.`
  );
}

function formatListing(
  listing: Listing,
  period: string
): string {
  const title = String(
    listing.title ||
      'Unnamed place'
  );

  const city = String(
    listing.city || ''
  );

  const cityText = city
    ? ` (${city})`
    : '';

  return (
    `${title}${cityText} — ${period}.`
  );
}

/**
 * Build a destination-safe itinerary.
 *
 * IMPORTANT:
 * This function NEVER uses another destination.
 */
export function buildItinerary(
  input: PlanInput,
  listings: Listing[]
): DayPlan[] {
  const destination =
    input.destination.trim();

  if (!destination) {
    return [];
  }

  const daysCount = Math.min(
    10,
    Math.max(
      1,
      Number(input.days) || 1
    )
  );

  /*
   * Strict destination filtering happens here.
   */
  const destinationListings =
    selectListings(
      input,
      listings
    );

  /*
   * Category separation is performed ONLY
   * against destinationListings.
   */
  const attractions =
    destinationListings.filter(
      (listing) =>
        [
          'attraction',
          'experience',
        ].includes(
          getCategory(listing)
        )
    );

  const activities =
    destinationListings.filter(
      (listing) =>
        getCategory(listing) ===
        'activity'
    );

  const restaurants =
    destinationListings.filter(
      (listing) =>
        getCategory(listing) ===
        'restaurant'
    );

  const hotels =
    destinationListings.filter(
      (listing) =>
        getCategory(listing) ===
        'hotel'
    );

  const shopping =
    destinationListings.filter(
      (listing) =>
        getCategory(listing) ===
        'shopping'
    );

  const cinemas =
    destinationListings.filter(
      (listing) =>
        getCategory(listing) ===
        'cinema'
    );

  const other =
    destinationListings.filter(
      (listing) => {
        const category =
          getCategory(listing);

        return ![
          'attraction',
          'experience',
          'activity',
          'restaurant',
          'hotel',
          'shopping',
          'cinema',
        ].includes(category);
      }
    );

  const days: DayPlan[] = [];

  for (
    let d = 1;
    d <= daysCount;
    d++
  ) {
    const selected: Listing[] =
      [];

    const paceCount =
      paceLimit[input.pace] ||
      paceLimit.Balanced;

    const candidatePool = [
      ...attractions,
      ...activities,
      ...shopping,
      ...other,
    ];

    const candidateStart =
      (d - 1) * paceCount;

    for (
      let i = 0;
      i < paceCount;
      i++
    ) {
      if (!candidatePool.length) {
        break;
      }

      const item =
        candidatePool[
          (candidateStart + i) %
            candidatePool.length
        ];

      if (
        item &&
        !selected.some(
          (existing) =>
            String(
              existing.id
            ) ===
            String(item.id)
        )
      ) {
        selected.push(item);
      }
    }

    const morningItem =
      selected[0] ||
      attractions[
        (d - 1) %
          Math.max(
            attractions.length,
            1
          )
      ];

    const afternoonItem =
      selected[1] ||
      activities[
        (d - 1) %
          Math.max(
            activities.length,
            1
          )
      ] ||
      shopping[
        (d - 1) %
          Math.max(
            shopping.length,
            1
          )
      ];

    const eveningItem =
      selected[2] ||
      restaurants[
        (d - 1) %
          Math.max(
            restaurants.length,
            1
          )
      ] ||
      cinemas[
        (d - 1) %
          Math.max(
            cinemas.length,
            1
          )
      ] ||
      hotels[
        (d - 1) %
          Math.max(
            hotels.length,
            1
          )
      ];

    const morning =
      morningItem
        ? formatListing(
            morningItem,
            'start early and explore'
          )
        : createEmptySlot(
            destination,
            'attraction'
          );

    const afternoon =
      afternoonItem
        ? formatListing(
            afternoonItem,
            'after lunch, explore'
          )
        : createEmptySlot(
            destination,
            'activity'
          );

    const evening =
      eveningItem
        ? formatListing(
            eveningItem,
            'evening hours'
          )
        : createEmptySlot(
            destination,
            'restaurant'
          );

    let tip =
      getBudgetTip(
        input.budget
      );

    /*
     * Explicit no-data state.
     */
    if (
      !destinationListings.length
    ) {
      tip =
        `No verified ${destination} listings are currently available in Tourism360. ` +
        'The planner will not substitute listings from another city. ' +
        'Add or verify destination data before relying on a detailed itinerary.';
    }

    /*
     * Limited-data state.
     */
    else if (
      selected.length < 3
    ) {
      tip =
        `${destination} currently has limited verified listings in Tourism360. ` +
        'The planner uses only available destination data and does not substitute listings from another city. ' +
        getBudgetTip(input.budget);
    }

    days.push({
      day: d,

      title:
        d === 1
          ? `Arrival + first sights in ${destination}`
          : d === daysCount
            ? `Farewell day in ${destination}`
            : `Deep dive — day ${d} in ${destination}`,

      morning,

      afternoon,

      evening,

      tip,
    });
  }

  return days;
}

/**
 * AI Recommendations.
 *
 * City filtering remains strict.
 *
 * If city is supplied:
 * only that city's database listings are returned.
 *
 * If no city is supplied:
 * existing behavior is preserved and all available
 * listings can be considered.
 */
export function recommend(
  prefs: {
    interests: string[];
    city: string;
    budget: string;
  },
  listings: Listing[],
  destinations: Listing[]
) {
  /*
   * Budget is intentionally not used to fabricate
   * price-based recommendations.
   */
  void prefs.budget;

  const city =
    normalize(prefs.city);

  const cityListings =
    city
      ? listings.filter(
          (listing) =>
            matchesDestination(
              listing,
              city
            )
        )
      : listings;

  const score = (
    listing: Listing
  ) => {
    let scoreValue = 0;

    scoreValue +=
      interestScore(
        listing,
        prefs.interests
      );

    const category =
      getCategory(listing);

    if (
      category ===
        'experience' ||
      category ===
        'attraction'
    ) {
      scoreValue += 1;
    }

    return scoreValue;
  };

  const ranked =
    [...cityListings]
      .map((listing) => ({
        ...listing,
        _s: score(listing),
      }))
      .sort(
        (a, b) =>
          Number(b._s || 0) -
          Number(a._s || 0)
      )
      .slice(0, 6);

  const destinationResults =
    city
      ? destinations.filter(
          (destination) =>
            normalize(
              destination.name
            ) === city ||
            normalizeSlug(
              destination.slug
            ) ===
              normalizeSlug(city)
        )
      : destinations.slice(0, 3);

  return {
    picks: ranked,
    destinations:
      destinationResults,
  };
}

/**
 * Database-aware fallback chatbot.
 *
 * This function is intentionally kept for backward compatibility
 * with the existing ChatPanel.
 *
 * The real Google/Gemini AI chatbot will be connected through
 * the server API separately, so the API key is NEVER exposed
 * in frontend code.
 *
 * Until that server connection is used, this fallback gives
 * truthful Tourism360-specific answers only.
 */
export function chatReply(
  msg: string,
  lang: string
): string {
  const m =
    normalize(msg);

  const hi =
    lang === 'hi';

  const has = (
    ...words: string[]
  ) =>
    words.some(
      (word) =>
        m.includes(
          normalize(word)
        )
    );

  if (
    has(
      'hello',
      'hi',
      'hey',
      'namaste'
    )
  ) {
    return hi
      ? 'नमस्ते! मैं Tourism360 AI Assistant हूँ। आप destination, hotel, restaurant, trip planning, events, safety या Tourism360 के features के बारे में पूछ सकते हैं।'
      : 'Hello! I am the Tourism360 AI Assistant. You can ask about destinations, hotels, restaurants, trip planning, events, safety or Tourism360 features.';
  }

  if (
    has(
      'weather',
      'temperature',
      'मौसम'
    )
  ) {
    return hi
      ? 'Live weather Tourism360 के destination/city pages पर Open-Meteo से दिखाया जाता है। किसी city को खोलकर weather section देखें।'
      : 'Live weather is shown on Tourism360 destination/city pages using Open-Meteo. Open a city page to see the available weather information.';
  }

  if (
    has(
      'plan',
      'itinerary',
      'trip',
      'यात्रा',
      'प्लान'
    )
  ) {
    return hi
      ? 'AI Trip Planner में destination, days, budget, interests और pace चुनें। Planner केवल selected destination के database records का उपयोग करता है; दूसरे शहर का data fallback के रूप में नहीं लिया जाता।'
      : 'Use the AI Trip Planner with a destination, number of days, budget, interests and pace. The planner uses only database records belonging to the selected destination and never falls back to another city.';
  }

  if (
    has(
      'hotel',
      'hotels',
      'stay'
    )
  ) {
    return hi
      ? 'Hotels section में city के हिसाब से available database listings देखें। अगर किसी city के लिए verified hotel data नहीं है, Tourism360 उसे invent नहीं करेगा।'
      : 'Use the Hotels section and filter by city. If verified hotel data is not available for a city, Tourism360 will not invent a hotel listing.';
  }

  if (
    has(
      'restaurant',
      'restaurants',
      'food',
      'eat'
    )
  ) {
    return hi
      ? 'Restaurants section में city के अनुसार database में उपलब्ध restaurants देखें। Database में record नहीं होने पर Tourism360 कोई restaurant information fabricate नहीं करेगा।'
      : 'Use the Restaurants section to see restaurant records available for the selected city. Tourism360 will not fabricate restaurant information that is not in the database.';
  }

  if (
    has(
      'price',
      'cost',
      'fare',
      'कीमत',
      'दाम'
    )
  ) {
    return hi
      ? 'Tourism360 live prices या fares को fabricate नहीं करता। Database में available indicative information हो तो वही दिखाई जाएगी; current price provider से confirm करें।'
      : 'Tourism360 does not fabricate live prices or fares. If indicative information exists in the database, that information can be shown; confirm current prices directly with the provider.';
  }

  if (
    has(
      'safe',
      'safety',
      'emergency',
      'sos',
      'help'
    )
  ) {
    return hi
      ? 'Safety section में emergency guidance और SOS information उपलब्ध है। Emergency में local authorities की official guidance follow करें।'
      : 'The Safety section provides emergency guidance and SOS information. In an emergency, follow official local authority guidance.';
  }

  if (
    has(
      'book',
      'booking',
      'reserve'
    )
  ) {
    return hi
      ? 'Tourism360 में available listing से booking request Dashboard में save हो सकती है। Live payment या booking confirmation तभी मानें जब system/provider उसे explicitly confirm करे।'
      : 'A booking request can be saved from an available Tourism360 listing. Do not treat it as a live payment or confirmed reservation unless the system/provider explicitly confirms it.';
  }

  if (
    has(
      'guide',
      'agent',
      'business',
      'owner'
    )
  ) {
    return hi
      ? 'Guide, Travel Agent या Business Owner role के लिए Register करके संबंधित dashboard features use किए जा सकते हैं।'
      : 'You can register as a Guide, Travel Agent or Business Owner and use the corresponding dashboard features.';
  }

  if (
    has(
      'cinema',
      'movie',
      'theatre'
    )
  ) {
    return hi
      ? 'Cinema section में database में उपलब्ध cinema information देखें। Showtimes को live confirmation के बिना final न मानें।'
      : 'Use the Cinema section for cinema information available in the database. Do not treat showtimes as final without live confirmation.';
  }

  if (
    has(
      'event',
      'events',
      'festival',
      'concert'
    )
  ) {
    return hi
      ? 'Events section में database में उपलब्ध festivals, events और cultural activities देखें। अगर event data available नहीं है तो Tourism360 उसे create करके नहीं दिखाएगा।'
      : 'Use the Events section for festivals, events and cultural activities available in the database. If event data is unavailable, Tourism360 will not fabricate it.';
  }

  if (
    has(
      'thank',
      'thanks',
      'धन्यवाद'
    )
  ) {
    return hi
      ? 'आपका स्वागत है! शुभ यात्रा! ✈️'
      : 'You are welcome! Happy travels! ✈️';
  }

  /*
   * IMPORTANT:
   * Do not pretend the rule engine knows an answer
   * that is not actually available.
   */
  return hi
    ? 'इस सवाल के लिए मेरे पास अभी Tourism360 database में पर्याप्त verified information नहीं है। आप destination, hotels, restaurants, attractions, events, itinerary या safety के बारे में पूछ सकते हैं।'
    : 'I do not have enough verified information in the Tourism360 database to answer that accurately. You can ask about destinations, hotels, restaurants, attractions, events, itineraries or safety.';
}