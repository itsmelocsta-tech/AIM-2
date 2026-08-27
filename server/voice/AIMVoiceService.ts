import { GoogleGenAI } from '@google/genai';

export interface SpokenFormatOptions {
  emotion?: 'casual' | 'motivational' | 'planning' | 'reflective' | 'excited' | 'serious';
  accentStyle?: string;
  gender?: 'masculine' | 'feminine';
  speed?: number;
}

export interface VoiceSynthesisRequest {
  text: string;
  voiceProfileId?: string;
  gender?: 'masculine' | 'feminine';
  accentStyle?: string;
  emotion?: 'casual' | 'motivational' | 'planning' | 'reflective' | 'excited' | 'serious';
  speakingRate?: number;
  pitch?: number;
  formatForSpeech?: boolean;
}

export interface VoiceSynthesisResponse {
  audioBase64: string;
  mimeType: string;
  spokenText: string;
  emotionDetected: string;
  voiceNameUsed: string;
  provider: 'gemini-tts' | 'fallback';
  cached?: boolean;
}

// Memory cache for synthesized voice snippets (keyed by text + profileId)
const audioCache = new Map<string, { audioBase64: string; mimeType: string; spokenText: string; timestamp: number }>();
const MAX_CACHE_SIZE = 100;

export class AIMVoiceService {
  private static instance: AIMVoiceService;

  private constructor() {}

  public static getInstance(): AIMVoiceService {
    if (!AIMVoiceService.instance) {
      AIMVoiceService.instance = new AIMVoiceService();
    }
    return AIMVoiceService.instance;
  }

  /**
   * Convert written AI text into warm, natural, human conversational speech
   */
  public formatSpokenResponse(rawText: string, emotion?: string): string {
    if (!rawText) return '';

    let text = rawText;

    // 1. Remove markdown symbols, headers, bullet points, code tags, URLs
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

    // 2. Expand common written acronyms & shorthand into natural conversational words
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
      [/\bFAQ\b/g, 'frequently asked questions'],
      [/\bKPIs?\b/gi, 'key performance targets'],
      [/\bROI\b/gi, 'return on investment'],
      [/\b(\d+)k\b/gi, '$1 thousand'],
      [/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, '$1 dollars'],
    ];

    for (const [regex, replacement] of contractionsAndExpansions) {
      text = text.replace(regex, replacement);
    }

    // 3. Conversational phrasing transformations (converting stiff written phrases to relaxed speech)
    const naturalSpeechReplacements: [RegExp, string][] = [
      [/\bYour first priority today is\b/gi, "First thing?"],
      [/\bAfterward, you should dedicate approximately\b/gi, "Then give"],
      [/\bIt is recommended that you\b/gi, "Let's"],
      [/\bIt is important to remember that\b/gi, "Remember,"],
      [/\bIn conclusion,\b/gi, "All in all,"],
      [/\bFurthermore,\b/gi, "Also,"],
      [/\bAdditionally,\b/gi, "Plus,"],
      [/\bHowever,\b/gi, "Though,"],
      [/\bNevertheless,\b/gi, "Still,"],
      [/\bPlease ensure that you\b/gi, "Make sure you"],
      [/\bDo not hesitate to\b/gi, "Feel free to"],
      [/\bI would suggest\b/gi, "I'd suggest"],
      [/\bYou are capable of\b/gi, "You've got what it takes to"],
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
      [/\bwhere is\b/gi, "where's"],
      [/\bhow is\b/gi, "how's"],
    ];

    for (const [regex, replacement] of naturalSpeechReplacements) {
      text = text.replace(regex, replacement);
    }

