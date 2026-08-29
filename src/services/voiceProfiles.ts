import { VoiceProfile, AIMAccentStyle, GenderPresentation, CentralVoiceConfig, USAccentStyle } from '../types';

export const PREVIEW_SENTENCE = "Good day. Let’s see where we are today, and choose the next move together.";

export interface AccentMetadata {
  key: AIMAccentStyle;
  title: string;
  description: string;
  cadence: string;
  iconName: string;
}

/**
 * Exactly Five Natural Accent Options as Specified by AIM Requirements:
 * 1. New York
 * 2. Southern
 * 3. Midwestern
 * 4. Texan
 * 5. African
 */
export const AIM_ACCENTS_METADATA: AccentMetadata[] = [
  {
    key: 'new_york',
    title: 'New York',
    description: 'Crisp metropolitan cadence with sharp articulation and lively conversational pacing.',
    cadence: 'Energetic, fast-paced metropolitan rhythm with crisp punch and natural flow.',
    iconName: 'Zap',
  },
  {
    key: 'southern',
    title: 'Southern',
    description: 'Warm Southeastern cadence with gentle melodic elongation and hospitable warmth.',
    cadence: 'Melodious, warm Southeastern contour with relaxed, hospitable phrasing.',
    iconName: 'Heart',
  },
  {
    key: 'midwestern',
    title: 'Midwestern',
    description: 'Calm, steady heartland cadence with open-hearted, grounded authenticity.',
    cadence: 'Steady, level-toned open vowel cadence with natural Midwestern clarity.',
    iconName: 'Shield',
  },
  {
    key: 'texan',
    title: 'Texan',
    description: 'Unhurried, grounded Southwestern cadence with rich acoustic warmth and deliberate pacing.',
    cadence: 'Deliberate Southwestern warmth with deep chest resonance and calm pacing.',
    iconName: 'Sun',
  },
  {
    key: 'african',
    title: 'African',
    description: 'Resonant, rhythmic Pan-African English inflection with articulate warmth and confident delivery.',
    cadence: 'Articulate, musical Pan-African English cadence with rich tone and confident presence.',
    iconName: 'Sparkles',
  },
];

// Alias for backwards compatibility
export const US_ACCENT_METADATA = AIM_ACCENTS_METADATA;

