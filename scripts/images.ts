// 記事の画像を WebP にして軽くする。
//
//   bun run images              記事から参照されている PNG / JPEG をすべて変換
//   bun run images <ファイル…>   指定したファイルだけ変換(public/ 以下のパス)
//
// 画像ごとにロスレスと非可逆(品質 82)の両方を試し、ロスレスが非可逆の 1.3 倍以内なら
// ロスレスにする(スクリーンショットは劣化なし、写真は軽く)。変換後は元のファイルを消し、
// 記事中の参照(本文の画像とフロントマターの image)を .webp に書き換える。
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const POSTS_DIR = "src/content/posts";
const IMAGE = /\/static\/images\/[^\s)"'<>]+?\.(?:png|jpe?g)/gi;

const posts = fs
	.readdirSync(POSTS_DIR)
	.filter((f) => f.endsWith(".md"))
	.map((f) => path.join(POSTS_DIR, f));

// 変換する画像(サイト上のパス /static/... で持つ)
const args = process.argv.slice(2);
const targets = new Set(
	args.length > 0
		? args.map(
				(f) =>
					`/${path.relative("public", path.resolve(f)).replaceAll(path.sep, "/")}`,
			)
		: posts.flatMap((p) => fs.readFileSync(p, "utf8").match(IMAGE) ?? []),
);

const kb = (n: number) => `${Math.round(n / 1024)}K`;
let before = 0;
let after = 0;
const converted = new Map<string, string>();

for (const url of [...targets].sort()) {
	const file = path.join("public", url);
	if (!fs.existsSync(file)) {
		console.warn(`見つからない: ${file}`);
		continue;
	}
	const input = fs.readFileSync(file);
	const [lossless, lossy] = await Promise.all([
		sharp(input).webp({ lossless: true, effort: 6 }).toBuffer(),
		sharp(input).webp({ quality: 82, effort: 6 }).toBuffer(),
	]);
	const useLossless = lossless.length <= lossy.length * 1.3;
	const output = useLossless ? lossless : lossy;
	const outUrl = url.replace(/\.(png|jpe?g)$/i, ".webp");

	fs.writeFileSync(path.join("public", outUrl), output);
	fs.rmSync(file);
	converted.set(url, outUrl);
	before += input.length;
	after += output.length;
	console.log(
		`${url} ${kb(input.length)} → ${kb(output.length)} (${useLossless ? "ロスレス" : "非可逆"})`,
	);
}

// 記事の参照を書き換える
for (const p of posts) {
	const text = fs.readFileSync(p, "utf8");
	let next = text;
	for (const [from, to] of converted) next = next.replaceAll(from, to);
	if (next !== text) {
		fs.writeFileSync(p, next);
		console.log(`参照を更新: ${p}`);
	}
}

if (converted.size === 0) console.log("変換する画像はありませんでした");
else console.log(`\n${converted.size} 枚 ${kb(before)} → ${kb(after)}`);
