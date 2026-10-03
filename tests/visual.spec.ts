import { expect, test } from "@playwright/test";
import { pages, setupContext } from "./setup";

test.beforeEach(({ context }, info) => setupContext(context, info));

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
		// フォントの代替などで読み込み直後に高さが数 px 動くことがあるので、落ち着くまで待つ
		await page.waitForFunction(
			() =>
				new Promise<boolean>((resolve) => {
					const h = document.documentElement.scrollHeight;
					setTimeout(
						() => resolve(document.documentElement.scrollHeight === h),
						300,
					);
				}),
		);
		await expect(page).toHaveScreenshot(`${path.replace(/\W+/g, "_")}.png`, {
			fullPage: true,
		});
	});
}
