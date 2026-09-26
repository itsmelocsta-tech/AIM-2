import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Keyboard,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Brain,
  Calendar,
  Target,
  Heart,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  Flame,
  Layers,
  RotateCcw,
  Clock,
  Award,
  RefreshCw,
} from 'lucide-react';
import { AimOrbCanvas } from '../common/AimOrbCanvas';
import { AimSpeakerButton } from '../common/AimSpeakerButton';
import {
  UserProfile,
  ChatMessage,
  DailyPlan,
  Goal,
  MemoryItem,
  WellnessLog,
  CrossReferenceResult,
  PathwayOption,
} from '../../types';
import { api } from '../../services/api';
import { storageService } from '../../services/storage';
import { voiceEngine, SpeakerState } from '../../services/voiceService';

interface ConversationalHomeModuleProps {
  userId: string;
  userProfile: UserProfile;
  dailyPlan: DailyPlan;
  goals: Goal[];
  memories: MemoryItem[];
  wellnessLogs: WellnessLog[];
  chatMessages: ChatMessage[];
  onUpdateChat: (messages: ChatMessage[]) => void;
  onCommitOnboarding: (data: {
    profile: UserProfile;
    plan: DailyPlan;
    goals: Goal[];
    memory: MemoryItem;
  }) => Promise<void>;
  onNavigateToTab: (tab: string) => void;
  onToast: (msg: string) => void;
}

type OnboardingStep =
  | 'tell_about_yourself' // Step 1: Good, Bad, and Ugly
  | 'who_do_you_wanna_be' // Step 2: Target Identity & Destination
  | 'cross_referencing'   // Step 3: AI Synthesis
  | 'pathway_selection'   // Step 4: Pick best options
  | 'active_os';          // Step 5: Regular active Life OS

// Pre-defined guidance constants for natural voice narration
const STEP_1_GUIDANCE =
  "Good day. I’m AIM, your Life Operating System. Let’s start with where you are right now. What matters most today? A few words are enough.";

const STEP_2_GUIDANCE =
  "Where do you want to be? Tell me one goal that matters most right now. You can share more whenever you're ready.";

