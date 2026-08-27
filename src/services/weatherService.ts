import { getEffectiveTimeZone } from '../utils/dateTimeUtils';

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  temperatureUnit: 'F' | 'C';
  weatherCode: number;
  condition: string;
  isDay: boolean;
  humidity: number;
  windSpeed: number;
  windSpeedUnit: string;
  locationName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  forecastToday?: {
    maxTemp: number;
    minTemp: number;
  };
}

export interface LocationSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State or province
  countryCode?: string;
}

export interface UserLocationConfig {
  lat: number;
  lon: number;
  name: string;
  isCustom: boolean;
}

// Comprehensive fallback coordinates across major world and North American timezones
const TIMEZONE_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  // US & Canada
  'America/Los_Angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, CA' },
  'America/New_York': { lat: 40.7128, lon: -74.006, name: 'New York, NY' },
  'America/Chicago': { lat: 41.8781, lon: -87.6298, name: 'Chicago, IL' },
  'America/Denver': { lat: 39.7392, lon: -104.9903, name: 'Denver, CO' },
  'America/Phoenix': { lat: 33.4484, lon: -112.074, name: 'Phoenix, AZ' },
  'America/Anchorage': { lat: 61.2181, lon: -149.9003, name: 'Anchorage, AK' },
  'America/Honolulu': { lat: 21.3069, lon: -157.8583, name: 'Honolulu, HI' },
  'America/Detroit': { lat: 42.3314, lon: -83.0458, name: 'Detroit, MI' },
  'America/Indiana/Indianapolis': { lat: 39.7684, lon: -86.1581, name: 'Indianapolis, IN' },
  'America/Boise': { lat: 43.615, lon: -116.2023, name: 'Boise, ID' },
  'America/Toronto': { lat: 43.6532, lon: -79.3832, name: 'Toronto, Canada' },
  'America/Vancouver': { lat: 49.2827, lon: -123.1207, name: 'Vancouver, Canada' },
  'America/Montreal': { lat: 45.5017, lon: -73.5673, name: 'Montreal, Canada' },
  'America/Edmonton': { lat: 53.5461, lon: -113.4938, name: 'Edmonton, Canada' },
  'America/Winnipeg': { lat: 49.8951, lon: -97.1384, name: 'Winnipeg, Canada' },
  'America/Halifax': { lat: 44.6488, lon: -63.5752, name: 'Halifax, Canada' },
  'America/Mexico_City': { lat: 19.4326, lon: -99.1332, name: 'Mexico City, Mexico' },
  'America/Monterrey': { lat: 25.6866, lon: -100.3161, name: 'Monterrey, Mexico' },
  'America/Tijuana': { lat: 32.5149, lon: -117.0382, name: 'Tijuana, Mexico' },
  'America/Cancun': { lat: 21.1619, lon: -86.8515, name: 'Cancún, Mexico' },
  'America/Bogota': { lat: 4.711, lon: -74.0721, name: 'Bogotá, Colombia' },
  'America/Lima': { lat: -12.0464, lon: -77.0428, name: 'Lima, Peru' },
  'America/Santiago': { lat: -33.4489, lon: -70.6693, name: 'Santiago, Chile' },
  'America/Sao_Paulo': { lat: -23.5505, lon: -46.6333, name: 'São Paulo, Brazil' },
  'America/Buenos_Aires': { lat: -34.6037, lon: -58.3816, name: 'Buenos Aires, Argentina' },

  // Europe
  'Europe/London': { lat: 51.5074, lon: -0.1278, name: 'London, UK' },
  'Europe/Dublin': { lat: 53.3498, lon: -6.2603, name: 'Dublin, Ireland' },
  'Europe/Paris': { lat: 48.8566, lon: 2.3522, name: 'Paris, France' },
  'Europe/Berlin': { lat: 52.52, lon: 13.405, name: 'Berlin, Germany' },
  'Europe/Rome': { lat: 41.9028, lon: 12.4964, name: 'Rome, Italy' },
  'Europe/Madrid': { lat: 40.4168, lon: -3.7038, name: 'Madrid, Spain' },
  'Europe/Amsterdam': { lat: 52.3676, lon: 4.9041, name: 'Amsterdam, Netherlands' },
  'Europe/Brussels': { lat: 50.8503, lon: 4.3517, name: 'Brussels, Belgium' },
  'Europe/Vienna': { lat: 48.2082, lon: 16.3738, name: 'Vienna, Austria' },
  'Europe/Zurich': { lat: 47.3769, lon: 8.5417, name: 'Zurich, Switzerland' },
  'Europe/Stockholm': { lat: 59.3293, lon: 18.0686, name: 'Stockholm, Sweden' },
  'Europe/Oslo': { lat: 59.9139, lon: 10.7522, name: 'Oslo, Norway' },
  'Europe/Copenhagen': { lat: 55.6761, lon: 12.5683, name: 'Copenhagen, Denmark' },
  'Europe/Helsinki': { lat: 60.1699, lon: 24.9384, name: 'Helsinki, Finland' },
  'Europe/Warsaw': { lat: 52.2297, lon: 21.0122, name: 'Warsaw, Poland' },
  'Europe/Prague': { lat: 50.0755, lon: 14.4378, name: 'Prague, Czechia' },
  'Europe/Budapest': { lat: 47.4979, lon: 19.0402, name: 'Budapest, Hungary' },
  'Europe/Athens': { lat: 37.9838, lon: 23.7275, name: 'Athens, Greece' },
  'Europe/Lisbon': { lat: 38.7223, lon: -9.1393, name: 'Lisbon, Portugal' },
  'Europe/Bucharest': { lat: 44.4268, lon: 26.1025, name: 'Bucharest, Romania' },
  'Europe/Kyiv': { lat: 50.4501, lon: 30.5234, name: 'Kyiv, Ukraine' },
  'Europe/Istanbul': { lat: 41.0082, lon: 28.9784, name: 'Istanbul, Turkey' },

  // Asia & Middle East
  'Asia/Tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo, Japan' },
  'Asia/Shanghai': { lat: 31.2304, lon: 121.4737, name: 'Shanghai, China' },
  'Asia/Beijing': { lat: 39.9042, lon: 116.4074, name: 'Beijing, China' },
  'Asia/Hong_Kong': { lat: 22.3193, lon: 114.1694, name: 'Hong Kong' },
  'Asia/Taipei': { lat: 25.033, lon: 121.5654, name: 'Taipei, Taiwan' },
  'Asia/Singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
  'Asia/Seoul': { lat: 37.5665, lon: 126.978, name: 'Seoul, South Korea' },
  'Asia/Bangkok': { lat: 13.7563, lon: 100.5018, name: 'Bangkok, Thailand' },
  'Asia/Jakarta': { lat: -6.2088, lon: 106.8456, name: 'Jakarta, Indonesia' },
  'Asia/Kuala_Lumpur': { lat: 3.139, lon: 101.6869, name: 'Kuala Lumpur, Malaysia' },
  'Asia/Manila': { lat: 14.5995, lon: 120.9842, name: 'Manila, Philippines' },
  'Asia/Kolkata': { lat: 28.6139, lon: 77.209, name: 'New Delhi, India' },
  'Asia/Mumbai': { lat: 19.076, lon: 72.8777, name: 'Mumbai, India' },
  'Asia/Dubai': { lat: 25.2048, lon: 55.2708, name: 'Dubai, UAE' },
  'Asia/Riyadh': { lat: 24.7136, lon: 46.6753, name: 'Riyadh, Saudi Arabia' },
  'Asia/Jerusalem': { lat: 31.7683, lon: 35.2137, name: 'Jerusalem, Israel' },
  'Asia/Tel_Aviv': { lat: 32.0853, lon: 34.7818, name: 'Tel Aviv, Israel' },

  // Australia & Pacific
  'Australia/Sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney, Australia' },
  'Australia/Melbourne': { lat: -37.8136, lon: 144.9631, name: 'Melbourne, Australia' },
  'Australia/Brisbane': { lat: -27.4698, lon: 153.0251, name: 'Brisbane, Australia' },
  'Australia/Perth': { lat: -31.9505, lon: 115.8605, name: 'Perth, Australia' },
  'Australia/Adelaide': { lat: -34.9285, lon: 138.6007, name: 'Adelaide, Australia' },
  'Pacific/Auckland': { lat: -36.8485, lon: 174.7633, name: 'Auckland, New Zealand' },

  // Africa
  'Africa/Cairo': { lat: 30.0444, lon: 31.2357, name: 'Cairo, Egypt' },
  'Africa/Johannesburg': { lat: -26.2041, lon: 28.0473, name: 'Johannesburg, South Africa' },
  'Africa/Lagos': { lat: 6.5244, lon: 3.3792, name: 'Lagos, Nigeria' },
  'Africa/Nairobi': { lat: -1.2921, lon: 36.8219, name: 'Nairobi, Kenya' },
  'Africa/Casablanca': { lat: 33.5731, lon: -7.5898, name: 'Casablanca, Morocco' },
};

