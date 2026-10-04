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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { CITIES } from "./src/constants/cities";
import { CityConfig, AggregatedWeatherData } from "./src/types";
import { fetchAggregatedWeatherDirect } from "./src/services/weatherApi";
import {
    setupNotificationChannelAsync,
    requestNotificationPermissionsAsync,
    getExpoPushTokenAsync,
} from "./src/services/notification";
import { SummaryCard } from "./src/components/SummaryCard";
import { ClothingAdviceCard } from "./src/components/ClothingAdviceCard";
import { AlertNoticeCard } from "./src/components/AlertNoticeCard";
import { ModelComparisonCard } from "./src/components/ModelComparisonCard";
import { HourlyTimeline } from "./src/components/HourlyTimeline";
import { NotificationControlCard } from "./src/components/NotificationControlCard";

export default function App() {
    const [selectedCity, setSelectedCity] = useState<CityConfig>(CITIES[0]);
    const [weatherData, setWeatherData] = useState<AggregatedWeatherData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pushToken, setPushToken] = useState<string | null>(null);

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
        } catch (error: any) {
            console.error("Load weather failed:", error);
            setErrorMessage("気象データの取得に失敗しました。電波状況を確認してください。");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        loadWeather(selectedCity);
    }, [selectedCity, loadWeather]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadWeather(selectedCity);
    }, [selectedCity, loadWeather]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <Text style={styles.appTitle}>☀️ お天気ダッシュボード</Text>
                <Text style={styles.appSubtitle}>気象庁 & 欧州モデル統合予報</Text>
            </View>

            {/* 都市切り替えセレクター */}
            <View style={styles.citySelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityScroll}>
                    {CITIES.map((city) => {
                        const isSelected = city.id === selectedCity.id;
                        return (
                            <TouchableOpacity
                                key={city.id}
                                style={[styles.cityChip, isSelected && styles.cityChipActive]}
                                onPress={() => setSelectedCity(city)}
                            >
                                <Text style={[styles.cityChipText, isSelected && styles.cityChipTextActive]}>
                                    {city.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* メインコンテンツ */}
            {isLoading && !isRefreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>気象庁・Open-Meteoから予報を取得中...</Text>
                </View>
            ) : errorMessage ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setIsLoading(true);
                            loadWeather(selectedCity);
                        }}
                    >
                        <Text style={styles.retryButtonText}>再試行する</Text>
                    </TouchableOpacity>
                </View>
            ) : weatherData ? (
                <ScrollView
                    style={styles.contentScroll}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#2563EB"]} />
                    }
                >
                    {/* 今日のサマリー（前日差バッジ付き） */}
                    <SummaryCard data={weatherData} />

                    {/* 本日の服装目安 */}
                    <ClothingAdviceCard advice={weatherData.clothingAdvice} />

                    {/* 特記事項・台風・警報 */}
                    <AlertNoticeCard jma={weatherData.jma} />

                    {/* 予測モデル・取得元比較（気象庁公式 vs JMAモデル vs ECMWF欧州モデル） */}
                    <ModelComparisonCard
                        jma={weatherData.jma}
                        openMeteoJma={weatherData.openMeteoJma}
                        openMeteoEcmwf={weatherData.openMeteoEcmwf}
                    />

                    {/* 24時間気温・降水確率推移 */}
                    <HourlyTimeline items={weatherData.openMeteoJma.hourly} />

                    {/* 通知テスト・Cloudflare Workers 連携 */}
                    <NotificationControlCard
                        notificationPayload={weatherData.notification}
                        pushToken={pushToken}
                        currentCityId={selectedCity.id}
                    />
                </ScrollView>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 6,
        backgroundColor: "#FFFFFF",
    },
    appTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#111827",
    },
    appSubtitle: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    citySelectorContainer: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    cityScroll: {
        paddingHorizontal: 16,
    },
    cityChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        marginRight: 8,
    },
    cityChipActive: {
        backgroundColor: "#2563EB",
    },
    cityChipText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4B5563",
    },
    cityChipTextActive: {
        color: "#FFFFFF",
    },
    contentScroll: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280",
    },
    errorIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: "#EF4444",
        textAlign: "center",
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
});
