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
bun run build    # dist/ に出力（pagefind の検索インデックス生成と、配信用の .zst・.br・.gz の書き出しまで実行）
bun run preview
```

検索(Pagefind)の索引はビルドで作られるので、`bun run dev` では検索できない(検索欄にその旨が出る)。検索を試すときは `bun run build` のあと `bun run preview` で開く。

```shell
bun run lint       # Biome の検査と型チェック(astro check は .astro と scripts/・src/ などの .ts を調べる)
bun run lint:fix   # Biome で整形と直せるものを直す
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
category: "インフラ" # インフラ / Web開発 / 車 / 決済
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

1 行まるごとこの形で書く。説明・スター数などはビルド時に api.github.com から取ってきて HTML に埋め込む(CI と Docker のビルドでは回数制限を緩めるため `GITHUB_TOKEN` を渡す)。

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

## 英語版

`/en/` 以下に英語版を置いている(UI も英語)。記事は `src/content/posts-en/<日本語版と同じファイル名>.md`、About は `src/content/spec/about-en.md`。
ページは日本語版と英語版で 1 つのファイル(`src/pages/[...lang]/`。日本語版は言語の部分の無いパス、英語版は `/en/` 以下)で作る。
出力の形が違う 404(日本語版は `/404.html`、英語版は `/en/404/`)だけは `src/pages/404.astro` と `src/pages/en/404.astro` に分けている。
UI の文言(読み上げ用の `aria-label`・`alt` も)は `src/i18n/languages/` の `ja.ts`・`en.ts` に書く。
英訳のある記事は日本語版と `hreflang` で結ばれ、ナビゲーションバーのボタンで行き来できる(英訳が無ければもう一方の言語のトップへ)。
Zenn への同期とニュースレターは日本語版だけ。

英訳は Claude が作る(`.github/workflows/translate.yml`)。main の記事か About が変わると、未訳・原文が更新された・原文が消えた
ものだけを `.github/translate.md` の決まりで訳し直し(更新は差分だけ直す)、`translate/auto` ブランチの PR「英訳を更新」にする。
Actions の画面から手動でも実行できる。この PR は GITHUB_TOKEN で作るので PR のイベントではほかのワークフローが動かない。
代わりに translate.yml が PR を作った・更新したあとに Check・A11y Check・Visual Check・Docker(のビルドの確認)を
`workflow_dispatch` で `translate/auto` ブランチに対して実行する。workflow_dispatch の実行は PR の Checks に出ないので、
終わるのを待って結果をコミットのステータスとして PR の head に付ける(Claude Code Review は動かない)。
検査がすべて通ると translate.yml が PR を自動でマージし、デプロイ(`docker.yml` を main で)を起こす。
1 つでも落ちたら PR は開いたまま残るので、直してから手でマージする。

英訳のフロントマターの `sourceHash` は訳した時点の原文のハッシュで、原文と食い違っているものは次で分かる。

```shell
bun scripts/translate-status.ts                 # 未訳・更新が必要・削除するもの
bun scripts/translate-status.ts --check         # 同じものを出し、残っていれば終了コード 1
bun scripts/translate-status.ts --hash <原文>   # sourceHash に書く値
```

手で訳を直したときも `sourceHash` を合わせておく(合っていないと CI が訳し直す)。
記事を削除したときは英訳も CI が消す。`Caddyfile` の `@gone` は `/en/posts/...` にも効く。
見た目の比較用の固定の英訳は `tests/fixtures/posts-en/` と `tests/fixtures/spec/about-en.md`(一部の記事だけ訳してある)。

## アイコン

アイコンは Iconify のアイコンセットのパッケージ(`@iconify-json/lucide`・`@iconify-json/simple-icons`)からビルド時に取り、
`src/components/misc/Icon.astro` で SVG として埋め込む(`<Icon name="lucide:search" />`)。ページに入るのは使ったアイコンだけ。

