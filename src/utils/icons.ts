// アイコンは Iconify のアイコンセットのパッケージ(@iconify-json/*)からビルド時に取る。
// 画面の部品は Lucide(https://icon-sets.iconify.design/lucide/)、
// サービスのロゴは Simple Icons(https://icon-sets.iconify.design/simple-icons/)から選ぶ。
// 名前は "lucide:search" の形。無い名前を書くとビルドが止まる
import type { IconifyJSON } from "@iconify/types";
import { icons as lucide } from "@iconify-json/lucide";
import { icons as simpleIcons } from "@iconify-json/simple-icons";

const SETS: Record<string, IconifyJSON> = {
	lucide,
	"simple-icons": simpleIcons,
};

export type Icon = { viewBox: string; body: string };

export function getIcon(name: string): Icon {
	const [prefix, id] = name.split(":");
	const set = SETS[prefix];
	if (!set || !id)
		throw new Error(
			`アイコン ${name}: 使えるのは ${Object.keys(SETS).join("・")} のセットだけ`,
		);
	const data = set.icons[id] ?? set.icons[set.aliases?.[id]?.parent ?? ""];
	if (!data) throw new Error(`アイコン ${name} がありません`);
	const w = data.width ?? set.width ?? 16;
	const h = data.height ?? set.height ?? 16;
	return { viewBox: `0 0 ${w} ${h}`, body: data.body };
}

/** CSS の mask-image などに使うデータ URL */
export function iconDataUrl(name: string): string {
	const { viewBox, body } = getIcon(name);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
