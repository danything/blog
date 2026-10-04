export const PAGE_SIZE = 8;

// テーマ色の色相 (0-360) の既定。Fuwari の既定は 250 だが、ダークモードの --primary
// (styles/variables.css の oklch(0.75 0.14 H)) は、H がおよそ 175-225 と 245-290 だと
// sRGB の色域からはみ出してクリップされる (既定の 250 もその一つ)。
// 色域に収まり、かつボタン文字のコントラストが最大に近い暖色域から選んだ。
// 訪問者が変えた色相は localStorage に残る (utils/setting-utils.ts)
export const DEFAULT_HUE = 40;

export const LIGHT_MODE = "light",
	DARK_MODE = "dark",
	AUTO_MODE = "auto";
export const DEFAULT_THEME = AUTO_MODE;
