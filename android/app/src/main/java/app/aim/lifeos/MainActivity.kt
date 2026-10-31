package app.aim.lifeos

import android.annotation.SuppressLint
import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import android.webkit.ValueCallback
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.OnBackPressedCallback
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import app.aim.lifeos.billing.AimBillingBridge

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var billingBridge: AimBillingBridge
    private lateinit var nativeVoice: AimNativeVoice
    private var permissionResult: ((Boolean) -> Unit)? = null
    private var fileResult: ValueCallback<Array<Uri>>? = null
    private val microphonePermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        permissionResult?.invoke(granted); permissionResult = null
    }
    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        fileResult?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)); fileResult = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = true
            allowFileAccess = false
            allowContentAccess = true // Only URIs explicitly selected through Android's document picker.
        }
        nativeVoice = AimNativeVoice(this, webView) { callback ->
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) callback(true)
            else { permissionResult = callback; microphonePermission.launch(Manifest.permission.RECORD_AUDIO) }
        }
        nativeVoice.install()
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { if (webView.canGoBack()) webView.goBack() else finish() }
        })

        billingBridge = AimBillingBridge(
            activity = this,
            webView = webView,
            allowedOrigin = BuildConfig.AIM_WEB_ORIGIN
        )
        if (billingBridge.install()) billingBridge.connect()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                return if (TrustedOrigin.matches(url, BuildConfig.AIM_WEB_ORIGIN)) {
                    false
                } else {
                    billingBridge.openExternalUri(request.url)
                    true
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                if (!TrustedOrigin.matches(view.url ?: "", BuildConfig.AIM_WEB_ORIGIN)) return false
                fileResult?.onReceiveValue(null); fileResult = callback
                return try { filePicker.launch(params.createIntent()); true }
                catch (_: Exception) { fileResult?.onReceiveValue(null); fileResult = null; true }
            }
            override fun onPermissionRequest(request: PermissionRequest) {
                // Do not grant WebView capabilities without the matching Android
                // runtime permission flow. Voice/device QA remains a release gate.
                request.deny()
            }
        }

        if (BuildConfig.DEBUG) showTestAccessDialog()
        else webView.loadUrl(BuildConfig.AIM_WEB_ORIGIN)
    }

    // Debug builds only: the owner supplies the private access link at runtime.
    // Never compile a share code, owner credential, or protection bypass into an APK.
    private fun showTestAccessDialog() {
        val input = EditText(this).apply {
            hint = "Paste your AIM test link"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
            setSingleLine(true)
            isSaveEnabled = false
            importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_NO
        }
        val dialog = AlertDialog.Builder(this)
            .setTitle("Open AIM Test")
            .setMessage("Paste the private test link provided with this build. The link is not saved by this test screen.")
            .setView(input)
            .setPositiveButton("Open AIM", null)
            .setNegativeButton("Cancel") { _, _ -> finish() }
            .create()
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val link = input.text.toString().trim()
                if (TestAccessLink.matches(link, BuildConfig.AIM_WEB_ORIGIN)) {
                    webView.loadUrl(link)
                    input.text.clear()
                    dialog.dismiss()
                } else {
                    input.error = "Use the AIM test link provided with this build."
                }
            }
        }
        dialog.show()
    }

    override fun onPause() {
        if (::nativeVoice.isInitialized) nativeVoice.pause()
        if (::webView.isInitialized) webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) webView.onResume()
    }

    override fun onDestroy() {
        billingBridge.disconnect()
        nativeVoice.cancel()
        fileResult?.onReceiveValue(null); fileResult = null
        webView.destroy()
        super.onDestroy()
    }
}