function parseWmoWeatherCode(code: number, isDay: boolean = true): string {
  switch (code) {
    case 0:
      return isDay ? 'Sunny' : 'Clear Sky';
    case 1:
      return isDay ? 'Mainly Sunny' : 'Mainly Clear';
    case 2:
      return 'Partly Cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Foggy';
    case 51:
    case 53:
    case 55:
      return 'Light Drizzle';
    case 56:
    case 57:
      return 'Freezing Drizzle';
    case 61:
      return 'Light Rain';
    case 63:
      return 'Moderate Rain';
    case 65:
      return 'Heavy Rain';
    case 66:
    case 67:
      return 'Freezing Rain';
    case 71:
    case 73:
    case 75:
    case 77:
      return 'Snow';
    case 80:
    case 81:
    case 82:
      return 'Rain Showers';
    case 85:
    case 86:
      return 'Snow Showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm with Hail';
    default:
      return isDay ? 'Clear' : 'Clear Sky';
  }
}

const WEATHER_CACHE_KEY = 'aim_local_weather_cache';
const WEATHER_UNIT_KEY = 'aim_weather_unit_pref';
const USER_LOCATION_KEY = 'aim_custom_location_pref';

class WeatherService {
  private unit: 'F' | 'C' = 'F';

  constructor() {
    try {
      const savedUnit = localStorage.getItem(WEATHER_UNIT_KEY);
      if (savedUnit === 'F' || savedUnit === 'C') {
        this.unit = savedUnit;
      } else {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        this.unit = tz.startsWith('America/') && !tz.includes('Sao_Paulo') && !tz.includes('Buenos_Aires') ? 'F' : 'C';
      }
    } catch {
      this.unit = 'F';
    }
  }

