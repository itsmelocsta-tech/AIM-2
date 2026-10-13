package com.itsmelocsta.aim;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import androidx.webkit.JavaScriptReplyProxy;
import org.json.JSONObject;
import java.util.ArrayList;

/** Microphone access occurs only after an explicit, origin-scoped dictation request. */
public final class NativeDictation implements RecognitionListener {
    private final Activity activity;
    private SpeechRecognizer recognizer;
    private JavaScriptReplyProxy proxy;
    private String id;
    public NativeDictation(Activity activity) { this.activity = activity; }
    public void handle(JSONObject data, JavaScriptReplyProxy reply) {
        if ("stop".equals(data.optString("action"))) {
            if (recognizer != null) recognizer.stopListening(); else finish(null, "Dictation stopped.");
            return;
        }
        if (!"start".equals(data.optString("action")) || data.optString("id").length() > 100) return;
        if (proxy != null) return;
        proxy = reply; id = data.optString("id");
        if (activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            activity.requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 811);
        } else start();
    }
    public void onPermissionResult(int code) {
        if (code != 811 || proxy == null) return;
        if (activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) start();
        else finish(null, "Microphone permission was denied. You can type instead.");
    }
    private void start() {
        try {
            if (!SpeechRecognizer.isRecognitionAvailable(activity)) { finish(null, "Speech recognition is unavailable. You can type instead."); return; }
            if (recognizer != null) recognizer.destroy();
            recognizer = Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(activity)
                ? SpeechRecognizer.createOnDeviceSpeechRecognizer(activity) : SpeechRecognizer.createSpeechRecognizer(activity);
            recognizer.setRecognitionListener(this);
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
            recognizer.startListening(intent);
        } catch (Exception error) { finish(null, "Dictation could not start. You can type instead."); }
    }
    private void finish(String text, String error) {
        if (proxy == null) return;
        try {
            JSONObject result = new JSONObject().put("id", id);
            if (error != null) result.put("error", error); else result.put("text", text);
            proxy.postMessage(result.toString());
        } catch (Exception ignored) {}
        proxy = null; id = null;
    }
    public void cancel() { if (recognizer != null) recognizer.cancel(); finish(null, "Dictation stopped."); }
    public void destroy() { cancel(); if (recognizer != null) recognizer.destroy(); recognizer = null; }
    @Override public void onResults(Bundle results) {
        ArrayList<String> values = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        finish(values != null && !values.isEmpty() ? values.get(0) : "", null);
    }
    @Override public void onError(int error) { finish(null, "Dictation did not finish. Please retry or type instead."); }
    @Override public void onReadyForSpeech(Bundle params) {}
    @Override public void onBeginningOfSpeech() {}
    @Override public void onRmsChanged(float rms) {}
    @Override public void onBufferReceived(byte[] buffer) {}
    @Override public void onEndOfSpeech() {}
    @Override public void onPartialResults(Bundle partialResults) {}
    @Override public void onEvent(int eventType, Bundle params) {}
}
