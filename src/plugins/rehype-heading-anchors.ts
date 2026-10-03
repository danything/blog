import type { RehypePlugin } from "@astrojs/markdown-remark";
import { h } from "./hast";
import { SKIP, visit } from "./visit";

const HEADING = /^h[1-6]$/;

/**
 * id の付いた見出しの末尾に、その見出しへのリンク(# の印)を足す。
 *
 *   <h2 id="x">見出し<a class="anchor" href="#x"><span class="anchor-icon" data-pagefind-ignore>#</span></a></h2>
 *
 * id は先に rehypeHeadingIds(astro.config.ts)が付ける。# は検索の索引に入れない
 */
export const rehypeHeadingAnchors: RehypePlugin = () => (tree) => {
	visit(tree, "element", (node) => {
		const id = node.properties.id;
		if (!HEADING.test(node.tagName) || !id) return;
		node.children.push(
			h("a", { className: ["anchor"], href: `#${id}` }, [
				h(
					"span",
					{ className: ["anchor-icon"], "data-pagefind-ignore": true },
					["#"],
				),
			]),
		);
		// 足したリンクの中は見ない
		return SKIP;
	});
};
