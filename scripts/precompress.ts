// ビルドした dist/ の圧縮が効くファイルの隣に .br・.gz を書き出す。
// Caddy の `file_server { precompressed br gzip }` がこれを配信するので、
// リクエストのたびに圧縮しなくてよくなり、圧縮率も最大にできる(brotli 11・gzip 9)。
// zstd は作らない。前段の Cloudflare はオリジンに br・gzip しか求めない(ブラウザへの zstd は Cloudflare がする)
//
//   bun scripts/precompress.ts [dir]   (既定は dist。bun run build の最後に呼ぶ)
//
// 画像や Pagefind の索引 (.pf_*・.pagefind) は既に圧縮されているので対象にしない。
// 圧縮しても元より小さくならないものは書き出さない(Caddy は元のファイルを配信する)。
//
// 先に、Pagefind が索引と一緒に書き出す既製の UI(pagefind-ui・component-ui・modular-ui・highlight の
// .js・.css)を消す。検索欄は自前(components/Search.astro)で、読み込むのは pagefind.js
// (とそれが使う pagefind-worker.js・pagefind-entry.json・wasm・索引)だけ。Pagefind に書き出さない設定は無い
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const dir = process.argv[2] ?? "dist";

const pagefindDir = path.join(dir, "pagefind");
const UNUSED_PAGEFIND =
	/^pagefind-(?:ui|component-ui|modular-ui|highlight)\.(?:js|css)$/;
for (const f of fs.existsSync(pagefindDir) ? fs.readdirSync(pagefindDir) : []) {
	if (UNUSED_PAGEFIND.test(f)) fs.rmSync(path.join(pagefindDir, f));
}
const COMPRESSIBLE =
	/\.(?:html|css|js|mjs|json|xml|svg|txt|webmanifest|map|ico)$/i;

const encoders: [ext: string, (buf: Buffer) => Buffer][] = [
	[
		".br",
		(buf) =>
			zlib.brotliCompressSync(buf, {
				params: {
					[zlib.constants.BROTLI_PARAM_QUALITY]: 11,
					[zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
				},
			}),
	],
	[".gz", (buf) => zlib.gzipSync(buf, { level: 9 })],
];

const files = fs
	.readdirSync(dir, { recursive: true, encoding: "utf8" })
	.map((f) => path.join(dir, f))
	.filter((f) => COMPRESSIBLE.test(f) && fs.statSync(f).isFile());

const kb = (n: number) => `${Math.round(n / 1024)}K`;
let original = 0;
const written = new Map(encoders.map(([ext]) => [ext, 0]));

for (const file of files) {
	const buf = fs.readFileSync(file);
	original += buf.length;
	for (const [ext, encode] of encoders) {
		const out = encode(buf);
		if (out.length >= buf.length) continue;
		fs.writeFileSync(file + ext, out);
		written.set(ext, (written.get(ext) ?? 0) + out.length);
	}
}

console.log(
	`precompress: ${files.length} ファイル ${kb(original)} → ${[...written]
		.map(([ext, n]) => `${ext} ${kb(n)}`)
		.join("・")}`,
);
