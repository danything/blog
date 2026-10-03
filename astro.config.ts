import fs from "node:fs";
import path from "node:path";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkSectionize from "remark-sectionize";
import { parsePost } from "./scripts/frontmatter";
import { expressiveCodeConfig } from "./src/config";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge";
import { remarkAlerts } from "./src/plugins/remark-alerts";
import { remarkExcerpt } from "./src/plugins/remark-excerpt";
import { remarkGithubCard } from "./src/plugins/remark-github-card";
import { remarkReadingTime } from "./src/plugins/remark-reading-time";

// サイトマップの lastmod 用に、記事ごとの最終更新日(updated があればそれ、無ければ published)を集める。
// 設定ファイルでは astro:content を使えないので、フロントマターを直接読む
const POSTS_DIR = "src/content/posts";
const postLastmod = new Map<string, string>();
for (const name of fs.readdirSync(POSTS_DIR)) {
	if (!name.endsWith(".md")) continue;
	const fm = parsePost(path.join(POSTS_DIR, name))?.fm;
	const date = fm?.updated || fm?.published;
	if (date) postLastmod.set(name.slice(0, -".md".length), date);
}

// https://astro.build/config
export default defineConfig({
	site: "https://doany.io/",
	base: "/",
	trailingSlash: "always",
	// Astro 7 の既定("jsx")は要素の前後の改行を空白ごと消し、「Powered by Astro」が
	// 「Powered byAstro」になる。Astro 5 までと同じ、表示を変えない圧縮にする
	compressHTML: true,
	// ページ遷移は Astro の ClientRouter(Layout.astro)。リンクにマウスを乗せた時点で先読みする
	prefetch: { prefetchAll: true },
	integrations: [
		expressiveCode({
			themes: [expressiveCodeConfig.theme, expressiveCodeConfig.theme],
			plugins: [
				pluginCollapsibleSections(),
				pluginLineNumbers(),
				pluginLanguageBadge(),
				pluginCustomCopyButton(),
			],
			defaultProps: {
				wrap: true,
				overridesByLang: {
					shellsession: {
						showLineNumbers: false,
					},
				},
			},
			styleOverrides: {
				codeBackground: "var(--codeblock-bg)",
				borderRadius: "0.75rem",
				borderColor: "none",
				codeFontSize: "0.875rem",
				codeFontFamily: "var(--font-mono)",
				codeLineHeight: "1.5rem",
				frames: {
					editorBackground: "var(--codeblock-bg)",
					terminalBackground: "var(--codeblock-bg)",
					terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
					editorTabBarBackground: "var(--codeblock-topbar-bg)",
					editorActiveTabBackground: "none",
					editorActiveTabIndicatorBottomColor: "var(--primary)",
					editorActiveTabIndicatorTopColor: "none",
					editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
					terminalTitlebarBorderBottomColor: "none",
				},
				textMarkers: {
					delHue: "0",
					insHue: "180",
					markHue: "250",
				},
			},
			frames: {
				showCopyToClipboardButton: false,
			},
		}),
		svelte(),
		sitemap({
			serialize(item) {
				const id = new URL(item.url).pathname.match(
					/^\/posts\/([^/]+)\/$/,
				)?.[1];
				const date = id && postLastmod.get(decodeURIComponent(id));
				// 日付として読めない値(簡易パーサなので行末コメントなど)なら付けない
				const time = date ? new Date(date) : undefined;
				if (time && !Number.isNaN(time.getTime()))
					item.lastmod = time.toISOString();
				return item;
			},
		}),
	],
	markdown: {
		// Astro 7 の既定は Sätteri。remark / rehype のプラグインを使うので unified を指定する
		processor: unified({
			remarkPlugins: [
				remarkReadingTime,
				remarkExcerpt,
				remarkAlerts,
				remarkGithubCard,
				remarkSectionize,
			],
			rehypePlugins: [
				rehypeSlug,
				[
					rehypeAutolinkHeadings,
					{
						behavior: "append",
						properties: {
							className: ["anchor"],
						},
						content: {
							type: "element",
							tagName: "span",
							properties: {
								className: ["anchor-icon"],
								"data-pagefind-ignore": true,
							},
							children: [
								{
									type: "text",
									value: "#",
								},
							],
						},
					},
				],
			],
		}),
	},
	vite: {
		plugins: [tailwindcss()],
		build: {
			rollupOptions: {
				onwarn(warning, warn) {
					// temporarily suppress this warning
					if (
						warning.message.includes("is dynamically imported by") &&
						warning.message.includes("but also statically imported by")
					) {
						return;
					}
					warn(warning);
				},
			},
		},
	},
});
