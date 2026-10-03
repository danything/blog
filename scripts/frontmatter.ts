import fs from "node:fs";

export type Frontmatter = Record<string, string | undefined>;

/** 記事のフロントマター(1 行 1 項目の単純な形だけ)と本文を分ける */
export function parsePost(
	file: string,
): { fm: Frontmatter; body: string } | null {
	const raw = fs.readFileSync(file, "utf8");
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!m) return null;

	const fm: Frontmatter = {};
	for (const line of m[1].split(/\r?\n/)) {
		const mm = line.match(/^([A-Za-z_]+):\s*(.*)$/);
		if (mm) fm[mm[1]] = mm[2].trim().replace(/^['"]|['"]$/g, "");
	}
	return { fm, body: m[2] };
}
