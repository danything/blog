// 記事(posts)と固定ページの本文(spec)を読むディレクトリ。
//
// 見た目の比較(.github/workflows/visual.yml)では VISUAL_FIXTURES=1 を付けてビルドし、
// 実際の記事の代わりに tests/fixtures/ の固定の記事を読む。記事の追加・編集・削除で
// 一覧・アーカイブ・サイドバーの件数などが変わって比較が落ちないようにするため。
// 普段のビルドでは src/content/ を読むので、tests/fixtures/ の記事が公開されることはない
// (VISUAL_FIXTURES=0 などの誤設定で切り替わらないよう、"1" のときだけにする)
export const VISUAL_FIXTURES: boolean = process.env.VISUAL_FIXTURES === "1";

export const CONTENT_DIR: string = VISUAL_FIXTURES
	? "tests/fixtures"
	: "src/content";
