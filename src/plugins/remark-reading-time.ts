import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { mdastText } from "./mdast";

/** 1 分に読める語数(以前使っていた reading-time の既定値) */
const WORDS_PER_MINUTE = 200;

const inRanges = (c: string | undefined, ranges: [number, number][]) => {
	if (c === undefined) return false;
	const code = c.charCodeAt(0);
	return ranges.some(([lo, hi]) => lo <= code && code <= hi);
};
// ひらがな・CJK 統合漢字・ハングル(カタカナは入れない。reading-time と同じ)
const isCJK = (c: string | undefined) =>
	inRanges(c, [
		[0x3040, 0x309f],
		[0x4e00, 0x9fff],
		[0xac00, 0xd7a3],
	]);
const isBound = (c: string | undefined) =>
	c !== undefined && " \n\r\t".includes(c);
const isPunctuation = (c: string | undefined) =>
	inRanges(c, [
		[0x21, 0x2f],
		[0x3a, 0x40],
		[0x5b, 0x60],
		[0x7b, 0x7e],
		[0x3000, 0x303f],
		[0xff00, 0xffef],
	]);

/**
 * 語数を数える。以前使っていた reading-time 1.5 と同じ数え方で、
 * CJK の文字は 1 文字を 1 語、それ以外は空白で区切ったものを 1 語とする。
 * CJK の文字の直後の記号と空白は数えない
 */
export function countWords(text: string): number {
	let words = 0;
	let start = 0;
	let end = text.length - 1;
	while (isBound(text[start])) start++;
	while (isBound(text[end])) end--;
	const s = `${text}\n`;
	for (let i = start; i <= end; i++) {
		if (
			isCJK(s[i]) ||
			(!isBound(s[i]) && (isBound(s[i + 1]) || isCJK(s[i + 1])))
		)
			words++;
		if (isCJK(s[i]))
			while (i <= end && (isPunctuation(s[i + 1]) || isBound(s[i + 1]))) i++;
	}
	return words;
}

/** 文字数(CJK は 1 文字 1 語)と読了時間を記事のフロントマターに足す */
export const remarkReadingTime: RemarkPlugin = () => (tree, file) => {
	const words = countWords(mdastText(tree));
	const frontmatter = (
		file.data.astro as { frontmatter: Record<string, unknown> }
	).frontmatter;
	frontmatter.minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
	frontmatter.words = words;
};
