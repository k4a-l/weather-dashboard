import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { JmaForecastData } from "../types";

interface Props {
	jma: JmaForecastData;
}

export const AlertNoticeCard: React.FC<Props> = ({ jma }) => {
	const [expanded, setExpanded] = useState(false);

	if (jma.alertNotices.length === 0 && !jma.overviewText) {
		return null;
	}

	return (
		<View style={styles.card}>
			<Text style={styles.title}>⚠️ 特記事項・気象概況 (気象庁)</Text>

			{jma.alertNotices.length > 0 && (
				<View style={styles.alertList}>
					{jma.alertNotices.map((alert, index) => (
						<View key={index} style={styles.alertItem}>
							<Text style={styles.alertItemText}>{alert}</Text>
						</View>
					))}
				</View>
			)}

			{jma.overviewText.length > 0 && (
				<View style={styles.overviewContainer}>
					<Text
						style={styles.overviewText}
						numberOfLines={expanded ? undefined : 3}
					>
						{jma.overviewText}
					</Text>
					<TouchableOpacity
						onPress={() => setExpanded(!expanded)}
						style={styles.expandButton}
					>
						<Text style={styles.expandButtonText}>
							{expanded ? "閉じる ▲" : "概況の全文を読む ▼"}
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFBEB",
		borderRadius: 16,
		padding: 16,
		marginHorizontal: 16,
		marginVertical: 6,
		borderWidth: 1,
		borderColor: "#FDE68A",
	},
	title: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#92400E",
		marginBottom: 8,
	},
	alertList: {
		marginBottom: 8,
	},
	alertItem: {
		backgroundColor: "#FEF3C7",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
		marginBottom: 4,
	},
	alertItemText: {
		fontSize: 13,
		color: "#78350F",
		fontWeight: "600",
	},
	overviewContainer: {
		marginTop: 4,
	},
	overviewText: {
		fontSize: 13,
		color: "#4B5563",
		lineHeight: 18,
	},
	expandButton: {
		marginTop: 6,
		alignSelf: "flex-end",
	},
	expandButtonText: {
		fontSize: 12,
		color: "#D97706",
		fontWeight: "bold",
	},
});
