// Speculation Rules の prerender(layouts/Layout.astro)で、ページは開かれる前に裏で描画されることがある。
// その間もスクリプトは動くので、副作用のある処理と、開かれるまでに古くなりうる表示はここで扱う

/** 開かれてから fn を呼ぶ(裏で描画しているなら開かれるまで待つ)。外部への読み込みなど副作用のある処理に使う */
export function whenActivated(fn: () => void): void {
	if (document.prerendering) {
		document.addEventListener("prerenderingchange", () => fn(), { once: true });
	} else {
		fn();
	}
}

/**
 * 裏で描画していたページが開かれたときに fn を呼ぶ。描画してから開かれるまでの間に、
 * 別のページでテーマや色相を変えていることがあるので、表示を合わせ直すのに使う
 */
export function onActivatedFromPrerender(fn: () => void): void {
	if (!document.prerendering) return;
	document.addEventListener("prerenderingchange", () => fn(), { once: true });
}
