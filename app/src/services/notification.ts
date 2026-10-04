import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { NotificationPayload } from "../types";

// アプリ起動中の通知表示設定（フォアグラウンドでもバナー表示）
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export async function setupNotificationChannelAsync(): Promise<void> {
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync("weather-alerts", {
			name: "天気アラート",
			description: "毎日の天気予報と前日差、急変注意報をお知らせします",
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: "#3B82F6",
			lockscreenVisibility:
				Notifications.AndroidNotificationVisibility.PUBLIC,
			sound: "default",
		});
	}
}

export async function requestNotificationPermissionsAsync(): Promise<boolean> {
	const { status: existingStatus } =
		await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== "granted") {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	return finalStatus === "granted";
}

export async function getExpoPushTokenAsync(): Promise<string | null> {
	try {
		if (!Device.isDevice) {
			console.log(
				"Push notifications token can only be acquired on a physical device or configured simulator.",
			);
			return null;
		}

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

export async function sendLocalNotificationAsync(
	payload: NotificationPayload,
): Promise<void> {
	await setupNotificationChannelAsync();
	await Notifications.scheduleNotificationAsync({
		content: {
			title: payload.title,
			body: payload.body,
			data: payload.data,
			sound: true,
		},
		trigger: null, // 即時発火
	});
}
