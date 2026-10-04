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
import {
	sendLocalNotificationAsync,
	triggerTestWakeupNotificationAsync,
	resetWakeupLastNotifiedDateAsync,
} from "../services/notification";
import { Section, SectionHeader } from "./Section";

interface Props {
	notificationPayload: NotificationPayload;
	pushToken: string | null;
	currentCityId: string;
}

export const NotificationControlCard: React.FC<Props> = React.memo(({
	notificationPayload,
	pushToken,
	currentCityId,
}) => {
	const [workerUrl, setWorkerUrl] = useState("http://10.0.2.2:8787");
	const [isSending, setIsSending] = useState(false);
	const [showServerSection, setShowServerSection] = useState(false);

	const handleLocalTestNotification = async () => {
		try {
			await sendLocalNotificationAsync(notificationPayload);
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error);
			Alert.alert("エラー", `通知の送信に失敗しました: ${msg}`);
		}
	};

	const handleWakeupTestNotification = async () => {
		try {
			const success = await triggerTestWakeupNotificationAsync();
			if (!success) {
				Alert.alert("通知", "開発ビルドまたは実機APK環境で利用可能です。");
			}
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error);
			Alert.alert("エラー", `テスト発火に失敗しました: ${msg}`);
		}
	};

	const handleResetWakeupDate = async () => {
		try {
			const success = await resetWakeupLastNotifiedDateAsync();
			if (success) {
				Alert.alert("リセット完了", "本日の配信記録をリセットしました。画面ロック解除時に再配信されます。");
			}
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error);
			Alert.alert("エラー", `リセットに失敗しました: ${msg}`);
		}
	};

	const handleWorkerPushTest = async () => {
		if (!workerUrl.trim()) {
			Alert.alert("エラー", "WorkerのURLを入力してください。");
			return;
		}

		setIsSending(true);
		try {
			const res = await fetch(`${workerUrl.replace(/\/$/, "")}/send-test`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: pushToken ?? undefined,
					cityId: currentCityId,
				}),
			});

			const data = await res.json();
			if (res.ok) {
				Alert.alert("送信完了", `サーバーからプッシュ送信を処理しました (件数: ${data.sentCount ?? 0})`);
			} else {
				Alert.alert("エラー", data.error || JSON.stringify(data));
			}
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error);
			Alert.alert("通信エラー", `サーバーとの通信に失敗しました: ${msg}`);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Section hasDivider={false}>
			<SectionHeader
				title="通知・起床連動設定"
				subtitle="朝6:00以降の初回ロック解除時に最新予報を通知トレイへ届けます"
			/>

			{/* アクションボタングループ */}
			<View style={styles.buttonRow}>
				<TouchableOpacity
					style={[styles.actionButton, styles.primaryButton]}
					onPress={handleWakeupTestNotification}
				>
					<Text style={styles.primaryButtonText}>起床通知をテスト</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.actionButton, styles.secondaryButton]}
					onPress={handleResetWakeupDate}
				>
					<Text style={styles.secondaryButtonText}>配信記録リセット</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity
				style={styles.textButton}
				onPress={handleLocalTestNotification}
			>
				<Text style={styles.textButtonLabel}>ローカル通知トレイ表示テスト</Text>
			</TouchableOpacity>

			{/* サーバー連携トグル */}
			<View style={styles.serverDivider}>
				<TouchableOpacity
					style={styles.serverToggle}
					onPress={() => setShowServerSection(!showServerSection)}
				>
					<Text style={styles.serverToggleText}>
						{showServerSection ? "サーバー連携設定を閉じる" : "Cloudflare Workers 連携設定"}
					</Text>
				</TouchableOpacity>

				{showServerSection && (
					<View style={styles.serverBody}>
						<TextInput
							style={styles.input}
							value={workerUrl}
							onChangeText={setWorkerUrl}
							placeholder="https://..."
							placeholderTextColor="#94A3B8"
							autoCapitalize="none"
						/>
						<TouchableOpacity
							style={[styles.workerButton, isSending && styles.buttonDisabled]}
							onPress={handleWorkerPushTest}
							disabled={isSending}
						>
							<Text style={styles.workerButtonText}>
								{isSending ? "送信中..." : "サーバーからプッシュテスト"}
							</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</Section>
	);
});

const styles = StyleSheet.create({
	buttonRow: {
		flexDirection: "row",
		gap: 8,
		marginTop: 4,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButton: {
		backgroundColor: "#2563EB",
	},
	primaryButtonText: {
		color: "#FFFFFF",
		fontSize: 13,
		fontWeight: "600",
	},
	secondaryButton: {
		backgroundColor: "#F1F5F9",
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	secondaryButtonText: {
		color: "#334155",
		fontSize: 13,
		fontWeight: "600",
	},
	textButton: {
		marginTop: 10,
		alignItems: "center",
		paddingVertical: 6,
	},
	textButtonLabel: {
		fontSize: 12,
		color: "#64748B",
		fontWeight: "500",
	},
	serverDivider: {
		marginTop: 10,
		borderTopWidth: 1,
		borderTopColor: "#F1F5F9",
		paddingTop: 10,
	},
	serverToggle: {
		alignItems: "center",
		paddingVertical: 4,
	},
	serverToggleText: {
		fontSize: 12,
		color: "#94A3B8",
		fontWeight: "500",
	},
	serverBody: {
		marginTop: 10,
	},
	input: {
		backgroundColor: "#F8FAFC",
		borderWidth: 1,
		borderColor: "#E2E8F0",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 13,
		color: "#0F172A",
		marginBottom: 8,
	},
	workerButton: {
		backgroundColor: "#0F172A",
		borderRadius: 8,
		paddingVertical: 9,
		alignItems: "center",
	},
	workerButtonText: {
		color: "#FFFFFF",
		fontSize: 12,
		fontWeight: "600",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
});
