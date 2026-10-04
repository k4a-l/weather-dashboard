import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { JmaForecastData, ModelForecast } from "../types";
import { getWeatherIcon } from "../services/weatherApi";

interface Props {
	jma: JmaForecastData;
	openMeteoJma: ModelForecast;
	openMeteoEcmwf: ModelForecast;
}

export const ModelComparisonCard: React.FC<Props> = ({
	jma,
	openMeteoJma,
	openMeteoEcmwf,
}) => {
	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<Text style={styles.title}>
					📊 予測モデル・取得元比較 (併記)
				</Text>
				<Text style={styles.subtitle}>
					各機関・モデルの予報の違いを一目で比較
				</Text>
			</View>

			<View style={styles.modelList}>
				{/* 1. 気象庁公式発表 */}
				<View style={styles.modelRow}>
					<View style={styles.modelNameCol}>
						<Text style={styles.modelTag}>公式</Text>
						<Text style={styles.modelName}>気象庁 (JMA)</Text>
					</View>
					<View style={styles.modelValueCol}>
						<Text style={styles.weatherIcon}>
							{getWeatherIcon(jma.todayWeather)}
						</Text>
						<Text style={styles.weatherText} numberOfLines={2}>
							{jma.todayWeather}
						</Text>
					</View>
				</View>

				{/* 2. 気象庁数値予報モデル (JMA Seamless) */}
				<View style={styles.modelRow}>
					<View style={styles.modelNameCol}>
						<Text style={styles.modelTagNumeric}>数値モデル</Text>
						<Text style={styles.modelName}>JMA (気象庁)</Text>
					</View>
					<View style={styles.modelValueCol}>
						<Text style={styles.weatherIcon}>
							{getWeatherIcon(openMeteoJma.todayWeatherCode)}
						</Text>
						<View>
							<Text style={styles.weatherText}>
								{openMeteoJma.todayWeatherText}
							</Text>
							<Text style={styles.metricText}>
								{openMeteoJma.maxTemp.toFixed(1)}° /{" "}
								{openMeteoJma.minTemp.toFixed(1)}° | ☔
								{openMeteoJma.popMax}%
							</Text>
						</View>
					</View>
				</View>

				{/* 3. 欧州中期予報センターモデル (ECMWF) */}
				<View style={styles.modelRowLast}>
					<View style={styles.modelNameCol}>
						<Text style={styles.modelTagGlobal}>欧州モデル</Text>
						<Text style={styles.modelName}>ECMWF (欧州)</Text>
					</View>
					<View style={styles.modelValueCol}>
						<Text style={styles.weatherIcon}>
							{getWeatherIcon(openMeteoEcmwf.todayWeatherCode)}
						</Text>
						<View>
							<Text style={styles.weatherText}>
								{openMeteoEcmwf.todayWeatherText}
							</Text>
							<Text style={styles.metricText}>
								{openMeteoEcmwf.maxTemp.toFixed(1)}° /{" "}
								{openMeteoEcmwf.minTemp.toFixed(1)}° | ☔
								{openMeteoEcmwf.popMax}%
							</Text>
						</View>
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
		padding: 18,
		marginHorizontal: 16,
		marginVertical: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.06,
		shadowRadius: 10,
		elevation: 2,
	},
	header: {
		marginBottom: 14,
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#1F2937",
	},
	subtitle: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 2,
	},
	modelList: {
		backgroundColor: "#F9FAFB",
		borderRadius: 14,
		overflow: "hidden",
	},
	modelRow: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	modelRowLast: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
	},
	modelNameCol: {
		width: 110,
	},
	modelTag: {
		fontSize: 10,
		fontWeight: "bold",
		color: "#FFFFFF",
		backgroundColor: "#2563EB",
		alignSelf: "flex-start",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		marginBottom: 2,
	},
	modelTagNumeric: {
		fontSize: 10,
		fontWeight: "bold",
		color: "#FFFFFF",
		backgroundColor: "#059669",
		alignSelf: "flex-start",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		marginBottom: 2,
	},
	modelTagGlobal: {
		fontSize: 10,
		fontWeight: "bold",
		color: "#FFFFFF",
		backgroundColor: "#7C3AED",
		alignSelf: "flex-start",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		marginBottom: 2,
	},
	modelName: {
		fontSize: 12,
		fontWeight: "600",
		color: "#374151",
	},
	modelValueCol: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
	},
	weatherIcon: {
		fontSize: 26,
		marginRight: 10,
	},
	weatherText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#111827",
	},
	metricText: {
		fontSize: 12,
		color: "#4B5563",
		marginTop: 2,
	},
});
