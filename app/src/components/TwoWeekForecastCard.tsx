import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { DailyForecastItem } from "../types";
import { getWeatherIcon } from "../services/weatherApi";
import { Section, SectionHeader } from "./Section";

interface Props {
	jmaWeekly: DailyForecastItem[];
	openMeteoJmaDaily: DailyForecastItem[];
	openMeteoEcmwfDaily: DailyForecastItem[];
}

export const TwoWeekForecastCard: React.FC<Props> = React.memo(
	({ jmaWeekly, openMeteoJmaDaily, openMeteoEcmwfDaily }) => {
		const allDates = useMemo(() => {
			return Array.from(
				new Set([
					...openMeteoEcmwfDaily.map((d) => d.date),
					...openMeteoJmaDaily.map((d) => d.date),
					...jmaWeekly.map((d) => d.date),
				]),
			).sort();
		}, [jmaWeekly, openMeteoJmaDaily, openMeteoEcmwfDaily]);

		const formatDateLabel = (dateStr: string) => {
			const parts = dateStr.split("-");
			if (parts.length < 3) {
				return {
					label: dateStr,
					dayName: "",
					isWeekend: false,
					isSunday: false,
				};
			}
			const month = parseInt(parts[1], 10);
			const day = parseInt(parts[2], 10);

			const d = new Date(parseInt(parts[0], 10), month - 1, day);
			const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
			const dayName = dayNames[d.getDay()];

			return {
				label: `${month}/${day}`,
				dayName,
				isWeekend: d.getDay() === 0 || d.getDay() === 6,
				isSunday: d.getDay() === 0,
			};
		};

		return (
			<Section>
				<SectionHeader
					title="14日間の週間予報"
					// subtitle="気象庁公式・JMA数値・ECMWF欧州の対比"
				/>

				{/* テーブルヘッダー */}
				<View style={styles.tableHeader}>
					<Text style={[styles.headerCol, styles.dateCol]}>日付</Text>
					<Text style={[styles.headerCol, styles.modelCol]}>
						気象庁
					</Text>
					<Text style={[styles.headerCol, styles.modelCol]}>
						JMA数値
					</Text>
					<Text style={[styles.headerCol, styles.modelCol]}>
						ECMWF欧州
					</Text>
				</View>

				{/* テーブル行リスト */}
				<View style={styles.tableBody}>
					{allDates.map((dateStr, idx) => {
						const dateInfo = formatDateLabel(dateStr);
						const jmaItem = jmaWeekly.find(
							(d) => d.date === dateStr,
						);
						const jmaModelItem = openMeteoJmaDaily.find(
							(d) => d.date === dateStr,
						);
						const ecmwfItem = openMeteoEcmwfDaily.find(
							(d) => d.date === dateStr,
						);

						return (
							<View
								key={dateStr}
								style={[
									styles.tableRow,
									idx % 2 === 1 && styles.tableRowAlt,
								]}
							>
								{/* 日付カラム */}
								<View style={styles.dateCol}>
									<Text style={styles.dateText}>
										{dateInfo.label}
									</Text>
									<Text
										style={[
											styles.dayText,
											dateInfo.isSunday &&
												styles.sundayText,
											dateInfo.isWeekend &&
												!dateInfo.isSunday &&
												styles.saturdayText,
										]}
									>
										{dateInfo.dayName}
									</Text>
								</View>

								{/* 気象庁公式 */}
								<View style={styles.modelCol}>
									{jmaItem ? (
										<>
											<Text style={styles.weatherIcon}>
												{getWeatherIcon(
													jmaItem.weatherText,
												)}
											</Text>
											<View style={styles.tempGroup}>
												<Text style={styles.maxTemp}>
													{jmaItem.maxTemp !==
													undefined
														? `${Math.round(jmaItem.maxTemp)}°`
														: "-"}
												</Text>
												<Text style={styles.tempSlash}>
													/
												</Text>
												<Text style={styles.minTemp}>
													{jmaItem.minTemp !==
													undefined
														? `${Math.round(jmaItem.minTemp)}°`
														: "-"}
												</Text>
											</View>
											{jmaItem.pop !== undefined && (
												<Text style={styles.popText}>
													{jmaItem.pop}%
												</Text>
											)}
										</>
									) : (
										<Text style={styles.emptyText}>-</Text>
									)}
								</View>

								{/* JMA数値モデル */}
								<View style={styles.modelCol}>
									{jmaModelItem &&
									jmaModelItem.maxTemp !== undefined ? (
										<>
											<Text style={styles.weatherIcon}>
												{getWeatherIcon(
													jmaModelItem.weatherCode ??
														0,
												)}
											</Text>
											<View style={styles.tempGroup}>
												<Text style={styles.maxTemp}>
													{Math.round(
														jmaModelItem.maxTemp,
													)}
													°
												</Text>
												<Text style={styles.tempSlash}>
													/
												</Text>
												<Text style={styles.minTemp}>
													{Math.round(
														jmaModelItem.minTemp ??
															0,
													)}
													°
												</Text>
											</View>
											{jmaModelItem.pop !== undefined && (
												<View style={styles.popRow}>
													<Text
														style={styles.popText}
													>
														{jmaModelItem.pop}%
													</Text>
													{jmaModelItem.precipitation !==
														undefined && (
														<Text
															style={
																styles.precipText
															}
														>
															{
																jmaModelItem.precipitation
															}
															mm
														</Text>
													)}
												</View>
											)}
										</>
									) : (
										<Text style={styles.emptyText}>-</Text>
									)}
								</View>

								{/* ECMWF欧州モデル */}
								<View style={styles.modelCol}>
									{ecmwfItem &&
									ecmwfItem.maxTemp !== undefined ? (
										<>
											<Text style={styles.weatherIcon}>
												{getWeatherIcon(
													ecmwfItem.weatherCode ?? 0,
												)}
											</Text>
											<View style={styles.tempGroup}>
												<Text style={styles.maxTemp}>
													{Math.round(
														ecmwfItem.maxTemp,
													)}
													°
												</Text>
												<Text style={styles.tempSlash}>
													/
												</Text>
												<Text style={styles.minTemp}>
													{Math.round(
														ecmwfItem.minTemp ?? 0,
													)}
													°
												</Text>
											</View>
											{ecmwfItem.pop !== undefined && (
												<View style={styles.popRow}>
													<Text
														style={styles.popText}
													>
														{ecmwfItem.pop}%
													</Text>
													{ecmwfItem.precipitation !==
														undefined && (
														<Text
															style={
																styles.precipText
															}
														>
															{
																ecmwfItem.precipitation
															}
															mm
														</Text>
													)}
												</View>
											)}
										</>
									) : (
										<Text style={styles.emptyText}>-</Text>
									)}
								</View>
							</View>
						);
					})}
				</View>
			</Section>
		);
	},
);

