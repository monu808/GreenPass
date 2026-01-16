// Re-export the Tomorrow.io weather service as the main weather service
export { weatherService, destinationCoordinates, TomorrowWeatherService } from './tomorrowWeatherService';
export type { WeatherData, TomorrowApiResponse } from './tomorrowWeatherService';

// For backward compatibility, also export as default
import { weatherService } from './tomorrowWeatherService';
export default weatherService;
