import { CityConfig, ModelForecast, HourlyForecastItem } from "../types";

export function getWeatherTextFromCode(code: number): string {
	switch (code) {
		case 0:
			return "快晴";
		case 1:
			return "晴れ";
		case 2:
			return "時々曇り";
		case 3:
			return "くもり";
		case 45:
		case 48:
			return "霧";
		case 51:
		case 53:
		case 55:
			return "霧雨";
		case 61:
			return "小雨";
		case 63:
			return "雨";
		case 65:
			return "強い雨";
		case 71:
		case 73:
		case 75:
			return "雪";
		case 80:
		case 81:
		case 82:
			return "にわか雨";
		case 95:
		case 96:
		case 99:
			return "雷雨";
		default:
			return "不明";
	}
}

export async function fetchOpenMeteoModel(
	city: CityConfig,
	modelName: "jma_seamless" | "ecmwf_ifs025",
	label: string,
): Promise<ModelForecast> {
	const url = new URL("https://api.open-meteo.com/v1/forecast");
	url.searchParams.set("latitude", city.latitude.toString());
	url.searchParams.set("longitude", city.longitude.toString());
	url.searchParams.set(
		"daily",
		"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
	);
	url.searchParams.set(
		"hourly",
		"temperature_2m,apparent_temperature,precipitation_probability,weather_code",
	);
	url.searchParams.set("timezone", "Asia/Tokyo");
	url.searchParams.set("past_days", "1");
	url.searchParams.set("forecast_days", "3");
	url.searchParams.set("models", modelName);

	const res = await fetch(url.toString(), {
		headers: { "User-Agent": "WeatherDashboard/1.0" },
	});

	if (!res.ok) {
		throw new Error(
			`Open-Meteo API error: ${res.status} ${res.statusText}`,
		);
	}

	const data: any = await res.json();
	const daily = data.daily || {};
	const hourlyData = data.hourly || {};

	// past_days=1 なので index 0 が昨日、index 1 が今日
	const yesterdayIdx = 0;
	const todayIdx = 1;

	const prevMax = daily.temperature_2m_max?.[yesterdayIdx] ?? 20;
	const prevMin = daily.temperature_2m_min?.[yesterdayIdx] ?? 15;
	const todayMax = daily.temperature_2m_max?.[todayIdx] ?? 20;
	const todayMin = daily.temperature_2m_min?.[todayIdx] ?? 15;
	const todayCode = daily.weather_code?.[todayIdx] ?? 0;
	const popMax = daily.precipitation_probability_max?.[todayIdx] ?? 0;

	const maxTempDiff = Math.round((todayMax - prevMax) * 10) / 10;
	const minTempDiff = Math.round((todayMin - prevMin) * 10) / 10;

	// 本日の時間別データ (直近24時間分を抽出)
	const hourly: HourlyForecastItem[] = [];
	const times: string[] = hourlyData.time || [];
	const temps: number[] = hourlyData.temperature_2m || [];
	const apparentTemps: number[] = hourlyData.apparent_temperature || [];
	const pops: number[] = hourlyData.precipitation_probability || [];
	const codes: number[] = hourlyData.weather_code || [];

	// past_days=1 (24h) の後、当日0時から24時間分
	const startIndex = 24;
	const endIndex = Math.min(times.length, startIndex + 24);

	for (let i = startIndex; i < endIndex; i++) {
		hourly.push({
			time: times[i],
			temp: temps[i] ?? 0,
			apparentTemp: apparentTemps[i] ?? temps[i] ?? 0,
			pop: pops[i] ?? 0,
			weatherCode: codes[i] ?? 0,
		});
	}

	return {
		modelName: modelName === "jma_seamless" ? "jma" : "ecmwf",
		label,
		todayWeatherCode: todayCode,
		todayWeatherText: getWeatherTextFromCode(todayCode),
		maxTemp: todayMax,
		minTemp: todayMin,
		popMax,
		prevMaxTemp: prevMax,
		prevMinTemp: prevMin,
		maxTempDiff,
		minTempDiff,
		hourly,
	};
}