const styles = StyleSheet.create({
	tableHeader: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 5,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		backgroundColor: "#F8FAFC",
		borderRadius: 6,
		paddingHorizontal: 4,
	},
	headerCol: {
		fontSize: 10,
		fontWeight: "600",
		color: "#64748B",
		textAlign: "center",
	},
	tableBody: {
		marginTop: 2,
	},
	tableRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 4.5,
		paddingHorizontal: 4,
		borderBottomWidth: 1,
		borderBottomColor: "#F1F5F9",
	},
	tableRowAlt: {
		backgroundColor: "#FAFAFA",
	},
	dateCol: {
		width: 52,
		flexDirection: "row",
		alignItems: "baseline",
		gap: 2,
	},
	dateText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#1E293B",
	},
	dayText: {
		fontSize: 10,
		fontWeight: "600",
		color: "#64748B",
	},
	sundayText: {
		color: "#E11D48",
	},
	saturdayText: {
		color: "#2563EB",
	},
	modelCol: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	weatherIcon: {
		fontSize: 15,
		marginBottom: 1,
	},
	tempGroup: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	maxTemp: {
		fontSize: 11,
		fontWeight: "700",
		color: "#E11D48",
	},
	tempSlash: {
		fontSize: 9,
		color: "#CBD5E1",
	},
	minTemp: {
		fontSize: 11,
		fontWeight: "600",
		color: "#2563EB",
	},
	popRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	popText: {
		fontSize: 9,
		fontWeight: "600",
		color: "#0284C7",
	},
	precipText: {
		fontSize: 8,
		fontWeight: "500",
		color: "#64748B",
	},
	emptyText: {
		fontSize: 11,
		color: "#CBD5E1",
	},
});
