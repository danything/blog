// 新規追加された記事を Buttondown のメールとして作成する。
//
//   bun scripts/newsletter.ts <追加されたファイル...>
//
// 環境変数:
//   BUTTONDOWN_API_KEY  必須
//   NEWSLETTER_STATUS   draft (既定) または about_to_send
//   SITE_URL            既定 https://doany.io

import fs from "node:fs";
import path from "node:path";
import { parsePost } from "./frontmatter";

const API = "https://api.buttondown.com/v1/emails";
const KEY = process.env.BUTTONDOWN_API_KEY;
const STATUS = process.env.NEWSLETTER_STATUS || "draft";
const SITE_URL = (process.env.SITE_URL || "https://doany.io").replace(
	/\/$/,
	"",
);

if (!KEY) {
	console.error("BUTTONDOWN_API_KEY が設定されていません");
	process.exit(1);
}

const files = process.argv.slice(2).filter((f) => f.endsWith(".md"));
if (files.length === 0) {
	console.log("対象の記事がないため何もしません");
	process.exit(0);
}

let created = 0;
let skipped = 0;

for (const file of files) {
	if (!fs.existsSync(file)) {
		console.log(`スキップ (存在しない): ${file}`);
		skipped++;
		continue;
	}

	const fm = parsePost(file)?.fm;
	if (!fm?.title) {
		console.log(`スキップ (title なし): ${file}`);
		skipped++;
		continue;
	}
	if (fm.draft === "true") {
		console.log(`スキップ (draft): ${file}`);
		skipped++;
		continue;
	}

	const slug = path.basename(file, ".md");
	const url = `${SITE_URL}/posts/${slug}/`;
	// 記事本文をそのまま送ると相対パスの画像が壊れるため、概要とリンクにとどめる
	const body = [fm.description || "", "", "続きはこちらです。", "", url].join(
		"\n",
	);

	const res = await fetch(API, {
		method: "POST",
		headers: {
			Authorization: `Token ${KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ subject: fm.title, body, status: STATUS }),
	});

	if (!res.ok) {
		console.error(`失敗 (${res.status}): ${file}`);
		console.error(await res.text());
		process.exit(1);
	}

	const json = (await res.json()) as { id: string };
	console.log(`作成 [${STATUS}] ${fm.title} -> ${json.id}`);
	created++;
}

console.log(`\n作成 ${created} 件 / スキップ ${skipped} 件`);
