import { DEFAULT_CITIES, getCityConfig } from "./constants/cities";
import { aggregateWeather } from "./services/weatherAggregator";
import { sendExpoPushNotifications } from "./services/expoPush";
import { PushTokenRecord } from "./types";

export interface Env {
	PUSH_TOKENS?: KVNamespace;
}

// KV未設定時（ローカル簡易テスト等）のフォールバック用
const memoryTokens: Map<string, PushTokenRecord> = new Map();

export default {
	async fetch(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);
		const headers = {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { headers });
		}

		try {
			// GET /forecast?city=tokyo
			if (url.pathname === "/forecast" && request.method === "GET") {
				const cityId = url.searchParams.get("city") || "tokyo";
				const city = getCityConfig(cityId);
				const aggregated = await aggregateWeather(city);
				return new Response(JSON.stringify(aggregated, null, 2), {
					headers,
				});
			}

			// POST /register-token
			// Body: { "token": "ExponentPushToken[...]", "cityId": "tokyo" }
			if (
				url.pathname === "/register-token" &&
				request.method === "POST"
			) {
				const body: any = await request.json();
				const token = body.token;
				const cityId = body.cityId || "tokyo";

				if (!token || typeof token !== "string") {
					return new Response(
						JSON.stringify({ error: "Invalid or missing 'token'" }),
						{ status: 400, headers },
					);
				}

				const record: PushTokenRecord = {
					token,
					cityId,
					updatedAt: new Date().toISOString(),
				};

				if (env.PUSH_TOKENS) {
					await env.PUSH_TOKENS.put(
						`token:${token}`,
						JSON.stringify(record),
					);
				} else {
					memoryTokens.set(token, record);
				}

				return new Response(
					JSON.stringify({
						success: true,
						message: "Token registered successfully",
						record,
					}),
					{ headers },
				);
			}

			// POST /send-test
			// Body: { "token"?: "...", "cityId"?: "tokyo" }
			if (url.pathname === "/send-test" && request.method === "POST") {
				const body: any = await request.json().catch(() => ({}));
				const cityId = body.cityId || "tokyo";
				const city = getCityConfig(cityId);
				const aggregated = await aggregateWeather(city);

				let targetTokens: string[] = [];
				if (body.token) {
					targetTokens = [body.token];
				} else if (env.PUSH_TOKENS) {
					const list = await env.PUSH_TOKENS.list({
						prefix: "token:",
					});
					for (const key of list.keys) {
						const val = await env.PUSH_TOKENS.get(key.name);
						if (val) {
							const rec: PushTokenRecord = JSON.parse(val);
							targetTokens.push(rec.token);
						}
					}
				} else {
					targetTokens = Array.from(memoryTokens.keys());
				}

				if (targetTokens.length === 0) {
					return new Response(
						JSON.stringify({
							success: false,
							message:
								"No push tokens found to send to. Please specify 'token' in request body or register first.",
							previewNotification: aggregated.notification,
						}),
						{ headers },
					);
				}

				const pushResult = await sendExpoPushNotifications(
					targetTokens,
					aggregated.notification,
				);

				return new Response(
					JSON.stringify(
						{
							success: true,
							sentCount: pushResult.count,
							notification: aggregated.notification,
							pushResult,
						},
						null,
						2,
					),
					{ headers },
				);
			}

			// GET / (デフォルトプレビュー & ヘルスチェック)
			const defaultCity = DEFAULT_CITIES[0];
			const sampleWeather = await aggregateWeather(defaultCity);

			return new Response(
				JSON.stringify(
					{
						status: "ok",
						service: "Weather Notification Worker",
						endpoints: {
							"GET /forecast?city=tokyo":
								"Get aggregated weather data",
							"POST /register-token":
								"Register Expo push token ({ token, cityId })",
							"POST /send-test":
								"Trigger immediate push notification ({ token, cityId })",
						},
						samplePreview: {
							city: defaultCity.name,
							notification: sampleWeather.notification,
						},
					},
					null,
					2,
				),
				{ headers },
			);
		} catch (error: any) {
			return new Response(
				JSON.stringify({
					error: error.message || "Internal server error",
				}),
				{ status: 500, headers },
			);
		}
	},

	// 毎朝7:00 (JST) のCronトリガーハンドラ
	async scheduled(
		event: ScheduledEvent,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		ctx.waitUntil(
			(async () => {
				const tokensByCity: Map<string, string[]> = new Map();

				if (env.PUSH_TOKENS) {
					const list = await env.PUSH_TOKENS.list({
						prefix: "token:",
					});
					for (const key of list.keys) {
						const val = await env.PUSH_TOKENS.get(key.name);
						if (val) {
							const rec: PushTokenRecord = JSON.parse(val);
							const list = tokensByCity.get(rec.cityId) || [];
							list.push(rec.token);
							tokensByCity.set(rec.cityId, list);
						}
					}
				}

				// 都市ごとに配信
				for (const [cityId, tokens] of tokensByCity.entries()) {
					if (tokens.length === 0) continue;
					const city = getCityConfig(cityId);
					const aggregated = await aggregateWeather(city);
					await sendExpoPushNotifications(
						tokens,
						aggregated.notification,
					);
				}
			})(),
		);
	},
};
