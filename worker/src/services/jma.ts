import { CityConfig, JmaForecastData } from "../types";

export async function fetchJmaWeather(
	city: CityConfig,
): Promise<JmaForecastData> {
	const forecastUrl = `https://www.jma.go.jp/bosai/forecast/data/forecast/${city.jmaOfficeCode}.json`;
	const overviewUrl = `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${city.jmaOfficeCode}.json`;

	const [forecastRes, overviewRes] = await Promise.all([
		fetch(forecastUrl, {
			headers: { "User-Agent": "WeatherDashboard/1.0" },
		}),
		fetch(overviewUrl, {
			headers: { "User-Agent": "WeatherDashboard/1.0" },
		}),
	]);

	let todayWeather = "情報なし";
	let todayPops: string[] = [];
	let todayMaxTemp: number | undefined;
	let todayMinTemp: number | undefined;
	let reportDatetime = new Date().toISOString();

	if (forecastRes.ok) {
		const forecastData: any = await forecastRes.json();
		if (Array.isArray(forecastData) && forecastData.length > 0) {
			reportDatetime = forecastData[0].reportDatetime || reportDatetime;
			const timeSeries = forecastData[0].timeSeries || [];

			// 天気テキスト取得
			const weatherSeries = timeSeries[0];
			if (weatherSeries && weatherSeries.areas) {
				const targetArea =
					weatherSeries.areas.find(
						(a: any) => a.area.code === city.jmaAreaCode,
					) || weatherSeries.areas[0];
				if (
					targetArea &&
					targetArea.weathers &&
					targetArea.weathers.length > 0
				) {
					todayWeather = targetArea.weathers[0]
						.replace(/\s+/g, " ")
						.trim();
				}
			}

			// 降水確率
			const popSeries = timeSeries[1];
			if (popSeries && popSeries.areas) {
				const targetArea =
					popSeries.areas.find(
						(a: any) => a.area.code === city.jmaAreaCode,
					) || popSeries.areas[0];
				if (targetArea && targetArea.pops) {
					todayPops = targetArea.pops;
				}
			}

			// 気温
			const tempSeries = timeSeries[2];
			if (tempSeries && tempSeries.areas) {
				const targetArea =
					tempSeries.areas.find(
						(a: any) => a.area.code === city.jmaAreaCode,
					) || tempSeries.areas[0];
				if (targetArea && targetArea.temps) {
					const temps = targetArea.temps
						.map((t: string) => parseFloat(t))
						.filter((t: number) => !isNaN(t));
					if (temps.length >= 2) {
						todayMinTemp = temps[0];
						todayMaxTemp = temps[1];
					}
				}
			}
		}
	}

	let overviewText = "";
	let headlineText = "";
	if (overviewRes.ok) {
		const overviewData: any = await overviewRes.json();
		overviewText = overviewData.text
			? overviewData.text.replace(/\r?\n+/g, " ").trim()
			: "";
		headlineText = overviewData.headlineText
			? overviewData.headlineText.trim()
			: "";
	}

	// 特記事項（台風、大雨、落雷、突風等）の抽出
	const typhoonMentioned =
		/台風/i.test(overviewText) || /台風/i.test(headlineText);
	const alertNotices: string[] = [];

	if (typhoonMentioned) {
		const match = overviewText.match(/台風第?[０-９0-9]+号[^\s。、]*/);
		alertNotices.push(match ? `🌀${match[0]}` : "🌀台風の動向に注意");
	}
	if (/警報|警戒/i.test(overviewText) || /警報/i.test(headlineText)) {
		alertNotices.push("⚠️大雨や暴風などの警報に警戒");
	}
	if (/雷/i.test(overviewText) || /突風/i.test(overviewText)) {
		alertNotices.push("⚡急な雷雨や突風に注意");
	}
	if (/熱中症/i.test(overviewText)) {
		alertNotices.push("🌡️熱中症対策を徹底");
	}

	return {
		areaName: city.name,
		reportDatetime,
		todayWeather,
		todayPops,
		todayMaxTemp,
		todayMinTemp,
		overviewText,
		headlineText,
		typhoonMentioned,
		alertNotices,
	};
}
