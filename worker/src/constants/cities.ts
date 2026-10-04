import { CityConfig } from "../types";

export const DEFAULT_CITIES: CityConfig[] = [
	{
		id: "tokyo",
		name: "東京",
		jmaOfficeCode: "130000",
		jmaAreaCode: "130010",
		latitude: 35.6895,
		longitude: 139.6917,
	},
	{
		id: "osaka",
		name: "大阪",
		jmaOfficeCode: "270000",
		jmaAreaCode: "270000",
		latitude: 34.6937,
		longitude: 135.5023,
	},
	{
		id: "nagoya",
		name: "名古屋",
		jmaOfficeCode: "230000",
		jmaAreaCode: "230010",
		latitude: 35.1815,
		longitude: 136.9066,
	},
	{
		id: "fukuoka",
		name: "福岡",
		jmaOfficeCode: "400000",
		jmaAreaCode: "400010",
		latitude: 33.5904,
		longitude: 130.4017,
	},
	{
		id: "sapporo",
		name: "札幌",
		jmaOfficeCode: "016000",
		jmaAreaCode: "016010",
		latitude: 43.0618,
		longitude: 141.3545,
	},
];

export function getCityConfig(cityId: string): CityConfig {
	const found = DEFAULT_CITIES.find((c) => c.id === cityId);
	return found || DEFAULT_CITIES[0];
}
