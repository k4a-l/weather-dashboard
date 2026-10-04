import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { JmaForecastData } from "../types";
import { Section, SectionHeader } from "./Section";

interface Props {
	jma: JmaForecastData;
}

export const AlertNoticeCard: React.FC<Props> = React.memo(({ jma }) => {
	const [expanded, setExpanded] = useState(false);

	if (jma.alertNotices.length === 0 && !jma.overviewText) {
		return null;
	}

	const paragraphs = jma.overviewText ? jma.overviewText.split("\n\n") : [];
	const hasMore = paragraphs.length > 1;
	const displayText = expanded
		? jma.overviewText
		: (paragraphs[0] || jma.overviewText);

	return (
		<Section>
			<SectionHeader
				title="気象概況"
				rightElement={
					<Text style={styles.sourceLabel}>気象庁発表</Text>
				}
			/>

			{jma.alertNotices.length > 0 && (
				<View style={styles.alertList}>
					{jma.alertNotices.map((alert, index) => {
						const cleanAlert = alert.replace(
							/^[\p{Emoji}\s]+/u,
							"",
						);
						return (
							<View key={index} style={styles.alertBadge}>
								<Text style={styles.alertBadgeText}>
									{cleanAlert}
								</Text>
							</View>
						);
					})}
				</View>
			)}

			{jma.overviewText.length > 0 && (
				<TouchableOpacity
					activeOpacity={hasMore ? 0.7 : 1}
					onPress={() => hasMore && setExpanded(!expanded)}
					style={styles.overviewContainer}
				>
					<Text style={styles.overviewText}>{displayText}</Text>
					{hasMore && (
						<View style={styles.expandIconBtn}>
							<View
								style={[
									styles.chevron,
									expanded ? styles.chevronUp : styles.chevronDown,
								]}
							/>
						</View>
					)}
				</TouchableOpacity>
			)}
		</Section>
	);
});

const styles = StyleSheet.create({
	sourceLabel: {
		fontSize: 11,
		fontWeight: "500",
		color: "#94A3B8",
	},
	alertList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginBottom: 8,
	},
	alertBadge: {
		backgroundColor: "#F1F5F9",
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	alertBadgeText: {
		fontSize: 11,
		color: "#334155",
		fontWeight: "600",
	},
	overviewContainer: {
		marginTop: 2,
	},
	overviewText: {
		fontSize: 12,
		color: "#475569",
		lineHeight: 20,
		textAlign: "justify",
	},
	expandIconBtn: {
		alignSelf: "flex-end",
		paddingTop: 4,
		paddingBottom: 2,
	},
	chevron: {
		width: 7,
		height: 7,
		borderRightWidth: 1.5,
		borderBottomWidth: 1.5,
		borderColor: "#94A3B8",
	},
	chevronDown: {
		transform: [{ rotate: "45deg" }],
		marginBottom: 2,
	},
	chevronUp: {
		transform: [{ rotate: "-135deg" }],
		marginTop: 2,
	},
});
