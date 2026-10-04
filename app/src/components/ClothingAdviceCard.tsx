import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Section } from "./Section";

interface Props {
	advice: string;
}

export const ClothingAdviceCard: React.FC<Props> = ({ advice }) => {
	// 先頭についている絵文字（👔など）があれば除去してテキストをクリーンに
	const cleanAdvice = advice.replace(/^[\p{Emoji}\s]+/u, "");

	return (
		<Section style={styles.sectionRow}>
			<View style={styles.badge}>
				<Text style={styles.badgeText}>服装の目安</Text>
			</View>
			<Text style={styles.adviceText}>{cleanAdvice}</Text>
		</Section>
	);
};

const styles = StyleSheet.create({
	sectionRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 14,
	},
	badge: {
		backgroundColor: "#F1F5F9",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#475569",
		letterSpacing: 0.2,
	},
	adviceText: {
		flex: 1,
		fontSize: 13,
		fontWeight: "600",
		color: "#0F172A",
		lineHeight: 18,
	},
});

