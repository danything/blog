type Node = { type: string; children?: Node[] };
type Child<T> = T extends { children: (infer C)[] } ? C : never;

/** visitor がこれを返すと、その節の子は見ない */
export const SKIP = "skip";

/**
 * 木を深さ優先・前順にたどり、type が一致する節ごとに visitor(node, index, parent) を呼ぶ
 * (unist-util-visit の代わりの最小限で、たどる順番は同じ)。
 * 子は visitor を呼んだ後に読むので、visitor が節の子を足したときはそれもたどる。
 * 兄弟は親の children を毎回読み直して次の位置へ進むので、visitor が自分の位置を
 * 別の節に置き換えたとき(remark-sectionize)は、置き換えた節の次の兄弟へ進む
 */
export function visit<T extends Node, K extends string>(
	tree: T,
	type: K,
	visitor: (
		node: Extract<Child<T>, { type: K }>,
		index: number,
		parent: { children: Child<T>[] },
	) => typeof SKIP | undefined,
): void {
	const walk = (parent: Node) => {
		if (!parent.children) return;
		for (let i = 0; i < parent.children.length; i++) {
			const node = parent.children[i];
			if (
				node.type === type &&
				visitor(node as never, i, parent as never) === SKIP
			)
				continue;
			walk(node);
		}
	};
	walk(tree);
}
