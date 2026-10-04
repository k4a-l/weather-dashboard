import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { HourlyForecastItem } from "../types";
import { getWeatherIcon } from "../services/weatherApi";
import { Section, SectionHeader } from "./Section";

interface Props {
	items: HourlyForecastItem[];
	selectedDay?: "today" | "tomorrow";
	onDayChange?: (day: "today" | "tomorrow") => void;
	modelLabel?: string;
}

export const HourlyTimeline: React.FC<Props> = React.memo(
	({ items, selectedDay = "today", onDayChange, modelLabel = "JMA数値" }) => {
		const scrollViewRef = useRef<ScrollView>(null);
		const isProgrammaticScroll = useRef(false);
		const prevSelectedDay = useRef(selectedDay);

		if (!items || items.length === 0) return null;

		const now = new Date();
		const currentHour = now.getHours();
		const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

		// 現在時刻のインデックスを探す
		const currentIndex = items.findIndex((item) => {
			const isToday = item.time.startsWith(todayStr);
			const itemHour = new Date(item.time).getHours();
			return isToday && itemHour === currentHour;
		});

		// 明日開始のインデックス（通常は 24）
		const tomorrowIndex = items.findIndex((item) => {
			return !item.time.startsWith(todayStr);
		});
		const resolvedTomorrowIndex = tomorrowIndex !== -1 ? tomorrowIndex : 24;

		const ITEM_STEP = 54;

		// マウント時初期スクロール
		useEffect(() => {
			if (currentIndex > 0 && scrollViewRef.current) {
				const scrollX = Math.max(0, (currentIndex - 1) * ITEM_STEP);
				scrollViewRef.current.scrollTo({ x: scrollX, animated: false });
			}
		}, [currentIndex]);

		// selectedDay の外部変更に連動してスクロール
		useEffect(() => {
			if (prevSelectedDay.current === selectedDay) return;
			prevSelectedDay.current = selectedDay;

			if (!scrollViewRef.current) return;
			isProgrammaticScroll.current = true;

			if (selectedDay === "today") {
				const targetIndex = currentIndex >= 0 ? currentIndex : 0;
				const scrollX = Math.max(0, (targetIndex - 1) * ITEM_STEP);
				scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
			} else {
				const scrollX = Math.max(0, resolvedTomorrowIndex * ITEM_STEP);
				scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
			}

			const timer = setTimeout(() => {
				isProgrammaticScroll.current = false;
			}, 400);
			return () => clearTimeout(timer);
		}, [selectedDay, currentIndex, resolvedTomorrowIndex]);

		const formatHour = (isoString: string, isCurrent: boolean) => {
			if (isCurrent) return "現在";
			const date = new Date(isoString);
			return `${date.getHours()}時`;
		};

		const getWindDirectionLabel = (deg?: number): string => {
			if (deg === undefined || isNaN(deg)) return "";
			const directions = [
				"北",
				"北東",
				"東",
				"南東",
				"南",
				"南西",
				"西",
				"北西",
			];
			const index = Math.round(deg / 45) % 8;
			return directions[index];
		};

		const formatWind = (speed?: number, deg?: number): string => {
			if (speed === undefined || isNaN(speed)) return "-";
			const dir = getWindDirectionLabel(deg);
			return dir
				? `${dir} ${Math.round(speed)}m`
				: `${Math.round(speed)}m`;
		};

		return (
			<Section noHorizontalPadding>
				<SectionHeader
					title="時間別推移"
					rightElement={
						<Text style={styles.sourceNote}>{modelLabel}</Text>
					}
					style={styles.headerPadding}
				/>

				<View style={styles.timelineWrapper}>
					{/* 左側の固定タイトルラベル列 */}
					<View style={styles.fixedColumn}>
						<View style={styles.cellTime}>
							<Text style={styles.fixedLabelText}>時間</Text>
						</View>
						<View style={styles.cellIcon}>
							<Text style={styles.fixedLabelText}>天気</Text>
						</View>
						<View style={styles.cellTemp}>
							<Text style={styles.fixedLabelText}>気温</Text>
						</View>
						<View style={styles.cellPrecip}>
							<Text style={styles.fixedLabelText}>降水</Text>
						</View>
						<View style={styles.cellHumidity}>
							<Text style={styles.fixedLabelText}>湿度</Text>
						</View>
						<View style={styles.cellWind}>
							<Text style={styles.fixedLabelText}>風速</Text>
						</View>
					</View>

					{/* 右側の時間別スクロール領域 */}
					<ScrollView
						ref={scrollViewRef}
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}
						scrollEventThrottle={32}
						onScroll={(event) => {
							if (isProgrammaticScroll.current) return;
							const x = event.nativeEvent.contentOffset.x;
							const tomorrowThreshold =
								resolvedTomorrowIndex * ITEM_STEP - 80;
							const detectedDay =
								x >= tomorrowThreshold ? "tomorrow" : "today";
							if (detectedDay !== selectedDay && onDayChange) {
								onDayChange(detectedDay);
							}
						}}
						onMomentumScrollEnd={() => {
							isProgrammaticScroll.current = false;
						}}
					>
						{items.map((item, index) => {
							const date = new Date(item.time);
							const itemHour = date.getHours();
							const isToday = item.time.startsWith(todayStr);
							const isPast = isToday
								? itemHour < currentHour
								: date < now;
							const isCurrent =
								isToday && itemHour === currentHour;
							const hasRain =
								item.pop >= 20 || item.precipitation > 0;
							const isFirstTomorrowItem =
								index === resolvedTomorrowIndex;

							return (
								<React.Fragment key={index}>
									{isFirstTomorrowItem && (
										<View style={styles.daySeparator}>
											<View
												style={styles.daySeparatorLine}
											/>
											<View
												style={styles.daySeparatorBadge}
											>
												<Text
													style={
														styles.daySeparatorText
													}
												>
													明日
												</Text>
											</View>
											<View
												style={styles.daySeparatorLine}
											/>
										</View>
									)}

									<View
										style={[
											styles.itemColumn,
											isPast && styles.itemColumnPast,
											isCurrent &&
												styles.itemColumnCurrent,
										]}
									>
										<View style={styles.cellTime}>
											<Text
												style={[
													styles.timeText,
													isPast &&
														styles.timeTextPast,
													isCurrent &&
														styles.timeTextCurrent,
												]}
											>
												{formatHour(
													item.time,
													isCurrent,
												)}
											</Text>
										</View>

										<View style={styles.cellIcon}>
											<Text
												style={[
													styles.weatherIcon,
													isPast &&
														styles.weatherIconPast,
												]}
											>
												{getWeatherIcon(
													item.weatherCode,
												)}
											</Text>
										</View>

										<View style={styles.cellTemp}>
											<Text
												style={[
													styles.tempText,
													isPast &&
														styles.tempTextPast,
													isCurrent &&
														styles.tempTextCurrent,
												]}
											>
												{Math.round(item.temp)}°
											</Text>
										</View>

										<View
											style={[
												styles.cellPrecip,
												styles.popContainer,
												hasRain &&
													!isPast &&
													styles.popContainerActive,
											]}
										>
											<Text
												style={[
													styles.popText,
													hasRain &&
														!isPast &&
														styles.popTextActive,
													isPast && styles.textDimmed,
												]}
											>
												{item.pop}%
											</Text>
											<Text
												style={[
													styles.precipText,
													item.precipitation > 0 &&
														!isPast &&
														styles.precipTextActive,
													isPast && styles.textDimmed,
												]}
											>
												{item.precipitation}mm
											</Text>
										</View>

										<View style={styles.cellHumidity}>
											<Text
												style={[
													styles.humidityText,
													isPast && styles.textDimmed,
												]}
											>
												{item.humidity !== undefined
													? `${item.humidity}%`
													: "-"}
											</Text>
										</View>

										<View style={styles.cellWind}>
											<Text
												style={[
													styles.windText,
													isPast && styles.textDimmed,
												]}
												numberOfLines={1}
											>
												{formatWind(
													item.windSpeed,
													item.windDirection,
												)}
											</Text>
										</View>
									</View>
								</React.Fragment>
							);
						})}
					</ScrollView>
				</View>
			</Section>
		);
	},
);