    // 4. Rhythm & pause formatting
    // Clean up duplicate spaces & weird punctuation
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\s+([,.:;?!])/g, '$1');
    text = text.replace(/([.!?])\s*([.!?])+/g, '$1'); // deduplicate punctuation
    text = text.trim();

    return text;
  }

  /**
   * Detect emotional tone from content if not explicitly specified
   */
  public detectEmotion(text: string): 'casual' | 'motivational' | 'planning' | 'reflective' | 'excited' | 'serious' {
    const lower = text.toLowerCase();

    if (/congrat|boom|let's go|awesome|knocked out|crushed it|celebrat|great job|amazing|killing it|okayyy/i.test(lower)) {
      return 'excited';
    }
    if (/yesterday got away|start over|push through|you got this|momentum|keep going|never give up|belief|overcome|warrior|grit|stand up/i.test(lower)) {
      return 'motivational';
    }
    if (/schedule|appointment|time block|priorit|next step|hour|minutes|calendar|roadmap|first 30|agenda|action plan/i.test(lower)) {
      return 'planning';
    }
    if (/reflect|feeling|heavy|lately|what matters|tired|mindful|breathe|inner peace|soul|values|grateful|gratitude|slow down/i.test(lower)) {
      return 'reflective';
    }
    if (/urgent|critical|hospital|injury|loss|grief|serious|crisis|warning/i.test(lower)) {
      return 'serious';
    }

    return 'casual';
  }

  /**
   * Map Voice Profile & Regional Accent to Gemini TTS Prebuilt Voice and Style Instructions
   */
  public getGeminiVoiceMapping(
    gender: 'masculine' | 'feminine' = 'masculine',
    accentStyle: string = 'general_american',
    emotion: string = 'casual'
  ): { voiceName: string; stylePrompt: string } {
    // Gemini 3.1 Flash TTS Prebuilt Voices:
    // Masculine: 'Puck' (energetic/warm/modern), 'Charon' (deep/resonant/unhurried), 'Fenrir' (confident/textured/grounded)
    // Feminine: 'Kore' (warm/expressive/natural), 'Zephyr' (bright/airy/contemporary), 'Aoede' (melodic/composed)

    let voiceName = gender === 'feminine' ? 'Kore' : 'Puck';
    let regionalCadence = 'natural conversational American tone';

    switch (accentStyle) {
      case 'texas':
        voiceName = gender === 'feminine' ? 'Kore' : 'Charon';
        regionalCadence = 'unhurried, grounded Texas Southwestern warmth with natural pacing';
        break;
      case 'southern':
        voiceName = gender === 'feminine' ? 'Zephyr' : 'Charon';
        regionalCadence = 'warm, gentle Southeastern melodic rhythm with relaxed phrasing';
        break;
      case 'new_york_city':
        voiceName = gender === 'feminine' ? 'Zephyr' : 'Puck';
        regionalCadence = 'energetic, dynamic, crisp metropolitan conversational rhythm';
        break;
      case 'midwestern':
        voiceName = gender === 'feminine' ? 'Kore' : 'Fenrir';
        regionalCadence = 'calm, steady, open-hearted Midwestern authenticity';
        break;
      case 'california_west_coast':
        voiceName = gender === 'feminine' ? 'Zephyr' : 'Puck';
        regionalCadence = 'relaxed, modern, airy West Coast contemporary flow';
        break;
      case 'boston_new_england':
        voiceName = gender === 'feminine' ? 'Zephyr' : 'Fenrir';
        regionalCadence = 'concise, direct, brisk New England conversational cadence';
        break;
      case 'philadelphia_mid_atlantic':
        voiceName = gender === 'feminine' ? 'Kore' : 'Puck';
        regionalCadence = 'grounded, focused urban Mid-Atlantic rhythm';
        break;
      case 'appalachian':
        voiceName = gender === 'feminine' ? 'Kore' : 'Charon';
        regionalCadence = 'measured, resonant mountain folk warmth with thoughtful pauses';
        break;
      case 'louisiana_gulf_south':
        voiceName = gender === 'feminine' ? 'Zephyr' : 'Charon';
        regionalCadence = 'lyrical, rhythmic Gulf South rolling warmth';
        break;
      case 'general_american':
      default:
        voiceName = gender === 'feminine' ? 'Kore' : 'Puck';
        regionalCadence = 'clear, warm, conversational mainstream American delivery';
        break;
    }

    let emotionalInstruction = '';
    switch (emotion) {
      case 'motivational':
        emotionalInstruction = 'Deliver with high confidence, warm energy, and empowering encouragement.';
        break;
      case 'reflective':
        emotionalInstruction = 'Deliver in a calm, slower, deeply grounded, and thoughtful tone.';
        break;
      case 'planning':
        emotionalInstruction = 'Deliver with crisp clarity, practical focus, and steady pacing.';
        break;
      case 'excited':
        emotionalInstruction = 'Deliver with genuine upbeat enthusiasm, cheerful momentum, and lively inflection.';
        break;
      case 'serious':
        emotionalInstruction = 'Deliver in a steady, empathetic, respectful, and reassuring tone.';
        break;
      case 'casual':
      default:
        emotionalInstruction = 'Deliver in a relaxed, friendly, completely natural conversational voice like talking with a close friend.';
        break;
    }

    const stylePrompt = `Speak in a ${regionalCadence}. ${emotionalInstruction} Use natural human breathing rhythm, contractions, and authentic pauses. Avoid robotic stiffness.`;

    return { voiceName, stylePrompt };
  }

  /**
   * Wrap raw 16-bit PCM audio in standard RIFF WAVE header so browsers can play it natively
   */
  public pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
    // If it already has a RIFF header, return as-is
    if (pcmBuffer.length > 4 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
      return pcmBuffer;
    }

    const byteRate = (sampleRate * numChannels * bitDepth) / 8;
    const blockAlign = (numChannels * bitDepth) / 8;
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);

    // fmt sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
    header.writeUInt16LE(1, 20); // AudioFormat: 1 = PCM
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitDepth, 34);

    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  /**
   * Synthesize natural conversational speech using Gemini TTS (gemini-3.1-flash-tts-preview)
   */
  public async synthesizeSpeech(
    ai: GoogleGenAI,
    req: VoiceSynthesisRequest
  ): Promise<VoiceSynthesisResponse> {
    const rawText = req.text.trim();
    if (!rawText) {
      throw new Error('Empty text provided for speech synthesis');
    }

    // 1. Spoken language formatting
    const spokenText = req.formatForSpeech !== false
      ? this.formatSpokenResponse(rawText, req.emotion)
      : rawText;

    const emotion = req.emotion || this.detectEmotion(spokenText);
    const gender = req.gender || (req.voiceProfileId?.startsWith('feminine') ? 'feminine' : 'masculine');
    const accentStyle = req.accentStyle || req.voiceProfileId?.replace(/^(masculine|feminine)_/, '') || 'general_american';

    // 2. Check in-memory audio cache for instantaneous replay/preview
    const cacheKey = `${spokenText.substring(0, 100)}_${gender}_${accentStyle}_${emotion}`;
    const cached = audioCache.get(cacheKey);
    if (cached) {
      return {
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        spokenText: cached.spokenText,
        emotionDetected: emotion,
        voiceNameUsed: 'cached',
        provider: 'gemini-tts',
        cached: true,
      };
    }

    // 3. Resolve Voice & Style Prompt
    const { voiceName, stylePrompt } = this.getGeminiVoiceMapping(gender, accentStyle, emotion);

    // 4. Construct conversational speech prompt for Gemini TTS
    const promptWithDirection = `${stylePrompt}

"${spokenText}"`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [
          {
            parts: [
              {
                text: promptWithDirection,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              },
            },
          },
        },
      });

      const candidates = response.candidates;
      let rawBase64Audio = candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      let mimeType = candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/pcm;rate=24000';

      if (!rawBase64Audio) {
        throw new Error('Gemini TTS did not return audio data in candidate parts');
      }

      // 5. Convert raw PCM base64 to standard WAV buffer and base64 string
      const rawBuffer = Buffer.from(rawBase64Audio, 'base64');
      const wavBuffer = this.pcmToWav(rawBuffer, 24000, 1, 16);
      const finalAudioBase64 = wavBuffer.toString('base64');
      const finalMimeType = 'audio/wav';

      // 6. Cache the synthesized audio
      if (audioCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = audioCache.keys().next().value;
        if (oldestKey) audioCache.delete(oldestKey);
      }
      audioCache.set(cacheKey, {
        audioBase64: finalAudioBase64,
        mimeType: finalMimeType,
        spokenText,
        timestamp: Date.now(),
      });

      return {
        audioBase64: finalAudioBase64,
        mimeType: finalMimeType,
        spokenText,
        emotionDetected: emotion,
        voiceNameUsed: voiceName,
        provider: 'gemini-tts',
      };
    } catch (err: any) {
      console.error('[AIMVoiceService] Gemini TTS synthesis error:', err?.message || err);
      throw err;
    }
  }
}
