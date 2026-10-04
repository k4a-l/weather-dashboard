import { Platform, Alert, NativeModules } from "react-native";
import type * as NotificationsType from "expo-notifications";
import { NotificationPayload } from "../types";

interface WakeupNotificationNativeModule {
	syncWakeupNotificationData(
		title: string,
		body: string,
		startHour: number,
		enabled: boolean,
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

let Notifications: typeof NotificationsType | null = null;
let isNativeNotificationAvailable = false;

try {
	Notifications = require("expo-notifications");
	if (
		Notifications &&
		typeof Notifications.setNotificationHandler === "function"
	) {
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
	console.warn(
		"expo-notifications native module is not available. Gracefully falling back.",
	);
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_WAKEUP_ENABLED = "@wakeup_notif_enabled";
const STORAGE_KEY_WAKEUP_START_HOUR = "@wakeup_notif_start_hour";
const STORAGE_KEY_WAKEUP_LAST_DATE = "@wakeup_notif_last_date";
const STORAGE_KEY_WAKEUP_TITLE = "@wakeup_notif_title";
const STORAGE_KEY_WAKEUP_BODY = "@wakeup_notif_body";

export const isExpoGoEnvironment = !isNativeNotificationAvailable;

export async function setupNotificationChannelAsync(): Promise<void> {
	const notif = Notifications;
	if (isNativeNotificationAvailable && notif && Platform.OS === "android") {
		try {
			await notif.setNotificationChannelAsync("weather-alerts", {
				name: "天気アラート",
				description:
					"毎日の天気予報と前日差、急変注意報をお知らせします",
				importance: notif.AndroidImportance.MAX,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: "#3B82F6",
				lockscreenVisibility:
					notif.AndroidNotificationVisibility.PUBLIC,
			});
		} catch (error) {
			console.warn("Notification channel setup warning:", error);
		}
	}
}

export async function requestNotificationPermissionsAsync(): Promise<boolean> {
	const notif = Notifications;
	if (!isNativeNotificationAvailable || !notif) {
		return false;
	}
	try {
		const { status: existingStatus } = await notif.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await notif.requestPermissionsAsync();
			finalStatus = status;
		}

		return finalStatus === "granted";
	} catch (error) {
		console.warn("Permission request error:", error);
		return false;
	}
}

export async function getExpoPushTokenAsync(): Promise<string | null> {
	const notif = Notifications;
	if (!isNativeNotificationAvailable || !notif) {
		return null;
	}
	try {
		const granted = await requestNotificationPermissionsAsync();
		if (!granted) {
			return null;
		}
		const tokenData = await notif.getExpoPushTokenAsync();
		return tokenData.data;
	} catch (error) {
		console.warn("Failed to get push token:", error);
		return null;
	}
}

export async function sendLocalNotificationAsync(
	payload: NotificationPayload,
): Promise<void> {
	const notif = Notifications;
	if (isNativeNotificationAvailable && notif) {
		await setupNotificationChannelAsync();
		await notif.scheduleNotificationAsync({
			content: {
				title: payload.title,
				body: payload.body,
				data: payload.data,
				sound: true,
			},
			trigger: null,
		});
	} else {
		Alert.alert(
			`【通知テスト】${payload.title}`,
			`${payload.body}\n\n（※ネイティブモジュール未リンク環境のためダイアログで表示しています）`,
		);
	}
}

/**
 * ロック解除・起床連動通知用の設定・天気キャッシュを同期
 */
export async function syncWakeupNotificationCacheAsync(
	title: string,
	body: string,
	startHour = 6,
	enabled = true,
): Promise<boolean> {
	if (wakeupNativeModule) {
		try {
			return await wakeupNativeModule.syncWakeupNotificationData(
				title,
				body,
				startHour,
				enabled,
			);
		} catch (error) {
			console.warn(
				"Failed to sync wakeup notification cache via native module:",
				error,
			);
		}
	}
	// フォールバック: AsyncStorage に保存
	try {
		await AsyncStorage.multiSet([
			[STORAGE_KEY_WAKEUP_TITLE, title],
			[STORAGE_KEY_WAKEUP_BODY, body],
			[STORAGE_KEY_WAKEUP_START_HOUR, String(startHour)],
			[STORAGE_KEY_WAKEUP_ENABLED, String(enabled)],
		]);
		return true;
	} catch (error) {
		console.warn("AsyncStorage fallback save error:", error);
		return false;
	}
}

/**
 * 起床連動通知のテスト発火
 */
export async function triggerTestWakeupNotificationAsync(): Promise<boolean> {
	if (wakeupNativeModule) {
		try {
			const success =
				await wakeupNativeModule.triggerTestWakeupNotification();
			if (success) return true;
		} catch (error) {
			console.warn(
				"Failed to trigger test wakeup notification via native module:",
				error,
			);
		}
	}
	// フォールバック: 保存されたキャッシュまたはデフォルト値で通知表示
	const title =
		(await AsyncStorage.getItem(STORAGE_KEY_WAKEUP_TITLE)) ||
		"【起床連動テスト】今日の天気";
	const body =
		(await AsyncStorage.getItem(STORAGE_KEY_WAKEUP_BODY)) ||
		"朝の画面ロック解除時に配信される最新天気予報です。";
	await sendLocalNotificationAsync({ title, body });
	return true;
}

/**
 * 本日の通知済み記録をリセット
 */
export async function resetWakeupLastNotifiedDateAsync(): Promise<boolean> {
	if (wakeupNativeModule) {
		try {
			const success = await wakeupNativeModule.resetLastNotifiedDate();
			if (success) return true;
		} catch (error) {
			console.warn(
				"Failed to reset wakeup notification date via native module:",
				error,
			);
		}
	}
	// フォールバック: AsyncStorage の日付をクリア
	try {
		await AsyncStorage.removeItem(STORAGE_KEY_WAKEUP_LAST_DATE);
		return true;
	} catch (error) {
		console.warn("AsyncStorage fallback reset error:", error);
		return false;
	}
}

/**
 * 起床連動通知の現在の設定・ステータスを取得
 */
export async function getWakeupNotificationStatusAsync(): Promise<{
	enabled: boolean;
	startHour: number;
	lastNotifiedDate: string;
	cachedTitle: string;
	cachedBody: string;
}> {
	if (wakeupNativeModule) {
		try {
			const status =
				await wakeupNativeModule.getWakeupNotificationStatus();
			if (status) return status;
		} catch (error) {
			console.warn(
				"Failed to get wakeup notification status via native module:",
				error,
			);
		}
	}
	// フォールバック: AsyncStorage から読み出し
	try {
		const [enabledVal, startHourVal, lastDateVal, titleVal, bodyVal] =
			await AsyncStorage.multiGet([
				STORAGE_KEY_WAKEUP_ENABLED,
				STORAGE_KEY_WAKEUP_START_HOUR,
				STORAGE_KEY_WAKEUP_LAST_DATE,
				STORAGE_KEY_WAKEUP_TITLE,
				STORAGE_KEY_WAKEUP_BODY,
			]);
		return {
			enabled: enabledVal[1] !== null ? enabledVal[1] === "true" : true,
			startHour:
				startHourVal[1] !== null ? parseInt(startHourVal[1], 10) : 6,
			lastNotifiedDate: lastDateVal[1] || "",
			cachedTitle: titleVal[1] || "",
			cachedBody: bodyVal[1] || "",
		};
	} catch (error) {
		console.warn("AsyncStorage fallback get error:", error);
		return {
			enabled: true,
			startHour: 6,
			lastNotifiedDate: "",
			cachedTitle: "",
			cachedBody: "",
		};
	}
}
