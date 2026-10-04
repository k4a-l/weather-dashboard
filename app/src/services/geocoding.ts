import { CityConfig } from "../types";

interface JmaStation {
	name: string;
	officeCode: string;
	areaCode: string;
	lat: number;
	lon: number;
}

// 47都道府県の気象台・代表エリア・座標マスター
const JMA_STATIONS: JmaStation[] = [
	{
		name: "北海道",
		officeCode: "016000",
		areaCode: "016010",
		lat: 43.0618,
		lon: 141.3545,
	},
	{
		name: "青森県",
		officeCode: "020000",
		areaCode: "020010",
		lat: 40.8244,
		lon: 140.74,
	},
	{
		name: "岩手県",
		officeCode: "030000",
		areaCode: "030010",
		lat: 39.7036,
		lon: 141.1527,
	},
	{
		name: "宮城県",
		officeCode: "040000",
		areaCode: "040010",
		lat: 38.2682,
		lon: 140.8694,
	},
	{
		name: "秋田県",
		officeCode: "050000",
		areaCode: "050010",
		lat: 39.7186,
		lon: 140.1024,
	},
	{
		name: "山形県",
		officeCode: "060000",
		areaCode: "060010",
		lat: 38.2404,
		lon: 140.3633,
	},
	{
		name: "福島県",
		officeCode: "070000",
		areaCode: "070010",
		lat: 37.75,
		lon: 140.4678,
	},
	{
		name: "茨城県",
		officeCode: "080000",
		areaCode: "080010",
		lat: 36.3418,
		lon: 140.4468,
	},
	{
		name: "栃木県",
		officeCode: "090000",
		areaCode: "090010",
		lat: 36.5658,
		lon: 139.8836,
	},
	{
		name: "群馬県",
		officeCode: "100000",
		areaCode: "100010",
		lat: 36.3911,
		lon: 139.0608,
	},
	{
		name: "埼玉県",
		officeCode: "110000",
		areaCode: "110010",
		lat: 35.8617,
		lon: 139.6455,
	},
	{
		name: "千葉県",
		officeCode: "120000",
		areaCode: "120010",
		lat: 35.6074,
		lon: 140.1065,
	},
	{
		name: "東京都",
		officeCode: "130000",
		areaCode: "130010",
		lat: 35.6895,
		lon: 139.6917,
	},
	{
		name: "神奈川県",
		officeCode: "140000",
		areaCode: "140010",
		lat: 35.4478,
		lon: 139.6425,
	},
	{
		name: "新潟県",
		officeCode: "150000",
		areaCode: "150010",
		lat: 37.9022,
		lon: 139.0232,
	},
	{
		name: "富山県",
		officeCode: "160000",
		areaCode: "160010",
		lat: 36.6953,
		lon: 137.2113,
	},
	{
		name: "石川県",
		officeCode: "170000",
		areaCode: "170010",
		lat: 36.5947,
		lon: 136.6256,
	},
	{
		name: "福井県",
		officeCode: "180000",
		areaCode: "180010",
		lat: 36.0652,
		lon: 136.2216,
	},
	{
		name: "山梨県",
		officeCode: "190000",
		areaCode: "190010",
		lat: 35.6639,
		lon: 138.5683,
	},
	{
		name: "長野県",
		officeCode: "200000",
		areaCode: "200010",
		lat: 36.6513,
		lon: 138.181,
	},
	{
		name: "岐阜県",
		officeCode: "210000",
		areaCode: "210010",
		lat: 35.3912,
		lon: 136.7223,
	},
	{
		name: "静岡県",
		officeCode: "220000",
		areaCode: "220010",
		lat: 34.9769,
		lon: 138.3831,
	},
	{
		name: "愛知県",
		officeCode: "230000",
		areaCode: "230010",
		lat: 35.1815,
		lon: 136.9066,
	},
	{
		name: "三重県",
		officeCode: "240000",
		areaCode: "240010",
		lat: 34.7303,
		lon: 136.5086,
	},
	{
		name: "滋賀県",
		officeCode: "250000",
		areaCode: "250010",
		lat: 35.0045,
		lon: 135.8686,
	},
	{
		name: "京都府",
		officeCode: "260000",
		areaCode: "260010",
		lat: 35.0116,
		lon: 135.7681,
	},
	{
		name: "大阪府",
		officeCode: "270000",
		areaCode: "270000",
		lat: 34.6937,
		lon: 135.5023,
	},
	{
		name: "兵庫県",
		officeCode: "280000",
		areaCode: "280010",
		lat: 34.6913,
		lon: 135.183,
	},
	{
		name: "奈良県",
		officeCode: "290000",
		areaCode: "290010",
		lat: 34.6851,
		lon: 135.8328,
	},
	{
		name: "和歌山県",
		officeCode: "300000",
		areaCode: "300010",
		lat: 34.226,
		lon: 135.1675,
	},
	{
		name: "鳥取県",
		officeCode: "310000",
		areaCode: "310010",
		lat: 35.5036,
		lon: 134.2383,
	},
	{
		name: "島根県",
		officeCode: "320000",
		areaCode: "320010",
		lat: 35.4723,
		lon: 133.0505,
	},
	{
		name: "岡山県",
		officeCode: "330000",
		areaCode: "330010",
		lat: 34.6618,
		lon: 133.9344,
	},
	{
		name: "広島県",
		officeCode: "340000",
		areaCode: "340010",
		lat: 34.3963,
		lon: 132.4594,
	},
	{
		name: "山口県",
		officeCode: "350000",
		areaCode: "350010",
		lat: 34.1859,
		lon: 131.4714,
	},
	{
		name: "徳島県",
		officeCode: "360000",
		areaCode: "360010",
		lat: 34.0658,
		lon: 134.5594,
	},
	{
		name: "香川県",
		officeCode: "370000",
		areaCode: "370000",
		lat: 34.3401,
		lon: 134.0433,
	},
	{
		name: "愛媛県",
		officeCode: "380000",
		areaCode: "380010",
		lat: 33.8417,
		lon: 132.7661,
	},
	{
		name: "高知県",
		officeCode: "390000",
		areaCode: "390010",
		lat: 33.5597,
		lon: 133.5311,
	},
	{
		name: "福岡県",
		officeCode: "400000",
		areaCode: "400010",
		lat: 33.5904,
		lon: 130.4017,
	},
	{
		name: "佐賀県",
		officeCode: "410000",
		areaCode: "410010",
		lat: 33.2494,
		lon: 130.2988,
	},
	{
		name: "長崎県",
		officeCode: "420000",
		areaCode: "420010",
		lat: 32.7448,
		lon: 129.8737,
	},
	{
		name: "熊本県",
		officeCode: "430000",
		areaCode: "430010",
		lat: 32.7898,
		lon: 130.7417,
	},
	{
		name: "大分県",
		officeCode: "440000",
		areaCode: "440010",
		lat: 33.2382,
		lon: 131.6126,
	},
	{
		name: "宮崎県",
		officeCode: "450000",
		areaCode: "450010",
		lat: 31.9111,
		lon: 131.4239,
	},
	{
		name: "鹿児島県",
		officeCode: "460100",
		areaCode: "460010",
		lat: 31.5602,
		lon: 130.5581,
	},
	{
		name: "沖縄県",
		officeCode: "471000",
		areaCode: "471010",
		lat: 26.2124,
		lon: 127.6809,
	},
];

