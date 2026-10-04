import { NotificationPayload } from "../types";

export interface ExpoPushMessage {
	to: string;
	title: string;
	body: string;
	sound?: string;
	priority?: "default" | "normal" | "high";
	channelId?: string;
	data?: Record<string, unknown>;
}

export async function sendExpoPushNotifications(
	tokens: string[],
	payload: NotificationPayload,
): Promise<{ success: boolean; count: number; details?: any }> {
	if (tokens.length === 0) {
		return { success: true, count: 0 };
	}

	const messages: ExpoPushMessage[] = tokens.map((token) => ({
		to: token,
		title: payload.title,
		body: payload.body,
		sound: "default",
		priority: "high",
		channelId: "weather-alerts",
		data: payload.data,
	}));

	// Expo Push APIは最大100件ずつ送信可能
	const chunks: ExpoPushMessage[][] = [];
	for (let i = 0; i < messages.length; i += 100) {
		chunks.push(messages.slice(i, i + 100));
	}

	const results = [];
	for (const chunk of chunks) {
		const response = await fetch("https://exp.host/--/api/v2/push/send", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Accept-Encoding": "gzip, deflate",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(chunk),
		});

		const data = await response.json();
		results.push(data);
	}

	return {
		success: true,
		count: tokens.length,
		details: results,
	};
}
