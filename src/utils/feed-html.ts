import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import { SKIP, visit } from "unist-util-visit";

// フィードに出さない要素(コードブロックや GitHub カードの script / style、link)
const DROP = new Set(["script", "style", "link"]);

/**
 * 記事ページと同じ描画結果(HTML)をフィードの本文にする。
 * 正規表現では </script > のような書き方や入れ子を取りこぼすので、HTML として読んで木の上で外す。
 * - script・style・link を外す
 * - 画像やリンクの "/..." はリーダーによって解決されないので絶対 URL にする
 * - 画像の srcset・sizes(縮めた版、utils/responsive-images.ts)を外し、src の元の画像を出させる
 */
export function toFeedHtml(html: string, site: URL): string {
  const tree = fromHtml(html, { fragment: true });
  visit(tree, "element", (node, index, parent) => {
    if (DROP.has(node.tagName) && parent && index !== undefined) {
      parent.children.splice(index, 1);
      return [SKIP, index];
    }
    if (node.tagName === "img") {
      delete node.properties.srcSet;
      delete node.properties.sizes;
    }
    for (const attr of ["src", "href"]) {
      const value = node.properties[attr];
      if (typeof value === "string" && /^\/[^/]/.test(value)) {
        node.properties[attr] = new URL(value, site).href;
      }
    }
  });
  return toHtml(tree);
}
