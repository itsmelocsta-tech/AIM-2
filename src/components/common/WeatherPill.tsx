import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  RefreshCw,
  MapPin,
  Wind,
  Droplets,
  ChevronDown,
  X,
  Search,
  Crosshair,
  Check,
} from 'lucide-react';
import { weatherService, WeatherData, LocationSearchResult } from '../../services/weatherService';

interface WeatherPillProps {
  userTimeZone?: string;
  className?: string;
}

export function getWeatherIcon(code: number, isDay: boolean = true, className: string = 'w-3.5 h-3.5') {
  switch (code) {
    case 0:
      return isDay ? (
        <Sun className={`${className} text-amber-400`} />
      ) : (
        <Moon className={`${className} text-indigo-300`} />
      );
    case 1:
    case 2:
      return isDay ? (
        <CloudSun className={`${className} text-amber-300`} />
      ) : (
        <CloudMoon className={`${className} text-indigo-300`} />
      );
    case 3:
      return <Cloud className={`${className} text-slate-400`} />;
    case 45:
    case 48:
      return <CloudFog className={`${className} text-slate-400`} />;
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return <CloudDrizzle className={`${className} text-cyan-400`} />;
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return <CloudRain className={`${className} text-sky-400`} />;
    case 66:
    case 67:
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return <CloudSnow className={`${className} text-sky-200`} />;
    case 95:
    case 96:
    case 99:
      return <CloudLightning className={`${className} text-amber-400`} />;
    default:
      return isDay ? (
        <Sun className={`${className} text-amber-400`} />
      ) : (
        <Moon className={`${className} text-indigo-300`} />
      );
  }
}

export const WeatherPill: React.FC<WeatherPillProps> = ({
  userTimeZone,
  className = '',
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(() => weatherService.getCachedWeather());
  const [isLoading, setIsLoading] = useState<boolean>(!weather);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [unit, setUnit] = useState<'F' | 'C'>(() => weatherService.getUnit());

  // Search location state
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
      console.warn('Weather fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsDetectingGPS(false);
    }
  };

  useEffect(() => {
    loadWeather();

    // Refresh every 15 minutes
    const interval = setInterval(() => {
      loadWeather();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userTimeZone, unit]);

  // Debounced search for city locations
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

  const toggleUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  if (!weather && isLoading) {
    return (
      <div
        id="weather-pill-loading"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs ${className}`}
      >
        <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
        <span className="text-[11px]">Weather...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="relative inline-block">
      {/* Interactive Compact Pill */}
      <button
        id="aim-weather-pill-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all text-xs font-medium group shadow-sm ${className}`}
        title={`${weather.condition}, ${weather.temperature}°${weather.temperatureUnit} in ${weather.locationName}. Click for weather details.`}
      >
        {getWeatherIcon(weather.weatherCode, weather.isDay, 'w-4 h-4 shrink-0')}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white tabular-nums text-xs sm:text-sm">
            {weather.temperature}°{weather.temperatureUnit}
          </span>
          <span className="hidden md:inline text-slate-400 text-[11px] max-w-[90px] truncate">
            {weather.condition}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card */}
      {isExpanded && (
        <>
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsExpanded(false);
              setIsSearchingLocation(false);
            }}
          />

          <div
            id="aim-weather-details-card"
            className="absolute top-full right-0 mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 text-slate-200 animate-fadeIn"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => {
                  setIsSearchingLocation(!isSearchingLocation);
                  if (!isSearchingLocation) {
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }
                }}
                className="flex items-center gap-1.5 text-left group hover:text-indigo-300 transition-colors"
                title="Click to search / change location"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-white truncate max-w-[150px] border-b border-dotted border-slate-600 group-hover:border-indigo-400">
                  {weather.locationName}
                </span>
              </button>

              <div className="flex items-center gap-2">
                {/* Unit Switcher */}
                <button
                  onClick={toggleUnit}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                  title="Switch Temperature Unit"
                >
                  °{unit === 'F' ? 'C' : 'F'}
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inline Location Search Bar */}
            {isSearchingLocation && (
              <div className="py-2 space-y-2 border-b border-slate-800 animate-fadeIn">
                <button
                  onClick={handleUseCurrentGPS}
                  disabled={isDetectingGPS}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-[11px] font-medium transition-colors"
                >
                  {isDetectingGPS ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-300" />
                  ) : (
                    <Crosshair className="w-3 h-3 text-indigo-400" />
                  )}
                  <span>{isDetectingGPS ? 'Detecting GPS...' : 'Use Current GPS Location'}</span>
                </button>

                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city (e.g. Miami, London)..."
                    className="w-full pl-7 pr-7 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isSearching && (
                  <div className="flex items-center justify-center py-2 text-slate-500 text-[11px] gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    <span>Searching...</span>
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-0.5 rounded-lg bg-slate-950 p-1 border border-slate-800 text-[11px]">
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        onClick={() => handleSelectLocation(res)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 transition-colors flex items-center justify-between text-slate-200 group"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-white group-hover:text-indigo-300">
                            {res.name}
                          </span>
                          <span className="text-slate-500 ml-1">
                            {[res.admin1, res.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                        <Check className="w-3 h-3 text-indigo-400 shrink-0 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Conditions Block */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  {getWeatherIcon(weather.weatherCode, weather.isDay, 'w-8 h-8')}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                    {weather.temperature}°{weather.temperatureUnit}
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    {weather.condition}
                  </div>
                </div>
              </div>

              {weather.forecastToday && (
                <div className="text-right space-y-0.5">
                  <div className="text-xs text-slate-300 font-semibold">
                    H: {weather.forecastToday.maxTemp}° · L: {weather.forecastToday.minTemp}°
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Feels like {weather.apparentTemperature}°
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Humidity</div>
                  <div className="font-semibold text-slate-200">{weather.humidity}%</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <Wind className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Wind</div>
                  <div className="font-semibold text-slate-200">
                    {weather.windSpeed} {weather.windSpeedUnit}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Refresh */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>Updated {new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <button
                onClick={() => loadWeather(true)}
                disabled={isLoading}
                className="flex items-center gap-1 hover:text-indigo-300 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
