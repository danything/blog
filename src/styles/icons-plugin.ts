// CSS の中で var(--icon-lucide-info) のように書いたアイコンを、:root の変数(データ URL)として足す
// Vite のプラグイン(astro.config.ts の vite.plugins)。mask-image などで使う。
// アイコンは src/utils/icons.ts と同じく @iconify-json/* から取る。
// 変数は、どのページでも読み込む main.css(Layout.astro で読み込む)にまとめて 1 回だけ足す。
// CSS ごとに足すと、同じアイコンを使う CSS が同じページに載ったときに、同じ変数が何度も出てしまう。
// そのため、ビルド(と開発サーバー)の始めに src/ の .css・.astro を読んで、使われているアイコンを集めておく。
// 開発サーバーを動かしている間に新しく書いたアイコンは、まだ集めていないので、その CSS に足す(起動し直すと main.css に移る)
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { iconDataUrl } from "../utils/icons";

const NAME = /var\(--icon-(lucide|simple-icons)-([a-z0-9]+(?:-[a-z0-9]+)*)\)/g;
const CSS = /\.css(?:$|\?)/;
const SOURCE = /\.(?:css|astro)$/;

/** CSS に書かれたアイコンの名前("lucide:info" の形) */
function iconNames(code: string): string[] {
	return [...code.matchAll(NAME)].map(
		([, prefix, name]) => `${prefix}:${name}`,
	);
}

function rootRule(names: Iterable<string>): string {
	const decls = [...names].map((name) => {
		const [prefix, id] = name.split(":");
		return `--icon-${prefix}-${id}: ${iconDataUrl(name)};`;
	});
	return `:root { ${decls.join(" ")} }`;
}

export function cssIcons({
	srcDir = "src",
	entry = "src/styles/main.css",
}: {
	/** 使われているアイコンを探すディレクトリ */
	srcDir?: string;
	/** 変数をまとめて足す CSS(どのページでも読み込むもの) */
	entry?: string;
} = {}): Plugin {
	let srcPath = "";
	let entryPath = "";
	const known = new Set<string>();

	return {
		name: "css-icons",
		configResolved(config) {
			srcPath = resolve(config.root, srcDir);
			entryPath = resolve(config.root, entry);
		},
		buildStart() {
			known.clear();
			const files = readdirSync(srcPath, { recursive: true, encoding: "utf8" });
			for (const file of files.filter((f) => SOURCE.test(f)).sort())
				for (const name of iconNames(
					readFileSync(resolve(srcPath, file), "utf8"),
				))
					known.add(name);
		},
		transform(code, id) {
			if (!CSS.test(id)) return;
			const names =
				id.split("?")[0] === entryPath
					? [...known].sort()
					: // 起動した後に書かれたものなど、集めたアイコンに無いものだけ、その CSS に足す
						iconNames(code).filter((name) => !known.has(name));
			if (names.length === 0) return;
			return { code: `${code}\n${rootRule(new Set(names))}\n`, map: null };
		},
	};
}
