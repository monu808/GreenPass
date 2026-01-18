interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  weatherMain: string;
  weatherDescription: string;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  cityName: string;
  icon: string;
  uvIndex?: number;
  cloudCover?: number;
  precipitationProbability?: number;
  precipitationType?: string;
}

interface TomorrowApiResponse {
  timelines: {
    minutely?: Array<{
      time: string;
      values: {
        temperature: number;
        humidity: number;
        pressure: number;
        windSpeed: number;
        windDirection: number;
        visibility: number;
        uvIndex: number;
        cloudCover: number;
        precipitationProbability: number;
        precipitationType: number;
        weatherCode: number;
      };
    }>;
    hourly?: Array<{
      time: string;
      values: {
        temperature: number;
        humidity: number;
        pressure: number;
        windSpeed: number;
        windDirection: number;
        visibility: number;
        uvIndex: number;
        cloudCover: number;
        precipitationProbability: number;
        precipitationType: number;
        weatherCode: number;
      };
    }>;
    daily?: Array<{
      time: string;
      values: {
        temperatureMax: number;
        temperatureMin: number;
        temperature: number;
        humidity: number;
        pressure: number;
        windSpeed: number;
        windDirection: number;
        visibility: number;
        uvIndex: number;
        cloudCover: number;
        precipitationProbability: number;
        precipitationType: number;
        weatherCode: number;
      };
    }>;
  };
  location: {
    lat: number;
    lon: number;
    name?: string;
    type?: string;
  };
}

interface WeatherCodeMapping {
  [key: number]: {
    main: string;
    description: string;
    icon: string;
  };
}

interface TomorrowRealtimeResponse {
  data: {
    time: string;
    values: {
      temperature: number;
      humidity: number;
      pressureSeaLevel: number;
      windSpeed: number;
      windDirection: number;
      visibility: number;
      uvIndex: number;
      cloudCover: number;
      precipitationProbability: number;
      precipitationType: number;
      weatherCode: number;
    };
  };
  location: {
    lat: number;
    lon: number;
    name?: string;
    type?: string;
  };
}

class TomorrowWeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.tomorrow.io/v4/weather';

  // Tomorrow.io weather code mapping
  private weatherCodeMap: WeatherCodeMapping = {
    0: { main: 'Unknown', description: 'Unknown weather condition', icon: '01d' },
    1000: { main: 'Clear', description: 'Clear skies', icon: '01d' },
    1001: { main: 'Clouds', description: 'Cloudy', icon: '02d' },
    1100: { main: 'Clear', description: 'Mostly clear', icon: '01d' },
    1101: { main: 'Clouds', description: 'Partly cloudy', icon: '02d' },
    1102: { main: 'Clouds', description: 'Mostly cloudy', icon: '03d' },
    1103: { main: 'Clouds', description: 'Overcast', icon: '04d' },
    2000: { main: 'Fog', description: 'Fog', icon: '50d' },
    2100: { main: 'Fog', description: 'Light fog', icon: '50d' },
    3000: { main: 'Wind', description: 'Light wind', icon: '01d' },
    3001: { main: 'Wind', description: 'Wind', icon: '01d' },
    3002: { main: 'Wind', description: 'Strong wind', icon: '01d' },
    4000: { main: 'Rain', description: 'Drizzle', icon: '09d' },
    4001: { main: 'Rain', description: 'Rain', icon: '10d' },
    4200: { main: 'Rain', description: 'Light rain', icon: '10d' },
    4201: { main: 'Rain', description: 'Heavy rain', icon: '10d' },
    5000: { main: 'Snow', description: 'Snow', icon: '13d' },
    5001: { main: 'Snow', description: 'Flurries', icon: '13d' },
    5100: { main: 'Snow', description: 'Light snow', icon: '13d' },
    5101: { main: 'Snow', description: 'Heavy snow', icon: '13d' },
    6000: { main: 'Rain', description: 'Freezing drizzle', icon: '09d' },
    6001: { main: 'Rain', description: 'Freezing rain', icon: '09d' },
    6200: { main: 'Rain', description: 'Light freezing rain', icon: '09d' },
    6201: { main: 'Rain', description: 'Heavy freezing rain', icon: '09d' },
    7000: { main: 'Snow', description: 'Ice pellets', icon: '13d' },
    7101: { main: 'Snow', description: 'Heavy ice pellets', icon: '13d' },
    7102: { main: 'Snow', description: 'Light ice pellets', icon: '13d' },
    8000: { main: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' },
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWeatherByCoordinates(lat: number, lon: number, cityName: string = 'Unknown Location', signal?: AbortSignal): Promise<WeatherData | null> {
    try {
      const fields = [
        'temperature',
        'humidity',
        'pressureSeaLevel',
        'windSpeed',
        'windDirection',
        'visibility',
        'uvIndex',
        'cloudCover',
        'precipitationProbability',
        'precipitationType',
        'weatherCode'
      ].join(',');

      const url = `${this.baseUrl}/realtime?location=${lat},${lon}&fields=${fields}&units=metric&apikey=${this.apiKey}`;

      console.log(`🌐 Requesting weather data for ${cityName}...`);
      const response = await fetch(url, { signal });

      if (response.status === 429) {
        console.warn(`⚠️ Rate limit exceeded for ${cityName}, using fallback weather data`);
        return this.getFallbackWeatherData(lat, lon, cityName);
      }

      if (!response.ok) {
        console.warn(`⚠️ API error ${response.status} for ${cityName}, using fallback weather data`);
        return this.getFallbackWeatherData(lat, lon, cityName);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched weather data for ${cityName}`);
      return this.transformWeatherData(data, cityName);
    } catch (error) {
      console.error('Error fetching weather data from Tomorrow.io:', error);
      console.log(`📋 Generating fallback weather data for ${cityName}`);
      return this.getFallbackWeatherData(lat, lon, cityName);
    }
  }

  // Fallback weather data when API fails or rate limit is exceeded
  private getFallbackWeatherData(lat: number, lon: number, cityName: string): WeatherData {
    // Generate realistic weather data based on location and season
    const baseTemp = this.getSeasonalTemperature(lat);
    const variation = (Math.random() - 0.5) * 10; // ±5°C variation

    return {
      temperature: Math.round((baseTemp + variation) * 10) / 10,
      humidity: Math.round(50 + Math.random() * 40), // 50-90%
      pressure: Math.round((1013 + (Math.random() - 0.5) * 20) * 100) / 100,
      windSpeed: Math.round(Math.random() * 10 * 10) / 10, // 0-10 m/s
      windDirection: Math.round(Math.random() * 360),
      visibility: Math.round((8000 + Math.random() * 2000) * 100) / 100,
      uvIndex: Math.max(1, Math.round(Math.random() * 10)),
      cloudCover: Math.round(Math.random() * 100),
      precipitationProbability: Math.round(Math.random() * 30), // 0-30%
      precipitationType: 'none',
      weatherMain: 'Clouds',
      weatherDescription: 'Simulated weather data (API rate limited)',
      cityName: cityName,
      icon: '02d'
    };
  }

  // Get seasonal temperature based on latitude
  private getSeasonalTemperature(lat: number): number {
    const month = new Date().getMonth(); // 0-11
    const isWinter = month < 3 || month > 9;

    // Base temperature by latitude zones
    let baseTemp = 20; // Default moderate temperature

    if (Math.abs(lat) > 60) baseTemp = isWinter ? -5 : 10; // Arctic/Antarctic
    else if (Math.abs(lat) > 40) baseTemp = isWinter ? 5 : 25; // Temperate
    else if (Math.abs(lat) > 23) baseTemp = isWinter ? 15 : 30; // Subtropical
    else baseTemp = isWinter ? 25 : 35; // Tropical

    return baseTemp;
  }

  // Get a random but realistic weather code
  private getRandomWeatherCode(): number {
    const commonCodes = [1000, 1001, 1100, 1101, 1102, 4000, 4200]; // Clear to light rain
    return commonCodes[Math.floor(Math.random() * commonCodes.length)];
  }

  async getForecastByCoordinates(lat: number, lon: number, days: number = 5): Promise<TomorrowApiResponse | null> {
    try {
      const fields = [
        'temperature',
        'temperatureMax',
        'temperatureMin',
        'humidity',
        'pressureSeaLevel',
        'windSpeed',
        'windDirection',
        'visibility',
        'uvIndex',
        'cloudCover',
        'precipitationProbability',
        'precipitationType',
        'weatherCode'
      ].join(',');

      const url = `${this.baseUrl}/forecast?location=${lat},${lon}&fields=${fields}&units=metric&timesteps=1d&endTime=${this.getEndTime(days)}&apikey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Tomorrow.io API error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast data from Tomorrow.io:', error);
      return null;
    }
  }

  private transformWeatherData(data: TomorrowRealtimeResponse, cityName: string): WeatherData {
    const values = data.data?.values || {};
    const weatherCode = values.weatherCode || 0;
    const weatherInfo = this.weatherCodeMap[weatherCode] || this.weatherCodeMap[0];

    return {
      temperature: values.temperature || 0,
      humidity: values.humidity || 0,
      pressure: values.pressureSeaLevel || 0,
      weatherMain: weatherInfo.main,
      weatherDescription: weatherInfo.description,
      windSpeed: values.windSpeed || 0,
      windDirection: values.windDirection || 0,
      visibility: values.visibility || 0,
      cityName,
      icon: weatherInfo.icon,
      uvIndex: values.uvIndex || 0,
      cloudCover: values.cloudCover || 0,
      precipitationProbability: values.precipitationProbability || 0,
      precipitationType: this.getPrecipitationType(values.precipitationType || 0)
    };
  }

  private getPrecipitationType(code: number): string {
    const types: { [key: number]: string } = {
      0: 'None',
      1: 'Rain',
      2: 'Snow',
      3: 'Freezing Rain',
      4: 'Ice Pellets'
    };
    return types[code] || 'Unknown';
  }

  private getEndTime(days: number): string {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return endDate.toISOString();
  }

  shouldGenerateAlert(weatherData: WeatherData): { shouldAlert: boolean; reason: string } {
    const alerts = [];

    // Temperature alerts
    if (weatherData.temperature > 40) {
      alerts.push('Extreme heat warning');
    } else if (weatherData.temperature < 0) {
      alerts.push('Freezing temperature alert');
    }

    // Wind alerts
    if (weatherData.windSpeed > 15) { // 15 m/s = ~54 km/h
      alerts.push('High wind warning');
    }

    // Precipitation alerts
    if (weatherData.precipitationProbability && weatherData.precipitationProbability > 80) {
      alerts.push('Heavy precipitation expected');
    }

    // Visibility alerts
    if (weatherData.visibility < 1000) { // Less than 1km visibility
      alerts.push('Low visibility conditions');
    }

    // UV alerts
    if (weatherData.uvIndex && weatherData.uvIndex > 8) {
      alerts.push('High UV index - extreme sun exposure risk');
    }

    // Weather condition specific alerts
    if (weatherData.weatherMain === 'Thunderstorm') {
      alerts.push('Thunderstorm warning');
    } else if (weatherData.weatherMain === 'Snow' && weatherData.temperature > -5) {
      alerts.push('Wet snow conditions - slippery roads');
    }

    return {
      shouldAlert: alerts.length > 0,
      reason: alerts.join(', ')
    };
  }

  getWeatherIcon(weatherCode: number, isDay: boolean = true): string {
    const mapping = this.weatherCodeMap[weatherCode] || this.weatherCodeMap[0];
    let icon = mapping.icon;

    // Adjust for day/night
    if (!isDay && (icon === '01d' || icon === '01n')) {
      icon = '01n';
    } else if (!isDay && icon.endsWith('d')) {
      icon = icon.replace('d', 'n');
    }

    return icon;
  }
}

// Destination coordinates for major tourist locations in Jammu and Himachal Pradesh
export const destinationCoordinates: { [key: string]: { lat: number; lon: number; name: string } } = {
  // Himachal Pradesh
  'manali': { lat: 32.2396, lon: 77.1887, name: 'Manali' },
  'shimla': { lat: 31.1048, lon: 77.1734, name: 'Shimla' },
  'dharamshala': { lat: 32.2190, lon: 76.3234, name: 'Dharamshala' },
  'mcleodganj': { lat: 32.2190, lon: 76.3234, name: 'McLeod Ganj' },
  'dalhousie': { lat: 32.5448, lon: 75.9600, name: 'Dalhousie' },
  'kasol': { lat: 32.0998, lon: 77.3152, name: 'Kasol' },
  'spiti': { lat: 32.2466, lon: 78.0265, name: 'Spiti Valley' },
  'spitivalley': { lat: 32.2466, lon: 78.0265, name: 'Spiti Valley' },
  'kinnaur': { lat: 31.6089, lon: 78.4697, name: 'Kinnaur' },

  // Jammu and Kashmir
  'srinagar': { lat: 34.0837, lon: 74.7973, name: 'Srinagar' },
  'jammu': { lat: 32.7266, lon: 74.8570, name: 'Jammu' },
  'gulmarg': { lat: 34.0484, lon: 74.3858, name: 'Gulmarg' },
  'pahalgam': { lat: 34.0169, lon: 75.3312, name: 'Pahalgam' },
  'sonamarg': { lat: 34.2996, lon: 75.2941, name: 'Sonamarg' },
  'leh': { lat: 34.1526, lon: 77.5771, name: 'Leh' },
  'ladakh': { lat: 34.2268, lon: 77.5619, name: 'Ladakh' },
  'katra': { lat: 32.9916, lon: 74.9455, name: 'Katra' },
  'vaishnodevi': { lat: 33.0301, lon: 74.9490, name: 'Vaishno Devi' }
};

// Create and export the weather service instance
const tomorrowWeatherService = new TomorrowWeatherService(
  process.env.NEXT_PUBLIC_TOMORROW_API_KEY || ''
);

export { tomorrowWeatherService as weatherService, TomorrowWeatherService };
export type { WeatherData, TomorrowApiResponse };