export const ConversationalHomeModule: React.FC<ConversationalHomeModuleProps> = ({
  userId,
  userProfile,
  dailyPlan,
  goals,
  memories,
  wellnessLogs,
  chatMessages,
  onUpdateChat,
  onCommitOnboarding,
  onNavigateToTab,
  onToast,
}) => {
  // Determine initial step based on profile state
  const initialCalibration = storageService.getCalibration(userId);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(() => {
    if (!userProfile.onboardingCompleted) {
      if (initialCalibration?.result) {
        return 'pathway_selection';
      }
      if (initialCalibration?.currentState && !initialCalibration?.desiredState) {
        return 'who_do_you_wanna_be';
      }
      return 'tell_about_yourself';
    }
    return 'active_os';
  });

  // Onboarding Form Inputs (Unlimited space)
  const [currentStateText, setCurrentStateText] = useState(
    initialCalibration?.currentState || ''
  );
  const [desiredStateText, setDesiredStateText] = useState(
    initialCalibration?.desiredState || ''
  );

  // Cross Reference Result
  const [crossReferenceData, setCrossReferenceData] = useState<CrossReferenceResult | null>(
    initialCalibration?.result || null
  );

  // Save unfinished answers on this account only, so leaving and returning is safe.
  useEffect(() => {
    if (!userProfile.onboardingCompleted) {
      storageService.saveCalibration({
        currentState: currentStateText,
        desiredState: desiredStateText,
        result: crossReferenceData || undefined,
      }, userId);
    }
  }, [currentStateText, desiredStateText, crossReferenceData, userId, userProfile.onboardingCompleted]);
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>('option-1');
  const [isActivatingPath, setIsActivatingPath] = useState(false);

  // Voice & Chat States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  // Speaker Button States for Step 1 & Step 2
  const [speakerStateStep1, setSpeakerStateStep1] = useState<SpeakerState>('ready');
  const [speakerStateStep2, setSpeakerStateStep2] = useState<SpeakerState>('ready');
  const hasAutoSpokenStep1Ref = useRef(false);

  // General Chat In Active OS
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Progressive Disclosure Drawer in Active OS
  const [isLearnedDrawerOpen, setIsLearnedDrawerOpen] = useState(false);

  const activeTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-speak main written guidance once when onboarding screen finishes loading
  useEffect(() => {
    if (currentStep === 'tell_about_yourself' && !hasAutoSpokenStep1Ref.current) {
      hasAutoSpokenStep1Ref.current = true;
      const timer = setTimeout(() => {
        voiceEngine.speak(STEP_1_GUIDANCE, {
          onStateChange: (state) => setSpeakerStateStep1(state),
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Auto-focus input / textarea when step changes
  useEffect(() => {
    if (currentStep === 'tell_about_yourself' || currentStep === 'who_do_you_wanna_be') {
      setTimeout(() => {
        if (activeTextAreaRef.current) {
          activeTextAreaRef.current.focus();
        }
      }, 100);
    }
  }, [currentStep]);

  // Clean up voice engine on unmount
  useEffect(() => {
    return () => {
      voiceEngine.stopListening();
      voiceEngine.stopSpeaking();
    };
  }, []);

  // Speaker Button Click Handler for Step 1
  const handleSpeakerClickStep1 = () => {
    const textToSpeak = STEP_1_GUIDANCE;
    if (speakerStateStep1 === 'playing') {
      voiceEngine.pause();
    } else if (speakerStateStep1 === 'paused') {
      voiceEngine.resume();
    } else {
      voiceEngine.speak(textToSpeak, {
        onStateChange: (state) => setSpeakerStateStep1(state),
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  // Speaker Button Click Handler for Step 2
  const handleSpeakerClickStep2 = () => {
    const textToSpeak = STEP_2_GUIDANCE;
    if (speakerStateStep2 === 'playing') {
      voiceEngine.pause();
    } else if (speakerStateStep2 === 'paused') {
      voiceEngine.resume();
    } else {
      voiceEngine.speak(textToSpeak, {
        onStateChange: (state) => setSpeakerStateStep2(state),
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  // Compute status pill text & style
  const getMicrophoneState = () => {
    if (errorMessage) {
      return {
        label: errorMessage,
        colorClass: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
        dotClass: 'bg-rose-500 animate-pulse',
      };
    }
    if (isListening) {
      return {
        label: 'I’m listening… speak freely',
        colorClass: 'bg-blue-950/80 text-blue-300 border-blue-800/80 shadow-sm shadow-blue-500/20',
        dotClass: 'bg-blue-400 animate-ping',
      };
    }
    if (isThinking) {
      return {
        label: 'AIM is cross-referencing…',
        colorClass: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
        dotClass: 'bg-amber-400 animate-pulse',
      };
    }
    if (isSpeaking) {
      return {
        label: 'AIM is speaking…',
        colorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-sm shadow-emerald-500/20',
        dotClass: 'bg-emerald-400 animate-pulse',
      };
    }
    return {
      label: 'Tap to talk',
      colorClass: 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white',
      dotClass: 'bg-indigo-400',
    };
  };

  const micState = getMicrophoneState();

  // Voice toggle for dictation or chatting
  const handleToggleVoice = () => {
    setErrorMessage(null);

    // Stop speaking immediately when microphone is activated
    voiceEngine.stopSpeaking(true);
    setIsSpeaking(false);
    setSpeakerStateStep1('ready');
    setSpeakerStateStep2('ready');

    if (isListening) {
      voiceEngine.stopListening();
      setIsListening(false);
    } else {
      setLiveTranscript('');

      const started = voiceEngine.startListening(
        (text) => {
          setLiveTranscript(text);

          // If currently in a form step, append speech live to the textarea
          if (currentStep === 'tell_about_yourself') {
            setCurrentStateText((prev) => (prev ? prev + ' ' + text : text));
          } else if (currentStep === 'who_do_you_wanna_be') {
            setDesiredStateText((prev) => (prev ? prev + ' ' + text : text));
          }
        },
        (listening) => {
          setIsListening(listening);
          if (!listening) {
            setLiveTranscript((currentTranscript) => {
              if (currentStep === 'active_os' && currentTranscript.trim()) {
                handleProcessActiveOSInput(currentTranscript.trim());
              }
              return currentTranscript;
            });
          }
        }
      );

      if (!started) {
        setErrorMessage('Microphone unavailable. You can type unlimited text directly!');
        onToast('Microphone unavailable or blocked. Type directly in the text area.');
      }
    }
  };

  // Step 1 Submission -> Move to Step 2
  const handleProceedToDesiredIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentStateText.trim()) {
      onToast('Please share a bit about your current situation so AIM can understand your baseline.');
      return;
    }

    // Save progress
    storageService.saveCalibration({
      currentState: currentStateText.trim(),
      desiredState: desiredStateText.trim(),
      result: crossReferenceData || undefined,
    }, userId);

    // Speak or reflect prompt
    if (!isVoiceMuted) {
      voiceEngine.speak('Well, who do you wanna be? Or where are you trying to be, instead of where you are?');
    }

    setCurrentStep('who_do_you_wanna_be');
  };

  // Step 2 Submission -> Trigger Deep Cross-Reference
  const handleTriggerCrossReference = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!desiredStateText.trim()) {
      onToast('Please describe who you want to be or where you are trying to reach.');
      return;
    }

    setIsListening(false);
    voiceEngine.stopListening();
    setErrorMessage(null);
    setCrossReferenceData(null);
    storageService.saveCalibration({
      currentState: currentStateText.trim(),
      desiredState: desiredStateText.trim(),
    }, userId);
    setCurrentStep('cross_referencing');
    setIsThinking(true);

    try {
      const result = await api.crossReferencePathways({
        currentState: currentStateText.trim(),
        desiredState: desiredStateText.trim(),
        userProfile,
      });
      if (!result?.pathways?.length) throw new Error('AIM returned no pathways');

      setCrossReferenceData(result);
      if (result.recommendedOptionId) {
        setSelectedPathwayId(result.recommendedOptionId);
      }

      // Save calibration data
      storageService.saveCalibration({
        currentState: currentStateText.trim(),
        desiredState: desiredStateText.trim(),
        result,
      }, userId);

      setCurrentStep('pathway_selection');

      // Voice summary
      if (!isVoiceMuted && result.analysis?.empoweringInsight) {
        const spokenIntro = `I put together a few ways forward. ${result.analysis.empoweringInsight}`;
        voiceEngine.speak((spokenIntro || '').replace(/[*#_`]/g, ''));
      }
    } catch (err: any) {
      console.error('Cross reference error:', err);
      setErrorMessage('AIM couldn’t build your plan right now. Your answers are saved. Please try again.');
      setCurrentStep('who_do_you_wanna_be');
    } finally {
      setIsThinking(false);
    }
  };

  // Activate Selected Pathway into the User's Life OS
  const handleActivatePathway = async (pathway: PathwayOption) => {
    if (!crossReferenceData) return;
    setIsActivatingPath(true);
    setErrorMessage(null);

    // 1. Update User Profile
    const updatedProfile: UserProfile = {
      ...userProfile,
      desiredIdentity: crossReferenceData.synthesizedProfile.desiredIdentity || desiredStateText.trim(),
      coreMission: crossReferenceData.synthesizedProfile.coreMission || desiredStateText.trim(),
      primaryObstacle: crossReferenceData.synthesizedProfile.primaryObstacle || '',
      topSkills: crossReferenceData.synthesizedProfile.topSkills || [],
      coreValues: crossReferenceData.synthesizedProfile.coreValues || [],
      ninetyDayTrajectory: pathway.projected30DayOutcome || '',
      onboardingCompleted: true,
      firstRunGuideStep: 'intro',
    };
    // 2. Populate Initial Goals
    const newGoals: Goal[] = crossReferenceData.suggestedInitialGoals.map((g, idx) => ({
      id: 'goal-calibrated-' + (idx + 1) + '-' + Date.now(),
      title: g.title,
      why: g.why,
      category: g.category,
      targetDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      currentProgress: 0,
      obstacles: pathway.obstaclesNeutralized,
      milestones: g.milestones.map((m, mIdx) => ({
        id: `m-${idx}-${mIdx}`,
        title: m,
        completed: false,
      })),
      status: 'active',
      createdAt: new Date().toISOString(),
    }));
    // 3. Populate Today's Priority Tasks
    const newPriorityTasks = (crossReferenceData.suggestedTodayTasks || []).map((t, idx) => ({
      id: 'task-calibrated-' + (idx + 1) + '-' + Date.now(),
      task: t.task,
      category: t.category,
      timeEstimate: t.timeEstimate,
      impact: t.impact,
      completed: false,
    }));

    const startingPlan: DailyPlan = {
      ...dailyPlan,
      theme: pathway.title,
      mindsetReminder: pathway.tagline,
      priorityTasks: newPriorityTasks,
    };

    // 4. Log Memory Item of this Foundational Alignment
    const foundationalMemory: MemoryItem = {
      id: 'mem-alignment-' + Date.now(),
      title: `Foundational Alignment: ${pathway.title}`,
      content: `CURRENT STATE DISCLOSURE:\n${currentStateText}\n\nTARGET DESTINATION & IDENTITY:\n${desiredStateText}\n\nCHOSEN PATHWAY: ${pathway.title}\n${pathway.whyItFits}\n\nFIRST 48-HOUR STEPS:\n${pathway.actionPlan48h.join('\n')}`,
      category: 'Goals',
      tags: ['alignment', 'identity', 'pathway'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importance: 'critical',
    };
    // 5. Update Chat with AIM confirmation
    const activationMessage: ChatMessage = {
      id: 'msg-calibrated-' + Date.now(),
      role: 'aim',
      content: `🎯 **Your Trajectory Has Been Calibrated: ${pathway.title}**\n\nI have cross-referenced your situation and configured your Life Operating System around who you are becoming:\n\n- **Target Identity:** ${updatedProfile.desiredIdentity}\n- **Immediate 48-Hour Lever:** ${pathway.actionPlan48h[0]}\n- **Obstacles Neutralized:** ${pathway.obstaclesNeutralized.join(', ')}\n\nYour Daily Planner and Goal boards are now synchronized. How do you want today to go?`,
      timestamp: new Date().toISOString(),
      category: 'Goals',
    };
    try {
      await onCommitOnboarding({ profile: updatedProfile, plan: startingPlan, goals: newGoals, memory: foundationalMemory });
      onUpdateChat([...chatMessages, activationMessage]);
      storageService.saveCalibration({
        currentState: currentStateText,
        desiredState: desiredStateText,
        result: crossReferenceData,
      }, userId);
      setIsActivatingPath(false);
      setCurrentStep('active_os');
      onToast(`Your starting Life OS is ready: ${pathway.title}`);
    } catch (error) {
      console.error('Could not save starting plan:', error);
      setErrorMessage('AIM couldn’t save your starting plan yet. Your answers are still here. Please try again.');
      setIsActivatingPath(false);
    }
  };

  // Process live conversation in Active OS
  const handleProcessActiveOSInput = async (userInput: string) => {
    if (!userInput.trim()) return;

    setErrorMessage(null);
    setIsListening(false);
    setIsThinking(true);
    setLiveTranscript('');
    setTextInput('');

    const userMessage: ChatMessage = {
      id: 'msg-user-' + Date.now(),
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
    };

    const newChatHistory = [...chatMessages, userMessage];
    onUpdateChat(newChatHistory);

    try {
      const response = await api.chatWithAIM({
        message: userInput,
        history: newChatHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        userProfile,
      });

      const aimReply = response.reply || 'I am with you. Let us take this one step at a time.';

      const aimMessage: ChatMessage = {
        id: 'msg-aim-' + Date.now(),
        role: 'aim',
        content: aimReply,
        timestamp: new Date().toISOString(),
      };

      onUpdateChat([...newChatHistory, aimMessage]);

      if (!isVoiceMuted && aimReply) {
        setIsSpeaking(true);
        const spokenText = (aimReply || '').replace(/[*#_`]/g, '');
        voiceEngine.speak(spokenText, () => {
          setIsSpeaking(false);
        });
      }
    } catch (err) {
      setErrorMessage('I didn’t catch that. Try again.');
      setIsSpeaking(false);
    } finally {
      setIsThinking(false);
    }
  };

  // ----------------------------------------------------
  // RENDER STEP 1: TELL ME ABOUT YOURSELF (THE GOOD, BAD & UGLY)
  // ----------------------------------------------------
  if (currentStep === 'tell_about_yourself') {
    return (
      <div
        id="aim-onboarding-step-1"
        className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-start px-4 py-6 max-w-3xl mx-auto text-center animate-fadeIn"
      >
        {/* Floating Orb */}
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute w-44 h-44 rounded-full bg-indigo-600/25 blur-2xl pointer-events-none" />
          <AimOrbCanvas
            size={130}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            onClick={handleToggleVoice}
            className="z-10 cursor-pointer"
          />
        </div>

        {/* Introduction & Prompt */}
        <div className="space-y-2 mt-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Step 1 of 3 · Where you are
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Good day. I’m AIM, your Life Operating System.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            What matters most today? A few words are enough. We can fill in the details later.
          </p>
        </div>

        {/* Controls Row: Microphone State Pill + Visible Speaker Button */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={handleToggleVoice}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer ${micState.colorClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${micState.dotClass}`} />
            <span>{isListening ? 'Listening… dictating live' : 'Dictate with Voice'}</span>
            {isListening ? (
              <MicOff className="w-3.5 h-3.5 ml-0.5 text-blue-300" />
            ) : (
              <Mic className="w-3.5 h-3.5 ml-0.5 text-indigo-400" />
            )}
          </button>

          <AimSpeakerButton
            id="aim-step-1-speaker-btn"
            state={speakerStateStep1}
            onClick={handleSpeakerClickStep1}
          />
        </div>

        {/* Unlimited Character Space Text Area */}
        <form onSubmit={handleProceedToDesiredIdentity} className="w-full mt-5 text-left space-y-3">
          <div className="relative bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl p-4 shadow-xl transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800/80 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  Where you are right now
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <AimSpeakerButton
                  id="aim-box-speaker-btn-1"
                  state={speakerStateStep1}
                  onClick={handleSpeakerClickStep1}
                />
                <span className="text-[11px] text-slate-400">
                  {currentStateText.length > 0 ? `${currentStateText.length} chars` : 'Write as much as you need'}
                </span>
              </div>
            </div>

            <textarea
              ref={activeTextAreaRef}
              id="aim-current-state-textarea"
              value={currentStateText || ''}
              onChange={(e) => { setCurrentStateText(e.target.value); setCrossReferenceData(null); }}
              rows={5}
              placeholder="For example: I'm looking for steady work and I feel overwhelmed by everything I need to do."
              className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none resize-y leading-relaxed font-sans scrollbar-thin"
            />

          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              id="submit-step-1-btn"
              type="submit"
              disabled={!currentStateText.trim()}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <span>Next: Where you want to be</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER STEP 2: WHO DO YOU WANNA BE? / WHERE ARE YOU TRYING TO BE?
  // ----------------------------------------------------
  if (currentStep === 'who_do_you_wanna_be') {
    return (
      <div
        id="aim-onboarding-step-2"
        className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-start px-4 py-6 max-w-3xl mx-auto text-center animate-fadeIn"
      >
        {/* Floating Orb */}
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute w-44 h-44 rounded-full bg-emerald-600/25 blur-2xl pointer-events-none" />
          <AimOrbCanvas
            size={130}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            onClick={handleToggleVoice}
            className="z-10 cursor-pointer"
          />
        </div>

        {/* Prompt Header */}
        <div className="space-y-2 mt-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <Target className="w-3 h-3 text-emerald-400" />
            Step 2 of 3 · Where you want to be
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Well, who do you wanna be?
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            Tell me one goal that matters most right now. You can add more later.
          </p>
        </div>

        {/* Controls Row: Microphone State Pill + Visible Speaker Button */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={handleToggleVoice}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer ${micState.colorClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${micState.dotClass}`} />
            <span>{isListening ? 'Listening… dictating live' : 'Dictate with Voice'}</span>
            {isListening ? (
              <MicOff className="w-3.5 h-3.5 ml-0.5 text-blue-300" />
            ) : (
              <Mic className="w-3.5 h-3.5 ml-0.5 text-emerald-400" />
            )}
          </button>

          <AimSpeakerButton
            id="aim-step-2-speaker-btn"
            state={speakerStateStep2}
            onClick={handleSpeakerClickStep2}
          />
        </div>

        {/* Unlimited Character Space Text Area */}
        <form onSubmit={handleTriggerCrossReference} className="w-full mt-5 text-left space-y-3">
          <div className="relative bg-slate-900/90 border border-slate-800 focus-within:border-emerald-500/80 rounded-2xl p-4 shadow-xl transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800/80 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Where you want to be
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <AimSpeakerButton
                  id="aim-box-speaker-btn-2"
                  state={speakerStateStep2}
                  onClick={handleSpeakerClickStep2}
                />
                <span className="text-[11px] text-slate-400">
                  {desiredStateText.length > 0 ? `${desiredStateText.length} chars` : 'Unlimited space'}
                </span>
              </div>
            </div>

            <textarea
              ref={activeTextAreaRef}
              id="aim-desired-state-textarea"
              value={desiredStateText || ''}
              onChange={(e) => { setDesiredStateText(e.target.value); setCrossReferenceData(null); setErrorMessage(null); }}
              rows={5}
              placeholder="For example: I want steady income and enough time to be present with my family."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 resize-none font-normal leading-relaxed"
            />

          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep('tell_about_yourself')}
              className="w-full sm:w-auto px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Current State</span>
            </button>

            <button
              id="submit-cross-reference-btn"
              type="submit"
              disabled={!desiredStateText.trim()}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-200" />
              <span>Build my starting plan</span>
            </button>
          </div>
        </form>
        {errorMessage && <p role="alert" className="mt-3 text-sm text-rose-300">{errorMessage}</p>}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER STEP 3: CROSS-REFERENCING ANIMATION
  // ----------------------------------------------------
  if (currentStep === 'cross_referencing') {
    return (
      <div
        id="aim-cross-referencing-loading"
        className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-12 max-w-xl mx-auto text-center space-y-6 animate-fadeIn"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute w-60 h-60 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" />
          <AimOrbCanvas size={180} isListening={false} isSpeaking={false} isThinking={true} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            AIM is Cross-Referencing Your Trajectory
          </h2>
          <p className="text-sm text-slate-400 font-light max-w-md mx-auto">
            Analyzing the gap between your current reality and desired identity, neutralizing bottlenecks, and picking the highest-leverage options to get you there...
          </p>
        </div>

        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-4 text-left space-y-2.5 text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Parsing Good, Bad & Ugly disclosures</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Cross-referencing target identity & revenue potential</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>Selecting top 3 custom strategic pathways</span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER STEP 4: CROSS-REFERENCED PATHWAY SELECTION
  // ----------------------------------------------------
  if (currentStep === 'pathway_selection' && crossReferenceData) {
    const pathways = crossReferenceData.pathways || [];

    return (
      <div
        id="aim-pathway-selection-module"
        className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-start px-3 sm:px-6 py-6 max-w-5xl mx-auto text-center space-y-6 animate-fadeIn"
      >
        {/* Header Diagnosis */}
        <div className="space-y-2 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/90 text-indigo-300 border border-indigo-800 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Step 3 of 3 · Your starting plan
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Here’s a way forward
          </h1>
          <p className="text-sm text-slate-300 font-light leading-relaxed">
            {crossReferenceData.analysis.coreGapSummary}
          </p>
        </div>

        {/* Deep Strategic Insight Banner */}
        <div className="w-full bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-4 sm:p-5 text-left text-xs sm:text-sm text-slate-300 backdrop-blur-sm shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-400" />
              Strategic Cross-Reference Synthesis
            </span>
            <span className="text-[11px] text-slate-400">
              Target Identity: <strong className="text-white">{crossReferenceData.synthesizedProfile.desiredIdentity}</strong>
            </span>
          </div>

          <p className="text-slate-200 italic leading-relaxed">
            “{crossReferenceData.analysis.empoweringInsight}”
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-2.5">
              <span className="font-semibold text-emerald-400 block mb-1">
                Your Extracted Strengths to Leverage:
              </span>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {crossReferenceData.analysis.hiddenStrengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-2.5">
              <span className="font-semibold text-rose-400 block mb-1">
                Bottlenecks Neutralized:
              </span>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {crossReferenceData.analysis.primaryBottlenecks.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Top 3 Options Grid */}
        <div className="w-full space-y-4">
          {errorMessage && <p role="alert" className="text-sm text-rose-300">{errorMessage}</p>}
          <div className="flex items-center justify-between text-left px-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Select Your Trajectory</span>
            </h2>
            <span className="text-xs text-slate-400">
              AIM recommends <strong className="text-indigo-300">{crossReferenceData.pathways.find(p => p.id === crossReferenceData.recommendedOptionId)?.title || 'Option 1'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {pathways.map((pathway) => {
              const isRecommended = pathway.id === crossReferenceData.recommendedOptionId;
              const isSelected = selectedPathwayId === pathway.id;

              return (
                <div
                  key={pathway.id}
                  id={`pathway-card-${pathway.id}`}
                  onClick={() => setSelectedPathwayId(pathway.id)}
                  className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      AIM Pick
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-750">
                        {pathway.pace}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300">
                        {pathway.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-snug">
                        {pathway.tagline}
                      </p>
                    </div>

                    {/* Why It Fits */}
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-indigo-300 block">
                        Why This Fits Your Situation:
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {pathway.whyItFits}
                      </p>
                    </div>

                    {/* Action Plan 48h */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 block">
                        Immediate 48h Levers:
                      </span>
                      <ul className="space-y-1 text-slate-300 text-[11px]">
                        {pathway.actionPlan48h.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 30-day Outcome */}
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <strong className="text-slate-200">30-Day Projection:</strong> {pathway.projected30DayOutcome}
                    </div>
                  </div>

                  {/* Activate Button Inside Card */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80">
                    <button
                      type="button"
                      disabled={isActivatingPath}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivatePathway(pathway);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isActivatingPath && selectedPathwayId === pathway.id ? 'Calibrating Life OS...' : 'Activate This Path'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back / Re-enter Options */}
        <div className="flex items-center justify-center gap-4 pt-2 text-xs">
          <button
            type="button"
            onClick={() => { setCrossReferenceData(null); setCurrentStep('tell_about_yourself'); }}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Edit My Disclosures</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER STEP 5: ACTIVE CONVERSATIONAL LIFE OS HOME
  // ----------------------------------------------------
  return (
    <div
      id="aim-conversational-home"
      className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-between px-4 py-4 sm:py-6 max-w-xl mx-auto text-center animate-fadeIn"
    >
      {/* 1. Top Minimal Header Branding */}
      <div id="aim-home-header" className="space-y-1 pt-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>AIM</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-light">
          Your personal life operating system
        </p>

        {/* Active Identity Pill */}
        {userProfile.desiredIdentity && (
          <div className="pt-1 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentStep('tell_about_yourself')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 hover:border-indigo-800 transition-all cursor-pointer group"
              title="Click to recalibrate your Good/Bad/Ugly disclosure and target trajectory"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Identity: {userProfile.desiredIdentity}</span>
              <RotateCcw className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Central Intelligent Floating Voice Orb */}
      <div className="flex flex-col items-center justify-center my-auto py-3 sm:py-5 w-full">
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow Aura */}
          <div
            className={`absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full transition-all duration-700 pointer-events-none blur-3xl opacity-30 ${
              isListening
                ? 'bg-blue-500/50 scale-110'
                : isSpeaking
                ? 'bg-emerald-500/50 scale-115'
                : isThinking
                ? 'bg-amber-500/50 scale-105'
                : 'bg-indigo-600/30'
            }`}
          />

          <AimOrbCanvas
            size={220}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            onClick={handleToggleVoice}
            className="z-10 transition-transform active:scale-95 hover:scale-105"
          />
        </div>

        {/* 8. Clearly Visible Microphone State Pill */}
        <button
          id="aim-mic-state-indicator"
          onClick={handleToggleVoice}
          className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer ${micState.colorClass}`}
          title={isListening ? 'Click to finish speaking' : 'Click to talk'}
        >
          <span className={`w-2 h-2 rounded-full ${micState.dotClass}`} />
          <span>{micState.label}</span>
          {isListening && <Mic className="w-3.5 h-3.5 ml-0.5 text-blue-300 animate-pulse" />}
        </button>

        {/* Welcome Title */}
        <div className="mt-5 space-y-1 max-w-md px-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 tracking-tight">
            How do you want today to go?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Talk to AIM about what’s on your mind.
          </p>
        </div>

        {/* Live Conversation Reflection Bubble */}
        {chatMessages.length > 0 && (
          <div
            id="aim-recent-dialogue"
            className="w-full mt-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-left text-xs sm:text-sm leading-relaxed backdrop-blur-sm shadow-lg space-y-3 transition-all"
          >
            {isListening && liveTranscript ? (
              <div className="flex items-start gap-2.5 text-blue-300 italic font-sans">
                <Mic className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                <p>“{liveTranscript}”</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AIM Reflection</span>
                  </span>
                  <button
                    onClick={() => {
                      if (isSpeaking) {
                        voiceEngine.stopSpeaking();
                        setIsSpeaking(false);
                      }
                      setIsVoiceMuted(!isVoiceMuted);
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                    title={isVoiceMuted ? 'Unmute AIM Voice' : 'Mute AIM Voice'}
                  >
                    {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-slate-200 whitespace-pre-line">
                  {chatMessages[chatMessages.length - 1]?.content}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Action Buttons & Input Mode */}
      <div className="w-full space-y-3 pb-2">
        {!isTypingMode ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <button
              id="talk-to-aim-primary-btn"
              onClick={handleToggleVoice}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-95 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-emerald-300" />
                  <span>Talk to AIM</span>
                </>
              )}
            </button>

            <button
              id="type-instead-secondary-btn"
              onClick={() => setIsTypingMode(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Keyboard className="w-4 h-4 text-slate-400" />
              <span>Type instead</span>
            </button>

            <button
              id="what-changed-life-update-btn"
              onClick={() => onNavigateToTab('life-update')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>What changed?</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim()) {
                handleProcessActiveOSInput(textInput.trim());
              }
            }}
            className="w-full flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 focus-within:border-indigo-500/80 transition-colors shadow-lg"
          >
            <input
              ref={activeInputRef}
              id="aim-home-text-input"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="What’s on your mind today?"
              className="flex-1 bg-transparent px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isThinking}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
              title="Send to AIM"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsTypingMode(false)}
              className="px-2.5 py-2 text-slate-500 hover:text-slate-300 text-xs font-medium"
            >
              Close
            </button>
          </form>
        )}

        {/* Progressive Disclosure: Reveal Learned Spaces */}
        {(memories.length > 0 || goals.length > 0 || dailyPlan.priorityTasks.length > 0 || wellnessLogs.length > 0) && (
          <div className="pt-2 w-full">
            <button
              id="toggle-learned-spaces-btn"
              onClick={() => setIsLearnedDrawerOpen(!isLearnedDrawerOpen)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 px-3 rounded-full hover:bg-slate-900"
            >
              <span>
                AIM has organized {memories.length + goals.length + dailyPlan.priorityTasks.length + wellnessLogs.length} items for you
              </span>
              {isLearnedDrawerOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {isLearnedDrawerOpen && (
              <div
                id="aim-learned-spaces-grid"
                className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left animate-fadeIn"
              >
                {dailyPlan.priorityTasks.length > 0 && (
                  <div
                    onClick={() => onNavigateToTab('planner')}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between text-indigo-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">
                        {dailyPlan.priorityTasks.length}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                      Daily Plan
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {dailyPlan.priorityTasks[0]?.task}
                    </div>
                  </div>
                )}

                {goals.length > 0 && (
                  <div
                    onClick={() => onNavigateToTab('goals')}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between text-emerald-400 mb-1">
                      <Target className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{goals.length}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                      Goals
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {goals[0]?.title}
                    </div>
                  </div>
                )}

                {memories.length > 0 && (
                  <div
                    onClick={() => onNavigateToTab('memory')}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between text-purple-400 mb-1">
                      <Brain className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{memories.length}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                      Memory
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {memories[0]?.title}
                    </div>
                  </div>
                )}

                {wellnessLogs.length > 0 && (
                  <div
                    onClick={() => onNavigateToTab('wellness')}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between text-rose-400 mb-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">
                        {wellnessLogs.length}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-300">
                      Wellness
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {wellnessLogs[0]?.movementType || 'Energy logged'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