export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  // ==========================================
  // 1. NEW YORK
  // ==========================================
  'masculine_new_york': {
    id: 'masculine_new_york',
    displayName: 'New York (Masculine)',
    accentStyle: 'new_york',
    accentTitle: 'New York',
    accentDescription: 'Crisp metropolitan cadence with sharp articulation and lively conversational pacing.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Puck',
    geminiVoiceName: 'Puck',
    locale: 'en-US',
    speakingRate: 1.04,
    pitch: 1.00,
    cadenceDescription: 'High-energy, fast-paced metropolitan rhythm with crisp punch and natural flow.',
    styleInstructions: 'Deliver in an energetic, crisp New York metropolitan conversational rhythm with quick pacing, sharp articulation, and lively natural cadence.',
  },
  'feminine_new_york': {
    id: 'feminine_new_york',
    displayName: 'New York (Feminine)',
    accentStyle: 'new_york',
    accentTitle: 'New York',
    accentDescription: 'Crisp metropolitan cadence with sharp articulation and lively conversational pacing.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Zephyr',
    geminiVoiceName: 'Zephyr',
    locale: 'en-US',
    speakingRate: 1.03,
    pitch: 1.00,
    cadenceDescription: 'Dynamic, bright New York conversational rhythm with quick, expressive pacing.',
    styleInstructions: 'Deliver with dynamic, bright New York conversational energy, fast, precise phrasing, and confident warmth.',
  },

  // ==========================================
  // 2. SOUTHERN
  // ==========================================
  'masculine_southern': {
    id: 'masculine_southern',
    displayName: 'Southern (Masculine)',
    accentStyle: 'southern',
    accentTitle: 'Southern',
    accentDescription: 'Warm Southeastern cadence with gentle melodic elongation and hospitable warmth.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Charon',
    geminiVoiceName: 'Charon',
    locale: 'en-US',
    speakingRate: 0.94,
    pitch: 1.00,
    cadenceDescription: 'Melodious, warm Southeastern cadence with gentle vocal contour and relaxed phrasing.',
    styleInstructions: 'Deliver with warm Southeastern cadence, gentle vocal contour, unhurried phrasing, and natural hospitality.',
  },
  'feminine_southern': {
    id: 'feminine_southern',
    displayName: 'Southern (Feminine)',
    accentStyle: 'southern',
    accentTitle: 'Southern',
    accentDescription: 'Warm Southeastern cadence with gentle melodic elongation and hospitable warmth.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Zephyr',
    geminiVoiceName: 'Zephyr',
    locale: 'en-US',
    speakingRate: 0.94,
    pitch: 1.00,
    cadenceDescription: 'Soft, hospitable Southeastern melodic rhythm with warm, expressive delivery.',
    styleInstructions: 'Deliver in a gentle, melodic Southeastern vocal contour with expressive hospitable warmth and relaxed pacing.',
  },

  // ==========================================
  // 3. MIDWESTERN
  // ==========================================
  'masculine_midwestern': {
    id: 'masculine_midwestern',
    displayName: 'Midwestern (Masculine)',
    accentStyle: 'midwestern',
    accentTitle: 'Midwestern',
    accentDescription: 'Calm, steady heartland cadence with open-hearted, grounded authenticity.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Fenrir',
    geminiVoiceName: 'Fenrir',
    locale: 'en-US',
    speakingRate: 0.98,
    pitch: 1.00,
    cadenceDescription: 'Steady, level-toned heartland authenticity with balanced, calm cadence.',
    styleInstructions: 'Deliver in a calm, steady, open-hearted Midwestern American authenticity with balanced cadence and sincere clarity.',
  },
  'feminine_midwestern': {
    id: 'feminine_midwestern',
    displayName: 'Midwestern (Feminine)',
    accentStyle: 'midwestern',
    accentTitle: 'Midwestern',
    accentDescription: 'Calm, steady heartland cadence with open-hearted, grounded authenticity.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Kore',
    geminiVoiceName: 'Kore',
    locale: 'en-US',
    speakingRate: 0.98,
    pitch: 1.00,
    cadenceDescription: 'Clear, warm, steady heartland cadence with sincere, friendly presence.',
    styleInstructions: 'Deliver in a warm, steady, authentic heartland tone with sincere friendliness and crystal-clear pronunciation.',
  },

  // ==========================================
  // 4. TEXAN
  // ==========================================
  'masculine_texan': {
    id: 'masculine_texan',
    displayName: 'Texan (Masculine)',
    accentStyle: 'texan',
    accentTitle: 'Texan',
    accentDescription: 'Unhurried, grounded Southwestern cadence with rich acoustic warmth and deliberate pacing.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Charon',
    geminiVoiceName: 'Charon',
    locale: 'en-US',
    speakingRate: 0.95,
    pitch: 1.00,
    cadenceDescription: 'Deliberate Southwestern warmth with deep chest resonance and calm pacing.',
    styleInstructions: 'Deliver in an unhurried, grounded Texas Southwestern cadence with rich chest resonance, calm pacing, and reassuring warmth.',
  },
  'feminine_texan': {
    id: 'feminine_texan',
    displayName: 'Texan (Feminine)',
    accentStyle: 'texan',
    accentTitle: 'Texan',
    accentDescription: 'Unhurried, grounded Southwestern cadence with rich acoustic warmth and deliberate pacing.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Kore',
    geminiVoiceName: 'Kore',
    locale: 'en-US',
    speakingRate: 0.95,
    pitch: 1.00,
    cadenceDescription: 'Warm, relaxed Southwestern delivery with deliberate, calm pacing.',
    styleInstructions: 'Deliver with warm, relaxed Texas Southwestern phrasing, deliberate pacing, and natural friendly composure.',
  },

  // ==========================================
  // 5. AFRICAN
  // ==========================================
  'masculine_african': {
    id: 'masculine_african',
    displayName: 'African (Masculine)',
    accentStyle: 'african',
    accentTitle: 'African',
    accentDescription: 'Resonant, rhythmic Pan-African English inflection with articulate warmth and confident delivery.',
    genderPresentation: 'masculine',
    provider: 'gemini-tts',
    providerVoiceId: 'Fenrir',
    geminiVoiceName: 'Fenrir',
    locale: 'en-NG',
    speakingRate: 0.97,
    pitch: 1.00,
    cadenceDescription: 'Articulate, musical Pan-African English cadence with rich tone and confident presence.',
    styleInstructions: 'Deliver in a resonant, articulate Pan-African English inflection with rhythmic warmth, deliberate phrasing, and confident, inspiring delivery.',
  },
  'feminine_african': {
    id: 'feminine_african',
    displayName: 'African (Feminine)',
    accentStyle: 'african',
    accentTitle: 'African',
    accentDescription: 'Resonant, rhythmic Pan-African English inflection with articulate warmth and confident delivery.',
    genderPresentation: 'feminine',
    provider: 'gemini-tts',
    providerVoiceId: 'Aoede',
    geminiVoiceName: 'Aoede',
    locale: 'en-NG',
    speakingRate: 0.97,
    pitch: 1.00,
    cadenceDescription: 'Lyrical, composed Pan-African English inflection with melodic rhythm and natural warmth.',
    styleInstructions: 'Deliver in a lyrical, composed Pan-African English inflection with melodic rhythm, rich tone, articulate phrasing, and natural warmth.',
  },
};

