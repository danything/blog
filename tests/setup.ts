import type { BrowserContext, TestInfo } from "@playwright/test";

// 見た目の比較(visual.spec.ts)とアクセシビリティの検査(a11y.spec.ts)で見るページ
export const pages = [
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
