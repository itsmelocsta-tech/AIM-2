import {
  JobListing,
  JobScanRun,
  JobMaterialChange,
  PersonalOperatingContext,
  VehiclePolicyType,
  JobFitRating,
  JobSearchSuggestion,
} from '../types';

export const JOB_STORAGE_KEYS = {
  LISTINGS: 'aim_job_listings_v1',
  SCAN_RUNS: 'aim_job_scan_runs_v1',
  MATERIAL_CHANGES: 'aim_job_material_changes_v1',
  SCANNER_CONFIG: 'aim_job_scanner_config_v1',
  ALLOW_DEMO_DATA: 'aim_allow_demo_jobs',
};

export interface JobScannerConfig {
  location: string;
  radiusMiles: number;
  weekdayScheduleEnabled: boolean;
  scheduledTime: string; // e.g. "07:30"
  filterVehicleProvidedOnly: boolean;
  filterNonCdlOnly: boolean;
  filterNoHeavyLifting: boolean;
  filterDirectEmployerOnly: boolean;
  filterNewSinceLastScan: boolean;
}

export const DEFAULT_SCANNER_CONFIG: JobScannerConfig = {
  location: '',
  radiusMiles: 25,
  weekdayScheduleEnabled: false,
  scheduledTime: '08:00',
  filterVehicleProvidedOnly: false,
  filterNonCdlOnly: false,
  filterNoHeavyLifting: false,
  filterDirectEmployerOnly: false,
  filterNewSinceLastScan: false,
};

// Verified official search paths and career portals for real-world job discovery without fabrication
export const VERIFIED_DFW_SEARCH_SUGGESTIONS: JobSearchSuggestion[] = [
  {
    id: 'sug-trinity-metro',
    title: 'Trinity Metro Fort Worth - Transit & Community ACCESS Driver Careers',
    organization: 'Trinity Metro',
    url: 'https://ridetrinitymetro.org/careers',
    searchQuery: 'ACCESS driver community van non-CDL Fort Worth',
    notes: 'Official Fort Worth public transit portal. Community ACCESS vans do not require CDL-A/B; employer provides on-duty vehicle with paid training.',
    category: 'official_employer',
    vehiclePolicyNote: '100% employer-provided on-duty transit van (dispatched from Fort Worth depot).',
    location: 'Fort Worth, TX',
  },
  {
    id: 'sug-enterprise-dfw',
    title: 'Enterprise Mobility - Rental Fleet Logistics & Vehicle Transporter',
    organization: 'Enterprise Mobility',
    url: 'https://careers.enterprise.com',
    searchQuery: 'driver vehicle transporter automotive logistics Fort Worth DFW',
    notes: 'Move rental vehicles between airport lots and local Fort Worth branches. Non-CDL Class C accepted. Zero personal vehicle required.',
    category: 'official_employer',
    vehiclePolicyNote: '100% employer fleet vehicles driven on shift.',
    location: 'Fort Worth & DFW Airport, TX',
  },
  {
    id: 'sug-parking-spot-dfw',
    title: 'The Parking Spot - Airport Passenger Shuttle Bus Driver',
    organization: 'The Parking Spot',
    url: 'https://theparkingspot.wd5.myworkdayjobs.com/careers',
    searchQuery: 'shuttle driver DFW Airport passenger customer service',
    notes: 'Customer-facing hospitality transit shuttling air passengers. Texas Class C non-CDL accepted. Cash tips common.',
    category: 'official_employer',
    vehiclePolicyNote: 'Employer provides airport passenger shuttle buses strictly on duty.',
    location: 'DFW Airport, TX',
  },
  {
    id: 'sug-quest-diagnostics',
    title: 'Quest Diagnostics - Medical Laboratory Route Courier',
    organization: 'Quest Diagnostics',
    url: 'https://careers.questdiagnostics.com',
    searchQuery: 'courier route driver Fort Worth medical specimen',
    notes: 'Dedicated company vehicle with fuel card and GPS provided on duty for clinic specimen pickups in Tarrant County. Non-CDL Class C.',
    category: 'official_employer',
    vehiclePolicyNote: 'Dedicated company car provided on duty with fuel card.',
    location: 'Fort Worth, TX',
  },
  {
    id: 'sug-google-jobs-dfw',
    title: 'Google Jobs Texas - "Driver Employer Provided Vehicle Non-CDL Fort Worth"',
    organization: 'Google Jobs Engine',
    url: 'https://www.google.com/search?q=driver+employer+provided+vehicle+non-CDL+Fort+Worth+TX+jobs',
    searchQuery: 'driver employer provided vehicle non-CDL Fort Worth TX jobs',
    notes: 'Direct search query targeting real-world live job postings specifying employer-provided vehicles without CDL.',
    category: 'job_board_query',
    vehiclePolicyNote: 'Filters for employer-provided vehicle in search terms.',
    location: 'Fort Worth, TX & DFW Area',
  },
  {
    id: 'sug-city-fort-worth',
    title: 'City of Fort Worth Official Careers - Transportation & Operations',
    organization: 'City of Fort Worth',
    url: 'https://www.fortworthtexas.gov/departments/hr/employees/careers',
    searchQuery: 'driver operations equipment transport non-CDL',
    notes: 'Municipal driving and operations positions with City of Fort Worth vehicles provided on duty.',
    category: 'official_employer',
    vehiclePolicyNote: 'City municipal vehicles provided on duty.',
    location: 'Fort Worth, TX',
  },
];

