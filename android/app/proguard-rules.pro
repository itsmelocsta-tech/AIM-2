-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class app.aim.lifeos.billing.AimBillingBridge { *; }
-keep class com.android.billingclient.api.** { *; }
