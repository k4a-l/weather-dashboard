export interface CityConfig {
	id: string;
	name: string;
	prefecture?: string;
	region?: string;
	jmaOfficeCode: string;
	jmaAreaCode: string;
	latitude: number;
	longitude: number;
}

export interface DailyForecastItem {
	date: string; // "2026-10-04"
	weatherCode?: number;
	weatherText: string;
	maxTemp?: number;
	minTemp?: number;
	pop?: number;
	precipitation?: number; // 降水量(mm)
}

export interface JmaForecastData {
	areaName: string;
	reportDatetime: string;
	todayWeather: string;
	todayPops: string[];
	todayMaxTemp?: number;
	todayMinTemp?: number;
	tomorrowWeather?: string;
	tomorrowPops?: string[];
	tomorrowMaxTemp?: number;
	tomorrowMinTemp?: number;
	overviewText: string;
	headlineText: string;
	typhoonMentioned: boolean;
	alertNotices: string[];
	weeklyDaily: DailyForecastItem[]; // 気象庁公式の週間予報
}

export interface HourlyForecastItem {
	time: string;
	temp: number;
	apparentTemp: number;
	pop: number;
	precipitation: number; // 1時間あたりの降水量(mm)
	humidity: number; // 湿度(%)
	windSpeed: number; // 風速(m/s)
	windDirection?: number; // 風向(度)
	weatherCode: number;
}

export interface ModelForecast {
	modelName: string;
	label: string;
	todayWeatherCode: number;
	todayWeatherText: string;
	maxTemp: number;
	minTemp: number;
	todayApparentMaxTemp?: number;
	todayApparentMinTemp?: number;
	popMax: number;
	precipitationSum?: number; // 本日の降水量合計(mm)
	prevMaxTemp: number;
	prevMinTemp: number;
	maxTempDiff: number;
	minTempDiff: number;
	tomorrowWeatherCode: number;
	tomorrowWeatherText: string;
	tomorrowMaxTemp: number;
	tomorrowMinTemp: number;
	tomorrowApparentMaxTemp?: number;
	tomorrowApparentMinTemp?: number;
	tomorrowPopMax: number;
	tomorrowPrecipitationSum?: number; // 明日の降水量合計(mm)
	tomorrowMaxTempDiff: number; // 明日最高 - 本日最高
	tomorrowMinTempDiff: number; // 明日最低 - 本日最低
	hourly: HourlyForecastItem[];
	daily: DailyForecastItem[]; // 14日先までのデイリー予報
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
	tomorrowNotification: NotificationPayload;
	clothingAdvice: string;
	tomorrowClothingAdvice: string;
	generatedAt: string;
}
