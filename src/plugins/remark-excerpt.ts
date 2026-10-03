import type { RemarkPlugin } from "@astrojs/markdown-remark";
// biome-ignore lint/suspicious/noShadowRestrictedNames: mdast-util-to-string の名前
import { toString } from "mdast-util-to-string";

/** 記事の最初の段落を抜粋にする(description が無い記事の一覧表示用) */
export const remarkExcerpt: RemarkPlugin = () => (tree, file) => {
	const first = tree.children.find((node) => node.type === "paragraph");
	(
		file.data.astro as { frontmatter: Record<string, unknown> }
	).frontmatter.excerpt = first ? toString(first) : "";
};
