export interface CityConfig {
	id: string;
	name: string;
	jmaOfficeCode: string; // 気象庁オフィスコード (例: 130000)
	jmaAreaCode: string; // 気象庁エリアコード (例: 130010)
	latitude: number;
	longitude: number;
}

export interface JmaForecastData {
	areaName: string;
	reportDatetime: string;
	todayWeather: string;
	todayPops: string[]; // 降水確率推移
	todayMaxTemp?: number;
	todayMinTemp?: number;
	overviewText: string; // 概況テキスト
	headlineText: string; // 見出し警報等
	typhoonMentioned: boolean; // 台風情報が含まれるか
	alertNotices: string[]; // 大雨・強風・雷・高温等の特記事項
}

export interface HourlyForecastItem {
	time: string; // "2026-10-04T12:00"
	temp: number;
	apparentTemp: number;
	pop: number; // 降水確率 (%)
	weatherCode: number;
}

export interface ModelForecast {
	modelName: string; // "jma" | "ecmwf"
	label: string; // "気象庁モデル (JMA)" | "欧州中期予報モデル (ECMWF)"
	todayWeatherCode: number;
	todayWeatherText: string;
	maxTemp: number;
	minTemp: number;
	popMax: number;
	prevMaxTemp: number;
	prevMinTemp: number;
	maxTempDiff: number; // 本日最高 - 前日最高
	minTempDiff: number; // 本日最低 - 前日最低
	hourly: HourlyForecastItem[];
}

export interface NotificationPayload {
	title: string;
	body: string;
	data?: Record<string, unknown>;
}

export interface AggregatedWeatherData {
	city: CityConfig;
	jma: JmaForecastData;
	openMeteoJma: ModelForecast;
	openMeteoEcmwf: ModelForecast;
	notification: NotificationPayload;
	clothingAdvice: string;
	generatedAt: string;
}

export interface PushTokenRecord {
	token: string;
	cityId: string;
	updatedAt: string;
}
