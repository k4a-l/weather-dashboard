import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UiScaleContextType {
	uiScale: number;
	setUiScale: (scale: number) => Promise<void>;
	changeUiScale: (delta: number) => Promise<void>;
	resetUiScale: () => Promise<void>;
}

const STORAGE_KEY = "@app_ui_scale";

const UiScaleContext = createContext<UiScaleContextType>({
	uiScale: 1.0,
	setUiScale: async () => {},
	changeUiScale: async () => {},
	resetUiScale: async () => {},
});

export const UiScaleProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [uiScale, setScaleState] = useState<number>(1.0);

	useEffect(() => {
		(async () => {
			try {
				const saved = await AsyncStorage.getItem(STORAGE_KEY);
				if (saved) {
					const val = parseFloat(saved);
					if (!isNaN(val) && val >= 0.85 && val <= 1.4) {
						setScaleState(val);
					}
				}
			} catch (e) {
				console.warn("Failed to load ui_scale:", e);
			}
		})();
	}, []);

	const setUiScale = async (newScale: number) => {
		const clamped = Math.min(
			1.4,
			Math.max(0.85, Math.round(newScale * 20) / 20),
		);
		setScaleState(clamped);
		try {
			await AsyncStorage.setItem(STORAGE_KEY, clamped.toString());
		} catch (e) {
			console.warn("Failed to save ui_scale:", e);
		}
	};

	const changeUiScale = async (delta: number) => {
		const newScale = uiScale + delta;
		await setUiScale(newScale);
	};

	const resetUiScale = async () => {
		await setUiScale(1.0);
	};

	return (
		<UiScaleContext.Provider
			value={{
				uiScale,
				setUiScale,
				changeUiScale,
				resetUiScale,
			}}
		>
			{children}
		</UiScaleContext.Provider>
	);
};

export const useUiScale = () => useContext(UiScaleContext);
