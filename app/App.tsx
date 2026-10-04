import React, { useEffect, useState, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
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
} from "./src/services/notification";
import { TodayComparisonCard, WeatherModelId } from "./src/components/TodayComparisonCard";
import { TwoWeekForecastCard } from "./src/components/TwoWeekForecastCard";
import { AlertNoticeCard } from "./src/components/AlertNoticeCard";
import { HourlyTimeline } from "./src/components/HourlyTimeline";
import { NotificationControlCard } from "./src/components/NotificationControlCard";
import { LocationSettingsModal } from "./src/components/LocationSettingsModal";

export default function App() {
    const [currentCity, setCurrentCity] = useState<CityConfig>(CITIES[0]);
    const [weatherData, setWeatherData] = useState<AggregatedWeatherData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);
    const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow">("today");
    const [selectedModel, setSelectedModel] = useState<WeatherModelId>("jmaOfficial");

    // 初期化: 通知設定・パーミッション・プッシュトークン取得
    useEffect(() => {
        (async () => {
            await setupNotificationChannelAsync();
            await requestNotificationPermissionsAsync();
            const token = await getExpoPushTokenAsync();
            if (token) {
                setPushToken(token);
            }
        })();
    }, []);

    // 天気データ取得
    const loadWeather = useCallback(async (city: CityConfig) => {
        try {
            setErrorMessage(null);
            const data = await fetchAggregatedWeatherDirect(city);
            setWeatherData(data);

            // ネイティブ側の起床連動通知キャッシュを最新の予報データに更新
            if (data?.notification) {
                await syncWakeupNotificationCacheAsync(
                    data.notification.title,
                    data.notification.body,
                    6, // 朝6:00以降
                    true
                );
            }
        } catch (error: unknown) {
            console.error("Load weather failed:", error);
            setErrorMessage("気象データの取得に失敗しました。電波状況を確認してください。");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadWeather(currentCity);
    }, [currentCity, loadWeather]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadWeather(currentCity);
    }, [currentCity, loadWeather]);

    const handleSaveCity = (newCity: CityConfig) => {
        setCurrentCity(newCity);
        setIsLoading(true);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <View style={styles.headerTextGroup}>
                    <Text style={styles.cityNameText}>{currentCity.name}</Text>
                    <Text style={styles.headerMetaText}>
                        {currentCity.latitude.toFixed(2)}°N, {currentCity.longitude.toFixed(2)}°E • 気象庁 / ECMWF 統合
                    </Text>
                </View>

                {/* 任意の地域・座標設定ボタン */}
                <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => setIsLocationModalVisible(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.settingButtonText}>地域設定</Text>
                </TouchableOpacity>
            </View>

            {/* メインコンテンツ */}
            {isLoading && !isRefreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="small" color="#0F172A" />
                    <Text style={styles.loadingText}>気象データを取得中...</Text>
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
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#2563EB"]} />
                    }
                >
                    <View style={styles.mainContainer}>
                        {/* 1. メイン予報（今日／明日、モデル切り替え式）＋ 服装目安 */}
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

                        {/* 2. 時間別推移 (今日〜明日 48時間) */}
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
                                    ? "ECMWF欧州モデル"
                                    : "JMA数値モデル"
                            }
                        />

                        {/* 3. 2週間先までの週間予報【完全併記】 */}
                        <TwoWeekForecastCard
                            jmaWeekly={weatherData.jma.weeklyDaily}
                            openMeteoJmaDaily={weatherData.openMeteoJma.daily}
                            openMeteoEcmwfDaily={weatherData.openMeteoEcmwf.daily}
                        />

                        {/* 4. 特記事項・気象概況 (気象庁公式) */}
                        <AlertNoticeCard jma={weatherData.jma} />

                        {/* 5. 通知テスト・Cloudflare Workers 連携 */}
                        <NotificationControlCard
                            notificationPayload={weatherData.notification}
                            pushToken={pushToken}
                            currentCityId={currentCity.id}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "android" ? ((NativeStatusBar.currentHeight || 28) + 4) : 0,
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
    headerTextGroup: {
        flex: 1,
    },
    cityNameText: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: -0.5,
    },
    headerMetaText: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "500",
        marginTop: 2,
    },
    settingButton: {
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    settingButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#334155",
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

