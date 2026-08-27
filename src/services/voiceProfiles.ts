import { VoiceProfile, USAccentStyle, GenderPresentation } from '../types';

export const PREVIEW_SENTENCE = "Good morning. Let's see where we are today and make today count.";

export interface AccentMetadata {
  key: USAccentStyle;
  title: string;
  description: string;
  cadence: string;
  iconName: string;
}

export const US_ACCENT_METADATA: AccentMetadata[] = [
  {
    key: 'general_american',
    title: 'General American',
    description: 'Neutral, clear mainstream American speech.',
    cadence: 'Crisp, balanced cadence with standard broadcast clarity.',
    iconName: 'Compass',
  },
  {
    key: 'texas',
    title: 'Texas',
    description: 'Natural Texas/Southwestern cadence with a noticeable but realistic Texas character.',
    cadence: 'Unhurried, grounded Southwestern cadence with rich acoustic warmth.',
    iconName: 'Sun',
  },
  {
    key: 'southern',
    title: 'Southern',
    description: 'Warm Southeastern U.S. cadence and pronunciation.',
    cadence: 'Melodious, warm Southeastern cadence with gentle rhythmic elongation.',
    iconName: 'Heart',
  },
  {
    key: 'new_york_city',
    title: 'New York City',
    description: 'Noticeable NYC rhythm, pronunciation, and conversational energy.',
    cadence: 'Energetic, fast-paced staccato rhythm with crisp metropolitan punch.',
    iconName: 'Zap',
  },
  {
    key: 'midwestern',
    title: 'Midwestern',
    description: 'Clear, relaxed Midwestern/Great Lakes American speech.',
    cadence: 'Steady, level-toned open vowel cadence with heartland authenticity.',
    iconName: 'Shield',
  },
  {
    key: 'california_west_coast',
    title: 'California / West Coast',
    description: 'Relaxed, contemporary West Coast American speech.',
    cadence: 'Laid-back, airy cadence with contemporary Pacific inflection.',
    iconName: 'Waves',
  },
  {
    key: 'boston_new_england',
    title: 'Boston / New England',
    description: 'Natural New England/Boston-influenced pronunciation and rhythm.',
    cadence: 'Clipped, direct, and quick-step New England cadence.',
    iconName: 'Anchor',
  },
  {
    key: 'philadelphia_mid_atlantic',
    title: 'Philadelphia / Mid-Atlantic',
    description: 'Mid-Atlantic urban American cadence with subtle Philadelphia influence.',
    cadence: 'Focused urban Mid-Atlantic cadence with distinct regional timing.',
    iconName: 'Building',
  },
  {
    key: 'appalachian',
    title: 'Appalachian',
    description: 'Warm Appalachian regional cadence without exaggeration.',
    cadence: 'Unhurried, resonant mountain cadence with melodic folk rhythm.',
    iconName: 'Mountain',
  },
  {
    key: 'louisiana_gulf_south',
    title: 'Louisiana / Gulf South',
    description: 'Gulf South/Louisiana-influenced American cadence.',
    cadence: 'Lyrical, rhythmic rolling cadence with warm bayou inflection.',
    iconName: 'Flame',
  },
];

