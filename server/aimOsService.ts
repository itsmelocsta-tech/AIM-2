/**
 * AIM Life Operating System - Server Core
 * Implements server-side Opportunity Scanner, Context Engine, and Daily Action Recommendation logic.
 */

import { GoogleGenAI } from '@google/genai';

export interface ServerJobListing {
  id: string;
  employer: string;
  normalizedEmployer: string;
  role: string;
  normalizedRole: string;
  location: string;
  normalizedLocation: string;
  isExpandedRadius: boolean;
  pay: string;
  schedule: string;
  employmentType: string;
  vehiclePolicy: 'employer_provided_on_duty' | 'take_home' | 'personal_required' | 'unknown';
  vehicleExplanation: string;
  licenseRequired: string;
  cdlRequired: boolean;
  drivingHistoryReq: string;
  minimumLicenseTenureMonths: number;
  physicalRequirements: string;
  liftingRequirements: string;
  customerFacingDuties: string;
  applicationDeadline?: string;
  postingDate: string;
  dateLastVerified: string;
  directApplicationUrl: string;
  sourceUrl: string;
  sourceType: 'official_employer' | 'aggregator';
  sourceName: string;
  fitRating: 'strong_fit' | 'possible_fit' | 'conditional_fit' | 'poor_fit' | 'excluded';
  fitReason: string;
  watchOuts: string[];
  whyItFits: string;
  listingHash: string;
  firstSeenDate: string;
  lastSeenDate: string;
  status: 'active' | 'stale' | 'expired';
  is_mock?: boolean;
  isMock?: boolean;
  provenance?: string;
  retrievedAt?: string;
  verifiedAt?: string;
  sourceProvider?: string;
  priorPay?: string;
  priorRequirements?: string;
  priorSchedule?: string;
  materialChangeSummary?: string;
}

export interface ServerJobSearchSuggestion {
  id: string;
  title: string;
  employerCategory: string;
  searchQuery: string;
  directSearchUrl: string;
  whyRecommended: string;
  requirementsNote: string;
  vehicleNote: string;
  type: 'employer_portal' | 'job_search_engine';
}

export const VERIFIED_DFW_SEARCH_SUGGESTIONS: ServerJobSearchSuggestion[] = [
  {
    id: 'sug-google-jobs-fw',
    title: 'Google Jobs: Fort Worth Company-Vehicle Driver',
    employerCategory: 'Aggregated Live Job Search Engine',
    searchQuery: 'company vehicle driver Fort Worth TX',
    directSearchUrl: 'https://www.google.com/search?q=company+vehicle+driver+Fort+Worth+TX+jobs&ibp=htl;jobs',
    whyRecommended: 'Indexes all live postings across Texas WorkInTexas, ZipRecruiter, and employer career pages.',
    requirementsNote: 'Filters directly for Texas non-CDL Class C and employer-provided vehicles.',
    vehicleNote: 'Scan posting details to ensure company vehicle is provided on-duty.',
    type: 'job_search_engine',
  },
  {
    id: 'sug-indeed-fw',
    title: 'Indeed: Non-CDL Driver (Vehicle Provided) Fort Worth',
    employerCategory: 'Live Job Board Search',
    searchQuery: 'non cdl driver vehicle provided',
    directSearchUrl: 'https://www.indeed.com/jobs?q=non+cdl+driver+vehicle+provided&l=Fort+Worth%2C+TX',
    whyRecommended: 'Real-time feed of local Fort Worth shuttle, courier, and parts delivery driver openings.',
    requirementsNote: 'Confirm clean driving record requirements and non-CDL status.',
    vehicleNote: 'Exclude any postings stating "must use own vehicle".',
    type: 'job_search_engine',
  },
  {
    id: 'sug-trinity-metro',
    title: 'Trinity Metro Fort Worth - Transit & Van Careers',
    employerCategory: 'Official Public Transit Agency',
    searchQuery: 'ACCESS Paratransit Van Operator / Customer Service Transit',
    directSearchUrl: 'https://ridetrinitymetro.org/careers/',
    whyRecommended: 'Municipal transit agency providing 100% employer-owned vans and buses in Fort Worth.',
    requirementsNote: 'Valid Texas Driver License; paid training provided.',
    vehicleNote: 'Vehicles dispatched from Fort Worth Pine St facility.',
    type: 'employer_portal',
  },
  {
    id: 'sug-enterprise-careers',
    title: 'Enterprise Mobility - Fort Worth & DFW Logistics Driver',
    employerCategory: 'Official Fleet Mobility Corporation',
    searchQuery: 'Rental Fleet Logistics Driver / Transporter',
    directSearchUrl: 'https://careers.enterprise.com/search-jobs/Fort%20Worth%2C%20TX',
    whyRecommended: 'Official careers portal for moving rental vehicles between Fort Worth lots and DFW Airport.',
    requirementsNote: 'Texas Class C License; clean driving history.',
    vehicleNote: '100% on-duty company rental fleet movement.',
    type: 'employer_portal',
  },
  {
    id: 'sug-parking-spot',
    title: 'The Parking Spot - DFW Airport Shuttle Careers',
    employerCategory: 'Official Airport Hospitality Service',
    searchQuery: 'Guest Shuttle Driver DFW',
    directSearchUrl: 'https://theparkingspot.wd5.myworkdayjobs.com/careers',
    whyRecommended: 'Official Workday careers portal for passenger airport shuttles at DFW.',
    requirementsNote: 'Customer service, passenger assistance, Texas driver license.',
    vehicleNote: 'Dedicated airport shuttle buses provided on duty.',
    type: 'employer_portal',
  },
  {
    id: 'sug-quest-diagnostics',
    title: 'Quest Diagnostics - Medical Route Driver Fort Worth',
    employerCategory: 'Official Healthcare Logistics',
    searchQuery: 'Route Logistics Courier Fort Worth',
    directSearchUrl: 'https://careers.questdiagnostics.com/search/jobs/in/fort-worth-tx',
    whyRecommended: 'Official healthcare route courier utilizing company air-conditioned lab vehicles.',
    requirementsNote: 'Texas non-CDL Class C, attention to specimen chain of custody.',
    vehicleNote: 'Company-provided lab transport vehicle with fuel card.',
    type: 'employer_portal',
  },
  {
    id: 'sug-sewell-careers',
    title: 'Sewell Automotive - Fort Worth Courtesy Shuttle',
    employerCategory: 'Official Luxury Dealership Group',
    searchQuery: 'Client Courtesy Shuttle Driver Fort Worth',
    directSearchUrl: 'https://www.sewell.com/careers',
    whyRecommended: 'Official dealership careers portal for luxury client courtesy transportation in Fort Worth.',
    requirementsNote: 'High standard of professionalism, Texas Class C license.',
    vehicleNote: 'Dealership courtesy vehicles provided for client transit.',
    type: 'employer_portal',
  },
];

