import {
  VoiceState,
  SpeakerState,
  VoicePreference,
  VoiceProfile,
  GenderPresentation,
  AIMAccentStyle,
  USAccentStyle,
  CentralVoiceConfig,
  GreetingSessionState,
} from '../types';
import {
  VOICE_PROFILES,
  DEFAULT_VOICE_PROFILE_ID,
  PREVIEW_SENTENCE,
  getVoiceProfile,
  getProfileIdForSelection,
  getCentralVoiceConfig,
  normalizeAccentKey,
} from './voiceProfiles';

export type {
  VoiceState,
  SpeakerState,
  VoicePreference,
  VoiceProfile,
  GenderPresentation,
  AIMAccentStyle,
  USAccentStyle,
  CentralVoiceConfig,
  GreetingSessionState,
};

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onPause?: () => void;
  onResume?: () => void;
  onStateChange?: (state: SpeakerState) => void;
  rate?: number;
  pitch?: number;
  voiceName?: string;
  profileId?: string;
  gender?: GenderPresentation;
  accentStyle?: AIMAccentStyle;
  emotion?: 'casual' | 'motivational' | 'planning' | 'reflective' | 'excited' | 'serious';
  formatForSpeech?: boolean;
}

const VOICE_PREFS_KEY = 'aim_voice_preferences';
const CENTRAL_VOICE_CONFIG_KEY = 'aim_central_voice_config';
const GREETING_SESSION_KEY = 'aim_greeting_session_state';

// In-memory client-side audio cache for instantaneous replay/preview
const clientAudioCache = new Map<string, { audioUrl: string; spokenText: string; timestamp: number }>();
const MAX_CLIENT_CACHE = 50;

export class VoiceEngine {
  private recognition: any = null;
  private voiceState: VoiceState = 'idle';
  private speakerState: SpeakerState = 'ready';

  private onResultCallback: ((text: string) => void) | null = null;
  private onVoiceStateChange: ((state: VoiceState) => void) | null = null;
  private onSpeakerStateChange: ((state: SpeakerState) => void) | null = null;
  private onErrorNotification: ((message: string, canRetry: boolean) => void) | null = null;

  // Active Audio Playback
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private currentText = '';
  private currentSpokenText = '';
  private activeOptions: SpeakOptions | null = null;
  private isPausedInternally = false;
  private activeAbortController: AbortController | null = null;

  // Central User Voice Preference (persisted across sessions and refreshed)
  private userPrefs: VoicePreference = {
    gender: 'masculine',
    accentStyle: 'texan',
    voiceProfileId: DEFAULT_VOICE_PROFILE_ID,
    voiceName: 'Charon',
    rate: 0.95,
    pitch: 1.0,
    isMuted: false,
  };

  constructor() {
    this.loadPreferences();

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.setVoiceState('listening');
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const current = finalTranscript || interimTranscript;
          if (current) {
            this.setVoiceState('transcribing');
            if (this.onResultCallback) {
              this.onResultCallback(current);
            }
          }
        };

        this.recognition.onend = () => {
          if (this.voiceState === 'listening' || this.voiceState === 'transcribing') {
            this.setVoiceState('idle');
          }
        };

