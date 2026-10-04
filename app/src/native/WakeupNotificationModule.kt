package com.weatherdashboard.app

import android.app.NotificationManager
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
        target: String,
        title: String,
        body: String,
        startHour: Double,
        enabled: Boolean,
        promise: Promise
    ) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("WakeupNotificationPrefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
            if (target == "tomorrow") {
                editor.putString("tomorrowCachedTitle", title)
                    .putString("tomorrowCachedBody", body)
                    .putInt("tomorrowStartHour", startHour.toInt())
                    .putBoolean("tomorrowEnabled", enabled)
            } else {
                editor.putString("cachedTitle", title)
                    .putString("cachedBody", body)
                    .putInt("startHour", startHour.toInt())
                    .putBoolean("enabled", enabled)
            }
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun triggerTestWakeupNotification(target: String, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, WakeupNotificationReceiver::class.java).apply {
                action = "com.weatherdashboard.app.ACTION_TRIGGER_WAKEUP_TEST"
                putExtra("target", target)
            }
            reactApplicationContext.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TEST_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun resetLastNotifiedDate(target: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("WakeupNotificationPrefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
            if (target == "tomorrow") {
                editor.remove("tomorrowLastNotifiedDate")
            } else if (target == "today") {
                editor.remove("lastNotifiedDate")
            } else {
                editor.remove("lastNotifiedDate")
                editor.remove("tomorrowLastNotifiedDate")
            }
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RESET_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelWakeupNotification(target: String, promise: Promise) {
        try {
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            when (target) {
                "today" -> notificationManager.cancel(1001)
                "tomorrow" -> notificationManager.cancel(1002)
                else -> {
                    notificationManager.cancel(1001)
                    notificationManager.cancel(1002)
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getWakeupNotificationStatus(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("WakeupNotificationPrefs", Context.MODE_PRIVATE)
            val todayMap = Arguments.createMap().apply {
                putBoolean("enabled", prefs.getBoolean("enabled", true))
                putInt("startHour", prefs.getInt("startHour", 6))
                putString("lastNotifiedDate", prefs.getString("lastNotifiedDate", "") ?: "")
                putString("cachedTitle", prefs.getString("cachedTitle", "") ?: "")
                putString("cachedBody", prefs.getString("cachedBody", "") ?: "")
            }
            val tomorrowMap = Arguments.createMap().apply {
                putBoolean("enabled", prefs.getBoolean("tomorrowEnabled", false))
                putInt("startHour", prefs.getInt("tomorrowStartHour", 18))
                putString("lastNotifiedDate", prefs.getString("tomorrowLastNotifiedDate", "") ?: "")
                putString("cachedTitle", prefs.getString("tomorrowCachedTitle", "") ?: "")
                putString("cachedBody", prefs.getString("tomorrowCachedBody", "") ?: "")
            }

            val result = Arguments.createMap().apply {
                putMap("today", todayMap)
                putMap("tomorrow", tomorrowMap)
                // 既存コード互換フィールド
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
