import { expect, test } from "@playwright/test";

const pages = [
	"/",
	"/2/",
	"/archive/",
	"/about/",
	"/404.html",
	"/posts/kadouhyou/",
	"/posts/rdsecsdump/",
	"/posts/svelte-bun-sqlite/",
	"/posts/truck/",
	"/posts/renewal/",
	"/posts/oss-transfer/",
];

test.beforeEach(async ({ context }, info) => {
	// テーマは localStorage で決まるので、プロジェクトに合わせて固定する
	const theme = info.project.name.includes("dark") ? "dark" : "light";
	await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
	// 外部(コメント欄・アクセス解析など)の揺れを避ける
	await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) =>
		r.abort(),
	);
});

for (const path of pages) {
	test(path, async ({ page }) => {
		await page.goto(path);
		// 遅延読み込みの画像は撮る時点で読み込まれているかで高さが揺れるので、全部読み込ませてから撮る
		await page.evaluate(async () => {
			const images = [...document.images];
			for (const img of images) img.loading = "eager";
			await Promise.all(images.map((img) => img.decode().catch(() => {})));
			await document.fonts.ready;
		});
		await page.waitForLoadState("networkidle");
		await expect(page).toHaveScreenshot(`${path.replace(/\W+/g, "_")}.png`, {
			fullPage: true,
		});
	});
}
