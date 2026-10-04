// 記事の画像(public/static/images/blog/)を、表示される幅に合った大きさで配る。
//
// 元の画像(カバーは 1200px 幅など)はそのまま置き、ビルドのときに幅を縮めた WebP
// (br90.webp → br90-400w.webp・br90-800w.webp)を dist に書き出す(plugins/responsive-images.ts)。
// 縮めても元よりファイルが小さくならないもの(元が小さく単純な画像)や、動く画像は縮めない。
// <img> には srcset・sizes を付け、ブラウザが画面の幅と画素密度に合うものを選ぶ。
// 一番大きい候補は元の画像そのもので、拡大表示(Layout.astro)・RSS・Zenn は元の URL を使い続ける。
// width・height も付けて、読み込む前から場所を取り、表示時のずれを防ぐ
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { toWebp } from "../../scripts/webp";

/** 縮めた版を作る画像のディレクトリ(サイト上のパス) */
const RESPONSIVE_DIR = "/static/images/blog/";

/** 縮めた版の幅の候補。元の画像より小さいものだけ作る(拡大はしない) */
const WIDTHS = [400, 800, 1600];

/**
 * 画像が表示される幅(sizes)。実際のレイアウト(layouts/MainGridLayout.astro・PostCard.astro)に合わせる
 * - card: 一覧のカードのカバー。狭い画面では横幅いっぱい、48rem 以上では右の枠に
 *   object-fit: cover で高さ(約 206px)に合わせて切り抜くので、元の比率(1200×630)なら約 400px 幅になる
 * - content: 記事のカバーと本文の画像。本文の幅(48rem 未満は画面 - 42px、64rem からは
 *   サイドバーの分を引き、75rem(--page-width)以上は 800px で止まる)
 */
export const SIZES = {
	card: "(min-width: 48rem) 400px, calc(100vw - 28px)",
	content:
		"(min-width: 75rem) 800px, (min-width: 64rem) calc(100vw - 400px), (min-width: 48rem) calc(100vw - 104px), calc(100vw - 42px)",
};

const SOURCE = /\.(?:webp|png|jpe?g)$/i;

/** 縮めた版を作る対象か */
const isResponsive = (src: string): boolean =>
	src.startsWith(RESPONSIVE_DIR) && SOURCE.test(src);

/** 縮めた版のサイト上のパス(/static/images/blog/br90.webp → /static/images/blog/br90-400w.webp) */
const variantUrl = (src: string, width: number): string =>
	src.replace(SOURCE, `-${width}w.webp`);

/** public/ 以下の対象の画像(サイト上のパス) */
export function listResponsiveImages(): string[] {
	const dir = path.join("public", RESPONSIVE_DIR);
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.map((f) => `${RESPONSIVE_DIR}${f}`)
		.filter(isResponsive);
}

export interface Variant {
	url: string;
	width: number;
	data: Buffer;
}
interface Info {
	width: number;
	height: number;
	/** 元より小さくなった縮めた版(幅の小さい順) */
	variants: Variant[];
}

// 縮めた版の変換は 1 枚 1 秒ほどかかる。記事の描画(ImageWrapper・rehype-responsive-images)と
// dist への書き出し(plugins/responsive-images.ts)は別々に読み込まれるので、変換した結果はファイルに取っておく。
// キーは元の画像・幅・変換の処理(toWebp の中身)で、品質などを変えたら作り直す
const CACHE_DIR = "node_modules/.cache/responsive-images";

async function encode(input: Buffer, width: number): Promise<Buffer> {
	const hash = createHash("sha256")
		.update(input)
		.update(toWebp.toString())
		.digest("hex")
		.slice(0, 16);
	const file = path.join(CACHE_DIR, `${hash}-${width}w.webp`);
	if (fs.existsSync(file)) return fs.readFileSync(file);
	const { data } = await toWebp(sharp(input).resize({ width }));
	// ビルドと開発サーバーが同時に読み書きしても、書きかけのファイルを読まないよう、別名で書いてから置き換える
	fs.mkdirSync(CACHE_DIR, { recursive: true });
	const tmp = `${file}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, data);
	fs.renameSync(tmp, file);
	return data;
}

const cache = new Map<string, Promise<Info | undefined>>();

/** 対象の画像なら、縦横と縮めた版を返す(対象外や見つからないときは undefined) */
export function imageInfo(src: string): Promise<Info | undefined> {
	if (!isResponsive(src)) return Promise.resolve(undefined);
	let info = cache.get(src);
	if (!info) {
		info = (async () => {
			const file = path.join("public", src);
			if (!fs.existsSync(file)) return undefined;
			const input = fs.readFileSync(file);
			const { width, height, pages = 1 } = await sharp(input).metadata();
			if (!width || !height) return undefined;
			// 動く画像(アニメーション WebP・GIF)は縮めると止まるので、縦横だけ使う
			if (pages > 1) return { width, height, variants: [] };
			const variants = await Promise.all(
				WIDTHS.filter((w) => w < width).map(async (w) => ({
					url: variantUrl(src, w),
					width: w,
					data: await encode(input, w),
				})),
			);
			return {
				width,
				height,
				variants: variants.filter((v) => v.data.length < input.length),
			};
		})();
		cache.set(src, info);
	}
	return info;
}

/**
 * 対象の画像なら、縦横と srcset を返す(対象外・見つからない・縮めた版が無いときは undefined)。
 * toUrl は srcset に書く URL への変換(base を付けるなど)
 */
export async function responsiveImage(
	src: string,
	toUrl: (path: string) => string = (p) => p,
): Promise<{ width: number; height: number; srcset?: string } | undefined> {
	const info = await imageInfo(src);
	if (!info) return undefined;
	const { width, height, variants } = info;
	const srcset =
		variants.length > 0
			? [
					...variants.map((v) => `${toUrl(v.url)} ${v.width}w`),
					`${toUrl(src)} ${width}w`,
				].join(", ")
			: undefined;
	return { width, height, srcset };
}
