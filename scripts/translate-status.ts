// 英訳(.github/translate.md)が原文に追いついているかを調べる。
//
//   bun scripts/translate-status.ts            # 人が読む形で出す
//   bun scripts/translate-status.ts --json     # CI 用(.github/workflows/translate.yml)
//   bun scripts/translate-status.ts --hash <原文のパス>  # sourceHash に書く値
//
// 英訳のフロントマターの sourceHash は、訳した時点の原文ファイル全体の SHA-256 の先頭 16 文字。
// 今の原文と違えば原文が変わったということなので、訳を直す
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parsePost } from "./frontmatter";

const POSTS_DIR = "src/content/posts";
const POSTS_EN_DIR = "src/content/posts-en";
// 記事以外で訳すもの(原文 → 英訳)
const PAGES: [string, string][] = [
	["src/content/spec/about.md", "src/content/spec/about-en.md"],
];

export function sourceHash(file: string): string {
	return createHash("sha256")
		.update(fs.readFileSync(file))
		.digest("hex")
		.slice(0, 16);
}

type Status = {
	/** 英訳が無い原文 */
	missing: { source: string; target: string }[];
	/** 原文が変わった(sourceHash が合わない)もの */
	outdated: { source: string; target: string }[];
	/** 原文が無くなった英訳(消す) */
	orphaned: string[];
};

function mdFiles(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".md"))
		.sort();
}

export function translateStatus(): Status {
	const pairs: [string, string][] = [
		...mdFiles(POSTS_DIR).map((name): [string, string] => [
			path.join(POSTS_DIR, name),
			path.join(POSTS_EN_DIR, name),
		]),
		...PAGES,
	];
	const status: Status = { missing: [], outdated: [], orphaned: [] };
	for (const [source, target] of pairs) {
		if (!fs.existsSync(source)) continue;
		if (!fs.existsSync(target)) {
			status.missing.push({ source, target });
		} else if (parsePost(target)?.fm.sourceHash !== sourceHash(source)) {
			status.outdated.push({ source, target });
		}
	}
	for (const name of mdFiles(POSTS_EN_DIR)) {
		if (!fs.existsSync(path.join(POSTS_DIR, name)))
			status.orphaned.push(path.join(POSTS_EN_DIR, name));
	}
	for (const [source, target] of PAGES) {
		if (!fs.existsSync(source) && fs.existsSync(target))
			status.orphaned.push(target);
	}
	return status;
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	if (args[0] === "--hash") {
		if (!args[1]) {
			console.error(
				"使い方: bun scripts/translate-status.ts --hash <原文のパス>",
			);
			process.exit(1);
		}
		console.log(sourceHash(args[1]));
	} else {
		const status = translateStatus();
		if (args.includes("--json")) {
			console.log(JSON.stringify(status));
		} else {
			const { missing, outdated, orphaned } = status;
			if (!missing.length && !outdated.length && !orphaned.length) {
				console.log("英訳はすべて最新です");
			}
			for (const { source, target } of missing)
				console.log(`未訳: ${source} → ${target}`);
			for (const { source, target } of outdated)
				console.log(`原文が更新された: ${source} → ${target}`);
			for (const target of orphaned)
				console.log(`原文が無い(削除する): ${target}`);
		}
	}
}
