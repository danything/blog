import { defineConfig, devices } from "@playwright/test";

// 見た目の比較テスト(.github/workflows/visual.yml)と、アクセシビリティの検査(a11y.yml)。
// 見た目の比較では、基準の画像はリポジトリに置かず、PR ごとに main のビルドで撮ってから PR のビルドと比べる:
//   BASE_URL=<main のビルド> bunx playwright test tests/visual.spec.ts --update-snapshots
//   BASE_URL=<PR のビルド>   bunx playwright test tests/visual.spec.ts
export default defineConfig({
	testDir: "tests",
	// test-results/ は実行のたびに消されるので、基準の画像は別の場所に置く
	snapshotPathTemplate: ".visual-snapshots/{projectName}/{arg}{ext}",
	fullyParallel: true,
	// まれな描画の揺れで落ちないよう、CI では 1 回だけやり直す(やり直して通ったものは flaky と表示される)
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL: process.env.BASE_URL ?? "http://127.0.0.1:4321",
		reducedMotion: "reduce",
	},
	expect: {
		// 縦に長いページは撮影と安定待ちに時間がかかる
		timeout: 20_000,
		// フォントのアンチエイリアス程度の揺れは許す
		// threshold はピクセルごとの色の許容差。既定の 0.2 や 0.05 だと、テーマ色の色相を 5 変えた
		// 程度(RGB で最大 9/255)は通ってしまう。同じビルドなら描画は完全に一致するので小さくする
		toHaveScreenshot: {
			threshold: 0.01,
			maxDiffPixelRatio: 0.001,
			animations: "disabled",
		},
	},
	projects: [
		{
			name: "desktop-light",
			use: { viewport: { width: 1280, height: 900 }, colorScheme: "light" },
		},
		{
			name: "desktop-dark",
			use: { viewport: { width: 1280, height: 900 }, colorScheme: "dark" },
		},
		// isMobile だとページ全体を撮るときにレイアウトが揺れる(高さが毎回数 px 変わる)ので、
		// 画面の大きさだけスマホに合わせる
		{ name: "mobile", use: { ...devices["Pixel 7"], isMobile: false } },
	],
});
