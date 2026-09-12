import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  RefreshCw,
  MapPin,
  Wind,
  Droplets,
  Clock,
  Search,
  Crosshair,
  X,
  Check,
} from 'lucide-react';
import { weatherService, WeatherData, LocationSearchResult } from '../../services/weatherService';
import { getWeatherIcon } from './WeatherPill';
import { formatLocalTime, formatFullLocalDate, formatDayOfWeek, getEffectiveTimeZone } from '../../utils/dateTimeUtils';

interface WeatherCardProps {
  userTimeZone?: string;
  className?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  userTimeZone,
  className = '',
}) => {
  const effectiveTz = getEffectiveTimeZone(userTimeZone);
  const [weather, setWeather] = useState<WeatherData | null>(() => weatherService.getCachedWeather());
  const [isLoading, setIsLoading] = useState<boolean>(!weather);
  const [unit, setUnit] = useState<'F' | 'C'>(() => weatherService.getUnit());
  const [now, setNow] = useState<Date>(new Date());

  // Location search modal / popover
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadWeather = async (forceRefresh: boolean = false, forceGPS: boolean = false) => {
    try {
      setIsLoading(true);
      const data = await weatherService.fetchLocalWeather(userTimeZone, { forceGPS });
      setWeather(data);
    } catch (e) {
      console.warn('Weather card fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsDetectingGPS(false);
    }
  };

  useEffect(() => {
    loadWeather();
    const weatherInterval = setInterval(() => loadWeather(), 15 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, [userTimeZone, unit]);

  // Live time ticker
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Handle location search debouncing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await weatherService.searchCities(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleUnit = () => {
    const nextUnit = unit === 'F' ? 'C' : 'F';
    setUnit(nextUnit);
    weatherService.setUnit(nextUnit);
    loadWeather(true);
  };

  const handleSelectLocation = async (result: LocationSearchResult) => {
    const name = result.admin1
      ? `${result.name}, ${result.admin1}`
      : `${result.name}, ${result.country}`;

    const customLoc = {
      lat: result.latitude,
      lon: result.longitude,
      name,
      isCustom: true,
    };

    weatherService.setCustomLocation(customLoc);
    setIsSearchingLocation(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsLoading(true);

    const data = await weatherService.fetchLocalWeather(userTimeZone, {
      customLocation: customLoc,
    });
    setWeather(data);
    setIsLoading(false);
  };

  const handleUseCurrentGPS = async () => {
    setIsDetectingGPS(true);
    weatherService.setCustomLocation(null);
    setIsSearchingLocation(false);
    setSearchQuery('');
    setSearchResults([]);
    await loadWeather(true, true);
  };

  const dayOfWeek = formatDayOfWeek(now, effectiveTz);
  const fullDate = formatFullLocalDate(now, effectiveTz);
  const localTime = formatLocalTime(now, effectiveTz);

  return (
    <div
      id="aim-local-weather-time-card"
      className={`rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/30 border border-slate-800/90 shadow-lg p-4 sm:p-5 text-slate-100 relative overflow-hidden backdrop-blur-sm ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Time & Date */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              {dayOfWeek}
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>{(effectiveTz || '').replace(/_/g, ' ')}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <div
              id="aim-weather-card-live-time"
              className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight tabular-nums"
            >
              {localTime}
            </div>
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate">
              {fullDate}
            </span>
          </div>
        </div>

        {/* Right Side: Weather Status */}
        <div className="flex items-center gap-3.5 sm:border-l sm:border-slate-800 sm:pl-5">
          {weather ? (
            <>
              <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-sm shrink-0">
                {getWeatherIcon(weather.weatherCode, weather.isDay, 'w-8 h-8')}
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">
                    {weather.temperature}°{weather.temperatureUnit}
                  </span>
                  <button
                    onClick={toggleUnit}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                    title="Toggle °F / °C"
                  >
                    °{unit === 'F' ? 'C' : 'F'}
                  </button>
                  <button
                    onClick={() => loadWeather(true)}
                    disabled={isLoading}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                    title="Refresh Weather"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="truncate">{weather.condition}</span>
                  {weather.forecastToday && (
                    <span className="text-slate-500 text-[11px]">
                      (H: {weather.forecastToday.maxTemp}° / L: {weather.forecastToday.minTemp}°)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                  {/* Clickable Location Selector Button */}
                  <button
                    onClick={() => {
                      setIsSearchingLocation(true);
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }}
                    className="flex items-center gap-1 text-slate-300 hover:text-indigo-300 transition-colors group cursor-pointer"
                    title="Change location / Detect GPS"
                  >
                    <MapPin className="w-3 h-3 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate max-w-[130px] font-medium border-b border-dotted border-slate-600 group-hover:border-indigo-400">
                      {weather.locationName}
                    </span>
                  </button>

                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{weather.humidity}%</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-1">
                    <Wind className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{weather.windSpeed} {weather.windSpeedUnit}</span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Detecting local weather...</span>
            </div>
          )}
        </div>
      </div>

      {/* Location Search Dialog / Popover */}
      {isSearchingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 text-slate-100 relative space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm text-white">Select Location</span>
              </div>
              <button
                onClick={() => setIsSearchingLocation(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              onClick={handleUseCurrentGPS}
              disabled={isDetectingGPS}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition-colors"
            >
              {isDetectingGPS ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-300" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>{isDetectingGPS ? 'Detecting GPS coordinates...' : 'Auto-Detect Current GPS Location'}</span>
            </button>

            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city (e.g. Dallas, London, Tokyo)..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Suggestions List */}
              {isSearching && (
                <div className="flex items-center justify-center py-4 text-slate-500 text-xs gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                  <span>Searching locations...</span>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                  {searchResults.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => handleSelectLocation(res)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs text-slate-200 group"
                    >
                      <div>
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {res.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {[res.admin1, res.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <Check className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="py-3 text-center text-xs text-slate-500">
                  No matching cities found. Try another city name.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
