import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { mdastText } from "./mdast";

/** 記事の最初の段落を抜粋にする(description が無い記事の一覧表示用) */
export const remarkExcerpt: RemarkPlugin = () => (tree, file) => {
	const first = tree.children.find((node) => node.type === "paragraph");
	(
		file.data.astro as { frontmatter: Record<string, unknown> }
	).frontmatter.excerpt = first ? mdastText(first) : "";
};
