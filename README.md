# blog

[doany.io](https://doany.io) — [Fuwari](https://github.com/saicaca/fuwari) をベースにした Astro 製の静的ブログ。

## 開発

```shell
bun install
bun run dev
```

<http://localhost:4321>

Docker で起動する場合:

```shell
docker compose up
```

## ビルド

```shell
bun run build    # dist/ に出力（pagefind の検索インデックス生成まで実行）
bun run preview
```

## 記事の追加

```shell
bun run new-post <filename>
```

`src/content/posts/` に Markdown を置く。フロントマターは以下。

```yaml
---
title: タイトル
published: 2026-07-29
description: 概要
image: /static/images/blog/example.png # 省略可
tags: ["タグ1", "タグ2"]
category: "インフラ" # インフラ / Web開発 / 車 / 決済 / その他
draft: false
---
```

### 注意書きブロック

GitHub と同じ書き方。種類は `NOTE` / `TIP` / `IMPORTANT` / `WARNING` / `CAUTION`(大文字)。

```markdown
> [!NOTE]
> 補足の内容
>
> 段落を分けてもよい

> [!WARNING]
> 注意の内容
```

### GitHub リポジトリのカード

1 行まるごとこの形で書く。説明・スター数などは表示時に api.github.com から取ってくる。

```markdown
::github{repo="withastro/astro"}
```

どちらも Zenn へ同期するとき(`bun run zenn-sync`)に Zenn の記法(`:::message` / `@[card](...)`)へ変換される。

## アイコン

使っているアイコンだけを `src/icons.json` に持ち、`src/components/misc/Icon.astro`(Svelte からは `Icon.svelte`)で埋め込む。
新しいアイコンは名前(`material-symbols:search` など。https://icon-sets.iconify.design/ で探す)をコードや設定に書いてから、

```shell
bun run icons
```

を実行すると、src 内で使われている名前を集めて Iconify から取り込み直す。

## 見た目のテスト

PR では `main` との見た目の差を自動で確かめる(`.github/workflows/visual.yml`)。主要なページをデスクトップ(ライト / ダーク)とスマホで撮って比べ、差があると失敗して差分の画像が `playwright-report` に付く。手元でも同じことができる:

```shell
bun run build && (cd dist && python3 -m http.server 4321 &)
bunx playwright test --update-snapshots   # いまのビルドを基準にする
# 変更してビルドし直してから
bunx playwright test                      # 基準と比べる
```

## デプロイ

`main` への push で GitHub Actions がイメージをビルドし `ghcr.io` へ push、
`deploy/deployment.yaml` のタグを自動更新する。配信は Caddy（`Caddyfile`）。
