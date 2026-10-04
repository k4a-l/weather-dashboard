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

interface DayWeatherDisplay {
	icon: string;
	weatherText: string;
	maxTemp: number;
	minTemp: number;
	maxDiff: number;
	minDiff: number;
	popText: string;
	precipText: string;
	apparentMaxTemp?: number;
	apparentMinTemp?: number;
	maxDiffVsJma?: number;
	minDiffVsJma?: number;
}

function resolveDayDisplayData(
	day: "today" | "tomorrow",
	model: WeatherModelId,
	jma: JmaForecastData,
	openMeteoJma: ModelForecast,
	openMeteoEcmwf: ModelForecast,
): DayWeatherDisplay {
	const isToday = day === "today";
	const activeModel =
		model === "openMeteoEcmwf" ? openMeteoEcmwf : openMeteoJma;

	const apparentMaxTemp = isToday
		? activeModel.todayApparentMaxTemp
		: activeModel.tomorrowApparentMaxTemp;
	const apparentMinTemp = isToday
		? activeModel.todayApparentMinTemp
		: activeModel.tomorrowApparentMinTemp;

	const jmaMax = isToday ? jma.todayMaxTemp : jma.tomorrowMaxTemp;
	const jmaMin = isToday ? jma.todayMinTemp : jma.tomorrowMinTemp;
	const omJmaMax = isToday
		? openMeteoJma.maxTemp
		: openMeteoJma.tomorrowMaxTemp;
	const omJmaMin = isToday
		? openMeteoJma.minTemp
		: openMeteoJma.tomorrowMinTemp;

	const baselineMax = jmaMax ?? omJmaMax;
	let baselineMin = jmaMin ?? omJmaMin;
	if (baselineMin === baselineMax && omJmaMin !== baselineMax) {
		baselineMin = omJmaMin;
	}

	if (model === "jmaOfficial") {
		const rawWeather = isToday
			? jma.todayWeather
			: jma.tomorrowWeather || "くもり";
		const pops = isToday ? jma.todayPops : jma.tomorrowPops || [];
		const fallbackPop = isToday
			? openMeteoJma.popMax
			: openMeteoJma.tomorrowPopMax;
		const popText =
			pops.length > 0 ? `${pops[pops.length - 1]}%` : `${fallbackPop}%`;
		const precip = isToday
			? openMeteoJma.precipitationSum
			: openMeteoJma.tomorrowPrecipitationSum;

		const todayBaselineMax = jma.todayMaxTemp ?? openMeteoJma.maxTemp;
		const todayBaselineMin = jma.todayMinTemp ?? openMeteoJma.minTemp;

		const maxDiff = isToday
			? Math.round((todayBaselineMax - openMeteoJma.prevMaxTemp) * 10) /
				10
			: Math.round((baselineMax - todayBaselineMax) * 10) / 10;
		const minDiff = isToday
			? Math.round((todayBaselineMin - openMeteoJma.prevMinTemp) * 10) /
				10
			: Math.round((baselineMin - todayBaselineMin) * 10) / 10;

		return {
			icon: getWeatherIcon(rawWeather),
			weatherText: rawWeather,
			maxTemp: baselineMax,
			minTemp: baselineMin,
			maxDiff,
			minDiff,
			popText,
			precipText: precip !== undefined ? `${precip}mm` : "0mm",
			apparentMaxTemp,
			apparentMinTemp,
		};
	}

	const targetModel =
		model === "openMeteoJma" ? openMeteoJma : openMeteoEcmwf;
	const weatherCode = isToday
		? targetModel.todayWeatherCode
		: targetModel.tomorrowWeatherCode;
	const weatherText = isToday
		? targetModel.todayWeatherText
		: targetModel.tomorrowWeatherText;
	const maxTemp = isToday ? targetModel.maxTemp : targetModel.tomorrowMaxTemp;
	const minTemp = isToday ? targetModel.minTemp : targetModel.tomorrowMinTemp;
	const maxDiff = isToday
		? targetModel.maxTempDiff
		: targetModel.tomorrowMaxTempDiff;
	const minDiff = isToday
		? targetModel.minTempDiff
		: targetModel.tomorrowMinTempDiff;
	const pop = isToday ? targetModel.popMax : targetModel.tomorrowPopMax;
	const precip = isToday
		? targetModel.precipitationSum
		: targetModel.tomorrowPrecipitationSum;

	const maxDiffVsJma = Math.round((maxTemp - baselineMax) * 10) / 10;
	const minDiffVsJma = Math.round((minTemp - baselineMin) * 10) / 10;

	return {
		icon: getWeatherIcon(weatherCode),
		weatherText,
		maxTemp,
		minTemp,
		maxDiff,
		minDiff,
		popText: `${pop}%`,
		precipText: `${precip ?? 0}mm`,
		apparentMaxTemp,
		apparentMinTemp,
		maxDiffVsJma,
		minDiffVsJma,
	};
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

		const today = resolveDayDisplayData(
			"today",
			selectedModel,
			jma,
			openMeteoJma,
			openMeteoEcmwf,
		);
		const tomorrow = resolveDayDisplayData(
			"tomorrow",
			selectedModel,
			jma,
			openMeteoJma,
			openMeteoEcmwf,
		);

		const isToday = selectedDay === "today";
		const active = isToday ? today : tomorrow;

		const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
		const now = new Date();
		const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
		const todayDateLabel = `${jstNow.getUTCMonth() + 1}/${jstNow.getUTCDate()}(${weekdays[jstNow.getUTCDay()]})`;

		const jstTomorrow = new Date(jstNow.getTime() + 24 * 60 * 60 * 1000);
		const tomorrowDateLabel = `${jstTomorrow.getUTCMonth() + 1}/${jstTomorrow.getUTCDate()}(${weekdays[jstTomorrow.getUTCDay()]})`;

		const formatTemp = (temp?: number) => {
			if (temp === undefined || isNaN(temp)) return "--℃";
			const rounded = Math.round(temp * 10) / 10;
			return Number.isInteger(rounded)
				? `${rounded}℃`
				: `${rounded.toFixed(1)}℃`;
		};

		const formatDiff = (diff: number, prefix: string = "") => {
			const rounded = Math.round(diff * 10) / 10;
			const valStr = Number.isInteger(rounded)
				? `${rounded}`
				: rounded.toFixed(1);
			if (rounded > 0) return `${prefix}+${valStr}℃`;
			if (rounded < 0) return `${prefix}${valStr}℃`;
			return `${prefix}±0℃`;
		};

		const diffColor = (diff: number) => {
			if (diff <= -1.5) return "#2563EB";
			if (diff >= 1.5) return "#DC2626";
			return "#64748B";
		};

		return (
			<Section style={styles.sectionContainer}>
				{/* 上部: 予報モデル切り替えピル */}
				<View style={styles.headerRow}>
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
								気象庁
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

				{/* 今日 ＆ 明日 2大統合カード（トグルボタン） */}
				<View style={styles.dualCardsRow}>
					{/* 今日カード */}
					<Pressable
						style={[
							styles.dayCard,
							isToday
								? styles.dayCardActive
								: styles.dayCardInactive,
						]}
						onPress={() => onSelectDay("today")}
					>
						<View style={styles.cardTopRow}>
							<View
								style={[
									styles.dayBadge,
									isToday && styles.dayBadgeActive,
								]}
							>
								<Text
									style={[
										styles.dayBadgeText,
										isToday && styles.dayBadgeTextActive,
									]}
								>
									今日
								</Text>
								<Text
									style={[
										styles.cardDateLabel,
										isToday && styles.cardDateLabelActive,
									]}
								>
									{todayDateLabel}
								</Text>
							</View>
						</View>

						<View style={styles.cardCenterRow}>
							<Text style={styles.cardWeatherIcon}>
								{today.icon}
							</Text>
							<View style={styles.cardTempCols}>
								<View style={styles.cardTempCol}>
									<Text style={styles.cardMaxTemp}>
										{formatTemp(today.maxTemp)}
									</Text>
									<Text style={styles.cardDiffText}>
										{formatDiff(today.maxDiff)}
									</Text>
								</View>
								<Text style={styles.cardTempSlash}>/</Text>
								<View style={styles.cardTempCol}>
									<Text style={styles.cardMinTemp}>
										{formatTemp(today.minTemp)}
									</Text>
									<Text style={styles.cardDiffText}>
										{formatDiff(today.minDiff)}
									</Text>
								</View>
							</View>
						</View>

						<View style={styles.cardMetaBlock}>
							{today.apparentMaxTemp !== undefined &&
								today.apparentMinTemp !== undefined && (
									<View style={styles.cardMetaRow}>
										<Text style={styles.cardMetaLabel}>
											体感
										</Text>
										<Text style={styles.cardMetaValue}>
											{formatTemp(today.apparentMaxTemp)}{" "}
											/{" "}
											{formatTemp(today.apparentMinTemp)}
										</Text>
									</View>
								)}
							<View style={styles.cardMetaRow}>
								<Text style={styles.cardMetaLabel}>降水</Text>
								<Text style={styles.cardMetaValue}>
									☂ {today.popText} ({today.precipText})
								</Text>
							</View>
						</View>
					</Pressable>

					{/* 明日カード */}
					<Pressable
						style={[
							styles.dayCard,
							!isToday
								? styles.dayCardActive
								: styles.dayCardInactive,
						]}
						onPress={() => onSelectDay("tomorrow")}
					>
						<View style={styles.cardTopRow}>
							<View
								style={[
									styles.dayBadge,
									!isToday && styles.dayBadgeActive,
								]}
							>
								<Text
									style={[
										styles.dayBadgeText,
										!isToday && styles.dayBadgeTextActive,
									]}
								>
									明日
								</Text>

								<Text
									style={[
										styles.cardDateLabel,
										!isToday && styles.cardDateLabelActive,
									]}
								>
									{tomorrowDateLabel}
								</Text>
							</View>
						</View>

						<View style={styles.cardCenterRow}>
							<Text style={styles.cardWeatherIcon}>
								{tomorrow.icon}
							</Text>
							<View style={styles.cardTempCols}>
								<View style={styles.cardTempCol}>
									<Text style={styles.cardMaxTemp}>
										{formatTemp(tomorrow.maxTemp)}
									</Text>
									<Text style={styles.cardDiffText}>
										{formatDiff(tomorrow.maxDiff)}
									</Text>
								</View>
								<Text style={styles.cardTempSlash}>/</Text>
								<View style={styles.cardTempCol}>
									<Text style={styles.cardMinTemp}>
										{formatTemp(tomorrow.minTemp)}
									</Text>
									<Text style={styles.cardDiffText}>
										{formatDiff(tomorrow.minDiff)}
									</Text>
								</View>
							</View>
						</View>

						<View style={styles.cardMetaBlock}>
							{tomorrow.apparentMaxTemp !== undefined &&
								tomorrow.apparentMinTemp !== undefined && (
									<View style={styles.cardMetaRow}>
										<Text style={styles.cardMetaLabel}>
											体感
										</Text>
										<Text style={styles.cardMetaValue}>
											{formatTemp(
												tomorrow.apparentMaxTemp,
											)}{" "}
											/{" "}
											{formatTemp(
												tomorrow.apparentMinTemp,
											)}
										</Text>
									</View>
								)}
							<View style={styles.cardMetaRow}>
								<Text style={styles.cardMetaLabel}>降水</Text>
								<Text style={styles.cardMetaValue}>
									☂ {tomorrow.popText} ({tomorrow.precipText})
								</Text>
							</View>
						</View>
					</Pressable>
				</View>

				{/* 共通詳細エリア（選択中日の概況文言・公式比・服装目安） */}
				<View style={styles.sharedDetailArea}>
					{/* 天気概況文言 */}
					<View style={styles.weatherSummaryRow}>
						<Text style={styles.summaryText} numberOfLines={2}>
							{active.weatherText}
						</Text>
					</View>

					{/* 気象庁公式との差異注記（モデル選択時） */}
					{active.maxDiffVsJma !== undefined &&
						active.minDiffVsJma !== undefined && (
							<View style={styles.modelDiffRow}>
								<Text style={styles.adviceLabel}>気象庁比</Text>
								<Text
									style={[
										styles.modelDiffVal,
										{
											color: diffColor(
												active.maxDiffVsJma,
											),
										},
									]}
								>
									最高 {formatDiff(active.maxDiffVsJma, "")}
								</Text>
								<Text style={styles.modelDiffDivider}>/</Text>
								<Text
									style={[
										styles.modelDiffVal,
										{
											color: diffColor(
												active.minDiffVsJma,
											),
										},
									]}
								>
									最低 {formatDiff(active.minDiffVsJma, "")}
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
				</View>
			</Section>
		);
	},
);

const styles = StyleSheet.create({
	sectionContainer: {
		paddingTop: 12,
		paddingBottom: 14,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	headerTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#0F172A",
	},
	modelSelector: {
		flexDirection: "row",
		marginLeft: "auto",
		gap: 4,
	},
	modelPill: {
		paddingHorizontal: 8,
		paddingVertical: 4,
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
	dualCardsRow: {
		flexDirection: "row",
		gap: 10,
	},
	dayCard: {
		flex: 1,
		borderRadius: 14,
		padding: 10,
		borderWidth: 2,
	},
	dayCardActive: {
		backgroundColor: "#F0F7FF",
		borderColor: "#2563EB",
		shadowColor: "#2563EB",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.12,
		shadowRadius: 6,
		elevation: 3,
	},
	dayCardInactive: {
		backgroundColor: "#F8FAFC",
		borderColor: "#E2E8F0",
		opacity: 0.85,
	},
	cardTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 6,
	},
	dayBadge: {
		paddingHorizontal: 7,
		paddingVertical: 2,
		borderRadius: 5,
		backgroundColor: "#E2E8F0",
		flexDirection: "row",
		gap: 1,
	},
	dayBadgeActive: {
		backgroundColor: "#2563EB",
	},
	dayBadgeText: {
		fontSize: 11.5,
		fontWeight: "700",
		color: "#475569",
	},
	dayBadgeTextActive: {
		color: "#FFFFFF",
	},
	cardDateLabel: {
		fontSize: 11.5,
		fontWeight: "600",
		color: "#475569",
	},
	cardDateLabelActive: {
		color: "#FFFFFF",
	},
	selectedIndicator: {
		backgroundColor: "#DBEAFE",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	selectedIndicatorText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#1D4ED8",
	},
	cardCenterRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginVertical: 2,
	},
	cardWeatherIcon: {
		fontSize: 28,
	},
	cardTempCols: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "flex-end",
		gap: 6,
	},
	cardTempCol: {
		alignItems: "flex-end",
	},
	cardMaxTemp: {
		fontSize: 16.5,
		fontWeight: "800",
		color: "#E11D48",
		letterSpacing: -0.5,
		lineHeight: 20,
	},
	cardTempSlash: {
		fontSize: 14,
		fontWeight: "400",
		color: "#94A3B8",
		marginTop: 1,
	},
	cardMinTemp: {
		fontSize: 16.5,
		fontWeight: "800",
		color: "#2563EB",
		letterSpacing: -0.5,
		lineHeight: 20,
	},
	cardDiffText: {
		fontSize: 10,
		fontWeight: "600",
		color: "#64748B",
		marginTop: 0,
		lineHeight: 13,
	},
	cardMetaBlock: {
		marginTop: 6,
		paddingTop: 5,
		borderTopWidth: 1,
		borderTopColor: "rgba(226, 232, 240, 0.8)",
		gap: 2,
	},
	cardMetaRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	cardMetaLabel: {
		fontSize: 10,
		fontWeight: "700",
		color: "#64748B",
	},
	cardMetaValue: {
		fontSize: 10.5,
		fontWeight: "600",
		color: "#334155",
	},
	sharedDetailArea: {
		marginTop: 12,
		backgroundColor: "#F8FAFC",
		borderRadius: 10,
		padding: 10,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		gap: 8,
	},
	weatherSummaryRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		flexWrap: "wrap",
	},
	summaryIcon: {
		fontSize: 15,
	},
	summaryText: {
		fontSize: 12.5,
		fontWeight: "600",
		color: "#334155",
		lineHeight: 17,
	},
	modelDiffRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingTop: 6,
		borderTopWidth: 1,
		borderTopColor: "#E2E8F0",
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
		paddingTop: 6,
		borderTopWidth: 1,
		borderTopColor: "#E2E8F0",
	},
	adviceLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "#475569",
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	adviceText: {
		flex: 1,
		fontSize: 12,
		color: "#1E293B",
	},
});
