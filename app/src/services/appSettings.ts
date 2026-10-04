import { NativeModules, Platform } from "react-native";

interface AppSettingsNativeModule {
	getUiScale(): Promise<number>;
	setUiScale(scale: number): Promise<boolean>;
	reloadApp(): Promise<boolean>;
}

const appSettingsModule: AppSettingsNativeModule | null =
	NativeModules.AppSettingsModule ?? null;

export async function getUiScaleAsync(): Promise<number> {
	if (Platform.OS !== "android" || !appSettingsModule) {
		return 1.0;
	}
	try {
		return await appSettingsModule.getUiScale();
	} catch (error) {
		console.warn("Failed to get UI scale:", error);
		return 1.0;
	}
}

export async function setUiScaleAsync(scale: number): Promise<boolean> {
	if (Platform.OS !== "android" || !appSettingsModule) {
		return false;
	}
	try {
		return await appSettingsModule.setUiScale(scale);
	} catch (error) {
		console.warn("Failed to set UI scale:", error);
		return false;
	}
}

export async function reloadAppAsync(): Promise<boolean> {
	if (Platform.OS !== "android" || !appSettingsModule) {
		return false;
	}
	try {
		return await appSettingsModule.reloadApp();
	} catch (error) {
		console.warn("Failed to reload app:", error);
		return false;
	}
}
