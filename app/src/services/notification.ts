import { Platform, Alert, NativeModules } from "react-native";
import type * as NotificationsType from "expo-notifications";
import { NotificationPayload } from "../types";

export type WakeupTarget = "today" | "tomorrow";

export interface WakeupSlotStatus {
	enabled: boolean;
	startHour: number;
	lastNotifiedDate: string;
	cachedTitle: string;
	cachedBody: string;
}

export interface WakeupNotificationStatusResult extends WakeupSlotStatus {
	today: WakeupSlotStatus;
	tomorrow: WakeupSlotStatus;
}

interface WakeupNotificationNativeModule {
	syncWakeupNotificationData(
		target: string,
		title: string,
		body: string,
		startHour: number,
		enabled: boolean,
	): Promise<boolean>;
	triggerTestWakeupNotification(target: string): Promise<boolean>;
	resetLastNotifiedDate(target: string): Promise<boolean>;
	getWakeupNotificationStatus(): Promise<WakeupNotificationStatusResult>;
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

const STORAGE_KEY_TOMORROW_ENABLED = "@tomorrow_notif_enabled";
const STORAGE_KEY_TOMORROW_START_HOUR = "@tomorrow_notif_start_hour";
const STORAGE_KEY_TOMORROW_LAST_DATE = "@tomorrow_notif_last_date";
const STORAGE_KEY_TOMORROW_TITLE = "@tomorrow_notif_title";
const STORAGE_KEY_TOMORROW_BODY = "@tomorrow_notif_body";

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
 * ロック解除・起床連動通知用の設定・天気キャッシュを同期（今日 or 明日）
 */
export async function syncWakeupNotificationCacheAsync(
	title: string,
	body: string,
	startHour = 6,
	enabled = true,
	target: WakeupTarget = "today",
): Promise<boolean> {
	if (wakeupNativeModule) {
		try {
			return await wakeupNativeModule.syncWakeupNotificationData(
				target,
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
		if (target === "tomorrow") {
			await AsyncStorage.multiSet([
				[STORAGE_KEY_TOMORROW_TITLE, title],
				[STORAGE_KEY_TOMORROW_BODY, body],
				[STORAGE_KEY_TOMORROW_START_HOUR, String(startHour)],
				[STORAGE_KEY_TOMORROW_ENABLED, String(enabled)],
			]);
		} else {
			await AsyncStorage.multiSet([
				[STORAGE_KEY_WAKEUP_TITLE, title],
				[STORAGE_KEY_WAKEUP_BODY, body],
				[STORAGE_KEY_WAKEUP_START_HOUR, String(startHour)],
				[STORAGE_KEY_WAKEUP_ENABLED, String(enabled)],
			]);
		}
		return true;
	} catch (error) {
		console.warn("AsyncStorage fallback save error:", error);
		return false;
	}
}

/**
 * 起床連動通知のテスト発火（今日 or 明日）
 */
export async function triggerTestWakeupNotificationAsync(
	target: WakeupTarget = "today",
): Promise<boolean> {
	if (wakeupNativeModule) {
		try {
			const success =
				await wakeupNativeModule.triggerTestWakeupNotification(target);
			if (success) return true;
		} catch (error) {
			console.warn(
				"Failed to trigger test wakeup notification via native module:",
				error,
			);
		}
	}
	// フォールバック: 保存されたキャッシュまたはデフォルト値で通知表示
	const isTomorrow = target === "tomorrow";
	const title =
		(await AsyncStorage.getItem(
			isTomorrow ? STORAGE_KEY_TOMORROW_TITLE : STORAGE_KEY_WAKEUP_TITLE,
		)) || (isTomorrow ? "【テスト】明日の天気" : "【テスト】今日の天気");
	const body =
		(await AsyncStorage.getItem(
			isTomorrow ? STORAGE_KEY_TOMORROW_BODY : STORAGE_KEY_WAKEUP_BODY,
		)) || "画面ロック解除時に配信される最新天気予報です。";
	await sendLocalNotificationAsync({ title, body });
	return true;
}

/**
 * 本日の通知済み記録をリセット
 */
export async function resetWakeupLastNotifiedDateAsync(
	target: WakeupTarget | "all" = "all",
): Promise<boolean> {
	if (wakeupNativeModule) {
		try {
			const success =
				await wakeupNativeModule.resetLastNotifiedDate(target);
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
		if (target === "today" || target === "all") {
			await AsyncStorage.removeItem(STORAGE_KEY_WAKEUP_LAST_DATE);
		}
		if (target === "tomorrow" || target === "all") {
			await AsyncStorage.removeItem(STORAGE_KEY_TOMORROW_LAST_DATE);
		}
		return true;
	} catch (error) {
		console.warn("AsyncStorage fallback reset error:", error);
		return false;
	}
}

/**
 * 起床連動通知の現在の設定・ステータスを取得
 */
export async function getWakeupNotificationStatusAsync(): Promise<WakeupNotificationStatusResult> {
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
		const [
			todayEnabledVal,
			todayStartHourVal,
			todayLastDateVal,
			todayTitleVal,
			todayBodyVal,
			tomorrowEnabledVal,
			tomorrowStartHourVal,
			tomorrowLastDateVal,
			tomorrowTitleVal,
			tomorrowBodyVal,
		] = await AsyncStorage.multiGet([
			STORAGE_KEY_WAKEUP_ENABLED,
			STORAGE_KEY_WAKEUP_START_HOUR,
			STORAGE_KEY_WAKEUP_LAST_DATE,
			STORAGE_KEY_WAKEUP_TITLE,
			STORAGE_KEY_WAKEUP_BODY,
			STORAGE_KEY_TOMORROW_ENABLED,
			STORAGE_KEY_TOMORROW_START_HOUR,
			STORAGE_KEY_TOMORROW_LAST_DATE,
			STORAGE_KEY_TOMORROW_TITLE,
			STORAGE_KEY_TOMORROW_BODY,
		]);

		const todayStatus: WakeupSlotStatus = {
			enabled:
				todayEnabledVal[1] !== null
					? todayEnabledVal[1] === "true"
					: true,
			startHour:
				todayStartHourVal[1] !== null
					? parseInt(todayStartHourVal[1], 10)
					: 6,
			lastNotifiedDate: todayLastDateVal[1] || "",
			cachedTitle: todayTitleVal[1] || "",
			cachedBody: todayBodyVal[1] || "",
		};

		const tomorrowStatus: WakeupSlotStatus = {
			enabled:
				tomorrowEnabledVal[1] !== null
					? tomorrowEnabledVal[1] === "true"
					: false,
			startHour:
				tomorrowStartHourVal[1] !== null
					? parseInt(tomorrowStartHourVal[1], 10)
					: 18,
			lastNotifiedDate: tomorrowLastDateVal[1] || "",
			cachedTitle: tomorrowTitleVal[1] || "",
			cachedBody: tomorrowBodyVal[1] || "",
		};

		return {
			...todayStatus,
			today: todayStatus,
			tomorrow: tomorrowStatus,
		};
	} catch (error) {
		console.warn("AsyncStorage fallback get error:", error);
		const defaultToday: WakeupSlotStatus = {
			enabled: true,
			startHour: 6,
			lastNotifiedDate: "",
			cachedTitle: "",
			cachedBody: "",
		};
		const defaultTomorrow: WakeupSlotStatus = {
			enabled: false,
			startHour: 18,
			lastNotifiedDate: "",
			cachedTitle: "",
			cachedBody: "",
		};
		return {
			...defaultToday,
			today: defaultToday,
			tomorrow: defaultTomorrow,
		};
	}
}
