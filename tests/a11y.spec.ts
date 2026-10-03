import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { pages, setupContext } from "./setup";

// アクセシビリティの検査(.github/workflows/a11y.yml)。axe で WCAG 2.1 A/AA の規則を調べ、
// 影響が serious・critical の違反があると失敗する。ライト・ダーク・スマホの各プロジェクトで走る:
//   BASE_URL=<ビルドを配信している URL> bunx playwright test tests/a11y.spec.ts

// 失敗にはしない規則。見つかった数は注記としてレポートに残す
const reportOnly = new Set([
	// 文字のコントラスト。テーマ色(リンクや見出しの --primary)、日付などの薄い文字(text-50・text-30)、
	// インラインコードの色がどれも 4.5:1 に届かない。直すとサイト全体の配色が変わるので、
	// デザインを見直すまでは失敗にしない
	"color-contrast",
]);

test.beforeEach(({ context }, info) => setupContext(context, info));

for (const path of pages) {
	test(path, async ({ page }, info) => {
		await page.goto(path);
		await page.waitForLoadState("networkidle");
		const { violations } = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const serious = violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		for (const v of serious.filter((v) => reportOnly.has(v.id))) {
			info.annotations.push({
				type: "a11y",
				description: `${v.id}: ${v.nodes.length} 件`,
			});
		}
		const failures = serious.filter((v) => !reportOnly.has(v.id));
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
