package com.weatherdashboard.app

import android.content.Context
import android.content.res.Configuration
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppSettingsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppSettingsModule"

    @ReactMethod
    fun getUiScale(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppSettingsPrefs", Context.MODE_PRIVATE)
            val scale = prefs.getFloat("ui_scale", 1.0f)
            promise.resolve(scale.toDouble())
        } catch (e: Exception) {
            promise.resolve(1.0)
        }
    }

    @ReactMethod
    fun setUiScale(scale: Double, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppSettingsPrefs", Context.MODE_PRIVATE)
            prefs.edit().putFloat("ui_scale", scale.toFloat()).apply()

            val activity = reactApplicationContext.currentActivity
            activity?.runOnUiThread {
                val res = activity.resources
                val config = Configuration(res.configuration)
                config.fontScale = scale.toFloat()
                val metrics = res.displayMetrics
                metrics.scaledDensity = metrics.density * config.fontScale
                @Suppress("DEPRECATION")
                res.updateConfiguration(config, metrics)

                val appRes = reactApplicationContext.resources
                val appConfig = Configuration(appRes.configuration)
                appConfig.fontScale = scale.toFloat()
                val appMetrics = appRes.displayMetrics
                appMetrics.scaledDensity = appMetrics.density * appConfig.fontScale
                @Suppress("DEPRECATION")
                appRes.updateConfiguration(appConfig, appMetrics)

                activity.onConfigurationChanged(config)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_SCALE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun reloadApp(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            activity?.runOnUiThread {
                activity.recreate()
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RELOAD_ERROR", e.message, e)
        }
    }
}
