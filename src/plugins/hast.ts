import type { Element, ElementContent, Properties } from "hast";

/** hast の要素を作る(hastscript の代わりの最小限) */
export const h = (
	tagName: string,
	properties: Properties = {},
	children: (ElementContent | string)[] = [],
): Element => ({
	type: "element",
	tagName,
	properties,
	children: children.map((c) =>
		typeof c === "string" ? { type: "text", value: c } : c,
	),
});
