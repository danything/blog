import {
	definePlugin,
	type PostprocessRenderedBlockContext,
} from "astro-expressive-code";
import { h } from "../hast";

type Element = PostprocessRenderedBlockContext["renderData"]["blockAst"];

const icon = (kind: string, d: string) =>
	h(
		"svg",
		{
			viewBox: "0 -960 960 960",
			xmlns: "http://www.w3.org/2000/svg",
			className: ["copy-btn-icon", kind],
		},
		[h("path", { d })],
	);

// コードブロックの右上に出すコピーボタン(押したときの処理は Markdown.astro のスクリプト)
const copyButton = () =>
	h("button", { className: ["copy-btn"], "aria-label": "Copy code" }, [
		h("div", { className: ["copy-btn-icon"] }, [
			icon(
				"copy-icon",
				"M368.37-237.37q-34.48 0-58.74-24.26-24.26-24.26-24.26-58.74v-474.26q0-34.48 24.26-58.74 24.26-24.26 58.74-24.26h378.26q34.48 0 58.74 24.26 24.26 24.26 24.26 58.74v474.26q0 34.48-24.26 58.74-24.26 24.26-58.74 24.26H368.37Zm0-83h378.26v-474.26H368.37v474.26Zm-155 238q-34.48 0-58.74-24.26-24.26-24.26-24.26-58.74v-515.76q0-17.45 11.96-29.48 11.97-12.02 29.33-12.02t29.54 12.02q12.17 12.03 12.17 29.48v515.76h419.76q17.45 0 29.48 11.96 12.02 11.97 12.02 29.33t-12.02 29.54q-12.03 12.17-29.48 12.17H213.37Zm155-238v-474.26 474.26Z",
			),
			icon(
				"success-icon",
				"m389-377.13 294.7-294.7q12.58-12.67 29.52-12.67 16.93 0 29.61 12.67 12.67 12.68 12.67 29.53 0 16.86-12.28 29.14L419.07-288.41q-12.59 12.67-29.52 12.67-16.94 0-29.62-12.67L217.41-430.93q-12.67-12.68-12.79-29.45-.12-16.77 12.55-29.45 12.68-12.67 29.62-12.67 16.93 0 29.28 12.67L389-377.13Z",
			),
		]),
	]);

export function pluginCustomCopyButton() {
	return definePlugin({
		name: "Custom Copy Button",
		hooks: {
			postprocessRenderedBlock: (context) => {
				const addToPre = (node: Element) => {
					if (node.tagName === "pre") {
						node.children.push(copyButton());
						return;
					}
					for (const child of node.children) {
						if (child.type === "element") addToPre(child);
					}
				};
				addToPre(context.renderData.blockAst);
			},
		},
	});
}
