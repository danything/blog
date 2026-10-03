// src 内で使っているアイコン("material-symbols:search" のような名前)を集め、
// Iconify の API から必要な分だけ取ってきて src/icons.json に保存する。
//
//   bun run icons
//
// アイコンを増やすときは、コードや設定に名前を書いてからこれを実行する。
// 名前は https://icon-sets.iconify.design/ で探せる。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const OUT = path.join(SRC, "icons.json");
const NAME = /\b([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)\b/g;
// 名前の形をしているがアイコンではないもの(URL のスキームなど)を除くため、既知のセットだけ拾う
const SETS = ["fa6-brands", "fa6-regular", "fa6-solid", "material-symbols"];

function* walk(dir: string): Generator<string> {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) {
			if (e.name !== "content") yield* walk(p);
		} else if (/\.(astro|svelte|ts)$/.test(e.name)) yield p;
	}
}

const wanted = new Map<string, Set<string>>();
for (const file of walk(SRC)) {
	for (const [, prefix, name] of fs.readFileSync(file, "utf8").matchAll(NAME)) {
		if (!SETS.includes(prefix)) continue;
		if (!wanted.has(prefix)) wanted.set(prefix, new Set());
		wanted.get(prefix)?.add(name);
	}
}

type IconifyJSON = {
	icons: Record<string, { body: string; width?: number; height?: number }>;
	aliases?: Record<string, { parent: string }>;
	width?: number;
	height?: number;
	not_found?: string[];
};

const out: Record<string, { viewBox: string; body: string }> = {};
for (const [prefix, names] of [...wanted].sort()) {
	const res = await fetch(
		`https://api.iconify.design/${prefix}.json?icons=${[...names].join(",")}`,
	);
	const data = (await res.json()) as IconifyJSON;
	if (data.not_found?.length) {
		throw new Error(
			`見つからないアイコン: ${data.not_found.map((n) => `${prefix}:${n}`).join(", ")}`,
		);
	}
	for (const name of [...names].sort()) {
		const icon =
			data.icons[name] ?? data.icons[data.aliases?.[name]?.parent ?? ""];
		if (!icon) throw new Error(`取得できなかったアイコン: ${prefix}:${name}`);
		const w = icon.width ?? data.width ?? 16;
		const h = icon.height ?? data.height ?? 16;
		out[`${prefix}:${name}`] = { viewBox: `0 0 ${w} ${h}`, body: icon.body };
	}
}

fs.writeFileSync(OUT, `${JSON.stringify(out, null, "\t")}\n`);
console.log(
	`${Object.keys(out).length} 個のアイコンを ${path.relative(process.cwd(), OUT)} に書き出しました`,
);
