import React, { useState, useMemo, useEffect, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TextInput,
	Pressable,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { CityConfig } from "../types";
import { CITIES } from "../constants/cities";
import { searchLocationsOnline } from "../services/geocoding";
import {
	getSavedCities,
	addSavedCity,
	removeSavedCity,
} from "../services/cityStorage";

interface Props {
	visible: boolean;
	currentCity: CityConfig;
	onClose: () => void;
	onSave: (city: CityConfig) => void;
}

const REGIONS = [
	"すべて",
	"マイ地点",
	"関東",
	"近畿",
	"中部",
	"北海道・東北",
	"中国・四国",
	"九州・沖縄",
];

export const LocationSettingsModal: React.FC<Props> = ({
	visible,
	currentCity,
	onClose,
	onSave,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRegion, setSelectedRegion] = useState("すべて");
	const [savedCities, setSavedCities] = useState<CityConfig[]>([]);

	// オンライン検索結果
	const [onlineResults, setOnlineResults] = useState<CityConfig[]>([]);
	const [isSearchingOnline, setIsSearchingOnline] = useState(false);
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// モーダル表示時に保存済み地点をロード
	useEffect(() => {
		if (visible) {
			getSavedCities().then((cities) => {
				setSavedCities(cities);
			});
			setSearchQuery("");
			setOnlineResults([]);
		}
	}, [visible]);

	// オンライン検索（入力後 350ms で自動実行）
	useEffect(() => {
		const query = searchQuery.trim();
		if (searchTimerRef.current) {
			clearTimeout(searchTimerRef.current);
		}

		if (query.length >= 1) {
			setIsSearchingOnline(true);
			searchTimerRef.current = setTimeout(async () => {
				try {
					const results = await searchLocationsOnline(query);
					setOnlineResults(results);
				} catch {
					setOnlineResults([]);
				} finally {
					setIsSearchingOnline(false);
				}
			}, 350);
		} else {
			setOnlineResults([]);
			setIsSearchingOnline(false);
		}

		return () => {
			if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		};
	}, [searchQuery]);

	// プリセット都市の絞り込み
	const filteredPresetCities = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (selectedRegion === "マイ地点") return [];

		return CITIES.filter((city) => {
			const matchesRegion =
				selectedRegion === "すべて" || city.region === selectedRegion;
			const matchesQuery =
				!query ||
				city.name.toLowerCase().includes(query) ||
				(city.prefecture &&
					city.prefecture.toLowerCase().includes(query));
			return matchesRegion && matchesQuery;
		});
	}, [searchQuery, selectedRegion]);

	// 地点を選択して適用（保存リストにも追加）
	const handleSelectCity = async (city: CityConfig, autoSave = false) => {
		if (autoSave) {
			await addSavedCity(city);
		}
		onSave(city);
		onClose();
	};

	// マイ地点から削除
	const handleDeleteSaved = async (cityId: string) => {
		const updated = await removeSavedCity(cityId);
		setSavedCities(updated);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			onRequestClose={onClose}
		>
			<View style={styles.overlay}>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
				<View style={styles.modalContainer}>
					{/* ヘッダー */}
					<View style={styles.header}>
						<View>
							<Text style={styles.title}>地域の設定・登録</Text>
							<Text style={styles.currentLabel}>
								現在: {currentCity.name}
								{currentCity.prefecture
									? ` (${currentCity.prefecture})`
									: ""}
							</Text>
						</View>
						<Pressable
							onPress={onClose}
							style={styles.closeBtn}
							hitSlop={8}
						>
							<Text style={styles.closeBtnText}>✕</Text>
						</Pressable>
					</View>

					{/* 検索バー */}
					<View style={styles.searchBar}>
						<TextInput
							style={styles.searchInput}
							placeholder="地名・市区町村・住所・駅名などを検索"
							placeholderTextColor="#94A3B8"
							value={searchQuery}
							onChangeText={setSearchQuery}
							autoCorrect={false}
							clearButtonMode="while-editing"
						/>
						{isSearchingOnline && (
							<ActivityIndicator
								size="small"
								color="#2563EB"
								style={styles.searchingSpinner}
							/>
						)}
						{searchQuery.length > 0 && !isSearchingOnline && (
							<Pressable
								onPress={() => setSearchQuery("")}
								hitSlop={8}
							>
								<Text style={styles.clearText}>✕</Text>
							</Pressable>
						)}
					</View>

					{/* 地方・マイ地点フィルタータブ */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.regionTabsContainer}
						style={styles.regionTabsScroll}
					>
						{REGIONS.map((region) => {
							const isActive = selectedRegion === region;
							const badgeCount =
								region === "マイ地点" ? savedCities.length : 0;

							return (
								<Pressable
									key={region}
									style={[
										styles.regionTab,
										isActive && styles.regionTabActive,
									]}
									onPress={() => setSelectedRegion(region)}
									hitSlop={4}
								>
									<Text
										style={[
											styles.regionTabText,
											isActive &&
												styles.regionTabTextActive,
										]}
									>
										{region}
										{badgeCount > 0
											? ` (${badgeCount})`
											: ""}
									</Text>
								</Pressable>
							);
						})}
					</ScrollView>

					<ScrollView
						style={styles.contentScroll}
						contentContainerStyle={styles.contentContainer}
						showsVerticalScrollIndicator={true}
						keyboardShouldPersistTaps="handled"
					>
						{/* 1. オンライン検索結果（地名・住所検索から自動特定された地点） */}
						{onlineResults.length > 0 && (
							<View style={styles.sectionBlock}>
								<View style={styles.sectionTitleRow}>
									<Text style={styles.sectionTitle}>
										検索結果（タップして登録）
									</Text>
								</View>
								<View style={styles.onlineResultsList}>
									{onlineResults.map((city) => (
										<Pressable
											key={city.id}
											style={styles.onlineResultCard}
											onPress={() =>
												handleSelectCity(city, true)
											}
										>
											<View
												style={styles.onlineResultInfo}
											>
												<Text
													style={
														styles.onlineResultName
													}
												>
													{city.name}
												</Text>
												<Text
													style={
														styles.onlineResultSub
													}
												>
													{city.prefecture} •{" "}
													{city.latitude.toFixed(2)}
													°N,{" "}
													{city.longitude.toFixed(2)}
													°E
												</Text>
											</View>
											<View style={styles.addBadge}>
												<Text
													style={styles.addBadgeText}
												>
													＋ 登録・適用
												</Text>
											</View>
										</Pressable>
									))}
								</View>
							</View>
						)}

						{/* 2. マイ登録地点セクション */}
						{(selectedRegion === "すべて" ||
							selectedRegion === "マイ地点") &&
							savedCities.length > 0 &&
							!searchQuery && (
								<View style={styles.sectionBlock}>
									<View style={styles.sectionTitleRow}>
										<Text style={styles.sectionTitle}>
											マイ登録地点
										</Text>
									</View>
									<View style={styles.citiesGrid}>
										{savedCities.map((city) => {
											const isSelected =
												currentCity.id === city.id ||
												(currentCity.name ===
													city.name &&
													Math.abs(
														currentCity.latitude -
															city.latitude,
													) < 0.01);
											return (
												<View
													key={city.id}
													style={[
														styles.cityCard,
														styles.savedCityCard,
														isSelected &&
															styles.cityCardActive,
													]}
												>
													<Pressable
														style={
															styles.cityCardPress
														}
														onPress={() =>
															handleSelectCity(
																city,
															)
														}
													>
														<Text
															style={[
																styles.cityName,
																isSelected &&
																	styles.cityNameActive,
															]}
															numberOfLines={1}
														>
															{city.name}
														</Text>
														<Text
															style={
																styles.cityPref
															}
														>
															{city.prefecture ||
																"カスタム"}
														</Text>
													</Pressable>
													<Pressable
														style={styles.deleteBtn}
														onPress={() =>
															handleDeleteSaved(
																city.id,
															)
														}
														hitSlop={8}
													>
														<Text
															style={
																styles.deleteBtnText
															}
														>
															✕
														</Text>
													</Pressable>
												</View>
											);
										})}
									</View>
								</View>
							)}

						{/* 3. プリセット都市一覧 */}
						{selectedRegion !== "マイ地点" && (
							<View style={styles.sectionBlock}>
								<View style={styles.sectionTitleRow}>
									<Text style={styles.sectionTitle}>
										{searchQuery ? "主要都市" : "主要都市"}
									</Text>
								</View>
								<View style={styles.citiesGrid}>
									{filteredPresetCities.map((city) => {
										const isSelected =
											currentCity.id === city.id ||
											currentCity.name === city.name;
										return (
											<Pressable
												key={city.id}
												style={[
													styles.cityCard,
													isSelected &&
														styles.cityCardActive,
												]}
												onPress={() =>
													handleSelectCity(city)
												}
											>
												<View
													style={
														styles.cityCardContent
													}
												>
													<Text
														style={[
															styles.cityName,
															isSelected &&
																styles.cityNameActive,
														]}
													>
														{city.name}
													</Text>
													{city.prefecture && (
														<Text
															style={[
																styles.cityPref,
																isSelected &&
																	styles.cityPrefActive,
															]}
														>
															{city.prefecture}
														</Text>
													)}
												</View>
												{isSelected && (
													<View
														style={
															styles.checkBadge
														}
													>
														<Text
															style={
																styles.checkText
															}
														>
															✓
														</Text>
													</View>
												)}
											</Pressable>
										);
									})}
								</View>
							</View>
						)}

						{/* 検索結果がどちらにもない場合 */}
						{searchQuery &&
							onlineResults.length === 0 &&
							filteredPresetCities.length === 0 &&
							!isSearchingOnline && (
								<View style={styles.emptyContainer}>
									<Text style={styles.emptyTitle}>
										該当する地点が見つかりませんでした
									</Text>
									<Text style={styles.emptySub}>
										別の地名や市区町村名（例:
										世田谷、箱根、軽井沢）でお試しください
									</Text>
								</View>
							)}
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.45)",
		justifyContent: "flex-end",
	},
	modalContainer: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 20,
		paddingHorizontal: 20,
		maxHeight: "90%",
		minHeight: "70%",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: "800",
		color: "#0F172A",
	},
	currentLabel: {
		fontSize: 12,
		color: "#64748B",
		marginTop: 2,
	},
	closeBtn: {
		padding: 6,
		backgroundColor: "#F1F5F9",
		borderRadius: 16,
	},
	closeBtnText: {
		fontSize: 14,
		color: "#64748B",
		fontWeight: "700",
	},
	searchBar: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F8FAFC",
		borderWidth: 1,
		borderColor: "#E2E8F0",
		borderRadius: 12,
		paddingHorizontal: 12,
		height: 44,
		marginBottom: 12,
	},
	searchIcon: {
		fontSize: 14,
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		color: "#0F172A",
		paddingVertical: 0,
	},
	searchingSpinner: {
		marginRight: 4,
	},
	clearText: {
		fontSize: 14,
		color: "#94A3B8",
		paddingHorizontal: 4,
	},
	regionTabsScroll: {
		maxHeight: 38,
		marginBottom: 12,
	},
	regionTabsContainer: {
		gap: 6,
		paddingRight: 10,
	},
	regionTab: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		backgroundColor: "#F1F5F9",
	},
	regionTabActive: {
		backgroundColor: "#0F172A",
	},
	regionTabText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#64748B",
	},
	regionTabTextActive: {
		color: "#FFFFFF",
	},
	contentScroll: {
		flex: 1,
	},
	contentContainer: {
		paddingBottom: 40,
		gap: 16,
	},
	sectionBlock: {
		width: "100%",
	},
	sectionTitleRow: {
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: "700",
		color: "#64748B",
	},
	onlineResultsList: {
		gap: 8,
	},
	onlineResultCard: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 12,
		backgroundColor: "#EFF6FF",
		borderWidth: 1,
		borderColor: "#BFDBFE",
	},
	onlineResultInfo: {
		flex: 1,
		marginRight: 8,
	},
	onlineResultName: {
		fontSize: 15,
		fontWeight: "800",
		color: "#1E3A8A",
	},
	onlineResultSub: {
		fontSize: 11,
		color: "#3B82F6",
		marginTop: 2,
	},
	addBadge: {
		backgroundColor: "#2563EB",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
	},
	addBadgeText: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "700",
	},
	citiesGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	cityCard: {
		width: "48.5%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 12,
		backgroundColor: "#F8FAFC",
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	savedCityCard: {
		backgroundColor: "#F0FDF4",
		borderColor: "#BBF7D0",
	},
	cityCardPress: {
		flex: 1,
	},
	cityCardActive: {
		backgroundColor: "#EFF6FF",
		borderColor: "#93C5FD",
	},
	cityCardContent: {
		flex: 1,
	},
	cityName: {
		fontSize: 15,
		fontWeight: "700",
		color: "#1E293B",
	},
	cityNameActive: {
		color: "#2563EB",
	},
	cityPref: {
		fontSize: 11,
		color: "#94A3B8",
		marginTop: 2,
	},
	cityPrefActive: {
		color: "#3B82F6",
	},
	checkBadge: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "#2563EB",
		alignItems: "center",
		justifyContent: "center",
	},
	checkText: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "800",
	},
	deleteBtn: {
		padding: 4,
		marginLeft: 4,
	},
	deleteBtnText: {
		color: "#94A3B8",
		fontSize: 12,
		fontWeight: "700",
	},
	emptyContainer: {
		width: "100%",
		paddingVertical: 36,
		alignItems: "center",
	},
	emptyTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#64748B",
	},
	emptySub: {
		fontSize: 12,
		color: "#94A3B8",
		marginTop: 4,
	},
});
