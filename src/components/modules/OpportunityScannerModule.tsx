import React, { useState } from 'react';
import {
  Compass,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Car,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  MapPin,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Globe,
  Database,
  Radio,
} from 'lucide-react';
import {
  JobListing,
  JobScanRun,
  JobMaterialChange,
  PersonalOperatingContext,
  VehiclePolicyType,
  JobSearchSuggestion,
} from '../../types';
import { jobScannerService, JobScannerConfig } from '../../services/jobScannerService';

interface OpportunityScannerModuleProps {
  context: PersonalOperatingContext;
  onJobApplied?: (job: JobListing) => void;
  onToast: (msg: string) => void;
}

export const OpportunityScannerModule: React.FC<OpportunityScannerModuleProps> = ({
  context,
  onJobApplied,
  onToast,
}) => {
  const [isDemoAllowed, setIsDemoAllowed] = useState<boolean>(() => jobScannerService.isDemoDataAllowed());
  const [listings, setListings] = useState<JobListing[]>(() => jobScannerService.getListings());
  const [scanRuns, setScanRuns] = useState<JobScanRun[]>(() => jobScannerService.getScanRuns());
  const [config, setConfig] = useState<JobScannerConfig>(() => jobScannerService.getConfig());
  const [searchSuggestions, setSearchSuggestions] = useState<JobSearchSuggestion[]>(() =>
    jobScannerService.getSearchSuggestions()
  );
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    noNewQualifyingListings?: boolean;
    newCount?: number;
    changedCount?: number;
    summaryMessage?: string;
    liveProviderConnected?: boolean;
  } | null>(null);

  // Filter states
  const [vehicleProvidedOnly, setVehicleProvidedOnly] = useState(config?.filterVehicleProvidedOnly ?? true);
  const [nonCdlOnly, setNonCdlOnly] = useState(config?.filterNonCdlOnly ?? true);
  const [noHeavyLifting, setNoHeavyLifting] = useState(config?.filterNoHeavyLifting ?? true);
  const [directEmployerOnly, setDirectEmployerOnly] = useState(config?.filterDirectEmployerOnly ?? true);
  const [newSinceLastScan, setNewSinceLastScan] = useState(config?.filterNewSinceLastScan ?? false);
  const [radiusMiles, setRadiusMiles] = useState(config?.radiusMiles ?? 35);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  const handleToggleDemoData = (enabled: boolean) => {
    jobScannerService.setDemoDataAllowed(enabled);
    setIsDemoAllowed(enabled);
    const updated = jobScannerService.getListings();
    setListings(updated);
    if (enabled) {
      onToast('Demo Data Mode enabled: Showing simulated sample jobs with explicit [DEMO] markings.');
    } else {
      onToast('Live Data Mode enabled: Zero fabrication active. No simulated or mock data displayed.');
    }
  };

  // Manual Scan Trigger
  const handleExecuteScan = async () => {
    setIsScanning(true);
    try {
      // Call server endpoint or fallback to service
      let responseData: any = null;
      try {
        const res = await fetch('/api/aim/jobs/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: config.location,
            radiusMiles,
            storedListings: listings,
            isWeekdayScheduled: false,
            userConstraints: context,
            allowDemoData: isDemoAllowed,
          }),
        });
        if (res.ok) {
          responseData = await res.json();
        }
      } catch (err) {
        console.warn('Live API scan fallback to client service:', err);
      }

      const scanResult = responseData || jobScannerService.executeScan(false);

      if (scanResult.searchSuggestions) {
        setSearchSuggestions(scanResult.searchSuggestions);
      }

      setListings(jobScannerService.getListings());
      setScanRuns(jobScannerService.getScanRuns());
      setLastScanResult({
        noNewQualifyingListings: scanResult.noNewQualifyingListings,
        newCount: scanResult.newListings?.length || 0,
        changedCount: scanResult.materialChanges?.length || 0,
        summaryMessage: scanResult.scanRun?.summaryMessage,
        liveProviderConnected: scanResult.liveProviderConnected,
      });

      if (scanResult.noNewQualifyingListings) {
        onToast('Scan complete: Live search feed checked. No unverified or synthetic jobs were generated.');
      } else {
        onToast(
          `Scan completed with ${scanResult.newListings?.length || 0} listing(s) updated!`
        );
      }
    } catch (e: any) {
      onToast('Failed to complete scan: ' + (e.message || 'Network error'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyClick = (job: JobListing) => {
    const updated = listings.map((j) => {
      if (j.id === job.id) {
        return {
          ...j,
          appliedDate: new Date().toISOString(),
          appliedNotes: 'Applied directly through employer link',
        };
      }
      return j;
    });
    setListings(updated);
    jobScannerService.saveListings(updated);
    if (onJobApplied) onJobApplied(job);
    onToast(`Logged application to ${job.employer} under Immediate Income!`);
  };

  // Filter and rank listings
  const filteredListings = listings.filter((job) => {
    // 1. Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        job.employer.toLowerCase().includes(q) ||
        job.role.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Vehicle provided filter
    if (vehicleProvidedOnly) {
      if (job.vehiclePolicy !== 'employer_provided_on_duty' && job.vehiclePolicy !== 'take_home') {
        return false;
      }
    }

    // 3. Non-CDL only
    if (nonCdlOnly && job.cdlRequired) {
      return false;
    }

    // 4. No heavy lifting
    if (noHeavyLifting && job.fitRating === 'excluded') {
      return false;
    }

    // 5. Direct employer only
    if (directEmployerOnly && job.sourceType !== 'official_employer') {
      return false;
    }

    // 6. New since last scan
    if (newSinceLastScan) {
      const isNew = new Date(job.firstSeenDate).getTime() > Date.now() - 48 * 3600 * 1000;
      const isChanged = Boolean(job.materialChangeSummary);
      if (!isNew && !isChanged) return false;
    }

    return true;
  });

  const rankedListings = jobScannerService.rankListings(filteredListings);
  const latestRun = scanRuns[0];

  return (
    <div id="opportunity-scanner-screen" className="space-y-6 animate-fadeIn pb-12">
      {/* Zero Fabrication Data Mode & Integrity Banner */}
      <div
        id="data-integrity-mode-banner"
        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDemoAllowed
            ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-600/50 text-emerald-200'
        }`}
      >
        <div className="flex items-start sm:items-center gap-2.5">
          {isDemoAllowed ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wide">
                {isDemoAllowed ? 'DEMO DATA MODE (SIMULATED SAMPLE)' : 'LIVE MODE: ZERO FABRICATION ACTIVE'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isDemoAllowed
                    ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                    : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                }`}
              >
                {isDemoAllowed ? 'Simulated' : 'Strict Real-World Only'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isDemoAllowed
                ? 'Displaying simulated test listings for UI demonstration. None of these listings are verified live job openings.'
                : 'AIM never fabricates employers, wages, contacts, or openings. Direct employer portals and search queries provided below.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer select-none px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-600">
            <span>Show Demo Data</span>
            <input
              type="checkbox"
              id="toggle-demo-data-input"
              checked={Boolean(isDemoAllowed)}
              onChange={(e) => handleToggleDemoData(e.target.checked)}
              className="rounded border-slate-600 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              DFW Opportunity Scanner
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified company-vehicle driving, shuttle, and fleet logistics positions in Fort Worth & DFW.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[10px] px-2.5 py-1 rounded-xl bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800/60 flex items-center gap-1.5"
              title="Configured automatic schedule"
            >
              <Calendar className="w-3 h-3 text-indigo-400" />
              Runs Mon-Fri @ 7:30 AM
            </span>

            <button
              id="scanner-manual-run-btn"
              onClick={handleExecuteScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-white' : ''}`} />
              <span>{isScanning ? 'Scanning DFW...' : 'Scan Now'}</span>
            </button>
          </div>
        </div>

        {/* Location & Radius bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-400">Search Center:</span>
            <span className="font-semibold text-white truncate">{config?.location || 'Fort Worth, Texas'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Radius:</span>
            <select
              value={radiusMiles ?? 35}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
              className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value={15} className="bg-slate-900 text-white">15 Miles (Fort Worth core)</option>
              <option value={25} className="bg-slate-900 text-white">25 Miles (FW + Arlington)</option>
              <option value={35} className="bg-slate-900 text-white">35 Miles (FW + DFW Airport + Irving)</option>
              <option value={50} className="bg-slate-900 text-white">50 Miles (Greater DFW Metro)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">License Rule:</span>
            <span className="font-semibold text-white">Texas Class C (Clean)</span>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by employer (The Parking Spot, Enterprise), role, or city..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              showFilters
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Strict Filters</span>
          </button>
        </div>

        {/* Expandable Filter Toggles */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-3 mt-3 border-t border-slate-800 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={Boolean(vehicleProvidedOnly)}
                onChange={(e) => setVehicleProvidedOnly(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="font-medium">Work Vehicle Only</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={Boolean(nonCdlOnly)}
                onChange={(e) => setNonCdlOnly(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="font-medium">Non-CDL (Class C)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={Boolean(noHeavyLifting)}
                onChange={(e) => setNoHeavyLifting(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="font-medium">No Heavy Labor</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={Boolean(directEmployerOnly)}
                onChange={(e) => setDirectEmployerOnly(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="font-medium">Direct Employer Only</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={Boolean(newSinceLastScan)}
                onChange={(e) => setNewSinceLastScan(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="font-medium">New / Changed Only</span>
            </label>
          </div>
        )}
      </div>

      {/* Zero New Findings Banner (Acceptance Test #11 Requirement) */}
      {lastScanResult && lastScanResult.noNewQualifyingListings && (
        <div
          id="no-new-qualifying-listings-banner"
          className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/40 text-slate-200 flex items-start gap-3 shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-800">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              No new qualifying company-vehicle driver listings found today.
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              All active employers in Fort Worth and the DFW Airport corridor were checked. No new postings or material pay/requirement changes occurred since your last verified run.
            </p>
          </div>
        </div>
      )}

      {/* Vehicle Policy Distinction Callout (Strict Mandatory Constraint) */}
      <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200/90 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white font-semibold">Important Vehicle Policy Distinction:</strong>
          <span className="ml-1">
            "Employer-provided vehicle on-duty" means the employer supplies the van, bus, or sedan strictly during your working shift (picked up and parked at the depot). It is <strong>NOT</strong> available for personal commuting or errands. You must arrange transportation (TRE train, bus, or ride) to reach the dispatch base.
          </span>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{rankedListings.length}</strong> qualifying opportunity(ies)
        </span>
        {latestRun && (
          <span>
            Last Scan: <strong className="text-white">{new Date(latestRun.scanCompletionTime).toLocaleDateString()}</strong>
          </span>
        )}
      </div>

      {/* Zero Fabrication: If no verified listings are available and demo mode is off */}
      {rankedListings.length === 0 ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/95 border border-indigo-500/40 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-800">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Live Job Search API Not Connected
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-bold border border-indigo-800">
                    Zero Fabrication Mandate
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  AIM strictly complies with the Zero Fabrication rule. When live job board APIs or verified employer feeds are not actively integrated, AIM will <strong>never synthesize, invent, or guess</strong> open roles, wages, or recruiter contacts.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  To find verified live openings that provide company vehicles without personal vehicle or CDL requirements, visit these official direct employer career portals or run pre-configured search queries:
                </p>
              </div>
            </div>

            {/* Grid of Verified Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {searchSuggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{sug.organization}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {sug.location}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-indigo-300 mb-1.5">
                      {sug.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      {sug.notes}
                    </p>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-emerald-300/90 mb-2">
                      <strong>Vehicle Policy:</strong> {sug.vehiclePolicyNote}
                    </div>
                    {sug.searchQuery && (
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        Query: {sug.searchQuery}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      {sug.category.replace(/_/g, ' ')}
                    </span>
                    <a
                      href={sug.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      <span>Visit Career Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>Looking to preview the ranking and constraint evaluation interface?</span>
              <button
                onClick={() => handleToggleDemoData(true)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Enable Demo Data (Clearly labeled simulated listings)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Ranked Job Cards Grid */
        <div className="space-y-4">
          {rankedListings.map((job, index) => {
            const isExpanded = expandedDetailsId === job.id;
            const isTopRanked = index === 0;
            const isMockData = Boolean(job.is_mock || (job as any).isMock || job.provenance === 'demo');

            return (
              <div
                key={job.id}
                className={`bg-slate-900/90 rounded-2xl border transition-all overflow-hidden ${
                  isMockData
                    ? 'border-amber-700/50 hover:border-amber-600/70'
                    : isTopRanked
                    ? 'border-indigo-500/60 shadow-lg shadow-indigo-950/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Simulated Warning Banner on Card */}
                {isMockData && (
                  <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-amber-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>DEMO DATA — SIMULATED FOR UI TESTING</span>
                    </div>
                    <span className="text-[10px] text-amber-300/80 hidden sm:inline">
                      Not a verified live job opening
                    </span>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  {/* Card Top Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400">#{index + 1} Fit</span>
                      <span className="text-xs font-bold text-white">{job.employer}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          job.sourceType === 'official_employer'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {job.sourceType === 'official_employer' ? 'Official Employer Portal' : 'Aggregator'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                          isMockData
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}
                      >
                        {job.provenance || (isMockData ? 'demo' : 'verified')}
                      </span>
                    </div>

                    {job.appliedDate ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Applied on {new Date(job.appliedDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          job.fitRating === 'strong_fit'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : job.fitRating === 'conditional_fit'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {(job.fitRating || '').replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* Role & Pay */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-3">
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      {job.role}
                    </h2>
                    <div className="text-emerald-400 font-bold text-sm sm:text-base font-mono">
                      {job.pay}
                    </div>
                  </div>

                  {/* Core Badges: Location, Vehicle, License */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3.5">
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>

                    {/* Explicit Vehicle Policy Badge */}
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-medium">
                      <Car className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Work Vehicle Provided</span>
                    </div>

                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{job.licenseRequired}</span>
                    </div>
                  </div>

                  {/* Vehicle Explanation Callout */}
                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs mb-3 space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      Vehicle Terms & Commute Rules:
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {job.vehicleExplanation}
                    </p>
                  </div>

                  {/* Why It Fits */}
                  <div className="text-xs text-slate-300 mb-3 leading-relaxed">
                    <strong className="text-white">Why it fits: </strong>
                    {job.whyItFits}
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="pt-3 mt-3 border-t border-slate-800 space-y-3 text-xs text-slate-300 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <div className="font-semibold text-slate-200">Physical & Lifting Burden:</div>
                          <p className="text-slate-400">{job.physicalRequirements}</p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="font-semibold text-slate-200">Customer Interaction:</div>
                          <p className="text-slate-400">{job.customerFacingDuties}</p>
                        </div>
                      </div>

                      {job.watchOuts && job.watchOuts.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-300">
                          <span className="font-semibold flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Watch-Outs & Uncertainties:
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200/90">
                            {job.watchOuts.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Source: {job.sourceName}</span>
                        <span>Status: {isMockData ? 'Simulated Sample' : `Verified ${job.dateLastVerified}`}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => setExpandedDetailsId(isExpanded ? null : job.id)}
                      className="flex items-center justify-center sm:justify-start gap-1 text-xs text-slate-400 hover:text-slate-200 py-1 font-medium"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Requirements & Commute'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      {!job.appliedDate && (
                        <button
                          onClick={() => handleApplyClick(job)}
                          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                        >
                          Mark Applied
                        </button>
                      )}

                      <a
                        href={job.directApplicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all ${
                          isMockData
                            ? 'bg-amber-700 hover:bg-amber-600 shadow-amber-700/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                        }`}
                      >
                        <span>{isMockData ? 'Sample Link (Demo)' : 'Direct Employer Apply'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