  getUnit(): 'F' | 'C' {
    return this.unit;
  }

  setUnit(unit: 'F' | 'C') {
    this.unit = unit;
    try {
      localStorage.setItem(WEATHER_UNIT_KEY, unit);
    } catch {
      // ignore
    }
  }

  getCustomLocation(): UserLocationConfig | null {
    try {
      const raw = localStorage.getItem(USER_LOCATION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  }

  setCustomLocation(loc: UserLocationConfig | null) {
    try {
      if (loc) {
        localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(loc));
      } else {
        localStorage.removeItem(USER_LOCATION_KEY);
      }
      localStorage.removeItem(WEATHER_CACHE_KEY); // Invalidate cache on location change
    } catch {
      // ignore
    }
  }

  getCachedWeather(): WeatherData | null {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (!cached) return null;
      const data: WeatherData = JSON.parse(cached);
      // Cache valid for 20 minutes
      const ageMinutes = (Date.now() - new Date(data.updatedAt).getTime()) / (1000 * 60);
      if (ageMinutes < 20 && data.temperatureUnit === this.unit) {
        return data;
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Search for cities using Open-Meteo Geocoding API (free, open, no key required).
   */
  async searchCities(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return [];

      const json = await res.json();
      if (!json.results || !Array.isArray(json.results)) return [];

      return json.results.map((r: any) => ({
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        country: r.country || '',
        admin1: r.admin1 || '',
        countryCode: r.country_code || '',
      }));
    } catch (err) {
      console.warn('City geocoding search failed:', err);
      return [];
    }
  }

  /**
   * Reverse geocode GPS coordinates to obtain a human-readable City & Region name.
   */
  private async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      // 1. Try BigDataCloud reverse geocoding (fast, client-side, CORS-friendly)
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const res = await fetch(bdcUrl, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const state = data.principalSubdivisionCode || data.principalSubdivision;
        const country = data.countryCode || data.countryName;

        if (city && state && country === 'US') {
          const stateShort = state.replace('US-', '');
          return `${city}, ${stateShort}`;
        }
        if (city && country) {
          return `${city}, ${country}`;
        }
        if (city) return city;
      }
    } catch {
      // fallback
    }

    try {
      // 2. Try OpenStreetMap Nominatim reverse geocode
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
      const res = await fetch(osmUrl, {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.county;
        const state = addr.state;
        const country = addr.country_code?.toUpperCase();

        if (city && state && country === 'US') {
          return `${city}, ${state}`;
        }
        if (city && country) {
          return `${city}, ${country}`;
        }
        if (city) return city;
      }
    } catch {
      // fallback
    }

    return null;
  }

  /**
   * Try IP-based location detection when GPS is denied or unavailable in iframe.
   */
  private async detectLocationViaIP(): Promise<{ lat: number; lon: number; name: string } | null> {
    try {
      // Try freeipapi.com
      const res = await fetch('https://freeipapi.com/api/json', {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lon = parseFloat(data.longitude);
          const city = data.cityName;
          const region = data.regionName;
          const country = data.countryCode;
          let name = city;
          if (city && region && country === 'US') {
            name = `${city}, ${region}`;
          } else if (city && country) {
            name = `${city}, ${country}`;
          }
          return { lat, lon, name: name || 'Local Area' };
        }
      }
    } catch {
      // fallback
    }

    try {
      // Try ipapi.co
      const res = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lon = parseFloat(data.longitude);
          const city = data.city;
          const region = data.region_code || data.region;
          const country = data.country_code;
          let name = city;
          if (city && region && country === 'US') {
            name = `${city}, ${region}`;
          } else if (city && country) {
            name = `${city}, ${country}`;
          }
          return { lat, lon, name: name || 'Local Area' };
        }
      }
    } catch {
      // fallback
    }

