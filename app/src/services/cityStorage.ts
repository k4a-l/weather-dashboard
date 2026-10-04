import AsyncStorage from "@react-native-async-storage/async-storage";
import { CityConfig } from "../types";

const SAVED_CITIES_KEY = "weather_dashboard_saved_cities";
const LAST_SELECTED_CITY_KEY = "weather_dashboard_last_city";

/**
 * ユーザーが登録したマイ地点一覧を取得
 */
export async function getSavedCities(): Promise<CityConfig[]> {
	try {
		const json = await AsyncStorage.getItem(SAVED_CITIES_KEY);
		if (!json) return [];
		const parsed = JSON.parse(json) as CityConfig[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

/**
 * 新しい地点をマイ地点に追加（重複は更新）
 */
export async function addSavedCity(city: CityConfig): Promise<CityConfig[]> {
	try {
		const current = await getSavedCities();
		const filtered = current.filter(
			(c) =>
				c.id !== city.id &&
				!(
					c.name === city.name &&
					Math.abs(c.latitude - city.latitude) < 0.01 &&
					Math.abs(c.longitude - city.longitude) < 0.01
				),
		);
		const updated = [city, ...filtered];
		await AsyncStorage.setItem(SAVED_CITIES_KEY, JSON.stringify(updated));
		return updated;
	} catch {
		return [city];
	}
}

/**
 * マイ地点から削除
 */
export async function removeSavedCity(cityId: string): Promise<CityConfig[]> {
	try {
		const current = await getSavedCities();
		const updated = current.filter((c) => c.id !== cityId);
		await AsyncStorage.setItem(SAVED_CITIES_KEY, JSON.stringify(updated));
		return updated;
	} catch {
		return [];
	}
}

/**
 * 最後に選択した地点を保存
 */
export async function saveLastSelectedCity(city: CityConfig): Promise<void> {
	try {
		await AsyncStorage.setItem(LAST_SELECTED_CITY_KEY, JSON.stringify(city));
	} catch {
		// ignore
	}
}

/**
 * 最後に選択した地点を取得
 */
export async function getLastSelectedCity(): Promise<CityConfig | null> {
	try {
		const json = await AsyncStorage.getItem(LAST_SELECTED_CITY_KEY);
		if (!json) return null;
		return JSON.parse(json) as CityConfig;
	} catch {
		return null;
	}
}



