import type { RehypePlugin } from "@astrojs/markdown-remark";
import type { Element, ElementContent } from "hast";
import { SKIP, visit } from "./visit";

const isElement = (node: ElementContent): node is Element =>
	node.type === "element";
const elements = (node: Element | undefined): Element[] =>
	node?.children.filter(isElement) ?? [];
const textOf = (node: ElementContent): string =>
	node.type === "text"
		? node.value
		: node.type === "element"
			? node.children.map(textOf).join("")
			: "";

/**
 * 左上の見出しが空の表(| | 旧 | 新 |)を、1 列目が行の見出しの表にする。
 *
 *   <thead><tr><td></td><th>旧</th>…</tr></thead>
 *   <tbody><tr><th scope="row">自動車税</th><td>51,750</td>…</tr></tbody>
 *
 * Markdown の表は見出しを 1 行目にしか書けないので、そのままだと 1 列目のセルに
 * 見出しが無く、読み上げで何の行か分からない(axe の td-has-header)。空の見出しは
 * 見出しの無い列を作るだけなので、ただのセルにする
 */
export const rehypeTableRowHeaders: RehypePlugin = () => (tree) => {
	visit(tree, "element", (table) => {
		if (table.tagName !== "table") return;
		const sections = elements(table);
		const thead = sections.find((s) => s.tagName === "thead");
		const corner = elements(elements(thead)[0])[0];
		if (corner?.tagName !== "th" || textOf(corner).trim() !== "") return SKIP;
		corner.tagName = "td";
		for (const tbody of sections.filter((s) => s.tagName === "tbody")) {
			for (const row of elements(tbody)) {
				const first = elements(row)[0];
				if (first?.tagName !== "td") continue;
				first.tagName = "th";
				first.properties.scope = "row";
			}
		}
		return SKIP;
	});
};
