import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import { h } from "./hast";

// 1 行まるごとがこの形のときだけカードにする。以前の remark-directive のように
// : を含む記法全般は解釈しないので、本文中の「bun:sqlite」などを誤認しない。
// Astro の smartypants がこのプラグインより先に " を “ ” に変えるので両方を受け付ける
const PATTERN = /^::github\{repo=["“]([\w.-]+)\/([\w.-]+)["”]\}$/;

/**
 * GitHub リポジトリのカード。記事中に次の 1 行を書く。
 *
 *   ::github{repo="owner/repo"}
 *
 * 説明・スター数などはページを開いたときに api.github.com から取ってくる。
 * scripts/zenn-sync.ts も同じ書き方を Zenn の @[card](...) に変換する。
 */
export const remarkGithubCard: RemarkPlugin = () => (tree) => {
	visit(tree, "paragraph", (node) => {
		const text = node.children[0];
		if (node.children.length !== 1 || text.type !== "text") return;
		const match = PATTERN.exec(text.value.trim());
		if (!match) return;

		const [, owner, name] = match;
		const repo = `${owner}/${name}`;
		const id = `GC${Math.random().toString(36).slice(-6)}`; // 衝突しても実害は無い
		const part = (key: string, tag = "div", children: string[] = []) =>
			h(tag, { id: `${id}-${key}`, className: [`gc-${key}`] }, children);

		node.data = {
			hName: "a",
			hProperties: {
				id: `${id}-card`,
				className: ["card-github", "fetch-waiting", "no-styling"],
				href: `https://github.com/${repo}`,
				target: "_blank",
				rel: ["noopener"],
				repo,
			},
			hChildren: [
				h("div", { className: ["gc-titlebar"] }, [
					h("div", { className: ["gc-titlebar-left"] }, [
						h("div", { className: ["gc-owner"] }, [
							part("avatar"),
							h("div", { className: ["gc-user"] }, [owner]),
						]),
						h("div", { className: ["gc-divider"] }, ["/"]),
						h("div", { className: ["gc-repo"] }, [name]),
					]),
					h("div", { className: ["github-logo"] }),
				]),
				part("description", "div", ["Waiting for api.github.com..."]),
				h("div", { className: ["gc-infobar"] }, [
					part("stars", "div", ["00K"]),
					part("forks", "div", ["0K"]),
					part("license", "div", ["0K"]),
					part("language", "span", ["Waiting..."]),
				]),
				h("script", { type: "text/javascript", defer: true }, [
					`
fetch('https://api.github.com/repos/${repo}', { referrerPolicy: "no-referrer" }).then(r => r.json()).then(data => {
  const $ = (k) => document.getElementById('${id}-' + k);
  const compact = (n) => Intl.NumberFormat('en-us', { notation: "compact", maximumFractionDigits: 1 }).format(n).replaceAll("\\u202f", '');
  $('description').innerText = data.description?.replace(/:[a-zA-Z0-9_]+:/g, '') || "Description not set";
  $('language').innerText = data.language;
  $('forks').innerText = compact(data.forks);
  $('stars').innerText = compact(data.stargazers_count);
  $('avatar').style.backgroundImage = 'url(' + data.owner.avatar_url + ')';
  $('avatar').style.backgroundColor = 'transparent';
  $('license').innerText = data.license?.spdx_id || "no-license";
  $('card').classList.remove("fetch-waiting");
}).catch(() => document.getElementById('${id}-card')?.classList.add("fetch-error"));
`,
				]),
			],
		};
	});
};
