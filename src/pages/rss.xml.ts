import rss from "@astrojs/rss";
import { getSortedPosts } from "@utils/content-utils";
import { url } from "@utils/url-utils";
import type { APIContext } from "astro";
import { siteConfig } from "@/config";

// 記事ページと同じ描画結果を使う。コードブロックや GitHub カードの script / style は
// フィードには不要なので外す(自前のビルドが出した HTML なので正規表現で十分)。
// 画像やリンクの "/..." はリーダーによって解決されないので絶対 URL にする
function toFeedHtml(html: string, site: URL): string {
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<link\b[^>]*>/gi, "")
		.replace(
			/\b(src|href)="(\/[^/"][^"]*)"/g,
			(_, attr, path) => `${attr}="${new URL(path, site).href}"`,
		);
}

function stripInvalidXmlChars(str: string): string {
	return str.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: https://www.w3.org/TR/xml/#charsets
		/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
		"",
	);
}

export async function GET(context: APIContext) {
	const blog = await getSortedPosts();
	const site = context.site ?? new URL("https://doany.io/");

	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle || "No description",
		site,
		items: blog.map((post) => {
			const content = stripInvalidXmlChars(
				toFeedHtml(post.rendered?.html ?? "", site),
			);
			return {
				title: post.data.title,
				pubDate: post.data.published,
				description: post.data.description || "",
				link: url(`/posts/${post.id}/`),
				content,
			};
		}),
		customData: `<language>${siteConfig.lang}</language>`,
	});
}
