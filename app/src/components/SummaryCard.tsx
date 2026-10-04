import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AggregatedWeatherData } from "../types";
import { getWeatherIcon } from "../services/weatherApi";

interface Props {
	data: AggregatedWeatherData;
}

export const SummaryCard: React.FC<Props> = ({ data }) => {
	const { city, jma, openMeteoJma } = data;
	const maxTemp = openMeteoJma.maxTemp;
	const minTemp = openMeteoJma.minTemp;
	const maxDiff = openMeteoJma.maxTempDiff;
	const minDiff = openMeteoJma.minTempDiff;
	const pop = openMeteoJma.popMax;

	const formatDiff = (diff: number) => {
		if (diff > 0) return `+${diff.toFixed(1)}℃ 🔺`;
		if (diff < 0) return `${diff.toFixed(1)}℃ 🔻`;
		return `±0℃`;
	};

	const diffBadgeColor = (diff: number) => {
		if (diff <= -2) return "#3B82F6"; // 寒くなった (青)
		if (diff >= 2) return "#EF4444"; // 暖かくなった (赤)
		return "#6B7280";
	};

	return (
		<View style={styles.card}>
			<View style={styles.headerRow}>
				<Text style={styles.cityName}>📍 {city.name}</Text>
				<Text style={styles.dateText}>
					{new Date(data.generatedAt).toLocaleTimeString("ja-JP", {
						hour: "2-digit",
						minute: "2-digit",
					})}{" "}
					更新
				</Text>
			</View>

			<View style={styles.mainWeatherRow}>
				<Text style={styles.weatherIcon}>
					{getWeatherIcon(jma.todayWeather)}
				</Text>
				<View style={styles.weatherTextContainer}>
					<Text style={styles.weatherDescription}>
						{jma.todayWeather}
					</Text>
					<Text style={styles.popText}>☔ 降水確率: {pop}%</Text>
				</View>
			</View>

			<View style={styles.tempSection}>
				<View style={styles.tempBox}>
					<Text style={styles.tempLabel}>最高気温</Text>
					<Text style={styles.maxTempText}>
						{maxTemp.toFixed(1)}°
					</Text>
					<View
						style={[
							styles.diffBadge,
							{ backgroundColor: diffBadgeColor(maxDiff) },
						]}
					>
						<Text style={styles.diffText}>
							前日比 {formatDiff(maxDiff)}
						</Text>
					</View>
				</View>

				<View style={styles.divider} />

				<View style={styles.tempBox}>
					<Text style={styles.tempLabel}>最低気温</Text>
					<Text style={styles.minTempText}>
						{minTemp.toFixed(1)}°
					</Text>
					<View
						style={[
							styles.diffBadge,
							{ backgroundColor: diffBadgeColor(minDiff) },
						]}
					>
						<Text style={styles.diffText}>
							前日比 {formatDiff(minDiff)}
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 20,
		marginHorizontal: 16,
		marginVertical: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 3,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	cityName: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#1F2937",
	},
	dateText: {
		fontSize: 12,
		color: "#9CA3AF",
	},
	mainWeatherRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	weatherIcon: {
		fontSize: 54,
		marginRight: 16,
	},
	weatherTextContainer: {
		flex: 1,
	},
	weatherDescription: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 4,
	},
	popText: {
		fontSize: 14,
		color: "#2563EB",
		fontWeight: "600",
	},
	tempSection: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderRadius: 14,
		paddingVertical: 14,
	},
	tempBox: {
		alignItems: "center",
		flex: 1,
	},
	tempLabel: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 4,
	},
	maxTempText: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#DC2626",
	},
	minTempText: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#2563EB",
	},
	diffBadge: {
		marginTop: 6,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 10,
	},
	diffText: {
		fontSize: 11,
		color: "#FFFFFF",
		fontWeight: "bold",
	},
	divider: {
		width: 1,
		height: "70%",
		backgroundColor: "#E5E7EB",
	},
});