export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  // ==========================================
  // 1. GENERAL AMERICAN
  // ==========================================
  'masculine_general_american': {
    id: 'masculine_general_american',
    displayName: 'General American (Masculine)',
    accentStyle: 'general_american',
    accentTitle: 'General American',
    accentDescription: 'Neutral, clear mainstream American speech.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Puck',
    geminiVoiceName: 'Puck',
    speakingRate: 1.00,
    pitch: 1.00,
    cadenceDescription: 'Standard broadcast clarity and balanced cadence.',
    preferredVoiceNames: [
      'Microsoft David',
      'Google US English',
      'Alex',
      'Fred',
      'Daniel',
      'en-US',
    ],
    styleInstructions: 'Clear, balanced, and direct mainstream American tone with relaxed warmth.',
  },
  'feminine_general_american': {
    id: 'feminine_general_american',
    displayName: 'General American (Feminine)',
    accentStyle: 'general_american',
    accentTitle: 'General American',
    accentDescription: 'Neutral, clear mainstream American speech.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Kore',
    geminiVoiceName: 'Kore',
    speakingRate: 1.00,
    pitch: 1.00,
    cadenceDescription: 'Clear, warm mainstream broadcast articulation.',
    preferredVoiceNames: [
      'Microsoft Jenny',
      'Microsoft Zira',
      'Google US English',
      'Samantha',
      'Ava',
      'en-US',
    ],
    styleInstructions: 'Clear, warm neutral mainstream articulation with natural expression.',
  },

  // ==========================================
  // 2. TEXAS
  // ==========================================
  'masculine_texas': {
    id: 'masculine_texas',
    displayName: 'Texas (Masculine)',
    accentStyle: 'texas',
    accentTitle: 'Texas',
    accentDescription: 'Natural Texas/Southwestern cadence with a noticeable but realistic Texas character.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Charon',
    geminiVoiceName: 'Charon',
    speakingRate: 0.88,
    pitch: 0.88,
    cadenceDescription: 'Deliberate Southwestern drawl cadence with deep chest resonance.',
    preferredVoiceNames: [
      'Microsoft Mark',
      'Fred',
      'Microsoft David',
      'Tom',
      'Google US English',
    ],
    styleInstructions: 'Unhurried, grounded Southwestern cadence with steady pacing and rich warmth.',
  },
  'feminine_texas': {
    id: 'feminine_texas',
    displayName: 'Texas (Feminine)',
    accentStyle: 'texas',
    accentTitle: 'Texas',
    accentDescription: 'Natural Texas/Southwestern cadence with a noticeable but realistic Texas character.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Kore',
    geminiVoiceName: 'Kore',
    speakingRate: 0.89,
    pitch: 0.94,
    cadenceDescription: 'Warm, relaxed Southwestern cadence with unhurried phrasing.',
    preferredVoiceNames: [
      'Samantha',
      'Microsoft Zira',
      'Victoria',
      'Microsoft Jenny',
      'Google US English',
    ],
    styleInstructions: 'Warm, relaxed, and deliberate Southwestern phrasing with gentle pacing.',
  },

  // ==========================================
  // 3. SOUTHERN
  // ==========================================
  'masculine_southern': {
    id: 'masculine_southern',
    displayName: 'Southern (Masculine)',
    accentStyle: 'southern',
    accentTitle: 'Southern',
    accentDescription: 'Warm Southeastern U.S. cadence and pronunciation.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Charon',
    geminiVoiceName: 'Charon',
    speakingRate: 0.85,
    pitch: 0.92,
    cadenceDescription: 'Melodious, warm Southeastern cadence with gentle elongation.',
    preferredVoiceNames: [
      'Google US English',
      'Daniel',
      'Microsoft David',
      'Oliver',
      'Alex',
    ],
    styleInstructions: 'Warm Southeastern cadence with gentle vocal contour and melodic flow.',
  },
  'feminine_southern': {
    id: 'feminine_southern',
    displayName: 'Southern (Feminine)',
    accentStyle: 'southern',
    accentTitle: 'Southern',
    accentDescription: 'Warm Southeastern U.S. cadence and pronunciation.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Zephyr',
    geminiVoiceName: 'Zephyr',
    speakingRate: 0.86,
    pitch: 1.06,
    cadenceDescription: 'Soft, melodic Southeastern lilt with warm hospitality tone.',
    preferredVoiceNames: [
      'Microsoft Jenny',
      'Allison',
      'Moira',
      'Samantha',
      'Google US English',
    ],
    styleInstructions: 'Gentle, melodic Southeastern vocal contour with expressive warmth.',
  },

  // ==========================================
  // 4. NEW YORK CITY
  // ==========================================
  'masculine_new_york_city': {
    id: 'masculine_new_york_city',
    displayName: 'New York City (Masculine)',
    accentStyle: 'new_york_city',
    accentTitle: 'New York City',
    accentDescription: 'Noticeable NYC rhythm, pronunciation, and conversational energy.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Puck',
    geminiVoiceName: 'Puck',
    speakingRate: 1.14,
    pitch: 1.08,
    cadenceDescription: 'High-energy, fast-paced staccato rhythm with metropolitan assertiveness.',
    preferredVoiceNames: [
      'Microsoft Guy',
      'Alex',
      'Aaron',
      'Oliver',
      'Microsoft David',
    ],
    styleInstructions: 'Brisk, punchy, energetic metropolitan cadence with conversational punch.',
  },
  'feminine_new_york_city': {
    id: 'feminine_new_york_city',
    displayName: 'New York City (Feminine)',
    accentStyle: 'new_york_city',
    accentTitle: 'New York City',
    accentDescription: 'Noticeable NYC rhythm, pronunciation, and conversational energy.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Zephyr',
    geminiVoiceName: 'Zephyr',
    speakingRate: 1.15,
    pitch: 1.15,
    cadenceDescription: 'Crisp, dynamic, and assertive NYC conversational rhythm.',
    preferredVoiceNames: [
      'Microsoft Aria',
      'Ava',
      'Karen',
      'Microsoft Jenny',
      'Samantha',
    ],
    styleInstructions: 'Dynamic, crisp, fast-moving NYC conversational tempo with sharp articulation.',
  },

  // ==========================================
  // 5. MIDWESTERN
  // ==========================================
  'masculine_midwestern': {
    id: 'masculine_midwestern',
    displayName: 'Midwestern (Masculine)',
    accentStyle: 'midwestern',
    accentTitle: 'Midwestern',
    accentDescription: 'Clear, relaxed Midwestern/Great Lakes American speech.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Fenrir',
    geminiVoiceName: 'Fenrir',
    speakingRate: 0.97,
    pitch: 0.96,
    cadenceDescription: 'Even-tempered, flat-open vowel rhythm with relaxed honesty.',
    preferredVoiceNames: [
      'Microsoft David',
      'Google US English',
      'Alex',
      'Fred',
    ],
    styleInstructions: 'Calm, steady, flat-neutral Heartland cadence with honest warmth.',
  },
  'feminine_midwestern': {
    id: 'feminine_midwestern',
    displayName: 'Midwestern (Feminine)',
    accentStyle: 'midwestern',
    accentTitle: 'Midwestern',
    accentDescription: 'Clear, relaxed Midwestern/Great Lakes American speech.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Kore',
    geminiVoiceName: 'Kore',
    speakingRate: 0.97,
    pitch: 0.98,
    cadenceDescription: 'Friendly, unhurried Heartland cadence with open vowels.',
    preferredVoiceNames: [
      'Microsoft Jenny',
      'Samantha',
      'Susan',
      'Microsoft Zira',
    ],
    styleInstructions: 'Steady, friendly Great Lakes / Midwestern articulation with open-hearted tone.',
  },

  // ==========================================
  // 6. CALIFORNIA / WEST COAST
  // ==========================================
  'masculine_california_west_coast': {
    id: 'masculine_california_west_coast',
    displayName: 'California / West Coast (Masculine)',
    accentStyle: 'california_west_coast',
    accentTitle: 'California / West Coast',
    accentDescription: 'Relaxed, contemporary West Coast American speech.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Puck',
    geminiVoiceName: 'Puck',
    speakingRate: 1.02,
    pitch: 1.03,
    cadenceDescription: 'Laid-back, fluid West Coast cadence with subtle upturns.',
    preferredVoiceNames: [
      'Google US English',
      'Aaron',
      'Evan',
      'Microsoft David',
      'Alex',
    ],
    styleInstructions: 'Smooth, relaxed, modern West Coast pacing with airy flow.',
  },
  'feminine_california_west_coast': {
    id: 'feminine_california_west_coast',
    displayName: 'California / West Coast (Feminine)',
    accentStyle: 'california_west_coast',
    accentTitle: 'California / West Coast',
    accentDescription: 'Relaxed, contemporary West Coast American speech.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Zephyr',
    geminiVoiceName: 'Zephyr',
    speakingRate: 1.03,
    pitch: 1.10,
    cadenceDescription: 'Bright, airy, and contemporary West Coast speech flow.',
    preferredVoiceNames: [
      'Google US English',
      'Ava',
      'Samantha',
      'Microsoft Jenny',
    ],
    styleInstructions: 'Modern, airy Pacific coast tone with effortless, smooth conversational flow.',
  },

  // ==========================================
  // 7. BOSTON / NEW ENGLAND
  // ==========================================
  'masculine_boston_new_england': {
    id: 'masculine_boston_new_england',
    displayName: 'Boston / New England (Masculine)',
    accentStyle: 'boston_new_england',
    accentTitle: 'Boston / New England',
    accentDescription: 'Natural New England/Boston-influenced pronunciation and rhythm.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Fenrir',
    geminiVoiceName: 'Fenrir',
    speakingRate: 1.08,
    pitch: 0.96,
    cadenceDescription: 'Clipped, direct, quick-tempo rhythm with concise articulation.',
    preferredVoiceNames: [
      'Microsoft Mark',
      'Oliver',
      'Alex',
      'Microsoft David',
      'Fred',
    ],
    styleInstructions: 'Concise, direct New England cadence with rapid articulation and sharp rhythm.',
  },
  'feminine_boston_new_england': {
    id: 'feminine_boston_new_england',
    displayName: 'Boston / New England (Feminine)',
    accentStyle: 'boston_new_england',
    accentTitle: 'Boston / New England',
    accentDescription: 'Natural New England/Boston-influenced pronunciation and rhythm.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Zephyr',
    geminiVoiceName: 'Zephyr',
    speakingRate: 1.09,
    pitch: 1.04,
    cadenceDescription: 'Crisp, assertive, quick-tempo New England cadence.',
    preferredVoiceNames: [
      'Microsoft Aria',
      'Victoria',
      'Microsoft Zira',
      'Samantha',
    ],
    styleInstructions: 'Sharp, direct, and rhythmic New England articulation with quick tempo.',
  },

  // ==========================================
  // 8. PHILADELPHIA / MID-ATLANTIC
  // ==========================================
  'masculine_philadelphia_mid_atlantic': {
    id: 'masculine_philadelphia_mid_atlantic',
    displayName: 'Philadelphia / Mid-Atlantic (Masculine)',
    accentStyle: 'philadelphia_mid_atlantic',
    accentTitle: 'Philadelphia / Mid-Atlantic',
    accentDescription: 'Mid-Atlantic urban American cadence with subtle Philadelphia influence.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Puck',
    geminiVoiceName: 'Puck',
    speakingRate: 1.04,
    pitch: 0.95,
    cadenceDescription: 'Urban Mid-Atlantic cadence with distinct grounded timing.',
    preferredVoiceNames: [
      'Microsoft Guy',
      'Microsoft David',
      'Nathan',
      'Alex',
    ],
    styleInstructions: 'Grounded urban Mid-Atlantic rhythm with steady inflection and focused delivery.',
  },
  'feminine_philadelphia_mid_atlantic': {
    id: 'feminine_philadelphia_mid_atlantic',
    displayName: 'Philadelphia / Mid-Atlantic (Feminine)',
    accentStyle: 'philadelphia_mid_atlantic',
    accentTitle: 'Philadelphia / Mid-Atlantic',
    accentDescription: 'Mid-Atlantic urban American cadence with subtle Philadelphia influence.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Kore',
    geminiVoiceName: 'Kore',
    speakingRate: 1.05,
    pitch: 1.02,
    cadenceDescription: 'Confident Mid-Atlantic cadence with centered pronunciation.',
    preferredVoiceNames: [
      'Microsoft Zira',
      'Allison',
      'Samantha',
      'Microsoft Jenny',
    ],
    styleInstructions: 'Centered, rhythmic Mid-Atlantic urban cadence with confident delivery.',
  },

  // ==========================================
  // 9. APPALACHIAN
  // ==========================================
  'masculine_appalachian': {
    id: 'masculine_appalachian',
    displayName: 'Appalachian (Masculine)',
    accentStyle: 'appalachian',
    accentTitle: 'Appalachian',
    accentDescription: 'Warm Appalachian regional cadence without exaggeration.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Charon',
    geminiVoiceName: 'Charon',
    speakingRate: 0.83,
    pitch: 0.84,
    cadenceDescription: 'Deep, resonant, unhurried mountain cadence with folk storytelling warmth.',
    preferredVoiceNames: [
      'Fred',
      'Microsoft Mark',
      'Daniel',
      'Microsoft David',
    ],
    styleInstructions: 'Measured, rich, and resonant mountain cadence with thoughtful pauses and folk warmth.',
  },
  'feminine_appalachian': {
    id: 'feminine_appalachian',
    displayName: 'Appalachian (Feminine)',
    accentStyle: 'appalachian',
    accentTitle: 'Appalachian',
    accentDescription: 'Warm Appalachian regional cadence without exaggeration.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Kore',
    geminiVoiceName: 'Kore',
    speakingRate: 0.84,
    pitch: 0.95,
    cadenceDescription: 'Warm, melodious Appalachian cadence with gentle mountain timber.',
    preferredVoiceNames: [
      'Fiona',
      'Samantha',
      'Allison',
      'Microsoft Jenny',
    ],
    styleInstructions: 'Unhurried, warm, and musical mountain cadence with gentle acoustic timber.',
  },

  // ==========================================
  // 10. LOUISIANA / GULF SOUTH
  // ==========================================
  'masculine_louisiana_gulf_south': {
    id: 'masculine_louisiana_gulf_south',
    displayName: 'Louisiana / Gulf South (Masculine)',
    accentStyle: 'louisiana_gulf_south',
    accentTitle: 'Louisiana / Gulf South',
    accentDescription: 'Gulf South/Louisiana-influenced American cadence.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Charon',
    geminiVoiceName: 'Charon',
    speakingRate: 0.91,
    pitch: 0.93,
    cadenceDescription: 'Lyrical, rhythmic rolling cadence with warm bayou charm.',
    preferredVoiceNames: [
      'Google US English',
      'Tom',
      'Daniel',
      'Microsoft David',
    ],
    styleInstructions: 'Rolling, musical Gulf South rhythm with warm tone and rhythmic rolling cadence.',
  },
  'feminine_louisiana_gulf_south': {
    id: 'feminine_louisiana_gulf_south',
    displayName: 'Louisiana / Gulf South (Feminine)',
    accentStyle: 'louisiana_gulf_south',
    accentTitle: 'Louisiana / Gulf South',
    accentDescription: 'Gulf South/Louisiana-influenced American cadence.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Zephyr',
    geminiVoiceName: 'Zephyr',
    speakingRate: 0.92,
    pitch: 1.05,
    cadenceDescription: 'Rhythmic, melodious Gulf South lilt with expressive warmth.',
    preferredVoiceNames: [
      'Microsoft Jenny',
      'Allison',
      'Moira',
      'Google US English',
      'Samantha',
    ],
    styleInstructions: 'Expressive, musical Gulf South phrasing with flowing rhythm and gentle bayou warmth.',
  },
};

