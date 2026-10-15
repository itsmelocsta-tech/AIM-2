package app.aim.lifeos

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import app.aim.lifeos.billing.AimBillingBridge

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var billingBridge: AimBillingBridge

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
        }

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
            override fun onPermissionRequest(request: PermissionRequest) {
                // Do not grant WebView capabilities without the matching Android
                // runtime permission flow. Voice/device QA remains a release gate.
                request.deny()
            }
        }

        webView.loadUrl(BuildConfig.AIM_WEB_ORIGIN)
    }

    override fun onDestroy() {
        billingBridge.disconnect()
        webView.destroy()
        super.onDestroy()
    }
}