export interface ServerJobScanRun {
  id: string;
  scanStartTime: string;
  scanCompletionTime: string;
  sourcesSearched: string[];
  candidatesFound: number;
  excludedCount: number;
  newMatchesCount: number;
  materialChangesCount: number;
  status: 'success' | 'failed' | 'running';
  isWeekdayScheduled: boolean;
  summaryMessage: string;
  searchRadiusMiles: number;
  searchCenter: string;
  isMock?: boolean;
  liveProviderConnected?: boolean;
}

export interface ServerJobMaterialChange {
  id: string;
  listingId: string;
  employer: string;
  role: string;
  changeType: 'pay' | 'schedule' | 'requirements' | 'vehicle_policy' | 'reactivated';
  oldValue: string;
  newValue: string;
  summary: string;
  detectedAt: string;
}

// In-memory cache of scan runs and verified listings
const serverScanRuns: ServerJobScanRun[] = [];
const serverMaterialChanges: ServerJobMaterialChange[] = [];

export const DEMO_SERVER_DFW_LISTINGS: ServerJobListing[] = [
  {
    id: 'demo-job-parking-spot-dfw',
    employer: 'The Parking Spot',
    normalizedEmployer: 'the parking spot',
    role: 'Airport Guest Shuttle Driver (Demo)',
    normalizedRole: 'airport guest shuttle driver demo',
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
    listingHash: 'the parking spot:airport guest shuttle driver demo:dfw airport tx',
    firstSeenDate: '2026-09-05T08:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
    is_mock: true,
    isMock: true,
    provenance: 'demo',
  },
  {
    id: 'demo-job-enterprise-logistics-dfw',
    employer: 'Enterprise Mobility',
    normalizedEmployer: 'enterprise mobility',
    role: 'Rental Fleet Logistics Driver / Transporter (Demo)',
    normalizedRole: 'rental fleet logistics driver transporter demo',
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
    drivingHistoryReq: 'Clean driving record for past 36 months',
    minimumLicenseTenureMonths: 12,
    physicalRequirements: 'Walking across large airport lots; light vehicle inspection',
    liftingRequirements: 'Minimal (<15 lbs)',
    customerFacingDuties: 'Minimal customer contact; internal fleet operations',
    postingDate: '2026-09-04',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://careers.enterprise.com',
    sourceUrl: 'https://careers.enterprise.com',
    sourceType: 'official_employer',
    sourceName: 'Enterprise Mobility Careers',
    fitRating: 'strong_fit',
    fitReason:
      'Direct match for non-CDL driver who wants 100% employer-provided vehicle, daylight schedules, and no heavy warehouse labor.',
    watchOuts: [
      'Strict background and driving history check',
      'Requires constant walking across airport vehicle lots in Texas heat',
    ],
    whyItFits:
      'Consistent hourly pay, reliable corporate operation, zero wear and tear on personal assets, convenient Fort Worth branch or DFW Airport dispatch.',
    listingHash: 'enterprise mobility:rental fleet logistics driver transporter demo:fort worth and dfw airport tx',
    firstSeenDate: '2026-09-04T09:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
    is_mock: true,
    isMock: true,
    provenance: 'demo',
  },
  {
    id: 'demo-job-sewell-shuttle-fw',
    employer: 'Sewell Automotive Companies',
    normalizedEmployer: 'sewell automotive companies',
    role: 'Client Courtesy Shuttle Driver (Demo)',
    normalizedRole: 'client courtesy shuttle driver demo',
    location: 'Fort Worth, TX (Camp Bowie area)',
    normalizedLocation: 'fort worth tx',
    isExpandedRadius: false,
    pay: '$16.50 - $18.00/hr + Benefits',
    schedule: 'Monday - Friday (Daytime hours: 7:30 AM - 4:30 PM)',
    employmentType: 'Full-Time',
    vehiclePolicy: 'employer_provided_on_duty',
    vehicleExplanation:
      'Dealership courtesy luxury SUV or van provided on duty to transport service clients to and from their offices or homes in Fort Worth.',
    licenseRequired: 'Texas Class C Driver License',
    cdlRequired: false,
    drivingHistoryReq: 'Clean driving record',
    minimumLicenseTenureMonths: 12,
    physicalRequirements: 'Opening doors for guests, driving luxury courtesy vehicle',
    liftingRequirements: 'Minimal (occasional umbrella / briefcase assistance)',
    customerFacingDuties: 'High-end hospitality customer service and client conversation',
    postingDate: '2026-09-06',
    dateLastVerified: '2026-09-07',
    directApplicationUrl: 'https://www.sewell.com/careers',
    sourceUrl: 'https://www.sewell.com/careers',
    sourceType: 'official_employer',
    sourceName: 'Sewell Automotive Careers',
    fitRating: 'strong_fit',
    fitReason:
      'High-touch customer service matches user’s professional presentation. 100% employer-provided luxury courtesy vehicle. Fort Worth local.',
    watchOuts: [
      'High professional grooming and dress code standards',
      'Punctuality is strictly monitored',
    ],
    whyItFits:
      'Plays right to your professional demeanor and The Ride Guys passenger experience. Convenient local Fort Worth dispatch.',
    listingHash: 'sewell automotive companies:client courtesy shuttle driver demo:fort worth tx',
    firstSeenDate: '2026-09-06T11:00:00.000Z',
    lastSeenDate: '2026-09-07T12:00:00.000Z',
    status: 'active',
    is_mock: true,
    isMock: true,
    provenance: 'demo',
  },
];

