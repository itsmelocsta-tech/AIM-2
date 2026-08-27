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
} from 'lucide-react';
import { voiceEngine } from '../../services/voiceService';
import {
  US_ACCENT_METADATA,
  PREVIEW_SENTENCE,
  getVoiceProfile,
  getProfileIdForSelection,
  VOICE_PROFILES,
} from '../../services/voiceProfiles';
import {
  VoicePreference,
  GenderPresentation,
  USAccentStyle,
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
  const [selectedAccent, setSelectedAccent] = useState<USAccentStyle>(prefs.accentStyle || 'general_american');
  const [rate, setRate] = useState<number>(prefs.rate || 1.0);
  const [pitch, setPitch] = useState<number>(prefs.pitch || 1.0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showFineTuning, setShowFineTuning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentPrefs = voiceEngine.getPreferences();
      setPrefs(currentPrefs);
      setSelectedGender(currentPrefs.gender || 'masculine');
      setSelectedAccent(currentPrefs.accentStyle || 'general_american');
      setRate(currentPrefs.rate || 1.0);
      setPitch(currentPrefs.pitch || 1.0);
      setIsPlayingPreview(false);
    } else {
      voiceEngine.stopSpeaking(true);
      setIsPlayingPreview(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProfileId = getProfileIdForSelection(selectedGender, selectedAccent);
  const currentProfile = getVoiceProfile(currentProfileId);
  const currentAccentMeta = US_ACCENT_METADATA.find((a) => a.key === selectedAccent) || US_ACCENT_METADATA[0];

  const handleGenderChange = (gender: GenderPresentation) => {
    setSelectedGender(gender);
    const targetProfileId = getProfileIdForSelection(gender, selectedAccent);
    const targetProfile = getVoiceProfile(targetProfileId);
    setRate(targetProfile.speakingRate);
    setPitch(targetProfile.pitch);

    if (isPlayingPreview) {
      voiceEngine.stopSpeaking(true);
      setIsPlayingPreview(false);
    }
  };

  const handleAccentChange = (accent: USAccentStyle) => {
    setSelectedAccent(accent);
    const targetProfileId = getProfileIdForSelection(selectedGender, accent);
    const targetProfile = getVoiceProfile(targetProfileId);
    setRate(targetProfile.speakingRate);
    setPitch(targetProfile.pitch);

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

    voiceEngine.previewVoice(targetProfileId, PREVIEW_SENTENCE, {
      onStart: () => setIsPlayingPreview(true),
      onEnd: () => setIsPlayingPreview(false),
      onError: () => setIsPlayingPreview(false),
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
      rate,
      pitch,
    });

    onToast(`Saved: ${profile.accentTitle} (${selectedGender === 'masculine' ? 'Masculine' : 'Feminine'})`);
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
                AIM Voice & Regional Cadence
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Preferred voice and 10 U.S. regional styles
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
            <span>Voice Type</span>
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

        {/* 2. Accent Dropdown Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Accent & Cadence</span>
            </label>
            <span className="text-[11px] text-slate-400">
              10 U.S. Accents
            </span>
          </div>

          <select
            id="aim-voice-accent-selector"
            value={selectedAccent}
            onChange={(e) => handleAccentChange(e.target.value as USAccentStyle)}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            {US_ACCENT_METADATA.map((accent) => (
              <option key={accent.key} value={accent.key} className="bg-slate-900 text-slate-100 py-1">
                {accent.title} — {accent.description}
              </option>
            ))}
          </select>

          {/* Active Accent Summary Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{currentAccentMeta.title}</span>
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 shrink-0">
                {currentProfile.speakingRate}x rate
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {currentAccentMeta.cadence}
            </p>
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
                Preview Benchmark
              </span>
              {isPlayingPreview ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Playing</span>
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

          {/* Preview Button */}
          <button
            type="button"
            id="aim-voice-preview-toggle-btn"
            onClick={handleTogglePreview}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all shadow-sm ${
              isPlayingPreview
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-600'
            }`}
          >
            {isPlayingPreview ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
                <span>Preview Voice</span>
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
            <span>{showFineTuning ? 'Hide' : 'Fine-Tune'} Rate & Pitch Micro-Adjustments</span>
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
                  max="1.30"
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
            <span>Save Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
