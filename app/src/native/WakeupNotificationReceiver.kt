package com.weatherdashboard.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class WakeupNotificationReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        android.util.Log.d("WakeupNotification", "onReceive action: $action")
        if (action != Intent.ACTION_USER_PRESENT &&
            action != Intent.ACTION_SCREEN_ON &&
            action != "com.weatherdashboard.app.ACTION_TRIGGER_WAKEUP_TEST") {
            return
        }

        val prefs = context.getSharedPreferences("WakeupNotificationPrefs", Context.MODE_PRIVATE)
        val enabled = prefs.getBoolean("enabled", true)
        if (!enabled) {
            android.util.Log.d("WakeupNotification", "Notification is disabled in settings")
            return
        }

        val startHour = prefs.getInt("startHour", 6)
        val isTest = action == "com.weatherdashboard.app.ACTION_TRIGGER_WAKEUP_TEST"

        val cal = Calendar.getInstance()
        val currentHour = cal.get(Calendar.HOUR_OF_DAY)
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

        val lastNotifiedDate = prefs.getString("lastNotifiedDate", "")
        android.util.Log.d("WakeupNotification", "check: currentHour=$currentHour, startHour=$startHour, lastNotified=$lastNotifiedDate, today=$todayStr, isTest=$isTest")

        if (!isTest) {
            if (currentHour < startHour) {
                android.util.Log.d("WakeupNotification", "Skipping: before startHour ($currentHour < $startHour)")
                return
            }
            if (lastNotifiedDate == todayStr) {
                android.util.Log.d("WakeupNotification", "Skipping: already notified today ($todayStr)")
                return
            }
        }

        val title = prefs.getString("cachedTitle", "【今日の天気予報】") ?: "【今日の天気予報】"
        val body = prefs.getString(
            "cachedBody",
            "最新の天気予報を確認しましょう。アプリを開いて詳細をご覧ください。"
        ) ?: "最新の天気予報を確認しましょう。"

        showNotification(context, title, body)
        prefs.edit().putString("lastNotifiedDate", todayStr).apply()
        android.util.Log.d("WakeupNotification", "Notification posted successfully. lastNotifiedDate set to $todayStr")
    }

    private fun showNotification(context: Context, title: String, body: String) {
        val channelId = "weather-alerts"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // 通知チャネルの作成 (Android 8.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "天気アラート",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "起床時の天気予報・前日差通知"
                enableVibration(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
            notificationManager.createNotificationChannel(channel)
        }

        // タップ時にMainActivityを開くIntent
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val appIcon = BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher)

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.notification_icon)
            .setLargeIcon(appIcon)
            .setContentTitle(title)
            .setContentText(body.lines().firstOrNull() ?: body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        val notificationId = 1001
        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build())
        } catch (e: SecurityException) {
            // Android 13+ 通知権限がない場合
        }
    }
}
