// src 内で使っているアイコン("lucide:search" のような名前)を集め、
// Iconify の API から必要な分だけ取ってきて src/icons.json に保存する。
// CSS の中で var(--icon-lucide-info) のように書いたものは、データ URL にして
// src/styles/icons.css の変数に書き出す(mask-image などで使う)。
//
//   bun run icons
//
// アイコンを増やすときは、コードや設定に名前を書いてからこれを実行する。
// 画面の部品のアイコンは Lucide(https://icon-sets.iconify.design/lucide/)、
// サービスのロゴは Simple Icons(https://icon-sets.iconify.design/simple-icons/)から選ぶ。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const OUT = path.join(SRC, "icons.json");
const OUT_CSS = path.join(SRC, "styles", "icons.css");
const NAME = /\b([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)\b/g;
// 名前の形をしているがアイコンではないもの(URL のスキームなど)を除くため、既知のセットだけ拾う
const SETS = ["lucide", "simple-icons"];
const CSS_NAME = new RegExp(
	`--icon-(${SETS.join("|")})-([a-z0-9]+(?:-[a-z0-9]+)*)`,
	"g",
);

function* walk(dir: string): Generator<string> {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) {
			if (e.name !== "content") yield* walk(p);
		} else if (/\.(astro|ts|css)$/.test(e.name) && p !== OUT_CSS) yield p;
	}
}

const wanted = new Map<string, Set<string>>();
// CSS から使うもの("lucide:info" の形)
const inCss = new Set<string>();
for (const file of walk(SRC)) {
	const text = fs.readFileSync(file, "utf8");
	const css = file.endsWith(".css");
	for (const [, prefix, name] of text.matchAll(css ? CSS_NAME : NAME)) {
		if (!SETS.includes(prefix)) continue;
		if (!wanted.has(prefix)) wanted.set(prefix, new Set());
		wanted.get(prefix)?.add(name);
		if (css) inCss.add(`${prefix}:${name}`);
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

const vars = [...inCss].sort().map((key) => {
	const { viewBox, body } = out[key];
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
	return `  --icon-${key.replace(":", "-")}: url("data:image/svg+xml,${encodeURIComponent(svg)}");`;
});
fs.writeFileSync(
	OUT_CSS,
	`/* bun run icons で生成。手で書き換えない */\n:root {\n${vars.join("\n")}\n}\n`,
);
console.log(
	`${Object.keys(out).length} 個のアイコンを ${path.relative(process.cwd(), OUT)} に書き出しました`,
);
