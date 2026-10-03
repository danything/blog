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
image: /static/images/blog/example.webp # 省略可
tags: ["タグ1", "タグ2"]
category: "インフラ" # インフラ / Web開発 / 車 / 決済 / その他
draft: false
---
```

### 画像

画像は `public/static/images/blog/` に置き、記事からは `/static/images/blog/xxx.png` のように参照する。書いたあとに

```shell
bun run images
```

を実行すると、記事から参照されている PNG / JPEG を WebP に変換して参照も書き換える(スクリーンショットはロスレス、写真は非可逆で軽く)。特定のファイルだけなら `bun run images public/static/images/blog/xxx.png`。

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

### 記事の削除

`src/content/posts/` から Markdown を消すだけでは足りない。あわせて次をする:

- [ ] `Caddyfile` の `@gone` の一覧にスラッグ(ファイル名から `.md` を除いたもの)を足し、404 ではなく 410 Gone を返す
- [ ] `tests/setup.ts` の `a11yPages` に入っていれば外す
- [ ] Zenn 側の記事を手で削除する。zenn ブランチからファイルが消えても Zenn は記事を消さない。
      Zenn のスラッグはフロントマターの `zennSlug`、なければ `scripts/zenn-sync.ts` の `toZennSlug` で決まる
      (12 文字以上ならそのまま(50 文字まで)、短ければハッシュを足したもの)。zenn ブランチの `articles/` にあるファイル名を見るのが早い
      (同期のあとならその履歴で、削除のコミットで消えたファイルを探す)

### リンク切れの確認

記事の外部リンクは週に一度 [lychee](https://github.com/lycheeverse/lychee) で調べている(`.github/workflows/links.yml`、設定は `lychee.toml`)。
切れたリンクがあると「リンク切れ」の Issue が作られ(開いていれば本文が更新され)、すべて通ると閉じられる。
Actions の画面から手動でも実行できる。ボットを弾くだけで実際には開けるサイトは `lychee.toml` の `exclude` に足す。手元では次で同じことができる(カレントディレクトリの `lychee.toml` を読む)。

```shell
lychee src/content/posts/*.md
```

## アイコン

使っているアイコンだけを `src/icons.json` に持ち、`src/components/misc/Icon.astro`(Svelte からは `Icon.svelte`)で埋め込む。
新しいアイコンは名前(`material-symbols:search` など。https://icon-sets.iconify.design/ で探す)をコードや設定に書いてから、

```shell
bun run icons
```

を実行すると、src 内で使われている名前を集めて Iconify から取り込み直す。

## 見た目のテスト

PR では `main` との見た目の差を自動で確かめる(`.github/workflows/visual.yml`)。比べるのは実際の記事ではなく、`tests/fixtures/` の固定の記事だけでビルドしたサイト(`VISUAL_FIXTURES=1 bun run build`)。記事の追加・編集・削除だけの PR では差が出ず、デザインやコードを変えたときだけ差が出る。このビルドでは GitHub カードも api.github.com に取りに行かず固定の値を使う。デスクトップ(ライト / ダーク)とスマホで撮って比べ、差があると失敗して差分の画像が `playwright-report` に付く。

新しい Markdown の書き方や部品を足したときは、`tests/fixtures/posts/` の記事にも足して比較の対象にする(撮るページは `tests/setup.ts` の `visualPages`)。アクセシビリティの検査(`.github/workflows/a11y.yml`)は引き続き実際の記事のビルドで行い、対象は `a11yPages`。

手元でも同じことができる:

```shell
VISUAL_FIXTURES=1 bun run build && (cd dist && python3 -m http.server 4321 &)
BASE_URL=http://127.0.0.1:4321 bunx playwright test tests/visual.spec.ts --update-snapshots   # いまのビルドを基準にする
# 変更してビルドし直してから
BASE_URL=http://127.0.0.1:4321 bunx playwright test tests/visual.spec.ts                      # 基準と比べる
```

## デプロイ

`main` への push で GitHub Actions がイメージをビルドし `ghcr.io` へ push、
`deploy/deployment.yaml` のタグを自動更新する。配信は Caddy（`Caddyfile`）。
