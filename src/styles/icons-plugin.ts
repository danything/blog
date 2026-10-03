// CSS の中で var(--icon-lucide-info) のように書いたアイコンを、:root の変数(データ URL)として足す
// Tailwind のプラグイン(main.css の @plugin)。mask-image などで使う。
// アイコンは src/utils/icons.ts と同じく @iconify-json/* から取る
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import plugin from "tailwindcss/plugin";
import { iconDataUrl } from "../utils/icons";

const STYLES = path.dirname(fileURLToPath(import.meta.url));
const NAME = /var\(--icon-(lucide|simple-icons)-([a-z0-9]+(?:-[a-z0-9]+)*)\)/g;

export default plugin(({ addBase }) => {
	const vars: Record<string, string> = {};
	for (const file of fs.readdirSync(STYLES)) {
		if (!file.endsWith(".css")) continue;
		const css = fs.readFileSync(path.join(STYLES, file), "utf8");
		for (const [, prefix, name] of css.matchAll(NAME))
			vars[`--icon-${prefix}-${name}`] = iconDataUrl(`${prefix}:${name}`);
	}
	addBase({ ":root": vars });
});
