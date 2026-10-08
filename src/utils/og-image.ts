import fs from "node:fs";
import { render } from "takumi-js";
import { Renderer } from "takumi-js/node";
import { siteConfig } from "@/config";

const WIDTH = 1200;
const HEIGHT = 630;
const ACCENT = "#f4511e";

// タイトルに使う文字だけを Google Fonts から取る(サイトの表示には使わない。画像を作るときだけ)。
// 何も指定しないと TrueType の URL が返る。描画は Takumi(Rust。satori は 0.35.2 から Node.js で
// `__dirname is not defined` で落ちるようになった。vercel/satori#844)
async function fetchOk(url: string): Promise<Response> {
	const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
	if (!r.ok) throw new Error(`${r.status} ${url}`);
	return r;
}

async function loadFont(text: string, weight: 400 | 700): Promise<ArrayBuffer> {
	const css = await fetchOk(
		`https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@${weight}&text=${encodeURIComponent(text)}`,
	).then((r) => r.text());
	const url = css.match(
		/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/,
	)?.[1];
	if (!url)
		throw new Error("Google Fonts から BIZ UDPGothic を取れませんでした");
	return fetchOk(url).then((r) => r.arrayBuffer());
}

const FOOTER = `${siteConfig.title} · doany.io`;
// フッターの文字は全記事で同じなので 1 回だけ取る
let footerFont: Promise<ArrayBuffer> | undefined;

/** 記事タイトル入りの OG 画像(PNG)。フォントが取れないなど作れなかったときは既定の画像を返す */
export async function renderOgImage(title: string): Promise<Uint8Array> {
	try {
		footerFont ??= loadFont(FOOTER, 400);
		const [titleFont, footer] = await Promise.all([
			// 4 行で切ったときの「…」もタイトルの文字と同じフォントで出す
			loadFont(`${title}…`, 700),
			footerFont,
		]);
		// フォントはタイトルの文字だけを含むので、記事ごとに Renderer を作って登録する
		const renderer = new Renderer();
		await renderer.registerFont({
			name: "BIZ UDPGothic",
			data: titleFont,
			weight: 700,
		});
		await renderer.registerFont({
			name: "BIZ UDPGothic",
			data: footer,
			weight: 400,
		});
		return await render(
			{
				type: "div",
				props: {
					style: {
						width: WIDTH,
						height: HEIGHT,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						padding: "80px 88px",
						background: "#222222",
						borderLeft: `24px solid ${ACCENT}`,
						fontFamily: "BIZ UDPGothic",
					},
					children: [
						{
							type: "div",
							props: {
								style: {
									fontSize: 64,
									fontWeight: 700,
									lineHeight: 1.4,
									color: "#ffffff",
									lineClamp: 4,
									// satori は lineClamp だけで末尾に「…」を付けたが、Takumi は CSS どおり text-overflow が要る
									textOverflow: "ellipsis",
								},
								children: title,
							},
						},
						{
							type: "div",
							props: {
								style: { fontSize: 36, fontWeight: 400, color: ACCENT },
								children: FOOTER,
							},
						},
					],
				},
			},
			{ renderer, width: WIDTH, height: HEIGHT, format: "png" },
		);
	} catch (e) {
		footerFont = undefined;
		console.warn(
			`[og] ${title}: ${(e as Error).message}。既定の画像を使います`,
		);
		return fs.readFileSync(`public${siteConfig.ogImage}`);
	}
}
