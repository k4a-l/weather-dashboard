import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	ScrollView,
	Linking,
	Alert,
	Switch,
} from "react-native";
import { NotificationPayload, CityConfig } from "../types";
import {
	sendLocalNotificationAsync,
	triggerTestWakeupNotificationAsync,
	resetWakeupLastNotifiedDateAsync,
	syncWakeupNotificationCacheAsync,
	getWakeupNotificationStatusAsync,
	cancelWakeupNotificationsAsync,
} from "../services/notification";

interface Props {
	visible: boolean;
	onClose: () => void;
	onOpenLocationModal: () => void;
	currentCity: CityConfig;
	notificationPayload: NotificationPayload;
	tomorrowNotificationPayload?: NotificationPayload;
	pushToken: string | null;
}

export const SettingsModal: React.FC<Props> = React.memo(
	({
		visible,
		onClose,
		onOpenLocationModal,
		currentCity,
		notificationPayload,
		tomorrowNotificationPayload,
	}) => {
		// 起床連動（画面ロック解除）通知の状態 - 今日
		const [todayEnabled, setTodayEnabled] = useState(true);
		const [todayStartHour, setTodayStartHour] = useState<number>(6);
		const [todayStatusText, setTodayStatusText] = useState("");

		// 起床連動（画面ロック解除）通知の状態 - 明日
		const [tomorrowEnabled, setTomorrowEnabled] = useState(false);
		const [tomorrowStartHour, setTomorrowStartHour] = useState<number>(18);
		const [tomorrowStatusText, setTomorrowStatusText] = useState("");

		// 初期設定の読み込み
		const loadSettings = useCallback(async () => {
			const wakeupStatus = await getWakeupNotificationStatusAsync();
			if (wakeupStatus) {
				const todayStr = new Date().toISOString().slice(0, 10);

				// 今日
				setTodayEnabled(wakeupStatus.today.enabled);
				setTodayStartHour(wakeupStatus.today.startHour ?? 6);
				if (wakeupStatus.today.lastNotifiedDate === todayStr) {
					setTodayStatusText("本日配信済み");
				} else {
					setTodayStatusText("待機中");
				}

				// 明日
				setTomorrowEnabled(wakeupStatus.tomorrow.enabled);
				setTomorrowStartHour(wakeupStatus.tomorrow.startHour ?? 18);
				if (wakeupStatus.tomorrow.lastNotifiedDate === todayStr) {
					setTomorrowStatusText("本日配信済み");
				} else {
					setTomorrowStatusText("待機中");
				}
			}
		}, []);

		useEffect(() => {
			if (visible) {
				loadSettings();
			}
		}, [visible, loadSettings]);

		// 端末の通知設定を開く
		const handleOpenDeviceSettings = async () => {
			try {
				await Linking.openSettings();
			} catch {
				Alert.alert("エラー", "端末の設定画面を開けませんでした。");
			}
		};

		// 今日の通知 ON/OFF
		const handleToggleToday = async (enabled: boolean) => {
			setTodayEnabled(enabled);
			if (!enabled) {
				await cancelWakeupNotificationsAsync("today");
			}
			await syncWakeupNotificationCacheAsync(
				notificationPayload.title,
				notificationPayload.body,
				todayStartHour,
				enabled,
				"today",
			);
			loadSettings();
		};

		// 今日の通知 対象時刻変更
		const handleChangeTodayStartHour = async (delta: number) => {
			const newHour = Math.min(10, Math.max(4, todayStartHour + delta));
			setTodayStartHour(newHour);
			await syncWakeupNotificationCacheAsync(
				notificationPayload.title,
				notificationPayload.body,
				newHour,
				todayEnabled,
				"today",
			);
			loadSettings();
		};

		// 今日の配信記録リセット
		const handleResetToday = async () => {
			await resetWakeupLastNotifiedDateAsync("today");
			Alert.alert("完了", "今日の通知の本日配信記録をリセットしました。");
			loadSettings();
		};

		// 明日の通知 ON/OFF
		const handleToggleTomorrow = async (enabled: boolean) => {
			setTomorrowEnabled(enabled);
			if (!enabled) {
				await cancelWakeupNotificationsAsync("tomorrow");
			}
			const title =
				tomorrowNotificationPayload?.title || "【明日の天気】";
			const body = tomorrowNotificationPayload?.body || "明日の予報";
			await syncWakeupNotificationCacheAsync(
				title,
				body,
				tomorrowStartHour,
				enabled,
				"tomorrow",
			);
			loadSettings();
		};

		// 明日の通知 対象時刻変更
		const handleChangeTomorrowStartHour = async (delta: number) => {
			const newHour = Math.min(
				23,
				Math.max(15, tomorrowStartHour + delta),
			);
			setTomorrowStartHour(newHour);
			const title =
				tomorrowNotificationPayload?.title || "【明日の天気】";
			const body = tomorrowNotificationPayload?.body || "明日の予報";
			await syncWakeupNotificationCacheAsync(
				title,
				body,
				newHour,
				tomorrowEnabled,
				"tomorrow",
			);
			loadSettings();
		};

		// 明日の配信記録リセット
		const handleResetTomorrow = async () => {
			await resetWakeupLastNotifiedDateAsync("tomorrow");
			Alert.alert("完了", "明日の通知の本日配信記録をリセットしました。");
			loadSettings();
		};

		// 今日のテスト通知発火
		const handleTestTodayNotification = async () => {
			try {
				await resetWakeupLastNotifiedDateAsync("today");
				const success =
					await triggerTestWakeupNotificationAsync("today");
				if (!success) {
					await sendLocalNotificationAsync(notificationPayload);
				}
				loadSettings();
			} catch (error) {
				const msg =
					error instanceof Error ? error.message : String(error);
				Alert.alert("エラー", `今日通知テストに失敗しました: ${msg}`);
			}
		};

		// 明日のテスト通知発火
		const handleTestTomorrowNotification = async () => {
			try {
				await resetWakeupLastNotifiedDateAsync("tomorrow");
				const success =
					await triggerTestWakeupNotificationAsync("tomorrow");
				if (!success && tomorrowNotificationPayload) {
					await sendLocalNotificationAsync(
						tomorrowNotificationPayload,
					);
				}
				loadSettings();
			} catch (error) {
				const msg =
					error instanceof Error ? error.message : String(error);
				Alert.alert("エラー", `明日通知テストに失敗しました: ${msg}`);
			}
		};

		return (
			<Modal
				visible={visible}
				animationType="slide"
				transparent
				onRequestClose={onClose}
			>
				<View style={styles.overlay}>
					<TouchableOpacity
						style={StyleSheet.absoluteFill}
						onPress={onClose}
						activeOpacity={1}
					/>
					<View style={styles.container}>
						{/* ヘッダー */}
						<View style={styles.header}>
							<Text style={styles.title}>設定</Text>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={onClose}
								hitSlop={{
									top: 8,
									bottom: 8,
									left: 8,
									right: 8,
								}}
							>
								<Text style={styles.closeButtonText}>✕</Text>
							</TouchableOpacity>
						</View>

						<ScrollView
							style={styles.scroll}
							contentContainerStyle={styles.scrollContent}
							showsVerticalScrollIndicator={false}
						>
							{/* セクション 1: 地域設定 */}
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>
									地域設定
								</Text>
								<TouchableOpacity
									style={styles.settingRow}
									onPress={() => {
										onClose();
										setTimeout(onOpenLocationModal, 200);
									}}
								>
									<View style={styles.settingRowInfo}>
										<Text style={styles.settingRowLabel}>
											表示中の地域
										</Text>
										<Text style={styles.settingRowValue}>
											{currentCity.name}
											{currentCity.prefecture
												? ` (${currentCity.prefecture})`
												: ""}
										</Text>
									</View>
									<Text style={styles.chevron}>変更 ❯</Text>
								</TouchableOpacity>
							</View>

							{/* セクション 2: 通知設定 */}
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>
									通知設定
								</Text>
								{/* OS通知設定へのジャンプ */}
								<TouchableOpacity
									style={styles.actionRow}
									onPress={handleOpenDeviceSettings}
								>
									<Text style={styles.actionTitle}>
										端末の通知設定を開く
									</Text>
									<Text style={styles.actionChevron}>❯</Text>
								</TouchableOpacity>

								{/* 今日の天気通知 */}
								<View style={styles.settingCard}>
									<View style={styles.cardHeaderRow}>
										<View style={styles.cardHeaderInfo}>
											<Text style={styles.cardTitle}>
												今日の天気通知
											</Text>
											{!todayEnabled && (
												<Text
													style={
														styles.cardDescription
													}
												>
													朝の指定時刻以降に画面を開いた時にお知らせします
												</Text>
											)}
										</View>
										<Switch
											value={todayEnabled}
											onValueChange={handleToggleToday}
											trackColor={{
												false: "#CBD5E1",
												true: "#93C5FD",
											}}
											thumbColor={
												todayEnabled
													? "#2563EB"
													: "#F1F5F9"
											}
										/>
									</View>

									{todayEnabled && (
										<View style={styles.cardSubContent}>
											<View
												style={styles.inlineSentenceRow}
											>
												<View
													style={
														styles.stepperContainer
													}
												>
													<TouchableOpacity
														style={[
															styles.stepButton,
															todayStartHour <=
																4 &&
																styles.stepButtonDisabled,
														]}
														onPress={() =>
															handleChangeTodayStartHour(
																-1,
															)
														}
														disabled={
															todayStartHour <= 4
														}
													>
														<Text
															style={
																styles.stepButtonText
															}
														>
															−
														</Text>
													</TouchableOpacity>
													<View
														style={
															styles.stepValueBox
														}
													>
														<Text
															style={
																styles.stepValueText
															}
														>
															{todayStartHour}:00
														</Text>
													</View>
													<TouchableOpacity
														style={[
															styles.stepButton,
															todayStartHour >=
																10 &&
																styles.stepButtonDisabled,
														]}
														onPress={() =>
															handleChangeTodayStartHour(
																1,
															)
														}
														disabled={
															todayStartHour >= 10
														}
													>
														<Text
															style={
																styles.stepButtonText
															}
														>
															＋
														</Text>
													</TouchableOpacity>
												</View>
												<Text
													style={
														styles.inlineSentenceText
													}
												>
													以降に画面を開いた時にお知らせ
												</Text>
											</View>

											<View style={styles.subRowBetween}>
												{todayStatusText ===
												"本日配信済み" ? (
													<View
														style={
															styles.statusBadge
														}
													>
														<Text
															style={
																styles.statusBadgeText
															}
														>
															本日配信済み
														</Text>
													</View>
												) : (
													<View />
												)}
												<TouchableOpacity
													style={styles.resetButton}
													onPress={handleResetToday}
													hitSlop={{
														top: 8,
														bottom: 8,
														left: 8,
														right: 8,
													}}
												>
													<Text
														style={
															styles.resetButtonText
														}
													>
														本日の配信記録をリセット
													</Text>
												</TouchableOpacity>
											</View>
										</View>
									)}
								</View>

								{/* 明日の天気通知 */}
								<View style={styles.settingCard}>
									<View style={styles.cardHeaderRow}>
										<View style={styles.cardHeaderInfo}>
											<Text style={styles.cardTitle}>
												明日の天気通知
											</Text>
											{!tomorrowEnabled && (
												<Text
													style={
														styles.cardDescription
													}
												>
													夕方・夜の指定時刻以降に画面を開いた時にお知らせします
												</Text>
											)}
										</View>
										<Switch
											value={tomorrowEnabled}
											onValueChange={handleToggleTomorrow}
											trackColor={{
												false: "#CBD5E1",
												true: "#93C5FD",
											}}
											thumbColor={
												tomorrowEnabled
													? "#2563EB"
													: "#F1F5F9"
											}
										/>
									</View>

									{tomorrowEnabled && (
										<View style={styles.cardSubContent}>
											<View
												style={styles.inlineSentenceRow}
											>
												<View
													style={
														styles.stepperContainer
													}
												>
													<TouchableOpacity
														style={[
															styles.stepButton,
															tomorrowStartHour <=
																15 &&
																styles.stepButtonDisabled,
														]}
														onPress={() =>
															handleChangeTomorrowStartHour(
																-1,
															)
														}
														disabled={
															tomorrowStartHour <=
															15
														}
													>
														<Text
															style={
																styles.stepButtonText
															}
														>
															−
														</Text>
													</TouchableOpacity>
													<View
														style={
															styles.stepValueBox
														}
													>
														<Text
															style={
																styles.stepValueText
															}
														>
															{tomorrowStartHour}
															:00
														</Text>
													</View>
													<TouchableOpacity
														style={[
															styles.stepButton,
															tomorrowStartHour >=
																23 &&
																styles.stepButtonDisabled,
														]}
														onPress={() =>
															handleChangeTomorrowStartHour(
																1,
															)
														}
														disabled={
															tomorrowStartHour >=
															23
														}
													>
														<Text
															style={
																styles.stepButtonText
															}
														>
															＋
														</Text>
													</TouchableOpacity>
												</View>
												<Text
													style={
														styles.inlineSentenceText
													}
												>
													以降に画面を開いた時にお知らせ
												</Text>
											</View>

											<View style={styles.subRowBetween}>
												{tomorrowStatusText ===
												"本日配信済み" ? (
													<View
														style={
															styles.statusBadge
														}
													>
														<Text
															style={
																styles.statusBadgeText
															}
														>
															本日配信済み
														</Text>
													</View>
												) : (
													<View />
												)}
												<TouchableOpacity
													style={styles.resetButton}
													onPress={
														handleResetTomorrow
													}
													hitSlop={{
														top: 8,
														bottom: 8,
														left: 8,
														right: 8,
													}}
												>
													<Text
														style={
															styles.resetButtonText
														}
													>
														本日の配信記録をリセット
													</Text>
												</TouchableOpacity>
											</View>
										</View>
									)}
								</View>

								{/* 動作テスト */}
								<View style={styles.testSection}>
									<View style={styles.testButtonsRow}>
										<TouchableOpacity
											style={[
												styles.testButton,
												styles.testButtonFlex,
											]}
											onPress={
												handleTestTodayNotification
											}
										>
											<Text style={styles.testButtonText}>
												今日通知テスト
											</Text>
										</TouchableOpacity>
										<TouchableOpacity
											style={[
												styles.testButton,
												styles.testButtonFlex,
											]}
											onPress={
												handleTestTomorrowNotification
											}
										>
											<Text style={styles.testButtonText}>
												明日通知テスト
											</Text>
										</TouchableOpacity>
									</View>
								</View>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>
		);
	},
);

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(15, 23, 42, 0.4)",
		justifyContent: "flex-end",
	},
	container: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: "85%",
		paddingTop: 16,
		paddingBottom: 28,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.1,
		shadowRadius: 16,
		elevation: 10,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#F1F5F9",
	},
	title: {
		fontSize: 18,
		fontWeight: "800",
		color: "#0F172A",
	},
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#F1F5F9",
		alignItems: "center",
		justifyContent: "center",
	},
	closeButtonText: {
		fontSize: 14,
		color: "#64748B",
		fontWeight: "700",
	},
	scroll: {
		flexGrow: 0,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 24,
		gap: 24,
	},
	section: {
		gap: 10,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#475569",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	sectionDescription: {
		fontSize: 12,
		color: "#64748B",
		lineHeight: 18,
	},
	settingRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 14,
		backgroundColor: "#F8FAFC",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	settingRowInfo: {
		gap: 2,
	},
	settingRowLabel: {
		fontSize: 12,
		color: "#64748B",
	},
	settingRowValue: {
		fontSize: 15,
		fontWeight: "700",
		color: "#0F172A",
	},
	chevron: {
		fontSize: 12,
		color: "#2563EB",
		fontWeight: "700",
	},
	actionRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 14,
		backgroundColor: "#F8FAFC",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	actionRowLeft: {
		flexDirection: "column",
		gap: 2,
		flex: 1,
	},
	actionIcon: {
		fontSize: 20,
	},
	actionTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#0F172A",
	},
	actionSubtitle: {
		fontSize: 11,
		color: "#64748B",
		marginTop: 2,
	},
	actionChevron: {
		fontSize: 14,
		color: "#94A3B8",
		fontWeight: "600",
	},
	settingCard: {
		backgroundColor: "#F8FAFC",
		padding: 16,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		gap: 12,
	},
	cardHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
	},
	cardHeaderInfo: {
		flex: 1,
		gap: 2,
	},
	cardTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#0F172A",
	},
	cardDescription: {
		fontSize: 12,
		color: "#64748B",
		lineHeight: 16,
	},
	cardSubContent: {
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#E2E8F0",
		gap: 12,
	},
	inlineSentenceRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	inlineSentenceText: {
		flex: 1,
		fontSize: 13,
		fontWeight: "500",
		color: "#334155",
		lineHeight: 18,
	},
	subRowBetween: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	settingInfoCol: {
		gap: 2,
	},
	subRowHint: {
		fontSize: 11,
		color: "#64748B",
	},
	stepperContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#CBD5E1",
		overflow: "hidden",
	},
	stepButton: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		backgroundColor: "#F1F5F9",
	},
	stepButtonDisabled: {
		opacity: 0.3,
	},
	stepButtonText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#1E293B",
	},
	stepValueBox: {
		paddingHorizontal: 8,
		paddingVertical: 6,
		minWidth: 52,
		alignItems: "center",
	},
	stepValueText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#0F172A",
	},
	subRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	subRowLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#475569",
	},
	subRowValue: {
		fontSize: 13,
		fontWeight: "700",
		color: "#0F172A",
	},
	statusBadgeRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
	},
	statusBadge: {
		backgroundColor: "#EFF6FF",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: "#BFDBFE",
	},
	statusBadgeText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#1D4ED8",
	},
	resetButton: {
		paddingVertical: 4,
		paddingHorizontal: 0,
	},
	resetButtonText: {
		fontSize: 12,
		color: "#2563EB",
		textDecorationLine: "underline",
	},
	testSection: {
		marginTop: 4,
	},
	testButtonsRow: {
		flexDirection: "row",
		gap: 10,
	},
	testButton: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#CBD5E1",
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	testButtonFlex: {
		flex: 1,
	},
	testButtonText: {
		color: "#334155",
		fontSize: 13,
		fontWeight: "700",
	},
});