export const DEFAULT_VOICE_PROFILE_ID = 'masculine_general_american';

export function getVoiceProfile(profileId: string): VoiceProfile {
  return VOICE_PROFILES[profileId] || VOICE_PROFILES[DEFAULT_VOICE_PROFILE_ID];
}

export function getProfileIdForSelection(
  gender: GenderPresentation,
  accentStyle: USAccentStyle
): string {
  const compositeId = `${gender}_${accentStyle}`;
  if (VOICE_PROFILES[compositeId]) {
    return compositeId;
  }
  return DEFAULT_VOICE_PROFILE_ID;
}

export function findBestMatchingBrowserVoice(
  profile: VoiceProfile,
  availableVoices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!availableVoices || availableVoices.length === 0) return null;

  // 1. Try matching preferred voice names explicitly in order
  for (const preferredName of profile.preferredVoiceNames) {
    const match = availableVoices.find((v) =>
      v.name.toLowerCase().includes(preferredName.toLowerCase())
    );
    if (match) return match;
  }

  // 2. Filter English voices
  const enVoices = availableVoices.filter(
    (v) =>
      v.lang.startsWith('en-US') ||
      v.lang.startsWith('en_US') ||
      v.lang.startsWith('en')
  );

  if (enVoices.length === 0) return availableVoices[0] || null;

  // 3. Match gender heuristics from available English voices
  const isMasculine = profile.genderPresentation === 'masculine';
  const maleKeywords = ['male', 'david', 'guy', 'mark', 'alex', 'fred', 'george', 'daniel', 'tom', 'oliver', 'aaron', 'steffan', 'nathan'];
  const femaleKeywords = ['female', 'zira', 'jenny', 'aria', 'samantha', 'ava', 'allison', 'victoria', 'karen', 'moira', 'fiona', 'susan', 'michelle', 'hazel'];

  const targetKeywords = isMasculine ? maleKeywords : femaleKeywords;
  const genderMatch = enVoices.find((v) => {
    const lower = v.name.toLowerCase();
    return targetKeywords.some((kw) => lower.includes(kw));
  });

  if (genderMatch) return genderMatch;

  // 4. Default to first en-US or first English voice
  const usVoice = enVoices.find((v) => v.lang.includes('US'));
  return usVoice || enVoices[0];
}