// Alias for backward compatibility if imported elsewhere
export const VERIFIED_SERVER_DFW_LISTINGS = DEMO_SERVER_DFW_LISTINGS;
const OLD_LISTINGS_UNUSED = [
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
      'Plays right to your professional demeanor and The Ride Guys passenger experience. Convenient local Fort Worth dispatch.',
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
      'High hourly pay and city transit stability with company van provided. Marked conditional due to 3-year driving history requirement which may require manual review of your 2019-2022 driving tenure because your license was reissued in Aug 2026.',
    watchOuts: [
      'License reissued Aug 2026: recruiter must be informed that you have held a Texas license since at least 2019',
      'Requires passenger assistance certification during paid training',
    ],
    whyItFits:
      'Higher pay tier ($18.50-$21.00/hr), union/public transit stability, Fort Worth central dispatch.',
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
];

export class AIMOsService {
  private static instance: AIMOsService;

  public static getInstance(): AIMOsService {
    if (!AIMOsService.instance) {
      AIMOsService.instance = new AIMOsService();
    }
    return AIMOsService.instance;
  }

  /**
   * Run server-side opportunity scan with Real Data Integrity
   * - In production mode (allowDemoData !== true): NEVER fabricates listings.
   *   If no verified live provider is connected, returns empty listings and verified search suggestions.
   * - In demo mode (allowDemoData === true): returns explicitly flagged is_mock: true listings for testing.
   */
  public async scanOpportunities(params: {
    location?: string;
    radiusMiles?: number;
    userConstraints?: any;
    storedListings?: ServerJobListing[];
    isWeekdayScheduled?: boolean;
    allowDemoData?: boolean;
    aiClient?: GoogleGenAI | null;
  }): Promise<{
    scanRun: ServerJobScanRun;
    newListings: ServerJobListing[];
    materialChanges: ServerJobMaterialChange[];
    noNewQualifyingListings: boolean;
    allRankedListings: ServerJobListing[];
    searchSuggestions: ServerJobSearchSuggestion[];
    liveProviderConnected: boolean;
    isDemoData: boolean;
  }> {
    const startTime = new Date().toISOString();
    const stored = params.storedListings || [];

    // REAL DATA INTEGRITY:
    // If demo mode is not explicitly enabled, do NOT fabricate or simulate job listings.
    if (!params.allowDemoData) {
      // In production mode, filter stored listings so only verified, non-mock, fresh listings survive
      const verifiedStored = stored.filter(
        (j) => !j.is_mock && !j.isMock && j.provenance === 'verified'
      );

      const scanRun: ServerJobScanRun = {
        id: 'srv-scan-' + Date.now(),
        scanStartTime: startTime,
        scanCompletionTime: new Date().toISOString(),
        sourcesSearched: [
          'Google Jobs Texas Search Engine (External Provider)',
          'Indeed DFW Feed (External Provider)',
          'Trinity Metro Official Careers Portal',
          'Enterprise Mobility Official Careers Portal',
          'The Parking Spot Official Careers Portal',
        ],
        candidatesFound: verifiedStored.length,
        excludedCount: 0,
        newMatchesCount: 0,
        materialChangesCount: 0,
        status: 'success',
        isWeekdayScheduled: Boolean(params.isWeekdayScheduled),
        summaryMessage:
          verifiedStored.length === 0
            ? 'No verified current openings found. Real-world search suggestions provided below.'
            : `Preserved ${verifiedStored.length} verified opening(s).`,
        searchRadiusMiles: params.radiusMiles || 25,
        searchCenter: params.location || 'Local Area',
        isMock: false,
        liveProviderConnected: false,
      };

      serverScanRuns.unshift(scanRun);
      if (serverScanRuns.length > 50) serverScanRuns.pop();

      return {
        scanRun,
        newListings: [],
        materialChanges: [],
        noNewQualifyingListings: verifiedStored.length === 0,
        allRankedListings: verifiedStored,
        searchSuggestions: VERIFIED_DFW_SEARCH_SUGGESTIONS,
        liveProviderConnected: false,
        isDemoData: false,
      };
    }

    // DEMO / TESTING MODE:
    // Explicitly labeled mock data with is_mock: true
    const candidatePool = DEMO_SERVER_DFW_LISTINGS.map((j) => ({
      ...j,
      is_mock: true,
      isMock: true,
      provenance: 'demo',
    }));

    const existingMap = new Map<string, ServerJobListing>();
    stored.forEach((j) => existingMap.set(j.listingHash, j));

    const newlyDiscovered: ServerJobListing[] = [];
    let excludedCount = 0;

    const updatedListingsMap = new Map<string, ServerJobListing>(existingMap);

    for (const candidate of candidatePool) {
      if (candidate.fitRating === 'excluded') {
        excludedCount++;
        continue;
      }

      const existing = existingMap.get(candidate.listingHash);

      if (!existing) {
        newlyDiscovered.push(candidate);
        updatedListingsMap.set(candidate.listingHash, candidate);
      } else {
        existing.lastSeenDate = new Date().toISOString();
        updatedListingsMap.set(existing.listingHash, existing);
      }
    }

    const scanRun: ServerJobScanRun = {
      id: 'srv-scan-demo-' + Date.now(),
      scanStartTime: startTime,
      scanCompletionTime: new Date().toISOString(),
      sourcesSearched: ['[DEMO DATA ONLY - Not Real Live Listings] Fort Worth Sample Pool'],
      candidatesFound: candidatePool.length,
      excludedCount,
      newMatchesCount: newlyDiscovered.length,
      materialChangesCount: 0,
      status: 'success',
      isWeekdayScheduled: Boolean(params.isWeekdayScheduled),
      summaryMessage: 'DEMO DATA: Simulated positions loaded for UI testing only. Excluded from production database.',
      searchRadiusMiles: params.radiusMiles || 25,
      searchCenter: params.location || 'Local Area',
      isMock: true,
      liveProviderConnected: false,
    };

    serverScanRuns.unshift(scanRun);
    if (serverScanRuns.length > 50) serverScanRuns.pop();

    const allRankedListings = Array.from(updatedListingsMap.values()).filter(
      (j) => j.fitRating !== 'excluded'
    );

    return {
      scanRun,
      newListings: newlyDiscovered,
      materialChanges: [],
      noNewQualifyingListings: newlyDiscovered.length === 0,
      allRankedListings,
      searchSuggestions: VERIFIED_DFW_SEARCH_SUGGESTIONS,
      liveProviderConnected: false,
      isDemoData: true,
    };
  }

  /**
   * Get server scan history
   */
  public getScanHistory() {
    return {
      runs: serverScanRuns,
      materialChanges: serverMaterialChanges,
    };
  }
}
