import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { VoiceEngine, voiceEngine } from '../../services/voiceService';
import './voiceTextField.css';

type TextControl = HTMLInputElement | HTMLTextAreaElement;

// Each attempt owns a recognizer so late callbacks cannot reach another field.
function useFieldDictation(control: React.RefObject<TextControl | null>, unavailable: boolean) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const engine = useRef<VoiceEngine | null>(null);
  const stop = useCallback(() => {
    const current = engine.current;
    engine.current = null;
    current?.stopListening();
    setListening(false);
  }, []);

  useEffect(() => {
    const hide = () => { if (document.hidden) stop(); };
    const form = control.current?.form;
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', stop);
    form?.addEventListener('submit', stop, true);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', stop);
      form?.removeEventListener('submit', stop, true);
      stop();
    };
  }, [control, stop]);
  useEffect(() => { if (unavailable) stop(); }, [unavailable, stop]);

  const toggle = () => {
    if (engine.current) { stop(); return; }
    const field = control.current;
    if (!field || unavailable) return;
    setError('');
    const base = field.value;
    const attempt = new VoiceEngine();
    engine.current = attempt;
    voiceEngine.stopSpeaking();
    const started = attempt.startListening(transcript => {
      if (engine.current !== attempt || !field.isConnected) return;
      let next = base + (base && !/\s$/.test(base) ? ' ' : '') + transcript;
      if (field instanceof HTMLInputElement && field.type === 'number') {
        next = transcript.trim().replace(/[$,\s]/g, '');
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(next)) {
          setError('Try saying the number as digits, or type it.');
          return;
        }
      }
      setError('');
      if (field.maxLength >= 0) next = next.slice(0, field.maxLength);
      // Send a real input event so existing React handlers and validation run.
      const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(field, next);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }, active => {
      if (engine.current !== attempt) return;
      setListening(active);
      if (!active) engine.current = null;
    }, message => {
      if (engine.current === attempt) setError(message);
    });
    if (!started) {
      engine.current = null;
      setListening(false);
      setError('Voice input is unavailable here. Check microphone permissions or use a browser that supports speech recognition.');
    }
  };
  return { listening, error, toggle, stop };
}

type SharedProps = { voiceLabel?: string };
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & SharedProps;
type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & SharedProps;

const Control = forwardRef<TextControl, (InputProps | AreaProps) & { multiline: boolean }>(function Control(
  { multiline, voiceLabel, onChange, ...props }, forwardedRef,
) {
  const field = useRef<TextControl | null>(null);
  const statusId = useId();
  const disabled = Boolean(props.disabled || props.readOnly);
  const dictation = useFieldDictation(field, disabled);
  const label = voiceLabel || props['aria-label'] || props.placeholder || 'this field';
  const setRef = useCallback((node: TextControl | null) => {
    field.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);
  const change = (event: React.ChangeEvent<TextControl>) => {
    // Actual typing ends dictation before another speech result can overwrite it.
    if (event.nativeEvent.isTrusted) dictation.stop();
    (onChange as React.ChangeEventHandler<TextControl> | undefined)?.(event);
  };
  const common = {
    ...props, ref: setRef, onChange: change,
    'aria-describedby': [props['aria-describedby'], statusId].filter(Boolean).join(' '),
  };
  return <div className="aim-voice-field">
    {multiline ? <textarea {...common as React.TextareaHTMLAttributes<HTMLTextAreaElement>} /> : <input {...common as React.InputHTMLAttributes<HTMLInputElement>} />}
    <button type="button" className="aim-field-mic" aria-label={`${dictation.listening ? 'Stop dictation for' : 'Speak into'} ${label}`}
      title={dictation.listening ? 'Stop dictation' : 'Speak instead of typing'} aria-pressed={dictation.listening}
      disabled={disabled} onClick={dictation.toggle}>
      {dictation.listening ? <MicOff aria-hidden="true" size={18} /> : <Mic aria-hidden="true" size={18} />}
    </button>
    <span id={statusId} role={dictation.error ? 'alert' : dictation.listening ? 'status' : undefined} className={dictation.error || dictation.listening ? 'aim-field-status' : 'sr-only'}>
      {dictation.error || (dictation.listening ? 'Listening… Tap the microphone to stop.' : 'Tap the microphone to speak, then review your text before saving or sending.')}
    </span>
  </div>;
});

export const VoiceInput = forwardRef<HTMLInputElement, InputProps>(function VoiceInput(props, ref) {
  return <Control {...props} ref={ref} multiline={false} />;
});
export const VoiceTextarea = forwardRef<HTMLTextAreaElement, AreaProps>(function VoiceTextarea(props, ref) {
  return <Control {...props} ref={ref} multiline />;
});
