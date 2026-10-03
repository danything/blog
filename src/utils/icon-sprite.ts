import iconData from "../icons.json";

// アイコンは <svg><use href="#icon-…"></use></svg> として描き、形(<symbol>)はページに 1 回だけ置く
// (src/middleware.ts が、そのページで使っているものを </body> の前に足す)。
// 記事カードなどで同じアイコンが何度も出ても、HTML には形が 1 回しか入らない

type IconData = { viewBox: string; body: string };
const icons = iconData as Record<string, IconData>;

/** アイコンの名前("lucide:book")から <symbol> の id("icon-lucide-book")を作る */
export const iconId = (name: string) => `icon-${name.replace(":", "-")}`;

export function getIcon(name: string): IconData {
	const icon = icons[name];
	if (!icon)
		throw new Error(
			`アイコン ${name} が src/icons.json にありません(bun run icons を実行)`,
		);
	return icon;
}

const byId = new Map(Object.keys(icons).map((name) => [iconId(name), name]));
const USE = /<use href="#(icon-[a-z0-9-]+)"/g;

/**
 * HTML の中で使っているアイコンの <symbol> をまとめた、表示しない <svg> を作る。
 * <template> の中(検索結果)も文字列として拾うので、複製したあとも形を参照できる
 */
export function iconSprite(html: string): string {
	const names = [...new Set([...html.matchAll(USE)].map((m) => m[1]))]
		.map((id) => byId.get(id))
		.filter((name) => name !== undefined)
		.sort();
	if (names.length === 0) return "";
	const symbols = names
		.map((name) => {
			const { viewBox, body } = icons[name];
			return `<symbol id="${iconId(name)}" viewBox="${viewBox}">${body}</symbol>`;
		})
		.join("");
	return `<svg hidden aria-hidden="true">${symbols}</svg>`;
}
