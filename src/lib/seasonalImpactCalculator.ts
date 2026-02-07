import { Destination, DynamicCapacityResult, WeatherConditions } from '@/types';

export type ImpactLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface SeasonalImpactContext {
  destination: Destination;
  weather?: WeatherConditions;
  capacityResult?: DynamicCapacityResult | null;
}

export interface SeasonalImpactEntry {
  date: string;
  label: string;
  level: ImpactLevel;
  levelLabel: string;
  score: number;
  reasons: string[];
  recommendation: string;
}

const LEVEL_RULES: { level: ImpactLevel; max: number; label: string; recommendation: string }[] = [
  {
    level: 'green',
    max: 30,
    label: 'Low Impact',
    recommendation: 'Great time! Lower crowding helps preserve the ecosystem.'
  },
  {
    level: 'yellow',
    max: 55,
    label: 'Moderate Impact',
    recommendation: 'Manageable visitor flow. Stay mindful of trail etiquette.'
  },
  {
    level: 'orange',
    max: 80,
    label: 'High Impact',
    recommendation: 'Peak stress on local habitats. Consider shifting your trip if possible.'
  },
  {
    level: 'red',
    max: 100,
    label: 'Restricted',
    recommendation: 'Environment under stress. Book only if essential and follow strict guidelines.'
  }
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getSeasonFactor = (date: Date): { score: number; reason: string } => {
  const month = date.getMonth();
  if ([5, 6, 7].includes(month)) {
    return { score: 25, reason: 'Monsoon erosion risk & trail closures' };
  }
  if ([8, 9, 10].includes(month)) {
    return { score: -12, reason: 'Shoulder season with lighter footfall' };
  }
  if ([2, 3, 4].includes(month)) {
    return { score: -5, reason: 'Balanced spring bloom visitation' };
  }
  return { score: 10, reason: 'Fragile winter habitats need care' };
};

const getWeatherFactor = (weather?: WeatherConditions): { score: number; reason?: string } => {
  if (!weather) return { score: 0 };
  const reasons: string[] = [];
  let score = 0;

  if (weather.alertLevel === 'critical') {
    score += 50;
    reasons.push('Critical weather alert in effect');
  } else if (weather.alertLevel === 'high') {
    score += 35;
    reasons.push('Severe weather alert in effect');
  } else if (weather.alertLevel === 'medium') {
    score += 15;
    reasons.push('Medium weather advisory');
  }

  if (typeof weather.temperature === 'number') {
    if (weather.temperature >= 32) {
      score += 6;
      reasons.push('High daytime temperatures');
    } else if (weather.temperature <= 5) {
      score += 4;
      reasons.push('Low temperatures increase habitat stress');
    }
  }

  if (typeof weather.humidity === 'number' && weather.humidity >= 80) {
    score += 5;
    reasons.push('High humidity impacts trail recovery');
  }

  return { score, reason: reasons.join(' • ') };
};

const getOccupancyFactor = (
  destination: Destination,
  capacityResult?: DynamicCapacityResult | null
): { score: number; reason: string } => {
  let ratio: number;
  if (capacityResult) {
    const adjusted = capacityResult.adjustedCapacity || destination.maxCapacity || 1;
    const available = clamp(capacityResult.availableSpots, 0, adjusted);
    ratio = 1 - available / adjusted;
  } else {
    ratio = destination.maxCapacity
      ? destination.currentOccupancy / destination.maxCapacity
      : 1;
  }

  if (ratio >= 0.85) {
    return { score: 28, reason: 'Near capacity – high ecosystem strain' };
  }
  if (ratio >= 0.65) {
    return { score: 18, reason: 'Busy period – moderate strain' };
  }
  if (ratio >= 0.45) {
    return { score: 8, reason: 'Healthy visitor balance' };
  }
  return { score: -6, reason: 'Plenty of capacity – low strain' };
};

const getLevelMeta = (score: number) => {
  const match = LEVEL_RULES.find((rule) => score <= rule.max) || LEVEL_RULES[LEVEL_RULES.length - 1];
  return match;
};

export const calculateSeasonalImpact = (
  date: Date,
  context: SeasonalImpactContext
): SeasonalImpactEntry => {
  const season = getSeasonFactor(date);
  const weather = getWeatherFactor(context.weather);
  const occupancy = getOccupancyFactor(context.destination, context.capacityResult);

  const base = 40;
  const rawScore = base + season.score + weather.score + occupancy.score;
  const score = clamp(rawScore, 0, 100);
  const levelMeta = getLevelMeta(score);

  const reasons = [season.reason, occupancy.reason];
  if (weather.reason) reasons.push(weather.reason);

  const label = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Format date as local YYYY-MM-DD instead of UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  return {
    date: dateString,
    label,
    level: levelMeta.level,
    levelLabel: levelMeta.label,
    score,
    reasons,
    recommendation: levelMeta.recommendation
  };
};

export const generateImpactWindow = (
  context: SeasonalImpactContext,
  days = 42
): SeasonalImpactEntry[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() + idx);
    return calculateSeasonalImpact(date, context);
  });
};

// Helper to parse date strings in local time (avoiding UTC midnight issues)
const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const recommendAlternativeDates = (
  selectedDate: string,
  entries: SeasonalImpactEntry[],
  count = 3
): SeasonalImpactEntry[] => {
  if (!entries.length) return [];
  const selectedIndex = entries.findIndex((entry) => entry.date === selectedDate);

  const candidates = entries
    .filter((entry) => entry.level === 'green' || entry.level === 'yellow')
    .sort((a, b) => a.score - b.score);

  if (!candidates.length) return [];

  if (selectedIndex === -1) {
    return candidates.slice(0, count);
  }

  const selectedDateObj = parseLocalDate(selectedDate);
  const prioritized = candidates
    .map((entry) => ({
      entry,
      diff: Math.abs(parseLocalDate(entry.date).getTime() - selectedDateObj.getTime())
    }))
    .sort((a, b) => a.diff - b.diff || a.entry.score - b.entry.score)
    .map((item) => item.entry);

  return prioritized.slice(0, count);
};
