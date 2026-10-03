import fs from "node:fs";
import path from "node:path";
import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import { parsePost } from "./scripts/frontmatter";
import { expressiveCodeConfig } from "./src/config";
import { CONTENT_DIR } from "./src/constants/content-dir";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge";
import { rehypeHeadingAnchors } from "./src/plugins/rehype-heading-anchors";
import { remarkAlerts } from "./src/plugins/remark-alerts";
import { remarkExcerpt } from "./src/plugins/remark-excerpt";
import { remarkGithubCard } from "./src/plugins/remark-github-card";
import { remarkReadingTime } from "./src/plugins/remark-reading-time";
import { remarkSectionize } from "./src/plugins/remark-sectionize";

// サイトマップの lastmod 用に、記事ごとの最終更新日(updated があればそれ、無ければ published)を集める。
// 設定ファイルでは astro:content を使えないので、フロントマターを直接読む
const POSTS_DIR = `${CONTENT_DIR}/posts`;
const postLastmod = new Map<string, string>();
for (const name of fs.readdirSync(POSTS_DIR)) {
	if (!name.endsWith(".md")) continue;
	const fm = parsePost(path.join(POSTS_DIR, name))?.fm;
	if (fm?.draft === "true") continue;
	const date = fm?.updated || fm?.published;
	if (date) postLastmod.set(name.slice(0, -".md".length), date);
}
// 記事の一覧(トップ・ページ送り・アーカイブ)は、いちばん新しい記事の日付を lastmod にする
const listLastmod = [...postLastmod.values()]
	.map((d) => new Date(d))
	.filter((d) => !Number.isNaN(d.getTime()))
	.sort((x, y) => y.getTime() - x.getTime())[0];

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
		sitemap({
			// 日本語版と英語版の両方があるページ(/en/ を除いて同じパス)に hreflang の対応を付ける
			i18n: { defaultLocale: "ja", locales: { ja: "ja", en: "en" } },
			// 英語版の 404 は普通のページとして作られるので外す
			filter: (page) => !/\/404\/?$/.test(new URL(page).pathname),
			serialize(item) {
				const pathname = new URL(item.url).pathname;
				// 英語版(/en/posts/...)も日付は原文と同じ
				const id = pathname.match(/^\/(?:en\/)?posts\/([^/]+)\/$/)?.[1];
				const date = id && postLastmod.get(decodeURIComponent(id));
				// 日付として読めない値(簡易パーサなので行末コメントなど)なら付けない
				const time = date ? new Date(date) : undefined;
				if (time && !Number.isNaN(time.getTime()))
					item.lastmod = time.toISOString();
				else if (
					listLastmod &&
					/^\/(?:en\/)?(?:\d+\/|archive\/)?$/.test(pathname)
				)
					item.lastmod = listLastmod.toISOString();
				// ページの <head> と同じく、既定(x-default)は日本語版にする。
				// links の配列は日本語版と英語版の項目で共有されているので、書き換えずに作り直す
				const links = item.links?.filter((l) => l.lang !== "x-default");
				const ja = links?.find((l) => l.lang === "ja");
				if (links && ja)
					item.links = [...links, { lang: "x-default", url: ja.url }];
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
				// 見出しの id は Astro が付けるが、それは利用者のプラグインの後なので、
				// 見出しにリンクを足すプラグインより前にも同じものを入れておく(id が付いていれば Astro は付け直さない)
				rehypeHeadingIds,
				rehypeHeadingAnchors,
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
