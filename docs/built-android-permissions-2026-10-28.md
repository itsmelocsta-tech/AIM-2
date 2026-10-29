# Built Android permission inspection — October 28, 2026

Downloaded GitHub Actions artifact 12615607032 from run 40237115470, bound to release commit 6f2e447e03e6a817331a92f8945175cbe5c535ce. Inspected outputs/apk/debug/app-debug.apk using androguard APK binary-manifest parsing.

APK SHA256: 2a76d5d76816c514d5d8e0e4296abae5efa607a5d770e7eb96829e6e29d3bc6c
Package: app.aim.lifeos.debug
Target SDK: 36
Debuggable: true

Actual packaged permissions:
- android.permission.RECORD_AUDIO
- android.permission.INTERNET
- com.android.vending.BILLING
- app.aim.lifeos.debug.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
- android.permission.ACCESS_NETWORK_STATE

PASS: no contacts, coarse/precise/background location permissions in this built debug artifact. No removal needed. Internal dynamic receiver permission is present in packaged output. No production build, release signing, Play upload, purchase or physical-device test is claimed. Repeat binary inspection on final signed release AAB/APKs; this debug package is not a Play release.
