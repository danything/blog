interface TextNode {
	type: string;
	value?: string;
	alt?: string | null;
	children?: TextNode[];
}

/**
 * mdast の節のテキストをつなげる(mdast-util-to-string の代わりの最小限で、結果は同じ)。
 * 値を持つ節(テキスト・コード・HTML など)はその値、画像は alt、それ以外は子をつなげたもの
 */
export const mdastText = (node: TextNode): string =>
	"value" in node
		? (node.value ?? "")
		: node.alt || (node.children?.map(mdastText).join("") ?? "");
