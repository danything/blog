/// <reference types="bun" />

import { describe, expect, test } from "bun:test";

import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";

import { toFeedHtml } from "./feed-html";

const site = new URL("https://b.doany.io/");

describe("toFeedHtml", () => {
  test("script・style・link を外す", () => {
    const html =
      '<p>a</p><script type="module">alert(1)</script><style>p{}</style><link rel="stylesheet" href="/x.css"><p>b</p>';
    expect(toFeedHtml(html, site)).toBe("<p>a</p><p>b</p>");
  });

  test("閉じタグの空白・大文字も外す", () => {
    const html =
      "<p>a</p><script>x</script ><SCRIPT>y</SCRIPT><style >z</style\n><p>b</p>";
    expect(toFeedHtml(html, site)).toBe("<p>a</p><p>b</p>");
  });

  test("外したあとに script が組み上がらない", () => {
    // 正規表現で 1 回だけ消すと <script>w</script> が残る書き方
    const html = "<scr<script>z</script>ipt>w</script><p>a</p>";
    const tags: string[] = [];
    visit(
      fromHtml(toFeedHtml(html, site), { fragment: true }),
      "element",
      (node) => {
        tags.push(node.tagName);
      },
    );
    expect(tags).not.toContain("script");
  });

  test("script の中の文字列は要素として読まない", () => {
    const html = '<script>document.write("<style>")</script><p>a</p>';
    expect(toFeedHtml(html, site)).toBe("<p>a</p>");
  });

  test("相対の src・href を絶対 URL にする", () => {
    const html =
      '<a href="/posts/x/">x</a><a href="//cdn.example/y">y</a><a href="https://example.com/">z</a>';
    expect(toFeedHtml(html, site)).toBe(
      '<a href="https://b.doany.io/posts/x/">x</a><a href="//cdn.example/y">y</a><a href="https://example.com/">z</a>',
    );
  });

  test("画像の srcset・sizes を外す", () => {
    const html =
      '<img src="/a.webp" srcset="/a-400.webp 400w, /a.webp 800w" sizes="100vw" alt="a">';
    expect(toFeedHtml(html, site)).toBe(
      '<img src="https://b.doany.io/a.webp" alt="a">',
    );
  });
});
