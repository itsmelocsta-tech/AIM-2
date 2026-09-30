package com.itsmelocsta.aim;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.widget.Toast;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.credentials.CredentialManager;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.exceptions.GetCredentialException;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.android.billingclient.api.*;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

public class MainActivity extends Activity implements PurchasesUpdatedListener {
    private WebView web;
    private BillingClient billing;
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private JavaScriptReplyProxy reply;
    private String requestId;
    private String idToken;
    private boolean busy;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!request.isForMainFrame()) return false;
                if (BuildConfig.APP_ORIGIN.equals(uri.getScheme() + "://" + uri.getAuthority())) return false;
                if ("https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                }
                return true;
            }
        });
        // AndroidX injects this object only into this exact origin. No wildcard or unrestricted JS interface.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "AIMAuth", Collections.singleton(BuildConfig.APP_ORIGIN),
                (view, message, origin, mainFrame, proxy) -> {
                    if (!mainFrame || !BuildConfig.APP_ORIGIN.equals(origin.toString())) return;
                    try {
                        JSONObject data = new JSONObject(message.getData());
                        if (!"googleSignIn".equals(data.getString("action"))) return;
                        String id = data.getString("id");
                        if (id.length() > 100) return;
                        runOnUiThread(() -> signInWithGoogle(proxy, id));
                    } catch (Exception ignored) {}
                });
            WebViewCompat.addWebMessageListener(web, "AIMPlay", Collections.singleton(BuildConfig.APP_ORIGIN),
                (view, message, origin, mainFrame, proxy) -> {
                    if (!mainFrame || !BuildConfig.APP_ORIGIN.equals(origin.toString())) return;
                    try {
                        JSONObject data = new JSONObject(message.getData());
                        if (busy) { proxy.postMessage(new JSONObject().put("id", data.getString("id")).put("error", "Another billing request is running").toString()); return; }
                        String action = data.getString("action");
                        if (!action.equals("purchase") && !action.equals("restore")) return;
                        idToken = data.getString("idToken");
                        requestId = data.getString("id");
                        if (idToken.length() > 8192 || requestId.length() > 100) return;
                        reply = proxy; busy = true;
                        network.execute(() -> {
                            try {
                                JSONObject config = request("/config", null);
                                if (action.equals("purchase") && !config.getBoolean("paymentsEnabled")) throw new Exception("Purchases are not enabled yet");
                                runOnUiThread(() -> connect(() -> { if (action.equals("purchase")) purchase(config); else restore(); }));
                            } catch (Exception e) { fail("Billing is unavailable or purchases are not enabled yet"); }
                        });
                    } catch (Exception ignored) {}
                });
        } else Toast.makeText(this, "Update Android System WebView to use subscription tools", Toast.LENGTH_LONG).show();
        billing = BillingClient.newBuilder(this).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
        web.loadUrl(BuildConfig.APP_ORIGIN);
    }
    private void authReply(JavaScriptReplyProxy proxy, String id, String token, String error) {
        try {
            JSONObject response = new JSONObject().put("id", id);
            if (error != null) response.put("error", error); else response.put("idToken", token);
            proxy.postMessage(response.toString());
        } catch (Exception ignored) {}
    }
    private void signInWithGoogle(JavaScriptReplyProxy proxy, String id) {
        if (BuildConfig.GOOGLE_WEB_CLIENT_ID.isEmpty()) {
            authReply(proxy, id, null, "Google sign-in needs its Android client setup. Use email sign-in for now.");
            return;
        }
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_WEB_CLIENT_ID).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        CredentialManager.create(this).getCredentialAsync(this, request, null, getMainExecutor(),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override public void onResult(GetCredentialResponse result) {
                    try {
                        if (!(result.getCredential() instanceof CustomCredential)) throw new Exception();
                        CustomCredential credential = (CustomCredential) result.getCredential();
                        if (!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) throw new Exception();
                        authReply(proxy, id, GoogleIdTokenCredential.createFrom(credential.getData()).getIdToken(), null);
                    } catch (Exception e) { authReply(proxy, id, null, "Google sign-in could not be completed."); }
                }
                @Override public void onError(GetCredentialException error) {
                    authReply(proxy, id, null, "Google sign-in was canceled or unavailable.");
                }
            });
    }
    private void connect(Runnable action) {
        if (billing.isReady()) { action.run(); return; }
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) action.run();
                else fail("Could not connect to Google Play. Try again.");
            }
            @Override public void onBillingServiceDisconnected() {}
        });
    }
    private void purchase(JSONObject config) {
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
            .setProductId(BuildConfig.PRODUCT_ID).setProductType(BillingClient.ProductType.SUBS).build();
        billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(product)).build(),
            (result, detailsResult) -> runOnUiThread(() -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || detailsResult.getProductDetailsList().isEmpty()) {
                    fail("AIM subscription is unavailable in Google Play"); return;
                }
                ProductDetails details = detailsResult.getProductDetailsList().get(0);
                ProductDetails.SubscriptionOfferDetails selected = null;
                if (details.getSubscriptionOfferDetails() != null) for (ProductDetails.SubscriptionOfferDetails item : details.getSubscriptionOfferDetails()) {
                    if (!item.getBasePlanId().equals(config.optString("basePlanId"))) continue;
                    if (config.optString("offerId").equals(item.getOfferId())) { selected = item; break; }
                    if (item.getOfferId() == null) selected = item;
                }
                if (selected == null) { fail("No eligible monthly plan is available"); return; }
                StringBuilder disclosure = new StringBuilder("AIM Premium subscription\n\n");
                for (ProductDetails.PricingPhase phase : selected.getPricingPhases().getPricingPhaseList()) {
                    String period = phase.getBillingPeriod();
                    String duration = period.equals("P1M") ? "month" : period.equals("P3D") ? "3 days" : period;
                    disclosure.append(phase.getPriceAmountMicros() == 0 ? "Free for " + duration : phase.getFormattedPrice() + " per " + duration).append("\n");
                }
                disclosure.append("\nAutomatically renews until canceled. Cancel any time in Google Play subscriptions.");
                ProductDetails.SubscriptionOfferDetails chosen = selected;
                new AlertDialog.Builder(this).setTitle("AIM Premium").setMessage(disclosure.toString())
                    .setNegativeButton("Cancel", (dialog, which) -> fail("Purchase canceled"))
                    .setOnCancelListener(dialog -> fail("Purchase canceled"))
                    .setPositiveButton("Continue to Google Play", (dialog, which) -> {
                        BillingFlowParams.ProductDetailsParams params = BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details).setOfferToken(chosen.getOfferToken()).build();
                        BillingResult launched = billing.launchBillingFlow(this, BillingFlowParams.newBuilder()
                            .setProductDetailsParamsList(Collections.singletonList(params))
                            .setObfuscatedAccountId(config.optString("accountId")).build());
                        if (launched.getResponseCode() != BillingClient.BillingResponseCode.OK) fail("Purchase could not start");
                    }).show();
            }));
    }
    private void restore() {
        billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
            (result, purchases) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { fail("Restoration failed. Retry later."); return; }
                process(purchases);
            });
    }
    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (!busy) return; // Deferred purchases are recovered with restoration after signing in.
        if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) { restore(); return; }
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { fail("Purchase canceled or unavailable"); return; }
        process(purchases);
    }
    private void process(List<Purchase> purchases) {
        if (purchases != null) for (Purchase purchase : purchases) {
            if (!purchase.getProducts().contains(BuildConfig.PRODUCT_ID)) continue;
            if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) { fail("Payment is pending. Restore after payment completes."); return; }
            network.execute(() -> {
                try { finish(request("/verify", new JSONObject().put("purchaseToken", purchase.getPurchaseToken())), null); }
                catch (Exception e) { fail("Purchase verification failed. Restore later; no paid access was granted."); }
            });
            return;
        }
        finish(new JSONObject(), "No AIM subscription found for this Google Play account");
    }
    private JSONObject request(String path, JSONObject body) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(BuildConfig.APP_ORIGIN + "/api/aim/billing" + path).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(15000); connection.setReadTimeout(30000);
        connection.setRequestProperty("Authorization", "Bearer " + idToken);
        try {
            if (body != null) {
                connection.setRequestMethod("POST"); connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json");
                try (java.io.OutputStream out = connection.getOutputStream()) { out.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
            }
            if (connection.getResponseCode() != 200) throw new Exception("Billing backend unavailable");
            try (java.io.InputStream in = connection.getInputStream()) { java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
                byte[] buffer = new byte[4096]; int count;
                while ((count = in.read(buffer)) != -1) bytes.write(buffer, 0, count);
                return new JSONObject(bytes.toString("UTF-8")); }
        } finally { connection.disconnect(); }
    }
    private void fail(String message) { finish(null, message); }
    private void finish(JSONObject data, String error) {
        runOnUiThread(() -> {
            if (!busy) return;
            try {
                JSONObject response = new JSONObject().put("id", requestId);
                if (error != null) response.put("error", error); else response.put("data", data);
                reply.postMessage(response.toString());
            } catch (Exception ignored) {}
            busy = false; idToken = null; reply = null;
        });
    }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { if (billing != null) billing.endConnection(); network.shutdownNow(); web.destroy(); super.onDestroy(); }
}
