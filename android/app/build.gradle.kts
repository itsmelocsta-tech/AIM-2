import groovy.json.JsonSlurper
import java.net.URI

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val launchOffer = JsonSlurper().parse(rootProject.file("../play-launch-offer.json")) as Map<*, *>
val webOrigin = (System.getenv("AIM_ANDROID_WEB_ORIGIN") ?: "https://aim-life-os.app").trimEnd('/')
val webUri = URI(webOrigin)
require(webUri.scheme == "https" && webUri.host != null && webUri.rawUserInfo == null &&
    webUri.path.isNullOrEmpty() && webUri.query == null && webUri.fragment == null) {
    "AIM_ANDROID_WEB_ORIGIN must be an HTTPS origin without a path, query, or credentials."
}

gradle.taskGraph.whenReady {
    if (allTasks.any { it.name in setOf("bundleRelease", "assembleRelease", "packageRelease") }) {
        require(!System.getenv("AIM_ANDROID_WEB_ORIGIN").isNullOrBlank()) {
            "Release requires the verified AIM_ANDROID_WEB_ORIGIN."
        }
        for (key in listOf("ANDROID_KEYSTORE_PATH", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD")) {
            require(!System.getenv(key).isNullOrBlank()) { "Release signing is missing $key." }
        }
    }
}

android {
    namespace = "app.aim.lifeos"
    compileSdk = 36

    defaultConfig {
        applicationId = "app.aim.lifeos"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        manifestPlaceholders["aimWebHost"] = webUri.host
        buildConfigField("String", "AIM_WEB_ORIGIN", "\"$webOrigin\"")
        buildConfigField("String", "PLAY_SUBSCRIPTION_PRODUCT_ID", "\"${launchOffer["subscriptionProductId"]}\"")
        buildConfigField("String", "PLAY_BASE_PLAN_ID", "\"${launchOffer["basePlanId"]}\"")
        buildConfigField("String", "PLAY_TRIAL_OFFER_ID", "\"${launchOffer["introductoryOfferId"]}\"")
        buildConfigField("boolean", "AIM_PAYMENTS_ENABLED", "${launchOffer["paymentsEnabled"] == true}")
    }

    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
            if (!keystorePath.isNullOrBlank()) {
                storeFile = file(keystorePath)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            val keystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
            if (!keystorePath.isNullOrBlank()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    bundle {
        language { enableSplit = true }
        density { enableSplit = true }
        abi { enableSplit = true }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.android.billingclient:billing-ktx:8.0.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
