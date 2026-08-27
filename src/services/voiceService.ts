import {
  VoiceState,
  SpeakerState,
  VoicePreference,
  VoiceProfile,
  GenderPresentation,
  USAccentStyle,
  GreetingSessionState,
} from '../types';
import {
  VOICE_PROFILES,
  DEFAULT_VOICE_PROFILE_ID,
  PREVIEW_SENTENCE,
  getVoiceProfile,
  getProfileIdForSelection,
  findBestMatchingBrowserVoice,
} from './voiceProfiles';

export type {
  VoiceState,
  SpeakerState,
  VoicePreference,
  VoiceProfile,
  GenderPresentation,
  USAccentStyle,
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
  emotion?: 'casual' | 'motivational' | 'planning' | 'reflective' | 'excited' | 'serious';
  formatForSpeech?: boolean;
}

const VOICE_PREFS_KEY = 'aim_voice_preferences';
const GREETING_SESSION_KEY = 'aim_greeting_session_state';

// In-memory audio URL cache for instant repeat playback & previews
const clientAudioCache = new Map<string, { audioUrl: string; spokenText: string }>();

export class VoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private voiceState: VoiceState = 'idle';
  private speakerState: SpeakerState = 'ready';

  private onResultCallback: ((text: string) => void) | null = null;
  private onVoiceStateChange: ((state: VoiceState) => void) | null = null;

  // Active Audio Playback
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentText = '';
  private currentSpokenText = '';
  private activeOptions: SpeakOptions | null = null;
  private isPausedInternally = false;
  private voiceList: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private abortController: AbortController | null = null;

  // Web Audio Context for visualizer & analyzer
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;

  // User Settings backed by 10 U.S. Regional Voice Styles & Gender choice
  private userPrefs: VoicePreference = {
    gender: 'masculine',
    accentStyle: 'general_american',
    voiceProfileId: DEFAULT_VOICE_PROFILE_ID,
    voiceName: '',
    rate: 1.0,
    pitch: 1.0,
    isMuted: false,
  };

  constructor() {
    this.loadPreferences();

    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.initVoices();
      }

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
          console.warn('Speech recognition error:', e);
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
        const accentStyle: USAccentStyle = parsed.accentStyle || 'general_american';
        const profileId =
          parsed.voiceProfileId || getProfileIdForSelection(gender, accentStyle);
        const profile = getVoiceProfile(profileId);

        this.userPrefs = {
          gender,
          accentStyle: profile.accentStyle,
          voiceProfileId: profile.id,
          voiceName: parsed.voiceName || '',
          rate: typeof parsed.rate === 'number' ? parsed.rate : profile.speakingRate,
          pitch: typeof parsed.pitch === 'number' ? parsed.pitch : profile.pitch,
          isMuted: Boolean(parsed.isMuted),
        };
      }
    } catch {
      // Default
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify(this.userPrefs));
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

  public setPreferences(prefs: Partial<VoicePreference>): void {
    const updated = { ...this.userPrefs, ...prefs };

    if (prefs.gender || prefs.accentStyle || prefs.voiceProfileId) {
      const targetProfileId =
        prefs.voiceProfileId ||
        getProfileIdForSelection(
          updated.gender,
          updated.accentStyle
        );
      const profile = getVoiceProfile(targetProfileId);
      updated.voiceProfileId = profile.id;
      updated.gender = profile.genderPresentation;
      updated.accentStyle = profile.accentStyle;

      if (prefs.rate === undefined) {
        updated.rate = profile.speakingRate;
      }
      if (prefs.pitch === undefined) {
        updated.pitch = profile.pitch;
      }
    }

    this.userPrefs = updated;
    this.savePreferences();
    this.resolveActiveVoice();
  }

  public setVoiceProfile(profileId: string): void {
    const profile = getVoiceProfile(profileId);
    this.setPreferences({
      gender: profile.genderPresentation,
      accentStyle: profile.accentStyle,
      voiceProfileId: profile.id,
      rate: profile.speakingRate,
      pitch: profile.pitch,
    });
  }

  public setSelection(gender: GenderPresentation, accentStyle: USAccentStyle): void {
    const profileId = getProfileIdForSelection(gender, accentStyle);
    this.setVoiceProfile(profileId);
  }

  private initVoices(): void {
    if (!this.synth) return;

    const loadVoices = () => {
      if (this.synth) {
        this.voiceList = this.synth.getVoices();
        this.resolveActiveVoice();
      }
    };

    loadVoices();

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }

    if (this.voiceList.length === 0) {
      const retryInterval = setInterval(() => {
        if (this.synth) {
          const v = this.synth.getVoices();
          if (v.length > 0) {
            this.voiceList = v;
            this.resolveActiveVoice();
            clearInterval(retryInterval);
          }
        }
      }, 250);

      setTimeout(() => clearInterval(retryInterval), 4000);
    }
  }

  private resolveActiveVoice(): void {
    if (!this.synth) return;
    if (this.voiceList.length === 0) {
      this.voiceList = this.synth.getVoices();
    }
    if (this.voiceList.length === 0) return;

    const activeProfile = this.getActiveProfile();

    if (this.userPrefs.voiceName) {
      const explicit = this.voiceList.find((v) => v.name === this.userPrefs.voiceName);
      if (explicit) {
        this.selectedVoice = explicit;
        return;
      }
    }

    const bestVoice = findBestMatchingBrowserVoice(activeProfile, this.voiceList);
    this.selectedVoice = bestVoice;
    if (bestVoice) {
      this.userPrefs.voiceName = bestVoice.name;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voiceList || this.voiceList.length === 0) {
      if (this.synth) {
        this.voiceList = this.synth.getVoices();
      }
    }
    return this.voiceList;
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    if (!this.selectedVoice) {
      this.resolveActiveVoice();
    }
    return this.selectedVoice;
  }

  /**
   * Client-side Spoken Response Formatter (turns rigid text into conversational human speech)
   */
  public formatSpokenResponse(rawText: string): string {
    if (!rawText) return '';

    let text = rawText;

    // 1. Remove markdown symbols, headers, bullet points, code tags, URLs
    text = text.replace(/```[\s\S]*?```/g, '');
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/^#{1,6}\s+/gm, '');
    text = text.replace(/^\s*[-*+]\s+/gm, '');
    text = text.replace(/^\s*\d+\.\s+/gm, '');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');
    text = text.replace(/~~(.*?)~~/g, '$1');
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    text = text.replace(/https?:\/\/\S+/g, '');
    text = text.replace(/[•●■◆▶►★☆]/g, '');
    text = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');

    // 2. Expand common written acronyms & shorthand
    const contractionsAndExpansions: [RegExp, string][] = [
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

    for (const [regex, replacement] of contractionsAndExpansions) {
      text = text.replace(regex, replacement);
    }

    // 3. Conversational phrasing transformations
    const naturalSpeechReplacements: [RegExp, string][] = [
      [/\bYour first priority today is\b/gi, "First thing?"],
      [/\bAfterward, you should dedicate approximately\b/gi, "Then give"],
      [/\bIt is recommended that you\b/gi, "Let's"],
      [/\bIt is important to remember that\b/gi, "Remember,"],
      [/\bIn conclusion,\b/gi, "All in all,"],
      [/\bFurthermore,\b/gi, "Also,"],
      [/\bAdditionally,\b/gi, "Plus,"],
      [/\bHowever,\b/gi, "Though,"],
      [/\bPlease ensure that you\b/gi, "Make sure you"],
      [/\bDo not hesitate to\b/gi, "Feel free to"],
      [/\bI would suggest\b/gi, "I'd suggest"],
      [/\bLet us\b/gi, "Let's"],
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
    ];

    for (const [regex, replacement] of naturalSpeechReplacements) {
      text = text.replace(regex, replacement);
    }

    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  public setVoiceStateListener(cb: (state: VoiceState) => void): void {
    this.onVoiceStateChange = cb;
  }

  private setVoiceState(state: VoiceState) {
    this.voiceState = state;
    if (this.onVoiceStateChange) {
      this.onVoiceStateChange(state);
    }
  }

  private setSpeakerState(state: SpeakerState) {
    this.speakerState = state;
    if (this.activeOptions?.onStateChange) {
      this.activeOptions.onStateChange(state);
    }
    if (state === 'playing') {
      this.setVoiceState('speaking');
    } else if (state === 'finished' || state === 'ready') {
      if (this.voiceState === 'speaking') {
        this.setVoiceState('idle');
      }
    } else if (state === 'error') {
      this.setVoiceState('error');
    }
  }

  public getVoiceState(): VoiceState {
    return this.voiceState;
  }

  public getSpeakerState(): SpeakerState {
    return this.speakerState;
  }

  /**
   * Universal speak pipeline used by all of AIM.
   * Synthesizes audio immediately and reliably using the matched Voice Profile and regional acoustics.
   */
  public speak(text: string, options?: SpeakOptions | (() => void)): void {
    const normalizedOptions: SpeakOptions | null =
      typeof options === 'function' ? { onEnd: options } : options || null;

    if (this.userPrefs.isMuted) {
      this.setSpeakerState('ready');
      if (normalizedOptions?.onEnd) normalizedOptions.onEnd();
      return;
    }

    // Stop any ongoing speech/audio cleanly
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

    const gender = profile.genderPresentation;
    const accentStyle = profile.accentStyle;
    const emotion = normalizedOptions?.emotion;

    // Check client-side audio cache for instant playback if pre-rendered audio exists
    const cacheKey = `${formattedText.substring(0, 100)}_${gender}_${accentStyle}_${emotion || 'casual'}`;
    const cached = clientAudioCache.get(cacheKey);

    if (cached) {
      this.playAudioUrl(cached.audioUrl, normalizedOptions);
      return;
    }

    // Execute instant browser speech synthesis with regional acoustic parameters
    this.executeSpeechSynthesis(formattedText, profile, normalizedOptions);
  }

  /**
   * Plays an audio URL using HTML5 Audio with smooth state handling and event callbacks
   */
  private playAudioUrl(audioUrl: string, options: SpeakOptions | null): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.removeAttribute('src');
      this.currentAudioElement = null;
    }

    const audio = new Audio(audioUrl);
    this.currentAudioElement = audio;

    audio.onplay = () => {
      this.setSpeakerState('playing');
    };

    audio.onpause = () => {
      if (this.isPausedInternally) {
        this.setSpeakerState('paused');
      }
    };

    audio.onended = () => {
      this.setSpeakerState('finished');
      this.currentAudioElement = null;
      if (options?.onEnd) options.onEnd();
    };

    audio.onerror = (e) => {
      console.warn('[VoiceEngine] Audio playback error:', e);
      this.setSpeakerState('error');
      this.currentAudioElement = null;
      if (options?.onError) options.onError(e);
    };

    audio.play().catch((err) => {
      console.warn('[VoiceEngine] Audio play() promise rejected:', err);
      this.setSpeakerState('error');
      if (options?.onError) options.onError(err);
    });
  }

  /**
   * Guaranteed, instant browser speech synthesis with precision regional acoustics and GC preservation
   */
  private executeSpeechSynthesis(
    text: string,
    profile: VoiceProfile,
    options: SpeakOptions | null
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[VoiceEngine] SpeechSynthesis is not supported in this environment');
      this.setSpeakerState('error');
      if (options?.onError) options.onError(new Error('No speech synthesis available'));
      return;
    }

    if (!this.synth) {
      this.synth = window.speechSynthesis;
    }

    try {
      // 1. Cancel any stale utterances and unpause synthesis
      this.synth.cancel();
      if (this.synth.paused) {
        this.synth.resume();
      }

      // 2. Prepare utterance with profile rates and pitches
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      (window as any).__aim_active_utterance = utterance;

      const effectiveRate = options?.rate !== undefined ? options.rate : (profile.speakingRate || 1.0);
      const effectivePitch = options?.pitch !== undefined ? options.pitch : (profile.pitch || 1.0);

      utterance.rate = Math.max(0.6, Math.min(1.5, effectiveRate));
      utterance.pitch = Math.max(0.6, Math.min(1.4, effectivePitch));
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // 3. Resolve browser voice
      if (this.voiceList.length === 0) {
        this.voiceList = this.synth.getVoices();
      }
      const voice = findBestMatchingBrowserVoice(profile, this.voiceList);
      if (voice) {
        utterance.voice = voice;
      }

      // 4. State callbacks
      utterance.onstart = () => {
        this.setSpeakerState('playing');
        if (options?.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.setSpeakerState('finished');
        this.currentUtterance = null;
        (window as any).__aim_active_utterance = null;
        if (options?.onEnd) options.onEnd();
      };

      utterance.onerror = (e: any) => {
        if (e?.error === 'canceled' || e?.error === 'interrupted') {
          return;
        }
        console.warn('[VoiceEngine] SpeechSynthesis error:', e);
        this.setSpeakerState('error');
        this.currentUtterance = null;
        (window as any).__aim_active_utterance = null;
        if (options?.onError) options.onError(e);
      };

      // 5. Trigger speech immediately inside the user interaction tick
      this.setSpeakerState('playing');
      if (options?.onStart) options.onStart();
      this.synth.speak(utterance);

      // 6. Chrome synthesis unfreeze guard: resume if synthesis stalls on background tab
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch (err) {
      console.warn('[VoiceEngine] Speech execution caught error:', err);
      this.setSpeakerState('error');
      if (options?.onError) options.onError(err);
    }
  }

  /**
   * Dedicated Live Voice Preview for any Voice Profile using standardized benchmark sentence
   */
  public previewVoice(
    profileId: string,
    customSentence?: string,
    callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: () => void }
  ): void {
    const text = customSentence || PREVIEW_SENTENCE;
    const profile = getVoiceProfile(profileId);

    this.stopSpeaking(true);

    this.speak(text, {
      profileId: profile.id,
      rate: profile.speakingRate,
      pitch: profile.pitch,
      emotion: 'casual',
      onStart: callbacks?.onStart,
      onEnd: callbacks?.onEnd,
      onError: callbacks?.onError,
    });
  }

  public pause(): void {
    this.isPausedInternally = true;
    if (this.currentAudioElement && !this.currentAudioElement.paused) {
      this.currentAudioElement.pause();
    } else if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
    this.setSpeakerState('paused');
    if (this.activeOptions?.onPause) this.activeOptions.onPause();
  }

  public resume(): void {
    this.isPausedInternally = false;
    if (this.currentAudioElement && this.currentAudioElement.paused) {
      this.currentAudioElement.play().catch((e) => console.warn('Resume audio play error:', e));
      this.setSpeakerState('playing');
      if (this.activeOptions?.onResume) this.activeOptions.onResume();
    } else if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.setSpeakerState('playing');
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
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }

    if (this.synth) {
      this.synth.cancel();
    }

    this.currentUtterance = null;
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
      console.warn('Failed to start speech recognition:', e);
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