export const DEFAULT_VOICE_PROFILE_ID = 'masculine_texan';

/**
 * Normalizes any legacy or arbitrary accent key into one of the 5 canonical AIM accent options
 */
export function normalizeAccentKey(key?: string): AIMAccentStyle {
  if (!key) return 'texan';
  const lower = key.toLowerCase().trim();
  if (lower === 'new_york' || lower === 'new_york_city' || lower.includes('york')) return 'new_york';
  if (lower === 'southern' || lower.includes('south') || lower === 'louisiana_gulf_south' || lower === 'appalachian') return 'southern';
  if (lower === 'midwestern' || lower === 'general_american' || lower.includes('west_coast') || lower.includes('new_england') || lower.includes('atlantic')) return 'midwestern';
  if (lower === 'texan' || lower === 'texas' || lower.includes('tex')) return 'texan';
  if (lower === 'african' || lower.includes('africa')) return 'african';
  return 'texan';
}

export function getVoiceProfile(profileId: string): VoiceProfile {
  if (VOICE_PROFILES[profileId]) {
    return VOICE_PROFILES[profileId];
  }
  // Try legacy mapping
  if (profileId.includes('texas')) {
    return profileId.startsWith('feminine') ? VOICE_PROFILES['feminine_texan'] : VOICE_PROFILES['masculine_texan'];
  }
  if (profileId.includes('new_york')) {
    return profileId.startsWith('feminine') ? VOICE_PROFILES['feminine_new_york'] : VOICE_PROFILES['masculine_new_york'];
  }
  if (profileId.includes('southern')) {
    return profileId.startsWith('feminine') ? VOICE_PROFILES['feminine_southern'] : VOICE_PROFILES['masculine_southern'];
  }
  if (profileId.includes('african')) {
    return profileId.startsWith('feminine') ? VOICE_PROFILES['feminine_african'] : VOICE_PROFILES['masculine_african'];
  }
  if (profileId.includes('midwestern') || profileId.includes('general_american')) {
    return profileId.startsWith('feminine') ? VOICE_PROFILES['feminine_midwestern'] : VOICE_PROFILES['masculine_midwestern'];
  }

  return VOICE_PROFILES[DEFAULT_VOICE_PROFILE_ID];
}

export function getProfileIdForSelection(
  gender: GenderPresentation,
  accentStyle: USAccentStyle
): string {
  const normalized = normalizeAccentKey(accentStyle);
  const compositeId = `${gender}_${normalized}`;
  if (VOICE_PROFILES[compositeId]) {
    return compositeId;
  }
  return DEFAULT_VOICE_PROFILE_ID;
}

/**
 * Builds standard centralized voice configuration consumed across every orb and screen
 */
export function getCentralVoiceConfig(profileId: string): CentralVoiceConfig {
  const profile = getVoiceProfile(profileId);
  return {
    id: profile.id,
    label: profile.accentTitle,
    accentKey: profile.accentStyle,
    gender: profile.genderPresentation,
    provider: 'gemini-tts',
    voiceName: profile.geminiVoiceName,
    locale: profile.locale,
    speakingRate: profile.speakingRate,
    pitch: profile.pitch,
    style: profile.styleInstructions,
    description: profile.accentDescription,
    cadenceDescription: profile.cadenceDescription,
  };
}