- 画面の部品(検索・メニュー・矢印・日付など)は [Lucide](https://lucide.dev/)(`lucide:search` など)
- サービスのロゴ(GitHub・X・Threads・Bluesky・Ko-fi・Creative Commons など)は [Simple Icons](https://simpleicons.org/)(`simple-icons:github` など)。
  Lucide にはロゴが無い(以前あった GitHub などは非推奨で、新しい版では消えている)ので、ロゴはすべて Simple Icons に揃える

新しいアイコンは https://icon-sets.iconify.design/lucide/ か https://icon-sets.iconify.design/simple-icons/ で探し、名前を書くだけで使える
(取り込みの手順は無い。無い名前を書くとビルドが止まる)。読み込みは `src/utils/icons.ts`、セットの更新は Renovate が PR にする。

CSS の `mask-image` などで使うアイコン(注意書きの見出し・GitHub カード)は、CSS(`src/styles/` の CSS でも `.astro` の `<style>` でもよい)に
`var(--icon-lucide-info)` のように書くと、Vite のプラグイン(`src/styles/icons-plugin.ts`)が `:root` のデータ URL の変数を足す
(ビルドの始めに `src/` の CSS・`.astro` から使われているアイコンを集め、どのページでも読み込む `main.css` にまとめて 1 回だけ出す)。

## スタイル

CSS フレームワークは使わず、素の CSS(入れ子・変数・`@layer`)で書いている。

- コンポーネントの見た目は、それぞれの `.astro` の `<style>` に書く(Astro がそのコンポーネントの中だけに効くようにする)。
  親の `<style>` で子コンポーネントの外側の要素を調整するときは、子が `class` と残りの属性(`data-astro-cid-*`)を外側の要素に付ける(`ImageWrapper.astro` など)
- サイト全体のものは `src/styles/` に置き、`main.css`(`Layout.astro` で読み込む)から読む
  - `variables.css`: 色・文字の大きさ・ページの幅(`--page-width`)・`--transition` などの変数
  - `reset.css`: ブラウザの既定のスタイルの打ち消し
  - `base.css`: `html`・`body` など
  - `components.css`: いくつものコンポーネントで使う部品(`.card-base`・`.btn-plain`・`.btn-regular`・`.btn-card`・`.link`・`.float-panel` など)と、
    文字の大きさと行の高さの組(`.text-sm` など。`variables.css` の `--text-sm`・`--text-sm-lh`)
  - `typography.css`: 記事の本文の基本の組版(見出し・段落・リスト・表など)
  - `markdown.css`・`markdown-extend.css`: 記事の本文の調整と、注意書き・GitHub カード。Markdown から作られた本文には `.astro` の `<style>` が効かないので、ここに書く
  - `lightbox.css`(画像の拡大表示)・`transition.css`(読み込み時の動きとページ遷移)・`expressive-code.css`(コードブロック)・`scrollbar.css`
- 優先順位は `@layer` で決めている。弱い順に `reset` → `base` → `components` → `typography` で、層に入れていない規則
  (`variables.css`・`markdown.css` などと、各 `.astro` の `<style>`)は詳細度に関係なく層の中の規則に勝つ
- ダークモードは `<html class="dark">`。ライト・ダークで値が変わるものは、なるべく `variables.css` の変数(`--text-75`・`--fg-10`・
  `--tint-bg` など。`:root` と `:root.dark` で値を変える)を使う。変数にない色だけ、`.astro` の `<style>` では `:global(.dark) & { ... }`、
  `src/styles/` では `.dark & { ... }` と書く
- 画面の幅の区切りは `40rem`・`48rem`・`64rem`・`96rem`(`@media (width >= 48rem)` のように書く)

## 見た目のテスト

PR では `main` との見た目の差を自動で確かめる(`.github/workflows/visual.yml`)。比べるのは実際の記事ではなく、`tests/fixtures/` の固定の記事だけでビルドしたサイト(`VISUAL_FIXTURES=1 bun run build`)。記事の追加・編集・削除だけの PR では差が出ず、デザインやコードを変えたときだけ差が出る。このビルドでは GitHub カードも api.github.com に取りに行かず固定の値を使う。デスクトップ(ライト / ダーク)とスマホで撮って比べ、差があると失敗して差分の画像が `playwright-report` に付く。

新しい Markdown の書き方や部品を足したときは、`tests/fixtures/posts/` の記事にも足して比較の対象にする(撮るページは `tests/setup.ts` の `visualPages`)。アクセシビリティの検査(`.github/workflows/a11y.yml`)は引き続き実際の記事のビルドで行い、対象は `a11yPages`。

手元でも同じことができる:

```shell
VISUAL_FIXTURES=1 bun run build && scripts/serve.sh dist 4321
BASE_URL=http://127.0.0.1:4321 bunx playwright test tests/visual.spec.ts --update-snapshots   # いまのビルドを基準にする
# 変更してビルドし直してから
BASE_URL=http://127.0.0.1:4321 bunx playwright test tests/visual.spec.ts                      # 基準と比べる
```

通常のビルドと `VISUAL_FIXTURES=1` のビルドを同じ場所で切り替えるときは、Astro のコンテンツのキャッシュが使い回されて実際の記事が混ざることがあるので、先に `rm -rf .astro node_modules/.astro` で消す。

## デプロイ

`main` への push で GitHub Actions(`.github/workflows/docker.yml`)がイメージをビルドし `ghcr.io` へ push、
`deploy/deployment.yaml` のタグを自動更新する(PR ではビルドが通るかだけを確かめる)。配信は Caddy（`Caddyfile`）。
コンテナは root ではない uid 65532 で 8080 番で待ち、ルートは読み取り専用(書けるのは emptyDir の `/data` だけ)。

## 依存の更新

Renovate(`renovate.json`。共通の設定は [5ym/renovate](https://github.com/5ym/renovate))が PR にする。
パッケージは静的なサイトのビルドにしか使わないので、すべて `devDependencies` に置いている。

- Bun の版は `package.json` の `packageManager`(CI の setup-bun が読む)と `Dockerfile` の `oven/bun` の 2 か所にあり、同じ PR で上がる
- GitHub Actions はコミットのハッシュ、`Dockerfile` のイメージはダイジェストで固定し、Renovate が上げる
- `translate.yml` の Claude Code の版は、直前の行の `# renovate: datasource=npm depName=...` を Renovate が読んで上げる
- `deploy/` の Argo CD の Application(yosegaki の Helm チャート)も見る。チャートの更新は自動でマージせず、確かめてから手でマージする
