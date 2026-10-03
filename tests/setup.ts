import type { BrowserContext, TestInfo } from "@playwright/test";

// 見た目の比較(visual.spec.ts)で見るページ。VISUAL_FIXTURES=1 でビルドした、固定の記事
// (tests/fixtures/)だけのサイトを撮る。記事の追加・編集では差が出ず、デザインやコードの
// 変更だけが差として出る
export const visualPages: string[] = [
	"/",
	"/2/",
	"/archive/",
	"/about/",
	"/404.html",
	"/posts/markdown/",
	"/posts/code/",
	"/posts/alerts/",
	"/posts/github-card/",
	"/posts/cover/",
	"/posts/long/",
];

// アクセシビリティの検査(a11y.spec.ts)で見るページ。実際の記事でビルドしたサイトを調べる
// (記事の中身によるコントラスト不足なども見つけたいので、固定の記事ではなく本物を使う)
export const a11yPages: string[] = [
	"/",
	"/2/",
	"/archive/",
	"/about/",
	"/404.html",
	"/posts/slack-search-read/",
	"/posts/rdsecsdump/",
	"/posts/svelte-bun-sqlite/",
	"/posts/truck/",
	"/posts/renewal/",
	"/posts/oss-transfer/",
];

export async function setupContext(
	context: BrowserContext,
	info: TestInfo,
): Promise<void> {
	// テーマは localStorage で決まるので、プロジェクトに合わせて固定する
	const theme = info.project.name.includes("dark") ? "dark" : "light";
	await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
	// 外部(コメント欄・アクセス解析など)の揺れを避ける
	await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) =>
		r.abort(),
	);
}
