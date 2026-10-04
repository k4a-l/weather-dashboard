import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { HourlyForecastItem } from "../types";
import { getWeatherIcon } from "../services/weatherApi";

interface Props {
	items: HourlyForecastItem[];
}

export const HourlyTimeline: React.FC<Props> = ({ items }) => {
	if (!items || items.length === 0) return null;

	const formatHour = (isoString: string) => {
		const date = new Date(isoString);
		return `${date.getHours()}時`;
	};

	return (
		<View style={styles.card}>
			<Text style={styles.title}>⏱️ 24時間推移 (気温・降水確率)</Text>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.scroll}
			>
				{items.map((item, index) => (
					<View key={index} style={styles.itemBox}>
						<Text style={styles.timeText}>
							{formatHour(item.time)}
						</Text>
						<Text style={styles.icon}>
							{getWeatherIcon(item.weatherCode)}
						</Text>
						<Text style={styles.tempText}>
							{Math.round(item.temp)}°
						</Text>
						<View style={styles.popBadge}>
							<Text style={styles.popText}>{item.pop}%</Text>
						</View>
						<Text style={styles.apparentText}>
							体感 {Math.round(item.apparentTemp)}°
						</Text>
					</View>
				))}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 18,
		marginHorizontal: 16,
		marginVertical: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.06,
		shadowRadius: 10,
		elevation: 2,
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#1F2937",
		marginBottom: 12,
	},
	scroll: {
		flexDirection: "row",
	},
	itemBox: {
		alignItems: "center",
		width: 68,
		paddingVertical: 8,
		paddingHorizontal: 4,
		marginRight: 6,
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
	},
	timeText: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "600",
		marginBottom: 4,
	},
	icon: {
		fontSize: 24,
		marginVertical: 4,
	},
	tempText: {
		fontSize: 15,
		fontWeight: "bold",
		color: "#111827",
		marginBottom: 4,
	},
	popBadge: {
		backgroundColor: "#DBEAFE",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
		marginBottom: 4,
	},
	popText: {
		fontSize: 10,
		color: "#1D4ED8",
		fontWeight: "bold",
	},
	apparentText: {
		fontSize: 9,
		color: "#9CA3AF",
	},
});
