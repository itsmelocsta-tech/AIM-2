package app.aim.lifeos.billing

import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import app.aim.lifeos.TrustedOrigin
import app.aim.lifeos.BuildConfig
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import java.security.MessageDigest
import org.json.JSONArray
import org.json.JSONObject

/**
 * Native Google Play Billing v8 bridge for AIM Life OS.
 *
 * Security invariants:
 * 1. Never grants Premium access locally from client state or device clock.
 * 2. Always binds BillingFlowParams.setObfuscatedAccountId(hashPlayAccountId(firebaseUid)) so the purchase token
 *    is associated by Google Play with the Firebase UID; server verification enforces ownership.
 * 3. Emits purchase tokens to the web layer strictly so the backend (/api/aim/billing/verify
 *    and /api/aim/billing/restore) can verify and acknowledge them via Google Play Developer API.
 */
class AimBillingBridge(
    private val activity: AppCompatActivity,
    private val webView: WebView,
    private val allowedOrigin: String
) : PurchasesUpdatedListener {

    @Volatile
    private var isConnected: Boolean = false

    @Volatile
    private var cachedProductDetails: ProductDetails? = null

    private val billingClient: BillingClient = BillingClient.newBuilder(activity)
        .setListener(this)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .build()
        )
        .build()

    fun install(): Boolean {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER) ||
            !WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return false
        WebViewCompat.addWebMessageListener(webView, "AimPlayBillingChannel", setOf(allowedOrigin)) {
                _, message, sourceOrigin, isMainFrame, _ ->
            if (!isMainFrame || !TrustedOrigin.matches(sourceOrigin.toString(), allowedOrigin)) return@addWebMessageListener
            val command = runCatching { JSONObject(message.data ?: "") }.getOrNull() ?: return@addWebMessageListener
            when (command.optString("action")) {
                "status" -> dispatchToWeb("aim:play-billing-status", JSONObject(getBridgeStatusJson()))
                "purchase" -> launchSubscriptionPurchase(command.optString("uid"), command.optBoolean("preferTrial", true))
                "restore" -> queryPurchasesForRestore(command.optString("uid"))
                "manage" -> openManageSubscriptions()
            }
        }
        // Preserve the existing web API without exposing Java methods to foreign frames.
        WebViewCompat.addDocumentStartJavaScript(webView, """
            (() => {
                if (window.top !== window) return;
                let status = { platform: 'android_play', billingReady: false };
                const send = payload => window.AimPlayBillingChannel.postMessage(JSON.stringify(payload));
                window.addEventListener('aim:play-billing-status', event => { status = event.detail; });
                window.AimPlayBilling = {
                    getBridgeStatusJson: () => { send({ action: 'status' }); return JSON.stringify(status); },
                    launchSubscriptionPurchase: (uid, preferTrial) => send({ action: 'purchase', uid, preferTrial }),
                    queryPurchasesForRestore: uid => send({ action: 'restore', uid }),
                    openManageSubscriptions: () => send({ action: 'manage' })
                };
                send({ action: 'status' });
            })();
        """.trimIndent(), setOf(allowedOrigin))
        return true
    }

    fun connect() {
        if (billingClient.isReady) {
            isConnected = true
            querySubscriptionDetails()
            return
        }
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                isConnected = billingResult.responseCode == BillingClient.BillingResponseCode.OK
                if (isConnected) {
                    querySubscriptionDetails()
                }
            }

            override fun onBillingServiceDisconnected() {
                isConnected = false
            }
        })
    }

    fun disconnect() {
        if (billingClient.isReady) {
            billingClient.endConnection()
        }
        isConnected = false
    }

    private fun querySubscriptionDetails(onReady: (() -> Unit)? = null) {
        val productList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(BuildConfig.PLAY_SUBSCRIPTION_PRODUCT_ID)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsResult ->
            val productDetailsList = productDetailsResult.productDetailsList
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && productDetailsList.isNotEmpty()) {
                cachedProductDetails = productDetailsList.firstOrNull()
                dispatchToWeb("aim:play-billing-status", JSONObject(getBridgeStatusJson()))
                onReady?.invoke()
            } else {
                dispatchToWeb(
                    "aim:play-billing-error",
                    JSONObject()
                        .put("code", billingResult.responseCode)
                        .put("message", "Unable to load Google Play subscription details.")
                )
            }
        }
    }

    private fun hashPlayAccountId(uid: String): String = MessageDigest.getInstance("SHA-256")
        .digest(uid.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }

    fun getBridgeStatusJson(): String {
        val details = cachedProductDetails
        val offers = details?.subscriptionOfferDetails ?: emptyList()
        val hasTrialOffer = offers.any { it.basePlanId == BuildConfig.PLAY_BASE_PLAN_ID && it.offerId == BuildConfig.PLAY_TRIAL_OFFER_ID }
        val hasMonthlyBasePlan = offers.any { it.basePlanId == BuildConfig.PLAY_BASE_PLAN_ID }
        return JSONObject()
            .put("platform", "android_play")
            .put("packageName", activity.packageName)
            .put("billingReady", isConnected && details != null && hasMonthlyBasePlan)
            .put("productId", BuildConfig.PLAY_SUBSCRIPTION_PRODUCT_ID)
            .put("basePlanId", BuildConfig.PLAY_BASE_PLAN_ID)
            .put("trialOfferId", BuildConfig.PLAY_TRIAL_OFFER_ID)
            .put("trialEligible", hasTrialOffer)
            .toString()
    }

    fun launchSubscriptionPurchase(firebaseUid: String, preferTrialOffer: Boolean) {
        if (!BuildConfig.AIM_PAYMENTS_ENABLED) {
            dispatchToWeb("aim:play-billing-error", JSONObject().put("message", "Purchases are not enabled yet."))
            return
        }
        if (firebaseUid.isBlank()) {
            dispatchToWeb(
                "aim:play-billing-error",
                JSONObject().put("message", "Sign in before starting a Google Play subscription.")
            )
            return
        }

        val launchWithDetails = { details: ProductDetails ->
            val offers = details.subscriptionOfferDetails ?: emptyList()
            val selectedOffer = (if (preferTrialOffer) {
                offers.firstOrNull {
                    it.basePlanId == BuildConfig.PLAY_BASE_PLAN_ID &&
                        it.offerId == BuildConfig.PLAY_TRIAL_OFFER_ID
                }
            } else offers.firstOrNull {
                it.basePlanId == BuildConfig.PLAY_BASE_PLAN_ID && it.offerId == null
            })

            if (selectedOffer == null) {
                dispatchToWeb(
                    "aim:play-billing-error",
                    JSONObject().put("message", "The monthly AIM Premium plan is not available in Google Play yet.")
                )
            } else {
                val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .setOfferToken(selectedOffer.offerToken)
                    .build()

                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(listOf(productDetailsParams))
                    .setObfuscatedAccountId(hashPlayAccountId(firebaseUid))
                    .build()

                activity.runOnUiThread {
                    val result = billingClient.launchBillingFlow(activity, flowParams)
                    if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                        dispatchToWeb("aim:play-billing-error", JSONObject().put("code", result.responseCode).put("message", "Google Play could not open the purchase sheet."))
                    }
                }
            }
        }

        // Offer eligibility and details can change; query again at purchase time.
        querySubscriptionDetails {
            cachedProductDetails?.let(launchWithDetails)
        }
    }


    fun queryPurchasesForRestore(firebaseUid: String) {
        if (!billingClient.isReady) {
            connect()
            dispatchToWeb(
                "aim:play-billing-error",
                JSONObject().put("message", "Google Play Billing is reconnecting. Please try again.")
            )
            return
        }
        if (firebaseUid.isBlank()) return
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        billingClient.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
                dispatchToWeb(
                    "aim:play-billing-error",
                    JSONObject()
                        .put("code", billingResult.responseCode)
                        .put("message", "Could not read your Google Play subscriptions.")
                )
                return@queryPurchasesAsync
            }

            val items = JSONArray()
            for (purchase in purchases.filter { BuildConfig.PLAY_SUBSCRIPTION_PRODUCT_ID in it.products }) {
                items.put(serializePurchase(purchase, firebaseUid))
            }
            dispatchToWeb(
                "aim:play-purchases-restored",
                JSONObject().put("purchases", items)
            )
        }
    }

    fun openManageSubscriptions() {
        val uri = Uri.parse(
            "https://play.google.com/store/account/subscriptions?sku=${BuildConfig.PLAY_SUBSCRIPTION_PRODUCT_ID}&package=${activity.packageName}"
        )
        openExternalUri(uri)
    }

    fun openExternalUri(uri: Uri) {
        activity.runOnUiThread {
            if (uri.scheme !in setOf("https", "mailto", "tel")) return@runOnUiThread
            val intent = Intent(Intent.ACTION_VIEW, uri)
            runCatching { activity.startActivity(intent) }
        }
    }

    override fun onPurchasesUpdated(
        billingResult: BillingResult,
        purchases: MutableList<Purchase>?
    ) {
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val list = purchases ?: emptyList()
                for (purchase in list.filter { BuildConfig.PLAY_SUBSCRIPTION_PRODUCT_ID in it.products }) {
                    dispatchToWeb("aim:play-purchase-updated", serializePurchase(purchase, null))
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                dispatchToWeb(
                    "aim:play-billing-canceled",
                    JSONObject().put("message", "Google Play purchase was canceled.")
                )
            }
            else -> {
                dispatchToWeb(
                    "aim:play-billing-error",
                    JSONObject()
                        .put("code", billingResult.responseCode)
                        .put("message", "Google Play could not complete the purchase.")
                )
            }
        }
    }

    private fun serializePurchase(purchase: Purchase, fallbackUid: String?): JSONObject {
        val productId = purchase.products.firstOrNull() ?: BuildConfig.PLAY_SUBSCRIPTION_PRODUCT_ID
        val obfuscatedAccountId = purchase.accountIdentifiers?.obfuscatedAccountId ?: fallbackUid
        return JSONObject()
            .put("packageName", purchase.packageName.ifBlank { activity.packageName })
            .put("productId", productId)
            .put("purchaseToken", purchase.purchaseToken)
            .put("purchaseState", purchase.purchaseState)
            .put("isAcknowledged", purchase.isAcknowledged)
            .put("isAutoRenewing", purchase.isAutoRenewing)
            .put("obfuscatedAccountId", obfuscatedAccountId)
    }

    private fun dispatchToWeb(eventName: String, payload: JSONObject) {
        activity.runOnUiThread {
            val currentUrl = webView.url ?: ""
            if (!TrustedOrigin.matches(currentUrl, allowedOrigin)) return@runOnUiThread
            val escapedEvent = JSONObject.quote(eventName)
            val script = "window.dispatchEvent(new CustomEvent($escapedEvent, { detail: ${payload.toString()} }));"
            webView.evaluateJavascript(script, null)
        }
    }
}
