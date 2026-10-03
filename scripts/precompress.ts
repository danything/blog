// ビルドした dist/ の圧縮が効くファイルの隣に .zst・.br・.gz を書き出す。
// Caddy の `file_server { precompressed zstd br gzip }` がこれを配信するので、
// リクエストのたびに圧縮しなくてよくなり、圧縮率も最大にできる(brotli 11・gzip 9・zstd 19)。
//
//   bun scripts/precompress.ts [dir]   (既定は dist。bun run build の最後に呼ぶ)
//
// 画像や Pagefind の索引 (.pf_*・.pagefind) は既に圧縮されているので対象にしない。
// 圧縮しても元より小さくならないものは書き出さない(Caddy は元のファイルを配信する)。
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const dir = process.argv[2] ?? "dist";
const COMPRESSIBLE =
	/\.(?:html|css|js|mjs|json|xml|svg|txt|webmanifest|map|ico)$/i;

const encoders: [ext: string, (buf: Buffer) => Buffer][] = [
	[
		".zst",
		(buf) =>
			zlib.zstdCompressSync(buf, {
				params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 },
			}),
	],
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
