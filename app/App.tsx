import React, { useEffect, useState, useCallback, useRef } from "react";
import {
	StyleSheet,
	Text,
	View,
	Image,
	SafeAreaView,
	ScrollView,
	RefreshControl,
	TouchableOpacity,
	ActivityIndicator,
	Platform,
	StatusBar as NativeStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { CITIES } from "./src/constants/cities";
import { CityConfig, AggregatedWeatherData } from "./src/types";
import { fetchAggregatedWeatherDirect } from "./src/services/weatherApi";
import {
	setupNotificationChannelAsync,
	requestNotificationPermissionsAsync,
	getExpoPushTokenAsync,
	syncWakeupNotificationCacheAsync,
	getWakeupNotificationStatusAsync,
} from "./src/services/notification";
import {
	TodayComparisonCard,
	WeatherModelId,
} from "./src/components/TodayComparisonCard";
import { TwoWeekForecastCard } from "./src/components/TwoWeekForecastCard";
import { AlertNoticeCard } from "./src/components/AlertNoticeCard";
import { HourlyTimeline } from "./src/components/HourlyTimeline";
import { LocationSettingsModal } from "./src/components/LocationSettingsModal";
import { SettingsModal } from "./src/components/SettingsModal";
import {
	getLastSelectedCity,
	saveLastSelectedCity,
} from "./src/services/cityStorage";

export default function App() {
	const [currentCity, setCurrentCity] = useState<CityConfig>(CITIES[0]);
	const [isCityInitialized, setIsCityInitialized] = useState<boolean>(false);
	const activeCityIdRef = useRef<string>(CITIES[0].id);
	const [weatherData, setWeatherData] =
		useState<AggregatedWeatherData | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [pushToken, setPushToken] = useState<string | null>(null);
	const [isLocationModalVisible, setIsLocationModalVisible] =
		useState<boolean>(false);
	const [isSettingsModalVisible, setIsSettingsModalVisible] =
		useState<boolean>(false);
	const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow">(
		"today",
	);
	const [selectedModel, setSelectedModel] =
		useState<WeatherModelId>("jmaOfficial");

	// 初期化: 通知設定・パーミッション・プッシュトークン取得および前回地点復元
	useEffect(() => {
		(async () => {
			await setupNotificationChannelAsync();
			await requestNotificationPermissionsAsync();
			const token = await getExpoPushTokenAsync();
			if (token) {
				setPushToken(token);
			}

			// 前回選択された地点を復元
			const lastCity = await getLastSelectedCity();
			const initialCity = lastCity || CITIES[0];
			activeCityIdRef.current = initialCity.id;
			setCurrentCity(initialCity);
			setIsCityInitialized(true);
		})();
	}, []);

	// 天気データ取得
	const loadWeather = useCallback(async (city: CityConfig) => {
		try {
			console.log("[App] loadWeather start for:", city.name);
			setErrorMessage(null);
			const data = await fetchAggregatedWeatherDirect(city);

			// 別地点がすでに選択されていたら古いレスポンスを破棄
			if (activeCityIdRef.current !== city.id) {
				console.log("[App] Discarding stale response for:", city.name);
				return;
			}

			console.log(
				"[App] loadWeather received data for:",
				city.name,
				"todayMax:",
				data.jma.todayMaxTemp,
				"todayMin:",
				data.jma.todayMinTemp,
			);
			setWeatherData(data);

			// ネイティブ側の起床連動通知キャッシュを最新の予報データに更新（既存の設定値を維持）
			const currentStatus = await getWakeupNotificationStatusAsync();
			if (data?.notification) {
				await syncWakeupNotificationCacheAsync(
					data.notification.title,
					data.notification.body,
					currentStatus?.today?.startHour ?? 6,
					currentStatus?.today?.enabled ?? true,
					"today",
				);
			}
			if (data?.tomorrowNotification) {
				await syncWakeupNotificationCacheAsync(
					data.tomorrowNotification.title,
					data.tomorrowNotification.body,
					currentStatus?.tomorrow?.startHour ?? 18,
					currentStatus?.tomorrow?.enabled ?? false,
					"tomorrow",
				);
			}
		} catch (error: unknown) {
			console.error("[App] Load weather failed:", error);
			setErrorMessage(
				"気象データの取得に失敗しました。電波状況を確認してください。",
			);
		} finally {
			console.log("[App] loadWeather finally");
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		if (!isCityInitialized) return;
		activeCityIdRef.current = currentCity.id;
		loadWeather(currentCity);
	}, [isCityInitialized, currentCity, loadWeather]);

	const onRefresh = useCallback(() => {
		setIsRefreshing(true);
		loadWeather(currentCity);
	}, [currentCity, loadWeather]);

	const handleSaveCity = (newCity: CityConfig) => {
		activeCityIdRef.current = newCity.id;
		setCurrentCity(newCity);
		setIsLoading(true);
		saveLastSelectedCity(newCity);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar style="dark" />
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.headerLeftGroup}
					onPress={() => setIsLocationModalVisible(true)}
					activeOpacity={0.7}
				>
					<Image
						source={require("./assets/logo.png")}
						style={styles.headerLogo}
						resizeMode="contain"
					/>
					<View style={styles.headerTextGroup}>
						<View style={styles.cityNameRow}>
							<Text style={styles.cityNameText}>
								{currentCity.name}
							</Text>
							<Text style={styles.cityDropdownIcon}>▾</Text>
						</View>
						<Text style={styles.headerMetaText}>
							{currentCity.latitude.toFixed(2)}°N,{" "}
							{currentCity.longitude.toFixed(2)}
							°E • 気象庁 / ECMWF 統合
						</Text>
					</View>
				</TouchableOpacity>

				{/* 設定ボタン */}
				<TouchableOpacity
					style={styles.settingsHeaderBtn}
					onPress={() => setIsSettingsModalVisible(true)}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					activeOpacity={0.7}
					accessibilityLabel="設定"
				>
					<Image
						source={require("./assets/gear.png")}
						style={styles.gearIcon}
						resizeMode="contain"
					/>
				</TouchableOpacity>
			</View>

			{/* メインコンテンツ */}
			{isLoading && !isRefreshing ? (
				<View style={styles.centerContainer}>
					<ActivityIndicator size="small" color="#0F172A" />
					<Text style={styles.loadingText}>
						気象データを取得中...
					</Text>
				</View>
			) : errorMessage ? (
				<View style={styles.centerContainer}>
					<Text style={styles.errorText}>{errorMessage}</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={() => {
							setIsLoading(true);
							loadWeather(currentCity);
						}}
					>
						<Text style={styles.retryButtonText}>再試行する</Text>
					</TouchableOpacity>
				</View>
			) : weatherData ? (
				<ScrollView
					style={styles.contentScroll}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={onRefresh}
							colors={["#2563EB"]}
						/>
					}
				>
					<View style={styles.mainContainer}>
						{/* メイン予報（今日／明日、モデル切り替え式）＋ 服装目安 */}
						<TodayComparisonCard
							jma={weatherData.jma}
							openMeteoJma={weatherData.openMeteoJma}
							openMeteoEcmwf={weatherData.openMeteoEcmwf}
							clothingAdvice={weatherData.clothingAdvice}
							selectedDay={selectedDay}
							onSelectDay={setSelectedDay}
							selectedModel={selectedModel}
							onSelectModel={setSelectedModel}
						/>

						{/* 特記事項・気象概況 (気象庁公式) */}
						<AlertNoticeCard jma={weatherData.jma} />

						{/* 時間別推移 (今日〜明日 48時間) */}
						<HourlyTimeline
							items={
								selectedModel === "openMeteoEcmwf"
									? weatherData.openMeteoEcmwf.hourly
									: weatherData.openMeteoJma.hourly
							}
							selectedDay={selectedDay}
							onDayChange={setSelectedDay}
							modelLabel={
								selectedModel === "openMeteoEcmwf"
									? "ECMWF欧州"
									: "JMA数値"
							}
						/>

						{/* 2週間先までの週間予報【完全併記】 */}
						<TwoWeekForecastCard
							jmaWeekly={weatherData.jma.weeklyDaily}
							openMeteoJmaDaily={weatherData.openMeteoJma.daily}
							openMeteoEcmwfDaily={
								weatherData.openMeteoEcmwf.daily
							}
						/>
					</View>
				</ScrollView>
			) : null}

			{/* 任意地域設定モーダル */}
			<LocationSettingsModal
				visible={isLocationModalVisible}
				currentCity={currentCity}
				onClose={() => setIsLocationModalVisible(false)}
				onSave={handleSaveCity}
			/>

			{/* アプリ設定モーダル（通知設定・OS設定リンク・通知テスト・Workers連携） */}
			<SettingsModal
				visible={isSettingsModalVisible}
				onClose={() => setIsSettingsModalVisible(false)}
				onOpenLocationModal={() => setIsLocationModalVisible(true)}
				currentCity={currentCity}
				notificationPayload={
					weatherData?.notification ?? {
						title: `${currentCity.name}の天気`,
						body: "最新の気象情報を取得しています",
						data: { cityId: currentCity.id },
					}
				}
				tomorrowNotificationPayload={
					weatherData?.tomorrowNotification ?? {
						title: `【明日の天気】${currentCity.name}`,
						body: "最新の気象情報を取得しています",
						data: { cityId: currentCity.id },
					}
				}
				pushToken={pushToken}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		paddingTop:
			Platform.OS === "android"
				? (NativeStatusBar.currentHeight || 28) + 4
				: 0,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: 10,
		paddingBottom: 14,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F1F5F9",
	},
	headerLeftGroup: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		gap: 12,
	},
	headerLogo: {
		width: 36,
		height: 36,
	},
	headerTextGroup: {
		flex: 1,
	},
	cityNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	cityNameText: {
		fontSize: 22,
		fontWeight: "800",
		color: "#0F172A",
		letterSpacing: -0.5,
	},
	cityDropdownIcon: {
		fontSize: 14,
		color: "#64748B",
		marginTop: 2,
	},
	headerMetaText: {
		fontSize: 11,
		color: "#64748B",
		fontWeight: "500",
		marginTop: 2,
	},
	settingsHeaderBtn: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	gearIcon: {
		width: 20,
		height: 20,
		opacity: 0.6,
	},
	contentScroll: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	scrollContent: {
		paddingBottom: 40,
	},
	mainContainer: {
		width: "100%",
		maxWidth: 640,
		alignSelf: "center",
	},
	centerContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 13,
		color: "#64748B",
		fontWeight: "500",
	},
	errorText: {
		fontSize: 13,
		color: "#E11D48",
		textAlign: "center",
		marginBottom: 16,
		lineHeight: 20,
	},
	retryButton: {
		backgroundColor: "#0F172A",
		paddingHorizontal: 18,
		paddingVertical: 9,
		borderRadius: 8,
	},
	retryButtonText: {
		color: "#FFFFFF",
		fontSize: 13,
		fontWeight: "600",
	},
});
