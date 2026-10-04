import {
	CityConfig,
	AggregatedWeatherData,
	ModelForecast,
	JmaForecastData,
	HourlyForecastItem,
	DailyForecastItem,
} from "../types";

export function getWeatherIcon(textOrCode: string | number): string {
	const text = String(textOrCode);
	if (
		text.includes("晴") ||
		text === "0" ||
		text === "1" ||
		text.startsWith("1")
	)
		return "☀️";
	if (text.includes("雷") || text === "95" || text === "96" || text === "99")
		return "⚡";
	if (
		text.includes("雪") ||
		text === "71" ||
		text === "73" ||
		text === "75" ||
		text.startsWith("4")
	)
		return "❄️";
	if (
		text.includes("雨") ||
		text.includes("小雨") ||
		text === "61" ||
		text === "63" ||
		text === "65" ||
		text === "80" ||
		text.startsWith("3")
	)
		return "🌧️";
	if (
		text.includes("曇") ||
		text.includes("くもり") ||
		text === "2" ||
		text === "3" ||
		text.startsWith("2")
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

export function getJmaWeatherTextFromCode(code: string): string {
	if (code.startsWith("100")) return "晴れ";
	if (code.startsWith("101")) return "晴れ時々曇り";
	if (code.startsWith("110")) return "晴れのち曇り";
	if (code.startsWith("200")) return "くもり";
	if (code.startsWith("201")) return "曇り時々晴れ";
	if (code.startsWith("202")) return "曇り一時雨";
	if (code.startsWith("210")) return "曇りのち晴れ";
	if (code.startsWith("211")) return "曇りのち雨";
	if (code.startsWith("300")) return "雨";
	if (code.startsWith("301")) return "雨時々晴れ";
	if (code.startsWith("311")) return "雨のち曇り";
	if (code.startsWith("400")) return "雪";
	if (code.startsWith("1")) return "晴れ";
	if (code.startsWith("2")) return "くもり";
	if (code.startsWith("3")) return "雨";
	if (code.startsWith("4")) return "雪";
	return "くもり";
}

export function getClothingAdvice(
	maxTemp: number,
	minTemp: number,
	maxTempDiff: number,
): string {
	let baseAdvice = "";
	if (maxTemp >= 28) {
		baseAdvice = "半袖1枚で快適。日傘や熱中症対策を";
	} else if (maxTemp >= 24) {
		baseAdvice = "半袖または薄手の長袖がおすすめ";
	} else if (maxTemp >= 20) {
		baseAdvice = "長袖シャツやカットソーが快適";
	} else if (maxTemp >= 16) {
		baseAdvice = "カーディガンや薄手の上着があると安心";
	} else if (maxTemp >= 12) {
		baseAdvice = "セーターやジャケット、薄手コートが活躍";
	} else if (maxTemp >= 8) {
		baseAdvice = "冬物コートやマフラーで防寒を";
	} else {
		baseAdvice = "ダウンや手袋で万全の防寒対策を";
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

interface JmaArea {
	area: { name: string; code: string };
	weatherCodes?: string[];
	weathers?: string[];
	winds?: string[];
	waves?: string[];
	pops?: string[];
	temps?: string[];
	tempsMin?: string[];
	tempsMax?: string[];
}

interface JmaTimeSeriesItem {
	timeDefines?: string[];
	areas?: JmaArea[];
}

interface JmaForecastResponseItem {
	reportDatetime?: string;
	timeSeries?: JmaTimeSeriesItem[];
}

interface JmaOverviewResponse {
	text?: string;
	headlineText?: string;
}

interface OpenMeteoDailyData {
	time?: string[];
	weather_code?: (number | null)[];
	temperature_2m_max?: (number | null)[];
	temperature_2m_min?: (number | null)[];
	apparent_temperature_max?: (number | null)[];
	apparent_temperature_min?: (number | null)[];
	precipitation_probability_max?: (number | null)[];
	precipitation_sum?: (number | null)[];
}

interface OpenMeteoHourlyData {
	time?: string[];
	temperature_2m?: number[];
	apparent_temperature?: number[];
	relative_humidity_2m?: number[];
	wind_speed_10m?: number[];
	wind_direction_10m?: number[];
	precipitation_probability?: number[];
	precipitation?: number[];
	weather_code?: number[];
}

interface OpenMeteoApiResponse {
	daily?: OpenMeteoDailyData;
	hourly?: OpenMeteoHourlyData;
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
	let tomorrowWeather: string | undefined;
	let tomorrowPops: string[] | undefined;
	let tomorrowMaxTemp: number | undefined;
	let tomorrowMinTemp: number | undefined;
	let reportDatetime = new Date().toISOString();
	const weeklyDaily: DailyForecastItem[] = [];

	if (forecastRes.ok) {
		const forecastData =
			(await forecastRes.json()) as JmaForecastResponseItem[];
		if (Array.isArray(forecastData) && forecastData.length > 0) {
			reportDatetime = forecastData[0].reportDatetime || reportDatetime;
			const timeSeries = forecastData[0].timeSeries || [];

			// 今日の天気・明日の天気
			const weatherSeries = timeSeries[0];
			if (weatherSeries && weatherSeries.areas) {
				const targetArea =
					weatherSeries.areas.find(
						(a) => a.area.code === city.jmaAreaCode,
					) || weatherSeries.areas[0];
				if (
					targetArea &&
					targetArea.weathers &&
					targetArea.weathers.length > 0
				) {
					todayWeather = targetArea.weathers[0]
						.replace(/\s+/g, " ")
						.trim();
					if (targetArea.weathers.length > 1) {
						tomorrowWeather = targetArea.weathers[1]
							.replace(/\s+/g, " ")
							.trim();
					}
				}
			}

			// 降水確率
			const popSeries = timeSeries[1];
			if (popSeries && popSeries.areas) {
				const targetArea =
					popSeries.areas.find(
						(a) => a.area.code === city.jmaAreaCode,
					) || popSeries.areas[0];
				if (targetArea && targetArea.pops) {
					if (targetArea.pops.length > 4) {
						todayPops = targetArea.pops.slice(0, 4);
						tomorrowPops = targetArea.pops.slice(4);
					} else {
						todayPops = targetArea.pops;
					}
				}
			}

			// 今日の気温・明日の気温
			const tempSeries = timeSeries[2];
			if (tempSeries && tempSeries.areas) {
				const targetArea =
					tempSeries.areas.find(
						(a) => a.area.code === city.jmaAreaCode,
					) || tempSeries.areas[0];
				if (targetArea && targetArea.temps) {
					const temps = targetArea.temps
						.map((t: string) => parseFloat(t))
						.filter((t: number) => !isNaN(t));

					// 気象庁の日時 "YYYY-MM-DDTHH:mm:ss+09:00" から JST発表時（時）を確実に抽出
					const hourMatch = reportDatetime.match(/T(\d{2}):/);
					const reportHour = hourMatch
						? parseInt(hourMatch[1], 10)
						: (new Date(reportDatetime).getUTCHours() + 9) % 24;

					if (temps.length >= 4) {
						if (reportHour >= 10 && reportHour < 16) {
							// 11時発表: [0]: 今日の日中最高, [1]: 今日の最高, [2]: 明日の朝最低, [3]: 明日の日中最高
							// 今日の最低気温は朝を過ぎており短期予報に含まれないため、undefined（数値モデル等で補完）
							todayMaxTemp = temps[0];
							tomorrowMinTemp = temps[2];
							tomorrowMaxTemp = temps[3];
						} else if (reportHour < 10) {
							// 5時発表: [0]: 今日の朝最低, [1]: 今日の日中最高, [2]: 明日の朝最低, [3]: 明日の日中最高
							if (temps[0] !== temps[1]) {
								todayMinTemp = temps[0];
								todayMaxTemp = temps[1];
							} else {
								todayMaxTemp = temps[0];
							}
							tomorrowMinTemp = temps[2];
							tomorrowMaxTemp = temps[3];
						} else {
							// 17時発表以降
							tomorrowMinTemp = temps[0];
							tomorrowMaxTemp = temps[1];
						}
					} else if (temps.length === 3) {
						todayMaxTemp = temps[0];
						tomorrowMinTemp = temps[1];
						tomorrowMaxTemp = temps[2];
					} else if (temps.length === 2) {
						if (reportHour >= 16) {
							tomorrowMinTemp = temps[0];
							tomorrowMaxTemp = temps[1];
						} else {
							todayMaxTemp = temps[0];
							tomorrowMinTemp = temps[1];
						}
					}

					// 最高気温と最低気温が同値になる現象（最低気温への最高気温重複混入）の完全防止
					if (
						todayMinTemp !== undefined &&
						todayMaxTemp !== undefined &&
						todayMinTemp === todayMaxTemp
					) {
						todayMinTemp = undefined;
					}
				}
			}

			// 週間天気予報 (forecastData[1])
			if (forecastData.length > 1 && forecastData[1].timeSeries) {
				const weeklyTimeSeries = forecastData[1].timeSeries;
				const weeklyWeatherSeries = weeklyTimeSeries[0];
				const weeklyTempSeries = weeklyTimeSeries[1];

				const timeDefines: string[] =
					weeklyWeatherSeries?.timeDefines || [];
				const weeklyArea =
					weeklyWeatherSeries?.areas?.find(
						(a) => a.area.code === city.jmaAreaCode,
					) || weeklyWeatherSeries?.areas?.[0];
				const weatherCodes: string[] = weeklyArea?.weatherCodes || [];
				const pops: string[] = weeklyArea?.pops || [];

				const tempArea =
					weeklyTempSeries?.areas?.find(
						(a) => a.area.code === city.jmaAreaCode,
					) || weeklyTempSeries?.areas?.[0];
				const minTemps: string[] = tempArea?.tempsMin || [];
				const maxTemps: string[] = tempArea?.tempsMax || [];

				for (let i = 0; i < timeDefines.length; i++) {
					const dateStr = timeDefines[i].split("T")[0];
					const wCode = weatherCodes[i] || "";
					weeklyDaily.push({
						date: dateStr,
						weatherText: getJmaWeatherTextFromCode(wCode),
						maxTemp:
							maxTemps[i] && maxTemps[i] !== ""
								? parseFloat(maxTemps[i])
								: undefined,
						minTemp:
							minTemps[i] && minTemps[i] !== ""
								? parseFloat(minTemps[i])
								: undefined,
						pop:
							pops[i] && pops[i] !== ""
								? parseInt(pops[i], 10)
								: undefined,
					});
				}
			}
		}
	}

	// 明日のデータ補完（週間予報から）
	if (weeklyDaily.length > 0) {
		const tomorrowItem = weeklyDaily[0];
		if (
			tomorrowMaxTemp === undefined &&
			tomorrowItem?.maxTemp !== undefined
		) {
			tomorrowMaxTemp = tomorrowItem.maxTemp;
		}
		if (
			tomorrowMinTemp === undefined &&
			tomorrowItem?.minTemp !== undefined
		) {
			tomorrowMinTemp = tomorrowItem.minTemp;
		}
		if (!tomorrowWeather && tomorrowItem?.weatherText) {
			tomorrowWeather = tomorrowItem.weatherText;
		}
		if (
			(!tomorrowPops || tomorrowPops.length === 0) &&
			tomorrowItem?.pop !== undefined
		) {
			tomorrowPops = [`${tomorrowItem.pop}%`];
		}
	}

	// 今日・明日の公式短期予報を週間予報リストの先頭にマージ（TwoWeekForecastCard用）
	const todayDate = new Date();
	const todayDateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;
	const tomorrowDate = new Date(todayDate);
	tomorrowDate.setDate(tomorrowDate.getDate() + 1);
	const tomorrowDateStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;

	const mergedWeekly: DailyForecastItem[] = [];

	const parsePopNum = (popStr?: string): number | undefined => {
		if (!popStr) return undefined;
		const num = parseInt(popStr.replace("%", "").trim(), 10);
		return isNaN(num) ? undefined : num;
	};

	// 今日の予報
	mergedWeekly.push({
		date: todayDateStr,
		weatherText: todayWeather || "",
		maxTemp: todayMaxTemp,
		minTemp: todayMinTemp,
		pop:
			todayPops && todayPops.length > 0
				? parsePopNum(todayPops[0])
				: undefined,
	});

	// 明日の予報
	const existingTomorrow = weeklyDaily.find(
		(d) => d.date === tomorrowDateStr,
	);
	mergedWeekly.push({
		date: tomorrowDateStr,
		weatherText: tomorrowWeather || existingTomorrow?.weatherText || "",
		maxTemp: tomorrowMaxTemp ?? existingTomorrow?.maxTemp,
		minTemp: tomorrowMinTemp ?? existingTomorrow?.minTemp,
		pop:
			tomorrowPops && tomorrowPops.length > 0
				? parsePopNum(tomorrowPops[0])
				: existingTomorrow?.pop,
	});

	// 明後日以降の予報を追加
	for (const item of weeklyDaily) {
		if (item.date !== todayDateStr && item.date !== tomorrowDateStr) {
			mergedWeekly.push(item);
		}
	}
	weeklyDaily.length = 0;
	weeklyDaily.push(...mergedWeekly);

	let overviewText = "";
	let headlineText = "";
	if (overviewRes.ok) {
		const overviewData = (await overviewRes.json()) as JmaOverviewResponse;
		const rawText: string = overviewData.text || "";
		// 各段落の全角・半角スペースを除去し、空行を除いて適切な段落改行で再結合
		const paragraphs = rawText
			.split(/\r?\n+/)
			.map((line: string) =>
				line.replace(/^[\s\u3000]+|[\s\u3000]+$/g, "").trim(),
			)
			.filter((line: string) => line.length > 0);
		overviewText = paragraphs.join("\n\n");
		headlineText = (overviewData.headlineText || "")
			.replace(/^[\s\u3000]+|[\s\u3000]+$/g, "")
			.trim();
	}

	const typhoonMentioned =
		/台風/i.test(overviewText) || /台風/i.test(headlineText);
	const alertNotices: string[] = [];
	if (typhoonMentioned) {
		const match = overviewText.match(/台風第?([０-９0-9]+)号/);
		if (match) {
			const normalizedNum = match[1].replace(/[０-９]/g, (s) =>
				String.fromCharCode(s.charCodeAt(0) - 0xfee0),
			);
			alertNotices.push(`台風第${normalizedNum}号`);
		} else {
			alertNotices.push("台風情報");
		}
	}
	if (/特別警報/i.test(overviewText) || /特別警報/i.test(headlineText)) {
		alertNotices.push("特別警報発令中");
	} else if (/警報/i.test(overviewText) || /警報/i.test(headlineText)) {
		alertNotices.push("警報発令中");
	} else if (/警戒/i.test(overviewText)) {
		alertNotices.push("警戒事項あり");
	}
	if (/雷/i.test(overviewText) || /突風/i.test(overviewText)) {
		alertNotices.push("落雷・突風注意");
	}
	if (/熱中症/i.test(overviewText)) {
		alertNotices.push("熱中症注意");
	}

	return {
		areaName: city.name,
		reportDatetime,
		todayWeather,
		todayPops,
		todayMaxTemp,
		todayMinTemp,
		tomorrowWeather,
		tomorrowPops,
		tomorrowMaxTemp,
		tomorrowMinTemp,
		overviewText,
		headlineText,
		typhoonMentioned,
		alertNotices,
		weeklyDaily,
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
		"weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum",
	);
	url.searchParams.set(
		"hourly",
		"temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,precipitation,weather_code",
	);
	url.searchParams.set("wind_speed_unit", "ms");
	url.searchParams.set("timezone", "Asia/Tokyo");
	url.searchParams.set("past_days", "1");
	url.searchParams.set("forecast_days", "14"); // 2週間先まで取得
	url.searchParams.set("models", modelName);

	const res = await fetch(url.toString());
	if (!res.ok) {
		throw new Error(`Open-Meteo API failed with ${res.status}`);
	}

	const data = (await res.json()) as OpenMeteoApiResponse;
	const dailyData = data.daily || {};
	const hourlyData = data.hourly || {};

	const prevMax = dailyData.temperature_2m_max?.[0] ?? 20;
	const prevMin = dailyData.temperature_2m_min?.[0] ?? 15;
	const todayMax = dailyData.temperature_2m_max?.[1] ?? 20;
	const todayMin = dailyData.temperature_2m_min?.[1] ?? 15;
	const todayApparentMax =
		dailyData.apparent_temperature_max?.[1] !== null &&
		dailyData.apparent_temperature_max?.[1] !== undefined
			? dailyData.apparent_temperature_max[1]
			: undefined;
	const todayApparentMin =
		dailyData.apparent_temperature_min?.[1] !== null &&
		dailyData.apparent_temperature_min?.[1] !== undefined
			? dailyData.apparent_temperature_min[1]
			: undefined;
	const todayCode = dailyData.weather_code?.[1] ?? 0;
	const popMax = dailyData.precipitation_probability_max?.[1] ?? 0;
	const precipitationSum =
		dailyData.precipitation_sum?.[1] !== undefined &&
		dailyData.precipitation_sum?.[1] !== null
			? Math.round(dailyData.precipitation_sum[1] * 10) / 10
			: 0;

	const maxTempDiff = Math.round((todayMax - prevMax) * 10) / 10;
	const minTempDiff = Math.round((todayMin - prevMin) * 10) / 10;

	// 明日の予報（index 2）
	const tomorrowMax = dailyData.temperature_2m_max?.[2] ?? todayMax;
	const tomorrowMin = dailyData.temperature_2m_min?.[2] ?? todayMin;
	const tomorrowApparentMax =
		dailyData.apparent_temperature_max?.[2] !== null &&
		dailyData.apparent_temperature_max?.[2] !== undefined
			? dailyData.apparent_temperature_max[2]
			: undefined;
	const tomorrowApparentMin =
		dailyData.apparent_temperature_min?.[2] !== null &&
		dailyData.apparent_temperature_min?.[2] !== undefined
			? dailyData.apparent_temperature_min[2]
			: undefined;
	const tomorrowCode = dailyData.weather_code?.[2] ?? todayCode;
	const tomorrowPopMax =
		dailyData.precipitation_probability_max?.[2] ?? popMax;
	const tomorrowPrecipitationSum =
		dailyData.precipitation_sum?.[2] !== undefined &&
		dailyData.precipitation_sum?.[2] !== null
			? Math.round(dailyData.precipitation_sum[2] * 10) / 10
			: 0;

	const tomorrowMaxTempDiff = Math.round((tomorrowMax - todayMax) * 10) / 10;
	const tomorrowMinTempDiff = Math.round((tomorrowMin - todayMin) * 10) / 10;

	// 本日＋明日の時間別推移（48時間分: startIndex 24から48時間）
	const hourly: HourlyForecastItem[] = [];
	const times: string[] = hourlyData.time || [];
	const temps: number[] = hourlyData.temperature_2m || [];
	const apparentTemps: number[] = hourlyData.apparent_temperature || [];
	const humidities: number[] = hourlyData.relative_humidity_2m || [];
	const windSpeeds: number[] = hourlyData.wind_speed_10m || [];
	const windDirections: number[] = hourlyData.wind_direction_10m || [];
	const pops: number[] = hourlyData.precipitation_probability || [];
	const precipitations: number[] = hourlyData.precipitation || [];
	const codes: number[] = hourlyData.weather_code || [];

	const startIndex = 24;
	const endIndex = Math.min(times.length, startIndex + 48);

	for (let i = startIndex; i < endIndex; i++) {
		hourly.push({
			time: times[i],
			temp: temps[i] ?? 0,
			apparentTemp: apparentTemps[i] ?? temps[i] ?? 0,
			humidity: Math.round(humidities[i] ?? 0),
			windSpeed: Math.round((windSpeeds[i] ?? 0) * 10) / 10,
			windDirection:
				windDirections[i] !== undefined
					? Math.round(windDirections[i])
					: undefined,
			pop: pops[i] ?? 0,
			precipitation:
				precipitations[i] !== undefined
					? Math.round(precipitations[i] * 10) / 10
					: 0,
			weatherCode: codes[i] ?? 0,
		});
	}

	// 14日先までのデイリー予報リスト（index 1 以降）
	const daily: DailyForecastItem[] = [];
	const dailyDates: string[] = dailyData.time || [];
	const dailyCodes: (number | null)[] = dailyData.weather_code || [];
	const dailyMaxTemps: (number | null)[] = dailyData.temperature_2m_max || [];
	const dailyMinTemps: (number | null)[] = dailyData.temperature_2m_min || [];
	const dailyPops: (number | null)[] =
		dailyData.precipitation_probability_max || [];
	const dailyPrecipitations: (number | null)[] =
		dailyData.precipitation_sum || [];

	for (let i = 1; i < dailyDates.length; i++) {
		const dCode = dailyCodes[i];
		daily.push({
			date: dailyDates[i],
			weatherCode: dCode !== null ? dCode : undefined,
			weatherText:
				dCode !== null ? getWeatherTextFromCode(dCode) : "予測範囲外",
			maxTemp: dailyMaxTemps[i] !== null ? dailyMaxTemps[i]! : undefined,
			minTemp: dailyMinTemps[i] !== null ? dailyMinTemps[i]! : undefined,
			pop: dailyPops[i] !== null ? dailyPops[i]! : undefined,
			precipitation:
				dailyPrecipitations[i] !== null &&
				dailyPrecipitations[i] !== undefined
					? Math.round(dailyPrecipitations[i]! * 10) / 10
					: undefined,
		});
	}

	return {
		modelName: modelName === "jma_seamless" ? "jma" : "ecmwf",
		label,
		todayWeatherCode: todayCode,
		todayWeatherText: getWeatherTextFromCode(todayCode),
		maxTemp: todayMax,
		minTemp: todayMin,
		todayApparentMaxTemp: todayApparentMax,
		todayApparentMinTemp: todayApparentMin,
		popMax,
		precipitationSum,
		prevMaxTemp: prevMax,
		prevMinTemp: prevMin,
		maxTempDiff,
		minTempDiff,
		tomorrowWeatherCode: tomorrowCode,
		tomorrowWeatherText: getWeatherTextFromCode(tomorrowCode),
		tomorrowMaxTemp: tomorrowMax,
		tomorrowMinTemp: tomorrowMin,
		tomorrowApparentMaxTemp: tomorrowApparentMax,
		tomorrowApparentMinTemp: tomorrowApparentMin,
		tomorrowPopMax: tomorrowPopMax,
		tomorrowPrecipitationSum: tomorrowPrecipitationSum,
		tomorrowMaxTempDiff,
		tomorrowMinTempDiff,
		hourly,
		daily,
	};
}

export async function fetchAggregatedWeatherDirect(
	city: CityConfig,
): Promise<AggregatedWeatherData> {
	const [jma, openMeteoJma, openMeteoEcmwf] = await Promise.all([
		fetchJmaDirect(city),
		fetchOpenMeteoDirect(city, "jma_seamless", "JMA (気象庁数値)"),
		fetchOpenMeteoDirect(city, "ecmwf_ifs025", "ECMWF (欧州数値)"),
	]);

	const maxTemp = openMeteoJma.maxTemp;
	const minTemp = openMeteoJma.minTemp;
	const maxDiff = openMeteoJma.maxTempDiff;
	const minDiff = openMeteoJma.minTempDiff;
	const pop = openMeteoJma.popMax;

	const formatTemperature = (temp: number) => `${temp.toFixed(1)}℃`;
	const formatDiff = (diff: number) => {
		if (diff > 0) return `+${diff.toFixed(1)}`;
		if (diff < 0) return `${diff.toFixed(1)}`;
		return `0.0`;
	};
	const rawClothingAdvice = getClothingAdvice(maxTemp, minTemp, maxDiff);
	const clothingAdvice = rawClothingAdvice
		? rawClothingAdvice.replace(/^[\p{Emoji}\s]+/u, "")
		: "";

	// タイトル: 地点・天気・降水確率（一目で傘の要否がわかる）
	const title = `【${city.name}】${jma.todayWeather}・降水 ${pop}%`;

	// 本文: 気温（最高・最低と前日差を重複なく1行で対比）＋ 服装目安 ＋ 注意報
	const bodyLines: string[] = [
		`${formatTemperature(maxTemp)} (${formatDiff(maxDiff)}) / ${formatTemperature(minTemp)} (${formatDiff(minDiff)})`,
	];
	if (clothingAdvice) {
		bodyLines.push(`${clothingAdvice}`);
	}
	if (jma.alertNotices.length > 0) {
		const cleanAlerts = jma.alertNotices
			.map((a) => a.replace(/^[\p{Emoji}\s]+/u, ""))
			.join(" / ");
		bodyLines.push(`注意報: ${cleanAlerts}`);
	}

	// 明日の通知ペイロード生成
	const tomWeather = jma.tomorrowWeather || openMeteoJma.tomorrowWeatherText;
	const tomPop = openMeteoJma.tomorrowPopMax;
	const tomMaxTemp = openMeteoJma.tomorrowMaxTemp;
	const tomMinTemp = openMeteoJma.tomorrowMinTemp;
	const tomMaxDiff = openMeteoJma.tomorrowMaxTempDiff;
	const tomMinDiff = openMeteoJma.tomorrowMinTempDiff;
	const rawTomAdvice = getClothingAdvice(tomMaxTemp, tomMinTemp, tomMaxDiff);
	const tomorrowClothingAdvice = rawTomAdvice
		? rawTomAdvice.replace(/^[\p{Emoji}\s]+/u, "")
		: "";

	const tomTitle = `【${city.name} 明日】${tomWeather}・降水 ${tomPop}%`;
	const tomBodyLines: string[] = [
		`${formatTemperature(tomMaxTemp)} (今日比 ${formatDiff(tomMaxDiff)}) / ${formatTemperature(tomMinTemp)} (今日比 ${formatDiff(tomMinDiff)})`,
	];
	if (tomorrowClothingAdvice) {
		tomBodyLines.push(`${tomorrowClothingAdvice}`);
	}

	return {
		city,
		jma,
		openMeteoJma,
		openMeteoEcmwf,
		clothingAdvice,
		tomorrowClothingAdvice,
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
		tomorrowNotification: {
			title: tomTitle,
			body: tomBodyLines.join("\n"),
			data: {
				cityId: city.id,
				cityName: city.name,
				maxTemp: tomMaxTemp,
				minTemp: tomMinTemp,
				maxDiff: tomMaxDiff,
				minDiff: tomMinDiff,
				pop: tomPop,
				target: "tomorrow",
			},
		},
		generatedAt: new Date().toISOString(),
	};
}
