// ビルドごとに 1 回だけ決まる値(モジュールの評価はビルド全体で 1 回)。
// 名前の変わらないファイルの URL に付けて、CDN の古いキャッシュを使わせないために使う
export const BUILD_ID = Date.now().toString(36);
