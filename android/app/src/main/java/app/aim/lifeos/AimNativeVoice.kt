package app.aim.lifeos

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject

/** Origin-scoped Web Speech adapter. Audio stays with Android's speech provider. */
class AimNativeVoice(
    private val activity: AppCompatActivity,
    private val webView: WebView,
    private val requestPermission: ((Boolean) -> Unit) -> Unit
) {
    private var recognizer: SpeechRecognizer? = null
    private var reply: JavaScriptReplyProxy? = null
    private var requestId = ""
    private var generation = 0

    fun install() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER) ||
            !WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return
        WebViewCompat.addWebMessageListener(webView, "AimVoiceChannel", setOf(BuildConfig.AIM_WEB_ORIGIN)) { _, message, origin, mainFrame, proxy ->
            if (!mainFrame || !TrustedOrigin.matches(origin.toString(), BuildConfig.AIM_WEB_ORIGIN)) return@addWebMessageListener
            val command = runCatching { JSONObject(message.data ?: "") }.getOrNull() ?: return@addWebMessageListener
            when (command.optString("action")) {
                "start" -> {
                    cancel()
                    reply = proxy
                    requestId = command.optString("id")
                    val current = ++generation
                    requestPermission { granted ->
                        if (current != generation) return@requestPermission
                        if (!granted) { emit("error", "not-allowed"); emit("end"); return@requestPermission }
                        start(command.optString("lang", "en-US"))
                    }
                }
                "stop" -> if (command.optString("id") == requestId) recognizer?.stopListening()
                "abort" -> if (command.optString("id") == requestId) cancel()
            }
        }
        WebViewCompat.addDocumentStartJavaScript(webView, """
            (() => {
              if (window.top !== window) return;
              const instances = new Map();
              const send = data => window.AimVoiceChannel.postMessage(JSON.stringify(data));
              window.AimVoiceChannel.onmessage = event => {
                const data = JSON.parse(event.data), instance = instances.get(data.id);
                if (!instance) return;
                if (data.type === 'result') {
                  const result = [{ transcript: data.text }]; result.isFinal = data.final;
                  instance.onresult?.({ resultIndex: 0, results: [result] });
                } else if (data.type === 'error') instance.onerror?.({ error: data.text });
                else if (data.type === 'start') instance.onstart?.();
                else if (data.type === 'end') { instances.delete(data.id); instance.onend?.(); }
              };
              window.SpeechRecognition = class {
                constructor() { this.lang = 'en-US'; this.id = ''; }
                start() { this.id = String(Date.now()) + Math.random(); instances.set(this.id, this); send({ action:'start', id:this.id, lang:this.lang }); }
                stop() { send({ action:'stop', id:this.id }); }
                abort() { send({ action:'abort', id:this.id }); }
              };
              window.AimAndroidApp = true;
            })();
        """.trimIndent(), setOf(BuildConfig.AIM_WEB_ORIGIN))
    }

    private fun emit(type: String, text: String = "", final: Boolean = false) {
        if (!TrustedOrigin.matches(webView.url ?: "", BuildConfig.AIM_WEB_ORIGIN)) return
        runCatching { reply?.postMessage(JSONObject().put("id", requestId).put("type", type).put("text", text).put("final", final).toString()) }
    }

    private fun start(language: String) {
        if (!SpeechRecognizer.isRecognitionAvailable(activity)) { emit("error", "service-not-allowed"); emit("end"); return }
        recognizer?.destroy()
        recognizer = SpeechRecognizer.createSpeechRecognizer(activity).also { speech ->
            speech.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) { emit("start") }
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onPartialResults(results: Bundle?) { emit("result", results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: "") }
                override fun onResults(results: Bundle?) { emit("result", results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: "", true); emit("end") }
                override fun onError(error: Int) {
                    val code = when (error) {
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "not-allowed"
                        SpeechRecognizer.ERROR_AUDIO -> "audio-capture"
                        SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no-speech"
                        else -> "service-not-allowed"
                    }
                    emit("error", code); emit("end")
                }
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
            speech.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, language.take(40))
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            })
        }
    }

    fun cancel() {
        generation++
        recognizer?.cancel(); recognizer?.destroy(); recognizer = null
        emit("error", "aborted"); emit("end"); reply = null
    }
    fun pause() { emit("error", "not-allowed"); cancel() }
}
