---
title: "コードブロックの表示確認"
published: 2025-05-20
description: "Expressive Code で描画するコードブロック(タイトル・行番号・差分・折りたたみ・ターミナル)を並べた見た目の比較用の記事です。"
image: ""
tags: ["コード", "表示確認"]
category: "表示確認"
draft: false
---

インラインの `bun run build` と、いろいろなコードブロックを並べます。

## 言語とタイトル

```ts title="src/example.ts"
type User = { id: number; name: string };

export function greet(user: User): string {
	return `こんにちは、${user.name} さん`;
}
```

```css
:root {
	--primary: oklch(0.7 0.14 40);
}
```

```
言語の指定がないコードブロック
```

## ターミナル

```shell
bun install --frozen-lockfile
bun run build
```

```shellsession
$ echo hello
hello
```

## 差分と強調

```js {2} ins={3} del={4}
const a = 1;
const b = 2; // 強調した行
const c = 3; // 足した行
const d = 4; // 消した行
```

```diff
- const old = true;
+ const updated = true;
```

## 折りたたみと折り返し

```yaml collapse={3-8}
name: example
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: echo "折りたたまれる行"
```

```text
とても長い 1 行のテキストです。折り返しの設定(wrap: true)で画面の幅に収まるかを確かめるために、わざと長くしています。とても長い 1 行のテキストです。
```