        this.recognition.onerror = (e: any) => {
          console.warn('[VoiceEngine] Speech recognition error:', e);
          this.setVoiceState(e.error === 'not-allowed' ? 'error' : 'idle');
        };
      }
    }
  }

  private loadPreferences(): void {
    try {
      const raw = localStorage.getItem(VOICE_PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const gender: GenderPresentation =
          parsed.gender === 'feminine' ? 'feminine' : 'masculine';
        const accentStyle = normalizeAccentKey(parsed.accentStyle);
        const profileId =
          parsed.voiceProfileId || getProfileIdForSelection(gender, accentStyle);
        const profile = getVoiceProfile(profileId);

        this.userPrefs = {
          gender: profile.genderPresentation,
          accentStyle: profile.accentStyle,
          voiceProfileId: profile.id,
          voiceName: profile.geminiVoiceName,
          rate: typeof parsed.rate === 'number' ? parsed.rate : profile.speakingRate,
          pitch: typeof parsed.pitch === 'number' ? parsed.pitch : profile.pitch,
          isMuted: Boolean(parsed.isMuted),
        };
      } else {
        const defaultProfile = getVoiceProfile(DEFAULT_VOICE_PROFILE_ID);
        this.userPrefs = {
          gender: defaultProfile.genderPresentation,
          accentStyle: defaultProfile.accentStyle,
          voiceProfileId: defaultProfile.id,
          voiceName: defaultProfile.geminiVoiceName,
          rate: defaultProfile.speakingRate,
          pitch: defaultProfile.pitch,
          isMuted: false,
        };
      }
    } catch {
      // Default
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify(this.userPrefs));
      const centralConfig = this.getCentralConfig();
      localStorage.setItem(CENTRAL_VOICE_CONFIG_KEY, JSON.stringify(centralConfig));
    } catch {
      // Non-blocking
    }
  }

  public getPreferences(): VoicePreference {
    return { ...this.userPrefs };
  }

  public getActiveProfile(): VoiceProfile {
    return getVoiceProfile(this.userPrefs.voiceProfileId);
  }

  public getCentralConfig(): CentralVoiceConfig {
    return getCentralVoiceConfig(this.userPrefs.voiceProfileId);
  }

  public setPreferences(prefs: Partial<VoicePreference>): void {
    const updated = { ...this.userPrefs, ...prefs };

    if (prefs.gender || prefs.accentStyle || prefs.voiceProfileId) {
      const gender = (prefs.gender || updated.gender || 'masculine') as GenderPresentation;
      const accentStyle = normalizeAccentKey(prefs.accentStyle || updated.accentStyle);
      const targetProfileId =
        prefs.voiceProfileId || getProfileIdForSelection(gender, accentStyle);
      const profile = getVoiceProfile(targetProfileId);

      updated.voiceProfileId = profile.id;
      updated.gender = profile.genderPresentation;
      updated.accentStyle = profile.accentStyle;
      updated.voiceName = profile.geminiVoiceName;

      if (prefs.rate === undefined) {
        updated.rate = profile.speakingRate;
      }
      if (prefs.pitch === undefined) {
        updated.pitch = profile.pitch;
      }
    }

    this.userPrefs = updated;
    this.savePreferences();

    // Invalidate client audio cache so new voice selections generate fresh audio
    clientAudioCache.clear();
  }

  public setVoiceProfile(profileId: string): void {
    const profile = getVoiceProfile(profileId);
    this.setPreferences({
      gender: profile.genderPresentation,
      accentStyle: profile.accentStyle,
      voiceProfileId: profile.id,
      voiceName: profile.geminiVoiceName,
      rate: profile.speakingRate,
      pitch: profile.pitch,
    });
  }

  public setSelection(gender: GenderPresentation, accentStyle: USAccentStyle): void {
    const profileId = getProfileIdForSelection(gender, accentStyle);
    this.setVoiceProfile(profileId);
  }

  public setVoiceStateListener(cb: ((state: VoiceState) => void) | null): void {
    this.onVoiceStateChange = cb;
  }

  public setSpeakerStateListener(cb: ((state: SpeakerState) => void) | null): void {
    this.onSpeakerStateChange = cb;
  }

  public setErrorNotificationListener(cb: ((message: string, canRetry: boolean) => void) | null): void {
    this.onErrorNotification = cb;
  }

  private setVoiceState(state: VoiceState): void {
    this.voiceState = state;
    if (this.onVoiceStateChange) {
      this.onVoiceStateChange(state);
    }
  }

  private setSpeakerState(state: SpeakerState): void {
    this.speakerState = state;
    if (this.onSpeakerStateChange) {
      this.onSpeakerStateChange(state);
    }
    if (this.activeOptions?.onStateChange) {
      this.activeOptions.onStateChange(state);
    }
  }

  /**
   * Pre-formats raw text into calm, natural human conversational phrasing
   */
  public formatSpokenResponse(rawText: string): string {
    if (!rawText) return '';

    let text = rawText;

    // 1. Remove markdown symbols, headers, code blocks, bullet points, asterisks, URLs
    text = text.replace(/```[\s\S]*?```/g, ''); // code blocks
    text = text.replace(/`([^`]+)`/g, '$1'); // inline code
    text = text.replace(/^#{1,6}\s+/gm, ''); // markdown headers
    text = text.replace(/^\s*[-*+]\s+/gm, ''); // list bullets
    text = text.replace(/^\s*\d+\.\s+/gm, ''); // numbered lists
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // bold
    text = text.replace(/\*(.*?)\*/g, '$1'); // italic
    text = text.replace(/~~(.*?)~~/g, '$1'); // strikethrough
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links
    text = text.replace(/https?:\/\/\S+/g, ''); // naked URLs
    text = text.replace(/[•●■◆▶►★☆]/g, ''); // special bullet symbols
    text = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // emojis

    // 2. Expand common written acronyms & abbreviations
    const expansions: [RegExp, string][] = [
      [/\bapprox\.?\b/gi, 'about'],
      [/\be\.g\.?,?\b/gi, 'for example'],
      [/\bi\.e\.?,?\b/gi, 'that is'],
      [/\betc\.?\b/gi, 'and so on'],
      [/\bvs\.?\b/gi, 'versus'],
      [/\bw\/\b/gi, 'with'],
      [/\bw\/o\b/gi, 'without'],
      [/\bmin\b/gi, 'minutes'],
      [/\bmins\b/gi, 'minutes'],
      [/\bhr\b/gi, 'hour'],
      [/\bhrs\b/gi, 'hours'],
      [/\bsec\b/gi, 'seconds'],
      [/\bsecs\b/gi, 'seconds'],
      [/\bdept\.?\b/gi, 'department'],
      [/\bappt\.?\b/gi, 'appointment'],
      [/\bcal\b/gi, 'calendar'],
      [/\bdoc\b/gi, 'document'],
      [/\bdocs\b/gi, 'documents'],
      [/\binfo\b/gi, 'information'],
      [/\bDM\b/g, 'direct message'],
      [/\bDMs\b/g, 'direct messages'],
      [/\b(\d+)k\b/gi, '$1 thousand'],
      [/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, '$1 dollars'],
    ];

    for (const [regex, replacement] of expansions) {
      text = text.replace(regex, replacement);
    }

    // 3. Relaxed conversational contractions
    const contractions: [RegExp, string][] = [
      [/\bdo not\b/gi, "don't"],
      [/\bcannot\b/gi, "can't"],
      [/\bwill not\b/gi, "won't"],
      [/\bshould not\b/gi, "shouldn't"],
      [/\bcould not\b/gi, "couldn't"],
      [/\bwould not\b/gi, "wouldn't"],
      [/\bhave not\b/gi, "haven't"],
      [/\bhas not\b/gi, "hasn't"],
      [/\byou will\b/gi, "you'll"],
      [/\bwe will\b/gi, "we'll"],
      [/\bthey will\b/gi, "they'll"],
      [/\bi will\b/gi, "I'll"],
      [/\bi am\b/gi, "I'm"],
      [/\byou are\b/gi, "you're"],
      [/\bwe are\b/gi, "we're"],
      [/\bthey are\b/gi, "they're"],
      [/\bit is\b/gi, "it's"],
      [/\bthat is\b/gi, "that's"],
      [/\bwhat is\b/gi, "what's"],
      [/\bthere is\b/gi, "there's"],
      [/\bwhere is\b/gi, "where's"],
      [/\bhow is\b/gi, "how's"],
    ];

    for (const [regex, replacement] of contractions) {
      text = text.replace(regex, replacement);
    }

    // Clean whitespace & punctuation
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\s+([,.:;?!])/g, '$1');
    text = text.replace(/([.!?])\s*([.!?])+/g, '$1');
    text = text.trim();

    return text;
  }

  /**
   * Primary Production Text-to-Speech Execution:
   * Uses real Google Gemini TTS (gemini-3.1-flash-tts-preview) via server-side endpoint /api/aim/voice/speak.
   * Stops previous audio, never repeats user transcript, handles errors explicitly without silent robotic fallback.
   */
  public async speak(
    text: string,
    options?: SpeakOptions | (() => void)
  ): Promise<void> {
    const normalizedOptions: SpeakOptions | null =
      typeof options === 'function' ? { onEnd: options } : options || null;

    if (this.userPrefs.isMuted) {
      this.setSpeakerState('ready');
      if (normalizedOptions?.onEnd) normalizedOptions.onEnd();
      return;
    }

    // 1. Stop any currently active speech / audio playback cleanly
    this.stopSpeaking(false);

    const formattedText =
      normalizedOptions?.formatForSpeech !== false
        ? this.formatSpokenResponse(text)
        : text;

    if (!formattedText || !formattedText.trim()) {
      this.setSpeakerState('ready');
      if (normalizedOptions?.onEnd) normalizedOptions.onEnd();
      return;
    }

    this.currentText = text;
    this.currentSpokenText = formattedText;
    this.activeOptions = normalizedOptions;
    this.isPausedInternally = false;

    const profile = normalizedOptions?.profileId
      ? getVoiceProfile(normalizedOptions.profileId)
      : this.getActiveProfile();

    const gender = normalizedOptions?.gender || profile.genderPresentation;
    const accentStyle = normalizedOptions?.accentStyle || profile.accentStyle;
    const emotion = normalizedOptions?.emotion || 'casual';
    const speakingRate = normalizedOptions?.rate !== undefined ? normalizedOptions.rate : profile.speakingRate;
    const pitch = normalizedOptions?.pitch !== undefined ? normalizedOptions.pitch : profile.pitch;

    // Check client audio cache for instant replay of identical snippet
    const cacheKey = `${formattedText.substring(0, 80)}_${profile.id}_${emotion}`;
    const cached = clientAudioCache.get(cacheKey);

    if (cached) {
      this.playAudioUrl(cached.audioUrl, normalizedOptions);
      return;
    }

    // Prepare abort controller for server fetch
    this.activeAbortController = new AbortController();
    const signal = this.activeAbortController.signal;

    try {
      this.setVoiceState('speaking');
      this.setSpeakerState('speaking');
      if (normalizedOptions?.onStart) normalizedOptions.onStart();

      const response = await fetch('/api/aim/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: formattedText,
          voiceProfileId: profile.id,
          gender,
          accentStyle,
          emotion,
          speakingRate,
          pitch,
          formatForSpeech: false,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`TTS server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.audioBase64) {
        throw new Error(data?.warning || data?.error || 'TTS service did not return audio data');
      }

      // Convert base64 audio into playable Blob URL
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      // Cache audio snippet for snappy playback
      if (clientAudioCache.size >= MAX_CLIENT_CACHE) {
        const oldestKey = clientAudioCache.keys().next().value;
        if (oldestKey) clientAudioCache.delete(oldestKey);
      }
      clientAudioCache.set(cacheKey, {
        audioUrl,
        spokenText: formattedText,
        timestamp: Date.now(),
      });

      // Play synthesized natural audio
      this.playAudioUrl(audioUrl, normalizedOptions);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[VoiceEngine] Natural TTS synthesis error:', err);
      this.setSpeakerState('error');
      this.setVoiceState('error');

      const errorMessage = `Voice generation failed: ${err?.message || 'TTS connection issue'}. Tap to retry.`;
      if (this.onErrorNotification) {
        this.onErrorNotification(errorMessage, true);
      }

      if (normalizedOptions?.onError) {
        normalizedOptions.onError(err);
      }
    }
  }

  /**
   * Plays an audio URL using HTML5 Audio with precise lifecycle state callbacks
   */
  private playAudioUrl(audioUrl: string, options: SpeakOptions | null): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.removeAttribute('src');
      this.currentAudioElement = null;
    }
    if (this.currentBlobUrl && this.currentBlobUrl !== audioUrl) {
      try {
        URL.revokeObjectURL(this.currentBlobUrl);
      } catch {
        // ignore
      }
    }
    this.currentBlobUrl = audioUrl;

    const audio = new Audio(audioUrl);
    this.currentAudioElement = audio;

    audio.onplay = () => {
      this.setSpeakerState('playing');
      this.setVoiceState('speaking');
    };

    audio.onpause = () => {
      if (this.isPausedInternally) {
        this.setSpeakerState('paused');
      }
    };

    audio.onended = () => {
      this.setSpeakerState('finished');
      this.setVoiceState('idle');
      this.currentAudioElement = null;
      if (options?.onEnd) options.onEnd();
    };

    audio.onerror = (e) => {
      console.warn('[VoiceEngine] Audio playback error:', e);
      this.setSpeakerState('error');
      this.setVoiceState('error');
      this.currentAudioElement = null;
      if (options?.onError) options.onError(e);
    };

    audio.play().catch((err) => {
      console.warn('[VoiceEngine] Audio play() promise rejected:', err);
      this.setSpeakerState('error');
      this.setVoiceState('error');
      if (options?.onError) options.onError(err);
    });
  }

  /**
   * Dedicated Live Voice Preview for any Voice Profile using standardized benchmark sentence
   * Uses exact sentence: "Good day. Let’s see where we are today, and choose the next move together."
   */
  public previewVoice(
    profileId: string,
    customSentence?: string,
    callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: (err: any) => void }
  ): void {
    const text = customSentence || PREVIEW_SENTENCE;
    const profile = getVoiceProfile(profileId);

    // Stop and clear previous audio before starting preview
    this.stopSpeaking(true);

    this.speak(text, {
      profileId: profile.id,
      gender: profile.genderPresentation,
      accentStyle: profile.accentStyle,
      rate: profile.speakingRate,
      pitch: profile.pitch,
      emotion: 'casual',
      formatForSpeech: false,
      onStart: callbacks?.onStart,
      onEnd: callbacks?.onEnd,
      onError: callbacks?.onError,
    });
  }

  public pause(): void {
    this.isPausedInternally = true;
    if (this.currentAudioElement && !this.currentAudioElement.paused) {
      this.currentAudioElement.pause();
    }
    this.setSpeakerState('paused');
    if (this.activeOptions?.onPause) this.activeOptions.onPause();
  }

  public resume(): void {
    this.isPausedInternally = false;
    if (this.currentAudioElement && this.currentAudioElement.paused) {
      this.currentAudioElement.play().catch((e) => console.warn('[VoiceEngine] Resume audio error:', e));
      this.setSpeakerState('playing');
      this.setVoiceState('speaking');
      if (this.activeOptions?.onResume) this.activeOptions.onResume();
    }
  }

  public replay(overrideText?: string): void {
    const textToPlay = overrideText || this.currentText;
    if (textToPlay) {
      this.speak(textToPlay, this.activeOptions || undefined);
    }
  }

  public stopSpeaking(resetState = true): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement.removeAttribute('src');
      this.currentAudioElement = null;
    }

    this.isPausedInternally = false;

    if (resetState) {
      this.setSpeakerState('ready');
      if (this.voiceState === 'speaking') {
        this.setVoiceState('idle');
      }
    }
  }

  public startListening(
    onResult: (text: string) => void,
    onStateChange?: (listening: boolean) => void
  ): boolean {
    if (!this.recognition) return false;
    this.onResultCallback = onResult;

    try {
      this.stopSpeaking(true);
      this.setVoiceState('requesting_permission');
      this.recognition.start();
      if (onStateChange) onStateChange(true);
      return true;
    } catch (e) {
      console.warn('[VoiceEngine] Failed to start speech recognition:', e);
      this.setVoiceState('error');
      if (onStateChange) onStateChange(false);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.setVoiceState('idle');
    }
  }

  public getIsListening(): boolean {
    return this.voiceState === 'listening' || this.voiceState === 'transcribing';
  }

  /**
   * Session-based greeting tracking
   */
  public getGreetingSessionState(): GreetingSessionState {
    try {
      const raw = sessionStorage.getItem(GREETING_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }

    const newState: GreetingSessionState = {
      sessionId:
        'sess-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      hasSpokenHomeGreeting: false,
    };
    try {
      sessionStorage.setItem(GREETING_SESSION_KEY, JSON.stringify(newState));
    } catch {
      // Non-blocking
    }
    return newState;
  }

  public markGreetingSpoken(spokenText: string): void {
    try {
      const current = this.getGreetingSessionState();
      const updated: GreetingSessionState = {
        ...current,
        hasSpokenHomeGreeting: true,
        spokenAt: new Date().toISOString(),
        lastSpokenText: spokenText,
      };
      sessionStorage.setItem(GREETING_SESSION_KEY, JSON.stringify(updated));
    } catch {
      // Non-blocking
    }
  }
}

export const voiceEngine = new VoiceEngine();
