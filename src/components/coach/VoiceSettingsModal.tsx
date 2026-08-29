import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Play,
  Square,
  Check,
  Compass,
  Sliders,
  Sparkles,
  User,
  Activity,
} from 'lucide-react';
import { voiceEngine } from '../../services/voiceService';
import {
  AIM_ACCENTS_METADATA,
  PREVIEW_SENTENCE,
  getVoiceProfile,
  getProfileIdForSelection,
  normalizeAccentKey,
} from '../../services/voiceProfiles';
import {
  VoicePreference,
  GenderPresentation,
  AIMAccentStyle,
} from '../../types';
import { AudioWaveform } from '../common/AudioWaveform';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [prefs, setPrefs] = useState<VoicePreference>(() => voiceEngine.getPreferences());
  const [selectedGender, setSelectedGender] = useState<GenderPresentation>(prefs.gender || 'masculine');
  const [selectedAccent, setSelectedAccent] = useState<AIMAccentStyle>(normalizeAccentKey(prefs.accentStyle));
  const [rate, setRate] = useState<number>(prefs.rate || 0.95);
  const [pitch, setPitch] = useState<number>(prefs.pitch || 1.0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showFineTuning, setShowFineTuning] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentPrefs = voiceEngine.getPreferences();
      setPrefs(currentPrefs);
      setSelectedGender(currentPrefs.gender || 'masculine');
      setSelectedAccent(normalizeAccentKey(currentPrefs.accentStyle));
      setRate(currentPrefs.rate || 0.95);
      setPitch(currentPrefs.pitch || 1.0);
      setIsPlayingPreview(false);
      setPreviewError(null);
    } else {
      voiceEngine.stopSpeaking(true);
      setIsPlayingPreview(false);
      setPreviewError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProfileId = getProfileIdForSelection(selectedGender, selectedAccent);
  const currentProfile = getVoiceProfile(currentProfileId);
  const currentAccentMeta = AIM_ACCENTS_METADATA.find((a) => a.key === selectedAccent) || AIM_ACCENTS_METADATA[3]; // Texan default

  const handleGenderChange = (gender: GenderPresentation) => {
    setSelectedGender(gender);
    const targetProfileId = getProfileIdForSelection(gender, selectedAccent);
    const targetProfile = getVoiceProfile(targetProfileId);
    setRate(targetProfile.speakingRate);
    setPitch(targetProfile.pitch);
    setPreviewError(null);

    if (isPlayingPreview) {
      voiceEngine.stopSpeaking(true);
      setIsPlayingPreview(false);
    }
  };

  const handleAccentChange = (accent: AIMAccentStyle) => {
    setSelectedAccent(accent);
    const targetProfileId = getProfileIdForSelection(selectedGender, accent);
    const targetProfile = getVoiceProfile(targetProfileId);
    setRate(targetProfile.speakingRate);
    setPitch(targetProfile.pitch);
    setPreviewError(null);

    if (isPlayingPreview) {
      voiceEngine.stopSpeaking(true);
      setIsPlayingPreview(false);
    }
  };

  const handleTogglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingPreview) {
      voiceEngine.stopSpeaking(true);
      setIsPlayingPreview(false);
      return;
    }

    const targetProfileId = getProfileIdForSelection(selectedGender, selectedAccent);
    setIsPlayingPreview(true);
    setPreviewError(null);

    voiceEngine.previewVoice(targetProfileId, PREVIEW_SENTENCE, {
      onStart: () => {
        setIsPlayingPreview(true);
        setPreviewError(null);
      },
      onEnd: () => setIsPlayingPreview(false),
      onError: (err) => {
        setIsPlayingPreview(false);
        setPreviewError(err?.message || 'TTS generation error. Please retry.');
      },
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    voiceEngine.stopSpeaking(true);
    setIsPlayingPreview(false);

    const profileId = getProfileIdForSelection(selectedGender, selectedAccent);
    const profile = getVoiceProfile(profileId);

    voiceEngine.setPreferences({
      gender: selectedGender,
      accentStyle: selectedAccent,
      voiceProfileId: profileId,
      voiceName: profile.geminiVoiceName,
      rate,
      pitch,
    });

    onToast(`Saved: ${profile.accentTitle} (${selectedGender === 'masculine' ? 'Masculine' : 'Feminine'} - Voice: ${profile.geminiVoiceName})`);
    onClose();
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    voiceEngine.stopSpeaking(true);
    setIsPlayingPreview(false);
    onClose();
  };

  return (
    <div
      id="aim-voice-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-settings-title"
      onClick={handleClose}
    >
      <div
        id="aim-voice-settings-dialog"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="voice-settings-title" className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                AIM Voice & Accent Configuration
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Google Gemini Natural TTS · 5 Human Accents
              </p>
            </div>
          </div>
          <button
            id="aim-voice-modal-close-btn"
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 ml-2"
            title="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Voice Type Section */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Voice Gender Presentation</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
            <button
              id="aim-voice-type-masculine"
              type="button"
              onClick={() => handleGenderChange('masculine')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                selectedGender === 'masculine'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Masculine</span>
              {selectedGender === 'masculine' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              id="aim-voice-type-feminine"
              type="button"
              onClick={() => handleGenderChange('feminine')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                selectedGender === 'feminine'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Feminine</span>
              {selectedGender === 'feminine' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 2. Accent Selector (Exactly Five Options) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Accent Style</span>
            </label>
            <span className="text-[11px] text-slate-400">
              5 Natural Options
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {AIM_ACCENTS_METADATA.map((accent) => {
              const isSelected = selectedAccent === accent.key;
              return (
                <button
                  key={accent.key}
                  id={`aim-voice-accent-${accent.key}`}
                  type="button"
                  onClick={() => handleAccentChange(accent.key)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 text-white ring-1 ring-indigo-500/50 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{accent.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{accent.description}</div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>

          {/* Active Accent & Live Provider Voice Spec Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{currentAccentMeta.title} ({selectedGender === 'masculine' ? 'Masculine' : 'Feminine'})</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 shrink-0">
                Voice: {currentProfile.geminiVoiceName}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {currentAccentMeta.cadence}
            </p>

            {/* Provider & Technical ID metadata */}
            <div className="pt-1.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
              <span>Profile: <strong className="text-slate-300">{currentProfile.id}</strong></span>
              <span>Model: <strong className="text-slate-300">Gemini 3.1 Flash TTS</strong></span>
              <span>Locale: <strong className="text-slate-300">{currentProfile.locale}</strong></span>
            </div>
          </div>
        </div>

        {/* 3. Audio Preview Benchmark Section */}
        <div
          id="aim-voice-preview-container"
          className={`border rounded-xl p-3.5 transition-all ${
            isPlayingPreview
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-950/20'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-slate-200 truncate">
                Preview Benchmark Sentence
              </span>
              {isPlayingPreview ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Generating & Speaking</span>
                </span>
              ) : null}
            </div>

            {/* Visual Waveform Animation */}
            <AudioWaveform
              isPlaying={isPlayingPreview}
              size="sm"
              color={isPlayingPreview ? 'emerald' : 'indigo'}
              barCount={6}
            />
          </div>

          <p className={`text-xs leading-relaxed mb-3 transition-colors ${
            isPlayingPreview ? 'text-emerald-100 font-medium' : 'text-slate-300 italic'
          }`}>
            "{PREVIEW_SENTENCE}"
          </p>

          {previewError && (
            <div className="mb-2 p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="truncate">{previewError}</span>
            </div>
          )}

          {/* Preview Button */}
          <button
            type="button"
            id="aim-voice-preview-toggle-btn"
            onClick={handleTogglePreview}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all shadow-sm ${
              isPlayingPreview
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 hover:border-indigo-400'
            }`}
          >
            {isPlayingPreview ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Audio Preview</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Live Gemini Voice Preview ({currentProfile.geminiVoiceName})</span>
              </>
            )}
          </button>
        </div>

        {/* 4. Fine-Tuning Micro-Adjustments (Optional Accordion) */}
        <div className="border-t border-slate-800/80 pt-2">
          <button
            type="button"
            onClick={() => setShowFineTuning(!showFineTuning)}
            className="text-[11px] font-medium text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <Sliders className="w-3 h-3" />
            <span>{showFineTuning ? 'Hide' : 'Fine-Tune'} Speed & Pitch Settings</span>
          </button>

          {showFineTuning && (
            <div className="mt-2.5 grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>Speed</span>
                  <span className="font-mono text-indigo-400">{rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.02"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                  <span>Pitch</span>
                  <span className="font-mono text-indigo-400">{pitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.02"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Footer Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            id="aim-voice-cancel-btn"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="aim-voice-save-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Selected Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
