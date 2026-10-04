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
	({
		items,
		selectedDay = "today",
		onDayChange,
		modelLabel = "JMA数値モデル",
	}) => {
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

		// マウント時初期スクロール
		useEffect(() => {
			if (currentIndex > 0 && scrollViewRef.current) {
				const scrollX = Math.max(0, (currentIndex - 1) * 52);
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
				const scrollX = Math.max(0, (targetIndex - 1) * 52);
				scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
			} else {
				const scrollX = Math.max(0, resolvedTomorrowIndex * 52);
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

		return (
			<Section noHorizontalPadding>
				<SectionHeader
					title="時間別推移"
					// subtitle="1時間ごとの気温・降水量"
					rightElement={
						<Text style={styles.sourceNote}>{modelLabel}</Text>
					}
					style={styles.headerPadding}
				/>

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
							resolvedTomorrowIndex * 52 - 80;
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
						const isCurrent = isToday && itemHour === currentHour;
						const hasRain =
							item.pop >= 20 || item.precipitation > 0;
						const isFirstTomorrowItem =
							index === resolvedTomorrowIndex;

						return (
							<React.Fragment key={index}>
								{isFirstTomorrowItem && (
									<View style={styles.daySeparator}>
										<View style={styles.daySeparatorLine} />
										<View style={styles.daySeparatorBadge}>
											<Text
												style={styles.daySeparatorText}
											>
												明日
											</Text>
										</View>
										<View style={styles.daySeparatorLine} />
									</View>
								)}

								<View
									style={[
										styles.itemColumn,
										isPast && styles.itemColumnPast,
										isCurrent && styles.itemColumnCurrent,
									]}
								>
									<Text
										style={[
											styles.timeText,
											isPast && styles.timeTextPast,
											isCurrent && styles.timeTextCurrent,
										]}
									>
										{formatHour(item.time, isCurrent)}
									</Text>

									<Text
										style={[
											styles.weatherIcon,
											isPast && styles.weatherIconPast,
										]}
									>
										{getWeatherIcon(item.weatherCode)}
									</Text>

									<Text
										style={[
											styles.tempText,
											isPast && styles.tempTextPast,
											isCurrent && styles.tempTextCurrent,
										]}
									>
										{Math.round(item.temp)}°
									</Text>

									<View
										style={[
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

									<Text
										style={[
											styles.apparentText,
											isPast && styles.textDimmed,
										]}
									>
										{Math.round(item.apparentTemp)}°
									</Text>
								</View>
							</React.Fragment>
						);
					})}
				</ScrollView>
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
	scrollContent: {
		paddingHorizontal: 20,
		paddingVertical: 2,
		gap: 4,
	},
	itemColumn: {
		alignItems: "center",
		width: 48,
		paddingVertical: 6,
		borderRadius: 6,
	},
	itemColumnPast: {
		opacity: 0.35,
	},
	itemColumnCurrent: {
		backgroundColor: "#EFF6FF",
	},
	timeText: {
		fontSize: 11,
		color: "#64748B",
		fontWeight: "500",
		marginBottom: 4,
	},
	timeTextPast: {
		color: "#94A3B8",
	},
	timeTextCurrent: {
		color: "#2563EB",
		fontWeight: "700",
	},
	weatherIcon: {
		fontSize: 18,
		marginVertical: 2,
	},
	weatherIconPast: {
		opacity: 0.6,
	},
	tempText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#0F172A",
		marginVertical: 2,
	},
	tempTextPast: {
		color: "#94A3B8",
	},
	tempTextCurrent: {
		color: "#2563EB",
	},
	popContainer: {
		paddingHorizontal: 2,
		paddingVertical: 2,
		borderRadius: 4,
		backgroundColor: "transparent",
		alignItems: "center",
		marginBottom: 2,
	},
	popContainerActive: {
		backgroundColor: "#EFF6FF",
	},
	popText: {
		fontSize: 9,
		color: "#94A3B8",
		fontWeight: "600",
	},
	popTextActive: {
		color: "#2563EB",
		fontWeight: "700",
	},
	precipText: {
		fontSize: 8,
		color: "#94A3B8",
		fontWeight: "500",
		marginTop: 1,
	},
	precipTextActive: {
		color: "#2563EB",
		fontWeight: "700",
	},
	apparentText: {
		fontSize: 9,
		color: "#94A3B8",
		marginTop: 1,
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
