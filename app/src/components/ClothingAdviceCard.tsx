import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
	advice: string;
}

export const ClothingAdviceCard: React.FC<Props> = ({ advice }) => {
	return (
		<View style={styles.card}>
			<View style={styles.titleRow}>
				<Text style={styles.badgeText}>💡 本日の服装目安</Text>
			</View>
			<Text style={styles.adviceText}>{advice}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#EFF6FF",
		borderRadius: 16,
		padding: 16,
		marginHorizontal: 16,
		marginVertical: 6,
		borderLeftWidth: 4,
		borderLeftColor: "#3B82F6",
	},
	titleRow: {
		marginBottom: 6,
	},
	badgeText: {
		fontSize: 13,
		fontWeight: "bold",
		color: "#1D4ED8",
	},
	adviceText: {
		fontSize: 15,
		color: "#1F2937",
		lineHeight: 22,
		fontWeight: "500",
	},
});
