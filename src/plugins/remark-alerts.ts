import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { visit } from "./visit";

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/;

/**
 * GitHub と同じ書き方の注意書きブロック。
 *
 *   > [!NOTE]
 *   > 本文
 *
 * 引用の先頭行が [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION] のときだけ
 * blockquote.admonition にする。それ以外の引用には触らない。
 * scripts/zenn-sync.ts も同じ書き方を Zenn の :::message に変換する(あちらに合わせて大文字のみ)。
 */
export const remarkAlerts: RemarkPlugin = () => (tree) => {
	visit(tree, "blockquote", (node) => {
		const paragraph = node.children[0];
		if (paragraph?.type !== "paragraph") return;
		const text = paragraph.children[0];
		if (text?.type !== "text") return;
		const match = MARKER.exec(text.value);
		if (!match) return;

		const type = match[1].toLowerCase();
		text.value = text.value.slice(match[0].length);
		if (text.value === "") paragraph.children.shift();
		if (paragraph.children.length === 0) node.children.shift();

		node.data = {
			...node.data,
			hProperties: { className: ["admonition", `bdm-${type}`] },
		};
		node.children.unshift({
			type: "paragraph",
			data: { hName: "span", hProperties: { className: ["bdm-title"] } },
			children: [{ type: "text", value: type.toUpperCase() }],
		});
	});
};