/**
 * 任意の緯度経度・住所から、最も適した気象庁のオフィスコード・エリアコードを自動判別
 */
export function findNearestJmaStation(
	lat: number,
	lon: number,
	addressHint: string = "",
): JmaStation {
	// 住所ヒントに都道府県名が含まれている場合はその都道府県を最優先
	if (addressHint) {
		for (const station of JMA_STATIONS) {
			const prefCore = station.name.replace(/[都府県]$/, "");
			if (
				addressHint.includes(station.name) ||
				addressHint.includes(prefCore)
			) {
				return station;
			}
		}
	}

	// 距離による最近傍探索（ヒュベニの公式の簡易近似）
	let nearest = JMA_STATIONS[0];
	let minDistanceSq = Infinity;

	for (const station of JMA_STATIONS) {
		const radLat = (lat * Math.PI) / 180;
		const dLat = station.lat - lat;
		const dLon = (station.lon - lon) * Math.cos(radLat);
		const distSq = dLat * dLat + dLon * dLon;

		if (distSq < minDistanceSq) {
			minDistanceSq = distSq;
			nearest = station;
		}
	}

	return nearest;
}

interface GsiFeature {
	geometry?: {
		coordinates?: [number, number]; // [lon, lat]
	};
	properties?: {
		title?: string;
		addressCode?: string;
	};
}

