import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { JmaForecastData, ModelForecast } from "../types";
import { getWeatherIcon } from "../services/weatherApi";
import { Section } from "./Section";

export type WeatherModelId = "jmaOfficial" | "openMeteoJma" | "openMeteoEcmwf";

interface Props {
	jma: JmaForecastData;
	openMeteoJma: ModelForecast;
	openMeteoEcmwf: ModelForecast;
	clothingAdvice?: string;
	selectedDay: "today" | "tomorrow";
	onSelectDay: (day: "today" | "tomorrow") => void;
	selectedModel: WeatherModelId;
	onSelectModel: (model: WeatherModelId) => void;
}

export const TodayComparisonCard: React.FC<Props> = React.memo(
	({
		jma,
		openMeteoJma,
		openMeteoEcmwf,
		clothingAdvice,
		selectedDay,
		onSelectDay,
		selectedModel,
		onSelectModel,
	}) => {
		const cleanAdvice = clothingAdvice
			? clothingAdvice.replace(/^[\p{Emoji}\s]+/u, "")
			: "";

		const isToday = selectedDay === "today";
		const diffPrefix = isToday ? "前日比" : "今日比";

		// 体感温度（最高／最低）
		const activeModel =
			selectedModel === "openMeteoEcmwf" ? openMeteoEcmwf : openMeteoJma;
		const apparentMaxTemp = isToday
			? activeModel.todayApparentMaxTemp
			: activeModel.tomorrowApparentMaxTemp;
		const apparentMinTemp = isToday
			? activeModel.todayApparentMinTemp
			: activeModel.tomorrowApparentMinTemp;

		// 選択されたモデルと日時に応じた値の解決
		let weatherIcon = "";
		let weatherText = "";
		let maxTemp = 20;
		let minTemp = 15;
		let maxDiff = 0;
		let minDiff = 0;
		let popText = "0%";
		let precipText = "0mm";
		let maxDiffVsJma: number | undefined;
		let minDiffVsJma: number | undefined;

		if (isToday) {
			const baselineMax = jma.todayMaxTemp ?? openMeteoJma.maxTemp;
			let baselineMin = jma.todayMinTemp ?? openMeteoJma.minTemp;
			if (
				baselineMin === baselineMax &&
				openMeteoJma.minTemp !== baselineMax
			) {
				baselineMin = openMeteoJma.minTemp;
			}

			if (selectedModel === "jmaOfficial") {
				weatherIcon = getWeatherIcon(jma.todayWeather);
				weatherText = jma.todayWeather;
				maxTemp = baselineMax;
				minTemp = baselineMin;
				maxDiff = openMeteoJma.maxTempDiff;
				minDiff = openMeteoJma.minTempDiff;
				popText =
					jma.todayPops.length > 0
						? `${jma.todayPops[jma.todayPops.length - 1]}%`
						: `${openMeteoJma.popMax}%`;
				precipText =
					openMeteoJma.precipitationSum !== undefined
						? `${openMeteoJma.precipitationSum}mm`
						: "0mm";
			} else if (selectedModel === "openMeteoJma") {
				weatherIcon = getWeatherIcon(openMeteoJma.todayWeatherCode);
				weatherText = openMeteoJma.todayWeatherText;
				maxTemp = openMeteoJma.maxTemp;
				minTemp = openMeteoJma.minTemp;
				maxDiff = openMeteoJma.maxTempDiff;
				minDiff = openMeteoJma.minTempDiff;
				popText = `${openMeteoJma.popMax}%`;
				precipText = `${openMeteoJma.precipitationSum ?? 0}mm`;
				if (jma.todayMaxTemp !== undefined) {
					maxDiffVsJma =
						Math.round(
							(openMeteoJma.maxTemp - jma.todayMaxTemp) * 10,
						) / 10;
				}
				if (jma.todayMinTemp !== undefined) {
					minDiffVsJma =
						Math.round(
							(openMeteoJma.minTemp - jma.todayMinTemp) * 10,
						) / 10;
				}
			} else {
				weatherIcon = getWeatherIcon(openMeteoEcmwf.todayWeatherCode);
				weatherText = openMeteoEcmwf.todayWeatherText;
				maxTemp = openMeteoEcmwf.maxTemp;
				minTemp = openMeteoEcmwf.minTemp;
				maxDiff = openMeteoEcmwf.maxTempDiff;
				minDiff = openMeteoEcmwf.minTempDiff;
				popText = `${openMeteoEcmwf.popMax}%`;
				precipText = `${openMeteoEcmwf.precipitationSum ?? 0}mm`;
				maxDiffVsJma =
					Math.round((openMeteoEcmwf.maxTemp - baselineMax) * 10) /
					10;
				minDiffVsJma =
					Math.round((openMeteoEcmwf.minTemp - baselineMin) * 10) /
					10;
			}
		} else {
			// 明日
			const baselineTomMax =
				jma.tomorrowMaxTemp ?? openMeteoJma.tomorrowMaxTemp;
			let baselineTomMin =
				jma.tomorrowMinTemp ?? openMeteoJma.tomorrowMinTemp;
			if (
				baselineTomMin === baselineTomMax &&
				openMeteoJma.tomorrowMinTemp !== baselineTomMax
			) {
				baselineTomMin = openMeteoJma.tomorrowMinTemp;
			}

			if (selectedModel === "jmaOfficial") {
				const jmaTomWeather = jma.tomorrowWeather || "くもり";
				weatherIcon = getWeatherIcon(jmaTomWeather);
				weatherText = jmaTomWeather;
				maxTemp = baselineTomMax;
				minTemp = baselineTomMin;
				maxDiff = openMeteoJma.tomorrowMaxTempDiff;
				minDiff = openMeteoJma.tomorrowMinTempDiff;
				popText =
					jma.tomorrowPops && jma.tomorrowPops.length > 0
						? `${jma.tomorrowPops[0]}%`
						: `${openMeteoJma.tomorrowPopMax}%`;
				precipText =
					openMeteoJma.tomorrowPrecipitationSum !== undefined
						? `${openMeteoJma.tomorrowPrecipitationSum}mm`
						: "0mm";
			} else if (selectedModel === "openMeteoJma") {
				weatherIcon = getWeatherIcon(openMeteoJma.tomorrowWeatherCode);
				weatherText = openMeteoJma.tomorrowWeatherText;
				maxTemp = openMeteoJma.tomorrowMaxTemp;
				minTemp = openMeteoJma.tomorrowMinTemp;
				maxDiff = openMeteoJma.tomorrowMaxTempDiff;
				minDiff = openMeteoJma.tomorrowMinTempDiff;
				popText = `${openMeteoJma.tomorrowPopMax}%`;
				precipText = `${openMeteoJma.tomorrowPrecipitationSum ?? 0}mm`;
				maxDiffVsJma =
					Math.round(
						(openMeteoJma.tomorrowMaxTemp - baselineTomMax) * 10,
					) / 10;
				minDiffVsJma =
					Math.round(
						(openMeteoJma.tomorrowMinTemp - baselineTomMin) * 10,
					) / 10;
			} else {
				weatherIcon = getWeatherIcon(
					openMeteoEcmwf.tomorrowWeatherCode,
				);
				weatherText = openMeteoEcmwf.tomorrowWeatherText;
				maxTemp = openMeteoEcmwf.tomorrowMaxTemp;
				minTemp = openMeteoEcmwf.tomorrowMinTemp;
				maxDiff = openMeteoEcmwf.tomorrowMaxTempDiff;
				minDiff = openMeteoEcmwf.tomorrowMinTempDiff;
				popText = `${openMeteoEcmwf.tomorrowPopMax}%`;
				precipText = `${openMeteoEcmwf.tomorrowPrecipitationSum ?? 0}mm`;
				maxDiffVsJma =
					Math.round(
						(openMeteoEcmwf.tomorrowMaxTemp - baselineTomMax) * 10,
					) / 10;
				minDiffVsJma =
					Math.round(
						(openMeteoEcmwf.tomorrowMinTemp - baselineTomMin) * 10,
					) / 10;
			}
		}

		const formatDiff = (diff: number, prefix: string) => {
			if (diff > 0) return `${prefix} +${diff.toFixed(1)}°`;
			if (diff < 0) return `${prefix} ${diff.toFixed(1)}°`;
			return `${prefix} ±0°`;
		};

		const diffColor = (diff: number) => {
			if (diff <= -1.5) return "#2563EB";
			if (diff >= 1.5) return "#DC2626";
			return "#64748B";
		};

		return (
			<Section style={styles.sectionContainer}>
				{/* 日付切り替え & 予報モデル切り替え */}
				<View style={styles.selectorsRow}>
					{/* 今日 | 明日 */}
					<View style={styles.daySelector}>
						<Pressable
							style={[
								styles.dayTab,
								selectedDay === "today" && styles.dayTabActive,
							]}
							onPress={() => onSelectDay("today")}
							hitSlop={6}
						>
							<Text
								style={[
									styles.dayTabText,
									selectedDay === "today" &&
										styles.dayTabTextActive,
								]}
							>
								今日
							</Text>
						</Pressable>
						<Pressable
							style={[
								styles.dayTab,
								selectedDay === "tomorrow" &&
									styles.dayTabActive,
							]}
							onPress={() => onSelectDay("tomorrow")}
							hitSlop={6}
						>
							<Text
								style={[
									styles.dayTabText,
									selectedDay === "tomorrow" &&
										styles.dayTabTextActive,
								]}
							>
								明日
							</Text>
						</Pressable>
					</View>

					{/* モデル切り替えピル */}
					<View style={styles.modelSelector}>
						<Pressable
							style={[
								styles.modelPill,
								selectedModel === "jmaOfficial" &&
									styles.modelPillActive,
							]}
							onPress={() => onSelectModel("jmaOfficial")}
							hitSlop={6}
						>
							<Text
								style={[
									styles.modelPillText,
									selectedModel === "jmaOfficial" &&
										styles.modelPillTextActive,
								]}
							>
								気象庁公式
							</Text>
						</Pressable>
						<Pressable
							style={[
								styles.modelPill,
								selectedModel === "openMeteoJma" &&
									styles.modelPillActive,
							]}
							onPress={() => onSelectModel("openMeteoJma")}
							hitSlop={6}
						>
							<Text
								style={[
									styles.modelPillText,
									selectedModel === "openMeteoJma" &&
										styles.modelPillTextActive,
								]}
							>
								JMA数値
							</Text>
						</Pressable>
						<Pressable
							style={[
								styles.modelPill,
								selectedModel === "openMeteoEcmwf" &&
									styles.modelPillActive,
							]}
							onPress={() => onSelectModel("openMeteoEcmwf")}
							hitSlop={6}
						>
							<Text
								style={[
									styles.modelPillText,
									selectedModel === "openMeteoEcmwf" &&
										styles.modelPillTextActive,
								]}
							>
								ECMWF欧州
							</Text>
						</Pressable>
					</View>
				</View>

				{/* メイン天気サマリー */}
				<View style={styles.heroRow}>
					{/* 天気アイコンとテキスト */}
					<View style={styles.weatherInfoCol}>
						<View style={styles.iconTitleRow}>
							<Text style={styles.heroIcon}>{weatherIcon}</Text>
							<Text
								style={styles.heroWeatherText}
								numberOfLines={2}
							>
								{weatherText}
							</Text>
						</View>

						<View style={styles.precipRow}>
							<Text style={styles.precipStat}>
								降水 {popText}
							</Text>
							<Text style={styles.precipDivider}>・</Text>
							<Text style={styles.precipStat}>
								雨量 {precipText}
							</Text>
						</View>
					</View>

					{/* 気温表示（最高・最低 双方の差分および体感） */}
					<View style={styles.tempBlock}>
						<View style={styles.tempCol}>
							<Text style={styles.tempSubLabel}>最高</Text>
							<Text style={styles.heroMaxTemp}>
								{maxTemp.toFixed(1)}°
							</Text>
							{apparentMaxTemp !== undefined && (
								<Text style={styles.apparentTempSub}>
									体感 {apparentMaxTemp.toFixed(1)}°
								</Text>
							)}
							<Text
								style={[
									styles.diffText,
									{ color: diffColor(maxDiff) },
								]}
							>
								{formatDiff(maxDiff, diffPrefix)}
							</Text>
						</View>

						<View style={styles.tempSeparator} />

						<View style={styles.tempCol}>
							<Text style={styles.tempSubLabel}>最低</Text>
							<Text style={styles.heroMinTemp}>
								{minTemp.toFixed(1)}°
							</Text>
							{apparentMinTemp !== undefined && (
								<Text style={styles.apparentTempSub}>
									体感 {apparentMinTemp.toFixed(1)}°
								</Text>
							)}
							<Text
								style={[
									styles.diffText,
									{ color: diffColor(minDiff) },
								]}
							>
								{formatDiff(minDiff, diffPrefix)}
							</Text>
						</View>
					</View>
				</View>

				{/* 気象庁公式との差異注記（モデル選択時） */}
				{maxDiffVsJma !== undefined && minDiffVsJma !== undefined && (
					<View style={styles.modelDiffRow}>
						<Text style={styles.modelDiffLabel}>気象庁公式比</Text>
						<Text
							style={[
								styles.modelDiffVal,
								{ color: diffColor(maxDiffVsJma) },
							]}
						>
							最高 {formatDiff(maxDiffVsJma, "")}
						</Text>
						<Text style={styles.modelDiffDivider}>/</Text>
						<Text
							style={[
								styles.modelDiffVal,
								{ color: diffColor(minDiffVsJma) },
							]}
						>
							最低 {formatDiff(minDiffVsJma, "")}
						</Text>
					</View>
				)}

				{/* 服装目安 */}
				{cleanAdvice ? (
					<View style={styles.adviceRow}>
						<Text style={styles.adviceLabel}>服装目安</Text>
						<Text style={styles.adviceText}>{cleanAdvice}</Text>
					</View>
				) : null}
			</Section>
		);
	},
);

