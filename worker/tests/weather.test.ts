import { getWeatherTextFromCode } from "../src/services/openMeteo";
import { getClothingAdvice } from "../src/services/clothing";
import { DEFAULT_CITIES } from "../src/constants/cities";
import { aggregateWeather } from "../src/services/weatherAggregator";

describe("Weather Service Logic Tests", () => {
	test("getWeatherTextFromCode returns appropriate Japanese description", () => {
		expect(getWeatherTextFromCode(0)).toBe("快晴");
		expect(getWeatherTextFromCode(3)).toBe("くもり");
		expect(getWeatherTextFromCode(63)).toBe("雨");
		expect(getWeatherTextFromCode(73)).toBe("雪");
		expect(getWeatherTextFromCode(95)).toBe("雷雨");
	});

	test("getClothingAdvice provides accurate advice with temperature diff", () => {
		// 22℃、前日差 -4℃（急冷）
		const advice1 = getClothingAdvice(22, 16, -4);
		expect(advice1).toContain("長袖シャツやカットソーが快適");
		expect(advice1).toContain("前日より寒いため暖かめの服装を");

		// 14℃、前日差 +5℃（暖かめ）
		const advice2 = getClothingAdvice(14, 8, 5);
		expect(advice2).toContain("セーターやジャケット");
		expect(advice2).toContain("前日より暖かいため脱ぎ着しやすい服を");

		// 29℃、前日差 0℃
		const advice3 = getClothingAdvice(29, 23, 0);
		expect(advice3).toContain("半袖1枚で快適");
	});

	test("aggregateWeather fetches real live data and generates notification payload", async () => {
		const tokyo = DEFAULT_CITIES[0];
		const data = await aggregateWeather(tokyo);

		expect(data).toBeDefined();
		expect(data.city.id).toBe("tokyo");
		expect(data.jma.todayWeather).toBeTruthy();
		expect(data.openMeteoJma.maxTemp).toBeDefined();
		expect(data.openMeteoJma.minTemp).toBeDefined();
		expect(data.openMeteoJma.maxTempDiff).toBeDefined();
		expect(data.openMeteoEcmwf.todayWeatherText).toBeTruthy();

		// 通知タイトルと本文の検証
		expect(data.notification.title).toContain("【東京】");
		expect(data.notification.body).toContain("最高");
		expect(data.notification.body).toContain("[比較]");
	}, 15000); // 外部API呼び出しのためタイムアウト15秒
});