interface NominatimItem {
	lat?: string;
	lon?: string;
	display_name?: string;
	name?: string;
	address?: {
		city?: string;
		town?: string;
		village?: string;
		suburb?: string;
		quarter?: string;
		state?: string;
		province?: string;
		railway?: string;
	};
}

interface OpenMeteoGeoItem {
	id: number;
	name: string;
	latitude: number;
	longitude: number;
	admin1?: string;
	admin2?: string;
	country?: string;
}

interface OpenMeteoGeoResponse {
	results?: OpenMeteoGeoItem[];
}

interface ScoredCandidate {
	name: string;
	prefecture: string;
	lat: number;
	lon: number;
	score: number;
	source: string;
}

function cleanLocationTitle(rawTitle: string): {
	name: string;
	prefHint: string;
} {
	let title = rawTitle.replace(/\s+/g, " ").trim();
	let prefHint = "";

	const prefMatch = title.match(/^(東京都|北海道|京都府|大阪府|.{2,3}県)/);
	if (prefMatch) {
		prefHint = prefMatch[1];
		title = title.substring(prefHint.length);
	}

	title = title.replace(/^.+?郡/, "");
	title = title.replace(/役(所|場)$/, "");

	return {
		name: title.trim() || rawTitle,
		prefHint,
	};
}

function calculateLocationScore(title: string, query: string): number {
	let score = 0;
	const trimmedQuery = query.trim().toLowerCase();
	const lowerTitle = title.toLowerCase();

	// 都道府県を除去したローカル名
	const localTitle = lowerTitle
		.replace(/^(東京都|北海道|京都府|大阪府|.{2,3}県)/, "")
		.trim();

	// 1. 自治体（市・区・町・村）の完全一致（例: 蕨 -> 蕨市）
	if (
		localTitle === `${trimmedQuery}市` ||
		localTitle === `${trimmedQuery}区` ||
		localTitle === `${trimmedQuery}町` ||
		localTitle === `${trimmedQuery}村` ||
		localTitle === trimmedQuery
	) {
		if (
			localTitle.endsWith("市") ||
			localTitle.endsWith("区") ||
			localTitle.endsWith("町") ||
			localTitle.endsWith("村")
		) {
			score += 1000;
		} else {
			score += 300;
		}
	}

	// 2. 自治体の役所・役場・区役所
	if (
		localTitle === `${trimmedQuery}市役所` ||
		localTitle === `${trimmedQuery}役場` ||
		localTitle === `${trimmedQuery}区役所`
	) {
		score += 800;
	}

	// 3. 代表駅（例: 蕨駅）
	if (
		localTitle === `${trimmedQuery}駅` ||
		lowerTitle.endsWith(`${trimmedQuery}駅`)
	) {
		score += 700;
	}

	// 4. 自治体名に含まれる
	if (
		lowerTitle.includes(`${trimmedQuery}市`) ||
		lowerTitle.includes(`${trimmedQuery}区`)
	) {
		score += 400;
	}

	// 5. タイトルがクエリから始まる
	if (localTitle.startsWith(trimmedQuery)) {
		score += 100;
	}

	// 6. 一般施設（消防署・警察署・交番・郵便局・学校など）の減点
	if (
		lowerTitle.includes("消防") ||
		lowerTitle.includes("警察") ||
		lowerTitle.includes("交番") ||
		lowerTitle.includes("郵便局") ||
		lowerTitle.includes("病院") ||
		lowerTitle.includes("学校")
	) {
		score -= 200;
	}

	// 7. 民間施設・福祉施設の減点
	if (
		lowerTitle.includes("老人ホーム") ||
		lowerTitle.includes("サンクチュアリ") ||
		lowerTitle.includes("介護") ||
		lowerTitle.includes("福祉") ||
		lowerTitle.includes("店舗") ||
		lowerTitle.includes("支店")
	) {
		score -= 400;
	}

	return score;
}

/**
 * 任意の地名・市区町村・住所・ランドマークを検索し、CityConfig候補リストを返す
 * 国土地理院（市・町サフィックス自動補完）+ Nominatim (OSM) + Open-Meteo をハイブリッド統合
 */