const styles = StyleSheet.create({
	sectionContainer: {
		paddingTop: 12,
		paddingBottom: 14,
	},
	selectorsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 14,
		gap: 8,
	},
	daySelector: {
		flexDirection: "row",
		backgroundColor: "#F1F5F9",
		borderRadius: 8,
		padding: 2,
	},
	dayTab: {
		paddingHorizontal: 12,
		paddingVertical: 5,
		borderRadius: 6,
	},
	dayTabActive: {
		backgroundColor: "#FFFFFF",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 2,
		elevation: 1,
	},
	dayTabText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#64748B",
	},
	dayTabTextActive: {
		color: "#0F172A",
		fontWeight: "700",
	},
	modelSelector: {
		flexDirection: "row",
		gap: 4,
	},
	modelPill: {
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderRadius: 6,
		backgroundColor: "#F8FAFC",
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	modelPillActive: {
		backgroundColor: "#0F172A",
		borderColor: "#0F172A",
	},
	modelPillText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#64748B",
	},
	modelPillTextActive: {
		color: "#FFFFFF",
	},
	heroRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	weatherInfoCol: {
		flex: 1,
	},
	iconTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	heroIcon: {
		fontSize: 34,
	},
	heroWeatherText: {
		flex: 1,
		fontSize: 16,
		fontWeight: "700",
		color: "#0F172A",
		lineHeight: 22,
	},
	precipRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 6,
	},
	precipStat: {
		fontSize: 12,
		color: "#64748B",
		fontWeight: "500",
	},
	precipDivider: {
		fontSize: 10,
		color: "#CBD5E1",
	},
	tempBlock: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 10,
		backgroundColor: "#F8FAFC",
	},
	tempCol: {
		alignItems: "center",
		minWidth: 54,
	},
	tempSubLabel: {
		fontSize: 10,
		color: "#94A3B8",
		fontWeight: "600",
		marginBottom: 1,
	},
	heroMaxTemp: {
		fontSize: 22,
		fontWeight: "800",
		color: "#E11D48",
		letterSpacing: -0.5,
	},
	heroMinTemp: {
		fontSize: 22,
		fontWeight: "800",
		color: "#2563EB",
		letterSpacing: -0.5,
	},
	tempSeparator: {
		width: 1,
		height: 44,
		backgroundColor: "#E2E8F0",
	},
	apparentTempSub: {
		fontSize: 10,
		color: "#64748B",
		fontWeight: "500",
		marginTop: 1,
	},
	diffText: {
		fontSize: 10,
		fontWeight: "700",
		marginTop: 2,
	},
	modelDiffRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 8,
		paddingHorizontal: 2,
	},
	modelDiffLabel: {
		fontSize: 10,
		color: "#94A3B8",
		fontWeight: "600",
	},
	modelDiffVal: {
		fontSize: 11,
		fontWeight: "600",
	},
	modelDiffDivider: {
		fontSize: 10,
		color: "#CBD5E1",
	},
	adviceRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 10,
		paddingHorizontal: 2,
	},
	adviceLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "#475569",
		backgroundColor: "#F1F5F9",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	adviceText: {
		flex: 1,
		fontSize: 12,
		color: "#1E293B",
	},
});
