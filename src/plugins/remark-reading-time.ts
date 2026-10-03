import type { RemarkPlugin } from "@astrojs/markdown-remark";
// biome-ignore lint/suspicious/noShadowRestrictedNames: mdast-util-to-string の名前
import { toString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

/** 文字数(CJK は 1 文字 1 語)と読了時間を記事のフロントマターに足す */
export const remarkReadingTime: RemarkPlugin = () => (tree, file) => {
	const { minutes, words } = getReadingTime(toString(tree));
	const frontmatter = (
		file.data.astro as { frontmatter: Record<string, unknown> }
	).frontmatter;
	frontmatter.minutes = Math.max(1, Math.round(minutes));
	frontmatter.words = words;
};
