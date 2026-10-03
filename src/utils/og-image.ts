import fs from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { siteConfig } from "@/config";

const WIDTH = 1200;
const HEIGHT = 630;
const ACCENT = "#f4511e";

// タイトルに使う文字だけを Google Fonts から取る(サイトの表示には使わない。画像を作るときだけ)。
// 何も指定しないと TrueType の URL が返る(satori は woff2 を読めない)
async function loadFont(text: string, weight: 400 | 700): Promise<ArrayBuffer> {
	const css = await fetch(
		`https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@${weight}&text=${encodeURIComponent(text)}`,
	).then((r) => r.text());
	const url = css.match(
		/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/,
	)?.[1];
	if (!url)
		throw new Error("Google Fonts から BIZ UDPGothic を取れませんでした");
	return fetch(url).then((r) => r.arrayBuffer());
}

/** 記事タイトル入りの OG 画像(PNG)。フォントが取れないときは既定の画像を返す */
export async function renderOgImage(title: string): Promise<Uint8Array> {
	const footer = `${siteConfig.title} · doany.io`;
	let fonts: Awaited<ReturnType<typeof loadFont>>[];
	try {
		fonts = await Promise.all([loadFont(title, 700), loadFont(footer, 400)]);
	} catch (e) {
		console.warn(`[og] ${(e as Error).message}。既定の画像を使います`);
		return fs.readFileSync(`public${siteConfig.ogImage}`);
	}

	const svg = await satori(
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
							},
							children: title,
						},
					},
					{
						type: "div",
						props: {
							style: { fontSize: 36, fontWeight: 400, color: ACCENT },
							children: footer,
						},
					},
				],
			},
		},
		{
			width: WIDTH,
			height: HEIGHT,
			fonts: [
				{ name: "BIZ UDPGothic", data: fonts[0], weight: 700, style: "normal" },
				{ name: "BIZ UDPGothic", data: fonts[1], weight: 400, style: "normal" },
			],
		},
	);
	return new Resvg(svg).render().asPng();
}
