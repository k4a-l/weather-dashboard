export function getClothingAdvice(
	maxTemp: number,
	minTemp: number,
	maxTempDiff: number,
): string {
	let baseAdvice = "";

	if (maxTemp >= 28) {
		baseAdvice = "👕半袖1枚で快適。日傘や熱中症対策を";
	} else if (maxTemp >= 24) {
		baseAdvice = "👕半袖または薄手の長袖がおすすめ";
	} else if (maxTemp >= 20) {
		baseAdvice = "👔長袖シャツやカットソーが快適";
	} else if (maxTemp >= 16) {
		baseAdvice = "🧥カーディガンや薄手の上着があると安心";
	} else if (maxTemp >= 12) {
		baseAdvice = "🧥セーターやジャケット、薄手コートが活躍";
	} else if (maxTemp >= 8) {
		baseAdvice = "🧣冬物コートやマフラーで防寒を";
	} else {
		baseAdvice = "🧤ダウンや手袋で万全の防寒対策を";
	}

	const tempSpan = maxTemp - minTemp;
	let extraAdvice = "";

	if (maxTempDiff <= -3) {
		extraAdvice = "（前日より寒いため暖かめの服装を）";
	} else if (maxTempDiff >= 3) {
		extraAdvice = "（前日より暖かいため脱ぎ着しやすい服を）";
	} else if (tempSpan >= 10) {
		extraAdvice = "（朝晩と昼の寒暖差に注意）";
	}

	return `${baseAdvice} ${extraAdvice}`.trim();
}
