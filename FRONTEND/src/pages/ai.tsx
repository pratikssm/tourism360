import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  Download,
  ExternalLink,
  IndianRupee,
  Lightbulb,
  MapPin,
  Minus,
  Plus,
  Share2,
  Sparkles,
  Users,
  Wallet,
  Printer,
  Hotel,
  Bus,
} from 'lucide-react';

import {
  ChatPanel,
  DetailDrawer,
  EmptyState,
  SectionHead,
} from '../components/ui';

import api from '../lib/api';

import {
  buildItinerary,
  recommend,
  type DayPlan,
  type PlanInput,
} from '../lib/ai';


type Listing = Record<string, any>;

type BudgetLevel =
  | 'Budget'
  | 'Comfort'
  | 'Premium'
  | 'Luxury'
  | 'Custom';

type Pace =
  | 'Relaxed'
  | 'Balanced'
  | 'Packed';

type HotelPreference =
  | 'Any'
  | 'Budget'
  | 'Comfort'
  | 'Premium'
  | 'Luxury';

type TransportPreference =
  | 'Any'
  | 'Cab'
  | 'Bus'
  | 'Train'
  | 'Flight'
  | 'Self Drive';

type PlannerActivity = Listing & {
  plannerSlot: 'Morning' | 'Afternoon' | 'Evening';
  plannerDuration: string;
};

const TRIP_TITLES = [
  'My India Adventure',
  'Weekend Getaway',
  'Family Vacation',
  'Romantic Escape',
  'Friends Trip',
  'Luxury Holiday',
  'Cultural Exploration',
  'Nature & Adventure',
];

const INTERESTS = [
  'Attractions',
  'Food',
  'Culture',
  'Adventure',
  'Shopping',
  'Nature',
  'History',
  'Entertainment',
];

const BUDGET_RANGES = {
  Budget: {
    min: 1500,
    max: 2500,
    label: '₹1,500–₹2,500/day',
  },

  Comfort: {
    min: 3000,
    max: 5000,
    label: '₹3,000–₹5,000/day',
  },

  Premium: {
    min: 6000,
    max: 10000,
    label: '₹6,000–₹10,000/day',
  },

  Luxury: {
    min: 12000,
    max: 25000,
    label: '₹12,000–₹25,000+/day',
  },
};

const SLOT_META = [
  {
    slot: 'Morning' as const,
    duration: '2–3 hrs',
  },
  {
    slot: 'Afternoon' as const,
    duration: '1–2 hrs',
  },
  {
    slot: 'Evening' as const,
    duration: '1–2 hrs',
  },
];