    return null;
  }

  /**
   * Resolve location using multi-tier fallback:
   * 1. Custom User Choice -> 2. Browser Geolocation (with Reverse Geocoding) -> 3. IP Geolocation -> 4. Timezone coordinates
   */
  async resolveCoordinates(
    tz: string,
    requireFreshGPS: boolean = false
  ): Promise<{ lat: number; lon: number; name: string; isCustom?: boolean }> {
    // 1. Check custom user location (unless fresh GPS specifically requested)
    if (!requireFreshGPS) {
      const custom = this.getCustomLocation();
      if (custom && custom.lat && custom.lon && custom.name) {
        return { ...custom, isCustom: true };
      }
    }

    // 2. Try browser geolocation with reverse geocoding
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 7000, // 7s allows user permission prompt on mobile/desktop
            maximumAge: 300000, // 5 min cache
          });
        });

        const lat = parseFloat(position.coords.latitude.toFixed(4));
        const lon = parseFloat(position.coords.longitude.toFixed(4));

        // Reverse lookup city name
        const detectedName = await this.reverseGeocode(lat, lon);
        const fallbackTzName = tz.split('/').pop()?.replace(/_/g, ' ') || 'Local Area';

        return {
          lat,
          lon,
          name: detectedName || fallbackTzName,
        };
      } catch (geoErr) {
        // Geolocation denied, iframe restricted, or timed out
      }
    }

    // 3. Try IP-based location detection
    const ipLocation = await this.detectLocationViaIP();
    if (ipLocation) {
      return ipLocation;
    }

    // 4. Lookup timezone coordinates
    if (TIMEZONE_COORDINATES[tz]) {
      return TIMEZONE_COORDINATES[tz];
    }

    // 5. Derive from timezone prefix
    const tzCity = tz.split('/').pop()?.replace(/_/g, ' ') || 'Local Area';
    return {
      lat: 34.0522,
      lon: -118.2437,
      name: tzCity,
    };
  }

  /**
   * Fetch weather from Open-Meteo with comprehensive fallback.
   */
  async fetchLocalWeather(
    forcedUserTimeZone?: string,
    options?: { forceGPS?: boolean; customLocation?: UserLocationConfig }
  ): Promise<WeatherData> {
    const tz = getEffectiveTimeZone(forcedUserTimeZone);

    // 1. Determine latitude & longitude
    let coords: { lat: number; lon: number; name: string };
    if (options?.customLocation) {
      coords = options.customLocation;
    } else {
      coords = await this.resolveCoordinates(tz, options?.forceGPS);
    }

    // 2. Query Open-Meteo Free API (reliable, fast, no key required)
    const tempUnitParam = this.unit === 'C' ? 'celsius' : 'fahrenheit';
    const windUnitParam = this.unit === 'C' ? 'kmh' : 'mph';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=${tempUnitParam}&wind_speed_unit=${windUnitParam}&timezone=auto`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Weather service responded with status ${res.status}`);
      }
      const json = await res.json();
      const current = json.current;
      const daily = json.daily;

      const isDay = current.is_day === 1;
      const weatherCode = current.weather_code ?? 0;
      const condition = parseWmoWeatherCode(weatherCode, isDay);

      const weatherData: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        apparentTemperature: Math.round(current.apparent_temperature),
        temperatureUnit: this.unit,
        weatherCode,
        condition,
        isDay,
        humidity: Math.round(current.relative_humidity_2m || 0),
        windSpeed: Math.round(current.wind_speed_10m || 0),
        windSpeedUnit: this.unit === 'C' ? 'km/h' : 'mph',
        locationName: coords.name,
        latitude: coords.lat,
        longitude: coords.lon,
        updatedAt: new Date().toISOString(),
        forecastToday: daily
          ? {
              maxTemp: Math.round(daily.temperature_2m_max?.[0] ?? current.temperature_2m),
              minTemp: Math.round(daily.temperature_2m_min?.[0] ?? current.temperature_2m),
            }
          : undefined,
      };

      try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData));
      } catch {
        // ignore
      }

      return weatherData;
    } catch (err) {
      console.warn('Failed to fetch from Open-Meteo, falling back to simulated data for timezone:', err);
      const hour = new Date().getHours();
      const isDay = hour >= 6 && hour < 20;
      return {
        temperature: this.unit === 'F' ? 72 : 22,
        apparentTemperature: this.unit === 'F' ? 72 : 22,
        temperatureUnit: this.unit,
        weatherCode: 0,
        condition: isDay ? 'Sunny' : 'Clear Sky',
        isDay,
        humidity: 48,
        windSpeed: this.unit === 'F' ? 8 : 13,
        windSpeedUnit: this.unit === 'F' ? 'mph' : 'km/h',
        locationName: coords.name,
        latitude: coords.lat,
        longitude: coords.lon,
        updatedAt: new Date().toISOString(),
        forecastToday: {
          maxTemp: this.unit === 'F' ? 78 : 25,
          minTemp: this.unit === 'F' ? 62 : 17,
        },
      };
    }
  }
}

export const weatherService = new WeatherService();
