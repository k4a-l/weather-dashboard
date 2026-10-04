import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	TextInput,
} from "react-native";
import { NotificationPayload } from "../types";
import { sendLocalNotificationAsync } from "../services/notification";

interface Props {
	notificationPayload: NotificationPayload;
	pushToken: string | null;
	currentCityId: string;
}

export const NotificationControlCard: React.FC<Props> = ({
	notificationPayload,
	pushToken,
	currentCityId,
}) => {
	// AndroidエミュレータからホストPCを見るIPは 10.0.2.2
	const [workerUrl, setWorkerUrl] = useState("http://10.0.2.2:8787");
	const [isSending, setIsSending] = useState(false);

	const handleLocalTestNotification = async () => {
		try {
			await sendLocalNotificationAsync(notificationPayload);
			Alert.alert(
				"通知送信完了",
				"端末の通知エリアに天気通知が届いたか確認してください。",
			);
		} catch (error: any) {
			Alert.alert(
				"エラー",
				`ローカル通知の送信に失敗しました: ${error.message}`,
			);
		}
	};

	const handleWorkerPushTest = async () => {
		if (!workerUrl.trim()) {
			Alert.alert("エラー", "WorkerのURLを入力してください。");
			return;
		}

		setIsSending(true);
		try {
			const res = await fetch(
				`${workerUrl.replace(/\/$/, "")}/send-test`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						token: pushToken || undefined,
						cityId: currentCityId,
					}),
				},
			);

			const data = await res.json();
			if (res.ok) {
				Alert.alert(
					"Cloudflare Workers 連携成功",
					`サーバーから通知リクエストが処理されました。\n送信先数: ${data.sentCount || 0}`,
				);
			} else {
				Alert.alert("Workerエラー", data.error || JSON.stringify(data));
			}
		} catch (error: any) {
			Alert.alert(
				"通信エラー",
				`Workerとの接続に失敗しました: ${error.message}\nローカル通知テストは上のボタンから実行できます。`,
			);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<View style={styles.card}>
			<Text style={styles.title}>🔔 通知テスト・配信設定</Text>
			<Text style={styles.subtitle}>
				通知トレイでの表示状態（前日比・服装・特記事項）を今すぐテストできます
			</Text>

			{/* 即時ローカル通知ボタン */}
			<TouchableOpacity
				style={styles.localButton}
				onPress={handleLocalTestNotification}
			>
				<Text style={styles.localButtonText}>
					📲 端末にテスト通知を即座に表示
				</Text>
			</TouchableOpacity>

			{/* Cloudflare Workers 連携セクション */}
			<View style={styles.workerSection}>
				<Text style={styles.sectionLabel}>
					☁️ Cloudflare Workers 連携テスト
				</Text>
				<TextInput
					style={styles.input}
					value={workerUrl}
					onChangeText={setWorkerUrl}
					placeholder="Worker URL (例: https://weather-worker.xxx.workers.dev)"
					autoCapitalize="none"
				/>
				<TouchableOpacity
					style={[
						styles.workerButton,
						isSending && styles.buttonDisabled,
					]}
					onPress={handleWorkerPushTest}
					disabled={isSending}
				>
					<Text style={styles.workerButtonText}>
						{isSending
							? "送信中..."
							: "サーバー経由プッシュ通知テスト"}
					</Text>
				</TouchableOpacity>
			</View>

			{/* トークン情報 */}
			<View style={styles.tokenBox}>
				<Text style={styles.tokenLabel}>Expo Push Token:</Text>
				<Text
					style={styles.tokenValue}
					numberOfLines={1}
					ellipsizeMode="middle"
				>
					{pushToken ? pushToken : "実機での起動時に自動発行されます"}
				</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 18,
		marginHorizontal: 16,
		marginVertical: 8,
		marginBottom: 28,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.06,
		shadowRadius: 10,
		elevation: 2,
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#1F2937",
	},
	subtitle: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 2,
		marginBottom: 14,
	},
	localButton: {
		backgroundColor: "#2563EB",
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
		marginBottom: 16,
	},
	localButtonText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "bold",
	},
	workerSection: {
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		paddingTop: 12,
	},
	sectionLabel: {
		fontSize: 13,
		fontWeight: "bold",
		color: "#374151",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 12,
		color: "#111827",
		marginBottom: 8,
	},
	workerButton: {
		backgroundColor: "#4B5563",
		borderRadius: 10,
		paddingVertical: 10,
		alignItems: "center",
	},
	workerButtonText: {
		color: "#FFFFFF",
		fontSize: 13,
		fontWeight: "600",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	tokenBox: {
		marginTop: 12,
		backgroundColor: "#F3F4F6",
		padding: 8,
		borderRadius: 8,
	},
	tokenLabel: {
		fontSize: 10,
		color: "#6B7280",
		fontWeight: "600",
	},
	tokenValue: {
		fontSize: 11,
		color: "#374151",
		marginTop: 2,
	},
});
