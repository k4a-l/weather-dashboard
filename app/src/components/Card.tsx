import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";

interface CardProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
	return <View style={[styles.card, style]}>{children}</View>;
};

interface CardHeaderProps {
	title: string;
	subtitle?: string;
	rightElement?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
	title,
	subtitle,
	rightElement,
	style,
}) => {
	return (
		<View style={[styles.header, style]}>
			<View style={styles.titleGroup}>
				<Text style={styles.title}>{title}</Text>
				{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
			</View>
			{rightElement ? <View style={styles.right}>{rightElement}</View> : null}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		padding: 16,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 14,
	},
	titleGroup: {
		flex: 1,
	},
	title: {
		fontSize: 15,
		fontWeight: "700",
		color: "#0F172A",
		letterSpacing: -0.2,
	},
	subtitle: {
		fontSize: 12,
		color: "#64748B",
		marginTop: 2,
	},
	right: {
		marginLeft: 8,
	},
});
