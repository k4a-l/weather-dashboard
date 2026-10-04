import {
	CityConfig,
	AggregatedWeatherData,
	NotificationPayload,
} from "../types";
import { fetchJmaWeather } from "./jma";
import { fetchOpenMeteoModel } from "./openMeteo";
import { getClothingAdvice } from "./clothing";

export async function aggregateWeather(
	city: CityConfig,
): Promise<AggregatedWeatherData> {
	const [jma, openMeteoJma, openMeteoEcmwf] = await Promise.all([
		fetchJmaWeather(city),
		fetchOpenMeteoModel(city, "jma_seamless", "気象庁モデル (JMA)"),
		fetchOpenMeteoModel(city, "ecmwf_ifs025", "欧州モデル (ECMWF)"),
	]);

	// 気温や降水確率はOpen-Meteo JMAモデルと気象庁公式をハイブリッド利用
	const maxTemp = openMeteoJma.maxTemp;
	const minTemp = openMeteoJma.minTemp;
	const maxDiff = openMeteoJma.maxTempDiff;
	const minDiff = openMeteoJma.minTempDiff;
	const pop = openMeteoJma.popMax;

	const diffSign = (diff: number) => (diff > 0 ? `+${diff}` : `${diff}`);

	const clothingAdvice = getClothingAdvice(maxTemp, minTemp, maxDiff);

	// 通知メッセージの生成
	// タイトル: 【都市名】天気 最高気温 (前日比) 降水確率
	const title = `【${city.name}】${jma.todayWeather} ${maxTemp}℃ (${diffSign(maxDiff)}℃) ☔${pop}%`;

	// 本文の組み立て
	const bodyLines: string[] = [];

	// 1行目: 気温レンジと前日比
	bodyLines.push(
		`最高 ${maxTemp}℃ / 最低 ${minTemp}℃ (${diffSign(minDiff)}℃)`,
	);

	// 2行目: 服装アドバイス
	bodyLines.push(clothingAdvice);

	// 3行目: モデル比較 (JMA vs ECMWF)
	bodyLines.push(
		`[比較] JMA: ${openMeteoJma.todayWeatherText} | ECMWF: ${openMeteoEcmwf.todayWeatherText}`,
	);

	// 4行目: 特記事項（台風や警報など）
	if (jma.alertNotices.length > 0) {
		bodyLines.push(jma.alertNotices.join(" / "));
	}

	const notification: NotificationPayload = {
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
	};

	return {
		city,
		jma,
		openMeteoJma,
		openMeteoEcmwf,
		notification,
		clothingAdvice,
		generatedAt: new Date().toISOString(),
	};
}
