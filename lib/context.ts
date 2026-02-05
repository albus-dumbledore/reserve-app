// Reading context utilities for location, weather, and seasonal awareness

export type Season = 'Winter' | 'Spring' | 'Summer' | 'Fall';
export type TimeOfDay = 'Early Morning' | 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Late Night';

export interface ReadingContext {
  location?: string;
  weather?: {
    condition: string;
    temp: number;
    description: string;
  };
  season: Season;
  timeOfDay: TimeOfDay;
  readingMood: string;
}

/**
 * Get current season based on month and hemisphere
 */
export function getSeason(date = new Date(), hemisphere: 'north' | 'south' = 'north'): Season {
  const month = date.getMonth(); // 0-11

  if (hemisphere === 'north') {
    if (month >= 11 || month <= 1) return 'Winter';
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    return 'Fall';
  } else {
    // Southern hemisphere - opposite seasons
    if (month >= 5 && month <= 7) return 'Winter';
    if (month >= 8 && month <= 10) return 'Spring';
    if (month >= 11 || month <= 1) return 'Summer';
    return 'Fall';
  }
}

/**
 * Get time of day from current hour
 */
export function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 4 && hour < 7) return 'Early Morning';
  if (hour >= 7 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  if (hour >= 21 && hour < 24) return 'Night';
  return 'Late Night';
}

/**
 * Determine reading mood based on weather, season, and time
 */
export function getReadingMood(context: Partial<ReadingContext>): string {
  const { weather, season, timeOfDay } = context;

  // Weather-based moods
  if (weather) {
    const condition = weather.condition.toLowerCase();
    const temp = weather.temp;

    if (condition.includes('rain') || condition.includes('drizzle')) {
      return 'Cozy, introspective';
    }
    if (condition.includes('snow')) {
      return 'Quiet, contemplative';
    }
    if (condition.includes('storm') || condition.includes('thunder')) {
      return 'Atmospheric, immersive';
    }
    if (condition.includes('cloud') || condition.includes('overcast')) {
      return 'Gentle, reflective';
    }
    if (condition.includes('clear') || condition.includes('sun')) {
      if (temp > 24) { // Celsius: warm/hot weather
        return 'Light, breezy';
      }
      return 'Bright, energizing';
    }
  }

  // Season + time-based moods
  if (season === 'Winter') {
    if (timeOfDay === 'Evening' || timeOfDay === 'Night') {
      return 'Cozy, intimate';
    }
    return 'Contemplative, grounded';
  }

  if (season === 'Summer') {
    if (timeOfDay === 'Afternoon') {
      return 'Light, leisurely';
    }
    return 'Expansive, adventurous';
  }

  if (season === 'Fall') {
    return 'Reflective, transitional';
  }

  if (season === 'Spring') {
    return 'Fresh, hopeful';
  }

  // Default fallback based on time alone
  if (timeOfDay === 'Early Morning') return 'Quiet, contemplative';
  if (timeOfDay === 'Morning') return 'Fresh, energizing';
  if (timeOfDay === 'Afternoon') return 'Light, leisurely';
  if (timeOfDay === 'Evening') return 'Gentle, winding down';
  if (timeOfDay === 'Night') return 'Intimate, reflective';
  return 'Quiet, restful';
}

/**
 * Detect hemisphere from location string
 */
export function detectHemisphere(location: string): 'north' | 'south' {
  const lower = location.toLowerCase();

  // Southern hemisphere indicators
  const southernCountries = [
    'australia',
    'new zealand',
    'argentina',
    'chile',
    'south africa',
    'brazil',
    'uruguay',
    'paraguay',
    'bolivia',
    'peru'
  ];

  for (const country of southernCountries) {
    if (lower.includes(country)) {
      return 'south';
    }
  }

  // Default to northern hemisphere
  return 'north';
}

/**
 * Format context for display
 */
export function formatContextDescription(context: ReadingContext): string {
  const parts: string[] = [];

  if (context.weather) {
    parts.push(context.weather.condition.toLowerCase());
  }

  parts.push(context.timeOfDay.toLowerCase());

  if (context.location) {
    parts.push(`in ${context.location}`);
  }

  return parts.join(' ');
}

/**
 * Get full reading context
 */
export function getReadingContext(
  location?: string,
  weather?: ReadingContext['weather']
): ReadingContext {
  const hemisphere = location ? detectHemisphere(location) : 'north';
  const season = getSeason(new Date(), hemisphere);
  const timeOfDay = getTimeOfDay();

  const context: ReadingContext = {
    location,
    weather,
    season,
    timeOfDay,
    readingMood: ''
  };

  context.readingMood = getReadingMood(context);

  return context;
}
