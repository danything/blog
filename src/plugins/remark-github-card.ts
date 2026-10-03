import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import { h } from "./hast";

// 1 行まるごとがこの形のときだけカードにする。以前の remark-directive のように
// : を含む記法全般は解釈しないので、本文中の「bun:sqlite」などを誤認しない。
// Astro の smartypants がこのプラグインより先に " を “ ” に変えるので両方を受け付ける
const PATTERN = /^::github\{repo=["“]([\w.-]+)\/([\w.-]+)["”]\}$/;

type Repo = {
	description: string | null;
	language: string | null;
	forks: number;
	stargazers_count: number;
	license: { spdx_id: string } | null;
	owner: { avatar_url: string };
};

// 同じリポジトリはビルド中に 1 回だけ取りに行く
const cache = new Map<string, Promise<Repo | null>>();

// 見た目の比較用の固定の記事(VISUAL_FIXTURES=1、src/constants/content-dir.ts)では
// api.github.com に取りに行かず、決まった値を使う。スター数などが変わったり、
// 取得に失敗したりして見た目が揺れないようにするため。リポジトリ名が missing のときは
// 「取得失敗」の見た目を確かめるために null にする
const FIXTURE_REPO: Repo = {
	description: "見た目の比較用の固定のリポジトリ :sparkles:",
	language: "TypeScript",
	forks: 42,
	stargazers_count: 12345,
	license: { spdx_id: "MIT" },
	owner: { avatar_url: "/static/images/avatar.png" },
};

function fetchRepo(repo: string): Promise<Repo | null> {
	if (process.env.VISUAL_FIXTURES)
		return Promise.resolve(repo.endsWith("/missing") ? null : FIXTURE_REPO);
	let p = cache.get(repo);
	if (!p) {
		// CI では GITHUB_TOKEN で回数制限(未認証は 1 時間に 60 回)を緩める
		const token = process.env.GITHUB_TOKEN;
		p = fetch(`https://api.github.com/repos/${repo}`, {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		})
			.then((r) => (r.ok ? (r.json() as Promise<Repo>) : null))
			.catch(() => null);
		cache.set(repo, p);
	}
	return p;
}

const compact = (n: number) =>
	Intl.NumberFormat("en-us", { notation: "compact", maximumFractionDigits: 1 })
		.format(n)
		.replaceAll(" ", "");

/**
 * GitHub リポジトリのカード。記事中に次の 1 行を書く。
 *
 *   ::github{repo="owner/repo"}
 *
 * 説明・スター数などはビルド時に api.github.com から取ってきて HTML に埋め込む
 * (取れなかったときは「取得失敗」の見た目になるだけでビルドは止めない)。
 * scripts/zenn-sync.ts も同じ書き方を Zenn の @[card](...) に変換する。
 */
export const remarkGithubCard: RemarkPlugin = () => async (tree) => {
	const jobs: Promise<void>[] = [];
	visit(tree, "paragraph", (node) => {
		const text = node.children[0];
		if (node.children.length !== 1 || text.type !== "text") return;
		const match = PATTERN.exec(text.value.trim());
		if (!match) return;

		const [, owner, name] = match;
		const repo = `${owner}/${name}`;
		jobs.push(
			fetchRepo(repo).then((data) => {
				node.data = {
					hName: "a",
					hProperties: {
						className: [
							"card-github",
							"no-styling",
							...(data ? [] : ["fetch-error"]),
						],
						href: `https://github.com/${repo}`,
						target: "_blank",
						rel: ["noopener"],
					},
					hChildren: [
						h("div", { className: ["gc-titlebar"] }, [
							h("div", { className: ["gc-titlebar-left"] }, [
								h("div", { className: ["gc-owner"] }, [
									h("div", {
										className: ["gc-avatar"],
										style: data
											? `background-image: url(${data.owner.avatar_url}); background-color: transparent`
											: undefined,
									}),
									h("div", { className: ["gc-user"] }, [owner]),
								]),
								h("div", { className: ["gc-divider"] }, ["/"]),
								h("div", { className: ["gc-repo"] }, [name]),
							]),
							h("div", { className: ["github-logo"] }),
						]),
						h("div", { className: ["gc-description"] }, [
							data?.description?.replace(/:[a-zA-Z0-9_]+:/g, "") ||
								"Description not set",
						]),
						h("div", { className: ["gc-infobar"] }, [
							h("div", { className: ["gc-stars"] }, [
								data ? compact(data.stargazers_count) : "-",
							]),
							h("div", { className: ["gc-forks"] }, [
								data ? compact(data.forks) : "-",
							]),
							h("div", { className: ["gc-license"] }, [
								data?.license?.spdx_id ?? "no-license",
							]),
							h("span", { className: ["gc-language"] }, [data?.language ?? ""]),
						]),
					],
				};
			}),
		);
	});
	await Promise.all(jobs);
};