const styles = StyleSheet.create({
	headerPadding: {
		paddingHorizontal: 20,
	},
	sourceNote: {
		fontSize: 11,
		fontWeight: "500",
		color: "#94A3B8",
	},
	timelineWrapper: {
		flexDirection: "row",
		alignItems: "stretch",
		marginHorizontal: 20,
		overflow: "hidden",
		backgroundColor: "#F8FAFC",
		borderRadius: 10,
	},
	fixedColumn: {
		width: 32,
		paddingRight: 6,
		paddingVertical: 6,
		borderRightWidth: 1,
		borderRightColor: "#E2E8F0",
		backgroundColor: "#F8FAFC",
		gap: 6,
		zIndex: 10,
	},
	fixedLabelText: {
		fontSize: 10,
		fontWeight: "600",
		color: "#94A3B8",
	},
	scrollContent: {
		paddingLeft: 8,
		paddingRight: 8,
		paddingVertical: 6,
		gap: 4,
	},
	itemColumn: {
		alignItems: "center",
		width: 50,
		paddingVertical: 6,
		borderRadius: 6,
		gap: 6,
	},
	itemColumnPast: {
		opacity: 0.35,
	},
	itemColumnCurrent: {
		backgroundColor: "#EFF6FF",
	},
	cellTime: {
		height: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	cellIcon: {
		height: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	cellTemp: {
		height: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	cellPrecip: {
		height: 28,
		justifyContent: "center",
		alignItems: "center",
	},
	cellHumidity: {
		height: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	cellWind: {
		height: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	timeText: {
		fontSize: 11,
		color: "#64748B",
		fontWeight: "500",
	},
	timeTextPast: {
		color: "#94A3B8",
	},
	timeTextCurrent: {
		color: "#2563EB",
		fontWeight: "700",
	},
	weatherIcon: {
		fontSize: 17,
	},
	weatherIconPast: {
		opacity: 0.6,
	},
	tempText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#0F172A",
	},
	tempTextPast: {
		color: "#94A3B8",
	},
	tempTextCurrent: {
		color: "#2563EB",
	},
	popContainer: {
		paddingHorizontal: 2,
		borderRadius: 4,
		backgroundColor: "transparent",
		alignItems: "center",
		justifyContent: "center",
	},
	popContainerActive: {
		backgroundColor: "#EFF6FF",
	},
	popText: {
		fontSize: 9,
		color: "#94A3B8",
		fontWeight: "600",
		lineHeight: 12,
	},
	popTextActive: {
		color: "#2563EB",
		fontWeight: "700",
	},
	precipText: {
		fontSize: 8,
		color: "#94A3B8",
		fontWeight: "500",
		lineHeight: 11,
	},
	precipTextActive: {
		color: "#2563EB",
		fontWeight: "700",
	},
	humidityText: {
		fontSize: 10,
		color: "#475569",
		fontWeight: "600",
	},
	windText: {
		fontSize: 9,
		color: "#475569",
		fontWeight: "600",
	},
	textDimmed: {
		color: "#94A3B8",
	},
	daySeparator: {
		width: 32,
		alignItems: "center",
		justifyContent: "center",
		marginHorizontal: 4,
	},
	daySeparatorLine: {
		width: 1,
		flex: 1,
		backgroundColor: "#E2E8F0",
	},
	daySeparatorBadge: {
		paddingHorizontal: 5,
		paddingVertical: 3,
		borderRadius: 4,
		backgroundColor: "#F1F5F9",
		borderWidth: 1,
		borderColor: "#E2E8F0",
		marginVertical: 4,
	},
	daySeparatorText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#475569",
	},
});
