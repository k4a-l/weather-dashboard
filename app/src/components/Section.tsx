import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";

interface SectionProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	hasDivider?: boolean;
	noHorizontalPadding?: boolean;
}

export const Section: React.FC<SectionProps> = ({
	children,
	style,
	hasDivider = true,
	noHorizontalPadding = false,
}) => {
	return (
		<View
			style={[
				styles.section,
				hasDivider && styles.divider,
				!noHorizontalPadding && styles.horizontalPadding,
				style,
			]}
		>
			{children}
		</View>
	);
};

interface SectionHeaderProps {
	title?: string;
	subtitle?: string;
	rightElement?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
	title,
	subtitle,
	rightElement,
	style,
}) => {
	return (
		<View style={[styles.header, style]}>
			<View style={styles.titleGroup}>
				{title && <Text style={styles.title}>{title}</Text>}
				{subtitle ? (
					<Text style={styles.subtitle}>{subtitle}</Text>
				) : null}
			</View>
			{rightElement ? (
				<View style={styles.right}>{rightElement}</View>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	section: {
		paddingVertical: 20,
		backgroundColor: "#FFFFFF",
	},
	horizontalPadding: {
		paddingHorizontal: 20,
	},
	divider: {
		borderBottomWidth: 1,
		borderBottomColor: "#F1F5F9",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		marginBottom: 12,
	},
	titleGroup: {
		flex: 1,
	},
	title: {
		fontSize: 14,
		fontWeight: "700",
		color: "#0F172A",
		letterSpacing: -0.3,
	},
	subtitle: {
		fontSize: 12,
		color: "#64748B",
		marginTop: 2,
	},
	right: {
		marginLeft: 12,
	},
});
