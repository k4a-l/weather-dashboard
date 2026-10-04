export interface CityConfig {
	id: string;
	name: string;
	jmaOfficeCode: string;
	jmaAreaCode: string;
	latitude: number;
	longitude: number;
}

export interface JmaForecastData {
	areaName: string;
	reportDatetime: string;
	todayWeather: string;
	todayPops: string[];
	todayMaxTemp?: number;
	todayMinTemp?: number;
	overviewText: string;
	headlineText: string;
	typhoonMentioned: boolean;
	alertNotices: string[];
}

export interface HourlyForecastItem {
	time: string;
	temp: number;
	apparentTemp: number;
	pop: number;
	weatherCode: number;
}

export interface ModelForecast {
	modelName: string;
	label: string;
	todayWeatherCode: number;
	todayWeatherText: string;
	maxTemp: number;
	minTemp: number;
	popMax: number;
	prevMaxTemp: number;
	prevMinTemp: number;
	maxTempDiff: number;
	minTempDiff: number;
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
