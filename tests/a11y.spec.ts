import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { a11yPages, setupContext } from "./setup";

// アクセシビリティの検査(.github/workflows/a11y.yml)。axe で WCAG 2.1 A/AA の規則を調べ、
// 影響が serious・critical の違反があると失敗する。ライト・ダーク・スマホの各プロジェクトで走る:
//   BASE_URL=<ビルドを配信している URL> bunx playwright test tests/a11y.spec.ts

test.beforeEach(({ context }, info) => setupContext(context, info));

for (const path of a11yPages) {
	test(path, async ({ page }) => {
		// 読み込み時のフェードの途中だと文字が薄く測られるので、動きを止めて終わるのを待つ
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto(path);
		await page.waitForLoadState("networkidle");
		await page.evaluate(() =>
			Promise.all(document.getAnimations().map((a) => a.finished)),
		);
		const { violations } = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const failures = violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		// 失敗したときに、どの規則がどの要素で引っかかったかを読める形で出す
		const summary = failures
			.map((v) => {
				const nodes = v.nodes
					.map(
						(n) =>
							`    - ${n.target.join(" ")}\n      ${n.failureSummary?.replaceAll("\n", "\n      ")}`,
					)
					.join("\n");
				return `[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n${nodes}`;
			})
			.join("\n\n");
		// 差分には規則の名前だけを出す(違反の中身をそのまま比べると出力が長すぎて読めない)
		expect(
			failures.map((v) => v.id),
			`アクセシビリティの違反:\n\n${summary}`,
		).toEqual([]);
	});
}
