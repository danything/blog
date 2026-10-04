import type { RehypePlugin } from "@astrojs/markdown-remark";
import type { Element } from "hast";
import { responsiveImage, SIZES } from "../utils/responsive-images";
import { visit } from "./visit";

/**
 * 本文の記事の画像(/static/images/blog/...)に、縮めた版の srcset・sizes と縦横を付ける
 * (utils/responsive-images.ts)。src は元の画像のままなので、拡大表示や RSS はそれを使う
 */
export const rehypeResponsiveImages: RehypePlugin = () => async (tree) => {
	const images: Element[] = [];
	visit(tree, "element", (node) => {
		if (node.tagName === "img" && typeof node.properties.src === "string")
			images.push(node);
		return undefined;
	});
	await Promise.all(
		images.map(async (img) => {
			const info = await responsiveImage(String(img.properties.src));
			if (!info) return;
			img.properties.width ??= info.width;
			img.properties.height ??= info.height;
			if (!info.srcset) return;
			img.properties.srcSet = info.srcset;
			img.properties.sizes = SIZES.content;
		}),
	);
};
