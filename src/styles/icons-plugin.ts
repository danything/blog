// CSS の中で var(--icon-lucide-info) のように書いたアイコンを、:root の変数(データ URL)として足す
// Vite のプラグイン(astro.config.ts の vite.plugins)。mask-image などで使う。
// アイコンは src/utils/icons.ts と同じく @iconify-json/* から取る。
// @import した CSS は Vite が読み込み元の CSS に展開してから渡してくるので、main.css から読む
// ファイル(markdown-extend.css など)に書いたものも、.astro の <style> に書いたものも拾える
import type { Plugin } from "vite";
import { iconDataUrl } from "../utils/icons";

const NAME = /var\(--icon-(lucide|simple-icons)-([a-z0-9]+(?:-[a-z0-9]+)*)\)/g;
const CSS = /\.css(?:$|\?)/;

export function cssIcons(): Plugin {
	return {
		name: "css-icons",
		transform(code, id) {
			if (!CSS.test(id)) return;
			const vars = new Map<string, string>();
			for (const [, prefix, name] of code.matchAll(NAME))
				vars.set(`--icon-${prefix}-${name}`, iconDataUrl(`${prefix}:${name}`));
			if (vars.size === 0) return;
			const decls = [...vars].map(([key, value]) => `${key}: ${value};`);
			return { code: `${code}\n:root { ${decls.join(" ")} }\n`, map: null };
		},
	};
}
