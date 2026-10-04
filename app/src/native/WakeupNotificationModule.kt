package com.weatherdashboard.app

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WakeupNotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WakeupNotificationModule"

    @ReactMethod
    fun syncWakeupNotificationData(
        title: String,
        body: String,
        startHour: Double,
        enabled: Boolean,
        promise: Promise
    ) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("WakeupNotificationPrefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("cachedTitle", title)
                .putString("cachedBody", body)
                .putInt("startHour", startHour.toInt())
                .putBoolean("enabled", enabled)
                .apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun triggerTestWakeupNotification(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, WakeupNotificationReceiver::class.java).apply {
                action = "com.weatherdashboard.app.ACTION_TRIGGER_WAKEUP_TEST"
            }
            reactApplicationContext.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TEST_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun resetLastNotifiedDate(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("WakeupNotificationPrefs", Context.MODE_PRIVATE)
            prefs.edit().remove("lastNotifiedDate").apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RESET_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getWakeupNotificationStatus(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("WakeupNotificationPrefs", Context.MODE_PRIVATE)
            val result = Arguments.createMap().apply {
                putBoolean("enabled", prefs.getBoolean("enabled", true))
                putInt("startHour", prefs.getInt("startHour", 6))
                putString("lastNotifiedDate", prefs.getString("lastNotifiedDate", "") ?: "")
                putString("cachedTitle", prefs.getString("cachedTitle", "") ?: "")
                putString("cachedBody", prefs.getString("cachedBody", "") ?: "")
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_STATUS_ERROR", e.message, e)
        }
    }
}
