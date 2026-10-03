import {
	definePlugin,
	type PostprocessRenderedBlockContext,
} from "astro-expressive-code";
import { getIcon } from "../../utils/icons";
import { h } from "../hast";

type Element = PostprocessRenderedBlockContext["renderData"]["blockAst"];
type ElementContent = Element["children"][number];

// Iconify の SVG の中身("<path d=... />" や "<g ...>...</g>" だけでできている)を hast にする
function parseSvgBody(body: string): ElementContent[] {
	const root: ElementContent[] = [];
	const stack: Element[] = [];
	const add = (node: Element) => (stack.at(-1)?.children ?? root).push(node);
	for (const [, close, tag, attrs, selfClose] of body.matchAll(
		/<(\/?)([a-z]+)([^>]*?)(\/?)>/g,
	)) {
		if (close) {
			stack.pop();
			continue;
		}
		const props: Record<string, string> = {};
		for (const [, k, v] of attrs.matchAll(/([a-z-]+)="([^"]*)"/g)) props[k] = v;
		const node = h(tag, props);
		add(node);
		if (!selfClose) stack.push(node);
	}
	return root;
}

// アイコンは src/utils/icons.ts(@iconify-json/*)から取る
const icon = (kind: string, name: string) => {
	const data = getIcon(name);
	return h(
		"svg",
		{
			viewBox: data.viewBox,
			xmlns: "http://www.w3.org/2000/svg",
			className: ["copy-btn-icon", kind],
		},
		parseSvgBody(data.body),
	);
};

// コードブロックの右上に出すコピーボタン(押したときの処理は Markdown.astro のスクリプト)
const copyButton = () =>
	h("button", { className: ["copy-btn"], "aria-label": "Copy code" }, [
		h("div", { className: ["copy-btn-icon"] }, [
			icon("copy-icon", "lucide:copy"),
			icon("success-icon", "lucide:check"),
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