export async function searchLocationsOnline(
	query: string,
): Promise<CityConfig[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const candidates: ScoredCandidate[] = [];

	// 1. 国土地理院 (GSI) 検索 (原語 + "市" + "町" を並行検索して市区町村漏れを完全防止)
	const gsiQueries = [trimmed];
	if (
		!trimmed.endsWith("市") &&
		!trimmed.endsWith("町") &&
		!trimmed.endsWith("村") &&
		!trimmed.endsWith("区")
	) {
		gsiQueries.push(`${trimmed}市`, `${trimmed}町`);
	}

	const gsiPromises = gsiQueries.map(async (q) => {
		try {
			const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`;
			const res = await fetch(url);
			if (res.ok) {
				const data = (await res.json()) as GsiFeature[];
				if (Array.isArray(data)) {
					for (const item of data) {
						const coords = item.geometry?.coordinates;
						const rawTitle = item.properties?.title;
						if (coords && coords.length === 2 && rawTitle) {
							const lon = coords[0];
							const lat = coords[1];
							const { name, prefHint } =
								cleanLocationTitle(rawTitle);
							const score = calculateLocationScore(
								rawTitle,
								trimmed,
							);
							candidates.push({
								name,
								prefecture: prefHint,
								lat,
								lon,
								score,
								source: "gsi",
							});
						}
					}
				}
			}
		} catch {
			// エラー時はスキップ
		}
	});

	// 2. OpenStreetMap (Nominatim) 日本国内検索
	const osmPromise = (async () => {
		try {
			const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=jp&addressdetails=1&limit=10`;
			const res = await fetch(osmUrl, {
				headers: {
					"User-Agent": "WeatherDashboardApp/1.0",
				},
			});
			if (res.ok) {
				const data = (await res.json()) as NominatimItem[];
				if (Array.isArray(data)) {
					for (const item of data) {
						if (item.lat && item.lon) {
							const lat = parseFloat(item.lat);
							const lon = parseFloat(item.lon);
							const pref =
								item.address?.province ||
								item.address?.state ||
								"";
							const cityName =
								item.address?.city ||
								item.address?.town ||
								item.address?.village ||
								item.address?.suburb ||
								item.name ||
								"";
							const fullTitle = `${pref}${cityName} ${item.display_name || ""}`;
							const score =
								calculateLocationScore(fullTitle, trimmed) + 20;
							candidates.push({
								name: cityName || trimmed,
								prefecture: pref,
								lat,
								lon,
								score,
								source: "osm",
							});
						}
					}
				}
			}
		} catch {
			// スキップ
		}
	})();

	// 3. Open-Meteo Geocoding
	const omPromise = (async () => {
		try {
			const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&language=ja&count=6`;
			const res = await fetch(omUrl);
			if (res.ok) {
				const data = (await res.json()) as OpenMeteoGeoResponse;
				if (data.results && Array.isArray(data.results)) {
					for (const item of data.results) {
						const score = calculateLocationScore(
							item.name,
							trimmed,
						);
						candidates.push({
							name: item.name,
							prefecture: item.admin1 || "",
							lat: item.latitude,
							lon: item.longitude,
							score,
							source: "open-meteo",
						});
					}
				}
			}
		} catch {
			// スキップ
		}
	})();

	await Promise.allSettled([...gsiPromises, osmPromise, omPromise]);

	// スコア順にソート
	candidates.sort((a, b) => b.score - a.score);

	// 重複排除（近接座標および名称一致）
	const results: CityConfig[] = [];
	const seenKeys = new Set<string>();

	for (const cand of candidates) {
		const coordKey = `${cand.lat.toFixed(2)},${cand.lon.toFixed(2)}`;
		const nameKey = `${cand.name}_${cand.prefecture}`;

		if (seenKeys.has(coordKey) || seenKeys.has(nameKey)) {
			continue;
		}
		seenKeys.add(coordKey);
		seenKeys.add(nameKey);

		const station = findNearestJmaStation(
			cand.lat,
			cand.lon,
			`${cand.prefecture} ${cand.name}`,
		);

		results.push({
			id: `geo_${Date.now()}_${results.length}`,
			name: cand.name,
			prefecture: cand.prefecture || station.name,
			region: "登録地点",
			jmaOfficeCode: station.officeCode,
			jmaAreaCode: station.areaCode,
			latitude: Math.round(cand.lat * 10000) / 10000,
			longitude: Math.round(cand.lon * 10000) / 10000,
		});

		if (results.length >= 8) {
			break;
		}
	}

	return results;
}
