import { Platform, Alert, NativeModules } from "react-native";
import * as Notifications from "expo-notifications";
import { NotificationPayload } from "../types";

interface WakeupNotificationNativeModule {
    syncWakeupNotificationData(
        title: string,
        body: string,
        startHour: number,
        enabled: boolean
    ): Promise<boolean>;
    triggerTestWakeupNotification(): Promise<boolean>;
    resetLastNotifiedDate(): Promise<boolean>;
    getWakeupNotificationStatus(): Promise<{
        enabled: boolean;
        startHour: number;
        lastNotifiedDate: string;
        cachedTitle: string;
        cachedBody: string;
    }>;
}

const wakeupNativeModule: WakeupNotificationNativeModule | null =
    NativeModules.WakeupNotificationModule ?? null;

let isNativeNotificationAvailable = false;

try {
    if (Notifications && typeof Notifications.setNotificationHandler === "function") {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        isNativeNotificationAvailable = true;
    }
} catch {
    console.warn("expo-notifications native module is not available. Gracefully falling back.");
}

export const isExpoGoEnvironment = !isNativeNotificationAvailable;

export async function setupNotificationChannelAsync(): Promise<void> {
    if (isNativeNotificationAvailable && Platform.OS === "android") {
        try {
            await Notifications.setNotificationChannelAsync("weather-alerts", {
                name: "天気アラート",
                description: "毎日の天気予報と前日差、急変注意報をお知らせします",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#3B82F6",
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            });
        } catch (error) {
            console.warn("Notification channel setup warning:", error);
        }
    }
}

export async function requestNotificationPermissionsAsync(): Promise<boolean> {
    if (!isNativeNotificationAvailable) {
        return false;
    }
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === "granted";
    } catch (error) {
        console.warn("Permission request error:", error);
        return false;
    }
}

export async function getExpoPushTokenAsync(): Promise<string | null> {
    if (!isNativeNotificationAvailable) {
        return null;
    }
    try {
        const granted = await requestNotificationPermissionsAsync();
        if (!granted) {
            return null;
        }
        const tokenData = await Notifications.getExpoPushTokenAsync();
        return tokenData.data;
    } catch (error) {
        console.warn("Failed to get push token:", error);
        return null;
    }
}

export async function sendLocalNotificationAsync(payload: NotificationPayload): Promise<void> {
    if (isNativeNotificationAvailable) {
        await setupNotificationChannelAsync();
        await Notifications.scheduleNotificationAsync({
            content: {
                title: payload.title,
                body: payload.body,
                data: payload.data,
                sound: true,
            },
            trigger: null,
        });
    } else {
        // Expo Go 上でのプレビュー表示
        Alert.alert(
            `🔔 [通知プレビュー] ${payload.title}`,
            `${payload.body}\n\n※Expo Go環境のためダイアログプレビューを表示しています。実機通知バーへの配信には開発ビルド（npx expo run:android）を使用します。`
        );
    }
}

/**
 * ロック解除・起床連動通知用のネイティブ設定・天気キャッシュを同期
 */
export async function syncWakeupNotificationCacheAsync(
    title: string,
    body: string,
    startHour = 6,
    enabled = true
): Promise<boolean> {
    if (!wakeupNativeModule) {
        return false;
    }
    try {
        return await wakeupNativeModule.syncWakeupNotificationData(title, body, startHour, enabled);
    } catch (error) {
        console.warn("Failed to sync wakeup notification cache:", error);
        return false;
    }
}

/**
 * 起床連動通知のテスト発火（指定時刻制限をバイパスして即時通知をテスト）
 */
export async function triggerTestWakeupNotificationAsync(): Promise<boolean> {
    if (!wakeupNativeModule) {
        return false;
    }
    try {
        return await wakeupNativeModule.triggerTestWakeupNotification();
    } catch (error) {
        console.warn("Failed to trigger test wakeup notification:", error);
        return false;
    }
}

/**
 * 本日の通知済み記録をリセット（テストや再通知用）
 */
export async function resetWakeupLastNotifiedDateAsync(): Promise<boolean> {
    if (!wakeupNativeModule) {
        return false;
    }
    try {
        return await wakeupNativeModule.resetLastNotifiedDate();
    } catch (error) {
        console.warn("Failed to reset wakeup notification date:", error);
        return false;
    }
}

/**
 * 起床通知のネイティブ設定状態を取得
 */
export async function getWakeupNotificationStatusAsync() {
    if (!wakeupNativeModule) {
        return null;
    }
    try {
        return await wakeupNativeModule.getWakeupNotificationStatus();
    } catch (error) {
        console.warn("Failed to get wakeup notification status:", error);
        return null;
    }
}