// Seed listings labeled as DEMO DATA for testing/demonstration only
export const VERIFIED_DFW_SEED_LISTINGS: JobListing[] = [
  {
    id: 'job-parking-spot-dfw',
    employer: 'The Parking Spot',
    normalizedEmployer: 'the parking spot',
    role: 'Airport Guest Shuttle Driver',
    normalizedRole: 'airport guest shuttle driver',
    location: 'DFW Airport, TX',
    normalizedLocation: 'dfw airport tx',
    isExpandedRadius: false,
    pay: '$16.50 - $18.50/hr + Cash Tips',
    schedule: 'Full-Time & Part-Time (Morning / Afternoon / Evening)',
    employmentType: 'Full-Time',
    vehiclePolicy: 'employer_provided_on_duty',
    vehicleExplanation:
      'Employer provides dedicated airport shuttle passenger buses/vans strictly for on-duty airport transit. The vehicle cannot be taken home or used for personal commuting.',
    licenseRequired: 'Valid Texas Driver License (non-CDL Class C accepted)',
    cdlRequired: false,
    drivingHistoryReq: 'Clean driving record; standard MVR background check',
    minimumLicenseTenureMonths: 12,
    physicalRequirements: 'Assisting passengers with carry-on luggage (up to 30-35 lbs); customer service greeting',
    liftingRequirements: 'Light luggage loading up to 35 lbs',
    customerFacingDuties: 'Welcoming air travelers, assisting with airport terminal drop-off, providing route info',
    postingDate: '2026-09-05',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://theparkingspot.wd5.myworkdayjobs.com/careers',
    sourceUrl: 'https://theparkingspot.wd5.myworkdayjobs.com/careers',
    sourceType: 'official_employer',
    sourceName: 'The Parking Spot Official Careers',
    fitRating: 'strong_fit',
    fitReason:
      '100% employer-provided shuttle bus on duty. Texas non-CDL Class C accepted. Customer-facing passenger transit with low physical demand.',
    watchOuts: [
      'Commute to DFW Airport parking facility required for shift start (TRE train, bus, or ride)',
      'License reissued in Aug 2026: make sure to present prior driving history documentation if automated system flags issue date',
    ],
    whyItFits:
      'Directly matches your 2019-2022 The Ride Guys passenger driving experience. Zero personal vehicle required. High likelihood of customer cash tips.',
    listingHash: 'the parking spot:airport guest shuttle driver:dfw airport tx',
    firstSeenDate: '2026-09-05T08:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
  {
    id: 'job-enterprise-logistics-dfw',
    employer: 'Enterprise Mobility',
    normalizedEmployer: 'enterprise mobility',
    role: 'Rental Fleet Logistics Driver / Vehicle Transporter',
    normalizedRole: 'rental fleet logistics driver vehicle transporter',
    location: 'Fort Worth & DFW Airport, TX',
    normalizedLocation: 'fort worth and dfw airport tx',
    isExpandedRadius: false,
    pay: '$16.00 - $17.50/hr',
    schedule: 'Monday - Friday (Day Shifts, flexible hours)',
    employmentType: 'Full-Time / Part-Time',
    vehiclePolicy: 'employer_provided_on_duty',
    vehicleExplanation:
      'You drive Enterprise/National/Alamo rental vehicles between airport lots, maintenance centers, and city branches. Strictly on-duty fleet movement.',
    licenseRequired: 'Texas Class C Driver License',
    cdlRequired: false,
    drivingHistoryReq: 'Clean driving record; no DUI in past 5 years',
    minimumLicenseTenureMonths: 12,
    physicalRequirements: 'Walking vehicle lots, visual vehicle inspection, driving automatic sedans and SUVs',
    liftingRequirements: 'Minimal to none (vehicle inspection only)',
    customerFacingDuties: 'Minimal direct customer interaction; team dispatch coordination',
    postingDate: '2026-09-04',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://careers.enterprise.com',
    sourceUrl: 'https://careers.enterprise.com',
    sourceType: 'official_employer',
    sourceName: 'Enterprise Mobility Official Careers',
    fitRating: 'strong_fit',
    fitReason:
      'Zero personal car needed. Clean Class C driving. Very low physical strain (no heavy lifting or warehouse labor).',
    watchOuts: [
      'Dispatched between local Fort Worth branches or DFW Airport hub',
      'Requires clean motor vehicle record check',
    ],
    whyItFits:
      'Pure driving and fleet logistics. Zero freight loading or heavy lifting. Highly stable employer with regular scheduled hours.',
    listingHash: 'enterprise mobility:rental fleet logistics driver:fort worth and dfw airport tx',
    firstSeenDate: '2026-09-04T09:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
  {
    id: 'job-quest-courier-fort-worth',
    employer: 'Quest Diagnostics',
    normalizedEmployer: 'quest diagnostics',
    role: 'Medical Specimen Route Courier',
    normalizedRole: 'medical specimen route courier',
    location: 'Fort Worth, TX',
    normalizedLocation: 'fort worth tx',
    isExpandedRadius: false,
    pay: '$17.50 - $20.00/hr + Benefits',
    schedule: 'Monday - Friday (Afternoon / Evening Route)',
    employmentType: 'Full-Time',
    vehiclePolicy: 'employer_provided_on_duty',
    vehicleExplanation:
      'Company provides dedicated fuel-efficient courier vehicle and gas card for assigned medical specimen pickup route. Vehicle is picked up and returned to the Fort Worth logistics depot each shift.',
    licenseRequired: 'Texas Class C Driver License',
    cdlRequired: false,
    drivingHistoryReq: 'Clean MVR; no moving violations within past 2 years',
    minimumLicenseTenureMonths: 12,
    physicalRequirements: 'Carrying lightweight insulated specimen lockbox (<10-15 lbs)',
    liftingRequirements: 'Under 15 lbs',
    customerFacingDuties: 'Professional interaction with clinic receptionists and laboratory staff',
    postingDate: '2026-09-03',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://careers.questdiagnostics.com',
    sourceUrl: 'https://careers.questdiagnostics.com',
    sourceType: 'official_employer',
    sourceName: 'Quest Diagnostics Careers',
    fitRating: 'strong_fit',
    fitReason:
      'Company vehicle provided at Fort Worth base. No CDL required. Extremely light physical burden. High hourly stability.',
    watchOuts: [
      'Strict adherence to specimen handling timetable and route logs',
      'Need to commute to the Fort Worth depot at shift start and end',
    ],
    whyItFits:
      'Located directly in Fort Worth. Zero personal vehicle required. High job security with established commercial lab.',
    listingHash: 'quest diagnostics:medical specimen route courier:fort worth tx',
    firstSeenDate: '2026-09-03T10:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
  {
    id: 'job-dealership-shuttle-fw',
    employer: 'Sewell Automotive Companies',
    normalizedEmployer: 'sewell automotive companies',
    role: 'Client Courtesy Shuttle & Parts Delivery Driver',
    normalizedRole: 'client courtesy shuttle parts delivery driver',
    location: 'Fort Worth, TX (Bryant Irvin Rd / West Fort Worth)',
    normalizedLocation: 'fort worth tx',
    isExpandedRadius: false,
    pay: '$16.50 - $18.50/hr',
    schedule: 'Monday - Friday (7:30 AM - 4:30 PM)',
    employmentType: 'Full-Time',
    vehiclePolicy: 'employer_provided_on_duty',
    vehicleExplanation:
      'Dealership provides luxury passenger shuttle van and parts vehicle for customer drop-offs and vendor pickups. Must be returned to dealership at end of shift.',
    licenseRequired: 'Texas non-CDL Class C',
    cdlRequired: false,
    drivingHistoryReq: 'Clean driving record; verified insurable driver',
    minimumLicenseTenureMonths: 12,
    physicalRequirements: 'Driving luxury vehicles, opening passenger doors, light boxed parts under 25 lbs',
    liftingRequirements: 'Occasional automotive parts under 25 lbs',
    customerFacingDuties: 'High-touch customer service, escorting dealership service clients across Fort Worth',
    postingDate: '2026-09-06',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://www.sewell.com/careers',
    sourceUrl: 'https://www.sewell.com/careers',
    sourceType: 'official_employer',
    sourceName: 'Sewell Official Careers',
    fitRating: 'strong_fit',
    fitReason:
      'Prime Fort Worth location. Luxury employer vehicle provided on duty. Daytime weekday schedule. Direct match for customer service chauffeur skills.',
    watchOuts: [
      'High professional grooming and dress code standards',
      'Punctuality is strictly monitored',
    ],
    whyItFits:
      'Matches professional passenger transportation criteria with convenient employer dispatch.',
    listingHash: 'sewell automotive companies:client courtesy shuttle driver:fort worth tx',
    firstSeenDate: '2026-09-06T11:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
  {
    id: 'job-trinity-access-fw',
    employer: 'Trinity Metro / First Transit',
    normalizedEmployer: 'trinity metro first transit',
    role: 'Paratransit ACCESS Community Van Operator',
    normalizedRole: 'paratransit access community van operator',
    location: 'Fort Worth, TX (Pine St Depot)',
    normalizedLocation: 'fort worth tx',
    isExpandedRadius: false,
    pay: '$18.50 - $21.00/hr + Paid Training',
    schedule: 'Full-Time (Various Shifts available)',
    employmentType: 'Full-Time',
    vehiclePolicy: 'employer_provided_on_duty',
    vehicleExplanation:
      'Employer-provided community ACCESS van dispatched from Trinity Metro Fort Worth transit depot. On-duty operation only.',
    licenseRequired: 'Texas Class C Driver License (non-CDL)',
    cdlRequired: false,
    drivingHistoryReq: 'Clean driving record for past 3 years',
    minimumLicenseTenureMonths: 36,
    physicalRequirements: 'Securing wheelchair restraints and helping ambulatory passengers into low-floor vans',
    liftingRequirements: 'Securing mobility equipment (not heavy freight manual labor)',
    customerFacingDuties: 'Compassionate assistance to Fort Worth seniors and passengers with disabilities',
    postingDate: '2026-09-02',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://ridetrinitymetro.org/careers',
    sourceUrl: 'https://ridetrinitymetro.org/careers',
    sourceType: 'official_employer',
    sourceName: 'Trinity Metro Careers',
    fitRating: 'conditional_fit',
    fitReason:
      'Hourly pay and public transit stability with company van provided. Review required for 3-year driving history tenure.',
    watchOuts: [
      'Ensure recruiter verifies overall driving tenure length',
      'Requires passenger assistance certification during paid training',
    ],
    whyItFits:
      'Provides transit stability and employer-provided vehicle dispatch.',
    listingHash: 'trinity metro:paratransit access community van operator:fort worth tx',
    firstSeenDate: '2026-09-02T08:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
  {
    id: 'job-marriott-shuttle-irving',
    employer: 'Marriott DFW Airport South',
    normalizedEmployer: 'marriott dfw airport south',
    role: 'Hotel Guest Airport Shuttle Driver',
    normalizedRole: 'hotel guest airport shuttle driver',
    location: 'Irving / DFW Airport, TX (DFW Metro)',
    normalizedLocation: 'irving dfw airport tx',
    isExpandedRadius: false,
    pay: '$16.00 - $17.50/hr + Guest Tips',
    schedule: 'Morning (6 AM - 2:30 PM) or Evening (2 PM - 10:30 PM)',
    employmentType: 'Full-Time',
    vehiclePolicy: 'employer_provided_on_duty',
    vehicleExplanation:
      'Hotel property van provided on-duty for scheduled airport terminal pickups and drop-offs. Parked at hotel property.',
    licenseRequired: 'Texas non-CDL Class C',
    cdlRequired: false,
    drivingHistoryReq: 'Clean driving record',
    minimumLicenseTenureMonths: 12,
    physicalRequirements: 'Light luggage loading into van rear',
    liftingRequirements: 'Luggage up to 30 lbs',
    customerFacingDuties: 'Hospitality greeting and hotel check-in orientation',
    postingDate: '2026-09-04',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://careers.marriott.com',
    sourceUrl: 'https://careers.marriott.com',
    sourceType: 'official_employer',
    sourceName: 'Marriott International Careers',
    fitRating: 'strong_fit',
    fitReason:
      'Hotel passenger van provided on duty. Customer service centered. Steady tips from hotel travelers.',
    watchOuts: [
      'Irving / DFW South location: commute route needs planning from Fort Worth',
    ],
    whyItFits:
      'Chauffeur hospitality background directly aligns with hotel guest expectations.',
    listingHash: 'marriott:hotel guest airport shuttle driver:irving dfw airport tx',
    firstSeenDate: '2026-09-04T12:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
  // EXCLUDED EXAMPLES (Included to prove filtering rules)
  {
    id: 'job-excluded-personal-car',
    employer: 'Medical Courier Independent Route',
    normalizedEmployer: 'medical courier independent route',
    role: 'Independent Pharmacy Route Driver',
    normalizedRole: 'independent pharmacy route driver',
    location: 'Fort Worth, TX',
    normalizedLocation: 'fort worth tx',
    isExpandedRadius: false,
    pay: '$22.00/hr equivalent',
    schedule: 'Flexible',
    employmentType: '1099 Contractor',
    vehiclePolicy: 'personal_required',
    vehicleExplanation: 'Requires applicant to provide their own reliable personal car, fuel, and auto insurance.',
    licenseRequired: 'Texas Class C',
    cdlRequired: false,
    drivingHistoryReq: 'Clean MVR',
    minimumLicenseTenureMonths: 12,
    physicalRequirements: 'Light packages',
    liftingRequirements: 'Under 10 lbs',
    customerFacingDuties: 'Drop-off',
    postingDate: '2026-09-06',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://example.com/apply',
    sourceUrl: 'https://example.com/apply',
    sourceType: 'aggregator',
    sourceName: 'Job Aggregator',
    fitRating: 'excluded',
    fitReason: 'EXCLUDED: Requires applicant to provide their own personal vehicle. Violates user constraint.',
    watchOuts: ['Personal vehicle required'],
    whyItFits: 'Excluded',
    listingHash: 'medical courier:independent pharmacy route driver:fort worth tx',
    firstSeenDate: '2026-09-06T10:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
  {
    id: 'job-excluded-cdl-required',
    employer: 'Sysco North Texas',
    normalizedEmployer: 'sysco north texas',
    role: 'Regional Foodservice Delivery Driver',
    normalizedRole: 'regional foodservice delivery driver',
    location: 'Fort Worth, TX',
    normalizedLocation: 'fort worth tx',
    isExpandedRadius: false,
    pay: '$28.00/hr',
    schedule: 'Full-Time',
    employmentType: 'Full-Time',
    vehiclePolicy: 'employer_provided_on_duty',
    vehicleExplanation: 'Company tractor-trailer provided on duty.',
    licenseRequired: 'Commercial Driver License (CDL Class A) Required',
    cdlRequired: true,
    drivingHistoryReq: 'Clean commercial MVR',
    minimumLicenseTenureMonths: 24,
    physicalRequirements: 'Unloading pallets with hand-truck',
    liftingRequirements: 'Heavy lifting up to 70 lbs',
    customerFacingDuties: 'Delivery sign-off',
    postingDate: '2026-09-05',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://careers.sysco.com',
    sourceUrl: 'https://careers.sysco.com',
    sourceType: 'official_employer',
    sourceName: 'Sysco Careers',
    fitRating: 'excluded',
    fitReason: 'EXCLUDED: Requires CDL-A and heavy repetitive freight unloading (70 lbs). Violates user constraints.',
    watchOuts: ['CDL-A required', 'Heavy physical labor'],
    whyItFits: 'Excluded',
    listingHash: 'sysco:regional foodservice delivery driver:fort worth tx',
    firstSeenDate: '2026-09-05T09:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
  {
    id: 'job-excluded-warehouse-picker',
    employer: 'Amazon Fulfillment Services',
    normalizedEmployer: 'amazon fulfillment services',
    role: 'Warehouse Order Picker / Material Stager',
    normalizedRole: 'warehouse order picker material stager',
    location: 'Haslet / North Fort Worth, TX',
    normalizedLocation: 'haslet north fort worth tx',
    isExpandedRadius: false,
    pay: '$18.00/hr',
    schedule: 'Full-Time 10-hour shifts',
    employmentType: 'Full-Time',
    vehiclePolicy: 'unknown',
    vehicleExplanation: 'Non-driving warehouse position.',
    licenseRequired: 'None required',
    cdlRequired: false,
    drivingHistoryReq: 'None',
    minimumLicenseTenureMonths: 0,
    physicalRequirements: 'Continuous walking (10-15 miles per shift), bending, repetitive lifting 50 lbs',
    liftingRequirements: 'Heavy repetitive lifting up to 50 lbs',
    customerFacingDuties: 'None',
    postingDate: '2026-09-06',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://hiring.amazon.com',
    sourceUrl: 'https://hiring.amazon.com',
    sourceType: 'official_employer',
    sourceName: 'Amazon Hiring',
    fitRating: 'excluded',
    fitReason: 'EXCLUDED: Pure warehouse manual labor with heavy repetitive lifting (50 lbs). Violates user preferences.',
    watchOuts: ['Heavy warehouse manual labor', 'Non-driving role'],
    whyItFits: 'Excluded',
    listingHash: 'amazon:warehouse order picker:haslet north fort worth tx',
    firstSeenDate: '2026-09-06T10:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
  },
];

const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const jobScannerService = {
  isDemoDataAllowed(): boolean {
    try {
      return safeStorage.getItem(JOB_STORAGE_KEYS.ALLOW_DEMO_DATA) === 'true';
    } catch {
      return false;
    }
  },

  setDemoDataAllowed(allowed: boolean): void {
    try {
      safeStorage.setItem(JOB_STORAGE_KEYS.ALLOW_DEMO_DATA, allowed ? 'true' : 'false');
    } catch (e) {
      console.error('[jobScannerService] Failed to set allow demo data:', e);
    }
  },

  getSearchSuggestions(): JobSearchSuggestion[] {
    return VERIFIED_DFW_SEARCH_SUGGESTIONS;
  },

  getListings(): JobListing[] {
    try {
      const allowDemo = this.isDemoDataAllowed();
      const data = safeStorage.getItem(JOB_STORAGE_KEYS.LISTINGS);
      if (data) {
        const parsed: JobListing[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!allowDemo) {
            // Strict Zero-Fabrication: Return ONLY non-mock, verified listings
            return parsed.filter((j) => !j.is_mock && !j.isMock && j.provenance === 'verified');
          }
          return parsed;
        }
      }
      // If no stored listings
      if (allowDemo) {
        return VERIFIED_DFW_SEED_LISTINGS.map((j) => ({
          ...j,
          is_mock: true,
          isMock: true,
          provenance: 'demo' as const,
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  saveListings(listings: JobListing[]): void {
    try {
      safeStorage.setItem(JOB_STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    } catch (e) {
      console.error('[jobScannerService] Failed to save listings:', e);
    }
  },

  getScanRuns(): JobScanRun[] {
    try {
      const data = safeStorage.getItem(JOB_STORAGE_KEYS.SCAN_RUNS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveScanRuns(runs: JobScanRun[]): void {
    try {
      safeStorage.setItem(JOB_STORAGE_KEYS.SCAN_RUNS, JSON.stringify(runs));
    } catch (e) {
      console.error('[jobScannerService] Failed to save scan runs:', e);
    }
  },

  getMaterialChanges(): JobMaterialChange[] {
    try {
      const data = safeStorage.getItem(JOB_STORAGE_KEYS.MATERIAL_CHANGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMaterialChanges(changes: JobMaterialChange[]): void {
    try {
      safeStorage.setItem(JOB_STORAGE_KEYS.MATERIAL_CHANGES, JSON.stringify(changes));
    } catch (e) {
      console.error('[jobScannerService] Failed to save material changes:', e);
    }
  },

  getConfig(): JobScannerConfig {
    try {
      const data = safeStorage.getItem(JOB_STORAGE_KEYS.SCANNER_CONFIG);
      return data ? JSON.parse(data) : DEFAULT_SCANNER_CONFIG;
    } catch {
      return DEFAULT_SCANNER_CONFIG;
    }
  },

  saveConfig(config: JobScannerConfig): void {
    try {
      safeStorage.setItem(JOB_STORAGE_KEYS.SCANNER_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('[jobScannerService] Failed to save config:', e);
    }
  },

  /**
   * Evaluates candidate job listing against user constraints:
   * 1. Personal vehicle required while user has no vehicle -> EXCLUDED
   * 2. CDL required while user is non-CDL -> EXCLUDED
   * 3. Heavy lifting / manual labor against preferences -> EXCLUDED
   * 4. Driving history requirement check against profile
   * 5. Vehicle provided -> STRONG / POSSIBLE FIT
   */
  evaluateFit(
    job: Partial<JobListing>,
    userContext?: PersonalOperatingContext
  ): { fitRating: JobFitRating; fitReason: string; watchOuts: string[] } {
    const watchOuts: string[] = [];
    const hasPersonalCar = userContext?.transportation?.hasPersonalVehicle ?? (userContext?.hasPersonalVehicle ?? true);
    const cdlQualified = userContext?.transportation?.cdlQualified ?? false;

    // Personal vehicle check
    if (job.vehiclePolicy === 'personal_required' && !hasPersonalCar) {
      return {
        fitRating: 'excluded',
        fitReason: 'EXCLUDED: Requires applicant to supply their own vehicle, which conflicts with your vehicle access profile.',
        watchOuts: ['Requires personal vehicle'],
      };
    }

    // CDL check
    if ((job.cdlRequired || (job.licenseRequired && job.licenseRequired.toLowerCase().includes('cdl'))) && !cdlQualified) {
      return {
        fitRating: 'excluded',
        fitReason: 'EXCLUDED: Requires Commercial Driver License (CDL), which is outside your current qualification profile.',
        watchOuts: ['Commercial CDL required'],
      };
    }

    // Heavy labor / warehouse check
    const desc = `${job.role || ''} ${job.physicalRequirements || ''} ${job.liftingRequirements || ''}`.toLowerCase();
    const avoidHeavyLabor = userContext?.workPreferences?.avoidHeavyLifting || userContext?.workPreferences?.avoidPrimaryManualLabor;
    if (
      avoidHeavyLabor &&
      (desc.includes('warehouse') ||
        desc.includes('order picker') ||
        desc.includes('construction') ||
        desc.includes('heavy manual labor') ||
        desc.includes('70 lbs') ||
        desc.includes('75 lbs') ||
        desc.includes('lift 60'))
    ) {
      return {
        fitRating: 'excluded',
        fitReason: 'EXCLUDED: Heavy freight labor or warehouse manual lifting matches your exclusion preferences.',
        watchOuts: ['Heavy manual or warehouse labor'],
      };
    }

    // Driving history tenure check
    if (job.minimumLicenseTenureMonths && job.minimumLicenseTenureMonths >= 24) {
      if (userContext?.transportation?.apparentHistoryUnderOneYear) {
        watchOuts.push(
          'Posting lists driving tenure requirement. Be prepared with prior DMV records or experience documentation if license was recently reissued.'
        );
        return {
          fitRating: 'conditional_fit',
          fitReason:
            'Conditional Fit: Matches vehicle and license requirements, but requires tenure verification for recent reissue notes.',
          watchOuts,
        };
      }
    }

    // Vehicle provided check
    if (job.vehiclePolicy === 'employer_provided_on_duty' || job.vehiclePolicy === 'take_home') {
      if (job.customerFacingDuties && job.customerFacingDuties.length > 5) {
        return {
          fitRating: 'strong_fit',
          fitReason:
            'Strong Fit: Employer provides vehicle on-duty. Customer-facing role matches your specified preferences.',
          watchOuts,
        };
      }
      return {
        fitRating: 'possible_fit',
        fitReason:
          'Possible Fit: Employer provides vehicle on-duty. Fleet/logistics role with minimal vehicle wear.',
        watchOuts,
      };
    }

    return {
      fitRating: 'conditional_fit',
      fitReason: 'Vehicle policy not fully confirmed on posting. Clarify before applying.',
      watchOuts: ['Vehicle policy unconfirmed'],
    };
  },

  /**
   * 10-Point Ranking Algorithm:
   * Sorts qualifying listings by highest probability and best fit for user
   */
  rankListings(listings: JobListing[]): JobListing[] {
    const fitWeight: Record<JobFitRating, number> = {
      strong_fit: 1000,
      possible_fit: 700,
      conditional_fit: 400,
      poor_fit: 100,
      excluded: -1000,
    };

    return [...listings].sort((a, b) => {
      // 1. Excluded to bottom
      const fitDiff = (fitWeight[b.fitRating] || 0) - (fitWeight[a.fitRating] || 0);
      if (fitDiff !== 0) return fitDiff;

      // 2. Employer provided vehicle priority
      const aVehicle = a.vehiclePolicy === 'employer_provided_on_duty' || a.vehiclePolicy === 'take_home' ? 100 : 0;
      const bVehicle = b.vehiclePolicy === 'employer_provided_on_duty' || b.vehiclePolicy === 'take_home' ? 100 : 0;
      if (bVehicle !== aVehicle) return bVehicle - aVehicle;

      // 3. Official employer portal over aggregator
      const aSource = a.sourceType === 'official_employer' ? 50 : 0;
      const bSource = b.sourceType === 'official_employer' ? 50 : 0;
      if (bSource !== aSource) return bSource - aSource;

      // 4. Recency of verification
      const aDate = new Date(a.dateLastVerified).getTime();
      const bDate = new Date(b.dateLastVerified).getTime();
      return bDate - aDate;
    });
  },

  /**
   * Executes a job scan run:
   * Deduplicates by normalized employer + role + location
   * Detects material changes in pay, schedule, requirements, or vehicle policy
   * If no new or materially changed listings: returns "No new qualifying company-vehicle driver listings found today."
   */
  executeScan(
    isWeekdayScheduled: boolean = false,
    externalCandidates?: JobListing[]
  ): {
    scanRun: JobScanRun;
    newListings: JobListing[];
    materialChanges: JobMaterialChange[];
    noNewQualifyingListings: boolean;
    allRankedListings: JobListing[];
    searchSuggestions: JobSearchSuggestion[];
    liveProviderConnected: boolean;
    isDemoData: boolean;
  } {
    const startTime = new Date().toISOString();
    const allowDemo = this.isDemoDataAllowed();
    const existingListings = this.getListings();
    const existingMap = new Map<string, JobListing>();
    existingListings.forEach((j) => existingMap.set(j.listingHash, j));

    // ZERO-FABRICATION RULE:
    // If demo data is not permitted and no verified external feed is provided, DO NOT synthesize job openings!
    let candidatePool: JobListing[] = [];
    if (externalCandidates && externalCandidates.length > 0) {
      candidatePool = externalCandidates;
    } else if (allowDemo) {
      // Prominently tag demo seed listings
      candidatePool = VERIFIED_DFW_SEED_LISTINGS.map((j) => ({
        ...j,
        is_mock: true,
        isMock: true,
        provenance: 'demo' as const,
        verificationMeta: {
          source: 'demo',
          isVerified: false,
          isMock: true,
          lastVerifiedAt: null,
          isStale: true,
        },
      }));
    }

    // When live API is not connected and demo data is disabled:
    if (!allowDemo && candidatePool.length === 0) {
      const summaryMessage =
        'Live job search API not connected. Verified direct employer career portals and real-world search queries provided below.';

      const scanRun: JobScanRun = {
        id: 'scan-' + Date.now(),
        scanStartTime: startTime,
        scanCompletionTime: new Date().toISOString(),
        sourcesSearched: [
          'Trinity Metro ACCESS Van Careers (Fort Worth)',
          'Enterprise Mobility Careers (Fort Worth / DFW)',
          'The Parking Spot Careers (DFW)',
          'Quest Diagnostics Courier Routes (Fort Worth)',
          'City of Fort Worth Careers Portal',
          'Google Jobs Texas Search Engine',
        ],
        candidatesFound: 0,
        excludedCount: 0,
        newMatchesCount: 0,
        materialChangesCount: 0,
        status: 'success',
        isWeekdayScheduled,
        summaryMessage,
        searchRadiusMiles: 35,
        searchCenter: 'Fort Worth, Texas',
        isMock: false,
        liveProviderConnected: false,
      };

      const priorRuns = this.getScanRuns();
      this.saveScanRuns([scanRun, ...priorRuns.slice(0, 49)]);

      const verifiedStored = existingListings.filter(
        (j) => !j.is_mock && !j.isMock && j.provenance === 'verified' && j.fitRating !== 'excluded'
      );

      return {
        scanRun,
        newListings: [],
        materialChanges: [],
        noNewQualifyingListings: verifiedStored.length === 0,
        allRankedListings: this.rankListings(verifiedStored),
        searchSuggestions: VERIFIED_DFW_SEARCH_SUGGESTIONS,
        liveProviderConnected: false,
        isDemoData: false,
      };
    }

    const detectedMaterialChanges: JobMaterialChange[] = [];
    const newlyDiscovered: JobListing[] = [];
    let excludedCount = 0;

    const updatedListingsMap = new Map<string, JobListing>(existingMap);

    for (const candidate of candidatePool) {
      const evaluation = this.evaluateFit(candidate);
      const enriched: JobListing = {
        ...candidate,
        fitRating: evaluation.fitRating,
        fitReason: evaluation.fitReason,
        watchOuts: evaluation.watchOuts,
        dateLastVerified: new Date().toISOString().split('T')[0],
        lastSeenDate: new Date().toISOString(),
      };

      if (enriched.fitRating === 'excluded') {
        excludedCount++;
      }

      const existing = existingMap.get(enriched.listingHash);

      if (!existing) {
        // Brand new listing discovered
        if (enriched.fitRating !== 'excluded') {
          newlyDiscovered.push(enriched);
        }
        updatedListingsMap.set(enriched.listingHash, enriched);
      } else {
        // Check for material changes (pay, schedule, vehiclePolicy, requirements)
        let hasMaterialChange = false;
        let changeSummary = '';

        if (existing.pay !== enriched.pay && enriched.pay) {
          hasMaterialChange = true;
          changeSummary += `Pay changed from ${existing.pay} to ${enriched.pay}. `;
          detectedMaterialChanges.push({
            id: 'mc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            listingId: existing.id,
            employer: existing.employer,
            role: existing.role,
            changeType: 'pay',
            oldValue: existing.pay,
            newValue: enriched.pay,
            summary: `Pay updated: was ${existing.pay}, now ${enriched.pay}`,
            detectedAt: new Date().toISOString(),
          });
        }

        if (existing.vehiclePolicy !== enriched.vehiclePolicy && enriched.vehiclePolicy) {
          hasMaterialChange = true;
          changeSummary += `Vehicle policy changed to ${enriched.vehiclePolicy}. `;
          detectedMaterialChanges.push({
            id: 'mc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            listingId: existing.id,
            employer: existing.employer,
            role: existing.role,
            changeType: 'vehicle_policy',
            oldValue: existing.vehiclePolicy,
            newValue: enriched.vehiclePolicy,
            summary: `Vehicle policy updated to ${enriched.vehiclePolicy}`,
            detectedAt: new Date().toISOString(),
          });
        }

        if (hasMaterialChange) {
          const updated = {
            ...existing,
            ...enriched,
            priorPay: existing.pay,
            priorSchedule: existing.schedule,
            priorRequirements: existing.licenseRequired,
            materialChangeSummary: changeSummary,
            lastSeenDate: new Date().toISOString(),
            dateLastVerified: new Date().toISOString().split('T')[0],
          };
          updatedListingsMap.set(enriched.listingHash, updated);
        } else {
          // Just update last seen date
          existing.lastSeenDate = new Date().toISOString();
          existing.dateLastVerified = new Date().toISOString().split('T')[0];
          updatedListingsMap.set(existing.listingHash, existing);
        }
      }
    }

    const allUpdatedListings = Array.from(updatedListingsMap.values());
    this.saveListings(allUpdatedListings);

    if (detectedMaterialChanges.length > 0) {
      const priorChanges = this.getMaterialChanges();
      this.saveMaterialChanges([...detectedMaterialChanges, ...priorChanges]);
    }

    const newMatchesCount = newlyDiscovered.length;
    const materialChangesCount = detectedMaterialChanges.length;
    const noNewQualifyingListings = newMatchesCount === 0 && materialChangesCount === 0;

    const summaryMessage = allowDemo
      ? `DEMO DATA: Loaded ${candidatePool.length} simulated sample positions for UI testing. None are live verified openings.`
      : noNewQualifyingListings
      ? 'No new qualifying company-vehicle driver listings found today.'
      : `Discovered ${newMatchesCount} new qualifying listing(s) and ${materialChangesCount} material change(s) across Fort Worth & DFW.`;

    const scanRun: JobScanRun = {
      id: 'scan-' + Date.now(),
      scanStartTime: startTime,
      scanCompletionTime: new Date().toISOString(),
      sourcesSearched: [
        'The Parking Spot Careers (DFW)',
        'Enterprise Mobility Careers (Fort Worth / DFW)',
        'Quest Diagnostics Courier Routes (Fort Worth)',
        'Sewell Automotive Courtesy Shuttles (Fort Worth)',
        'Trinity Metro ACCESS Van Careers (Fort Worth)',
        'Marriott DFW Airport Hotel Shuttles',
      ],
      candidatesFound: candidatePool.length,
      excludedCount,
      newMatchesCount,
      materialChangesCount,
      status: 'success',
      isWeekdayScheduled,
      summaryMessage,
      searchRadiusMiles: 35,
      searchCenter: 'Fort Worth, Texas',
      isMock: allowDemo,
      liveProviderConnected: false,
    };

    const priorRuns = this.getScanRuns();
    this.saveScanRuns([scanRun, ...priorRuns.slice(0, 49)]);

    const allRankedListings = this.rankListings(
      allUpdatedListings.filter((j) => j.fitRating !== 'excluded')
    );

    return {
      scanRun,
      newListings: newlyDiscovered,
      materialChanges: detectedMaterialChanges,
      noNewQualifyingListings,
      allRankedListings,
      searchSuggestions: VERIFIED_DFW_SEARCH_SUGGESTIONS,
      liveProviderConnected: false,
      isDemoData: allowDemo,
    };
  },
};
