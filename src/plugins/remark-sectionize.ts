import type { RemarkPlugin } from "@astrojs/markdown-remark";
import type { RootContent } from "mdast";
import { visit } from "unist-util-visit";

/**
 * 見出しごとに、その見出しから次の同じか浅い見出しの手前までを <section> で囲む。
 * 深い見出しから順に囲むので、h3 の section は h2 の section の中に入る。
 * TOC.astro はこの section を見て、いま読んでいる見出しを判断する
 */
export const remarkSectionize: RemarkPlugin = () => (tree) => {
	for (let depth = 6; depth > 0; depth--) {
		visit(tree, "heading", (node, index, parent) => {
			if (node.depth !== depth || !parent || index === undefined) return;
			const siblings = parent.children as RootContent[];
			const end = siblings.findIndex(
				(n, i) => i > index && n.type === "heading" && n.depth <= depth,
			);
			const children = siblings.slice(index, end === -1 ? undefined : end);
			// mdast に section は無いので、HTML にするときの要素名だけを指定する
			const section = {
				type: "section",
				children,
				data: { hName: "section" },
			} as unknown as RootContent;
			siblings.splice(index, children.length, section);
		});
	}
};
