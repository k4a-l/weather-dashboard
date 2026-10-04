import {
	CityConfig,
	AggregatedWeatherData,
	ModelForecast,
	JmaForecastData,
	HourlyForecastItem,
} from "../types";

export function getWeatherIcon(textOrCode: string | number): string {
	const text = String(textOrCode);
	if (text.includes("晴") || text === "0" || text === "1") return "☀️";
	if (text.includes("雷") || text === "95" || text === "96" || text === "99")
		return "⚡";
	if (text.includes("雪") || text === "71" || text === "73" || text === "75")
		return "❄️";
	if (
		text.includes("雨") ||
		text.includes("小雨") ||
		text === "61" ||
		text === "63" ||
		text === "65" ||
		text === "80"
	)
		return "🌧️";
	if (
		text.includes("曇") ||
		text.includes("くもり") ||
		text === "2" ||
		text === "3"
	)
		return "☁️";
	if (text.includes("霧") || text === "45" || text === "48") return "🌫️";
	return "🌤️";
}

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

export function getClothingAdvice(
	maxTemp: number,
	minTemp: number,
	maxTempDiff: number,
): string {
	let baseAdvice = "";
	if (maxTemp >= 28) {
		baseAdvice = "👕 半袖1枚で快適。日傘や熱中症対策を";
	} else if (maxTemp >= 24) {
		baseAdvice = "👕 半袖または薄手の長袖がおすすめ";
	} else if (maxTemp >= 20) {
		baseAdvice = "👔 長袖シャツやカットソーが快適";
	} else if (maxTemp >= 16) {
		baseAdvice = "🧥 カーディガンや薄手の上着があると安心";
	} else if (maxTemp >= 12) {
		baseAdvice = "🧥 セーターやジャケット、薄手コートが活躍";
	} else if (maxTemp >= 8) {
		baseAdvice = "🧣 冬物コートやマフラーで防寒を";
	} else {
		baseAdvice = "🧤 ダウンや手袋で万全の防寒対策を";
	}

	const tempSpan = maxTemp - minTemp;
	let extraAdvice = "";
	if (maxTempDiff <= -3) {
		extraAdvice = "（前日より大幅に寒いため暖かめの服装を）";
	} else if (maxTempDiff >= 3) {
		extraAdvice = "（前日より大幅に暖かいため脱ぎ着しやすい服を）";
	} else if (tempSpan >= 10) {
		extraAdvice = "（朝晩と昼の寒暖差に注意）";
	}

	return `${baseAdvice} ${extraAdvice}`.trim();
}

export async function fetchJmaDirect(
	city: CityConfig,
): Promise<JmaForecastData> {
	const forecastUrl = `https://www.jma.go.jp/bosai/forecast/data/forecast/${city.jmaOfficeCode}.json`;
	const overviewUrl = `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${city.jmaOfficeCode}.json`;

	const [forecastRes, overviewRes] = await Promise.all([
		fetch(forecastUrl),
		fetch(overviewUrl),
	]);

	let todayWeather = "くもり";
	let todayPops: string[] = [];
	let todayMaxTemp: number | undefined;
	let todayMinTemp: number | undefined;
	let reportDatetime = new Date().toISOString();

	if (forecastRes.ok) {
		const forecastData: any = await forecastRes.json();
		if (Array.isArray(forecastData) && forecastData.length > 0) {
			reportDatetime = forecastData[0].reportDatetime || reportDatetime;
			const timeSeries = forecastData[0].timeSeries || [];

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

	const typhoonMentioned =
		/台風/i.test(overviewText) || /台風/i.test(headlineText);
	const alertNotices: string[] = [];
	if (typhoonMentioned) {
		const match = overviewText.match(/台風第?[０-９0-9]+号[^\s。、]*/);
		alertNotices.push(match ? `🌀 ${match[0]}` : "🌀 台風の動向に注意");
	}
	if (/警報|警戒/i.test(overviewText) || /警報/i.test(headlineText)) {
		alertNotices.push("⚠️ 大雨や暴風などの警報に警戒");
	}
	if (/雷/i.test(overviewText) || /突風/i.test(overviewText)) {
		alertNotices.push("⚡ 急な雷雨や突風に注意");
	}
	if (/熱中症/i.test(overviewText)) {
		alertNotices.push("🌡️ 熱中症対策を徹底");
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

export async function fetchOpenMeteoDirect(
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

	const res = await fetch(url.toString());
	if (!res.ok) {
		throw new Error(`Open-Meteo API failed with ${res.status}`);
	}

	const data: any = await res.json();
	const daily = data.daily || {};
	const hourlyData = data.hourly || {};

	const prevMax = daily.temperature_2m_max?.[0] ?? 20;
	const prevMin = daily.temperature_2m_min?.[0] ?? 15;
	const todayMax = daily.temperature_2m_max?.[1] ?? 20;
	const todayMin = daily.temperature_2m_min?.[1] ?? 15;
	const todayCode = daily.weather_code?.[1] ?? 0;
	const popMax = daily.precipitation_probability_max?.[1] ?? 0;

	const maxTempDiff = Math.round((todayMax - prevMax) * 10) / 10;
	const minTempDiff = Math.round((todayMin - prevMin) * 10) / 10;

	const hourly: HourlyForecastItem[] = [];
	const times: string[] = hourlyData.time || [];
	const temps: number[] = hourlyData.temperature_2m || [];
	const apparentTemps: number[] = hourlyData.apparent_temperature || [];
	const pops: number[] = hourlyData.precipitation_probability || [];
	const codes: number[] = hourlyData.weather_code || [];

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

export async function fetchAggregatedWeatherDirect(
	city: CityConfig,
): Promise<AggregatedWeatherData> {
	const [jma, openMeteoJma, openMeteoEcmwf] = await Promise.all([
		fetchJmaDirect(city),
		fetchOpenMeteoDirect(city, "jma_seamless", "気象庁モデル (JMA)"),
		fetchOpenMeteoDirect(city, "ecmwf_ifs025", "欧州モデル (ECMWF)"),
	]);

	const maxTemp = openMeteoJma.maxTemp;
	const minTemp = openMeteoJma.minTemp;
	const maxDiff = openMeteoJma.maxTempDiff;
	const minDiff = openMeteoJma.minTempDiff;
	const pop = openMeteoJma.popMax;

	const diffSign = (diff: number) => (diff > 0 ? `+${diff}` : `${diff}`);
	const clothingAdvice = getClothingAdvice(maxTemp, minTemp, maxDiff);

	const title = `【${city.name}】${jma.todayWeather} ${maxTemp}℃ (${diffSign(maxDiff)}℃) ☔${pop}%`;
	const bodyLines: string[] = [
		`最高 ${maxTemp}℃ / 最低 ${minTemp}℃ (${diffSign(minDiff)}℃)`,
		clothingAdvice,
		`[比較] JMA: ${openMeteoJma.todayWeatherText} | ECMWF: ${openMeteoEcmwf.todayWeatherText}`,
	];
	if (jma.alertNotices.length > 0) {
		bodyLines.push(jma.alertNotices.join(" / "));
	}

	return {
		city,
		jma,
		openMeteoJma,
		openMeteoEcmwf,
		clothingAdvice,
		notification: {
			title,
			body: bodyLines.join("\n"),
			data: {
				cityId: city.id,
				cityName: city.name,
				maxTemp,
				minTemp,
				maxDiff,
				minDiff,
				pop,
			},
		},
		generatedAt: new Date().toISOString(),
	};
}