function normalize(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizeSlug(value: unknown) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchesDestination(
  listing: Listing,
  destination: string
) {
  const city = normalize(listing.city);

  const slug = normalizeSlug(
    listing.destination_slug
  );

  const requested = normalize(destination);

  const requestedSlug =
    normalizeSlug(destination);

  return (
    city === requested ||
    slug === requestedSlug
  );
}

function parseMoney(value: string) {
  const cleaned = value
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .replace(/[^\d.]/g, '');

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    'en-IN',
    {
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function getBudgetLevel(
  dailyBudget: number
): BudgetLevel {
  if (!dailyBudget) {
    return 'Custom';
  }

  if (dailyBudget < 3000) {
    return 'Budget';
  }

  if (dailyBudget < 6000) {
    return 'Comfort';
  }

  if (dailyBudget < 12000) {
    return 'Premium';
  }

  return 'Luxury';
}

function getBudgetDescription(
  level: BudgetLevel
) {
  if (level === 'Budget') {
    return 'Local transport, local food and selected attractions.';
  }

  if (level === 'Comfort') {
    return 'Balanced stays, food, transport and sightseeing.';
  }

  if (level === 'Premium') {
    return 'More flexibility for better stays and experiences.';
  }

  if (level === 'Luxury') {
    return 'Premium stays, private transfers and curated experiences.';
  }

  return 'Custom budget based on your total trip amount.';
}

function getDailyRange(
  level: BudgetLevel
) {
  if (
    level === 'Budget' ||
    level === 'Comfort' ||
    level === 'Premium' ||
    level === 'Luxury'
  ) {
    return BUDGET_RANGES[level];
  }

  return null;
}

function getDestinationName(
  destination: Listing
) {
  return String(
    destination.name ||
      destination.title ||
      ''
  );
}

function getDestinationCity(
  destination: Listing
) {
  return String(
    destination.state ||
      ''
  );
}

function formatDisplayDate(
  value: string
) {
  if (!value) {
    return '';
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}

function calculateDays(
  start: string,
  end: string
) {
  if (!start || !end) {
    return 0;
  }

  const startDate = new Date(
    `${start}T00:00:00`
  );

  const endDate = new Date(
    `${end}T00:00:00`
  );

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return 0;
  }

  const difference =
    endDate.getTime() -
    startDate.getTime();

  const days =
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return days > 0 ? days : 0;
}

function addDays(
  dateString: string,
  amount: number
) {
  if (!dateString) {
    return '';
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  date.setDate(
    date.getDate() + amount
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function ListingRecommendationCard({
  listing,
  onDetails,
}: {
  listing: Listing;
  onDetails?: () => void;
}) {
  const image =
    String(
      listing.image_url ||
        listing.image ||
        ''
    );

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-900">
      {image ? (
        <img
          src={image}
          alt={String(
            listing.title ||
              'Tourism360 listing'
          )}
          className="h-44 w-full object-cover"
          onError={(event) => {
            (
              event.target as HTMLImageElement
            ).style.display = 'none';
          }}
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-slate-100 dark:bg-white/5">
          <Compass
            className="text-slate-400"
            size={36}
          />
        </div>
      )}

      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-600">
          <span>
            {String(
              listing.category ||
                'Listing'
            )}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {String(
            listing.title ||
              'Unnamed listing'
          )}
        </h3>

        {listing.city ? (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={14} />
            <span>
              {String(
                listing.city
              )}
            </span>
          </div>
        ) : null}

        {listing.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {String(
              listing.description
            )}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500">
            {listing.data_status
              ? String(
                  listing.data_status
                )
              : 'Tourism360 record'}
          </span>

          {onDetails ? (
            <button
              type="button"
              onClick={onDetails}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
            >
              Details
              <ExternalLink size={13} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DayActivityCard({
  activity,
  onDetails,
}: {
  activity: PlannerActivity;
  onDetails: () => void;
}) {
  const image = String(
    activity.image_url ||
      activity.image ||
      ''
  );

  const title = String(
    activity.title ||
      activity.name ||
      'Tourism360 activity'
  );

  const category = String(
    activity.category ||
      'Experience'
  );

  const description = String(
    activity.description ||
      'Explore this Tourism360 destination experience.'
  );

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-teal-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-stretch dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
      <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-40">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(event) => {
              (
                event.target as HTMLImageElement
              ).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-white/10">
            <Compass
              size={28}
              className="text-slate-400"
            />
          </div>
        )}

        <span className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold uppercase text-white backdrop-blur">
          {category}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-teal-700 dark:text-teal-300">
              {activity.plannerSlot}
            </span>

            <span className="text-slate-400">
              •
            </span>

            <span className="text-slate-500">
              {activity.plannerDuration}
            </span>
          </div>

          <h4 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
            {title}
          </h4>

          {activity.city ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={12} />
              {String(
                activity.city
              )}
            </div>
          ) : null}

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[11px] font-medium text-slate-400">
            Tourism360 record
          </div>

          <button
            type="button"
            onClick={onDetails}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            Details
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DayCard({
  day,
  date,
  activities,
  expanded,
  onToggle,
  onDetails,
}: {
  day: DayPlan;
  date?: string;
  activities: PlannerActivity[];
  expanded: boolean;
  onToggle: () => void;
  onDetails: (
    activity: PlannerActivity
  ) => void;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-black text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              {day.day}
            </div>

            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-teal-600 dark:text-teal-300">
                Day {day.day}
              </div>

              <h3 className="mt-0.5 truncate text-base font-extrabold text-slate-900 dark:text-white">
                {day.title}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {date ? (
                  <>
                    <CalendarDays size={13} />
                    <span>
                      {formatDisplayDate(
                        date
                      )}
                    </span>
                  </>
                ) : null}

                <span>
                  {activities.length}{' '}
                  {activities.length ===
                  1
                    ? 'activity'
                    : 'activities'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex dark:bg-white/5 dark:text-slate-300">
              {expanded
                ? 'Hide details'
                : 'View activities'}
            </span>

            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {expanded ? (
                <ChevronUp size={17} />
              ) : (
                <ChevronDown size={17} />
              )}
            </span>
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-slate-100 p-4 sm:p-5 dark:border-white/10">

          {activities.length ? (
            <div className="space-y-3">
              {activities.map(
                (activity) => (
                  <DayActivityCard
                    key={String(
                      activity.id ??
                        `${activity.title}-${activity.plannerSlot}`
                    )}
                    activity={
                      activity
                    }
                    onDetails={() =>
                      onDetails(
                        activity
                      )
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No matching activities
              are currently available for this
              day.
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}


export function PlannerPage() {
  const [destinations, setDestinations] =
    useState<Listing[]>([]);

  const [listings, setListings] =
    useState<Listing[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [
    recommendationLoading,
    setRecommendationLoading,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [dataMessage, setDataMessage] =
    useState('');

  const [
    recommendationMessage,
    setRecommendationMessage,
  ] = useState('');

  const [plan, setPlan] =
    useState<DayPlan[]>([]);

  const [
    recommendationPicks,
    setRecommendationPicks,
  ] = useState<Listing[]>([]);

  const [
    selectedRecommendationDestinations,
    setSelectedRecommendationDestinations,
  ] = useState<Listing[]>([]);

  const [
    selectedDetail,
    setSelectedDetail,
  ] = useState<Listing | null>(null);

  const [saved, setSaved] =
    useState(false);

  const [expandedDays, setExpandedDays] =
    useState<Record<number, boolean>>({
      1: true,
    });

  const [input, setInput] =
    useState<PlanInput>({
      destination: '',
      days: 3,
      budget: '',
      interests: [
        'Attractions',
        'Food',
      ],
      pace: 'Balanced',
    });

  const [tripTitle, setTripTitle] =
    useState(
      'My India Adventure'
    );

  const [startDate, setStartDate] =
    useState('');

  const [endDate, setEndDate] =
    useState('');

  const [travellers, setTravellers] =
    useState(2);

  const [
    hotelPreference,
    setHotelPreference,
  ] =
    useState<HotelPreference>('Any');

  const [
    transportPreference,
    setTransportPreference,
  ] =
    useState<TransportPreference>('Any');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [
          destinationData,
          listingData,
        ] = await Promise.all([
          api.destinations(),
          api.listings(),
        ]);

        if (!mounted) {
          return;
        }

        setDestinations(
          Array.isArray(
            destinationData
          )
            ? destinationData
            : []
        );

        setListings(
          Array.isArray(
            listingData
          )
            ? listingData
            : []
        );
      } catch (err) {
        console.error(
          'Planner data loading error:',
          err
        );

        if (mounted) {
          setError(
            'Tourism360 data could not be loaded right now.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const destinationListings =
    useMemo(() => {
      const destination =
        input.destination.trim();

      if (!destination) {
        return [];
      }

      return listings.filter(
        (listing) =>
          matchesDestination(
            listing,
            destination
          )
      );
    }, [
      listings,
      input.destination,
    ]);

  const destinationExists =
    useMemo(() => {
      const destination =
        normalize(
          input.destination
        );

      if (!destination) {
        return false;
      }

      return destinations.some(
        (item) =>
          normalize(
            item.name
          ) === destination ||
          normalizeSlug(
            item.slug
          ) ===
            normalizeSlug(
              destination
            )
      );
    }, [
      destinations,
      input.destination,
    ]);

  const dateDays =
    calculateDays(
      startDate,
      endDate
    );

  const effectiveDays =
    dateDays ||
    input.days;

  const totalBudget =
    parseMoney(
      input.budget
    );

  const dailyBudget =
    totalBudget > 0 &&
    effectiveDays > 0
      ? totalBudget /
        effectiveDays
      : 0;

  const budgetLevel =
    getBudgetLevel(
      dailyBudget
    );

  const budgetRange =
    getDailyRange(
      budgetLevel
    );

  const budgetLooksSuitable =
    budgetRange &&
    dailyBudget >=
      budgetRange.min &&
    dailyBudget <=
      budgetRange.max;

  const activitiesByDay =
    useMemo(() => {
      const map: Record<
        number,
        PlannerActivity[]
      > = {};

      if (!destinationListings.length) {
        return map;
      }

      /*
       * Interest-aware planner selection.
       *
       * We still use ONLY records from the
       * selected destination, but we now
       * prioritize listing categories that
       * match the interests selected by the
       * traveller.
       *
       * Example:
       * Food -> restaurant records
       * Shopping -> shopping records
       * History/Culture -> attractions
       * Adventure/Nature -> activities/experiences
       * Entertainment -> cinema/events/activities
       */
      const selectedInterests = input.interests.map(
        (interest) => normalize(interest)
      );

      const categoryForInterest: Record<string, string[]> = {
        attractions: ['attraction'],
        food: ['restaurant'],
        culture: ['attraction', 'experience', 'activity'],
        adventure: ['activity', 'experience'],
        shopping: ['shopping'],
        nature: ['activity', 'experience', 'attraction'],
        history: ['attraction'],
        entertainment: ['cinema', 'event', 'activity', 'experience'],
      };

      const getCategory = (listing: Listing) =>
        normalize(listing.category || listing.type);

      const interestScore = (listing: Listing) => {
        if (!selectedInterests.length) {
          return 0;
        }

        const category = getCategory(listing);
        const title = normalize(listing.title);
        const tags = normalize(
          Array.isArray(listing.tags)
            ? listing.tags.join(' ')
            : listing.tags
        );
        const text = `${category} ${title} ${tags}`;

        return selectedInterests.reduce((score, interest) => {
          const categories = categoryForInterest[interest] || [];

          if (categories.includes(category)) {
            return score + 100;
          }

          if (text.includes(interest)) {
            return score + 60;
          }

          if (
            interest === 'food' &&
            (text.includes('food') || text.includes('restaurant') || text.includes('cafe'))
          ) {
            return score + 80;
          }

          if (
            interest === 'history' &&
            (text.includes('fort') || text.includes('palace') || text.includes('museum') || text.includes('historic'))
          ) {
            return score + 70;
          }

          if (
            interest === 'culture' &&
            (text.includes('culture') || text.includes('heritage') || text.includes('market'))
          ) {
            return score + 70;
          }

          return score;
        }, 0);
      };

      const rankedListings = [...destinationListings].sort((a, b) => {
        const scoreDiff = interestScore(b) - interestScore(a);

        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return String(a.title || '').localeCompare(
          String(b.title || '')
        );
      });

      // Put matching-interest records first, then use other records from
      // the SAME destination as unique fallbacks. Never repeat a listing.
      const uniquePool = rankedListings.filter((listing, index, all) => {
        const id = String(
          listing.id ??
            `${listing.category || listing.type || 'listing'}-${listing.title || ''}-${listing.address || ''}`
        );

        return all.findIndex((candidate) =>
          String(
            candidate.id ??
              `${candidate.category || candidate.type || 'listing'}-${candidate.title || ''}-${candidate.address || ''}`
          ) === id
        ) === index;
      });

      let poolIndex = 0;

      for (
        let dayIndex = 0;
        dayIndex < plan.length;
        dayIndex++
      ) {
        const dayNumber = dayIndex + 1;
        const selected: PlannerActivity[] = [];

        for (
          let slotIndex = 0;
          slotIndex < SLOT_META.length;
          slotIndex++
        ) {
          const listing = uniquePool[poolIndex];

          // If there are not enough unique records, leave the slot empty
          // instead of showing the same place again.
          if (!listing) break;

          selected.push({
            ...listing,
            image_url:
              listing.image_url ||
              listing.image ||
              '',
            plannerSlot: SLOT_META[slotIndex].slot,
            plannerDuration: SLOT_META[slotIndex].duration,
          });

          poolIndex++;
        }

        map[dayNumber] = selected;
      }

      return map;
    }, [
      destinationListings,
      input.interests,
      plan,
    ]);

  const toggleInterest = (
    interest: string
  ) => {
    setInput((current) => {
      const exists =
        current.interests.includes(
          interest
        );

      return {
        ...current,
        interests: exists
          ? current.interests.filter(
              (item) =>
                item !==
                interest
            )
          : [
              ...current.interests,
              interest,
            ],
      };
    });

    setPlan([]);
    setSaved(false);
  };

  const clearGeneratedResults =
    () => {
      setPlan([]);
      setRecommendationPicks([]);
      setSelectedRecommendationDestinations(
        []
      );
      setRecommendationMessage('');
      setDataMessage('');
      setSaved(false);
    };

  const handleDestinationChange = (
    value: string
  ) => {
    setInput((current) => ({
      ...current,
      destination: value,
    }));

    clearGeneratedResults();
  };

  const handleDaysChange = (
    value: number
  ) => {
    const days = Math.min(
      10,
      Math.max(
        1,
        value || 1
      )
    );

    setInput((current) => ({
      ...current,
      days,
    }));

    /*
     * If a start date is selected,
     * keep the date range synchronized
     * with the number of days.
     */
    if (startDate) {
      setEndDate(
        addDays(
          startDate,
          days - 1
        )
      );
    }

    clearGeneratedResults();
  };

  const handleStartDateChange = (
    value: string
  ) => {
    setStartDate(value);

    if (value) {
      const days =
        input.days || 1;

      setEndDate(
        addDays(
          value,
          days - 1
        )
      );
    } else {
      setEndDate('');
    }

    clearGeneratedResults();
  };

  const handleEndDateChange = (
    value: string
  ) => {
    setEndDate(value);

    if (
      startDate &&
      value
    ) {
      const days =
        calculateDays(
          startDate,
          value
        );

      if (
        days >= 1 &&
        days <= 10
      ) {
        setInput(
          (current) => ({
            ...current,
            days,
          })
        );
      }
    }

    clearGeneratedResults();
  };

  const generatePlan = async () => {
    const destination =
      input.destination.trim();

    if (!destination) {
      setError(
        'Please select a destination first.'
      );
      return;
    }

    if (!totalBudget) {
      setError(
        'Please enter your total trip budget.'
      );
      return;
    }

    if (
      startDate &&
      endDate &&
      dateDays > 10
    ) {
      setError(
        'The planner currently supports trips up to 10 days.'
      );
      return;
    }

    if (
      startDate &&
      endDate &&
      dateDays < 1
    ) {
      setError(
        'End date must be on or after the start date.'
      );
      return;
    }

    if (
      startDate &&
      !endDate
    ) {
      setError(
        'Please select an end date.'
      );
      return;
    }

    if (
      endDate &&
      !startDate
    ) {
      setError(
        'Please select a start date.'
      );
      return;
    }

    if (
      !destinationListings.length
    ) {
      setPlan([]);

      setDataMessage(
        `No listings available for ${destination}.`
      );

      return;
    }

    setError('');
    setDataMessage('');
    setGenerating(true);
    setSaved(false);

    try {
      const plannerInput: PlanInput = {
        ...input,
        days: effectiveDays,
      };

      /*
       * IMPORTANT:
       * Only destinationListings are passed
       * to the itinerary generator.
       */
      const result =
        buildItinerary(
          plannerInput,
          destinationListings
        );

      setPlan(result);

      const expanded: Record<
        number,
        boolean
      > = {};

      result.forEach(
        (day) => {
          expanded[day.day] =
            day.day === 1;
        }
      );

      setExpandedDays(
        expanded
      );

      if (!result.length) {
        setDataMessage(
          `No itinerary could be generated because verified data for ${destination} is not available.`
        );
      }
    } catch (err) {
      console.error(
        'Planner generation error:',
        err
      );

      setError(
        'The itinerary could not be generated. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const generateRecommendations =
    async () => {
      const city =
        input.destination.trim();

      if (!city) {
        setRecommendationMessage(
          'Select a destination first.'
        );
        return;
      }

      if (
        !destinationListings.length
      ) {
        setRecommendationPicks(
          []
        );

        setSelectedRecommendationDestinations(
          []
        );

        setRecommendationMessage(
          `No verified ${city} listing data is currently available in Tourism360. No recommendations were generated.`
        );

        return;
      }

      setRecommendationLoading(
        true
      );

      setRecommendationMessage(
        ''
      );

      try {
        const result =
          recommend(
            {
              interests:
                input.interests,
              city,
              budget:
                input.budget,
            },
            listings,
            destinations
          );

        setRecommendationPicks(
          result.picks
        );

        setSelectedRecommendationDestinations(
          result.destinations
        );

        if (
          !result.picks.length
        ) {
          setRecommendationMessage(
            `No verified recommendation data is currently available for ${city}.`
          );
        }
      } catch (err) {
        console.error(
          'Recommendation error:',
          err
        );

        setRecommendationMessage(
          'Recommendations could not be generated right now.'
        );
      } finally {
        setRecommendationLoading(
          false
        );
      }
    };

  const saveTrip = async () => {
    if (!plan.length) {
      return;
    }

    try {
      setSaved(false);

      await api.createTrip({
        title: tripTitle,
        destination:
          input.destination,
        days: effectiveDays,
        budget:
          input.budget,
        preferences: {
          interests:
            input.interests,
          pace: input.pace,
          dailyBudget,
          budgetLevel,
          startDate,
          endDate,
          travellers,
          hotelPreference,
          transportPreference,
        },
        itinerary: plan,
      });

      setSaved(true);
    } catch (err) {
      console.error(
        'Trip save error:',
        err
      );

      setError(
        'The trip could not be saved right now.'
      );
    }
  };

  const exportPlan = () => {
    if (!plan.length) {
      return;
    }

    const lines: string[] = [];

    lines.push(
      `Tourism360 — ${tripTitle}`
    );

    lines.push(
      `Destination: ${input.destination}`
    );

    if (startDate) {
      lines.push(
        `Start Date: ${formatDisplayDate(
          startDate
        )}`
      );
    }

    if (endDate) {
      lines.push(
        `End Date: ${formatDisplayDate(
          endDate
        )}`
      );
    }

    lines.push(
      `Days: ${effectiveDays}`
    );

    lines.push(
      `Travellers: ${travellers}`
    );

    lines.push(
      `Total Budget: ₹${formatMoney(
        totalBudget
      )}`
    );

    lines.push(
      `Approx. Daily Budget: ₹${formatMoney(
        dailyBudget
      )}`
    );

    lines.push(
      `Budget Level: ${budgetLevel}`
    );

    lines.push(
      `Hotel Preference: ${hotelPreference}`
    );

    lines.push(
      `Transport Preference: ${transportPreference}`
    );

    lines.push(
      `Pace: ${input.pace}`
    );

    lines.push(
      `Interests: ${
        input.interests.join(
          ', '
        ) || 'Not specified'
      }`
    );

    lines.push('');

    for (
      const day of plan
    ) {
      const date =
        startDate
          ? addDays(
              startDate,
              day.day - 1
            )
          : '';

      lines.push(
        `DAY ${day.day}: ${day.title}${
          date
            ? ` — ${formatDisplayDate(
                date
              )}`
            : ''
        }`
      );

      lines.push(
        `Morning: ${day.morning}`
      );

      lines.push(
        `Afternoon: ${day.afternoon}`
      );

      lines.push(
        `Evening: ${day.evening}`
      );

      lines.push(
        `Tip: ${day.tip}`
      );

      const activities =
        activitiesByDay[
          day.day
        ] || [];

      if (
        activities.length
      ) {
        lines.push(
          'Activities:'
        );

        activities.forEach(
          (activity) => {
            lines.push(
              `- ${String(
                activity.title ||
                  activity.name ||
                  ''
              )} (${String(
                activity.category ||
                  'Listing'
              )})`
            );
          }
        );
      }

      lines.push('');
    }

    const blob =
      new Blob(
        [lines.join('\n')],
        {
          type: 'text/plain;charset=utf-8',
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        'a'
      );

    anchor.href = url;

    anchor.download =
      'tourism360-itinerary.txt';

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  };

  const printPlan = () => {
    if (!plan.length) {
      return;
    }

    window.print();
  };

  const sharePlan = async () => {
    const shareText =
      `Tourism360 itinerary — ${tripTitle}\n${input.destination}\n${effectiveDays} days\nBudget ₹${formatMoney(
        totalBudget
      )}`;

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            `Tourism360 — ${tripTitle}`,
          text: shareText,
        });

        return;
      }

      await navigator.clipboard.writeText(
        shareText
      );

      setDataMessage(
        'Itinerary summary copied to your clipboard.'
      );
    } catch {
      /*
       * User cancellation or browser
       * clipboard restrictions should not
       * break the planner.
       */
    }
  };

  const toggleDay = (
    day: number
  ) => {
    setExpandedDays(
      (current) => ({
        ...current,
        [day]:
          !current[day],
      })
    );
  };

  const plannerDateForDay = (
    day: number
  ) => {
    if (!startDate) {
      return '';
    }

    return addDays(
      startDate,
      day - 1
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ---------- Planner Header ---------- */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-teal-50/60 to-indigo-50/70 dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/10" />

        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-500/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-700 shadow-sm dark:border-teal-500/20 dark:bg-white/5 dark:text-teal-300">
              <Sparkles size={14} />
              AI Trip Planner
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              Plan your perfect trip
              with Tourism360.
            </h1>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {/* ---------- Trip Details ---------- */}
        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-slate-900">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Trip Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure your trip and let
                Tourism360 create a destination-matched
                plan.
              </p>
            </div>

            {input.destination ? (
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                <MapPin size={13} />
                {input.destination}
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Trip title */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Trip Title
              </label>

              <select
                value={tripTitle}
                onChange={(event) =>
                  setTripTitle(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-slate-950"
              >
                {TRIP_TITLES.map(
                  (title) => (
                    <option
                      key={title}
                      value={title}
                    >
                      {title}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Destination
              </label>

              <select
                value={
                  input.destination
                }
                onChange={(event) =>
                  handleDestinationChange(
                    event.target.value
                  )
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 dark:border-white/10 dark:bg-slate-950"
              >
                <option value="">
                  Select destination
                </option>

                {destinations.map(
                  (
                    destination
                  ) => (
                    <option
                      key={
                        destination.id ??
                        destination.slug ??
                        destination.name
                      }
                      value={String(
                        destination.name ||
                          destination.slug ||
                          ''
                      )}
                    >
                      {getDestinationName(
                        destination
                      )}

                      {getDestinationCity(
                        destination
                      )
                        ? ` — ${getDestinationCity(
                            destination
                          )}`
                        : ''}
                    </option>
                  )
                )}
              </select>

              {input.destination &&
              destinationExists &&
              destinationListings.length ? (
                <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  ✓{' '}
                  {
                    destinationListings.length
                  }{' '}
                  matching listing
                  {destinationListings.length !==
                  1
                    ? 's'
                    : ''}{' '}
                  available
                </p>
              ) : null}

              {input.destination &&
              destinationExists &&
              !destinationListings.length ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  Destination exists, but
                  matching listing data is
                  currently unavailable.
                </p>
              ) : null}
            </div>

            {/* Start date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Start Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={
                    startDate
                  }
                  onChange={(event) =>
                    handleStartDateChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* End date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                End Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  min={
                    startDate ||
                    undefined
                  }
                  value={
                    endDate
                  }
                  onChange={(event) =>
                    handleEndDateChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-slate-950"
                />
              </div>

              {startDate &&
              endDate &&
              dateDays > 0 ? (
                <p className="mt-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
                  {dateDays}{' '}
                  {dateDays === 1
                    ? 'day'
                    : 'days'}{' '}
                  trip
                </p>
              ) : null}
            </div>

            {/* Travellers */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Travellers
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setTravellers(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  disabled={
                    travellers <= 1
                  }
                  className="grid h-11 w-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  <Minus size={17} />
                </button>

                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <Users size={16} />
                  {travellers}
                  {travellers === 1
                    ? ' Traveller'
                    : ' Travellers'}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTravellers(
                      (current) =>
                        Math.min(
                          20,
                          current + 1
                        )
                    )
                  }
                  disabled={
                    travellers >=
                    20
                  }
                  className="grid h-11 w-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Total Trip Budget
              </label>

              <div className="relative">
                <IndianRupee
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    input.budget
                  }
                  onChange={(event) => {
                    const raw =
                      event.target.value.replace(
                        /[^\d,₹]/g,
                        ''
                      );

                    setInput(
                      (current) => ({
                        ...current,
                        budget:
                          raw,
                      })
                    );

                    setPlan([]);
                    setSaved(false);
                  }}
                  placeholder="e.g. ₹25,000"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-slate-950"
                />
              </div>

              {totalBudget > 0 ? (
                <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 dark:border-teal-500/20 dark:bg-teal-500/10">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
                      Approx. daily budget
                    </span>

                    <span className="font-black text-teal-700 dark:text-teal-300">
                      ₹
                      {formatMoney(
                        dailyBudget
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Wallet
                      size={15}
                      className="text-teal-600"
                    />

                    <span className="text-xs font-bold text-teal-800 dark:text-teal-200">
                      {budgetLevel}
                    </span>
                  </div>

                </div>
              ) : null}
            </div>

            {/* Hotel */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Hotel size={15} />
                Hotel
              </label>

              <select
                value={
                  hotelPreference
                }
                onChange={(event) =>
                  setHotelPreference(
                    event.target
                      .value as HotelPreference
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-slate-950"
              >
                <option>
                  Any
                </option>
                <option>
                  Budget
                </option>
                <option>
                  Comfort
                </option>
                <option>
                  Premium
                </option>
                <option>
                  Luxury
                </option>
              </select>
            </div>

            {/* Transport */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Bus size={15} />
                Transport
              </label>

              <select
                value={
                  transportPreference
                }
                onChange={(event) =>
                  setTransportPreference(
                    event.target
                      .value as TransportPreference
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-slate-950"
              >
                <option>
                  Any
                </option>
                <option>
                  Cab
                </option>
                <option>
                  Bus
                </option>
                <option>
                  Train
                </option>
                <option>
                  Flight
                </option>
                <option>
                  Self Drive
                </option>
              </select>
            </div>

            {/* Pace */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Travel Pace
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  'Relaxed',
                  'Balanced',
                  'Packed',
                ].map(
                  (pace) => (
                    <button
                      type="button"
                      key={pace}
                      onClick={() => {
                        setInput(
                          (current) => ({
                            ...current,
                            pace: pace as Pace,
                          })
                        );

                        setPlan([]);
                        setSaved(false);
                      }}
                      className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${
                        input.pace ===
                        pace
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300'
                      }`}
                    >
                      {pace}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Interests
            </label>

            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(
                (interest) => {
                  const active =
                    input.interests.includes(
                      interest
                    );

                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() =>
                        toggleInterest(
                          interest
                        )
                      }
                      className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                        active
                          ? 'border-teal-600 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-500/10 dark:text-teal-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300'
                      }`}
                    >
                      {active
                        ? '✓ '
                        : ''}
                      {interest}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                generatePlan
              }
              disabled={
                generating ||
                !input.destination ||
                !totalBudget
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={17} />

              {generating
                ? 'Generating...'
                : 'Generate Itinerary'}
            </button>

            <button
              type="button"
              onClick={
                generateRecommendations
              }
              disabled={
                recommendationLoading ||
                !input.destination
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3.5 text-sm font-extrabold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300"
            >
              <Lightbulb size={17} />

              {recommendationLoading
                ? 'Finding...'
                : 'AI Recommendations'}
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            Planning suggestions use Tourism360
            available records. Live availability,
            provider pricing and booking
            confirmation are not fabricated.
          </p>
        </section>

        {/* ---------- Generated Itinerary ---------- */}
        <section className="min-w-0">
          {!plan.length &&
          !recommendationPicks.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12 dark:border-white/10 dark:bg-slate-900">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10">
                <Compass
                  size={30}
                  className="text-teal-600 dark:text-teal-300"
                />
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Your itinerary will appear here
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Select your destination,
                dates, travellers and budget.
                Tourism360 will create a
                destination-matched plan from
                available records.
              </p>
            </div>
          ) : null}

          {plan.length ? (
            <>
              {/* Itinerary summary */}
              <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-slate-900">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-300">
                      <CheckCircle2
                        size={17}
                      />
                      Itinerary ready
                    </div>

                    <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                      {tripTitle}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} />
                        {input.destination}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />

                        {startDate &&
                        endDate
                          ? `${formatDisplayDate(
                              startDate
                            )} – ${formatDisplayDate(
                              endDate
                            )}`
                          : `${effectiveDays} days`}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Users size={14} />
                        {travellers}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <IndianRupee
                          size={14}
                        />
                        {formatMoney(
                          totalBudget
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Share / Print / Export / Save */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={
                        sharePlan
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <Share2 size={15} />
                      Share
                    </button>

                    <button
                      type="button"
                      onClick={
                        printPlan
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <Printer size={15} />
                      Print
                    </button>

                    <button
                      type="button"
                      onClick={
                        exportPlan
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <Download size={15} />
                      Export
                    </button>

                    <button
                      type="button"
                      onClick={
                        saveTrip
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      {saved ? (
                        <>
                          <CheckCircle2
                            size={15}
                          />
                          Saved
                        </>
                      ) : (
                        'Save Trip'
                      )}
                    </button>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Days
                    </div>

                    <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      {effectiveDays}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Daily Budget
                    </div>

                    <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      ₹
                      {formatMoney(
                        dailyBudget
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Planning Level
                    </div>

                    <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      {budgetLevel}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Pace
                    </div>

                    <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      {input.pace}
                    </div>
                  </div>
                </div>
              </div>

              {/* Days */}
              <div className="space-y-4">
                {plan.map(
                  (day) => (
                    <DayCard
                      key={
                        day.day
                      }
                      day={day}
                      date={plannerDateForDay(
                        day.day
                      )}
                      activities={
                        activitiesByDay[
                          day.day
                        ] || []
                      }
                      expanded={
                        Boolean(
                          expandedDays[
                            day.day
                          ]
                        )
                      }
                      onToggle={() =>
                        toggleDay(
                          day.day
                        )
                      }
                      onDetails={(
                        activity
                      ) =>
                        setSelectedDetail(
                          activity
                        )
                      }
                    />
                  )
                )}
              </div>
            </>
          ) : null}

          {/* ---------- Recommendations ---------- */}
          {recommendationMessage ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {recommendationMessage}
            </div>
          ) : null}

          {recommendationPicks.length ? (
            <section className="mt-10">
              <SectionHead
                title="AI Recommendations"
                sub={`Recommendations based only on matching ${input.destination} listings.`}
              />

              {selectedRecommendationDestinations.length ? (
                <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                  <div className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                    Matching destination
                  </div>

                  <div className="mt-1 font-bold text-indigo-950 dark:text-white">
                    {selectedRecommendationDestinations
                      .map(
                        (
                          item
                        ) =>
                          getDestinationName(
                            item
                          )
                      )
                      .join(
                        ', '
                      )}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {recommendationPicks.map(
                  (
                    listing
                  ) => (
                    <ListingRecommendationCard
                      key={
                        listing.id ??
                        listing.title
                      }
                      listing={
                        listing
                      }
                      onDetails={() =>
                        setSelectedDetail(
                          listing
                        )
                      }
                    />
                  )
                )}
              </div>
            </section>
          ) : null}

          {/* ---------- Bottom Navigation ---------- */}
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Need something else?
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Explore Tourism360 or ask
                  the assistant.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
                >
                  Explore
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/chatbot"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-slate-200"
                >
                  AI Chatbot
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Existing Tourism360 Detail Drawer ---------- */}
      {selectedDetail ? (
        <DetailDrawer
          item={{
            ...selectedDetail,
            image_url:
              selectedDetail.image_url ||
              selectedDetail.image ||
              '',
          }}
          type={String(
            selectedDetail.category ||
              'listing'
          )}
          onClose={() =>
            setSelectedDetail(
              null
            )
          }
        />
      ) : null}
    </div>
  );
}


export function RecommendationsPage() {
  const [listings, setListings] =
    useState<Listing[]>([]);

  const [destinations, setDestinations] =
    useState<Listing[]>([]);

  const [city, setCity] =
    useState('');

  const [interests, setInterests] =
    useState<string[]>([
      'Attractions',
      'Food',
    ]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [picks, setPicks] =
    useState<Listing[]>([]);

  const [selectedDetail, setSelectedDetail] =
    useState<Listing | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [
          listingData,
          destinationData,
        ] = await Promise.all([
          api.listings(),
          api.destinations(),
        ]);

        if (!mounted) {
          return;
        }

        setListings(
          Array.isArray(
            listingData
          )
            ? listingData
            : []
        );

        setDestinations(
          Array.isArray(
            destinationData
          )
            ? destinationData
            : []
        );
      } catch (err) {
        console.error(
          'Recommendations loading error:',
          err
        );

        if (mounted) {
          setError(
            'Recommendation data could not be loaded.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const runRecommendations =
    () => {
      if (!city.trim()) {
        setPicks([]);
        return;
      }

      const result =
        recommend(
          {
            interests,
            city,
            budget: '',
          },
          listings,
          destinations
        );

      setPicks(
        result.picks
      );
    };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHead
          title="AI Recommendations"
          sub="Recommendations use only destination-matched Tourism360 records."
        />

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <select
              value={city}
              onChange={(event) => {
                setCity(
                  event.target.value
                );
                setPicks([]);
              }}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500 dark:border-white/10 dark:bg-slate-950"
            >
              <option value="">
                Select destination
              </option>

              {destinations.map(
                (
                  destination
                ) => (
                  <option
                    key={
                      destination.id ??
                      destination.slug ??
                      destination.name
                    }
                    value={String(
                      destination.name ||
                        destination.slug ||
                        ''
                    )}
                  >
                    {getDestinationName(
                      destination
                    )}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={
                runRecommendations
              }
              className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700"
            >
              Get Recommendations
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {INTERESTS.map(
              (interest) => {
                const active =
                  interests.includes(
                    interest
                  );

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() =>
                      setInterests(
                        (
                          current
                        ) =>
                          current.includes(
                            interest
                          )
                            ? current.filter(
                                (
                                  item
                                ) =>
                                  item !==
                                  interest
                              )
                            : [
                                ...current,
                                interest,
                              ]
                      )
                    }
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                      active
                        ? 'border-teal-600 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-500/10 dark:text-teal-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300'
                    }`}
                  >
                    {active
                      ? '✓ '
                      : ''}
                    {interest}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {!picks.length ? (
          <EmptyState
            msg={
              city
                ? `No matching verified recommendation data is currently available for ${city}.`
                : 'Select a destination to see matching recommendations.'
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map(
              (listing) => (
                <ListingRecommendationCard
                  key={
                    listing.id ??
                    listing.title
                  }
                  listing={
                    listing
                  }
                  onDetails={() =>
                    setSelectedDetail(
                      listing
                    )
                  }
                />
              )
            )}
          </div>
        )}

        {selectedDetail ? (
          <DetailDrawer
            item={{
              ...selectedDetail,
              image_url:
                selectedDetail.image_url ||
                selectedDetail.image ||
                '',
            }}
            type={String(
              selectedDetail.category ||
                'listing'
            )}
            onClose={() =>
              setSelectedDetail(
                null
              )
            }
          />
        ) : null}
      </main>
    </div>
  );
}


export function ChatbotPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHead
          title="Tourism360 AI Assistant"
          sub="Ask questions about your travel planning and Tourism360."
        />

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <ChatPanel full />
        </div>
      </main>
    </div>
  );
}